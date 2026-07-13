const SANTO_DOMINGO_GROUP = [
  "santo domingo",
  "distrito nacional",
  "santo domingo este",
  "santo domingo norte",
  "santo domingo oeste"
];

const locationGroups = new Map<string, string[]>([
  ["santo domingo", SANTO_DOMINGO_GROUP]
]);

export function resolveLocationGroup(location: string): string[] | null {
  const normalized = normalizeLocation(location);

  return normalized ? locationGroups.get(normalized) ?? null : null;
}

export function normalizeLocation(location: string): string {
  return location
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ");
}
