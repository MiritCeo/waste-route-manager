import { cn } from '@/lib/utils';

interface ProgressBarProps {
  current: number;
  total: number;
  className?: string;
}

export const ProgressBar = ({ current, total, className }: ProgressBarProps) => {
  const percentage = total > 0 ? (current / total) * 100 : 0;

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex justify-between items-center text-sm font-medium">
        <span className="text-muted-foreground">Postęp trasy</span>
        <span className="text-foreground">
          <span className="text-primary font-bold">{current}</span>
          <span className="text-muted-foreground"> / {total}</span>
        </span>
      </div>
      <div className="progress-track">
        <div
          className="progress-fill"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};
