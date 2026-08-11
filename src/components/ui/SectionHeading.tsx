type SectionHeadingProps = {
  index: string;
  label: string;
  descriptor?: string;
  className?: string;
  align?: "left" | "center";
};

export function SectionHeading({
  index,
  label,
  descriptor,
  className,
  align = "left",
}: SectionHeadingProps) {
  return (
    <div
      className={`flex items-baseline gap-4 ${
        align === "center" ? "justify-center" : ""
      } ${className ?? ""}`}
    >
      <p className="whitespace-nowrap font-mono text-xs uppercase tracking-[0.35em] text-gold">
        {index} · {label}
      </p>
      {descriptor && (
        <span className="hidden font-mono text-[10px] uppercase tracking-[0.3em] text-starlight/70 sm:inline">
          {descriptor}
        </span>
      )}
      <span aria-hidden className="h-px min-w-10 max-w-28 flex-1 bg-indigo/40" />
    </div>
  );
}
