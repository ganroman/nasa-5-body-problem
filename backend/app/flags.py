"""Feature flags kept in one JSON file (no database).

File: path in env CARGO_FLAGS_FILE, owner = the service user, mode 600. Format:

    {"key": {"enabled": true, "description": "...", "rollout_percent": 100,
             "updated_at": "2026-11-15T12:00:00+00:00", "updated_by": "ivan"}}

`flag("key")` re-reads the file when its mtime or size changes, so an edit shows up on the next call
without a restart and without a timed cache. Writes are atomic (temp file, fsync, rename).
"""

import hashlib
import json
import logging
import os
import re
import threading
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

log = logging.getLogger("cargo.flags")

KEY_RE = re.compile(r"^[a-z0-9][a-z0-9_.-]{0,63}$")

_lock = threading.RLock()  # guards the read cache and serialises read-modify-write
_cache: dict[str, Any] = {"path": None, "sig": None, "data": {}}


class FlagsError(Exception):
    """Bad input or flags storage is not configured."""


def flags_path() -> Path | None:
    raw = os.environ.get("CARGO_FLAGS_FILE", "").strip()
    return Path(raw) if raw else None


def _signature(path: Path):
    try:
        st = path.stat()
    except FileNotFoundError:
        return None
    return (st.st_mtime_ns, st.st_size)


def _clean(raw: Any) -> dict[str, dict[str, Any]]:
    out: dict[str, dict[str, Any]] = {}
    if not isinstance(raw, dict):
        return out
    for key, v in raw.items():
        if not isinstance(key, str) or not isinstance(v, dict):
            continue
        try:
            pct = int(v.get("rollout_percent", 100))
        except (TypeError, ValueError):
            pct = 100
        out[key] = {
            "enabled": bool(v.get("enabled", False)),
            "description": str(v.get("description") or ""),
            "rollout_percent": max(0, min(100, pct)),
            "updated_at": v.get("updated_at"),
            "updated_by": v.get("updated_by"),
        }
    return out


def load_flags() -> dict[str, dict[str, Any]]:
    """All flags. Re-reads the file only when it changed; a broken file keeps the last good data."""
    path = flags_path()
    if path is None:
        return {}
    with _lock:
        sig = _signature(path)
        if _cache["path"] == str(path) and _cache["sig"] == sig:
            return _cache["data"]
        if sig is None:
            data: dict[str, dict[str, Any]] = {}
        else:
            try:
                data = _clean(json.loads(path.read_text("utf-8")))
            except (OSError, ValueError) as e:
                log.warning("flags file %s unreadable (%s); keeping previous data", path, e)
                return _cache["data"] if _cache["path"] == str(path) else {}
        _cache.update(path=str(path), sig=sig, data=data)
        return data


def _bucket(key: str, subject: str) -> int:
    return int(hashlib.sha256(f"{key}:{subject}".encode()).hexdigest()[:8], 16) % 100


def _is_on(key: str, entry: dict[str, Any] | None, subject: str | None) -> bool:
    if not entry or not entry["enabled"]:
        return False
    pct = entry["rollout_percent"]
    if pct >= 100:
        return True
    if pct <= 0 or not subject:  # a partial rollout needs a stable subject (user id)
        return False
    return _bucket(key, subject) < pct


def flag(key: str, subject: str | None = None, default: bool = False) -> bool:
    """True if flag `key` is on. `subject` is a stable user/session id for rollout_percent < 100."""
    entry = load_flags().get(key)
    if entry is None:
        return default
    return _is_on(key, entry, subject)


def enabled_keys(subject: str | None = None) -> list[str]:
    return sorted(k for k, v in load_flags().items() if _is_on(k, v, subject))


def _write(path: Path, data: dict[str, dict[str, Any]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_name(f".{path.name}.{os.getpid()}.tmp")
    fd = os.open(tmp, os.O_WRONLY | os.O_CREAT | os.O_TRUNC, 0o600)
    try:
        with os.fdopen(fd, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2, sort_keys=True)
            f.write("\n")
            f.flush()
            os.fsync(f.fileno())
        os.replace(tmp, path)
    except BaseException:
        tmp.unlink(missing_ok=True)
        raise
    _cache.update(path=str(path), sig=_signature(path), data=data)


def _require_path() -> Path:
    path = flags_path()
    if path is None:
        raise FlagsError("CARGO_FLAGS_FILE is not set")
    return path


def validate_flag(key: str, rollout_percent: int) -> None:
    if not KEY_RE.match(key):
        raise FlagsError("key: a-z, 0-9, '_', '-', '.', up to 64 chars, starts with a letter or digit")
    if not isinstance(rollout_percent, int) or isinstance(rollout_percent, bool) or not 0 <= rollout_percent <= 100:
        raise FlagsError("rollout_percent: integer 0..100")


def upsert_flag(key: str, *, enabled: bool, description: str, rollout_percent: int, actor: str) -> tuple[dict, bool]:
    """Create or replace a flag. Returns (entry, created)."""
    validate_flag(key, rollout_percent)
    path = _require_path()
    with _lock:
        data = dict(load_flags())
        created = key not in data
        entry = {
            "enabled": bool(enabled),
            "description": (description or "")[:500],
            "rollout_percent": rollout_percent,
            "updated_at": datetime.now(UTC).isoformat(timespec="seconds"),
            "updated_by": actor,
        }
        data[key] = entry
        _write(path, data)
        return entry, created


def delete_flag(key: str) -> bool:
    path = _require_path()
    with _lock:
        data = dict(load_flags())
        if key not in data:
            return False
        del data[key]
        _write(path, data)
        return True
