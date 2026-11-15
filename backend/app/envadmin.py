"""Environment-variable registry for the admin widget, the service env file and the audit log.

Settings are read once at start (app.config), so a saved change takes effect after a restart. The
service gets the file through `EnvironmentFile=` in its systemd unit; the app only writes it.
Secrets are write-only: status and the last four characters are the most the API ever returns.
"""

import json
import os
import re
import threading
from dataclasses import dataclass
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

MASK = "••••"
MAX_VALUE = 4096


@dataclass(frozen=True)
class EnvVar:
    name: str
    description: str
    secret: bool = False
    example: str = ""
    editable: bool = True
    tail: bool = True  # show the last four characters of a secret


# Everything the backend reads (app/config.py) plus the admin and ops knobs.
REGISTRY: tuple[EnvVar, ...] = (
    EnvVar("DATABASE_URL", "Postgres URL used by the app (SQLAlchemy, psycopg driver). Contains the DB password.",
           secret=True, example="postgresql+psycopg://user:password@127.0.0.1:5432/cargo"),
    EnvVar("DATABASE_URL_DIRECT", "Direct Postgres URL for Alembic migrations; falls back to DATABASE_URL.",
           secret=True, example="postgresql+psycopg://user:password@127.0.0.1:5432/cargo"),
    EnvVar("SI_BASE_URL", "Eustella AI base URL (OpenAI-compatible). Alias: EUSTELLA_BASE_URL.",
           example="https://api.eustella.com/v1"),
    EnvVar("SI_API_KEY", "Eustella AI key. Empty means the SI feature reports unavailable. Alias: EUSTELLA_API_KEY.",
           secret=True, example="rk_..."),
    EnvVar("SI_MODEL", "Eustella AI model name. Alias: EUSTELLA_MODEL.", example="eustella-v1.5"),
    EnvVar("CORS_ORIGINS", "Comma-separated browser origins allowed to call the API.",
           example="https://cargo.qwadratic.me,http://localhost:8000"),
    EnvVar("ADMIN_PASSWORD", "Password of /admin (HTTP Basic, any user name). Set by the host, not editable here.",
           secret=True, editable=False, tail=False),
    EnvVar("CARGO_ENV_FILE", "Env file of the service that this widget edits. Set in the unit.",
           example="/var/lib/cargo/cargo.env", editable=False),
    EnvVar("CARGO_FLAGS_FILE", "JSON file with the feature flags. Set in the unit.",
           example="/var/lib/cargo/flags.json", editable=False),
    EnvVar("CARGO_RESTART_SIGNAL", "File touched to ask systemd (path unit) for a service restart. Set in the unit.",
           example="/var/lib/cargo/restart.signal", editable=False),
)
BY_NAME = {v.name: v for v in REGISTRY}


class EnvAdminError(Exception):
    """Bad input or storage not configured."""


def mask(value: str) -> str:
    """'••••last4'; values shorter than 8 characters show no characters at all."""
    return MASK + value[-4:] if len(value) >= 8 else MASK


def env_file_path() -> Path | None:
    raw = os.environ.get("CARGO_ENV_FILE", "").strip()
    return Path(raw) if raw else None


# --- env file (systemd EnvironmentFile syntax: NAME="value", C-style escapes in double quotes) ---

_LINE = re.compile(r"""^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$""")


def _unquote(raw: str) -> str:
    if len(raw) >= 2 and raw[0] == raw[-1] == '"':
        return re.sub(r"\\(.)", lambda m: {"n": "\n", "t": "\t"}.get(m.group(1), m.group(1)), raw[1:-1])
    if len(raw) >= 2 and raw[0] == raw[-1] == "'":
        return raw[1:-1]
    return raw


def read_env_file(path: Path | None = None) -> dict[str, str]:
    path = path or env_file_path()
    if path is None or not path.exists():
        return {}
    out: dict[str, str] = {}
    for line in path.read_text("utf-8").splitlines():
        if not line.strip() or line.lstrip().startswith(("#", ";")):
            continue
        m = _LINE.match(line)
        if m:
            out[m.group(1)] = _unquote(m.group(2))
    return out


def _quote(value: str) -> str:
    return '"' + value.replace("\\", "\\\\").replace('"', '\\"') + '"'


def atomic_write(path: Path, text: str, mode: int = 0o600) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_name(f".{path.name}.{os.getpid()}.tmp")
    fd = os.open(tmp, os.O_WRONLY | os.O_CREAT | os.O_TRUNC, mode)
    try:
        with os.fdopen(fd, "w", encoding="utf-8") as f:
            f.write(text)
            f.flush()
            os.fsync(f.fileno())
        os.replace(tmp, path)
    except BaseException:
        tmp.unlink(missing_ok=True)
        raise


def write_env_file(path: Path, values: dict[str, str]) -> None:
    lines = ["# Managed by the Cargo Passport /admin widget. Mode 600; read by systemd EnvironmentFile=."]
    lines += [f"{k}={_quote(v)}" for k, v in sorted(values.items())]
    atomic_write(path, "\n".join(lines) + "\n")


def validate_value(name: str, value: str) -> None:
    if len(value) > MAX_VALUE:
        raise EnvAdminError(f"{name}: value longer than {MAX_VALUE} characters")
    if any(c in value for c in "\n\r\0"):
        raise EnvAdminError(f"{name}: line breaks are not allowed")
    if name in ("DATABASE_URL", "DATABASE_URL_DIRECT") and not value.startswith("postgresql"):
        raise EnvAdminError(f"{name}: must start with postgresql")


# --- state for the UI ---

_env_lock = threading.Lock()


def describe() -> list[dict[str, Any]]:
    """The registry with current state. A secret's value is never included, only is_set and ••••last4."""
    file_vals = read_env_file()
    rows = []
    for v in REGISTRY:
        running = os.environ.get(v.name)
        in_file = file_vals.get(v.name)
        effective = in_file if in_file is not None else running  # what the next start will use
        row: dict[str, Any] = {
            "name": v.name, "description": v.description, "secret": v.secret, "example": v.example,
            "editable": v.editable and env_file_path() is not None,
            "source": "file" if in_file is not None else ("service" if running is not None else None),
            "is_set": bool(effective),
            "pending_restart": v.editable and in_file is not None and in_file != (running or ""),
        }
        if v.secret:
            row["masked"] = (mask(effective) if v.tail else MASK) if effective else None
        else:
            row["value"] = effective or ""
            row["running_value"] = running or ""
        rows.append(row)
    return rows


def apply_changes(set_values: dict[str, str], unset: list[str]) -> list[dict[str, Any]]:
    """Write changes into the env file. Returns audit-ready records: no secret values."""
    path = env_file_path()
    if path is None:
        raise EnvAdminError("CARGO_ENV_FILE is not set")
    for name in [*set_values, *unset]:
        var = BY_NAME.get(name)
        if var is None:
            raise EnvAdminError(f"{name}: not in the registry")
        if not var.editable:
            raise EnvAdminError(f"{name}: not editable here")
    for name, value in set_values.items():
        if not isinstance(value, str):
            raise EnvAdminError(f"{name}: value must be a string")
        validate_value(name, value)
    changes: list[dict[str, Any]] = []
    with _env_lock:
        current = read_env_file(path)
        for name, value in set_values.items():
            var = BY_NAME[name]
            if current.get(name) == value:
                continue
            rec: dict[str, Any] = {"action": "env.set", "name": name, "secret": var.secret}
            if not var.secret:
                rec["old"], rec["new"] = current.get(name), value
            changes.append(rec)
            current[name] = value
        for name in unset:
            if name in current:
                del current[name]
                changes.append({"action": "env.unset", "name": name, "secret": BY_NAME[name].secret})
        if changes:
            write_env_file(path, current)
    return changes


# --- audit log (JSON lines; never a secret value) ---

def audit_path() -> Path | None:
    for key in ("CARGO_AUDIT_FILE",):
        raw = os.environ.get(key, "").strip()
        if raw:
            return Path(raw)
    for key in ("CARGO_ENV_FILE", "CARGO_FLAGS_FILE"):
        raw = os.environ.get(key, "").strip()
        if raw:
            return Path(raw).with_name("admin-audit.log")
    return None


def audit(actor: str, ip: str | None, record: dict[str, Any]) -> None:
    path = audit_path()
    if path is None:
        return
    entry = {"ts": datetime.now(UTC).isoformat(timespec="seconds"), "actor": actor, "ip": ip, **record}
    with _env_lock:
        path.parent.mkdir(parents=True, exist_ok=True)
        fd = os.open(path, os.O_WRONLY | os.O_CREAT | os.O_APPEND, 0o600)
        with os.fdopen(fd, "a", encoding="utf-8") as f:
            f.write(json.dumps(entry, ensure_ascii=False) + "\n")


def read_audit(limit: int = 100) -> list[dict[str, Any]]:
    path = audit_path()
    if path is None or not path.exists():
        return []
    rows = []
    for line in path.read_text("utf-8").splitlines()[-limit:]:
        try:
            rows.append(json.loads(line))
        except ValueError:
            continue
    return rows[::-1]


# --- soft restart ---

def restart_configured() -> bool:
    return bool(os.environ.get("CARGO_RESTART_SIGNAL", "").strip())


def request_restart() -> None:
    """Touch the signal file; a systemd path unit restarts the service (the app has no sudo)."""
    raw = os.environ.get("CARGO_RESTART_SIGNAL", "").strip()
    if not raw:
        raise EnvAdminError("CARGO_RESTART_SIGNAL is not set")
    path = Path(raw)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(datetime.now(UTC).isoformat() + "\n", "utf-8")  # in place: the path unit watches this inode
