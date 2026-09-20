import { classNames } from "@/lib/format";

export function Field({
  label,
  required,
  optional,
  count,
  children,
}: {
  label: string;
  required?: boolean;
  optional?: boolean;
  count?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-1 gap-2 border-b border-slate-100 py-3 sm:grid-cols-[148px_1fr] sm:items-start">
      <div className="pt-1.5 text-[13px] text-ink-soft">
        {label}
        {required && <span className="req">必須</span>}
        {optional && <span className="opt">任意</span>}
      </div>
      <div>
        {children}
        {count && <p className="mt-1 text-right text-[11px] text-muted">{count}</p>}
      </div>
    </div>
  );
}

export function Panel({
  icon,
  title,
  action,
  children,
}: {
  icon?: React.ReactNode;
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="card">
      <div className="flex items-center justify-between border-b border-line px-4 py-2.5">
        <h2 className="flex items-center gap-2 text-[13px] font-semibold">
          {icon}
          {title}
        </h2>
        {action}
      </div>
      <div className="px-4 py-3">{children}</div>
    </section>
  );
}

export function Stepper({
  steps,
  current,
  onSelect,
}: {
  steps: string[];
  current: number;
  onSelect?: (i: number) => void;
}) {
  return (
    <ol className="flex flex-wrap items-center gap-y-2 border-b border-line bg-white px-2 py-3 sm:px-6">
      {steps.map((label, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <li key={label} className="flex items-center">
            <button
              type="button"
              onClick={() => onSelect?.(i)}
              className={classNames(
                "flex items-center gap-2 px-1 text-[12px] sm:px-2",
                active ? "font-semibold text-brand" : done ? "text-brand" : "text-muted",
              )}
            >
              <span
                className={classNames(
                  "grid h-6 w-6 place-items-center rounded-full text-[11px]",
                  active || done ? "bg-brand text-white" : "bg-slate-200 text-slate-600",
                )}
              >
                {i + 1}
              </span>
              {label}
            </button>
            {i < steps.length - 1 && (
              <span className="mx-1 hidden h-px w-8 bg-slate-200 sm:block md:w-12" />
            )}
          </li>
        );
      })}
    </ol>
  );
}

export function Tabs({
  items,
  current,
  onSelect,
}: {
  items: string[];
  current: number;
  onSelect: (i: number) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1 border-b border-line bg-white px-2 sm:px-4">
      {items.map((label, i) => (
        <button
          key={label}
          type="button"
          onClick={() => onSelect(i)}
          className={classNames(
            "-mb-px border-b-2 px-3 py-2.5 text-[13px]",
            i === current
              ? "border-brand font-medium text-brand"
              : "border-transparent text-ink-soft hover:text-ink",
          )}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
