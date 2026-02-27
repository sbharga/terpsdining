
function parseMinutes(str) {
  const match = str.trim().match(/^(\d{1,2})(?::(\d{2}))?(am|pm)$/i);
  if (!match) return null;

  let hour = parseInt(match[1], 10);
  const min = match[2] ? parseInt(match[2], 10) : 0;
  const period = match[3].toLowerCase();

  if (period === 'pm' && hour !== 12) hour += 12;
  if (period === 'am' && hour === 12) hour = 0;

  return hour * 60 + min;
}

function parseRange(str) {
  if (!str) return null;
  const clean = str.trim().replace(/\s*(et|est|edt)\s*$/i, '');
  if (clean.toLowerCase() === 'closed') return null;

  const dash = clean.search(/(?<=[ap]m)-(?=\d)/i);
  if (dash === -1) return null;

  const start = parseMinutes(clean.slice(0, dash));
  const end = parseMinutes(clean.slice(dash + 1));
  if (start === null || end === null) return null;

  return { start, end };
}

function formatMinutes(mins) {
  const totalHour = Math.floor(mins / 60);
  const min = mins % 60;
  const ampm = totalHour >= 12 ? 'pm' : 'am';
  let hour12 = totalHour % 12;
  if (hour12 === 0) hour12 = 12;

  return min
    ? `${hour12}:${String(min).padStart(2, '0')}${ampm}`
    : `${hour12}${ampm}`;
}



export function getHallStatus(hoursRow) {
  const etDate = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/New_York' }));
  const nowMins = etDate.getHours() * 60 + etDate.getMinutes();

  const periods = [
    { name: 'Breakfast', value: hoursRow?.breakfast },
    { name: 'Lunch', value: hoursRow?.lunch },
    { name: 'Dinner', value: hoursRow?.dinner },
  ];

  for (const { name, value } of periods) {
    const range = parseRange(value);
    if (!range) continue;

    if (nowMins >= range.start && nowMins < range.end) {
      const minsLeft = range.end - nowMins;

      if (minsLeft <= 30) {
        return {
          status: 'closing_soon',
          label: `Closing in ${minsLeft}m`,
        };
      }

      return { status: 'open', label: 'Open Now' };
    }
  }

  for (const { name, value } of periods) {
    const range = parseRange(value);
    if (!range) continue;

    if (nowMins < range.start) {
      return {
        status: 'closed',
        label: `Opens at ${formatMinutes(range.start)}`,
      };
    }
  }

  for (const { name, value } of periods) {
    const range = parseRange(value);
    if (!range) continue;
    return {
      status: 'closed',
      label: `Opens ${formatMinutes(range.start)} tomorrow`,
    };
  }

  return { status: 'closed', label: 'Closed Today' };
}
