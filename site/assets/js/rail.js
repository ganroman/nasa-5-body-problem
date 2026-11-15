// Marks the rail dot of the scene that fills the screen.

const links = new Map([...document.querySelectorAll(".rail a")].map((a) => [a.hash.slice(1), a]));

const observer = new IntersectionObserver(
  (entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        links.forEach((link, id) => {
          if (id === entry.target.id) link.setAttribute("aria-current", "true");
          else link.removeAttribute("aria-current");
        });
      }
    }
  },
  { threshold: 0.5 },
);

links.forEach((_, id) => {
  const scene = document.getElementById(id);
  if (scene) observer.observe(scene);
});
