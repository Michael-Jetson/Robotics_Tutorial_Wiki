(() => {
  const DEFAULT_CONFIG = {
    enabled: false,
    mode: "mixed",
    initial_delay_seconds: 4,
    interval_seconds: 16,
    duration_seconds: 6.4,
    title: "Robotics Tutorial",
    subtitle: "智能机器人教学与工程实践",
    slogan: "体系化学习，工程化成长",
    left: "深耕机器人技术",
    right: "共建智能未来",
    center: "Robotics Tutorial",
  };

  const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
  const random = (min, max) => min + Math.random() * Math.max(max - min, 0);
  const seconds = (value, fallback) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
  };
  const escapeHtml = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#39;",
  })[char]);

  let root;
  let showTimer;
  let hideTimer;
  let modeIndex = 0;
  let initializedLocation = "";

  const readConfig = () => {
    const node = document.getElementById("robotics-company-promo-config");

    if (!node) {
      return DEFAULT_CONFIG;
    }

    try {
      return { ...DEFAULT_CONFIG, ...JSON.parse(node.textContent || "{}") };
    } catch {
      return DEFAULT_CONFIG;
    }
  };

  const clearTimers = () => {
    window.clearTimeout(showTimer);
    window.clearTimeout(hideTimer);
  };

  const destroy = () => {
    clearTimers();

    if (root) {
      root.remove();
      root = undefined;
    }
  };

  const createParticle = () => {
    const particle = document.createElement("span");
    const angle = random(0, Math.PI * 2);
    const distance = random(72, 168);

    particle.style.setProperty("--promo-particle-x", `${Math.cos(angle) * distance}px`);
    particle.style.setProperty("--promo-particle-y", `${Math.sin(angle) * distance}px`);
    particle.style.setProperty("--promo-particle-delay", `${random(0, 0.34).toFixed(2)}s`);
    particle.style.setProperty("--promo-particle-size", `${random(4, 9).toFixed(1)}px`);

    return particle;
  };

  const chooseMode = (mode) => {
    if (mode === "mixed") {
      modeIndex += 1;
      return modeIndex % 2 === 0 ? "couplet" : "banner";
    }

    return mode === "couplet" ? "couplet" : "banner";
  };

  const placeRoot = () => {
    if (!root) {
      return;
    }

    const side = Math.random() > 0.5 ? "right" : "left";
    const edge = Math.round(random(18, 74));
    const header = document.querySelector(".md-header");
    const headerHeight = header?.getBoundingClientRect().height || 64;
    const rootHeight = root.offsetHeight || 184;
    const burstPadding = 116;
    const minTop = headerHeight + burstPadding;
    const maxTop = Math.max(minTop, window.innerHeight - rootHeight - burstPadding);
    const top = Math.round(random(minTop, maxTop));

    root.classList.toggle("company-promo--left", side === "left");
    root.classList.toggle("company-promo--right", side === "right");
    root.style.setProperty("--promo-edge", `${edge}px`);
    root.style.setProperty("--promo-top", `${clamp(top, minTop, maxTop)}px`);
  };

  const render = (config) => {
    root = document.createElement("aside");
    root.className = "company-promo";
    root.setAttribute("aria-live", "polite");
    root.setAttribute("aria-label", config.title);
    root.innerHTML = `
      <div class="company-promo__burst" aria-hidden="true"></div>
      <div class="company-promo__panel">
        <button class="company-promo__close" type="button" aria-label="关闭宣传提示">×</button>
        <div class="company-promo__banner">
          <span class="company-promo__kicker">${escapeHtml(config.center)}</span>
          <strong class="company-promo__title">${escapeHtml(config.title)}</strong>
          <span class="company-promo__subtitle">${escapeHtml(config.subtitle)}</span>
          <span class="company-promo__slogan">${escapeHtml(config.slogan)}</span>
        </div>
        <div class="company-promo__couplet" aria-hidden="true">
          <span class="company-promo__couplet-side">${escapeHtml(config.left)}</span>
          <strong class="company-promo__couplet-center">${escapeHtml(config.center)}</strong>
          <span class="company-promo__couplet-side">${escapeHtml(config.right)}</span>
        </div>
      </div>
    `;

    const burst = root.querySelector(".company-promo__burst");
    for (let index = 0; index < 34; index += 1) {
      burst.append(createParticle());
    }

    root.querySelector(".company-promo__close").addEventListener("click", () => {
      root.classList.remove("is-active");
      clearTimers();
      showTimer = window.setTimeout(() => show(config), seconds(config.interval_seconds, 16) * 1000);
    });

    document.body.append(root);
  };

  const show = (config) => {
    if (!root || document.hidden) {
      showTimer = window.setTimeout(() => show(config), Number(config.interval_seconds) * 1000);
      return;
    }

    const mode = chooseMode(config.mode);

    window.clearTimeout(hideTimer);
    root.classList.remove("is-active", "company-promo--banner", "company-promo--couplet");
    root.classList.add(`company-promo--${mode}`);
    placeRoot();
    void root.offsetWidth;

    window.requestAnimationFrame(() => {
      root.classList.add("is-active");
    });

    hideTimer = window.setTimeout(() => {
      root.classList.remove("is-active");
      showTimer = window.setTimeout(() => show(config), seconds(config.interval_seconds, 16) * 1000);
    }, seconds(config.duration_seconds, 6.4) * 1000);
  };

  const initialize = () => {
    const config = readConfig();
    const currentLocation = `${window.location.pathname}${window.location.search}`;

    if (initializedLocation === currentLocation && root) {
      return;
    }

    initializedLocation = currentLocation;
    destroy();

    if (!config.enabled || document.querySelector("[data-robotics-parallax]")) {
      return;
    }

    render(config);
    showTimer = window.setTimeout(() => show(config), seconds(config.initial_delay_seconds, 4) * 1000);
  };

  if (typeof document$ !== "undefined") {
    document$.subscribe(initialize);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initialize, { once: true });
  } else {
    initialize();
  }
})();
