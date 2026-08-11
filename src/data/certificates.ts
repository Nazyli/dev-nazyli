import rawCertificates from "./certificate.json";

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
