import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoaderProps {
  size?: 'sm' | 'md' | 'lg';
  fullScreen?: boolean;
  text?: string;
}

const sizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-8 w-8',
  lg: 'h-12 w-12',
};

export const Loader = ({ size = 'md', fullScreen = false, text }: LoaderProps) => {
  const content = (
    <div className="flex flex-col items-center justify-center gap-3">
      <div className="relative">
        <div className="absolute inset-0 rounded-full bg-primary/20 blur-xl" />
        <div className="relative">
          <Loader2 className={cn('animate-spin text-primary relative z-10', sizeClasses[size])} />
          {/* Outer Ring Effect */}
          <div className={cn('absolute inset-0 rounded-full border-2 border-primary/30 border-t-primary animate-spin-reverse', sizeClasses[size])} style={{ animationDuration: '3s', margin: '-4px', width: 'calc(100% + 8px)', height: 'calc(100% + 8px)' }} />
          {/* Inner Dot */}
        </div>
      </div>
      {text && <p className="text-sm text-muted-foreground animate-pulse">{text}</p>}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
        {content}
      </div>
    );
  }

  return content;
};

export const ButtonLoader = ({ className }: { className?: string }) => (
  <Loader2 className={cn("h-4 w-4 animate-spin", className)} />
);

type PageLoaderVariant = 'content' | 'screen' | 'inline';

interface PageLoaderProps {
  variant?: PageLoaderVariant;
  text?: string;
  className?: string;
}

const pageLoaderVariantClasses: Record<PageLoaderVariant, string> = {
  content: 'grid h-full min-h-[calc(100dvh-8rem)] w-full place-items-center',
  screen: 'flex min-h-screen w-full items-center justify-center bg-background',
  inline: 'grid min-h-[16rem] w-full place-items-center',
};

export const PageLoader = ({ variant = 'content', text = 'Loading...', className }: PageLoaderProps) => (
  <div className={cn(pageLoaderVariantClasses[variant], className)}>
    <Loader size="lg" text={text} />
  </div>
);
