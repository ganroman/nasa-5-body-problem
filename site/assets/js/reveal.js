// Approach from depth: [data-reveal] elements settle onto the content plane once, when first seen.
// The CSS only hides them after this module has run, so the page reads without JavaScript.

if (!matchMedia("(prefers-reduced-motion: reduce)").matches) {
  document.documentElement.classList.add("reveal-ready");

  const observer = new IntersectionObserver(
    (entries) => {
      entries.filter((entry) => entry.isIntersecting).forEach((entry, index) => {
        entry.target.style.setProperty("--delay", `${index * 90}ms`);
        entry.target.classList.add("is-in");
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -6% 0px" },
  );

  document.querySelectorAll("[data-reveal]").forEach((el) => observer.observe(el));
}
