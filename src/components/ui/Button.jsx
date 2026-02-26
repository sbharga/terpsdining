const VARIANT_CLASSES = {
  primary: 'bg-primary text-white hover:bg-primary-dark shadow-sm active:scale-95 disabled:opacity-50',
  outline: 'border border-gray-200 bg-white text-gray-700 hover:border-gray-400',
  ghost:   'text-gray-500 hover:text-gray-800',
};
const SIZE_CLASSES = {
  sm: 'text-xs px-3 py-1',
  md: 'text-sm px-5 py-2',
  lg: 'text-base px-6 py-3',
};
export default function Button({ variant = 'primary', size = 'md', loading = false, className = '', children, disabled, ...props }) {
  return (
    <button
      disabled={disabled || loading}
      className={['rounded-lg font-medium transition-colors', VARIANT_CLASSES[variant], SIZE_CLASSES[size], className].filter(Boolean).join(' ')}
      {...props}
    >
      {loading ? (
        <span className="inline-flex items-center gap-2">
          <span className="w-3.5 h-3.5 rounded-full border-2 border-current border-t-transparent animate-spin" />
          {children}
        </span>
      ) : children}
    </button>
  );
}
