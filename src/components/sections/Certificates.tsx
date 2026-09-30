import { buildConstellationPath, certificates } from "@/data/certificates";
import { SectionHeading } from "@/components/ui/SectionHeading";

function ConstellationMark({
  certificate,
}: {
  certificate: (typeof certificates)[number];
}) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 100 100"
      className="h-12 w-12 shrink-0 sm:h-14 sm:w-14"
    >
      <path
        d={buildConstellationPath(certificate)}
        className="fill-none stroke-indigo"
        strokeWidth="1"
        vectorEffect="non-scaling-stroke"
      />
      {certificate.constellation.stars.map(([x, y], index) => (
        <circle
          key={`${x}-${y}-${index}`}
          cx={x}
          cy={y}
          r={index % 3 === 0 ? 2.1 : 1.35}
          className={index % 3 === 0 ? "fill-gold" : "fill-starlight/70"}
        />
      ))}
    </svg>
  );
}

export function Certificates() {
  return (
    <section
      id="s-certificates"
      aria-label="Certificates"
      className="relative min-h-screen px-6 py-28 sm:px-16 lg:px-24"
    >
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          index="05"
          label="Certificates"
          descriptor="Credentials archive"
        />
        <div className="mt-8 grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:gap-20">
          <div>
            <h2 className="max-w-lg font-display text-4xl font-medium leading-tight tracking-tight text-starlight sm:text-6xl">
              Learning, recorded.
            </h2>
            <p className="mt-6 max-w-md text-base leading-relaxed text-starlight/70 sm:text-lg">
              Courses and credentials collected across software, data, cloud,
              and artificial intelligence.
            </p>
            <p className="mt-8 font-mono text-[10px] uppercase tracking-[0.3em] text-gold">
              {String(certificates.length).padStart(2, "0")} credential records
            </p>
          </div>

          {certificates.length > 0 ? (
            <div className="border-y border-indigo/40">
              {certificates.map((certificate) => (
                <details
                  key={certificate.no}
                  className="group border-b border-indigo/30 last:border-b-0"
                >
                  <summary className="flex cursor-pointer list-none items-center gap-4 py-5 marker:hidden focus-visible:text-accent sm:gap-6 sm:py-6 [&::-webkit-details-marker]:hidden">
                    <ConstellationMark certificate={certificate} />
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-baseline justify-between gap-x-5 gap-y-1">
                        <span className="font-display text-lg font-medium leading-snug tracking-tight text-starlight sm:text-xl">
                          {certificate.title}
                        </span>
                        <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-gold">
                          REC-{String(certificate.no).padStart(2, "0")}
                        </span>
                      </span>
                      <span className="mt-2 flex flex-wrap gap-x-3 gap-y-1 font-mono text-[9px] uppercase tracking-[0.18em] text-starlight/60 sm:text-[10px]">
                        <span>{certificate.provider}</span>
                        <span aria-hidden="true">/</span>
                        <span>
                          {certificate.from} — {certificate.to ?? "Expiry not listed"}
                        </span>
                      </span>
                    </span>
                    <svg
                      aria-hidden="true"
                      viewBox="0 0 16 16"
                      className="h-4 w-4 shrink-0 text-accent transition-transform duration-200 group-open:rotate-45"
                    >
                      <path
                        d="M8 2.5v11M2.5 8h11"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1"
                      />
                    </svg>
                  </summary>
                  <div className="pb-6 pl-16 sm:pl-20">
                    <p className="font-mono text-[9px] uppercase tracking-[0.25em] text-starlight/55">
                      Skills covered · {certificate.skills.length}
                    </p>
                    <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-2">
                      {certificate.skills.map((skill) => (
                        <li
                          key={skill}
                          className="font-mono text-[10px] leading-relaxed text-starlight/75"
                        >
                          {skill}
                        </li>
                      ))}
                    </ul>
                  </div>
                </details>
              ))}
            </div>
          ) : (
            <p className="border-y border-indigo/40 py-10 font-mono text-xs uppercase tracking-[0.2em] text-starlight/65">
              No certificate records have been added yet.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
