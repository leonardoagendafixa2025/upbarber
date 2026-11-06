import * as React from 'react';
import { cn } from '@/lib/utils/cn';

// ---------- Label ----------
export const Label = React.forwardRef<HTMLLabelElement, React.LabelHTMLAttributes<HTMLLabelElement>>(({ className, ...props }, ref) => (
  <label ref={ref} className={cn('text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70', className)} {...props} />
));
Label.displayName = 'Label';

// ---------- Textarea ----------
export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn('flex min-h-[80px] w-full rounded-lg border border-white/10 bg-[#0d0d12] px-3 py-2 text-sm text-white shadow-sm placeholder:text-zinc-500 focus-visible:outline-none focus-visible:border-amber-500/50 focus-visible:ring-2 focus-visible:ring-amber-500/20 hover:border-white/20 disabled:cursor-not-allowed disabled:opacity-50', className)}
    {...props}
  />
));
Textarea.displayName = 'Textarea';

// ---------- Select (nativo, estilizado) ----------
export const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(({ className, children, ...props }, ref) => (
  <select
    ref={ref}
    className={cn('flex h-9 w-full rounded-lg border border-white/10 bg-[#0d0d12] px-3 py-1 text-sm text-white shadow-sm focus-visible:outline-none focus-visible:border-amber-500/50 focus-visible:ring-2 focus-visible:ring-amber-500/20 hover:border-white/20 disabled:cursor-not-allowed disabled:opacity-50', className)}
    {...props}
  >
    {children}
  </select>
));
Select.displayName = 'Select';

// ---------- Card ----------
export const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('rounded-2xl border border-white/10 bg-card text-card-foreground shadow-sm transition-all duration-200', className)} {...props} />
));
Card.displayName = 'Card';
export const CardHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => <div className={cn('flex flex-col space-y-1.5 p-6 pb-3', className)} {...props} />;
export const CardTitle = ({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => <h3 className={cn('font-semibold tracking-tight text-white leading-none', className)} {...props} />;
export const CardDescription = ({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) => <p className={cn('text-sm text-muted-foreground', className)} {...props} />;
export const CardContent = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => <div className={cn('p-6 pt-0', className)} {...props} />;
export const CardFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => <div className={cn('flex items-center p-6 pt-0', className)} {...props} />;

// ---------- Badge ----------
export function Badge({ className, variant = 'default', ...props }: React.HTMLAttributes<HTMLSpanElement> & { variant?: 'default' | 'secondary' | 'outline' | 'destructive' | 'success' | 'warning' }) {
  const styles = {
    default: 'bg-primary text-black font-semibold border-transparent shadow-sm',
    secondary: 'bg-secondary text-secondary-foreground border-white/10',
    outline: 'text-foreground border-white/15',
    destructive: 'bg-red-500/15 text-red-400 border-red-500/30',
    success: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    warning: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  };
  return <span className={cn('inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap', styles[variant], className)} {...props} />;
}

// ---------- Table ----------
export const Table = ({ className, ...props }: React.TableHTMLAttributes<HTMLTableElement>) => (
  <div className="relative w-full overflow-auto scrollbar-thin">
    <table className={cn('w-full caption-bottom text-sm', className)} {...props} />
  </div>
);
export const THead = ({ className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) => <thead className={cn('[&_tr]:border-b border-white/10', className)} {...props} />;
export const TBody = ({ className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) => <tbody className={cn('[&_tr:last-child]:border-0', className)} {...props} />;
export const TR = ({ className, ...props }: React.HTMLAttributes<HTMLTableRowElement>) => <tr className={cn('border-b border-white/10 transition-colors hover:bg-white/[0.04] data-[state=selected]:bg-muted', className)} {...props} />;
export const TH = ({ className, ...props }: React.ThHTMLAttributes<HTMLTableCellElement>) => <th className={cn('h-11 px-4 text-left align-middle text-xs font-semibold uppercase tracking-wider text-muted-foreground', className)} {...props} />;
export const TD = ({ className, ...props }: React.TdHTMLAttributes<HTMLTableCellElement>) => <td className={cn('p-4 align-middle text-zinc-200', className)} {...props} />;

// ---------- Skeleton ----------
export const Skeleton = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => <div className={cn('animate-pulse rounded-2xl bg-white/5', className)} {...props} />;

// ---------- Spinner ----------
export const Spinner = ({ className }: { className?: string }) => (
  <svg className={cn('h-5 w-5 animate-spin text-amber-400', className)} viewBox="0 0 24 24" fill="none">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
  </svg>
);

export const PageLoader = ({ label = 'Carregando...' }: { label?: string }) => (
  <div className="flex h-64 flex-col items-center justify-center gap-3 text-sm text-muted-foreground">
    <Spinner className="h-6 w-6" />
    {label}
  </div>
);

// ---------- Empty state ----------
export function EmptyState({ icon: Icon, title, description, action, className }: { icon?: React.ComponentType<{ className?: string }>; title: string; description?: string; action?: React.ReactNode; className?: string }) {
  return (
    <div className={cn('flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 p-10 text-center', className)}>
      {Icon && (
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-400">
          <Icon className="h-6 w-6" />
        </div>
      )}
      <h3 className="font-semibold text-white">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

// ---------- Page header ----------
export function PageHeader({ title, description, actions, className }: { title: React.ReactNode; description?: React.ReactNode; actions?: React.ReactNode; className?: string }) {
  return (
    <div className={cn('mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between', className)}>
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

// ---------- Stat card ----------
export function StatCard({ label, value, hint, icon: Icon, trend, className }: { label: string; value: React.ReactNode; hint?: React.ReactNode; icon?: React.ComponentType<{ className?: string }>; trend?: number | null; className?: string }) {
  return (
    <Card className={cn('relative overflow-hidden p-5 transition-all duration-200 hover:border-amber-500/40 hover:shadow-lg hover:shadow-amber-500/5 group', className)}>
      <div className="flex items-start justify-between">
        <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</div>
        {Icon && (
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 group-hover:bg-amber-500/20 group-hover:scale-105 transition-all">
            <Icon className="h-4.5 w-4.5" />
          </div>
        )}
      </div>
      <div className="mt-2 text-2xl font-bold tracking-tight text-white">{value}</div>
      {(hint || trend !== undefined) && (
        <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
          {trend !== undefined && trend !== null && (
            <span className={cn('inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[11px] font-semibold', trend >= 0 ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' : 'bg-red-500/15 text-red-400 border border-red-500/30')}>
              {trend >= 0 ? '▲' : '▼'} {Math.abs(trend).toFixed(1)}%
            </span>
          )}
          {hint}
        </div>
      )}
    </Card>
  );
}

// ---------- Avatar ----------
export function Avatar({ src, name, size = 'md', color, className }: { src?: string | null; name?: string | null; size?: 'sm' | 'md' | 'lg' | 'xl'; color?: string; className?: string }) {
  const sizes = { sm: 'h-7 w-7 text-[10px]', md: 'h-9 w-9 text-xs', lg: 'h-12 w-12 text-sm', xl: 'h-20 w-20 text-xl' };
  const initials = (name || '?').split(' ').filter(Boolean).slice(0, 2).map((s) => s[0]?.toUpperCase()).join('');
  return src ? (
    <img src={src} alt={name ?? ''} className={cn('rounded-full object-cover ring-1 ring-white/10', sizes[size], className)} />
  ) : (
    <div className={cn('flex items-center justify-center rounded-full font-semibold text-white ring-1 ring-white/10', sizes[size], className)} style={{ backgroundColor: color ?? '#27272a' }}>
      {initials}
    </div>
  );
}

// ---------- Form field ----------
export function Field({ label, error, hint, required, children, className }: { label?: React.ReactNode; error?: string; hint?: React.ReactNode; required?: boolean; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('space-y-1.5', className)}>
      {label && (
        <Label>
          {label} {required && <span className="text-red-500">*</span>}
        </Label>
      )}
      {children}
      {error ? <p className="text-xs text-red-600">{error}</p> : hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

// ---------- Pagination ----------
export function Pagination({ page, pages, onChange, total, className }: { page: number; pages: number; total?: number; onChange: (p: number) => void; className?: string }) {
  if (pages <= 1 && !total) return null;
  return (
    <div className={cn('flex items-center justify-between gap-3 text-sm text-muted-foreground', className)}>
      <span>{total !== undefined ? `${total} registro(s)` : ''}</span>
      {pages > 1 && (
        <div className="flex items-center gap-1">
          <button className="rounded-md border px-2 py-1 disabled:opacity-40" disabled={page <= 1} onClick={() => onChange(page - 1)}>
            ‹
          </button>
          <span className="px-2">
            {page} / {pages}
          </span>
          <button className="rounded-md border px-2 py-1 disabled:opacity-40" disabled={page >= pages} onClick={() => onChange(page + 1)}>
            ›
          </button>
        </div>
      )}
    </div>
  );
}

// ---------- Section ----------
export function Section({ title, description, children, actions, className }: { title: React.ReactNode; description?: React.ReactNode; actions?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <Card className={className}>
      <CardHeader className="flex-row items-start justify-between space-y-0">
        <div>
          <CardTitle>{title}</CardTitle>
          {description && <CardDescription className="mt-1">{description}</CardDescription>}
        </div>
        {actions}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}
