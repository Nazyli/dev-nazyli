import { CertificateArchive } from "@/components/sections/CertificateArchive";
import { certificates } from "@/data/certificates";
import { SectionHeading } from "@/components/ui/SectionHeading";

export function Certificates() {
  return (
    <section
      id="s-certificates"
      aria-label="Certificates"
      className="relative min-h-screen min-h-svh px-6 py-28 sm:px-16 lg:pl-24 lg:pr-48"
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
            <CertificateArchive certificates={certificates} />
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
