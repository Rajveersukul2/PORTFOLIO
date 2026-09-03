/**
 * 2026 Bleeding-Edge Cosmic Space Background Engine
 * Features:
 * - Dynamic 3D depth-layered starfield with 4-point diffraction flares
 * - Mouse inertia parallax & camera tilt
 * - Constellation connection mesh near cursor
 * - Realistic shooting stars with glowing ion ionization tails
 * - Hyperspace / Warp Drive mode (triggered by Easter Egg / Konami Code)
 * - Click stardust shockwave bursts
 */
(function () {
  // Prevent duplicate initialization
  if (document.getElementById("bg-stars-canvas")) return;

  const canvas = document.createElement("canvas");
  canvas.id = "bg-stars-canvas";
  canvas.setAttribute("aria-hidden", "true");
  canvas.style.cssText = [
    "position: fixed",
    "top: 0",
    "left: 0",
    "width: 100vw",
    "height: 100vh",
    "z-index: -1",
    "pointer-events: none",
    "background: radial-gradient(circle at 50% 20%, #0d1527 0%, #07090e 65%, #030407 100%)",
    "display: block"
  ].join(";");

  // Ensure body and html allow background to shine through
  document.documentElement.style.backgroundColor = "#07090e";
  if (document.body) {
    document.body.prepend(canvas);
  } else {
    document.addEventListener("DOMContentLoaded", () => {
      document.body.prepend(canvas);
    });
  }

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  let width = 0;
  let height = 0;
  let dpr = 1;

  // Warp mode state (for Easter Egg)
  const cosmicState = {
    warpMode: false,
    warpSpeed: 1,
    targetWarpSpeed: 1,
    nebulaIntensity: 1
  };

  // Expose global controller for Easter Eggs
  window.CosmicSpace = {
    setWarp: function (enable) {
      cosmicState.warpMode = !!enable;
      cosmicState.targetWarpSpeed = enable ? 14 : 1;
    },
    toggleWarp: function () {
      this.setWarp(!cosmicState.warpMode);
      return cosmicState.warpMode;
    },
    burst: function (x, y) {
      createBurst(x, y);
    }
  };

  // Mouse & parallax tracking
  const mouse = {
    x: 0,
    y: 0,
    targetX: 0,
    targetY: 0,
    screenX: 0,
    screenY: 0,
    isHovering: false
  };

  // Star color spectrum tailored to cyberpunk cyan aesthetic
  const starColors = [
    { r: 255, g: 255, b: 255 }, // Pure Nova White
    { r: 0, g: 255, b: 204 },   // Cyber Cyan / RAIVR Accent
    { r: 99, g: 179, b: 237 },  // Electric Ice Blue
    { r: 168, g: 85, b: 247 },  // Cosmic Violet
    { r: 236, g: 72, b: 153 },  // Radiant Magenta (Rare)
    { r: 224, g: 247, b: 250 }  // Starlight Cyan
  ];

  let stars = [];
  let shootingStars = [];
  let burstParticles = [];
  const STAR_COUNT_BASE = 160;

  class Star {
    constructor() {
      this.reset(true);
    }

    reset(initial = false) {
      this.x = initial ? Math.random() * width : (Math.random() < 0.5 ? -10 : width + 10);
      this.y = Math.random() * height;
      this.layer = Math.random(); // 0 (deep space) to 1 (foreground)
      
      // Depth-based sizing & speed
      this.baseRadius = 0.5 + Math.pow(this.layer, 2.2) * 2.6;
      this.speedX = (Math.random() - 0.5) * 0.22 * (0.3 + this.layer);
      this.speedY = -(0.06 + Math.random() * 0.18) * (0.4 + this.layer * 0.8);
      
      // Twinkle & Shine properties
      this.color = starColors[Math.floor(Math.random() * starColors.length)];
      this.alpha = 0.25 + Math.random() * 0.7;
      this.twinkleSpeed = 0.015 + Math.random() * 0.04;
      this.twinkleOffset = Math.random() * Math.PI * 2;
      
      // 4-point diffraction spike on prominent foreground stars
      this.hasSpikes = this.layer > 0.72 && Math.random() > 0.4;
      this.spikeRotation = Math.random() * Math.PI;
      this.spikeRotSpeed = (Math.random() - 0.5) * 0.005;

      // Warp trail storage
      this.prevX = this.x;
      this.prevY = this.y;
    }

    update(dt, parallaxX, parallaxY, warpFactor) {
      this.prevX = this.x;
      this.prevY = this.y;

      if (warpFactor > 1.2) {
        // Hyperspace warp effect: move outward from screen center
        const centerX = width * 0.5;
        const centerY = height * 0.5;
        const dx = this.x - centerX;
        const dy = this.y - centerY;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        
        const speed = (warpFactor * 3.5) * (0.5 + this.layer * 1.5) * (dist / 300 + 0.5);
        this.x += (dx / dist) * speed;
        this.y += (dy / dist) * speed;
      } else {
        // Normal cosmic float
        this.x += this.speedX;
        this.y += this.speedY;
      }

      // Twinkle cycle
      this.twinkleOffset += this.twinkleSpeed;
      this.currentAlpha = Math.max(0.12, Math.min(1, this.alpha + Math.sin(this.twinkleOffset) * 0.45));

      // Wrap boundaries smoothly
      if (this.x < -40 || this.x > width + 40 || this.y < -40 || this.y > height + 40) {
        if (warpFactor > 1.2) {
          // Respawn near center during warp
          const angle = Math.random() * Math.PI * 2;
          const radius = 20 + Math.random() * 60;
          this.x = width * 0.5 + Math.cos(angle) * radius;
          this.y = height * 0.5 + Math.sin(angle) * radius;
          this.prevX = this.x;
          this.prevY = this.y;
        } else {
          if (this.x < -30) this.x = width + 30;
          if (this.x > width + 30) this.x = -30;
          if (this.y < -30) this.y = height + 30;
          if (this.y > height + 30) this.y = -30;
        }
      }

      if (this.hasSpikes) {
        this.spikeRotation += this.spikeRotSpeed;
      }
    }

    draw(ctx, parallaxX, parallaxY, warpFactor) {
      const drawX = this.x + parallaxX * (this.layer * 30);
      const drawY = this.y + parallaxY * (this.layer * 30);

      const r = this.color.r;
      const g = this.color.g;
      const b = this.color.b;

      if (warpFactor > 1.5) {
        // Draw hyperdrive beam trail
        const prevDrawX = this.prevX + parallaxX * (this.layer * 30);
        const prevDrawY = this.prevY + parallaxY * (this.layer * 30);

        ctx.save();
        ctx.beginPath();
        ctx.moveTo(prevDrawX, prevDrawY);
        ctx.lineTo(drawX, drawY);
        ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${Math.min(1, this.currentAlpha * 0.9)})`;
        ctx.lineWidth = Math.max(1, this.baseRadius * 1.2);
        ctx.lineCap = "round";
        ctx.shadowColor = "#00ffcc";
        ctx.shadowBlur = 8;
        ctx.stroke();
        ctx.restore();
        return;
      }

      const radius = this.baseRadius * (0.85 + Math.sin(this.twinkleOffset) * 0.25);

      // Core shiny glow gradient
      const glowRadius = Math.max(radius * 4.2, 3);
      const grad = ctx.createRadialGradient(drawX, drawY, 0, drawX, drawY, glowRadius);
      grad.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${this.currentAlpha})`);
      grad.addColorStop(0.35, `rgba(${r}, ${g}, ${b}, ${this.currentAlpha * 0.45})`);
      grad.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);

      ctx.beginPath();
      ctx.arc(drawX, drawY, glowRadius, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();

      // Sharp central star point
      ctx.beginPath();
      ctx.arc(drawX, drawY, radius * 0.75, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 255, ${Math.min(1, this.currentAlpha * 1.4)})`;
      ctx.fill();

      // Shiny 4-point sparkle cross on prominent stars
      if (this.hasSpikes && this.currentAlpha > 0.4) {
        const spikeLen = radius * 4.5 * this.currentAlpha;
        const spikeWidth = 0.85;
        
        ctx.save();
        ctx.translate(drawX, drawY);
        ctx.rotate(this.spikeRotation);

        ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${this.currentAlpha * 0.8})`;
        ctx.lineWidth = spikeWidth;
        
        ctx.beginPath();
        ctx.moveTo(-spikeLen, 0);
        ctx.lineTo(spikeLen, 0);
        ctx.moveTo(0, -spikeLen);
        ctx.lineTo(0, spikeLen);
        ctx.stroke();

        ctx.restore();
      }
    }
  }

  class ShootingStar {
    constructor() {
      this.reset();
    }

    reset() {
      this.x = Math.random() * (width * 0.9);
      this.y = Math.random() * (height * 0.45);
      this.length = 80 + Math.random() * 120;
      this.speed = 10 + Math.random() * 8;
      this.angle = Math.PI / 4 + (Math.random() - 0.5) * 0.35; // ~45 deg downward
      this.alpha = 1;
      this.fadeRate = 0.015 + Math.random() * 0.018;
      this.active = true;
    }

    update() {
      this.x += Math.cos(this.angle) * this.speed;
      this.y += Math.sin(this.angle) * this.speed;
      this.alpha -= this.fadeRate;

      if (this.alpha <= 0 || this.x > width + 100 || this.y > height + 100) {
        this.active = false;
      }
    }

    draw(ctx) {
      if (!this.active || this.alpha <= 0) return;

      const tailX = this.x - Math.cos(this.angle) * this.length;
      const tailY = this.y - Math.sin(this.angle) * this.length;

      const grad = ctx.createLinearGradient(tailX, tailY, this.x, this.y);
      grad.addColorStop(0, "rgba(0, 255, 204, 0)");
      grad.addColorStop(0.7, `rgba(0, 255, 204, ${this.alpha * 0.7})`);
      grad.addColorStop(1, `rgba(255, 255, 255, ${this.alpha})`);

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(tailX, tailY);
      ctx.lineTo(this.x, this.y);
      ctx.strokeStyle = grad;
      ctx.lineWidth = 2;
      ctx.lineCap = "round";
      ctx.stroke();

      // Glowing star head
      ctx.beginPath();
      ctx.arc(this.x, this.y, 2.5, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 255, ${this.alpha})`;
      ctx.shadowColor = "#00ffcc";
      ctx.shadowBlur = 12;
      ctx.fill();
      ctx.restore();
    }
  }

  // Interactive Click Stardust Burst
  class BurstParticle {
    constructor(x, y) {
      this.x = x;
      this.y = y;
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 5;
      this.vx = Math.cos(angle) * speed;
      this.vy = Math.sin(angle) * speed;
      this.radius = 1 + Math.random() * 2;
      this.alpha = 1;
      this.fade = 0.02 + Math.random() * 0.03;
      this.color = starColors[Math.floor(Math.random() * starColors.length)];
    }

    update() {
      this.x += this.vx;
      this.y += this.vy;
      this.vx *= 0.96;
      this.vy *= 0.96;
      this.alpha -= this.fade;
    }

    draw(ctx) {
      if (this.alpha <= 0) return;
      ctx.save();
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${this.color.r}, ${this.color.g}, ${this.color.b}, ${this.alpha})`;
      ctx.shadowColor = "#00ffcc";
      ctx.shadowBlur = 6;
      ctx.fill();
      ctx.restore();
    }
  }

  function createBurst(x, y) {
    for (let i = 0; i < 22; i++) {
      burstParticles.push(new BurstParticle(x, y));
    }
  }

  // Resize handler
  function handleResize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = window.innerWidth;
    height = window.innerHeight;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = width + "px";
    canvas.style.height = height + "px";
    ctx.scale(dpr, dpr);

    initStars();
  }

  function initStars() {
    const totalCount = Math.floor((width * height) / 8000) || STAR_COUNT_BASE;
    stars = [];
    for (let i = 0; i < totalCount; i++) {
      stars.push(new Star());
    }
  }

  // Shooting star frequency
  let lastShootingStarTime = Date.now();
  let shootingStarInterval = 4000 + Math.random() * 4000;

  function updateShootingStars() {
    const now = Date.now();
    if (now - lastShootingStarTime > shootingStarInterval) {
      shootingStars.push(new ShootingStar());
      lastShootingStarTime = now;
      shootingStarInterval = 3500 + Math.random() * 5000;
    }

    for (let i = shootingStars.length - 1; i >= 0; i--) {
      shootingStars[i].update();
      if (!shootingStars[i].active) {
        shootingStars.splice(i, 1);
      }
    }
  }

  // Mouse move listener
  window.addEventListener("mousemove", (e) => {
    mouse.targetX = (e.clientX / width - 0.5) * 2;
    mouse.targetY = (e.clientY / height - 0.5) * 2;
    mouse.screenX = e.clientX;
    mouse.screenY = e.clientY;
    mouse.isHovering = true;
  }, { passive: true });

  window.addEventListener("mouseleave", () => {
    mouse.targetX = 0;
    mouse.targetY = 0;
    mouse.isHovering = false;
  }, { passive: true });

  // Stardust click trigger
  window.addEventListener("pointerdown", (e) => {
    // Avoid triggering on buttons / interactive links to keep clicks crisp
    if (e.target.tagName !== "BUTTON" && e.target.tagName !== "A" && !e.target.closest("button") && !e.target.closest("a")) {
      createBurst(e.clientX, e.clientY);
    }
  }, { passive: true });

  // Main animation loop
  let lastTime = performance.now();

  function animate(now) {
    const dt = Math.min((now - lastTime) / 1000, 0.1);
    lastTime = now;

    // Smooth warp speed interpolation
    cosmicState.warpSpeed += (cosmicState.targetWarpSpeed - cosmicState.warpSpeed) * 0.08;

    // Smooth inertia interpolation for mouse parallax
    mouse.x += (mouse.targetX - mouse.x) * 0.045;
    mouse.y += (mouse.targetY - mouse.y) * 0.045;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Dynamic cosmic nebula background glow
    const timeSec = now * 0.0004;
    const nebGrad = ctx.createRadialGradient(
      width * 0.5 + Math.sin(timeSec) * 90,
      height * 0.35 + Math.cos(timeSec * 0.8) * 70,
      10,
      width * 0.5,
      height * 0.5,
      Math.max(width, height) * 0.75
    );
    nebGrad.addColorStop(0, cosmicState.warpMode ? "rgba(0, 255, 204, 0.08)" : "rgba(0, 255, 204, 0.038)");
    nebGrad.addColorStop(0.45, cosmicState.warpMode ? "rgba(147, 51, 234, 0.06)" : "rgba(99, 102, 241, 0.025)");
    nebGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
    
    ctx.fillStyle = nebGrad;
    ctx.fillRect(0, 0, width, height);

    // Draw & update stars
    for (let i = 0; i < stars.length; i++) {
      stars[i].update(dt, mouse.x, mouse.y, cosmicState.warpSpeed);
      stars[i].draw(ctx, mouse.x, mouse.y, cosmicState.warpSpeed);
    }

    // Constellation connection lines between foreground stars (only in normal cruise mode)
    if (cosmicState.warpSpeed < 1.5) {
      ctx.lineWidth = 0.55;
      for (let i = 0; i < stars.length; i++) {
        if (stars[i].layer < 0.72) continue;
        const s1 = stars[i];
        const p1x = s1.x + mouse.x * (s1.layer * 30);
        const p1y = s1.y + mouse.y * (s1.layer * 30);

        for (let j = i + 1; j < stars.length; j++) {
          if (stars[j].layer < 0.72) continue;
          const s2 = stars[j];
          const p2x = s2.x + mouse.x * (s2.layer * 30);
          const p2y = s2.y + mouse.y * (s2.layer * 30);

          const dx = p1x - p2x;
          const dy = p1y - p2y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 90) {
            const lineAlpha = (1 - dist / 90) * 0.16 * s1.currentAlpha * s2.currentAlpha;
            ctx.strokeStyle = `rgba(0, 255, 204, ${lineAlpha})`;
            ctx.beginPath();
            ctx.moveTo(p1x, p1y);
            ctx.lineTo(p2x, p2y);
            ctx.stroke();
          }
        }
      }
    }

    // Update and draw shooting stars
    if (cosmicState.warpSpeed < 2) {
      updateShootingStars();
      for (let i = 0; i < shootingStars.length; i++) {
        shootingStars[i].draw(ctx);
      }
    }

    // Update & draw click burst particles
    for (let i = burstParticles.length - 1; i >= 0; i--) {
      burstParticles[i].update();
      burstParticles[i].draw(ctx);
      if (burstParticles[i].alpha <= 0) {
        burstParticles.splice(i, 1);
      }
    }

    requestAnimationFrame(animate);
  }

  // Initialize
  window.addEventListener("resize", handleResize, { passive: true });
  handleResize();
  requestAnimationFrame(animate);
})();
