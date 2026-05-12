(() => {
  const clamp = (value, min = 0, max = 1) => Math.min(Math.max(value, min), max);

  const initialize = () => {
    const root = document.querySelector("[data-robotics-parallax]");

    if (!root) {
      return;
    }

    if (root.dataset.roboticsParallaxReady === "true") {
      return;
    }

    root.dataset.roboticsParallaxReady = "true";

    let ticking = false;

    const update = () => {
      const distance = Math.max(root.offsetHeight - window.innerHeight, 1);
      const progress = clamp(-root.getBoundingClientRect().top / distance);
      const dim = clamp((progress - 0.34) / 0.34);
      const solid = clamp((progress - 0.62) / 0.24);
      const content = clamp(1 - progress / 0.54);

      root.style.setProperty("--robotics-scroll", progress.toFixed(4));
      root.style.setProperty("--robotics-far-y", `${(-7 * progress).toFixed(3)}vh`);
      root.style.setProperty("--robotics-mid-y", `${(-21 * progress).toFixed(3)}vh`);
      root.style.setProperty("--robotics-grid-y", `${(-46 * progress).toFixed(3)}vh`);
      root.style.setProperty("--robotics-near-y", `${(-68 * progress).toFixed(3)}vh`);
      root.style.setProperty("--robotics-title-y", `${(-17 * progress).toFixed(3)}vh`);
      root.style.setProperty("--robotics-star-x", `${(-8 * progress).toFixed(3)}vw`);
      root.style.setProperty("--robotics-nebula-x", `${(-4 * progress).toFixed(3)}vw`);
      root.style.setProperty("--robotics-aurora-x", `${(10 * progress).toFixed(3)}vw`);
      root.style.setProperty("--robotics-moon-y", `${(-12 * progress).toFixed(3)}vh`);
      root.style.setProperty("--robotics-shade-opacity", dim.toFixed(4));
      root.style.setProperty("--robotics-solid-opacity", solid.toFixed(4));
      root.style.setProperty("--robotics-content-opacity", content.toFixed(4));
      root.style.setProperty("--robotics-scene-scale", (1 + progress * 0.025).toFixed(4));
      root.style.setProperty("--robotics-robot-scale", (1 - progress * 0.08).toFixed(4));
    };

    const requestUpdate = () => {
      if (ticking) {
        return;
      }

      ticking = true;
      window.requestAnimationFrame(() => {
        update();
        ticking = false;
      });
    };

    window.addEventListener("scroll", requestUpdate, { passive: true });
    window.addEventListener("resize", requestUpdate);
    requestUpdate();
  };

  if (typeof document$ !== "undefined") {
    document$.subscribe(initialize);
  } else if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initialize, { once: true });
  } else {
    initialize();
  }
})();
