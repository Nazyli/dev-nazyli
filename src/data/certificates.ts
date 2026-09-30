import rawCertificates from "./certificate.json";

const MONTHS = [
  "jan",
  "feb",
  "mar",
  "apr",
  "may",
  "jun",
  "jul",
  "aug",
  "sep",
  "oct",
  "nov",
  "dec",
];

export type Certificate = {
  no: number;
  title: string;
  skills: string[];
  provider: string;
  from: string;
  to: string | null;
  constellation: {
    stars: [number, number][];
    lines: [number, number][];
  };
};

export function getCertificateStatus(
  expiry: string | null,
  now = Date.now(),
): "current" | "expired" | null {
  if (!expiry) return null;

  const match = /^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{4})$/i.exec(
    expiry.trim(),
  );
  if (!match) return null;

  const month = MONTHS.indexOf(match[1].toLowerCase());
  const expiresAt = Date.UTC(Number(match[2]), month + 1, 1);

  return expiresAt > now ? "current" : "expired";
}

type RawCertificate = {
  no: number;
  title: string;
  skills: string[];
  provider: string;
  from: string;
  to: string | null;
  constellation: {
    stars: [number, number][];
  };
};

export function buildConstellationPath(certificate: Certificate): string {
  return certificate.constellation.lines
    .map(([from, to]) => {
      const [ax, ay] = certificate.constellation.stars[from];
      const [bx, by] = certificate.constellation.stars[to];
      return `M ${ax} ${ay} L ${bx} ${by}`;
    })
    .join(" ");
}

export const certificates: Certificate[] = (rawCertificates as RawCertificate[]).map(
  (cert) => ({
    ...cert,
    constellation: {
      stars: cert.constellation.stars,
      lines: cert.constellation.stars
        .slice(0, -1)
        .map((_, i) => [i, i + 1] as [number, number]),
    },
  })
);
