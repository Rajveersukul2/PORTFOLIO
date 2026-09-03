document.addEventListener("DOMContentLoaded", () => {
  /* ==========================================================================
     1. Background Audio Controller & Visualizer
     ========================================================================== */
  const audio = document.getElementById("bg-audio");
  const audioBtn = document.getElementById("audio-toggle-btn");
  const audioIcon = audioBtn.querySelector(".audio-icon");
  const audioText = audioBtn.querySelector(".audio-text");

  let hasUserManuallyPaused = false;

  const updateAudioUI = (isPlaying) => {
    if (isPlaying) {
      audioBtn.classList.add("playing");
      audioIcon.innerHTML = "&#10074;&#10074;"; // Pause icon
      audioText.textContent = "SOUND // ON";
    } else {
      audioBtn.classList.remove("playing");
      audioIcon.innerHTML = "&#9654;"; // Play icon
      audioText.textContent = "SOUND // OFF";
    }
  };

  const startAudio = () => {
    if (!hasUserManuallyPaused && audio.paused) {
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.then(() => {
          updateAudioUI(true);
        }).catch((err) => {
          console.warn("Autoplay waiting for user gesture:", err);
        });
      }
    }
  };

  // Attempt instant start
  startAudio();

  // Trigger on first user interaction across page
  const triggerOnInteraction = () => {
    if (!hasUserManuallyPaused && audio.paused) {
      startAudio();
    }
  };

  ["pointerdown", "touchstart", "mousedown", "keydown", "scroll", "wheel"].forEach((evt) => {
    window.addEventListener(evt, triggerOnInteraction, { once: true, passive: true });
  });

  audioBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    if (audio.paused) {
      hasUserManuallyPaused = false;
      audio.play().then(() => {
        updateAudioUI(true);
      }).catch((err) => {
        console.warn("Audio playback error:", err);
      });
    } else {
      hasUserManuallyPaused = true;
      audio.pause();
      updateAudioUI(false);
    }
  });

  audio.addEventListener("ended", () => {
    audio.currentTime = 0;
    audio.play().then(() => {
      updateAudioUI(true);
    }).catch(() => {});
  });

  /* ==========================================================================
     2. Holographic CV Modal Preview & Print/Download Logic
     ========================================================================== */
  const cvModal = document.getElementById("cv-modal");
  const heroCvBtn = document.getElementById("hero-cv-btn");
  const navCvBtn = document.getElementById("nav-cv-btn");
  const cvCloseBtn = document.getElementById("cv-close-btn");
  const cvPrintBtn = document.getElementById("cv-print-btn");
  const cvCopyEmailBtn = document.getElementById("cv-copy-email-btn");

  const openCVModal = () => {
    cvModal.classList.add("open");
    cvModal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    if (window.CosmicSpace) {
      window.CosmicSpace.burst(window.innerWidth / 2, window.innerHeight / 2);
    }
  };

  const closeCVModal = () => {
    cvModal.classList.remove("open");
    cvModal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  };

  if (heroCvBtn) heroCvBtn.addEventListener("click", openCVModal);
  if (navCvBtn) navCvBtn.addEventListener("click", openCVModal);
  if (cvCloseBtn) cvCloseBtn.addEventListener("click", closeCVModal);

  // Close CV on clicking backdrop outside container
  cvModal.addEventListener("click", (e) => {
    if (e.target === cvModal) {
      closeCVModal();
    }
  });

  // Print / Save to PDF trigger
  if (cvPrintBtn) {
    cvPrintBtn.addEventListener("click", () => {
      window.print();
    });
  }

  // Copy Email with tactile UI feedback
  if (cvCopyEmailBtn) {
    cvCopyEmailBtn.addEventListener("click", () => {
      const email = "work.rajveersukul@gmail.com";
      navigator.clipboard.writeText(email).then(() => {
        const originalHTML = cvCopyEmailBtn.innerHTML;
        cvCopyEmailBtn.innerHTML = '<span class="action-icon">✓</span> COPIED TO CLIPBOARD';
        cvCopyEmailBtn.style.borderColor = "#00ffcc";
        cvCopyEmailBtn.style.color = "#00ffcc";
        setTimeout(() => {
          cvCopyEmailBtn.innerHTML = originalHTML;
          cvCopyEmailBtn.style.borderColor = "";
          cvCopyEmailBtn.style.color = "";
        }, 2200);
      }).catch(() => {
        alert("Email: work.rajveersukul@gmail.com");
      });
    });
  }

  /* ==========================================================================
     3. Easter Egg 1: Konami Code & Hyperspace Warp Speed
     ========================================================================== */
  const konamiSequence = [
    "ArrowUp", "ArrowUp",
    "ArrowDown", "ArrowDown",
    "ArrowLeft", "ArrowRight",
    "ArrowLeft", "ArrowRight",
    "b", "a"
  ];
  let konamiIndex = 0;
  const warpAlert = document.getElementById("warp-alert");
  let warpAlertTimer = null;

  const triggerWarpSpeed = () => {
    if (window.CosmicSpace) {
      const isWarp = window.CosmicSpace.toggleWarp();
      if (isWarp) {
        warpAlert.classList.add("active");
        if (warpAlertTimer) clearTimeout(warpAlertTimer);
        warpAlertTimer = setTimeout(() => {
          warpAlert.classList.remove("active");
        }, 3500);

        // Particle explosion effect
        for (let i = 0; i < 5; i++) {
          setTimeout(() => {
            window.CosmicSpace.burst(
              Math.random() * window.innerWidth,
              Math.random() * window.innerHeight
            );
          }, i * 150);
        }
      } else {
        warpAlert.classList.remove("active");
      }
    }
  };

  window.addEventListener("keydown", (e) => {
    const key = e.key.toLowerCase();
    const expected = konamiSequence[konamiIndex].toLowerCase();

    if (key === expected) {
      konamiIndex++;
      if (konamiIndex === konamiSequence.length) {
        triggerWarpSpeed();
        konamiIndex = 0;
      }
    } else {
      konamiIndex = 0;
      if (key === konamiSequence[0].toLowerCase()) {
        konamiIndex = 1;
      }
    }

    // Global shortcut: Escape to close modals
    if (e.key === "Escape") {
      closeCVModal();
      closeTerminalHUD();
    }

    // Global shortcut: Backtick (~) to toggle Cyber Terminal HUD
    if (e.key === "`" || e.key === "~") {
      // Don't toggle if user is typing in terminal input
      if (document.activeElement !== document.getElementById("terminal-input")) {
        e.preventDefault();
        toggleTerminalHUD();
      }
    }
  });

  /* ==========================================================================
     4. Easter Egg 2: Cyber Terminal HUD
     ========================================================================== */
  const terminalModal = document.getElementById("terminal-modal");
  const terminalForm = document.getElementById("terminal-form");
  const terminalInput = document.getElementById("terminal-input");
  const terminalOutput = document.getElementById("terminal-output");
  const terminalCloseBtn = document.getElementById("terminal-close-btn");
  const footerStatusBtn = document.getElementById("footer-status-btn");

  const openTerminalHUD = () => {
    terminalModal.classList.add("active");
    terminalModal.setAttribute("aria-hidden", "false");
    setTimeout(() => terminalInput.focus(), 100);
  };

  const closeTerminalHUD = () => {
    terminalModal.classList.remove("active");
    terminalModal.setAttribute("aria-hidden", "true");
  };

  const toggleTerminalHUD = () => {
    if (terminalModal.classList.contains("active")) {
      closeTerminalHUD();
    } else {
      openTerminalHUD();
    }
  };

  if (footerStatusBtn) footerStatusBtn.addEventListener("click", openTerminalHUD);
  if (terminalCloseBtn) terminalCloseBtn.addEventListener("click", closeTerminalHUD);

  terminalModal.addEventListener("click", (e) => {
    if (e.target === terminalModal) {
      closeTerminalHUD();
    }
  });

  const appendTerminalLine = (text, className = "t-line") => {
    const line = document.createElement("div");
    line.className = className;
    line.innerHTML = text;
    terminalOutput.appendChild(line);
    terminalOutput.scrollTop = terminalOutput.scrollHeight;
  };

  const handleTerminalCommand = (rawCmd) => {
    const cmd = rawCmd.trim().toLowerCase();
    appendTerminalLine(`<span style="color:#00ffcc;">raivr@station:~$</span> ${escapeHtml(rawCmd)}`);

    switch (cmd) {
      case "help":
        appendTerminalLine(`
          <strong>AVAILABLE COMMANDS:</strong><br/>
          &bull; <span class="t-cmd-highlight">cv</span> : Open interactive Curriculum Vitae<br/>
          &bull; <span class="t-cmd-highlight">skills</span> : Inspect technical & creative arsenal<br/>
          &bull; <span class="t-cmd-highlight">projects</span> : List live deployments<br/>
          &bull; <span class="t-cmd-highlight">music</span> : Toggle background soundtrack<br/>
          &bull; <span class="t-cmd-highlight">warp</span> : Toggle cosmic hyperdrive warp speed<br/>
          &bull; <span class="t-cmd-highlight">contact</span> : Display direct transmission frequencies<br/>
          &bull; <span class="t-cmd-highlight">eastereggs</span> : List secret discovery triggers<br/>
          &bull; <span class="t-cmd-highlight">clear</span> : Clear console screen<br/>
          &bull; <span class="t-cmd-highlight">exit</span> : Close terminal window
        `);
        break;

      case "cv":
      case "resume":
        appendTerminalLine("Launching Holographic CV Modal...", "t-system");
        setTimeout(openCVModal, 300);
        break;

      case "skills":
        appendTerminalLine(`
          <strong>[ CORE ARSENAL ]</strong><br/>
          &bull; <strong>Tech & AI:</strong> Web Architect, ES6+ JS, Web Audio API, Canvas, MediaPipe ML, Prompt Systems<br/>
          &bull; <strong>Music & Audio:</strong> Multi-Instrumentalist (Guitar), Music Composition, Vocals, Audio Production<br/>
          &bull; <strong>Visual Design:</strong> Video Editing, 2D Motion Graphics, Visual Storytelling
        `);
        break;

      case "projects":
        appendTerminalLine(`
          <strong>[ DEPLOYMENTS ]</strong><br/>
          1. <strong>RAIVR GESTURE:</strong> Interactive ML Web Synth &rarr; <a href="https://raivr-gesture.edgeone.dev" target="_blank" style="color:#00ffcc;">raivr-gesture.edgeone.dev</a><br/>
          2. <strong>RAIVR PLATFORM:</strong> Audio Hub & Experimental Works &rarr; <a href="https://raivr.edgeone.dev" target="_blank" style="color:#00ffcc;">raivr.edgeone.dev</a>
        `);
        break;

      case "music":
      case "sound":
      case "play":
        audioBtn.click();
        appendTerminalLine(`Audio state toggled: ${audio.paused ? "PAUSED" : "PLAYING"}`, "t-system");
        break;

      case "warp":
      case "hyperdrive":
      case "speed":
        triggerWarpSpeed();
        appendTerminalLine("Toggled Hyperspace Warp Drive!", "t-system");
        break;

      case "contact":
      case "signal":
        appendTerminalLine(`
          <strong>[ TRANSMIT SIGNAL ]</strong><br/>
          &bull; Direct Comm: <a href="mailto:work.rajveersukul@gmail.com" style="color:#00ffcc;">work.rajveersukul@gmail.com</a><br/>
          &bull; Frequency: <a href="https://www.instagram.com/raivr2026/" target="_blank" style="color:#00ffcc;">@raivr2026</a><br/>
          &bull; Location: West Bengal, India
        `);
        break;

      case "eastereggs":
      case "secrets":
        appendTerminalLine(`
          <strong>[ DISCOVERED EASTER EGGS ]</strong><br/>
          1. <strong>Konami Code:</strong> &uarr; &uarr; &darr; &darr; &larr; &rarr; &larr; &rarr; B A (Hyperspace Warp)<br/>
          2. <strong>Portrait Overclock:</strong> Click profile picture 3 times rapidly<br/>
          3. <strong>Cyber Terminal:</strong> Press '~' key or click footer status indicator<br/>
          4. <strong>Stardust Bursts:</strong> Click anywhere on cosmic space background
        `);
        break;

      case "clear":
      case "cls":
        terminalOutput.innerHTML = "";
        break;

      case "exit":
      case "quit":
      case "close":
        closeTerminalHUD();
        break;

      case "":
        break;

      default:
        appendTerminalLine(`Command not recognized: "${escapeHtml(cmd)}". Type <span class="t-cmd-highlight">help</span> for command list.`, "t-system");
        break;
    }
  };

  const escapeHtml = (text) => {
    return text.replace(/[&<>"']/g, (m) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    }[m]));
  };

  terminalForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const val = terminalInput.value;
    if (val.trim()) {
      handleTerminalCommand(val);
      terminalInput.value = "";
    }
  });

  /* ==========================================================================
     5. Easter Egg 3: Profile Portrait Overclock Hologram Mode
     ========================================================================== */
  const imgFrame = document.getElementById("hero-img-frame");
  let clickCount = 0;
  let clickTimer = null;

  if (imgFrame) {
    imgFrame.addEventListener("click", () => {
      clickCount++;
      if (clickTimer) clearTimeout(clickTimer);

      if (clickCount >= 3) {
        clickCount = 0;
        imgFrame.classList.toggle("overclock");
        const isOverclock = imgFrame.classList.contains("overclock");
        
        if (window.CosmicSpace) {
          const rect = imgFrame.getBoundingClientRect();
          window.CosmicSpace.burst(rect.left + rect.width / 2, rect.top + rect.height / 2);
        }

        // Show brief badge indicator
        const badge = document.querySelector(".badge");
        if (badge) {
          const prev = badge.textContent;
          badge.textContent = isOverclock ? "HOLOGRAM // OVERCLOCKED" : "SYSTEM READY // 2026";
          badge.style.color = isOverclock ? "#a855f7" : "#00ffcc";
          setTimeout(() => {
            badge.textContent = "SYSTEM READY // 2026";
            badge.style.color = "";
          }, 3000);
        }
      } else {
        clickTimer = setTimeout(() => {
          clickCount = 0;
        }, 1200);
      }
    });
  }

  /* ==========================================================================
     6. Card Hover Spotlight Effect & Scroll Reveal Animations
     ========================================================================== */
  const cards = document.querySelectorAll(".glass, .contact-item");
  cards.forEach((card) => {
    card.addEventListener("mousemove", (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      card.style.setProperty("--mouse-x", `${x}px`);
      card.style.setProperty("--mouse-y", `${y}px`);
    });
  });

  const observerOptions = {
    threshold: 0.1,
    rootMargin: "0px 0px -40px 0px"
  };

  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = "1";
        entry.target.style.transform = "translateY(0)";
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  document.querySelectorAll(".section, .hero-section").forEach((sec) => {
    sec.style.opacity = "0";
    sec.style.transform = "translateY(24px)";
    sec.style.transition = "opacity 0.7s cubic-bezier(0.16, 1, 0.3, 1), transform 0.7s cubic-bezier(0.16, 1, 0.3, 1)";
    revealObserver.observe(sec);
  });

  /* ==========================================================================
     7. Global Developer Console Interface
     ========================================================================== */
  window.raivr = {
    openCV: openCVModal,
    closeCV: closeCVModal,
    openTerminal: openTerminalHUD,
    toggleWarp: triggerWarpSpeed,
    easterEggs: () => {
      console.log(`
%c[ RAIVR EASTER EGGS ]
1. Konami Code (Keyboard): ArrowUp ArrowUp ArrowDown ArrowDown ArrowLeft ArrowRight ArrowLeft ArrowRight B A
2. Profile Picture: Click 3x rapidly for Hologram Overclock
3. Cyber Terminal HUD: Press '~' or click footer status
4. Stardust Burst: Click any open space on background
      `, "color: #00ffcc; font-weight: bold;");
    }
  };

  console.log(
    "%c[ SYSTEM ONLINE ] %cRajveer Sukul Portfolio 2026 Engine Initialized.\n%cType %cwindow.raivr.easterEggs()%c for secret triggers.",
    "color: #00ffcc; font-weight: bold;",
    "color: #ffffff;",
    "color: #8b9bb4;",
    "color: #a855f7; font-weight: bold;",
    "color: #8b9bb4;"
  );
});