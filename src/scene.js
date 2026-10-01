// ============================================================================
// THREE.JS 3D SCENE MANAGER
// "Should I Text My Ex?" - Cinematic 3D Experience
// ============================================================================

import * as THREE from 'three';

/**
 * Checks WebGL support
 */
export function isWebGLAvailable() {
  try {
    const canvas = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
  } catch (e) {
    return false;
  }
}

/**
 * Procedural circular gradient texture for soft particles
 */
function createParticleTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');

  const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
  gradient.addColorStop(0.3, 'rgba(255, 120, 200, 0.8)');
  gradient.addColorStop(0.7, 'rgba(122, 92, 255, 0.3)');
  gradient.addColorStop(1, 'rgba(11, 11, 16, 0)');

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 64, 64);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

/**
 * Procedural chat bubble texture on rounded pill
 */
function createBubbleTexture(text, isRightAligned = false, isTyping = false) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 160;
  const ctx = canvas.getContext('2d');

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Background pill
  const x = 16;
  const y = 16;
  const w = 480;
  const h = 128;
  const r = 50;

  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();

  // Glass/neon fill
  if (isRightAligned) {
    const grad = ctx.createLinearGradient(0, 0, 512, 0);
    grad.addColorStop(0, 'rgba(255, 46, 136, 0.85)');
    grad.addColorStop(1, 'rgba(122, 92, 255, 0.9)');
    ctx.fillStyle = grad;
  } else {
    ctx.fillStyle = 'rgba(24, 24, 38, 0.85)';
  }
  ctx.fill();

  // Border glow
  ctx.lineWidth = 4;
  ctx.strokeStyle = isRightAligned ? 'rgba(255, 255, 255, 0.6)' : 'rgba(122, 92, 255, 0.4)';
  ctx.stroke();

  // Text
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 44px "Space Grotesk", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  if (isTyping) {
    // 3 animated-looking dots
    ctx.fillText('• • •', 256, 80);
  } else {
    ctx.fillText(text, 256, 80);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

export class Scene3D {
  constructor(canvasElement, config) {
    this.canvas = canvasElement;
    this.config = config;
    this.isMobile = window.innerWidth <= 768;

    // Animation state
    this.clock = new THREE.Clock();
    this.isRunning = true;
    this.particleSpeedMultiplier = 1.0;
    this.mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };
    this.scrollProgress = 0; // 0 to 1

    // State for interactive spiral screen
    this.screenState = {
      typedText: '',
      showTypingDots: false,
      cursorBlink: true,
      lastBlink: 0
    };

    // Burst particles state
    this.burstParticles = [];

    // Orb shake state
    this.orbShake = 0;

    this.init();
  }

  init() {
    // 1. Scene & Fog
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(this.config.colors.background);
    this.scene.fog = new THREE.FogExp2(this.config.colors.background, 0.045);

    // 2. Camera
    const aspect = window.innerWidth / window.innerHeight;
    this.camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 100);
    this.camera.position.set(0, 0, 7.5);
    this.cameraTarget = new THREE.Vector3(0, 0, 0);

    // 3. Renderer
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: !this.isMobile,
      powerPreference: 'high-performance',
      alpha: false
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);

    // Mobile DPR cap 1.5, desktop 2
    const dpr = Math.min(window.devicePixelRatio || 1, this.isMobile ? 1.5 : 2);
    this.renderer.setPixelRatio(dpr);
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;

    // 4. Lighting Setup
    this.setupLighting();

    // 5. Procedural Smartphone
    this.buildSmartphone();

    // 6. Floating 3D Chat Bubbles
    this.buildChatBubbles();

    // 7. Particle Field
    this.buildParticleField();

    // 8. Glowing Crystal Orb (The Oracle)
    this.buildCrystalOrb();

    // 9. Event Listeners
    this.bindEvents();

    // 10. Start render loop
    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);
  }

  setupLighting() {
    // Soft Ambient
    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(this.ambientLight);

    // Rim Light 1: Hot Pink (#ff2e88) from back-right
    this.pinkRimLight = new THREE.DirectionalLight(new THREE.Color(this.config.colors.hotPink), 3.0);
    this.pinkRimLight.position.set(5, 3, -4);
    this.scene.add(this.pinkRimLight);

    // Rim Light 2: Violet (#7a5cff) from back-left
    this.violetRimLight = new THREE.DirectionalLight(new THREE.Color(this.config.colors.violet), 3.0);
    this.violetRimLight.position.set(-5, -2, -3);
    this.scene.add(this.violetRimLight);

    // Front soft key light
    this.frontLight = new THREE.PointLight(0xffffff, 1.2, 25);
    this.frontLight.position.set(0, 2, 6);
    this.scene.add(this.frontLight);

    // Oracle center glow light
    this.oracleLight = new THREE.PointLight(new THREE.Color(this.config.colors.violet), 0, 15);
    this.oracleLight.position.set(0, -12, 0);
    this.scene.add(this.oracleLight);
  }

  buildSmartphone() {
    this.phoneGroup = new THREE.Group();

    // Smartphone chassis (rounded aesthetic)
    const phoneWidth = 2.2;
    const phoneHeight = 4.5;
    const phoneDepth = 0.22;
    const cornerRadius = 0.28;

    // Body using rounded shape extrusion
    const shape = new THREE.Shape();
    const x = -phoneWidth / 2;
    const y = -phoneHeight / 2;
    const w = phoneWidth;
    const h = phoneHeight;
    const r = cornerRadius;

    shape.moveTo(x + r, y);
    shape.lineTo(x + w - r, y);
    shape.quadraticCurveTo(x + w, y, x + w, y + r);
    shape.lineTo(x + w, y + h - r);
    shape.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    shape.lineTo(x + r, y + h);
    shape.quadraticCurveTo(x, y + h, x, y + h - r);
    shape.lineTo(x, y + r);
    shape.quadraticCurveTo(x, y, x + r, y);

    const extrudeSettings = {
      depth: phoneDepth,
      bevelEnabled: true,
      bevelSegments: 5,
      steps: 1,
      bevelSize: 0.05,
      bevelThickness: 0.05
    };

    const bodyGeometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    bodyGeometry.center();

    // Dark sleek titanium chassis material
    const chassisMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x14141f,
      metalness: 0.85,
      roughness: 0.25,
      clearcoat: 0.6,
      clearcoatRoughness: 0.2
    });

    this.phoneBody = new THREE.Mesh(bodyGeometry, chassisMaterial);
    this.phoneGroup.add(this.phoneBody);

    // Phone Edge Accent Rim (neon metallic trim)
    const rimMaterial = new THREE.MeshStandardMaterial({
      color: 0x2a2a3e,
      metalness: 0.95,
      roughness: 0.15,
      emissive: new THREE.Color(0x7a5cff),
      emissiveIntensity: 0.15
    });
    const edgeTrim = new THREE.Mesh(bodyGeometry.clone(), rimMaterial);
    edgeTrim.scale.set(1.015, 1.015, 0.98);
    this.phoneGroup.add(edgeTrim);

    // Camera bump on the back
    const bumpGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.08, 32);
    bumpGeo.rotateX(Math.PI / 2);
    const cameraBump = new THREE.Mesh(bumpGeo, chassisMaterial);
    cameraBump.position.set(-0.6, 1.5, -phoneDepth / 2 - 0.04);
    this.phoneGroup.add(cameraBump);

    // Camera lenses
    const lensGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.09, 24);
    lensGeo.rotateX(Math.PI / 2);
    const lensMat = new THREE.MeshStandardMaterial({ color: 0x050508, roughness: 0.1, metalness: 0.9 });
    const lens1 = new THREE.Mesh(lensGeo, lensMat);
    lens1.position.set(-0.6, 1.62, -phoneDepth / 2 - 0.06);
    const lens2 = new THREE.Mesh(lensGeo, lensMat);
    lens2.position.set(-0.6, 1.38, -phoneDepth / 2 - 0.06);
    this.phoneGroup.add(lens1);
    this.phoneGroup.add(lens2);

    // Dynamic Screen with 2D Canvas Texture
    this.screenWidth = 2.05;
    this.screenHeight = 4.35;
    this.screenCanvas = document.createElement('canvas');
    this.screenCanvas.width = 512;
    this.screenCanvas.height = 1024;
    this.screenCtx = this.screenCanvas.getContext('2d');

    this.screenTexture = new THREE.CanvasTexture(this.screenCanvas);
    this.screenTexture.minFilter = THREE.LinearFilter;
    this.screenTexture.magFilter = THREE.LinearFilter;

    const screenGeometry = new THREE.PlaneGeometry(this.screenWidth, this.screenHeight);
    const screenMaterial = new THREE.MeshBasicMaterial({
      map: this.screenTexture,
      toneMapped: false
    });

    this.screenMesh = new THREE.Mesh(screenGeometry, screenMaterial);
    this.screenMesh.position.set(0, 0, phoneDepth / 2 + 0.055);
    this.phoneGroup.add(this.screenMesh);

    // Initial render of screen
    this.drawPhoneScreen();

    // Initial phone orientation
    this.phoneGroup.position.set(0, 0, 0);
    this.phoneGroup.rotation.set(0.15, -0.25, 0.05);

    this.scene.add(this.phoneGroup);
  }

  drawPhoneScreen() {
    const ctx = this.screenCtx;
    const w = this.screenCanvas.width;
    const h = this.screenCanvas.height;

    // Dark sleek UI background
    ctx.fillStyle = '#0d0d14';
    ctx.fillRect(0, 0, w, h);

    // Top status bar
    ctx.fillStyle = '#ffffff';
    ctx.font = '600 24px "Inter", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('2:47 AM', 44, 52);

    // Status bar icons (Battery 4%, Wifi)
    ctx.textAlign = 'right';
    ctx.font = '500 20px "Inter", sans-serif';
    ctx.fillStyle = '#ff2e88'; // Red low battery warning!
    ctx.fillText('⚡ 4%', w - 44, 52);

    // Notch / Dynamic Island
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.roundRect(w / 2 - 75, 24, 150, 36, 18);
    ctx.fill();

    // Header bar (Ex Contact)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.06)';
    ctx.fillRect(0, 72, w, 110);

    // Back arrow
    ctx.fillStyle = '#7a5cff';
    ctx.font = 'bold 32px "Inter", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('‹', 24, 140);

    // Avatar
    ctx.beginPath();
    ctx.arc(88, 126, 32, 0, Math.PI * 2);
    const grad = ctx.createLinearGradient(56, 94, 120, 158);
    grad.addColorStop(0, '#ff2e88');
    grad.addColorStop(1, '#7a5cff');
    ctx.fillStyle = grad;
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 24px "Space Grotesk", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('💔', 88, 134);

    // Contact name
    ctx.textAlign = 'left';
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 28px "Space Grotesk", sans-serif';
    ctx.fillText('The Ex', 140, 122);

    // Subtext
    ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.font = '20px "Inter", sans-serif';
    ctx.fillText('Active 4m ago', 140, 150);

    // Chat History Bubbles
    // 1. Incoming (from ex)
    this.drawChatBubbleOnCanvas(ctx, 40, 240, 340, 80, 'did u take my jacket?', false);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.font = '16px "Inter", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('Yesterday 11:22 PM', 44, 345);

    // 2. Outgoing (from you)
    this.drawChatBubbleOnCanvas(ctx, 160, 390, 312, 80, 'no, check your car', true);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.font = '16px "Inter", sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText('Delivered', 470, 495);

    // 3. Incoming
    this.drawChatBubbleOnCanvas(ctx, 40, 530, 360, 80, 'oh ok. anyway...', false);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.font = '16px "Inter", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('Seen 2:14 AM', 44, 635);

    // 4. Interactive Spiral draft bubble or typing dots
    if (this.screenState.showTypingDots) {
      // 3 bouncing dots from ex
      ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.beginPath();
      ctx.roundRect(40, 670, 140, 60, 30);
      ctx.fill();

      const dotTime = Date.now() * 0.006;
      for (let i = 0; i < 3; i++) {
        const bounce = Math.sin(dotTime + i * 1.2) * 5;
        ctx.fillStyle = '#7a5cff';
        ctx.beginPath();
        ctx.arc(75 + i * 28, 700 + bounce, 6, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Input Bar at Bottom
    ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.fillRect(0, h - 140, w, 140);

    // Input pill
    ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.beginPath();
    ctx.roundRect(30, h - 110, w - 120, 68, 34);
    ctx.fill();
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = this.screenState.typedText ? 'rgba(255, 46, 136, 0.8)' : 'rgba(255, 255, 255, 0.15)';
    ctx.stroke();

    // Input Text or Placeholder
    ctx.textAlign = 'left';
    if (this.screenState.typedText) {
      ctx.fillStyle = '#ffffff';
      ctx.font = '24px "Inter", sans-serif';
      ctx.fillText(this.screenState.typedText, 56, h - 68);

      // Blinking cursor
      if (this.screenState.cursorBlink) {
        const textWidth = ctx.measureText(this.screenState.typedText).width;
        ctx.fillStyle = '#ff2e88';
        ctx.fillRect(58 + textWidth, h - 90, 3, 30);
      }
    } else {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.font = '22px "Inter", sans-serif';
      ctx.fillText('iMessage...', 56, h - 68);
    }

    // Send Button Circle
    ctx.beginPath();
    ctx.arc(w - 55, h - 76, 28, 0, Math.PI * 2);
    ctx.fillStyle = this.screenState.typedText ? '#ff2e88' : 'rgba(255, 255, 255, 0.2)';
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 24px "Inter", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('↑', w - 55, h - 68);

    this.screenTexture.needsUpdate = true;
  }

  drawChatBubbleOnCanvas(ctx, x, y, w, h, text, isMe) {
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, 24);
    if (isMe) {
      const grad = ctx.createLinearGradient(x, y, x + w, y + h);
      grad.addColorStop(0, '#ff2e88');
      grad.addColorStop(1, '#7a5cff');
      ctx.fillStyle = grad;
    } else {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    }
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = '24px "Inter", sans-serif';
    ctx.textAlign = isMe ? 'right' : 'left';
    ctx.fillText(text, isMe ? x + w - 24 : x + 24, y + 48);
  }

  buildChatBubbles() {
    this.bubbleGroup = new THREE.Group();

    const bubbleData = [
      { text: 'hey 👀', x: -2.8, y: 1.5, z: 0.8, scale: 0.8, rotZ: -0.08, isRight: false },
      { text: 'u up?', x: 2.7, y: 0.9, z: -0.5, scale: 0.75, rotZ: 0.06, isRight: true },
      { text: 'I miss u', x: -2.5, y: -1.2, z: 1.2, scale: 0.85, rotZ: 0.05, isRight: false },
      { text: 'seen 2:48 AM', x: 2.6, y: -1.6, z: 0.4, scale: 0.7, rotZ: -0.05, isRight: false },
      { text: 'typing...', x: 0, y: -2.4, z: 1.6, scale: 0.75, rotZ: 0.02, isRight: true, isTyping: true }
    ];

    this.bubbles = [];

    bubbleData.forEach((item, index) => {
      const texture = createBubbleTexture(item.text, item.isRight, item.isTyping);
      const geometry = new THREE.PlaneGeometry(2.4, 0.75);
      const material = new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        opacity: 0.95,
        side: THREE.DoubleSide,
        depthWrite: false
      });

      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(item.x, item.y, item.z);
      mesh.rotation.z = item.rotZ;
      mesh.scale.setScalar(item.scale);

      // Store initial base values for floating animation
      mesh.userData = {
        baseX: item.x,
        baseY: item.y,
        baseZ: item.z,
        floatSpeed: 0.8 + index * 0.25,
        floatPhase: index * 1.5,
        floatAmp: 0.15 + (index % 3) * 0.06
      };

      this.bubbleGroup.add(mesh);
      this.bubbles.push(mesh);
    });

    this.scene.add(this.bubbleGroup);
  }

  buildParticleField() {
    // 800 on desktop, 200 on mobile
    const count = this.isMobile ? this.config.particles.mobileCount : this.config.particles.desktopCount;
    this.particleCount = count;

    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);

    const palette = [
      new THREE.Color(this.config.colors.hotPink),
      new THREE.Color(this.config.colors.violet),
      new THREE.Color(this.config.colors.cyan),
      new THREE.Color(0xffffff)
    ];

    for (let i = 0; i < count; i++) {
      // Scatter within a volume
      positions[i * 3 + 0] = (Math.random() - 0.5) * 18;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 22;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 14;

      const chosenColor = palette[Math.floor(Math.random() * palette.length)];
      colors[i * 3 + 0] = chosenColor.r;
      colors[i * 3 + 1] = chosenColor.g;
      colors[i * 3 + 2] = chosenColor.b;

      sizes[i] = 12 + Math.random() * 28;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    const particleTexture = createParticleTexture();

    const material = new THREE.PointsMaterial({
      size: 0.35,
      map: particleTexture,
      vertexColors: true,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.particles = new THREE.Points(geometry, material);
    this.scene.add(this.particles);
  }

  buildCrystalOrb() {
    this.orbGroup = new THREE.Group();

    // 1. Crystal Outer Shell (Icosahedron with MeshPhysicalMaterial transmission & refraction)
    const orbGeometry = new THREE.IcosahedronGeometry(1.4, 3);

    this.orbMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      transmission: 0.92,
      opacity: 1,
      transparent: true,
      roughness: 0.08,
      metalness: 0.1,
      ior: 1.55,
      reflectivity: 0.9,
      clearcoat: 1.0,
      clearcoatRoughness: 0.1,
      emissive: new THREE.Color(this.config.colors.violet),
      emissiveIntensity: 0.65
    });

    this.crystalOrb = new THREE.Mesh(orbGeometry, this.orbMaterial);
    this.orbGroup.add(this.crystalOrb);

    // 2. Glowing Inner Core (Geometric celestial heart)
    const innerGeometry = new THREE.IcosahedronGeometry(0.75, 1);
    this.innerMaterial = new THREE.MeshBasicMaterial({
      wireframe: true,
      color: new THREE.Color(this.config.colors.hotPink),
      transparent: true,
      opacity: 0.7
    });
    this.innerCore = new THREE.Mesh(innerGeometry, this.innerMaterial);
    this.orbGroup.add(this.innerCore);

    // 3. Delicate Gyro Orbit Ring
    const ringGeo = new THREE.TorusGeometry(1.9, 0.02, 16, 80);
    const ringMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(this.config.colors.cyan),
      transparent: true,
      opacity: 0.45
    });
    this.orbRing = new THREE.Mesh(ringGeo, ringMat);
    this.orbRing.rotation.x = Math.PI / 3;
    this.orbGroup.add(this.orbRing);

    // Start parked below view
    this.orbGroup.position.set(0, -12, 0);
    this.scene.add(this.orbGroup);
  }

  /**
   * Triggers the dramatic orb shake, spin up, and glitter explosion
   */
  triggerOrbBurst(verdictColorHex, onComplete) {
    const targetColor = new THREE.Color(verdictColorHex);

    // Shake intensity
    this.orbShake = 0.45;

    // Flare lights
    this.oracleLight.color = targetColor;
    this.oracleLight.intensity = 8.0;

    // Transition orb emissive & inner core colors
    this.orbMaterial.emissive.copy(targetColor);
    this.orbMaterial.emissiveIntensity = 2.5;
    this.innerMaterial.color.copy(targetColor);

    // Create 250 glitter burst particles
    const burstCount = this.isMobile ? 120 : 250;
    const burstGeo = new THREE.BufferGeometry();
    const burstPositions = new Float32Array(burstCount * 3);
    const burstVelocities = [];

    for (let i = 0; i < burstCount; i++) {
      burstPositions[i * 3 + 0] = this.orbGroup.position.x;
      burstPositions[i * 3 + 1] = this.orbGroup.position.y;
      burstPositions[i * 3 + 2] = this.orbGroup.position.z;

      // Spherical burst velocity
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      const speed = 0.08 + Math.random() * 0.22;

      burstVelocities.push({
        x: Math.sin(phi) * Math.cos(theta) * speed,
        y: Math.sin(phi) * Math.sin(theta) * speed,
        z: Math.cos(phi) * speed,
        drag: 0.96,
        life: 1.0,
        decay: 0.015 + Math.random() * 0.02
      });
    }

    burstGeo.setAttribute('position', new THREE.BufferAttribute(burstPositions, 3));

    const burstMat = new THREE.PointsMaterial({
      size: 0.45,
      map: createParticleTexture(),
      color: targetColor,
      transparent: true,
      opacity: 1,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    const burstMesh = new THREE.Points(burstGeo, burstMat);
    this.scene.add(burstMesh);

    this.burstParticles.push({
      mesh: burstMesh,
      velocities: burstVelocities,
      onComplete
    });
  }

  bindEvents() {
    // Mouse / Touch Parallax
    window.addEventListener('mousemove', (e) => {
      this.mouse.targetX = (e.clientX / window.innerWidth) * 2 - 1;
      this.mouse.targetY = -(e.clientY / window.innerHeight) * 2 + 1;
    }, { passive: true });

    // Gyroscope for Mobile (if available)
    if (window.DeviceOrientationEvent) {
      window.addEventListener('deviceorientation', (e) => {
        if (e.gamma !== null && e.beta !== null) {
          this.mouse.targetX = Math.max(-1, Math.min(1, e.gamma / 30));
          this.mouse.targetY = Math.max(-1, Math.min(1, (e.beta - 45) / 30));
        }
      }, { passive: true });
    }

    // Visibility change: pause rendering when tab hidden
    document.addEventListener('visibilitychange', () => {
      this.isRunning = !document.hidden;
      if (this.isRunning) {
        this.clock.start();
        requestAnimationFrame(this.animate);
      }
    });

    // Resize and Orientation Change
    window.addEventListener('resize', () => this.handleResize());
    window.addEventListener('orientationchange', () => {
      setTimeout(() => this.handleResize(), 200);
    });
  }

  handleResize() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    this.isMobile = width <= 768;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(width, height);
    const dpr = Math.min(window.devicePixelRatio || 1, this.isMobile ? 1.5 : 2);
    this.renderer.setPixelRatio(dpr);
  }

  /**
   * Main render loop
   */
  animate() {
    if (!this.isRunning) return;

    requestAnimationFrame(this.animate);

    const delta = Math.min(this.clock.getDelta(), 0.1);
    const time = this.clock.getElapsedTime();

    // 1. Mouse Lerp for smooth parallax
    this.mouse.x += (this.mouse.targetX - this.mouse.x) * 0.05;
    this.mouse.y += (this.mouse.targetY - this.mouse.y) * 0.05;

    // Apply subtle parallax to camera
    const parallaxX = this.mouse.x * 0.4;
    const parallaxY = this.mouse.y * 0.3;
    this.camera.position.x += (parallaxX - (this.camera.position.x - this.cameraBaseX || 0)) * 0.05;
    this.camera.position.y += (parallaxY - (this.camera.position.y - this.cameraBaseY || 0)) * 0.05;

    // 2. Phone Idle floating & rotating (Hero section)
    if (this.phoneGroup) {
      const floatY = Math.sin(time * 1.4) * 0.1;
      const floatRotY = Math.sin(time * 0.8) * 0.06;
      this.phoneGroup.position.y = (this.phoneBaseY || 0) + floatY;
      this.phoneGroup.rotation.y = (this.phoneBaseRotY || -0.25) + floatRotY;
      this.phoneGroup.rotation.x = (this.phoneBaseRotX || 0.15) + Math.cos(time * 1.1) * 0.03;
    }

    // 3. Screen canvas cursor blink and dynamic refresh
    if (time - this.screenState.lastBlink > 0.5) {
      this.screenState.cursorBlink = !this.screenState.cursorBlink;
      this.screenState.lastBlink = time;
      this.drawPhoneScreen();
    } else if (this.screenState.showTypingDots) {
      // Redraw continuously for bouncing typing dots
      this.drawPhoneScreen();
    }

    // 4. Floating Chat Bubbles
    if (this.bubbles) {
      this.bubbles.forEach((bubble) => {
        const u = bubble.userData;
        const bTime = time * u.floatSpeed + u.floatPhase;
        bubble.position.y = u.baseY + Math.sin(bTime) * u.floatAmp;
        bubble.position.x = u.baseX + Math.cos(bTime * 0.8) * (u.floatAmp * 0.5);
      });
    }

    // 5. Particle Field Slow Drift
    if (this.particles) {
      const positions = this.particles.geometry.attributes.position.array;
      const speed = 0.008 * this.particleSpeedMultiplier;

      for (let i = 0; i < this.particleCount; i++) {
        // Slow downward & twisting drift
        positions[i * 3 + 1] -= speed * (0.8 + (i % 5) * 0.2);
        positions[i * 3 + 0] += Math.sin(time * 0.5 + i) * 0.003;

        // Reset if fell below boundary
        if (positions[i * 3 + 1] < -12) {
          positions[i * 3 + 1] = 12;
        }
      }
      this.particles.geometry.attributes.position.needsUpdate = true;
    }

    // 6. Crystal Orb Animations
    if (this.crystalOrb && this.innerCore) {
      // Rotation
      this.crystalOrb.rotation.y += 0.008;
      this.crystalOrb.rotation.x = Math.sin(time * 0.5) * 0.15;

      // Inner core rotates in reverse for dimensional depth
      this.innerCore.rotation.y -= 0.015;
      this.innerCore.rotation.z += 0.01;

      // Ring rotates
      if (this.orbRing) {
        this.orbRing.rotation.z += 0.006;
      }

      // Breathing luminescence
      const breath = 0.5 + Math.sin(time * 2.2) * 0.25;
      if (this.orbShake <= 0) {
        this.orbMaterial.emissiveIntensity = breath;
      }

      // Orb shake animation when activated
      if (this.orbShake > 0) {
        this.orbGroup.position.x = (Math.random() - 0.5) * this.orbShake;
        this.orbGroup.position.y = (this.orbBaseY || 0) + (Math.random() - 0.5) * this.orbShake;
        this.orbGroup.position.z = (Math.random() - 0.5) * this.orbShake;
        this.crystalOrb.rotation.y += 0.2; // spin up rapidly
        this.orbShake -= delta * 0.35;
        if (this.orbShake <= 0) {
          this.orbShake = 0;
          this.orbGroup.position.x = 0;
          this.orbGroup.position.y = this.orbBaseY || 0;
          this.orbGroup.position.z = 0;
        }
      }
    }

    // 7. Burst Particles Lifecycle
    for (let bIndex = this.burstParticles.length - 1; bIndex >= 0; bIndex--) {
      const burst = this.burstParticles[bIndex];
      const posArray = burst.mesh.geometry.attributes.position.array;
      let allDead = true;

      for (let i = 0; i < burst.velocities.length; i++) {
        const vel = burst.velocities[i];
        if (vel.life > 0) {
          allDead = false;
          posArray[i * 3 + 0] += vel.x;
          posArray[i * 3 + 1] += vel.y;
          posArray[i * 3 + 2] += vel.z;

          vel.x *= vel.drag;
          vel.y *= vel.drag;
          vel.z *= vel.drag;
          vel.life -= vel.decay;
        }
      }

      burst.mesh.geometry.attributes.position.needsUpdate = true;
      burst.mesh.material.opacity = Math.max(0, burst.velocities[0].life);

      if (allDead) {
        this.scene.remove(burst.mesh);
        burst.mesh.geometry.dispose();
        burst.mesh.material.dispose();
        if (burst.onComplete) burst.onComplete();
        this.burstParticles.splice(bIndex, 1);
      }
    }

    // Render Scene
    this.renderer.render(this.scene, this.camera);
  }

  /**
   * Updates typing simulation on the phone screen during the Spiral scroll
   */
  setScreenTypingState(typedText, showDots) {
    let changed = false;
    if (this.screenState.typedText !== typedText) {
      this.screenState.typedText = typedText;
      changed = true;
    }
    if (this.screenState.showTypingDots !== showDots) {
      this.screenState.showTypingDots = showDots;
      changed = true;
    }
    if (changed) {
      this.drawPhoneScreen();
    }
  }

  /**
   * Clean disposal of Three.js resources
   */
  dispose() {
    this.isRunning = false;
    window.removeEventListener('resize', this.handleResize);

    this.scene.traverse((obj) => {
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) {
        if (Array.isArray(obj.material)) {
          obj.material.forEach((mat) => mat.dispose());
        } else {
          obj.material.dispose();
        }
      }
    });

    if (this.renderer) {
      this.renderer.dispose();
    }
  }
}
