import { SITE_URL } from "@/lib/site";

export const CONTACT_EMAIL = "info@nazyli.com";
export const CONTACT_SUBJECT = "AI engineering inquiry · Nazyli Universe";
export const PORTFOLIO_URL = SITE_URL;
export const GITHUB_PROFILE_URL = "https://github.com/Nazyli";
export const LINKEDIN_PROFILE_URL = "https://www.linkedin.com/in/evrynazyli/";

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
    href: GITHUB_PROFILE_URL,
    detail: "github.com/Nazyli",
    searchText: "code repositories projects",
    primary: false,
    openInNewTab: true,
  },
  {
    id: "linkedin",
    label: "LinkedIn",
    href: LINKEDIN_PROFILE_URL,
    detail: "Professional profile",
    searchText: "career network profile",
    primary: false,
    openInNewTab: true,
  },
] as const;
