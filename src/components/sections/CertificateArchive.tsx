"use client";

import { useEffect, useState } from "react";
import {
  buildConstellationPath,
  getCertificateMonthDateTime,
  getCertificateStatus,
} from "@/data/certificates";
import type { Certificate } from "@/data/certificates";
import { getCertificateIndexFromHash } from "@/lib/certificateNavigation";

const VALIDITY_FILTERS = [
  { value: "all", label: "All statuses" },
  { value: "current", label: "Current" },
  { value: "expired", label: "Expired" },
  { value: "no-expiry", label: "No expiry listed" },
] as const;

type ValidityFilter = (typeof VALIDITY_FILTERS)[number]["value"];

function ConstellationMark({ certificate }: { certificate: Certificate }) {
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

function CertificateMonth({ value }: { value: string | null }) {
  if (!value) return "Expiry not listed";

  const dateTime = getCertificateMonthDateTime(value);
  return dateTime ? <time dateTime={dateTime}>{value}</time> : value;
}

export function CertificateArchive({
  certificates,
}: {
  certificates: Certificate[];
}) {
  const [query, setQuery] = useState("");
  const [provider, setProvider] = useState("All sources");
  const [validity, setValidity] = useState<ValidityFilter>("all");
  const [copiedCertificate, setCopiedCertificate] = useState<number | null>(null);
  const [copyStatus, setCopyStatus] = useState("");

  useEffect(() => {
    let firstFrame = 0;
    let secondFrame = 0;

    const openCredentialFromHash = () => {
      const index = getCertificateIndexFromHash(
        window.location.hash,
        certificates,
      );
      const certificate = certificates[index];
      if (!certificate) return;

      const details = document.getElementById(`credential-${certificate.no}`);
      if (!(details instanceof HTMLDetailsElement)) return;
      details.open = true;

      cancelAnimationFrame(firstFrame);
      cancelAnimationFrame(secondFrame);
      firstFrame = requestAnimationFrame(() => {
        secondFrame = requestAnimationFrame(() => {
          details.scrollIntoView({
            behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
              ? "auto"
              : "smooth",
            block: "center",
          });
        });
      });
    };

    openCredentialFromHash();
    window.addEventListener("hashchange", openCredentialFromHash);
    window.addEventListener("popstate", openCredentialFromHash);
    return () => {
      cancelAnimationFrame(firstFrame);
      cancelAnimationFrame(secondFrame);
      window.removeEventListener("hashchange", openCredentialFromHash);
      window.removeEventListener("popstate", openCredentialFromHash);
    };
  }, [certificates]);
  const providers = [
    "All sources",
    ...Array.from(new Set(certificates.map((certificate) => certificate.provider))),
  ];
  const normalizedQuery = query.trim().toLowerCase();
  const hasFilters =
    normalizedQuery.length > 0 ||
    provider !== "All sources" ||
    validity !== "all";
  const matchingCertificates = certificates.filter((certificate) => {
    const matchesQuery = [
      certificate.title,
      certificate.provider,
      ...certificate.skills,
    ].some((value) => value.toLowerCase().includes(normalizedQuery));
    const matchesProvider =
      provider === "All sources" || certificate.provider === provider;
    const status = getCertificateStatus(certificate.to);
    const matchesValidity =
      validity === "all" ||
      (validity === "no-expiry"
        ? certificate.to === null
        : status === validity);
    return matchesQuery && matchesProvider && matchesValidity;
  });
  const groupedCertificates = matchingCertificates.reduce<Map<string, Certificate[]>>(
    (groups, certificate) => {
      const dateTime = getCertificateMonthDateTime(certificate.from);
      const year = dateTime?.slice(0, 4) ?? "date-unlisted";
      const group = groups.get(year) ?? [];
      group.push(certificate);
      groups.set(year, group);
      return groups;
    },
    new Map(),
  );

  return (
    <div>
      <p role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {copyStatus}
      </p>
      <div>
        <label
          htmlFor="credential-search"
          className="block font-mono text-[10px] uppercase tracking-[0.25em] text-starlight/70"
        >
          Search credentials
        </label>
        <input
          id="credential-search"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Title, provider, or skill"
          className="mt-2 min-h-11 w-full border border-indigo/50 bg-abyss/55 px-3 font-mono text-xs text-starlight placeholder:text-starlight/55 focus:border-accent focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-accent"
        />
      </div>

      <fieldset className="mt-5 min-w-0">
        <legend className="font-mono text-[10px] uppercase tracking-[0.25em] text-starlight/70">
          Filter by provider
        </legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {providers.map((source) => (
            <button
              key={source}
              type="button"
              aria-pressed={provider === source}
              onClick={() => setProvider(source)}
              className="min-h-11 max-w-full border border-indigo/50 px-3 py-2 text-left font-mono text-[9px] uppercase leading-relaxed tracking-[0.12em] text-starlight/65 transition-colors hover:border-accent/50 hover:text-accent focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-accent aria-pressed:border-gold/60 aria-pressed:text-gold"
            >
              {source}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset className="mt-5 min-w-0">
        <legend className="font-mono text-[10px] uppercase tracking-[0.25em] text-starlight/70">
          Filter by validity
        </legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {VALIDITY_FILTERS.map((filter) => (
            <button
              key={filter.value}
              type="button"
              aria-pressed={validity === filter.value}
              onClick={() => setValidity(filter.value)}
              className="min-h-11 max-w-full border border-indigo/50 px-3 py-2 text-left font-mono text-[9px] uppercase leading-relaxed tracking-[0.12em] text-starlight/65 transition-colors hover:border-accent/50 hover:text-accent focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-accent aria-pressed:border-gold/60 aria-pressed:text-gold"
            >
              {filter.label}
            </button>
          ))}
        </div>
      </fieldset>

      <div className="flex min-h-12 flex-wrap items-center justify-between gap-2 py-2">
        <p
          role="status"
          aria-live="polite"
          aria-atomic="true"
          className="font-mono text-[9px] uppercase tracking-[0.2em] text-starlight/65"
        >
          {hasFilters
            ? `${matchingCertificates.length} matching ${matchingCertificates.length === 1 ? "record" : "records"}`
            : `${certificates.length} records`}
        </p>
        {hasFilters && (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setProvider("All sources");
              setValidity("all");
            }}
            className="inline-flex min-h-11 items-center px-2 font-mono text-[9px] uppercase tracking-[0.14em] text-accent underline decoration-accent/40 underline-offset-4 hover:text-starlight focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            Clear all filters
          </button>
        )}
      </div>

      <div className="border-y border-indigo/40">
        {matchingCertificates.length > 0 ? (
          Array.from(groupedCertificates, ([year, yearCertificates]) => (
            <div
              key={year}
              role="group"
              aria-labelledby={`credential-year-${year}`}
            >
              <div className="flex items-center justify-between gap-3 border-b border-indigo/30 bg-void/80 px-1 py-2">
                <h3
                  id={`credential-year-${year}`}
                  className="font-mono text-[9px] uppercase tracking-[0.25em] text-gold"
                >
                  {year === "date-unlisted"
                    ? "Credential date unlisted"
                    : `Credential year · ${year}`}
                </h3>
                <span className="font-mono text-[9px] uppercase tracking-[0.15em] text-starlight/55">
                  {yearCertificates.length} {yearCertificates.length === 1 ? "record" : "records"}
                </span>
              </div>
              {yearCertificates.map((certificate) => {
                const recordIndex = certificates.findIndex(
                  (record) => record.no === certificate.no,
                );
                const status = getCertificateStatus(certificate.to);

                return (
                  <details
                    key={certificate.no}
                    id={`credential-${certificate.no}`}
                    className="group border-b border-indigo/30 last:border-b-0"
                  >
                    <summary className="flex cursor-pointer list-none items-center gap-4 py-5 marker:hidden focus-visible:text-accent focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-4 focus-visible:outline-accent sm:gap-6 sm:py-6 [&::-webkit-details-marker]:hidden">
                      <ConstellationMark certificate={certificate} />
                      <span className="min-w-0 flex-1">
                        <span className="flex flex-wrap items-baseline justify-between gap-x-5 gap-y-1">
                          <span className="font-display text-lg font-medium leading-snug tracking-tight text-starlight sm:text-xl">
                            {certificate.title}
                          </span>
                          <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-gold">
                            REC-{String(recordIndex + 1).padStart(2, "0")}
                          </span>
                        </span>
                        <span className="mt-2 flex flex-wrap gap-x-3 gap-y-1 font-mono text-[9px] uppercase tracking-[0.18em] text-starlight/60 sm:text-[10px]">
                          <span>{certificate.provider}</span>
                          <span aria-hidden="true">/</span>
                          <span>
                            <CertificateMonth value={certificate.from} /> &mdash;{" "}
                            <CertificateMonth value={certificate.to} />
                          </span>
                          {status && (
                            <span
                              className={
                                status === "current" ? "text-gold" : "text-starlight/55"
                              }
                            >
                              {status}
                            </span>
                          )}
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
                    <div className="ml-16 border-l border-gold/40 bg-abyss/95 px-4 py-4 sm:ml-20">
                      <p className="font-mono text-[9px] uppercase tracking-[0.25em] text-starlight/55">
                        Skills covered &middot; {certificate.skills.length}
                      </p>
                      <ul className="mt-3 flex flex-wrap gap-2">
                        {certificate.skills.map((skill) => (
                          <li
                            key={skill}
                            className="max-w-full border border-indigo/40 bg-void/50 px-2 py-1 font-mono text-[9px] leading-relaxed text-starlight/75"
                          >
                            {skill}
                          </li>
                        ))}
                      </ul>
                      <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2">
                        <a
                          href={`#credential-${certificate.no}`}
                          aria-label={`Link to ${certificate.title} in the credential archive`}
                          className="inline-flex min-h-11 items-center font-mono text-[9px] uppercase tracking-[0.18em] text-accent underline decoration-accent/40 underline-offset-4 hover:text-starlight focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-accent"
                        >
                          Record link
                        </a>
                        <button
                          type="button"
                          onClick={async () => {
                            const recordUrl = new URL(window.location.href);
                            recordUrl.hash = `credential-${certificate.no}`;
                            const citation = [
                              `${certificate.title} — ${certificate.provider}`,
                              `Awarded: ${certificate.from}`,
                              `Expiry: ${certificate.to ?? "Not listed"}`,
                              `Skills: ${certificate.skills.join(", ")}`,
                              `Record: ${recordUrl.toString()}`,
                            ].join("\n");

                            try {
                              await navigator.clipboard.writeText(citation);
                              setCopiedCertificate(certificate.no);
                              setCopyStatus(
                                `Citation and record link for ${certificate.title} copied.`,
                              );
                            } catch {
                              setCopiedCertificate(null);
                              setCopyStatus(
                                `Clipboard unavailable. Copy the title, provider, dates, skills, and record link for ${certificate.title} manually.`,
                              );
                            }
                          }}
                          aria-label={`Copy citation and record link for ${certificate.title}`}
                          className="inline-flex min-h-11 items-center border border-indigo/50 px-3 font-mono text-[9px] uppercase tracking-[0.18em] text-starlight/70 transition-colors hover:border-accent/60 hover:text-accent focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-accent"
                        >
                          {copiedCertificate === certificate.no
                            ? "Citation copied"
                            : "Copy citation + link"}
                        </button>
                      </div>
                    </div>
                  </details>
                );
              })}
            </div>
          ))
        ) : (
          <div className="py-8">
            <p className="font-display text-lg font-medium text-starlight">
              No credentials match these filters.
            </p>
            <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.15em] text-starlight/65">
              Try another provider, validity status, title, or skill.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
