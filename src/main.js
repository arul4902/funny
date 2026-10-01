// ============================================================================
// MAIN APPLICATION ENTRY POINT
// "Should I Text My Ex?" - Cinematic Interactive Experience
// ============================================================================

import { gsap } from 'gsap';
import { Scene3D, isWebGLAvailable } from './scene.js';
import { ScrollManager } from './scroll.js';
import { generateVerdict, shareVerdict, resetRetryCounter } from './verdict.js';

// ============================================================================
// CONFIGURATION (All tweakable parameters)
// ============================================================================
export const CONFIG = {
  colors: {
    background: '#0b0b10',
    hotPink: '#ff2e88',
    violet: '#7a5cff',
    cyan: '#00f5d4',
    amber: '#ffb703',
    cardBg: 'rgba(18, 18, 28, 0.75)'
  },
  particles: {
    desktopCount: 800,
    mobileCount: 220
  },
  verdictWeights: {
    NO: 0.55,      // 55% probability
    MAYBE: 0.30,   // 30% probability
    YES: 0.15      // 15% probability
  },
  audioEnabled: true
};

// ============================================================================
// LIGHTWEIGHT PROCEDURAL WEB AUDIO SYNTHESIZER (Zero external MP3 assets)
// ============================================================================
class AudioFX {
  constructor() {
    this.ctx = null;
    this.muted = false;
  }

  init() {
    if (!this.ctx && (window.AudioContext || window.webkitAudioContext)) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playOrbCharge() {
    if (this.muted || !this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(120, now);
    osc.frequency.exponentialRampToValueAtTime(580, now + 1.2);

    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.2, now + 0.8);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 1.25);
  }

  playVerdictReveal(isNo = true) {
    if (this.muted || !this.ctx) return;
    const now = this.ctx.currentTime;

    // Sub-bass hit
    const subOsc = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    subOsc.type = 'triangle';
    subOsc.frequency.setValueAtTime(isNo ? 65 : 110, now);
    subOsc.frequency.exponentialRampToValueAtTime(32, now + 0.9);

    subGain.gain.setValueAtTime(0.4, now);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + 1.0);

    subOsc.connect(subGain);
    subGain.connect(this.ctx.destination);
    subOsc.start(now);
    subOsc.stop(now + 1.0);

    // Chime overtone
    const chimeOsc = this.ctx.createOscillator();
    const chimeGain = this.ctx.createGain();
    chimeOsc.type = 'sine';
    chimeOsc.frequency.setValueAtTime(isNo ? 320 : 660, now + 0.05);
    chimeOsc.frequency.exponentialRampToValueAtTime(isNo ? 160 : 880, now + 0.8);

    chimeGain.gain.setValueAtTime(0.18, now + 0.05);
    chimeGain.gain.exponentialRampToValueAtTime(0.001, now + 0.85);

    chimeOsc.connect(chimeGain);
    chimeGain.connect(this.ctx.destination);
    chimeOsc.start(now + 0.05);
    chimeOsc.stop(now + 0.9);
  }
}

const audio = new AudioFX();

// ============================================================================
// APPLICATION CONTROLLER
// ============================================================================
class App {
  constructor() {
    this.canvas = document.getElementById('webgl-canvas');
    this.scene = null;
    this.scroll = null;
    this.currentVerdict = null;
    this.isProcessingVerdict = false;

    this.init();
  }

  async init() {
    // 1. Setup custom cursor glow on desktop
    this.initCursorGlow();

    // 2. Setup audio interaction
    this.initAudioToggle();

    // 3. Check WebGL support
    if (!isWebGLAvailable()) {
      this.initWebGLFallback();
      return;
    }

    // 4. Simulate asset loading & progress counter
    await this.runLoader();

    // 5. Lazy initialize Three.js Scene and GSAP Scroll
    this.scene = new Scene3D(this.canvas, CONFIG);
    this.scroll = new ScrollManager(this.scene, CONFIG);

    // 6. Bind interactive UI events
    this.bindUI();
  }

  runLoader() {
    return new Promise((resolve) => {
      const loaderEl = document.getElementById('loader');
      const counterEl = document.getElementById('loader-counter');
      let progress = { value: 0 };

      gsap.to(progress, {
        value: 100,
        duration: 1.2,
        ease: 'power2.out',
        onUpdate: () => {
          if (counterEl) {
            counterEl.textContent = `${Math.round(progress.value)}%`;
          }
        },
        onComplete: () => {
          gsap.to(loaderEl, {
            opacity: 0,
            duration: 0.6,
            ease: 'power2.inOut',
            onComplete: () => {
              loaderEl.style.display = 'none';
              resolve();
            }
          });
        }
      });
    });
  }

  initCursorGlow() {
    const glowEl = document.getElementById('cursor-glow');
    if (!glowEl || !window.matchMedia('(pointer: fine)').matches) return;

    glowEl.style.display = 'block';
    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let currentX = mouseX;
    let currentY = mouseY;

    window.addEventListener('mousemove', (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    }, { passive: true });

    const updateGlow = () => {
      currentX += (mouseX - currentX) * 0.12;
      currentY += (mouseY - currentY) * 0.12;
      glowEl.style.transform = `translate3d(${currentX}px, ${currentY}px, 0)`;
      requestAnimationFrame(updateGlow);
    };
    updateGlow();
  }

  initAudioToggle() {
    const btnAudio = document.getElementById('btn-audio');
    if (!btnAudio) return;

    const updateIcon = () => {
      btnAudio.innerHTML = audio.muted ? '🔇' : '🔊';
      btnAudio.setAttribute('aria-label', audio.muted ? 'Unmute sound effects' : 'Mute sound effects');
    };

    btnAudio.addEventListener('click', () => {
      audio.init();
      audio.muted = !audio.muted;
      updateIcon();
    });

    // Initialize audio context on first user click anywhere
    window.addEventListener('click', () => audio.init(), { once: true });
    window.addEventListener('touchstart', () => audio.init(), { once: true });
  }

  bindUI() {
    const btnOracle = document.getElementById('btn-oracle');
    const nameInput = document.getElementById('ex-name-input');
    const btnShare = document.getElementById('btn-share');
    const btnAskAgain = document.getElementById('btn-ask-again');
    const btnDismissVerdict = document.getElementById('btn-dismiss-verdict');

    if (btnOracle) {
      btnOracle.addEventListener('click', () => {
        const exName = nameInput ? nameInput.value.trim() : '';
        this.askOracle(exName);
      });
    }

    if (nameInput) {
      nameInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          const exName = nameInput.value.trim();
          this.askOracle(exName);
        }
      });
    }

    if (btnShare) {
      btnShare.addEventListener('click', () => {
        if (this.currentVerdict) {
          shareVerdict(this.currentVerdict, (msg) => this.showToast(msg));
        }
      });
    }

    if (btnAskAgain) {
      btnAskAgain.addEventListener('click', () => {
        const exName = nameInput ? nameInput.value.trim() : '';
        this.askOracle(exName);
      });
    }

    if (btnDismissVerdict) {
      btnDismissVerdict.addEventListener('click', () => {
        this.dismissVerdict();
      });
    }
  }

  askOracle(name = '') {
    if (this.isProcessingVerdict) return;
    this.isProcessingVerdict = true;

    audio.init();
    audio.playOrbCharge();

    const btnOracle = document.getElementById('btn-oracle');
    if (btnOracle) {
      btnOracle.disabled = true;
      btnOracle.classList.add('loading');
    }

    // Generate verdict result
    const verdict = generateVerdict(name, CONFIG.verdictWeights);
    this.currentVerdict = verdict;

    // Trigger 3D orb shake, spin up, and glitter burst in Three.js
    if (this.scene) {
      this.scene.triggerOrbBurst(verdict.color, () => {
        // Complete burst callback
      });
    }

    // Reveal verdict card after burst crescendo
    setTimeout(() => {
      audio.playVerdictReveal(verdict.category === 'NO');
      this.revealVerdict(verdict);
      if (btnOracle) {
        btnOracle.disabled = false;
        btnOracle.classList.remove('loading');
      }
      this.isProcessingVerdict = false;
    }, 900);
  }

  revealVerdict(verdict) {
    const container = document.getElementById('verdict-container');
    const card = document.getElementById('verdict-card');
    const badge = document.getElementById('verdict-badge');
    const title = document.getElementById('verdict-title');
    const quote = document.getElementById('verdict-quote');
    const subtext = document.getElementById('verdict-subtext');
    const regretBar = document.getElementById('verdict-regret-fill');
    const regretVal = document.getElementById('verdict-regret-val');
    const flashEl = document.getElementById('screen-flash');

    if (!container || !card) return;

    // Set dynamic contents
    badge.textContent = verdict.isEasterEgg ? '💧 HYDRATION MANDATE' : `VERDICT: ${verdict.category}`;
    badge.style.backgroundColor = verdict.color;
    title.textContent = verdict.title;
    quote.textContent = `“${verdict.quote}”`;

    if (verdict.isEasterEgg && verdict.subtext) {
      subtext.textContent = verdict.subtext;
      subtext.style.display = 'block';
    } else {
      subtext.style.display = 'none';
    }

    // Regret percentage
    regretVal.textContent = '0%';
    regretBar.style.width = '0%';
    regretBar.style.backgroundColor = verdict.color;

    // Show container
    container.hidden = false;
    container.classList.add('active');

    // Screen flash effect
    if (flashEl) {
      gsap.fromTo(flashEl, { opacity: 0.7 }, { opacity: 0, duration: 0.5, ease: 'power2.out' });
    }

    // Camera shake (if scene available)
    if (this.scene && !this.scroll.prefersReducedMotion) {
      gsap.fromTo(this.scene.camera.position, {
        x: '+=0.2',
        y: '-=0.15'
      }, {
        x: 0,
        y: 0,
        duration: 0.4,
        ease: 'elastic.out(1, 0.3)'
      });
    }

    // Animate card scale & entrance
    gsap.fromTo(card, {
      scale: 0.75,
      opacity: 0,
      y: 40
    }, {
      scale: 1,
      opacity: 1,
      y: 0,
      duration: 0.65,
      ease: 'back.out(1.4)'
    });

    // Animate Regret Bar counter
    let counterObj = { val: 0 };
    gsap.to(counterObj, {
      val: verdict.regretScore,
      duration: 1.1,
      ease: 'power2.out',
      onUpdate: () => {
        const rounded = Math.round(counterObj.val);
        regretVal.textContent = `${rounded}%`;
        regretBar.style.width = `${rounded}%`;
      }
    });

    // Set focus on verdict for accessibility
    container.focus();
  }

  dismissVerdict() {
    const container = document.getElementById('verdict-container');
    const card = document.getElementById('verdict-card');

    if (!container || !card) return;

    gsap.to(card, {
      scale: 0.9,
      opacity: 0,
      y: 20,
      duration: 0.3,
      ease: 'power2.in',
      onComplete: () => {
        container.classList.remove('active');
        container.hidden = true;
      }
    });
  }

  showToast(message) {
    const toast = document.getElementById('toast');
    if (!toast) return;

    toast.textContent = message;
    toast.classList.add('visible');

    gsap.fromTo(toast, { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.3, ease: 'power2.out' });

    setTimeout(() => {
      gsap.to(toast, {
        y: -10,
        opacity: 0,
        duration: 0.3,
        ease: 'power2.in',
        onComplete: () => toast.classList.remove('visible')
      });
    }, 2500);
  }

  initWebGLFallback() {
    // Hide WebGL canvas
    if (this.canvas) this.canvas.style.display = 'none';

    // Show fallback notification
    const fallbackBanner = document.getElementById('webgl-fallback');
    if (fallbackBanner) fallbackBanner.style.display = 'block';

    const loaderEl = document.getElementById('loader');
    if (loaderEl) loaderEl.style.display = 'none';

    // Enable 2D-only verdict flow
    this.bindUI();
  }
}

// Initialize when DOM content is loaded
window.addEventListener('DOMContentLoaded', () => {
  new App();
});
