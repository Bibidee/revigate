export function normalizeRulebookSource(text: string): string;
export function sha256Hex(text: string, cryptoImpl?: Crypto): Promise<string>;
export function parseRulebookClauses(text: string): Record<string, { title: string; body: string }>;
