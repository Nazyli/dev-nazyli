export type SpaceColorToken =
  | "void"
  | "abyss"
  | "indigo"
  | "accent"
  | "starlight"
  | "gold"
  | "nebula-blue"
  | "nebula-teal"
  | "dust"
  | "gold-muted";

const colorCache = new Map<SpaceColorToken, string>();

export function getSpaceColor(token: SpaceColorToken) {
  const cached = colorCache.get(token);
  if (cached) return cached;

  const property = `--color-${token}`;
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue(property)
    .trim();
  if (!value) throw new Error(`Missing theme color token: ${property}`);

  colorCache.set(token, value);
  return value;
}
