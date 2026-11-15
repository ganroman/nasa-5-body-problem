// Filters the shelf cards by evidence status. The bar is hidden in the markup and shown here,
// so without JavaScript every card stays visible.

const bar = document.querySelector("[data-shelf-filter]");

if (bar) {
  const items = [...document.querySelectorAll("[data-shelf] > [data-status]")];
  const buttons = [...bar.querySelectorAll("[data-filter]")];
  const empty = document.querySelector("[data-shelf-empty]");
  const status = document.querySelector("[data-shelf-status]");

  const apply = (value) => {
    for (const item of items) item.hidden = value !== "all" && item.dataset.status !== value;
    for (const button of buttons) button.setAttribute("aria-pressed", String(button.dataset.filter === value));
    const shown = items.filter((item) => !item.hidden).length;
    empty.hidden = shown > 0;
    status.textContent = `${shown} of ${items.length} stories shown`;
  };

  bar.addEventListener("click", (event) => {
    const button = event.target.closest("[data-filter]");
    if (button) apply(button.dataset.filter);
  });
  bar.hidden = false;
}
