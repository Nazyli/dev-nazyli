import {
  CONTACT_EMAIL,
  CONTACT_LINKS,
  PORTFOLIO_URL,
} from "@/data/contact";

export const dynamic = "force-static";

const card = [
  "BEGIN:VCARD",
  "VERSION:4.0",
  "FN:Evry Nazyli",
  "TITLE:AI Engineer",
  `EMAIL;TYPE=work:${CONTACT_EMAIL}`,
  `URL:${PORTFOLIO_URL}`,
  ...CONTACT_LINKS.filter((link) => link.id !== "email").map(
    (link) => `URL:${link.href}`,
  ),
  "END:VCARD",
].join("\r\n");

export function GET() {
  return new Response(`${card}\r\n`, {
    headers: {
      "Content-Disposition": 'attachment; filename="evry-nazyli.vcf"',
      "Content-Type": "text/vcard; charset=utf-8",
    },
  });
}
