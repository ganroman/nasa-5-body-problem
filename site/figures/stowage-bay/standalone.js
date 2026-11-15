const root = document.querySelector('[data-figure="stowage-bay"]');
const figure = mount(root);
const form = document.querySelector("[data-dev]");
const placeList = JSON.parse(document.querySelector("[data-places]").textContent);
form.querySelector("[data-flags]").innerHTML = placeList.map(({ id, label }) => `<label><input type="checkbox" name="flag" value="${id}"> ${label}</label>`).join(" ");

const typed = (name) => {
  const value = form.elements[name].value.trim();
  return value === "" || Number.isNaN(Number(value)) ? null : Number(value);
};
function apply() {
  const flags = Object.fromEntries(placeList.map(({ id }) => [id, form.querySelector(`[name=flag][value=${id}]`).checked ? "flag" : "none"]));
  figure.set({ env: { label: form.elements.label.value.trim() || null, o2_percent: typed("o2"), pressure_kpa: typed("pressure") }, flags });
}
form.addEventListener("submit", (event) => {
  event.preventDefault();
  apply();
});
form.querySelector("[data-unknown]").addEventListener("click", () => {
  form.elements.o2.value = "";
  form.elements.pressure.value = "";
  apply();
});
root.addEventListener("figure:select", (event) => console.info("figure:select", event.detail));
