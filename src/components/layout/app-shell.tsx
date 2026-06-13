import { cn } from "@/lib/utils";

export function AppShell({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "pp-gradient-bg mx-auto min-h-dvh max-w-lg bg-background pb-32",
        className
      )}
    >
      {children}
    </div>
  );
}

export function PageContainer({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-6 px-5 pt-5", className)}>{children}</div>
  );
}

export function PageHeader({
  eyebrow,
  title,
  subtitle,
  className,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  className?: string;
}) {
  return (
    <header className={cn("space-y-1", className)}>
      {eyebrow && (
        <p className="pp-label-caps text-muted-foreground capitalize">{eyebrow}</p>
      )}
      <h1 className="text-[1.75rem] font-semibold tracking-[0.02em] text-foreground">
        {title}
      </h1>
      {subtitle && (
        <p className="text-sm leading-relaxed text-muted-foreground">{subtitle}</p>
      )}
    </header>
  );
}
