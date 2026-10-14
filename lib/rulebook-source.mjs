export function normalizeRulebookSource(text) {
  if (typeof text !== "string") throw new TypeError("Rulebook source must be text.");
  if (text.startsWith("\uFEFF")) throw new Error("Rulebook encoding is not canonical.");
  return text.replace(/\r\n?/g, "\n").normalize("NFC");
}

export async function sha256Hex(text, cryptoImpl = globalThis.crypto) {
  if (!cryptoImpl?.subtle) throw new Error("SHA-256 is unavailable in this browser.");
  const bytes = new TextEncoder().encode(normalizeRulebookSource(text));
  const digest = await cryptoImpl.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function parseRulebookClauses(text) {
  const normalized = normalizeRulebookSource(text);
  const matches = [...normalized.matchAll(/^## (R-(?:0[1-9]|1[0-6])): ([^\n]+)\n/gm)];
  if (matches.length < 2 || new Set(matches.map((match) => match[1])).size !== matches.length) {
    throw new Error("Authenticated rulebook structure is invalid.");
  }
  return Object.fromEntries(matches.map((match, index) => {
    const end = matches[index + 1]?.index ?? normalized.length;
    return [match[1], { title: match[2].trim(), body: normalized.slice(match.index + match[0].length, end).trim() }];
  }));
}
