export function todayISO() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York' }).format(new Date());
}

export function getCurrentMealPeriod() {
  const hour = parseInt(
    new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', hourCycle: 'h23', hour: 'numeric' }).format(new Date()), 10
  );
  if (hour < 5) return 'Dinner';    // late night — sync hasn't run yet, show last completed meal
  if (hour < 10) return 'Breakfast';
  if (hour < 15) return 'Lunch';
  return 'Dinner';
}

export function formatDateLabel(dateStr) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function formatFullDate(dateStr) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
}
