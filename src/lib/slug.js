export function generateSlugCandidate(prefix = "pay") {
  const random = Math.random().toString(36).slice(2, 10);
  return `${prefix}-${random}`;
}

export function slugify(text) {
  return String(text || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "").slice(0, 24) || "link";
}

