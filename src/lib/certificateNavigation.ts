import { certificates as publishedCertificates } from "@/data/certificates";
import type { Certificate } from "@/data/certificates";

export function getCertificateIndexFromHash(
  hash: string,
  certificates: readonly Certificate[] = publishedCertificates,
) {
  const id = hash.startsWith("#") ? hash.slice(1) : hash;
  const match = /^credential-(\d+)$/.exec(id);
  if (!match) return -1;

  const no = Number(match[1]);
  return certificates.findIndex((certificate) => certificate.no === no);
}

export function navigateToCertificate(certificateNo: number) {
  if (!publishedCertificates.some((certificate) => certificate.no === certificateNo)) {
    return;
  }

  const hash = `#credential-${certificateNo}`;
  if (window.location.hash !== hash) {
    window.history.pushState(
      typeof window.history.state === "object" && window.history.state !== null
        ? { ...window.history.state, section: "s-certificates" }
        : { section: "s-certificates" },
      "",
      hash,
    );
  }

  window.dispatchEvent(new Event("credential:navigate"));
}
