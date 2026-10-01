export const CONTACT_EMAIL = "info@nazyli.com";
export const CONTACT_SUBJECT = "AI engineering inquiry · Nazyli Universe";
export const PORTFOLIO_URL = "https://nazyli.com";

export const CONTACT_LINKS = [
  {
    id: "email",
    label: "Email Evry",
    href: `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(CONTACT_SUBJECT)}`,
    detail: CONTACT_EMAIL,
    searchText: "email mail message",
    primary: true,
    openInNewTab: false,
  },
  {
    id: "github",
    label: "GitHub",
    href: "https://github.com/Nazyli",
    detail: "github.com/Nazyli",
    searchText: "code repositories projects",
    primary: false,
    openInNewTab: true,
  },
  {
    id: "linkedin",
    label: "LinkedIn",
    href: "https://www.linkedin.com/in/evrynazyli/",
    detail: "Professional profile",
    searchText: "career network profile",
    primary: false,
    openInNewTab: true,
  },
] as const;
