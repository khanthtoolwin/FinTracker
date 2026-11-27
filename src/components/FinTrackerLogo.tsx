interface FinTrackerLogoProps {
  size?: 'sm' | 'md' | 'lg';
  wordmarkClassName?: string;
}

const SIZE_MAP = {
  sm: 'text-xl',
  md: 'text-2xl',
  lg: 'text-[28px]',
} as const;

export function FinTrackerLogo({
  size = 'md',
  wordmarkClassName = '',
}: FinTrackerLogoProps) {
  return (
    <span
      className={`inline-flex items-baseline font-display tracking-[-0.03em] leading-none whitespace-nowrap shrink-0 select-none ${SIZE_MAP[size]} ${wordmarkClassName}`}
    >
      <span className="relative font-bold text-[#F1F5F9]">
        Fin
        <span
          aria-hidden="true"
          className="absolute left-0 right-0.5 -bottom-1 h-[2px] rounded-full bg-[#34D399]"
        />
      </span>
      <span className="font-medium text-[#34D399]">Tracker</span>
    </span>
  );
}
