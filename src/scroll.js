// ============================================================================
// SCROLL & ANIMATION ORCHESTRATION
// Lenis + GSAP ScrollTrigger Integration
// ============================================================================

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

gsap.registerPlugin(ScrollTrigger);

export class ScrollManager {
  constructor(scene3D, config) {
    this.scene = scene3D;
    this.config = config;
    this.prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    this.initLenis();
    this.initScrollStory();
  }

  initLenis() {
    this.lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 1.0,
      touchMultiplier: 1.5,
      infinite: false
    });

    // Synchronize Lenis with GSAP ScrollTrigger
    this.lenis.on('scroll', ScrollTrigger.update);

    // Drive Lenis with GSAP ticker
    this.tickerCallback = (time) => {
      this.lenis.raf(time * 1000);
    };
    gsap.ticker.add(this.tickerCallback);
    gsap.ticker.lagSmoothing(0);
  }

  initScrollStory() {
    // ------------------------------------------------------------------------
    // 1. HERO ENTRANCE (Immediate on load)
    // ------------------------------------------------------------------------
    this.animateHeroIntro();

    if (this.prefersReducedMotion) {
      // Reduced motion: skip 3D camera zoom/spin scrubbing
      this.setupReducedMotionFallback();
      return;
    }

    // ------------------------------------------------------------------------
    // 2. THE TEMPTATION (Pinned Section)
    // Camera pushes in toward phone screen, bubbles fly past, text lines fade
    // ------------------------------------------------------------------------
    const temptationSec = document.getElementById('section-temptation');
    const line1 = document.getElementById('temptation-line-1');
    const line2 = document.getElementById('temptation-line-2');
    const line3 = document.getElementById('temptation-line-3');

    if (temptationSec) {
      const tlTemptation = gsap.timeline({
        scrollTrigger: {
          trigger: temptationSec,
          start: 'top top',
          end: '+=200%',
          pin: true,
          scrub: 1,
          anticipatePin: 1
        }
      });

      // Camera pushes in toward the phone screen
      tlTemptation.to(this.scene.camera.position, {
        z: 4.8,
        y: -0.1,
        ease: 'none'
      }, 0);

      // Phone tilts slightly to face camera directly
      if (this.scene.phoneGroup) {
        tlTemptation.to(this.scene.phoneGroup.rotation, {
          x: 0.05,
          y: -0.05,
          z: 0,
          ease: 'none'
        }, 0);
      }

      // Bubbles fly past camera with parallax
      if (this.scene.bubbles && this.scene.bubbles.length) {
        this.scene.bubbles.forEach((bubble, idx) => {
          tlTemptation.to(bubble.position, {
            z: bubble.userData.baseZ + 3.5,
            x: bubble.userData.baseX * 1.5,
            ease: 'none'
          }, 0);

          tlTemptation.to(bubble.material, {
            opacity: 0.1,
            ease: 'none'
          }, 0.5);
        });
      }

      // Sequential fade in/out of lines:
      // "It's late." -> "You're bored." -> "Their name is right there."
      tlTemptation
        .fromTo(line1, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.3 }, 0.05)
        .to(line1, { opacity: 0, y: -20, duration: 0.2 }, 0.35)
        .fromTo(line2, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.3 }, 0.4)
        .to(line2, { opacity: 0, y: -20, duration: 0.2 }, 0.7)
        .fromTo(line3, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.3 }, 0.75);
    }

    // ------------------------------------------------------------------------
    // 3. THE SPIRAL (Pinned Section)
    // Camera orbits, typing simulation on screen, particles speed up, regret meter fills
    // ------------------------------------------------------------------------
    const spiralSec = document.getElementById('section-spiral');
    const regretBar = document.getElementById('regret-progress-bar');
    const regretCounter = document.getElementById('regret-counter');

    if (spiralSec) {
      const typingTexts = [
        "",
        "i",
        "i miss",
        "i miss u",
        "i miss u so",
        "i miss u so much",
        "i miss u",
        "i",
        ""
      ];

      const tlSpiral = gsap.timeline({
        scrollTrigger: {
          trigger: spiralSec,
          start: 'top top',
          end: '+=250%',
          pin: true,
          scrub: 1,
          anticipatePin: 1,
          onUpdate: (self) => {
            const prog = self.progress;

            // 1. Particle speed acceleration
            this.scene.particleSpeedMultiplier = 1.0 + prog * 4.5;

            // 2. Typing simulation based on progress steps
            const textIndex = Math.min(
              typingTexts.length - 1,
              Math.floor(prog * typingTexts.length)
            );
            const currentTyped = typingTexts[textIndex];
            const showDots = prog > 0.3 && prog < 0.8;
            this.scene.setScreenTypingState(currentTyped, showDots);

            // 3. Regret meter dynamic bar & counter
            const regretVal = Math.round(prog * 88);
            if (regretBar) {
              regretBar.style.width = `${regretVal}%`;
            }
            if (regretCounter) {
              regretCounter.textContent = `${regretVal}%`;
            }
          }
        }
      });

      // Camera orbits around the phone
      tlSpiral.to(this.scene.camera.position, {
        x: 1.5,
        y: 0.4,
        z: 4.2,
        ease: 'power1.inOut'
      }, 0);

      if (this.scene.phoneGroup) {
        tlSpiral.to(this.scene.phoneGroup.rotation, {
          y: 0.65,
          x: 0.22,
          z: -0.1,
          ease: 'power1.inOut'
        }, 0);
      }
    }

    // ------------------------------------------------------------------------
    // 4. THE ORACLE (Pinned Section)
    // Phone shrinks and sinks away; crystal orb rises glowing; button appears
    // ------------------------------------------------------------------------
    const oracleSec = document.getElementById('section-oracle');
    const oracleCard = document.getElementById('oracle-interactive-card');

    if (oracleSec) {
      const tlOracle = gsap.timeline({
        scrollTrigger: {
          trigger: oracleSec,
          start: 'top top',
          end: '+=180%',
          pin: true,
          scrub: 1,
          anticipatePin: 1
        }
      });

      // Phone shrinks away and descends
      if (this.scene.phoneGroup) {
        tlOracle.to(this.scene.phoneGroup.position, {
          y: -10,
          z: -4,
          ease: 'power2.in'
        }, 0);

        tlOracle.to(this.scene.phoneGroup.scale, {
          x: 0.2,
          y: 0.2,
          z: 0.2,
          ease: 'power2.in'
        }, 0);
      }

      // Crystal orb rises from below to center
      if (this.scene.orbGroup) {
        tlOracle.fromTo(this.scene.orbGroup.position, {
          y: -10,
          z: -2
        }, {
          y: 0,
          z: 0,
          ease: 'power2.out'
        }, 0.2);

        // Oracle glow light ramps up
        tlOracle.to(this.scene.oracleLight, {
          intensity: 4.5,
          ease: 'power2.out'
        }, 0.2);

        tlOracle.to(this.scene.oracleLight.position, {
          y: 0,
          z: 0,
          ease: 'power2.out'
        }, 0.2);
      }

      // Reset camera to frame orb beautifully
      tlOracle.to(this.scene.camera.position, {
        x: 0,
        y: 0,
        z: 6.2,
        ease: 'power2.out'
      }, 0.2);

      // Oracle UI card floats up
      if (oracleCard) {
        tlOracle.fromTo(oracleCard, {
          opacity: 0,
          y: 50,
          scale: 0.95
        }, {
          opacity: 1,
          y: 0,
          scale: 1,
          ease: 'power2.out'
        }, 0.4);
      }
    }
  }

  /**
   * Hero entrance animation: splits title characters and rises with stagger
   */
  animateHeroIntro() {
    const titleEl = document.getElementById('hero-title');
    const badgeEl = document.getElementById('hero-badge');
    const subtitleEl = document.getElementById('hero-subtitle');
    const scrollHintEl = document.getElementById('hero-scroll-hint');

    if (!titleEl) return;

    // Split text into span characters for staggered rise
    const text = titleEl.textContent;
    titleEl.textContent = '';
    const chars = [];

    [...text].forEach((char) => {
      const span = document.createElement('span');
      span.textContent = char;
      span.classList.add('char-split');
      if (char === ' ') {
        span.style.width = '0.3em';
        span.style.display = 'inline-block';
      }
      titleEl.appendChild(span);
      chars.push(span);
    });

    const introTl = gsap.timeline({ delay: 0.2 });

    introTl
      .fromTo(badgeEl, { opacity: 0, y: -20 }, { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' })
      .fromTo(
        chars,
        { opacity: 0, y: 40, rotateX: -45 },
        { opacity: 1, y: 0, rotateX: 0, stagger: 0.03, duration: 0.7, ease: 'back.out(1.5)' },
        '-=0.3'
      )
      .fromTo(subtitleEl, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' }, '-=0.4')
      .fromTo(scrollHintEl, { opacity: 0, y: 15 }, { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' }, '-=0.2');
  }

  /**
   * Fallback for prefers-reduced-motion
   */
  setupReducedMotionFallback() {
    document.querySelectorAll('.story-section').forEach((sec) => {
      sec.style.opacity = '1';
      sec.style.transform = 'none';
    });
    const regretBar = document.getElementById('regret-progress-bar');
    if (regretBar) regretBar.style.width = '75%';
    const regretCounter = document.getElementById('regret-counter');
    if (regretCounter) regretCounter.textContent = '75%';
    const oracleCard = document.getElementById('oracle-interactive-card');
    if (oracleCard) oracleCard.style.opacity = '1';

    // Position orb at center right away
    if (this.scene && this.scene.orbGroup) {
      this.scene.orbGroup.position.set(0, 0, 0);
    }
  }

  /**
   * Scroll smoothly to the oracle section
   */
  scrollToOracle() {
    const oracleSec = document.getElementById('section-oracle');
    if (oracleSec && this.lenis) {
      this.lenis.scrollTo(oracleSec, { offset: 0, duration: 1.5 });
    }
  }

  dispose() {
    if (this.tickerCallback) {
      gsap.ticker.remove(this.tickerCallback);
    }
    if (this.lenis) {
      this.lenis.destroy();
    }
    ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
  }
}
