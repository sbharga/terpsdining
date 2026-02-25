/**
 * Utilities for parsing UMD dining hours strings and computing live status.
 *
 * Hours are stored as strings like "7am-10am", "11am-2pm", "5pm-8pm", "Closed".
 */

/**
 * Parse a single time token (e.g. "7am", "10am", "2pm", "7:30pm")
 * into minutes from midnight.  Returns null on failure.
 */
function parseMinutes(str) {
  const match = str.trim().match(/^(\d{1,2})(?::(\d{2}))?(am|pm)$/i);
  if (!match) return null;

  let hour = parseInt(match[1], 10);
  const min  = match[2] ? parseInt(match[2], 10) : 0;
  const period = match[3].toLowerCase();

  if (period === 'pm' && hour !== 12) hour += 12;
  if (period === 'am' && hour === 12) hour = 0;

  return hour * 60 + min;
}

/**
 * Parse an hours-range string into { start, end } in minutes from midnight.
 * Returns null if the string is "Closed" or unparseable.
 */
function parseRange(str) {
  if (!str) return null;
  const clean = str.trim().replace(/\s*(et|est|edt)\s*$/i, '');
  if (clean.toLowerCase() === 'closed') return null;

  // Find the dash that separates start from end.
  // The dash is always between a time-end char (m) and a digit.
  const dash = clean.search(/(?<=[ap]m)-(?=\d)/i);
  if (dash === -1) return null;

  const start = parseMinutes(clean.slice(0, dash));
  const end   = parseMinutes(clean.slice(dash + 1));
  if (start === null || end === null) return null;

  return { start, end };
}

/** Format minutes-from-midnight as "7am", "12pm", "5:30pm", etc. */
function formatMinutes(mins) {
  const totalHour = Math.floor(mins / 60);
  const min       = mins % 60;
  const ampm      = totalHour >= 12 ? 'pm' : 'am';
  let   hour12    = totalHour % 12;
  if (hour12 === 0) hour12 = 12;

  return min
    ? `${hour12}:${String(min).padStart(2, '0')}${ampm}`
    : `${hour12}${ampm}`;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * @typedef {{ status: 'open' | 'closing_soon' | 'closed', label: string }} HallStatus
 */

/**
 * Given a row from the `hours` table, return the current live status.
 *
 * @param {{ breakfast: string, lunch: string, dinner: string }} hoursRow
 * @returns {HallStatus}
 */
export function getHallStatus(hoursRow) {
  const now     = new Date();
  const nowMins = now.getHours() * 60 + now.getMinutes();

  const periods = [
    { name: 'Breakfast', value: hoursRow?.breakfast },
    { name: 'Lunch',     value: hoursRow?.lunch },
    { name: 'Dinner',    value: hoursRow?.dinner },
  ];

  // Check if we're currently inside any period
  for (const { name, value } of periods) {
    const range = parseRange(value);
    if (!range) continue;

    if (nowMins >= range.start && nowMins < range.end) {
      const minsLeft = range.end - nowMins;

      if (minsLeft <= 30) {
        return {
          status: 'closing_soon',
          label:  `Closing in ${minsLeft}m`,
        };
      }

      return { status: 'open', label: 'Open Now' };
    }
  }

  // Not open — find the next upcoming period to show "Opens X at Y"
  for (const { name, value } of periods) {
    const range = parseRange(value);
    if (!range) continue;

    if (nowMins < range.start) {
      return {
        status: 'closed',
        label:  `Opens ${name} at ${formatMinutes(range.start)}`,
      };
    }
  }

  return { status: 'closed', label: 'Closed Today' };
}
