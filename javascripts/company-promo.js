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
      "发来贺电",
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

    root.classList.remove("company-promo--outside-content-unavailable");

    const isRocket = root.classList.contains("company-promo--rocket");
    let side = Math.random() > 0.5 ? "right" : "left";
    let edge = Math.round(isRocket ? random(18, 42) : random(18, 74));
    const header = document.querySelector(".md-header");
    const headerHeight = header?.getBoundingClientRect().height || 64;

    if (isRocket) {
      const content = document.querySelector(".md-content__inner") || document.querySelector(".md-content");
      const contentRect = content?.getBoundingClientRect();
      const rootWidth = root.offsetWidth || 320;
      const gap = 18;

      if (contentRect && contentRect.width > 0) {
        const leftMaxEdge = contentRect.left - rootWidth - gap;
        const rightMaxEdge = window.innerWidth - contentRect.right - rootWidth - gap;
        const canUseLeft = leftMaxEdge >= 12;
        const canUseRight = rightMaxEdge >= 12;

        if (canUseLeft && canUseRight) {
          side = Math.random() > 0.5 ? "right" : "left";
        } else if (canUseRight) {
          side = "right";
        } else if (canUseLeft) {
          side = "left";
        } else {
          side = rightMaxEdge >= leftMaxEdge ? "right" : "left";
          root.classList.add("company-promo--outside-content-unavailable");
        }

        const maxEdge = side === "left" ? leftMaxEdge : rightMaxEdge;
        edge = Math.round(maxEdge >= 12 ? random(12, Math.min(maxEdge, 72)) : 12);
      }

      const top = Math.round(headerHeight + 10);
      const height = Math.round(Math.max(window.innerHeight - top - 10, 420));

      root.classList.toggle("company-promo--left", side === "left");
      root.classList.toggle("company-promo--right", side === "right");
      root.style.setProperty("--promo-edge", `${edge}px`);
      root.style.setProperty("--promo-top", `${top}px`);
      root.style.setProperty("--promo-height", `${height}px`);
      return;
    }

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
    let flightPlan;
    let particles;

    const createFlightPlan = (width, height) => {
      const launchX = width * random(0.46, 0.54);
      const launchY = height - 26;
      const burstX = width * random(0.42, 0.58);
      const burstY = random(Math.max(80, height * 0.12), Math.max(120, height * 0.42));

      root.style.setProperty("--promo-text-top", `${Math.round(burstY)}px`);

      return {
        launchX,
        launchY,
        burstX,
        burstY,
        rocketStart: 0.68,
        rocketDuration: 2.08,
        burstAt: 2.88,
      };
    };

    const ensureFlightPlan = (width, height) => {
      if (!flightPlan || Math.abs(flightPlan.canvasHeight - height) > 2 || Math.abs(flightPlan.canvasWidth - width) > 2) {
        flightPlan = {
          ...createFlightPlan(width, height),
          canvasWidth: width,
          canvasHeight: height,
        };
        particles = undefined;
      }

      return flightPlan;
    };

    const createBurst = (plan) => {
      const centerX = plan.burstX;
      const centerY = plan.burstY;
      const result = [];
      const total = 280;

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

    const drawIgnition = (time, plan) => {
      const baseX = plan.launchX;
      const baseY = plan.launchY;
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

    const drawRocket = (time, plan) => {
      const progress = clamp((time - plan.rocketStart) / plan.rocketDuration, 0, 1);
      if (progress <= 0 || progress >= 1) {
        return;
      }

      const eased = 1 - Math.pow(1 - progress, 2.4);
      const startX = plan.launchX;
      const startY = plan.launchY;
      const endX = plan.burstX;
      const endY = plan.burstY;
      const arc = Math.sin(progress * Math.PI) * 18;
      const x = startX + (endX - startX) * eased;
      const y = startY + (endY - startY) * eased;
      const wobble = Math.sin(time * 7.5) * arc;

      context.save();
      context.globalCompositeOperation = "lighter";
      context.lineCap = "round";
      for (let index = 0; index < 28; index += 1) {
        const tail = index / 28;
        const alpha = (1 - tail) * 0.64;
        context.strokeStyle = `rgba(255, ${Math.round(218 - index * 5)}, 102, ${alpha})`;
        context.lineWidth = Math.max(0.9, 7.5 - index * 0.24);
        context.beginPath();
        context.moveTo(x + wobble * 0.08, y + index * 5.8);
        context.lineTo(x + Math.sin(time * 12 + index) * 5, y + index * 10.8 + 18);
        context.stroke();
      }
      drawGlowDot(context, x + wobble * 0.08, y, 22, "rgba(255, 219, 112, ALPHA)", 1);
      drawGlowDot(context, x + wobble * 0.08, y, 9, "rgba(255, 112, 78, ALPHA)", 1);
      context.restore();
    };

    const drawBurst = (time, plan) => {
      const burstTime = time - plan.burstAt;
      if (burstTime < 0) {
        return;
      }

      particles ||= createBurst(plan);
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
        context.arc(plan.burstX, plan.burstY, 170 * burstTime, 0, Math.PI * 2);
        context.stroke();
      }

      context.restore();
    };

    const draw = (now) => {
      const time = (now - start) / 1000;
      const { width, height } = sizeCanvas(canvas, context);
      const plan = ensureFlightPlan(width, height);
      context.clearRect(0, 0, width, height);

      if (time < 1.1) {
        drawIgnition(time, plan);
      }

      drawRocket(time, plan);
      drawBurst(time, plan);

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
    root.classList.remove(
      "is-active",
      "company-promo--banner",
      "company-promo--couplet",
      "company-promo--rocket",
      "company-promo--outside-content-unavailable",
    );
    root.classList.add(`company-promo--${mode}`);
    root.toggleAttribute("aria-hidden", mode === "rocket");
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
