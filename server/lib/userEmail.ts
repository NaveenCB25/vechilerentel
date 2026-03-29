export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function buildCaseInsensitiveEmailLookup(email: string) {
  return {
    $regex: `^${escapeRegExp(normalizeEmail(email))}$`,
    $options: "i",
  };
}

export function buildArchivedDuplicateEmail(email: string, suffix: string) {
  const normalizedEmail = normalizeEmail(email);
  const [localPart = "user", domain = "example.com"] = normalizedEmail.split("@");
  const safeSuffix = suffix.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 12) || "duplicate";

  return `${localPart}+duplicate-${safeSuffix}@${domain}`;
}
