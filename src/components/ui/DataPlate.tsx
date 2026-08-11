import type { ReactNode } from "react";

type DataPlateProps = {
  title: string;
  children: React.ReactNode;
  className?: string;
};

type DataRowProps = {
  k: string;
  v: ReactNode;
};

export function DataPlate({ title, children, className }: DataPlateProps) {
  return (
    <div className={`border border-starlight/25 bg-abyss/60 ${className ?? ""}`}>
      <div className="flex items-center gap-3 border-b border-starlight/15 bg-indigo/20 px-4 py-2">
        <p className="whitespace-nowrap font-mono text-[10px] uppercase tracking-[0.3em] text-starlight/80">
          {title}
        </p>
        <span aria-hidden className="h-px flex-1 bg-starlight/20" />
      </div>
      <dl className="divide-y divide-indigo/30">{children}</dl>
    </div>
  );
}

export function DataRow({ k, v }: DataRowProps) {
  return (
    <div className="grid grid-cols-[max-content_1fr] items-baseline gap-x-6 gap-y-1 px-4 py-2.5">
      <dt className="font-mono text-[10px] uppercase tracking-[0.25em] text-starlight/60">
        {k}
      </dt>
      <dd className="text-right font-mono text-[11px] leading-relaxed tracking-[0.06em] text-starlight/85">
        {v}
      </dd>
    </div>
  );
}
