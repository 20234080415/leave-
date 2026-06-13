type PageHeaderProps = {
  eyebrow: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
};

export function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: PageHeaderProps) {
  return (
    <header className="mb-7">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-xs tracking-[0.2em] text-rose-deep">{eyebrow}</p>
          <h1 className="mt-3 text-[28px] font-medium leading-tight tracking-[-0.03em] text-ink">
            {title}
          </h1>
          {description ? (
            <p className="mt-2 text-sm leading-6 text-ink-muted">{description}</p>
          ) : null}
        </div>
        {action}
      </div>
    </header>
  );
}
