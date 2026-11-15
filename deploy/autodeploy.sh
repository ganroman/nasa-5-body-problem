#!/usr/bin/env bash
# Autodeploy of cargo-passport (origin/main) -> thing-cargo-api. Run by thing-cargo-autodeploy.service (root, every 60 s).
# Pattern: /opt/radical-live/autodeploy.sh. git, uv, alembic and gh run as user agent; restarts and the DB dump as root/postgres.
# A commit is taken only when every GitHub check run of it is green. Steps: pg_dump -> checkout -> uv sync --frozen -> alembic upgrade head -> restart -> /health + /docs.
# A failed step puts the old commit back (migrations are NOT rolled back: the log says so) and posts one thing.event cargo.failed per sha.
# Secrets are never printed: the DB URL is read from /etc/thing/credentials/CARGO_DATABASE_URL and handed to child processes through the environment.
# Test hook: CARGO_DEPLOY_SHA=<sha present in the clone> deploys that commit and skips the GitHub checks (used to rehearse a failed start).
set -uo pipefail
REPO_SLUG=ganroman/nasa-5-body-problem
CLONE=${CARGO_CLONE:-/home/agent/cargo-deploy}
STATE=${CARGO_STATE:-/var/lib/cargo-deploy}
LOG=$STATE/deploy.log
BACKUPS=/var/backups/cargo
CRED=/etc/thing/credentials/CARGO_DATABASE_URL
UNIT=thing-cargo-api.service
PORT=8220
SOCK=${QOS_SOCKET:-/run/thing/qos.sock}
AS=(runuser -u agent --)
exec 9>/run/cargo-autodeploy.lock
flock -n 9 || exit 0

mkdir -p "$STATE" "$BACKUPS"; touch "$LOG"; chown agent:agent "$LOG" 2>/dev/null || true
STEP=start
log() { printf '%s %s\n' "$(date -u +%FT%TZ)" "$*" >> "$LOG"; }
agent() { "${AS[@]}" "$@"; }
mask() { sed -E 's#(://[^:/@ ]+:)[^@ ]+@#\1***@#g'; }
# the DB URL goes to children by environment only (runuser -w keeps just these two)
with_db() { ( set -a; . "$CRED"; set +a; export DATABASE_URL DATABASE_URL_DIRECT; runuser -u agent -w DATABASE_URL,DATABASE_URL_DIRECT -- "$@" ); }

notify() { # $1 sha, $2 step; once per sha and step
  local sha=$1 step=$2 mark="$STATE/notified-${1:0:12}-$2"
  [ -e "$mark" ] && return 0
  : > "$mark"
  local tail30; tail30=$(tail -n 30 "$LOG" | mask)
  local body; body=$(python3 - "$sha" "$step" "$tail30" <<'PY'
import json, sys
sha, step, tail = sys.argv[1:4]
text = f"cargo-passport: {step} не прошёл на {sha[:8]}\n{tail}"
print(json.dumps({"kind": "thing.event", "payload": {"type": "cargo.failed", "from": "cargo-deploy", "data": {"sha": sha, "step": step, "text": text[:480]}}, "idempotency_key": f"cargo-failed-{sha}-{step}"}, ensure_ascii=False))
PY
)
  if curl -sS -m 30 --unix-socket "$SOCK" -H 'content-type: application/json' --data-binary "$body" http://x/api/queue/v1/tasks 2>>"$LOG" | grep -q '"id"'; then
    log "event cargo.failed sent ($step ${sha:0:8})"
  else
    log "event cargo.failed NOT sent ($step ${sha:0:8})"
  fi
}

health() {
  local i
  for i in $(seq 1 40); do
    if curl -sf -m 3 "http://127.0.0.1:$PORT/health" >/dev/null 2>&1 && curl -sf -m 3 -o /dev/null "http://127.0.0.1:$PORT/docs" 2>&1; then return 0; fi
    sleep 1
  done
  return 1
}
alembic_cur() { (cd "$CLONE/backend" && with_db uv run --frozen alembic current 2>/dev/null | grep -oE '^[0-9a-f]{6,}' | head -1); }

dump_db() {
  local f="$BACKUPS/cargo-$(date -u +%Y%m%dT%H%M%SZ)-${1:0:8}.sql.gz"
  runuser -u postgres -- pg_dump -d cargo 2>>"$LOG" | gzip > "$f" && [ "${PIPESTATUS[0]}" = 0 ] || { rm -f "$f"; return 1; }
  chmod 600 "$f"
  ls -1t "$BACKUPS"/cargo-*.sql.gz | tail -n +6 | xargs -r rm -f
  log "dump ok $(basename "$f")"
}

apply() { # $1 sha; sets STEP
  STEP=checkout;  agent git -C "$CLONE" checkout -q --detach "$1" >>"$LOG" 2>&1 || return 1
  STEP=uv-sync;   (cd "$CLONE/backend" && agent uv sync --frozen) >>"$LOG" 2>&1 || return 1
  return 0
}
migrate_and_start() {
  STEP=migrate;   (cd "$CLONE/backend" && with_db uv run --frozen alembic upgrade head) 2>&1 | mask >>"$LOG"; [ "${PIPESTATUS[0]}" = 0 ] || return 1
  STEP=restart;   systemctl restart "$UNIT" >>"$LOG" 2>&1 || return 1
  STEP=health;    health
}

# ---------------------------------------------------------------- pick the commit
agent git -C "$CLONE" fetch -q origin main 2>>"$LOG" || { log "fetch failed"; exit 0; }
if [ -n "${CARGO_DEPLOY_SHA:-}" ]; then new=$CARGO_DEPLOY_SHA; else new=$(agent git -C "$CLONE" rev-parse origin/main) || exit 0; fi
cur=$(cat "$STATE/deployed_commit" 2>/dev/null || echo none)
[ "$new" = "$cur" ] && exit 0
[ "$new" = "$(cat "$STATE/failed_commit" 2>/dev/null)" ] && exit 0   # this commit already failed: wait for a new one

if [ -z "${CARGO_DEPLOY_SHA:-}" ]; then
  checks=$(agent gh api "repos/$REPO_SLUG/commits/$new/check-runs?per_page=100" 2>>"$LOG") || { log "gh check-runs failed ${new:0:8}"; exit 0; }
  verdict=$(printf '%s' "$checks" | python3 -c '
import json, sys
runs = json.load(sys.stdin).get("check_runs", [])
if not runs: print("none"); sys.exit()
bad = [r for r in runs if r["status"] == "completed" and r["conclusion"] in ("failure", "cancelled", "timed_out", "action_required", "startup_failure", "stale")]
wait = [r for r in runs if r["status"] != "completed"]
print("red" if bad else "wait" if wait else "green")')
  case "$verdict" in
    green) ;;
    wait) exit 0 ;;
    none)
      age=$(( $(date +%s) - $(agent git -C "$CLONE" log -1 --format=%ct "$new") ))
      if [ "$age" -gt 900 ]; then log "no check runs for ${new:0:8} after ${age}s"; notify "$new" ci-missing; fi
      exit 0 ;;
    red)
      log "CI red on ${new:0:8}: $(agent git -C "$CLONE" log -1 --format=%s "$new" | cut -c1-100)"
      echo "$new" > "$STATE/failed_commit"
      notify "$new" ci
      exit 0 ;;
    *) log "unknown verdict '$verdict' for ${new:0:8}"; exit 0 ;;
  esac
fi

log "deploy ${cur:0:8} -> ${new:0:8}: $(agent git -C "$CLONE" log -1 --format=%s "$new" 2>/dev/null | cut -c1-100)"
mig_before=$(alembic_cur)
STEP=dump
if dump_db "$new" && apply "$new" && migrate_and_start; then
  echo "$new" > "$STATE/deployed_commit.new" && mv "$STATE/deployed_commit.new" "$STATE/deployed_commit"
  rm -f "$STATE/failed_commit"
  log "ok ${new:0:8} (migration head $(alembic_cur))"
  exit 0
fi

failed_step=$STEP
echo "$new" > "$STATE/failed_commit"
log "FAIL ${new:0:8} at step $failed_step, rollback to ${cur:0:8}"
mig_after=$(alembic_cur)
if [ "$cur" != none ]; then
  if apply "$cur" && systemctl restart "$UNIT" && health; then
    log "rollback ok ${cur:0:8}"
  else
    log "ROLLBACK FAILED ${cur:0:8}"
  fi
fi
if [ -n "$mig_after" ] && [ "$mig_after" != "$mig_before" ]; then
  log "миграция $mig_after прошла (была $mig_before), код откатан; миграции не откатываем"
fi
notify "$new" "$failed_step"
exit 1
