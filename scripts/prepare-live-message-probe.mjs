import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const outputDir = resolve(root, "artifacts", "live-message-proof");
const outputPath = resolve(outputDir, "revigate_registry_probe.py");
const spoofPath = resolve(outputDir, "revigate_spoof_probe.py");
const registryPath = resolve(root, "contracts", "revigate_registry.py");
const registry = await readFile(registryPath, "utf8");
const marker = "    @gl.public.view\n    def get_config(self) -> dict:\n";

if (!registry.includes(marker)) {
  throw new Error("Could not locate Registry view insertion point; no file was written.");
}

const probe = `    @gl.public.write
    def probe_emit_snapshot(self, message_id: str, nonce: u256,
                            program_id: u256, publisher: Address, epoch: u64,
                            sha: str, document_digest: str) -> str:
        """Test-only owner-gated sender for hosted IC-to-IC message proofs."""
        if self._sender() != str(self.owner).lower():
            self._fail("Only the disposable Registry owner may run the message probe")
        if str(self.vault).lower() == ZERO:
            self._fail("Vault is not paired")
        _Vault(self.vault).emit(on="finalized").register_program_snapshot(
            message_id, nonce, program_id, publisher, epoch, sha,
            document_digest,
        )
        return message_id

`;

const probeSource = registry.replace(marker, probe + marker);
const spoofSource = `# v0.2.16
# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }

from genlayer import *


@gl.contract_interface
class _Vault:
    class Write:
        def register_program_snapshot(self, message_id: str, nonce: u256,
                                      program_id: u256, publisher: Address,
                                      epoch: u64, sha: str,
                                      document_digest: str) -> bool: ...


class RevigateSpoofProbe(gl.Contract):
    vault: Address

    def __init__(self, vault: Address):
        self.vault = Address(str(vault).lower())

    @gl.public.write
    def forge_snapshot(self, message_id: str, nonce: u256,
                       program_id: u256, publisher: Address, epoch: u64,
                       sha: str, document_digest: str) -> str:
        _Vault(self.vault).emit(on="finalized").register_program_snapshot(
            message_id, nonce, program_id, publisher, epoch, sha,
            document_digest,
        )
        return message_id
`;

await mkdir(outputDir, { recursive: true });
await writeFile(outputPath, probeSource, "utf8");
await writeFile(spoofPath, spoofSource, "utf8");
const sha256 = createHash("sha256").update(probeSource, "utf8").digest("hex").toUpperCase();
const spoofSha256 = createHash("sha256").update(spoofSource, "utf8").digest("hex").toUpperCase();
console.log(JSON.stringify({ path: outputPath, sha256, spoof_path: spoofPath,
  spoof_sha256: spoofSha256, custody_enabled: false,
  change: "owner-gated zero-value message emitter appended to the Registry source" }, null, 2));
