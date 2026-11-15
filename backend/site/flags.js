/* Feature flags for the frontend. Include with <script src="/flags.js"></script>.
 *
 *   CargoFlags.ready.then(() => { if (CargoFlags.isEnabled("new-section")) { ... } });
 *   <div data-flag="new-section" hidden>...</div>   shown automatically when the flag is on
 *
 * The flag list comes from GET /api/flags (enabled keys only). A stable random id in localStorage
 * lets partial rollouts (rollout_percent < 100) stay the same for one browser.
 */
(function () {
  var uid = null;
  try {
    uid = localStorage.getItem("cargo_uid");
    if (!uid) {
      uid = (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : String(Math.random()).slice(2) + Date.now();
      localStorage.setItem("cargo_uid", uid);
    }
  } catch (e) { /* storage blocked: only 100% flags apply */ }

  var enabled = {};
  var ready = fetch("/api/flags" + (uid ? "?uid=" + encodeURIComponent(uid) : ""), { cache: "no-store" })
    .then(function (r) { return r.ok ? r.json() : { enabled: [] }; })
    .catch(function () { return { enabled: [] }; })
    .then(function (d) {
      enabled = {};
      (d.enabled || []).forEach(function (k) { enabled[k] = true; });
      apply();
    });

  function apply() {
    document.querySelectorAll("[data-flag]").forEach(function (el) {
      el.hidden = !enabled[el.getAttribute("data-flag")];
    });
  }

  document.addEventListener("DOMContentLoaded", apply);
  window.CargoFlags = {
    ready: ready,
    isEnabled: function (key) { return !!enabled[key]; },
    all: function () { return Object.keys(enabled); },
    apply: apply,
  };
})();
