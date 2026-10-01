# Should I Text My Ex? 👀 🔮

A cinematic, 3D scroll-driven single-page interactive experience designed to intervene before someone sends that catastrophic late-night text. Built with **Vite**, **Three.js**, and **GSAP ScrollTrigger** (with **Lenis** smooth scroll).

Live demo built for high performance on desktop and mobile browsers.

---

## ✨ Features

- **Procedural 3D Smartphone**: Sleek dark metallic phone chassis with a dynamic canvas screen displaying a real-time messaging UI (carrier, battery, contact header, interactive chat history, and simulated typing indicator).
- **Floating 3D Chat Notifications**: Ambient chat bubbles ("hey", "u up? 👀", "I miss u", "seen 2:48 AM", "typing...") orbiting the phone with depth parallax.
- **Glowing Celestial Crystal Orb**: Refractive icosahedron with physical transmission, inner celestial wireframe core, and particle burst effects on activation.
- **Cinematic Scroll Storytelling**:
  1. **Hero**: 3D phone floating with staggered title character animations.
  2. **The Temptation**: Camera pushes in toward the phone screen with fly-by bubble parallax and sequential narrative cues.
  3. **The Spiral**: Orbiting camera, real-time typing and deletion simulation, accelerating particle drift, and an animated Regret Meter.
  4. **The Oracle**: Seamless transition where the phone descends, the crystal orb rises glowing, and an interactive consultation card appears.
  5. **The Verdict**: Dramatic orb shake, glitter burst explosion, screen flash, camera vibration, and sound design via Web Audio API.
- **Brutal Verdict Logic**:
  - Categories: `ABSOLUTELY NOT 🚫` (55%), `ASK YOURSELF AGAIN 🤔` (30%), `FINE, TEXT THEM 😬` (15%).
  - 8+ hilarious quotes per category.
  - Personalization support ("Do NOT text Rahul").
  - Easter Egg: Tapping "Ask again" 5 times in a row prompts: *"You already know the answer. Go drink water. 💧"*.
- **Native Sharing**: Web Share API with clipboard fallback and custom toast.
- **Audio Synthesizer**: Procedural Web Audio API sound effects (sub-bass hit, crystal chime, rising frequency charge) with zero external audio assets.
- **Mobile First**: Tested for 375px+ screens, dynamic viewport units (`100svh`), touch-friendly 56px+ tap targets, reduced particle count and DPR capping on mobile devices.
- **Accessibility & Reduced Motion**: Full support for `prefers-reduced-motion`, semantic tags, ARIA attributes, and WebGL-disabled fallbacks.
- **Footer**: "Built by [@arulforge](https://instagram.com/arulforge)" on all views.

---

## 🛠 Tech Stack

- **Vite**
- **Three.js**
- **GSAP** & **GSAP ScrollTrigger**
- **Lenis**
- **HTML5 Canvas & Web Audio API**
- **CSS3 Design Tokens & Glassmorphism**

---

## 🚀 Running Locally

1. Clone or extract the repository:
   ```bash
   cd "should-i-text-my-ex"
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start development server:
   ```bash
   npm run dev
   ```

4. Build for production:
   ```bash
   npm run build
   ```

5. Preview production build:
   ```bash
   npm run preview
   ```

---

## ☁️ Deploy to Vercel

1. Push this repository to GitHub or GitLab.
2. In [Vercel](https://vercel.com), click **Add New Project** and select the repository.
3. Vercel automatically detects the Vite configuration:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Click **Deploy**.

---

## 🎨 Configuration

All tweakable settings (colors, particle counts, probability weights) can be adjusted in the `CONFIG` object at the top of `src/main.js`:

```javascript
export const CONFIG = {
  colors: {
    background: '#0b0b10',
    hotPink: '#ff2e88',
    violet: '#7a5cff',
    cyan: '#00f5d4',
    amber: '#ffb703'
  },
  particles: {
    desktopCount: 800,
    mobileCount: 220
  },
  verdictWeights: {
    NO: 0.55,
    MAYBE: 0.30,
    YES: 0.15
  }
};
```

---

Built with ❤️ and emotional caution by [@arulforge](https://instagram.com/arulforge).
