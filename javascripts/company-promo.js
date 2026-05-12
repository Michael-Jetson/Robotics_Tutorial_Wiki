(() => {
  const DEFAULT_CONFIG = {
    enabled: false,
    mode: "rocket",
    initial_delay_seconds: 4,
    interval_seconds: 16,
    duration_seconds: 7.2,
    title: "Robotics Tutorial",
    subtitle: "智能机器人教学与工程实践",
    slogan: "体系化学习，工程化成长",
    left: "深耕机器人技术",
    right: "共建智能未来",
    center: "Robotics Tutorial",
    firework_lines: [
      "达妙科技",
    ],
  };
  const MIXED_MODES = ["rocket", "banner", "couplet"];
  const AVAILABLE_MODES = new Set([...MIXED_MODES, "firework"]);

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
  const asLines = (value, fallback) => {
    const source = Array.isArray(value) ? value : String(value ?? "").split("|");
    const lines = source.map((line) => String(line).trim()).filter(Boolean);
    return (lines.length ? lines : fallback).slice(0, 3);
  };

  let root;
  let showTimer;
  let hideTimer;
  let canvasFrame;
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

  const clearCanvasAnimation = () => {
    window.cancelAnimationFrame(canvasFrame);
    canvasFrame = undefined;

    const canvas = root?.querySelector(".company-promo__firework-canvas");
    const context = canvas?.getContext("2d");
    if (canvas && context) {
      context.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  const destroy = () => {
    clearTimers();
    clearCanvasAnimation();

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
      const selected = MIXED_MODES[modeIndex % MIXED_MODES.length];
      modeIndex += 1;
      return selected;
    }

    if (mode === "firework") {
      return "rocket";
    }

    return AVAILABLE_MODES.has(mode) ? mode : "banner";
  };

  const placeRoot = () => {
    if (!root) {
      return;
    }

    const side = Math.random() > 0.5 ? "right" : "left";
    const isRocket = root.classList.contains("company-promo--rocket");
    const edge = Math.round(isRocket ? random(28, 88) : random(18, 74));
    const header = document.querySelector(".md-header");
    const headerHeight = header?.getBoundingClientRect().height || 64;
    const rootHeight = root.offsetHeight || 184;
    const burstPadding = isRocket ? 28 : 116;
    const minTop = headerHeight + burstPadding;
    const maxTop = Math.max(minTop, window.innerHeight - rootHeight - burstPadding);
    const top = Math.round(random(minTop, maxTop));

    root.classList.toggle("company-promo--left", side === "left");
    root.classList.toggle("company-promo--right", side === "right");
    root.style.setProperty("--promo-edge", `${edge}px`);
    root.style.setProperty("--promo-top", `${clamp(top, minTop, maxTop)}px`);
  };

  const sizeCanvas = (canvas, context) => {
    const rect = canvas.getBoundingClientRect();
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    const width = Math.max(Math.round(rect.width), 1);
    const height = Math.max(Math.round(rect.height), 1);
    const scaledWidth = Math.round(width * ratio);
    const scaledHeight = Math.round(height * ratio);

    if (canvas.width !== scaledWidth || canvas.height !== scaledHeight) {
      canvas.width = scaledWidth;
      canvas.height = scaledHeight;
    }

    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    return { width, height };
  };

  const drawGlowDot = (context, x, y, radius, color, alpha = 1) => {
    const gradient = context.createRadialGradient(x, y, 0, x, y, radius);
    gradient.addColorStop(0, `rgba(255, 255, 255, ${0.95 * alpha})`);
    gradient.addColorStop(0.18, color.replace("ALPHA", `${0.9 * alpha}`));
    gradient.addColorStop(1, color.replace("ALPHA", "0"));
    context.fillStyle = gradient;
    context.beginPath();
    context.arc(x, y, radius, 0, Math.PI * 2);
    context.fill();
  };

  const startFireworkCanvas = (config) => {
    clearCanvasAnimation();

    if (!root?.classList.contains("company-promo--rocket")) {
      return;
    }

    const canvas = root.querySelector(".company-promo__firework-canvas");
    const context = canvas?.getContext("2d");
    if (!canvas || !context) {
      return;
    }

    const colors = [
      "rgba(255, 218, 106, ALPHA)",
      "rgba(255, 116, 91, ALPHA)",
      "rgba(113, 247, 232, ALPHA)",
      "rgba(134, 177, 255, ALPHA)",
      "rgba(255, 143, 211, ALPHA)",
      "rgba(255, 255, 255, ALPHA)",
    ];
    const start = performance.now();
    const animationDuration = seconds(config.duration_seconds, 7.2);
    let particles;

    const createBurst = (width, height) => {
      const centerX = width * 0.5;
      const centerY = height * 0.34;
      const result = [];
      const total = 260;

      for (let index = 0; index < total; index += 1) {
        const angle = (Math.PI * 2 * index) / total + random(-0.035, 0.035);
        const speed = random(135, 345) * (index % 11 === 0 ? 1.25 : 1);
        result.push({
          x: centerX,
          y: centerY,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          radius: random(1.2, 3.4),
          color: colors[index % colors.length],
          delay: random(0, 0.18),
          life: random(1.85, 3.1),
          glitter: index % 4 === 0,
        });
      }

      for (let index = 0; index < 70; index += 1) {
        const angle = random(0, Math.PI * 2);
        const speed = random(45, 145);
        result.push({
          x: centerX,
          y: centerY,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          radius: random(0.8, 2.1),
          color: colors[(index + 2) % colors.length],
          delay: random(0.12, 0.55),
          life: random(2.3, 3.6),
          glitter: true,
        });
      }

      return result;
    };

    const drawIgnition = (time, width, height) => {
      const baseX = width * 0.5;
      const baseY = height - 44;
      const sparkCount = 24;

      for (let index = 0; index < sparkCount; index += 1) {
        const phase = (time * 10 + index * 0.37) % 1;
        const spread = (index - sparkCount / 2) * 0.9;
        const x = baseX + Math.sin(index * 4.1 + time * 20) * 16 + spread;
        const y = baseY - phase * 42 + Math.cos(index + time * 9) * 4;
        const alpha = Math.max(0, 1 - phase) * clamp(1 - time / 0.9, 0, 1);
        drawGlowDot(context, x, y, random(4, 8), colors[index % colors.length], alpha);
      }
    };

    const drawRocket = (time, width, height) => {
      const progress = clamp((time - 0.68) / 1.42, 0, 1);
      if (progress <= 0 || progress >= 1) {
        return;
      }

      const eased = 1 - Math.pow(1 - progress, 3);
      const startX = width * 0.5;
      const startY = height - 48;
      const endX = width * 0.5 + Math.sin(time * 5.2) * 12;
      const endY = height * 0.34;
      const x = startX + (endX - startX) * eased;
      const y = startY + (endY - startY) * eased;

      context.save();
      context.globalCompositeOperation = "lighter";
      context.lineCap = "round";
      for (let index = 0; index < 18; index += 1) {
        const tail = index / 18;
        const alpha = (1 - tail) * 0.58;
        context.strokeStyle = `rgba(255, ${Math.round(218 - index * 5)}, 102, ${alpha})`;
        context.lineWidth = Math.max(1.1, 7 - index * 0.28);
        context.beginPath();
        context.moveTo(x, y + index * 5.3);
        context.lineTo(x + Math.sin(time * 12 + index) * 4, y + index * 9.4 + 15);
        context.stroke();
      }
      drawGlowDot(context, x, y, 20, "rgba(255, 219, 112, ALPHA)", 1);
      drawGlowDot(context, x, y, 9, "rgba(255, 112, 78, ALPHA)", 1);
      context.restore();
    };

    const drawBurst = (time, width, height) => {
      const burstTime = time - 2.08;
      if (burstTime < 0) {
        return;
      }

      particles ||= createBurst(width, height);
      context.save();
      context.globalCompositeOperation = "lighter";

      for (const particle of particles) {
        const local = burstTime - particle.delay;
        if (local <= 0 || local >= particle.life) {
          continue;
        }

        const drag = (1 - Math.exp(-local * 1.22)) / 1.22;
        const alpha = Math.pow(1 - local / particle.life, 1.35);
        const twinkle = particle.glitter ? 0.55 + Math.sin(local * 28 + particle.vx) * 0.35 : 1;
        const x = particle.x + particle.vx * drag;
        const y = particle.y + particle.vy * drag + local * local * 42;
        const previousX = x - particle.vx * 0.026;
        const previousY = y - particle.vy * 0.026;
        const effectiveAlpha = clamp(alpha * twinkle, 0, 1);

        context.strokeStyle = particle.color.replace("ALPHA", `${0.42 * effectiveAlpha}`);
        context.lineWidth = particle.radius;
        context.lineCap = "round";
        context.beginPath();
        context.moveTo(previousX, previousY);
        context.lineTo(x, y);
        context.stroke();

        drawGlowDot(context, x, y, particle.radius * 5.2, particle.color, effectiveAlpha);
      }

      if (burstTime < 0.42) {
        const ringAlpha = 1 - burstTime / 0.42;
        context.strokeStyle = `rgba(255, 238, 178, ${0.82 * ringAlpha})`;
        context.lineWidth = 1.6;
        context.beginPath();
        context.arc(width * 0.5, height * 0.34, 170 * burstTime, 0, Math.PI * 2);
        context.stroke();
      }

      context.restore();
    };

    const draw = (now) => {
      const time = (now - start) / 1000;
      const { width, height } = sizeCanvas(canvas, context);
      context.clearRect(0, 0, width, height);

      if (time < 1.1) {
        drawIgnition(time, width, height);
      }

      drawRocket(time, width, height);
      drawBurst(time, width, height);

      if (time < animationDuration && root?.classList.contains("is-active")) {
        canvasFrame = window.requestAnimationFrame(draw);
      }
    };

    canvasFrame = window.requestAnimationFrame(draw);
  };

  const render = (config) => {
    const fireworkLines = asLines(config.firework_lines, DEFAULT_CONFIG.firework_lines)
      .map((line) => `<span>${escapeHtml(line)}</span>`)
      .join("");

    root = document.createElement("aside");
    root.className = "company-promo";
    root.setAttribute("aria-live", "polite");
    root.setAttribute("aria-label", config.title);
    root.innerHTML = `
      <div class="company-promo__burst" aria-hidden="true"></div>
      <div class="company-promo__rocket-stage" aria-hidden="true">
        <canvas class="company-promo__firework-canvas"></canvas>
        <div class="company-promo__ignition">
          <span class="company-promo__launch-pad"></span>
          <span class="company-promo__fuse"></span>
          <span class="company-promo__flame"></span>
        </div>
      </div>
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
        <div class="company-promo__firework">
          ${fireworkLines}
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
      clearCanvasAnimation();
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
    clearCanvasAnimation();
    root.classList.remove("is-active", "company-promo--banner", "company-promo--couplet", "company-promo--rocket");
    root.classList.add(`company-promo--${mode}`);
    placeRoot();
    void root.offsetWidth;

    window.requestAnimationFrame(() => {
      root.classList.add("is-active");
      if (mode === "rocket") {
        startFireworkCanvas(config);
      }
    });

    hideTimer = window.setTimeout(() => {
      root.classList.remove("is-active");
      clearCanvasAnimation();
      showTimer = window.setTimeout(() => show(config), seconds(config.interval_seconds, 16) * 1000);
    }, seconds(config.duration_seconds, 7.2) * 1000);
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
