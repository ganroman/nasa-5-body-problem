// <figure-host name="instrument"> loads assets/figures/<name>/{figure.html, figure.css, figure.js}.
// Contract for figure.js: export mount(root) returning { set(state), destroy() }, and dispatch a bubbling
// CustomEvent "figure:select" with detail { id } when the reader picks something.
// The host forwards its `state` property to set() and re-dispatches "figure:select" from itself.

const FIGURES = new URL("../figures/", import.meta.url);
const STATUS_TEXT = { loading: "loading", missing: "in preparation", error: "could not load" };
const stylesheets = new Set();

function addStylesheet(href) {
  if (stylesheets.has(href)) return;
  stylesheets.add(href);
  document.head.append(Object.assign(document.createElement("link"), { rel: "stylesheet", href }));
}

class FigureHost extends HTMLElement {
  #figure = null;
  #state;
  #stage = null;

  connectedCallback() {
    this.#showFrame("loading");
    this.#load(this.getAttribute("name"));
  }

  disconnectedCallback() {
    this.#figure?.destroy();
    this.#figure = null;
  }

  get state() {
    return this.#state;
  }

  set state(value) {
    this.#state = value;
    this.#figure?.set(value);
  }

  #showFrame(status) {
    this.dataset.state = status;
    let frame = this.querySelector(":scope > .figure-frame");
    if (!frame) {
      frame = document.createElement("div");
      frame.className = "figure-frame";
      this.append(frame);
    }
    const name = this.getAttribute("name");
    frame.textContent = "";
    frame.append(`Figure: ${name}`, Object.assign(document.createElement("span"), { textContent: STATUS_TEXT[status] }));
  }

  async #load(name) {
    const base = new URL(`${name}/`, FIGURES);
    try {
      const response = await fetch(new URL("figure.html", base));
      if (!response.ok) return this.#showFrame("missing");
      const markup = await response.text();
      addStylesheet(new URL("figure.css", base).href);
      const { mount } = await import(new URL("figure.js", base).href);

      this.#stage = Object.assign(document.createElement("div"), { className: "figure-stage", innerHTML: markup });
      this.#stage.addEventListener("figure:select", (event) => {
        event.stopPropagation();
        this.dispatchEvent(new CustomEvent("figure:select", { bubbles: true, detail: event.detail }));
      });
      this.append(this.#stage);
      this.#figure = mount(this.#stage);
      if (this.#state !== undefined) this.#figure.set(this.#state);
      this.dataset.state = "ready";
    } catch (error) {
      console.warn(`figure-host: "${name}" could not be loaded`, error);
      this.#stage?.remove();
      this.#showFrame("error");
    }
  }
}

customElements.define("figure-host", FigureHost);
