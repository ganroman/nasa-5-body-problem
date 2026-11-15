"""/admin: password-protected page and JSON API for env variables and feature flags, plus the public
GET /api/flags for the frontend.

Auth: HTTP Basic. The user name is the actor written to the audit log; the password is env
ADMIN_PASSWORD. No password configured means the admin is off (503). Changing requests need the
header `X-Admin-Request` so a cross-site form cannot reuse the browser's cached Basic credentials.
"""

import base64
import binascii
import hmac
import os
import re
import time
from collections import defaultdict, deque
from pathlib import Path
from typing import Any

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Request
from fastapi.responses import HTMLResponse, JSONResponse
from pydantic import BaseModel, Field

from app import envadmin, flags

UI_FILE = Path(__file__).with_name("admin_ui.html")
FAIL_LIMIT, FAIL_WINDOW = 10, 300  # failed logins per IP per window
_fails: dict[str, deque[float]] = defaultdict(deque)

public_router = APIRouter()
router = APIRouter(prefix="/admin", include_in_schema=False)


def _ip(request: Request) -> str:
    return request.client.host if request.client else "-"


def _deny(headers: dict[str, str] | None = None, status: int = 401, detail: str = "Unauthorized") -> HTTPException:
    return HTTPException(status, detail, headers=headers)


def require_admin(request: Request) -> str:
    """Returns the actor name. 401 without a valid password, 503 when no password is configured."""
    password = os.environ.get("ADMIN_PASSWORD", "")
    if not password:
        raise _deny(status=503, detail="Admin is disabled: ADMIN_PASSWORD is not set")
    challenge = {"WWW-Authenticate": 'Basic realm="Cargo admin", charset="UTF-8"'}
    ip = _ip(request)
    window = _fails[ip]
    now = time.monotonic()
    while window and now - window[0] > FAIL_WINDOW:
        window.popleft()
    if len(window) >= FAIL_LIMIT:
        raise _deny(status=429, detail="Too many failed attempts, try later")
    header = request.headers.get("authorization", "")
    scheme, _, token = header.partition(" ")
    user = pw = ""
    ok = False
    if scheme.lower() == "basic" and token:
        try:
            user, _, pw = base64.b64decode(token).decode("utf-8").partition(":")
            ok = hmac.compare_digest(pw.encode(), password.encode())
        except (binascii.Error, UnicodeDecodeError):
            ok = False
    if not ok:
        window.append(now)
        raise _deny(challenge)
    if request.method not in ("GET", "HEAD") and "x-admin-request" not in request.headers:
        raise _deny(status=403, detail="Missing X-Admin-Request header")
    return re.sub(r"[^\w.@-]", "", user)[:40] or "admin"


# --- public ---

@public_router.get("/api/flags")
def public_flags(uid: str | None = None) -> JSONResponse:
    """Keys of enabled flags only (rollout applied for `uid`). No descriptions, no disabled keys."""
    return JSONResponse({"enabled": flags.enabled_keys(uid)}, headers={"Cache-Control": "no-cache"})


# --- admin page ---

@router.get("", response_class=HTMLResponse)
@router.get("/", response_class=HTMLResponse)
def page(actor: str = Depends(require_admin)) -> HTMLResponse:
    return HTMLResponse(UI_FILE.read_text("utf-8"), headers={"Cache-Control": "no-store"})


@router.get("/api/me")
def me(actor: str = Depends(require_admin)) -> dict[str, Any]:
    return {
        "actor": actor,
        "env_file": envadmin.env_file_path() is not None,
        "flags_file": flags.flags_path() is not None,
        "restart": envadmin.restart_configured(),
    }


# --- env ---

class EnvChange(BaseModel):
    set: dict[str, str] = Field(default_factory=dict)
    unset: list[str] = Field(default_factory=list)
    restart: bool = False


@router.get("/api/env")
def env_list(actor: str = Depends(require_admin)) -> dict[str, Any]:
    return {"vars": envadmin.describe(), "restart_available": envadmin.restart_configured()}


@router.put("/api/env")
def env_save(body: EnvChange, request: Request, tasks: BackgroundTasks, actor: str = Depends(require_admin)) -> dict[str, Any]:
    try:
        changes = envadmin.apply_changes(body.set, body.unset)
    except envadmin.EnvAdminError as e:
        raise HTTPException(400 if "not set" not in str(e) else 409, str(e))
    for rec in changes:
        envadmin.audit(actor, _ip(request), rec)
    restart = "skipped"
    if body.restart and changes:
        if envadmin.restart_configured():
            envadmin.audit(actor, _ip(request), {"action": "restart"})
            tasks.add_task(envadmin.request_restart)  # after the response is sent
            restart = "scheduled"
        else:
            restart = "not-configured"
    return {"changed": [c["name"] for c in changes], "restart": restart, "vars": envadmin.describe()}


@router.post("/api/restart")
def restart_now(request: Request, tasks: BackgroundTasks, actor: str = Depends(require_admin)) -> dict[str, str]:
    if not envadmin.restart_configured():
        raise HTTPException(409, "CARGO_RESTART_SIGNAL is not set")
    envadmin.audit(actor, _ip(request), {"action": "restart"})
    tasks.add_task(envadmin.request_restart)
    return {"restart": "scheduled"}


@router.get("/api/audit")
def audit_list(limit: int = 100, actor: str = Depends(require_admin)) -> dict[str, Any]:
    return {"entries": envadmin.read_audit(max(1, min(limit, 500)))}


# --- flags ---

class FlagIn(BaseModel):
    enabled: bool = False
    description: str = ""
    rollout_percent: int = 100


class FlagCreate(FlagIn):
    key: str


def _flag_rows() -> list[dict[str, Any]]:
    return [{"key": k, **v} for k, v in sorted(flags.load_flags().items())]


@router.get("/api/flags")
def flags_list(actor: str = Depends(require_admin)) -> dict[str, Any]:
    return {"flags": _flag_rows(), "writable": flags.flags_path() is not None}


def _save_flag(key: str, body: FlagIn, request: Request, actor: str, must_exist: bool | None) -> dict[str, Any]:
    try:
        existing = key in flags.load_flags()
        if must_exist is True and not existing:
            raise HTTPException(404, "no such flag")
        if must_exist is False and existing:
            raise HTTPException(409, "flag already exists")
        entry, created = flags.upsert_flag(
            key, enabled=body.enabled, description=body.description,
            rollout_percent=body.rollout_percent, actor=actor)
    except flags.FlagsError as e:
        raise HTTPException(409 if "not set" in str(e) else 400, str(e))
    envadmin.audit(actor, _ip(request), {
        "action": "flag.create" if created else "flag.update", "name": key,
        "enabled": entry["enabled"], "rollout_percent": entry["rollout_percent"]})
    return {"key": key, **entry}


@router.post("/api/flags", status_code=201)
def flag_create(body: FlagCreate, request: Request, actor: str = Depends(require_admin)) -> dict[str, Any]:
    return _save_flag(body.key, body, request, actor, must_exist=False)


@router.put("/api/flags/{key}")
def flag_update(key: str, body: FlagIn, request: Request, actor: str = Depends(require_admin)) -> dict[str, Any]:
    return _save_flag(key, body, request, actor, must_exist=True)


@router.delete("/api/flags/{key}")
def flag_delete(key: str, request: Request, actor: str = Depends(require_admin)) -> dict[str, bool]:
    try:
        deleted = flags.delete_flag(key)
    except flags.FlagsError as e:
        raise HTTPException(409, str(e))
    if not deleted:
        raise HTTPException(404, "no such flag")
    envadmin.audit(actor, _ip(request), {"action": "flag.delete", "name": key})
    return {"deleted": True}
