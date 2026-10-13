"""Windows fd cleanup compatibility for gltest's Direct Mode runner.

gltest injects its message payload into fd 0 and unlinks the temporary file
before restoring fd 0. Windows keeps that handle locked, so defer only that
cleanup until the VM fixture restores stdin. Contract execution is unchanged.
"""

import os

from gltest.direct.vm import VMContext


_unlink = os.unlink
_pending_unlinks: list[str] = []


def _unlink_when_unlocked(path, *args, **kwargs):
    try:
        return _unlink(path, *args, **kwargs)
    except PermissionError:
        if os.name != "nt":
            raise
        _pending_unlinks.append(os.fspath(path))


os.unlink = _unlink_when_unlocked
_cleanup_vm = VMContext._cleanup_after_deactivate


def _cleanup_vm_and_temp_files(self):
    try:
        _cleanup_vm(self)
    finally:
        for path in _pending_unlinks:
            try:
                _unlink(path)
            except FileNotFoundError:
                pass
        _pending_unlinks.clear()


VMContext._cleanup_after_deactivate = _cleanup_vm_and_temp_files
