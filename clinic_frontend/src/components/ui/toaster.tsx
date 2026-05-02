import { useToast } from "@/hooks/use-toast";
import { Toast, ToastClose, ToastDescription, ToastProvider, ToastTitle, ToastViewport } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

export function Toaster() {
  const { toasts } = useToast();

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, ...props }) {
        // Automatically apply success styling if title implies success
        const isSuccess = !props.variant && typeof title === 'string' && (title.toLowerCase().includes('success') || title.toLowerCase().includes('updated'));
        
        return (
          <Toast key={id} {...props} variant={(isSuccess || props.variant === 'success') ? 'success' as any : props.variant} className={cn(
            props.className
          )}>
            <div className="grid gap-0.5 w-full pl-1">
              {title && <ToastTitle className={cn((isSuccess || props.variant === 'success') && "text-slate-800 dark:text-slate-200 text-[14px] font-semibold")}>{title}</ToastTitle>}
              {description && (
                <ToastDescription className={cn((isSuccess || props.variant === 'success') ? "text-slate-500 dark:text-slate-400 text-[13px]" : "")}>
                  {description}
                </ToastDescription>
              )}
            </div>
            {action}
            <ToastClose className={cn((isSuccess || props.variant === 'success') && "text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 absolute right-3 top-3")} />
          </Toast>
        );
      })}
      <ToastViewport />
    </ToastProvider>
  );
}
