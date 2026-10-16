# v0.2.16
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
