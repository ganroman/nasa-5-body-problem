"""Admin console, env widget and file-based feature flags. No database is touched."""

import base64
import json
import os
import stat
import time

import pytest

# Settings needs a DATABASE_URL to load; these tests never connect. Only fall back to a dummy when no
# backend/.env provides one, otherwise the dummy (an env var beats .env) breaks later database tests.
if not (os.path.exists(os.path.join(os.path.dirname(__file__), "..", ".env"))):
    os.environ.setdefault("DATABASE_URL", "postgresql+psycopg://nobody@127.0.0.1:1/none")

from fastapi.testclient import TestClient  # noqa: E402

from app import admin, envadmin, flags  # noqa: E402
from app.main import app  # noqa: E402

PASSWORD = "correct-horse-battery"
SECRET = "rk_supersecretvalue_1234"


def basic(user="ivan", password=PASSWORD):
    return {"Authorization": "Basic " + base64.b64encode(f"{user}:{password}".encode()).decode()}


AUTH = {**basic(), "X-Admin-Request": "1"}


@pytest.fixture
def cfg(tmp_path, monkeypatch):
    monkeypatch.setenv("ADMIN_PASSWORD", PASSWORD)
    monkeypatch.setenv("CARGO_ENV_FILE", str(tmp_path / "cargo.env"))
    monkeypatch.setenv("CARGO_FLAGS_FILE", str(tmp_path / "flags.json"))
    monkeypatch.setenv("CARGO_RESTART_SIGNAL", str(tmp_path / "restart.signal"))
    monkeypatch.delenv("CARGO_AUDIT_FILE", raising=False)
    monkeypatch.delenv("SI_MODEL", raising=False)
    monkeypatch.delenv("SI_API_KEY", raising=False)
    admin._fails.clear()
    return tmp_path


@pytest.fixture
def client(cfg):
    return TestClient(app)


# --- access ---

@pytest.mark.parametrize("method,path", [
    ("GET", "/admin"), ("GET", "/admin/"), ("GET", "/admin/api/env"), ("GET", "/admin/api/flags"),
    ("GET", "/admin/api/audit"), ("PUT", "/admin/api/env"), ("POST", "/admin/api/flags"),
    ("DELETE", "/admin/api/flags/x"), ("POST", "/admin/api/restart"),
])
def test_admin_without_password_is_401(client, method, path):
    r = client.request(method, path, json={} if method in ("PUT", "POST") else None)
    assert r.status_code == 401
    assert r.headers["www-authenticate"].startswith("Basic")


def test_wrong_password_is_401_and_right_is_200(client):
    assert client.get("/admin", headers=basic(password="nope")).status_code == 401
    r = client.get("/admin", headers=basic())
    assert r.status_code == 200 and "Cargo Passport admin" in r.text
    assert r.headers["cache-control"] == "no-store"


def test_admin_disabled_when_password_unset(client, monkeypatch):
    monkeypatch.delenv("ADMIN_PASSWORD")
    assert client.get("/admin", headers=basic()).status_code == 503
    assert client.get("/admin", headers=basic(password="")).status_code == 503


def test_changing_request_needs_custom_header(client):
    r = client.put("/admin/api/env", headers=basic(), json={"set": {"SI_MODEL": "x"}})
    assert r.status_code == 403


def test_failed_logins_are_rate_limited(client):
    for _ in range(admin.FAIL_LIMIT):
        assert client.get("/admin", headers=basic(password="bad")).status_code == 401
    assert client.get("/admin", headers=basic()).status_code == 429


def test_admin_not_in_openapi(client):
    assert not [p for p in client.get("/openapi.json").json()["paths"] if p.startswith("/admin")]


# --- env widget ---

def row(client, name):
    return next(v for v in client.get("/admin/api/env", headers=AUTH).json()["vars"] if v["name"] == name)


def test_secret_is_write_only_and_masked(client, cfg):
    r = client.put("/admin/api/env", headers=AUTH, json={"set": {"SI_API_KEY": SECRET}})
    assert r.status_code == 200 and r.json()["changed"] == ["SI_API_KEY"]
    for resp in (r, client.get("/admin/api/env", headers=AUTH), client.get("/admin/api/audit", headers=AUTH)):
        assert SECRET not in resp.text
    v = row(client, "SI_API_KEY")
    assert v["is_set"] is True and v["masked"] == "••••" + SECRET[-4:]
    assert "value" not in v and "running_value" not in v
    assert SECRET in (cfg / "cargo.env").read_text()  # stored, only never returned
    assert SECRET not in (cfg / "admin-audit.log").read_text()


def test_short_secret_shows_no_characters(client):
    client.put("/admin/api/env", headers=AUTH, json={"set": {"SI_API_KEY": "abc123"}})
    assert row(client, "SI_API_KEY")["masked"] == "••••"


def test_admin_password_never_shows_characters(client):
    assert row(client, "ADMIN_PASSWORD")["masked"] == "••••"
    assert PASSWORD[-4:] not in client.get("/admin/api/env", headers=AUTH).text


def test_unset_secret_says_not_set(client):
    v = row(client, "SI_API_KEY")
    assert v["is_set"] is False and v["masked"] is None


def test_non_secret_is_visible_and_pending_until_restart(client, cfg, monkeypatch):
    monkeypatch.setenv("SI_MODEL", "old-model")
    assert row(client, "SI_MODEL")["pending_restart"] is False
    client.put("/admin/api/env", headers=AUTH, json={"set": {"SI_MODEL": "new-model"}})
    v = row(client, "SI_MODEL")
    assert v["value"] == "new-model" and v["running_value"] == "old-model" and v["pending_restart"] is True
    monkeypatch.setenv("SI_MODEL", "new-model")  # what a restart does
    assert row(client, "SI_MODEL")["pending_restart"] is False


def test_env_file_mode_600_and_roundtrip_with_quotes(client, cfg):
    tricky = 'https://a.example,"b" \\ c # d'
    client.put("/admin/api/env", headers=AUTH, json={"set": {"CORS_ORIGINS": tricky, "SI_MODEL": "m"}})
    path = cfg / "cargo.env"
    assert stat.S_IMODE(path.stat().st_mode) == 0o600
    assert envadmin.read_env_file(path) == {"CORS_ORIGINS": tricky, "SI_MODEL": "m"}
    assert not [p for p in cfg.iterdir() if p.name.endswith(".tmp")]


def test_unknown_noneditable_and_bad_values_rejected(client, cfg):
    for body in ({"set": {"PATH": "/x"}}, {"set": {"ADMIN_PASSWORD": "x"}}, {"set": {"CARGO_ENV_FILE": "/etc/x"}},
                 {"set": {"SI_MODEL": "a\nSI_API_KEY=b"}}, {"set": {"DATABASE_URL": "mysql://x"}}, {"unset": ["PATH"]}):
        assert client.put("/admin/api/env", headers=AUTH, json=body).status_code == 400, body
    assert not (cfg / "cargo.env").exists()


def test_unset_removes_from_file(client, cfg):
    client.put("/admin/api/env", headers=AUTH, json={"set": {"SI_MODEL": "m"}})
    client.put("/admin/api/env", headers=AUTH, json={"unset": ["SI_MODEL"]})
    assert envadmin.read_env_file(cfg / "cargo.env") == {}


def test_save_without_env_file_configured_is_409(client, monkeypatch):
    monkeypatch.delenv("CARGO_ENV_FILE")
    assert client.put("/admin/api/env", headers=AUTH, json={"set": {"SI_MODEL": "m"}}).status_code == 409


def test_restart_signal_only_when_asked_and_changed(client, cfg):
    sig = cfg / "restart.signal"
    client.put("/admin/api/env", headers=AUTH, json={"set": {"SI_MODEL": "m"}, "restart": False})
    assert not sig.exists()
    r = client.put("/admin/api/env", headers=AUTH, json={"set": {"SI_MODEL": "m"}, "restart": True})
    assert r.json()["restart"] == "skipped" and not sig.exists()  # nothing changed
    r = client.put("/admin/api/env", headers=AUTH, json={"set": {"SI_MODEL": "m2"}, "restart": True})
    assert r.json()["restart"] == "scheduled" and sig.exists()


def test_restart_not_configured(client, monkeypatch):
    monkeypatch.delenv("CARGO_RESTART_SIGNAL")
    r = client.put("/admin/api/env", headers=AUTH, json={"set": {"SI_MODEL": "m"}, "restart": True})
    assert r.json()["restart"] == "not-configured"


def test_audit_log_has_actor_and_no_secret(client, cfg):
    client.put("/admin/api/env", headers=basic("anna") | {"X-Admin-Request": "1"},
               json={"set": {"SI_API_KEY": SECRET, "SI_MODEL": "m"}})
    entries = client.get("/admin/api/audit", headers=AUTH).json()["entries"]
    assert {(e["actor"], e["action"], e["name"]) for e in entries} == {("anna", "env.set", "SI_API_KEY"), ("anna", "env.set", "SI_MODEL")}
    secret_entry = next(e for e in entries if e["name"] == "SI_API_KEY")
    assert secret_entry["secret"] is True and "new" not in secret_entry and "old" not in secret_entry
    assert stat.S_IMODE((cfg / "admin-audit.log").stat().st_mode) == 0o600


# --- feature flags ---

def mk(client, key="new-section", **kw):
    return client.post("/admin/api/flags", headers=AUTH, json={"key": key, **kw})


def test_public_flags_lists_enabled_keys_only(client):
    assert client.get("/api/flags").json() == {"enabled": []}  # public, no password, no file yet
    assert mk(client, "on-flag", enabled=True, description="secret note").status_code == 201
    assert mk(client, "off-flag", enabled=False).status_code == 201
    r = client.get("/api/flags")
    assert r.json() == {"enabled": ["on-flag"]}
    assert "off-flag" not in r.text and "secret note" not in r.text


def test_toggle_is_visible_immediately(client):
    mk(client, "x", enabled=False)
    assert client.get("/api/flags").json()["enabled"] == []
    client.put("/admin/api/flags/x", headers=AUTH, json={"enabled": True})
    assert client.get("/api/flags").json()["enabled"] == ["x"]
    client.put("/admin/api/flags/x", headers=AUTH, json={"enabled": False})
    assert client.get("/api/flags").json()["enabled"] == []


def test_flag_crud_and_errors(client, cfg):
    assert mk(client, "a", enabled=True, description="d", rollout_percent=50).json()["updated_by"] == "ivan"
    assert mk(client, "a").status_code == 409
    assert mk(client, "Bad Key").status_code == 400
    assert mk(client, "b", rollout_percent=101).status_code == 400
    assert client.put("/admin/api/flags/nope", headers=AUTH, json={}).status_code == 404
    listed = client.get("/admin/api/flags", headers=AUTH).json()["flags"]
    assert [f["key"] for f in listed] == ["a"] and listed[0]["rollout_percent"] == 50
    assert client.delete("/admin/api/flags/a", headers=AUTH).status_code == 200
    assert client.delete("/admin/api/flags/a", headers=AUTH).status_code == 404
    assert json.loads((cfg / "flags.json").read_text()) == {}


def test_flags_file_format_mode_and_atomic(client, cfg):
    mk(client, "a", enabled=True, description="d")
    path = cfg / "flags.json"
    assert stat.S_IMODE(path.stat().st_mode) == 0o600
    data = json.loads(path.read_text())
    assert set(data["a"]) == {"enabled", "description", "rollout_percent", "updated_at", "updated_by"}
    assert not [p for p in cfg.iterdir() if p.name.endswith(".tmp")]


def test_flag_helper_rereads_file_on_mtime_change(cfg):
    path = cfg / "flags.json"
    assert flags.flag("x") is False and flags.flag("x", default=True) is True
    path.write_text(json.dumps({"x": {"enabled": True}}))
    assert flags.flag("x") is True
    time.sleep(0.01)
    path.write_text(json.dumps({"x": {"enabled": False, "rollout_percent": 100}}))
    os.utime(path, ns=(time.time_ns(), time.time_ns() + 5_000_000))
    assert flags.flag("x") is False


def test_flag_helper_survives_broken_file(cfg):
    path = cfg / "flags.json"
    path.write_text(json.dumps({"x": {"enabled": True}}))
    assert flags.flag("x") is True
    path.write_text("{not json")
    assert flags.flag("x") is True  # last good data


def test_rollout_percent_is_stable_per_subject(cfg):
    (cfg / "flags.json").write_text(json.dumps({"half": {"enabled": True, "rollout_percent": 50},
                                                "none": {"enabled": True, "rollout_percent": 0},
                                                "all": {"enabled": True, "rollout_percent": 100}}))
    assert flags.flag("half") is False  # no subject: not part of a partial rollout
    users = [f"u{i}" for i in range(400)]
    on = [u for u in users if flags.flag("half", u)]
    assert 140 < len(on) < 260
    assert on == [u for u in users if flags.flag("half", u)]
    assert not any(flags.flag("none", u) for u in users) and all(flags.flag("all", u) for u in users)
    assert flags.enabled_keys("u1") == sorted(k for k in ("all",) + (("half",) if flags.flag("half", "u1") else ()))


def test_public_flags_with_uid_applies_rollout(client, cfg):
    mk(client, "half", enabled=True, rollout_percent=50)
    users = [f"u{i}" for i in range(60)]
    got = {u: "half" in client.get("/api/flags", params={"uid": u}).json()["enabled"] for u in users}
    assert any(got.values()) and not all(got.values())
    assert "half" not in client.get("/api/flags").json()["enabled"]


def test_flags_not_configured_is_409_on_write(client, monkeypatch):
    monkeypatch.delenv("CARGO_FLAGS_FILE")
    assert mk(client).status_code == 409
    assert client.get("/api/flags").json() == {"enabled": []}
