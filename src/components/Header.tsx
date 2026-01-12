import { ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

interface HeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  rightElement?: React.ReactNode;
}

export const Header = ({ title, subtitle, onBack, rightElement }: HeaderProps) => {
  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border safe-top">
      <div className="flex items-center gap-3 px-4 py-4">
        {onBack && (
          <button
            onClick={onBack}
            className={cn(
              'w-12 h-12 rounded-xl flex items-center justify-center',
              'bg-secondary text-foreground',
              'active:scale-95 transition-transform',
              'focus:outline-none focus:ring-2 focus:ring-primary'
            )}
          >
            <ArrowLeft className="w-6 h-6" strokeWidth={2.5} />
          </button>
        )}

        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-foreground truncate">{title}</h1>
          {subtitle && (
            <p className="text-sm text-muted-foreground truncate">{subtitle}</p>
          )}
        </div>

        {rightElement && <div className="flex-shrink-0">{rightElement}</div>}
      </div>
    </header>
  );
};
