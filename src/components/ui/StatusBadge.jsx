import { getHallStatus } from '../../utils/hours';

const STYLES = {
  open: { badge: 'bg-green-100 text-green-700', dot: 'bg-green-500 animate-pulse' },
  closing_soon: { badge: 'bg-amber-100 text-amber-700', dot: 'bg-amber-500' },
  closed: { badge: 'bg-gray-100  text-gray-500', dot: 'bg-gray-400' },
};

export default function StatusBadge({ hoursRow }) {
  const { status, label } = getHallStatus(hoursRow);
  const { badge, dot } = STYLES[status];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${badge}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dot}`} />
      {label}
    </span>
  );
}
