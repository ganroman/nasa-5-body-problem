const ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

class Raw {
  constructor(value) {
    this.value = value;
  }
}

export const raw = (value) => new Raw(value);

const render = (value) => {
  if (value instanceof Raw) return value.value;
  if (Array.isArray(value)) return value.map(render).join('');
  if (value === null || value === undefined || value === false) return '';
  return String(value).replace(/[&<>"']/g, (char) => ESCAPES[char]);
};

/** Tagged template: every interpolated value is escaped unless it came from raw() or another html``. */
export const html = (strings, ...values) =>
  new Raw(strings.reduce((out, chunk, index) => out + chunk + (index < values.length ? render(values[index]) : ''), ''));

export const toHtml = render;
