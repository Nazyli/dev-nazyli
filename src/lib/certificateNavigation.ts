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
