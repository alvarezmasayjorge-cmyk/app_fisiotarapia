import { HTMLAttributes, ReactNode } from 'react';
import { AlertTriangle, CheckCircle, Info, XCircle } from 'lucide-react';

type Variant = 'info' | 'success' | 'warning' | 'error';

type Props = HTMLAttributes<HTMLDivElement> & {
  variant?: Variant;
  title?: string;
  children: ReactNode;
};

const config: Record<Variant, { bg: string; border: string; text: string; icon: typeof Info }> = {
  info: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-800', icon: Info },
  success: { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-800', icon: CheckCircle },
  warning: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-800', icon: AlertTriangle },
  error: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-800', icon: XCircle },
};

export function Alert({ variant = 'info', title, children, className = '', ...props }: Props) {
  const { bg, border, text, icon: Icon } = config[variant];

  return (
    <div
      role="alert"
      className={`flex gap-3 p-3 rounded-lg border ${bg} ${border} ${text} ${className}`}
      {...props}
    >
      <Icon className="w-5 h-5 shrink-0 mt-0.5" />
      <div className="flex-1 text-sm">
        {title && <p className="font-medium mb-0.5">{title}</p>}
        <div>{children}</div>
      </div>
    </div>
  );
}
