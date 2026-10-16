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

export function validateRevisionSourceIdentity(programId, review) {
  if (!review || String(review.program_id) !== String(programId)) throw new Error("This review belongs to a different program.");
  if (!/^[0-9a-f]{40}$/i.test(String(review.base_sha)) || !/^[0-9a-f]{40}$/i.test(String(review.candidate_sha))
      || !/^[0-9a-f]{64}$/i.test(String(review.base_digest))) {
    throw new Error("The review does not contain complete authenticated source identities.");
  }
  const result = review.result && typeof review.result === "object" ? review.result : {};
  const candidateDigest = typeof result.candidate_digest === "string" && /^[0-9a-f]{64}$/i.test(result.candidate_digest)
    ? result.candidate_digest : "";
  if (["MATERIAL", "NONMATERIAL"].includes(String(review.status)) && !candidateDigest) {
    throw new Error("A decided revision is missing its authenticated candidate digest.");
  }
  return { candidateDigest, candidateAuthenticated: Boolean(candidateDigest) };
}
