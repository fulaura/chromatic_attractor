// Cosmic Space-Time Canvas Simulator
// Upgraded high-performance sandbox physics engine

const canvas = document.getElementById('cosmic-canvas');
const ctx = canvas.getContext('2d');
const nebula = document.getElementById('nebula');

// Simulation Settings & Configurations
const settings = {
  starCount: 300,
  starSizeMultiplier: 1.0, // Star size scaling factor
  crossRatio: 0.25, // Ratio of cross flare stars
  baseSpeed: 0.4,
  twinkleActive: true,
  
  // Force Fields parameters
  forceType: 'repel', // repel, attract, vortex, none
  forceStrength: 1.5,
  forceRadius: 180,
  stableRadius: 80, // Accretion disk orbital balance radius

  // Spotlight / Occclusion parameters
  lightMode: 'disabled', // disabled, spotlight, veil
  lightRadius: 200,
  lightSoftness: 100,
  lightAmbient: 0.15, // Ambient ambient light minimum opacity

  // Chromatic Aberration parameters
  aberrationActive: true,
  aberrationMode: 'radial', // radial, linear-x, linear-y, rotational
  aberrationColor: 'rgb', // rgb, cyberpunk, supernova
  aberrationRadius: 120,
  aberrationWidth: 60,
  aberrationSplit: 8, // Master Shift Strength

  warpActive: false, // Starburst radial flow
  colorTheme: 'deep-space' // deep-space, neon-swarm, monochrome
};

// Mouse Interactivity State
const mouse = {
  x: undefined,
  y: undefined,
  targetX: undefined,
  targetY: undefined,
  isDown: false,
  isActive: false,
  sizeMultiplier: 1.0,
  angle: 0 // Auto orbit lissajous phase
};

// Preset Definitions
const presets = {
  'deep-space': {
    starCount: 300,
    starSizeMultiplier: 1.0,
    crossRatio: 25,
    baseSpeed: 0.4,
    twinkleActive: true,
    forceType: 'repel',
    forceStrength: 1.5,
    forceRadius: 180,
    stableRadius: 80,
    lightMode: 'disabled',
    lightRadius: 200,
    lightSoftness: 100,
    lightAmbient: 15,
    aberrationActive: true,
    aberrationMode: 'radial',
    aberrationColor: 'rgb',
    aberrationRadius: 120,
    aberrationWidth: 60,
    aberrationSplit: 8,
    warpActive: false,
    colorTheme: 'deep-space',
    nebulaColor: 'radial-gradient(circle at 50% 50%, rgba(94, 102, 255, 0.04) 0%, rgba(0, 0, 0, 0) 70%)'
  },
  'warp-drive': {
    starCount: 500,
    starSizeMultiplier: 1.2,
    crossRatio: 10,
    baseSpeed: 4.0,
    twinkleActive: false,
    forceType: 'repel',
    forceStrength: 1.0,
    forceRadius: 100,
    stableRadius: 50,
    lightMode: 'disabled',
    lightRadius: 200,
    lightSoftness: 100,
    lightAmbient: 15,
    aberrationActive: true,
    aberrationMode: 'radial',
    aberrationColor: 'cyberpunk',
    aberrationRadius: 200,
    aberrationWidth: 80,
    aberrationSplit: 12,
    warpActive: true,
    colorTheme: 'warp',
    nebulaColor: 'radial-gradient(circle at 50% 50%, rgba(0, 240, 255, 0.05) 0%, rgba(0, 0, 0, 0) 80%)'
  },
  'black-hole': {
    starCount: 400,
    starSizeMultiplier: 0.9,
    crossRatio: 20,
    baseSpeed: 0.2,
    twinkleActive: true,
    forceType: 'attract',
    forceStrength: 3.5,
    forceRadius: 300,
    stableRadius: 80,
    lightMode: 'veil', // Eclipses starfield near singularity core
    lightRadius: 220,
    lightSoftness: 140,
    lightAmbient: 10,
    aberrationActive: true,
    aberrationMode: 'rotational', // Spiral warping
    aberrationColor: 'supernova',
    aberrationRadius: 140,
    aberrationWidth: 100,
    aberrationSplit: 18,
    warpActive: false,
    colorTheme: 'monochrome',
    nebulaColor: 'radial-gradient(circle at 50% 50%, rgba(255, 94, 151, 0.02) 0%, rgba(0, 0, 0, 0) 60%)'
  },
  'nebula-vortex': {
    starCount: 450,
    starSizeMultiplier: 1.1,
    crossRatio: 35,
    baseSpeed: 0.6,
    twinkleActive: true,
    forceType: 'vortex',
    forceStrength: 2.2,
    forceRadius: 250,
    stableRadius: 120,
    lightMode: 'spotlight', // Lights up the galaxy swirl around cursor
    lightRadius: 250,
    lightSoftness: 100,
    lightAmbient: 5,
    aberrationActive: true,
    aberrationMode: 'radial',
    aberrationColor: 'cyberpunk',
    aberrationRadius: 160,
    aberrationWidth: 80,
    aberrationSplit: 10,
    warpActive: false,
    colorTheme: 'neon-swarm',
    nebulaColor: 'radial-gradient(circle at 50% 50%, rgba(255, 0, 255, 0.04) 0%, rgba(0, 0, 255, 0.04) 70%)'
  }
};

let particles = [];
let dpr = window.devicePixelRatio || 1;
let width = window.innerWidth;
let height = window.innerHeight;

// Initialize Canvas Viewport Sizing
function resizeCanvas() {
  dpr = window.devicePixelRatio || 1;
  width = window.innerWidth;
  height = window.innerHeight;
  
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  ctx.scale(dpr, dpr);
  
  if (particles.length === 0) {
    createParticles();
  }
}

// Particle Class Definition
class Particle {
  constructor() {
    this.reset(true);
  }

  reset(fullRandom = false) {
    if (fullRandom) {
      this.x = Math.random() * width;
      this.y = Math.random() * height;
    } else {
      if (settings.warpActive) {
        this.x = width / 2 + (Math.random() - 0.5) * 50;
        this.y = height / 2 + (Math.random() - 0.5) * 50;
      } else {
        if (Math.random() > 0.5) {
          this.x = this.baseVx > 0 ? -10 : width + 10;
          this.y = Math.random() * height;
        } else {
          this.x = Math.random() * width;
          this.y = this.baseVy > 0 ? -10 : height + 10;
        }
      }
    }

    this.vx = 0;
    this.vy = 0;
    
    if (settings.warpActive) {
      const angle = Math.random() * Math.PI * 2;
      const speed = (0.2 + Math.random() * 0.8) * settings.baseSpeed;
      this.baseVx = Math.cos(angle) * speed;
      this.baseVy = Math.sin(angle) * speed;
    } else {
      const angle = (220 + Math.random() * 80) * (Math.PI / 180);
      const speed = (0.1 + Math.random() * 0.9) * settings.baseSpeed;
      this.baseVx = Math.cos(angle) * speed;
      this.baseVy = Math.sin(angle) * speed;
    }

    this.size = 0.5 + Math.random() * 1.5;
    this.baseAlpha = 0.2 + Math.random() * 0.8;
    this.alpha = this.baseAlpha;
    this.twinklePhase = Math.random() * Math.PI * 2;
    this.twinkleSpeed = 0.01 + Math.random() * 0.03;
    
    this.isCross = Math.random() < settings.crossRatio;
    this.flareLength = this.isCross ? 3 + Math.random() * 5 : 0;
    
    this.colorSeed = Math.random();
    this.assignColors();
  }

  assignColors() {
    if (settings.colorTheme === 'neon-swarm') {
      if (this.colorSeed < 0.4) {
        this.r = 0; this.g = 240; this.b = 255;
      } else if (this.colorSeed < 0.8) {
        this.r = 255; this.g = 94; this.b = 200;
      } else {
        this.r = 255; this.g = 215; this.b = 0;
      }
    } else if (settings.colorTheme === 'warp') {
      if (this.colorSeed < 0.6) {
        this.r = 230; this.g = 245; this.b = 255;
      } else {
        this.r = 0; this.g = 200; this.b = 255;
      }
    } else if (settings.colorTheme === 'deep-space') {
      if (this.colorSeed < 0.3) {
        this.r = 165; this.g = 185; this.b = 255;
      } else {
        this.r = 255; this.g = 255; this.b = 255;
      }
    } else {
      this.r = 255; this.g = 255; this.b = 255;
    }
  }

  update() {
    // 1. Twinkle Opacity Math
    if (settings.twinkleActive) {
      this.twinklePhase += this.twinkleSpeed;
      this.alpha = this.baseAlpha + Math.sin(this.twinklePhase) * 0.2;
      this.alpha = Math.max(0.1, Math.min(1.0, this.alpha));
    } else {
      this.alpha = this.baseAlpha;
    }

    // 2. Cosmic Spotlight / Shadow Veil Shader calculations
    if (settings.lightMode !== 'disabled' && mouse.x !== undefined && mouse.y !== undefined) {
      const dx = this.x - mouse.x;
      const dy = this.y - mouse.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      const R = settings.lightRadius;
      const W = settings.lightSoftness;
      const innerRad = R - W / 2;
      const outerRad = R + W / 2;
      
      let T = 0; // spotlight factor (1.0 = fully illuminated, 0.0 = dark shadow)

      if (dist <= innerRad) {
        T = 1.0;
      } else if (dist >= outerRad) {
        T = 0.0;
      } else {
        // Smooth transition inside softness boundary
        const linearFactor = (dist - innerRad) / W;
        T = 0.5 + 0.5 * Math.cos(linearFactor * Math.PI);
      }

      // Invert if Dark Shadow Veil is active
      const factor = settings.lightMode === 'spotlight' ? T : (1.0 - T);
      const spotlightMultiplier = settings.lightAmbient + (1.0 - settings.lightAmbient) * factor;
      
      this.alpha = this.alpha * spotlightMultiplier;
    }

    // 3. Spawns/Streaks calculations in Warp Drive
    if (settings.warpActive) {
      const dx = this.x - width / 2;
      const dy = this.y - height / 2;
      const d = Math.sqrt(dx * dx + dy * dy);
      
      if (d > 10) {
        const accelFactor = 1 + (d / 200) * settings.baseSpeed * 0.15;
        this.vx = (dx / d) * settings.baseSpeed * accelFactor;
        this.vy = (dy / d) * settings.baseSpeed * accelFactor;
      } else {
        this.vx = this.baseVx;
        this.vy = this.baseVy;
      }
    } else {
      this.vx = this.baseVx;
      this.vy = this.baseVy;
    }

    // 4. Force Fields Equations
    if (settings.forceType !== 'none' && mouse.x !== undefined && mouse.y !== undefined) {
      const dx = this.x - mouse.x;
      const dy = this.y - mouse.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < settings.forceRadius) {
        const strength = (1 - dist / settings.forceRadius);
        const effectVal = strength * settings.forceStrength * (mouse.isDown ? 3.5 : 1.0) * mouse.sizeMultiplier;
        
        if (settings.forceType === 'repel') {
          const angle = Math.atan2(dy, dx);
          this.vx += Math.cos(angle) * effectVal * 2.5;
          this.vy += Math.sin(angle) * effectVal * 2.5;
        } 
        else if (settings.forceType === 'attract') {
          const angle = Math.atan2(dy, dx);
          const swirlAngle = angle + Math.PI / 2; // Accretion perpendicular vector
          const R_orb = settings.stableRadius;
          const diff = dist - R_orb;

          // Potential equilibrium force
          if (diff > 0) {
            // Outside stable orbit: Pull inward
            const pullForce = (1 - diff / (settings.forceRadius - R_orb)) * settings.forceStrength * (mouse.isDown ? 2.5 : 1.0) * mouse.sizeMultiplier;
            this.vx -= Math.cos(angle) * pullForce * 1.5;
            this.vy -= Math.sin(angle) * pullForce * 1.5;
          } else {
            // Inside stable orbit: Repel strongly outward to maintain potential core
            const pushForce = (1 - dist / R_orb) * settings.forceStrength * 4.0 * (mouse.isDown ? 3.5 : 1.0) * mouse.sizeMultiplier;
            this.vx += Math.cos(angle) * pushForce * 2.0;
            this.vy += Math.sin(angle) * pushForce * 2.0;
          }

          // Swirling Accretion Disk tangent velocity
          const swirlStrength = (1 - Math.abs(diff) / settings.forceRadius) * settings.forceStrength * 1.8;
          this.vx += Math.cos(swirlAngle) * swirlStrength * (mouse.isDown ? 2.0 : 1.0);
          this.vy += Math.sin(swirlAngle) * swirlStrength * (mouse.isDown ? 2.0 : 1.0);
        } 
        else if (settings.forceType === 'vortex') {
          const angle = Math.atan2(dy, dx);
          const swirlAngle = angle + Math.PI / 2;
          const R_orb = settings.stableRadius;
          const diff = dist - R_orb;
          
          // Pull smoothly in/out towards orbit radius while vortexing
          const swirlStrength = effectVal * 3.0;
          this.vx += Math.cos(swirlAngle) * swirlStrength;
          this.vy += Math.sin(swirlAngle) * swirlStrength;

          if (Math.abs(diff) > 10) {
            const pullVal = diff > 0 ? -effectVal * 0.6 : effectVal * 1.2;
            this.vx += Math.cos(angle) * pullVal;
            this.vy += Math.sin(angle) * pullVal;
          }
        }
      }
    }

    // Integrate physics
    this.x += this.vx;
    this.y += this.vy;

    // Bounds wrapping
    if (settings.warpActive) {
      if (this.x < -20 || this.x > width + 20 || this.y < -20 || this.y > height + 20) {
        this.reset(false);
      }
    } else {
      if (this.x < -30 && this.vx <= 0) this.x = width + 20;
      else if (this.x > width + 30 && this.vx >= 0) this.x = -20;
      
      if (this.y < -30 && this.vy <= 0) this.y = height + 20;
      else if (this.y > height + 30 && this.vy >= 0) this.y = -20;
    }
  }

  draw() {
    let aberrationAmt = 0;
    let dxRed = 0, dyRed = 0;
    let dxBlue = 0, dyBlue = 0;

    // Evaluate Chromatic Aberration Split Offsets
    if (settings.aberrationActive && mouse.x !== undefined && mouse.y !== undefined) {
      const dx = this.x - mouse.x;
      const dy = this.y - mouse.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      const distFromRing = Math.abs(dist - settings.aberrationRadius);
      const halfWidth = settings.aberrationWidth / 2;

      if (distFromRing < halfWidth) {
        const normDist = distFromRing / halfWidth;
        const bellCurve = 1.0 - (normDist * normDist);
        
        aberrationAmt = bellCurve * settings.aberrationSplit * (mouse.isDown ? 1.8 : 1.0);
        const radAngle = Math.atan2(dy, dx);
        
        // 1. Calculate Shift Projections based on selected Aberration Mode
        if (settings.aberrationMode === 'radial') {
          // Radial Expansion (Classic camera lens distortion)
          dxRed = Math.cos(radAngle) * aberrationAmt;
          dyRed = Math.sin(radAngle) * aberrationAmt;
          dxBlue = -dxRed;
          dyBlue = -dyRed;
        } else if (settings.aberrationMode === 'linear-x') {
          // Horizontal Prism split
          dxRed = aberrationAmt;
          dyRed = 0;
          dxBlue = -aberrationAmt;
          dyBlue = 0;
        } else if (settings.aberrationMode === 'linear-y') {
          // Vertical Prism split
          dxRed = 0;
          dyRed = aberrationAmt;
          dxBlue = 0;
          dyBlue = -aberrationAmt;
        } else if (settings.aberrationMode === 'rotational') {
          // Swirling spiral splits (Rotates RGB layers orthogonally)
          const rotAngleRed = radAngle + Math.PI / 2;
          const rotAngleBlue = radAngle - Math.PI / 2;
          dxRed = Math.cos(rotAngleRed) * aberrationAmt;
          dyRed = Math.sin(rotAngleRed) * aberrationAmt;
          dxBlue = Math.cos(rotAngleBlue) * aberrationAmt;
          dyBlue = Math.sin(rotAngleBlue) * aberrationAmt;
        }
      }
    }

    // Dynamic scale integration
    const sizeScaled = this.size * settings.starSizeMultiplier;
    const flareScaled = this.flareLength * settings.starSizeMultiplier;

    // 2. Perform rendering with Sub-pixel Channel Compositing
    if (aberrationAmt > 0.4) {
      ctx.globalCompositeOperation = 'screen';
      
      // Determine Color Spectrum channel values
      let chanA_Color, chanB_Color, chanC_Color;

      if (settings.aberrationColor === 'rgb') {
        // Red, Green, Blue
        chanA_Color = `rgba(255, 0, 80, ${this.alpha})`;  // Red
        chanB_Color = `rgba(0, 255, 100, ${this.alpha})`; // Green (Center Anchor)
        chanC_Color = `rgba(0, 200, 255, ${this.alpha})`; // Blue
      } else if (settings.aberrationColor === 'cyberpunk') {
        // Neon Cyan, Neon Yellow, Neon Magenta
        chanA_Color = `rgba(0, 255, 255, ${this.alpha})`;   // Cyan
        chanB_Color = `rgba(255, 255, 0, ${this.alpha})`;   // Yellow (Center Anchor)
        chanC_Color = `rgba(255, 0, 255, ${this.alpha})`;   // Magenta
      } else {
        // Gold, Pure White, Violet Corona
        chanA_Color = `rgba(255, 200, 0, ${this.alpha})`;   // Gold
        chanB_Color = `rgba(255, 255, 255, ${this.alpha})`; // White (Center Anchor)
        chanC_Color = `rgba(180, 0, 255, ${this.alpha})`;   // Violet
      }
      
      // Render Channel 1 (Red/Cyan/Gold) with shift offset
      this.drawShape(this.x + dxRed, this.y + dyRed, sizeScaled, flareScaled, chanA_Color);
      
      // Render Channel 2 (Green/Yellow/White) at exact center anchor
      this.drawShape(this.x, this.y, sizeScaled, flareScaled, chanB_Color);
      
      // Render Channel 3 (Blue/Magenta/Violet) with opposite shift offset
      this.drawShape(this.x + dxBlue, this.y + dyBlue, sizeScaled, flareScaled, chanC_Color);
      
      ctx.globalCompositeOperation = 'source-over';
    } else {
      // Direct render (Max Frame-rate optimization)
      this.drawShape(this.x, this.y, sizeScaled, flareScaled, `rgba(${this.r}, ${this.g}, ${this.b}, ${this.alpha})`);
    }
  }

  drawShape(x, y, size, flareLength, color) {
    ctx.fillStyle = color;
    ctx.strokeStyle = color;
    
    if (this.isCross) {
      ctx.lineWidth = 1;
      
      ctx.beginPath();
      ctx.moveTo(x - flareLength, y);
      ctx.lineTo(x + flareLength, y);
      ctx.moveTo(x, y - flareLength);
      ctx.lineTo(x, y + flareLength);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(x, y, size * 1.2, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

// Generate the initial particle pool
function createParticles() {
  particles = [];
  const count = settings.starCount;
  for (let i = 0; i < count; i++) {
    particles.push(new Particle());
  }
}

function updateParticleCount() {
  const current = particles.length;
  const target = settings.starCount;
  
  if (target > current) {
    for (let i = current; i < target; i++) {
      particles.push(new Particle());
    }
  } else if (target < current) {
    particles.splice(target);
  }
}

function updateParticleThemes() {
  particles.forEach(p => p.assignColors());
}

// Virtual Auto-Orbit (For idle mouse coordinates)
let idleTime = 0;
function updateVirtualCursor() {
  if (!mouse.isActive) {
    idleTime += 0.008;
    mouse.targetX = width / 2 + Math.sin(idleTime) * (width * 0.23);
    mouse.targetY = height / 2 + Math.cos(idleTime * 0.65) * (height * 0.23);
    
    if (mouse.x === undefined) {
      mouse.x = mouse.targetX;
      mouse.y = mouse.targetY;
    } else {
      mouse.x += (mouse.targetX - mouse.x) * 0.05;
      mouse.y += (mouse.targetY - mouse.y) * 0.05;
    }
  } else {
    mouse.x += (mouse.targetX - mouse.x) * 0.15;
    mouse.y += (mouse.targetY - mouse.y) * 0.15;
  }
}

// Render holographic overlays and scanner fields under particles
function drawInteractiveOverlays() {
  if (mouse.x === undefined || mouse.y === undefined) return;
  
  const pulseScale = 1.0 + Math.sin(Date.now() * 0.003) * 0.03;
  const opacityBase = mouse.isDown ? 0.35 : 0.15;

  // 1. Draw Force Field boundary glow (Repel / Attract Potential Wells)
  if (settings.forceType !== 'none') {
    const fieldRad = settings.forceRadius * pulseScale;
    const stableRad = settings.stableRadius;
    
    const grad = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, fieldRad);
    if (settings.forceType === 'repel') {
      grad.addColorStop(0, `rgba(94, 102, 255, ${opacityBase * 0.8})`);
      grad.addColorStop(0.5, `rgba(94, 102, 255, ${opacityBase * 0.2})`);
      grad.addColorStop(1, 'rgba(94, 102, 255, 0)');
    } else if (settings.forceType === 'attract') {
      // Eclipsing core and gold corona
      grad.addColorStop(0, `rgba(255, 94, 151, ${opacityBase * 1.5})`);
      grad.addColorStop(stableRad / fieldRad, `rgba(255, 94, 151, ${opacityBase * 0.35})`);
      grad.addColorStop(1, 'rgba(255, 94, 151, 0)');
    } else {
      grad.addColorStop(0, `rgba(165, 94, 255, ${opacityBase * 0.8})`);
      grad.addColorStop(0.6, `rgba(165, 94, 255, ${opacityBase * 0.2})`);
      grad.addColorStop(1, 'rgba(165, 94, 255, 0)');
    }
    
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(mouse.x, mouse.y, fieldRad, 0, Math.PI * 2);
    ctx.fill();
    
    // stable orbit vector ring (accretion horizon)
    if (settings.forceType === 'attract' || settings.forceType === 'vortex') {
      ctx.strokeStyle = `rgba(255, 94, 151, ${opacityBase * 0.65})`;
      ctx.lineWidth = 1.0;
      ctx.setLineDash([2, 6]);
      ctx.beginPath();
      ctx.arc(mouse.x, mouse.y, stableRad, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Outer gravity boundary
    ctx.strokeStyle = settings.forceType === 'attract' ? `rgba(255, 94, 151, ${opacityBase * 0.3})` : `rgba(94, 102, 255, ${opacityBase * 0.3})`;
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.arc(mouse.x, mouse.y, fieldRad, 0, Math.PI * 2);
    ctx.stroke();
  }

  // 2. Cosmic Spotlight boundary helper overlays
  if (settings.lightMode !== 'disabled') {
    const lightRad = settings.lightRadius;
    const softness = settings.lightSoftness;
    
    ctx.strokeStyle = settings.lightMode === 'spotlight' ? `rgba(0, 255, 120, ${opacityBase * 0.25})` : `rgba(255, 50, 50, ${opacityBase * 0.25})`;
    ctx.lineWidth = 0.5;
    ctx.setLineDash([3, 10]);
    
    // Light inner core
    ctx.beginPath();
    ctx.arc(mouse.x, mouse.y, Math.max(10, lightRad - softness / 2), 0, Math.PI * 2);
    ctx.stroke();
    
    // Light outer boundary
    ctx.beginPath();
    ctx.arc(mouse.x, mouse.y, lightRad + softness / 2, 0, Math.PI * 2);
    ctx.stroke();
    
    ctx.setLineDash([]);
  }

  // 3. Chromatic Aberration scope ring
  if (settings.aberrationActive) {
    const abRad = settings.aberrationRadius;
    const abWidth = settings.aberrationWidth;

    ctx.strokeStyle = `rgba(255, 255, 255, ${opacityBase * 0.35})`;
    ctx.lineWidth = 0.8;
    ctx.setLineDash([4, 12]);
    
    ctx.save();
    ctx.translate(mouse.x, mouse.y);
    ctx.rotate(Date.now() * 0.0003);
    ctx.beginPath();
    ctx.arc(0, 0, abRad, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
    
    ctx.setLineDash([]);

    const ringGrad = ctx.createRadialGradient(
      mouse.x, mouse.y, abRad - abWidth / 2, 
      mouse.x, mouse.y, abRad + abWidth / 2
    );
    
    if (settings.aberrationColor === 'cyberpunk') {
      ringGrad.addColorStop(0, 'rgba(0, 255, 255, 0)');
      ringGrad.addColorStop(0.5, `rgba(255, 0, 255, ${opacityBase * 0.12})`);
      ringGrad.addColorStop(1, 'rgba(0, 255, 255, 0)');
    } else if (settings.aberrationColor === 'supernova') {
      ringGrad.addColorStop(0, 'rgba(255, 200, 0, 0)');
      ringGrad.addColorStop(0.5, `rgba(180, 0, 255, ${opacityBase * 0.15})`);
      ringGrad.addColorStop(1, 'rgba(255, 200, 0, 0)');
    } else {
      ringGrad.addColorStop(0, 'rgba(0, 240, 255, 0)');
      ringGrad.addColorStop(0.5, `rgba(255, 255, 255, ${opacityBase * 0.12})`);
      ringGrad.addColorStop(1, 'rgba(255, 94, 151, 0)');
    }
    
    ctx.fillStyle = ringGrad;
    ctx.beginPath();
    ctx.arc(mouse.x, mouse.y, abRad + abWidth / 2, 0, Math.PI * 2);
    ctx.arc(mouse.x, mouse.y, abRad - abWidth / 2, 0, Math.PI * 2, true);
    ctx.fill();
  }
}

// Telemetry Metric update frames
let fps = 0;
let lastTime = performance.now();
let frames = 0;

function updateTelemetry() {
  const now = performance.now();
  frames++;
  
  if (now > lastTime + 1000) {
    fps = Math.round((frames * 1000) / (now - lastTime));
    document.getElementById('stat-fps').innerText = `${fps} FPS`;
    frames = 0;
    lastTime = now;
  }

  document.getElementById('stat-particles').innerText = particles.length;
  
  const mX = mouse.isActive ? Math.round(mouse.targetX) : 'Auto';
  const mY = mouse.isActive ? Math.round(mouse.targetY) : 'Orbit';
  document.getElementById('stat-coords').innerText = `X: ${mX}, Y: ${mY}`;
}

// Bind UI Settings sliders to Engine
function bindUIControls() {
  const sStarCount = document.getElementById('star-count');
  const vStarCount = document.getElementById('val-star-count');
  
  const sStarSize = document.getElementById('star-size');
  const vStarSize = document.getElementById('val-star-size');

  const sCrossRatio = document.getElementById('cross-ratio');
  const vCrossRatio = document.getElementById('val-cross-ratio');
  const sBaseSpeed = document.getElementById('base-speed');
  const vBaseSpeed = document.getElementById('val-base-speed');
  const tTwinkle = document.getElementById('twinkle-active');
  
  const fType = document.getElementById('force-type');
  const sForceStr = document.getElementById('force-strength');
  const vForceStr = document.getElementById('val-force-strength');
  const sForceRad = document.getElementById('force-radius');
  const vForceRad = document.getElementById('val-force-radius');
  
  const sStableRad = document.getElementById('stable-radius');
  const vStableRad = document.getElementById('val-stable-radius');
  const stableGroup = document.getElementById('stable-radius-group');

  const lMode = document.getElementById('light-mode');
  const sLightRad = document.getElementById('light-radius');
  const vLightRad = document.getElementById('val-light-radius');
  const sLightSoft = document.getElementById('light-softness');
  const vLightSoft = document.getElementById('val-light-softness');
  const sLightAmb = document.getElementById('light-ambient');
  const vLightAmb = document.getElementById('val-light-ambient');
  
  const lRadiusGroup = document.getElementById('light-radius-group');
  const lSoftnessGroup = document.getElementById('light-softness-group');
  const lAmbientGroup = document.getElementById('light-ambient-group');

  const tAberration = document.getElementById('aberration-active');
  const sAberrationMode = document.getElementById('aberration-mode');
  const sAberrationColor = document.getElementById('aberration-color');
  const sAberrationRad = document.getElementById('aberration-radius');
  const vAberrationRad = document.getElementById('val-aberration-radius');
  const sAberrationWidth = document.getElementById('aberration-width');
  const vAberrationWidth = document.getElementById('val-aberration-width');
  const sAberrationSplit = document.getElementById('aberration-split');
  const vAberrationSplit = document.getElementById('val-aberration-split');

  const presetsGrid = document.querySelectorAll('.btn-preset');
  
  // Handlers
  sStarCount.addEventListener('input', (e) => {
    settings.starCount = parseInt(e.target.value);
    vStarCount.innerText = settings.starCount;
    updateParticleCount();
  });

  sStarSize.addEventListener('input', (e) => {
    settings.starSizeMultiplier = parseFloat(e.target.value);
    vStarSize.innerText = `${settings.starSizeMultiplier.toFixed(1)}x`;
  });

  sCrossRatio.addEventListener('input', (e) => {
    const val = parseInt(e.target.value);
    settings.crossRatio = val / 100;
    vCrossRatio.innerText = `${val}%`;
    particles.forEach(p => {
      p.isCross = Math.random() < settings.crossRatio;
      p.flareLength = p.isCross ? 3 + Math.random() * 5 : 0;
    });
  });

  sBaseSpeed.addEventListener('input', (e) => {
    settings.baseSpeed = parseFloat(e.target.value);
    vBaseSpeed.innerText = `${settings.baseSpeed.toFixed(1)}x`;
    particles.forEach(p => {
      const angle = Math.atan2(p.baseVy, p.baseVx);
      p.baseVx = Math.cos(angle) * (0.1 + Math.random() * 0.9) * settings.baseSpeed;
      p.baseVy = Math.sin(angle) * (0.1 + Math.random() * 0.9) * settings.baseSpeed;
    });
  });

  tTwinkle.addEventListener('change', (e) => {
    settings.twinkleActive = e.target.checked;
  });

  // Dynamic collapsible menu bindings
  const updateForceUIVisibility = (val) => {
    if (val === 'attract' || val === 'vortex') {
      stableGroup.classList.remove('hidden');
    } else {
      stableGroup.classList.add('hidden');
    }
  };

  fType.addEventListener('change', (e) => {
    settings.forceType = e.target.value;
    updateForceUIVisibility(settings.forceType);
  });

  sForceStr.addEventListener('input', (e) => {
    settings.forceStrength = parseFloat(e.target.value);
    vForceStr.innerText = settings.forceStrength.toFixed(1);
  });

  sForceRad.addEventListener('input', (e) => {
    settings.forceRadius = parseInt(e.target.value);
    vForceRad.innerText = `${settings.forceRadius}px`;
  });

  sStableRad.addEventListener('input', (e) => {
    settings.stableRadius = parseInt(e.target.value);
    vStableRad.innerText = `${settings.stableRadius}px`;
  });

  const updateLightUIVisibility = (val) => {
    if (val === 'disabled') {
      lRadiusGroup.classList.add('hidden');
      lSoftnessGroup.classList.add('hidden');
      lAmbientGroup.classList.add('hidden');
    } else {
      lRadiusGroup.classList.remove('hidden');
      lSoftnessGroup.classList.remove('hidden');
      lAmbientGroup.classList.remove('hidden');
    }
  };

  lMode.addEventListener('change', (e) => {
    settings.lightMode = e.target.value;
    updateLightUIVisibility(settings.lightMode);
  });

  sLightRad.addEventListener('input', (e) => {
    settings.lightRadius = parseInt(e.target.value);
    vLightRad.innerText = `${settings.lightRadius}px`;
  });

  sLightSoft.addEventListener('input', (e) => {
    settings.lightSoftness = parseInt(e.target.value);
    vLightSoft.innerText = `${settings.lightSoftness}px`;
  });

  sLightAmb.addEventListener('input', (e) => {
    const val = parseInt(e.target.value);
    settings.lightAmbient = val / 100;
    vLightAmb.innerText = `${val}%`;
  });

  tAberration.addEventListener('change', (e) => {
    settings.aberrationActive = e.target.checked;
  });

  sAberrationMode.addEventListener('change', (e) => {
    settings.aberrationMode = e.target.value;
  });

  sAberrationColor.addEventListener('change', (e) => {
    settings.aberrationColor = e.target.value;
  });

  sAberrationRad.addEventListener('input', (e) => {
    settings.aberrationRadius = parseInt(e.target.value);
    vAberrationRad.innerText = `${settings.aberrationRadius}px`;
  });

  sAberrationWidth.addEventListener('input', (e) => {
    settings.aberrationWidth = parseInt(e.target.value);
    vAberrationWidth.innerText = `${settings.aberrationWidth}px`;
  });

  sAberrationSplit.addEventListener('input', (e) => {
    settings.aberrationSplit = parseInt(e.target.value);
    vAberrationSplit.innerText = `${settings.aberrationSplit}px`;
  });

  presetsGrid.forEach(btn => {
    btn.addEventListener('click', () => {
      presetsGrid.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      applyPreset(btn.dataset.preset);
    });
  });

  // Initial runs
  updateForceUIVisibility(settings.forceType);
  updateLightUIVisibility(settings.lightMode);
}

// Preset applicator
function applyPreset(presetKey) {
  const preset = presets[presetKey];
  if (!preset) return;

  Object.keys(preset).forEach(key => {
    if (key !== 'nebulaColor') {
      settings[key] = preset[key];
    }
  });

  nebula.style.background = preset.nebulaColor;

  // Synch HTML ranges and dropdowns
  document.getElementById('star-count').value = preset.starCount;
  document.getElementById('val-star-count').innerText = preset.starCount;

  document.getElementById('star-size').value = preset.starSizeMultiplier;
  document.getElementById('val-star-size').innerText = `${preset.starSizeMultiplier.toFixed(1)}x`;

  document.getElementById('cross-ratio').value = preset.crossRatio;
  document.getElementById('val-cross-ratio').innerText = `${preset.crossRatio}%`;

  document.getElementById('base-speed').value = preset.baseSpeed;
  document.getElementById('val-base-speed').innerText = `${preset.baseSpeed.toFixed(1)}x`;

  document.getElementById('twinkle-active').checked = preset.twinkleActive;

  document.getElementById('force-type').value = preset.forceType;

  document.getElementById('force-strength').value = preset.forceStrength;
  document.getElementById('val-force-strength').innerText = preset.forceStrength.toFixed(1);

  document.getElementById('force-radius').value = preset.forceRadius;
  document.getElementById('val-force-radius').innerText = `${preset.forceRadius}px`;

  document.getElementById('stable-radius').value = preset.stableRadius;
  document.getElementById('val-stable-radius').innerText = `${preset.stableRadius}px`;

  document.getElementById('light-mode').value = preset.lightMode;
  document.getElementById('light-radius').value = preset.lightRadius;
  document.getElementById('val-light-radius').innerText = `${preset.lightRadius}px`;
  document.getElementById('light-softness').value = preset.lightSoftness;
  document.getElementById('val-light-softness').innerText = `${preset.lightSoftness}px`;
  document.getElementById('light-ambient').value = preset.lightAmbient;
  document.getElementById('val-light-ambient').innerText = `${preset.lightAmbient}%`;

  document.getElementById('aberration-active').checked = preset.aberrationActive;
  document.getElementById('aberration-mode').value = preset.aberrationMode;
  document.getElementById('aberration-color').value = preset.aberrationColor;

  document.getElementById('aberration-radius').value = preset.aberrationRadius;
  document.getElementById('val-aberration-radius').innerText = `${preset.aberrationRadius}px`;

  document.getElementById('aberration-width').value = preset.aberrationWidth;
  document.getElementById('val-aberration-width').innerText = `${preset.aberrationWidth}px`;

  document.getElementById('aberration-split').value = preset.aberrationSplit;
  document.getElementById('val-aberration-split').innerText = `${preset.aberrationSplit}px`;

  // UI Visibility collapsible overrides
  const stableGroup = document.getElementById('stable-radius-group');
  if (preset.forceType === 'attract' || preset.forceType === 'vortex') {
    stableGroup.classList.remove('hidden');
  } else {
    stableGroup.classList.add('hidden');
  }

  const lRadiusGroup = document.getElementById('light-radius-group');
  const lSoftnessGroup = document.getElementById('light-softness-group');
  const lAmbientGroup = document.getElementById('light-ambient-group');
  if (preset.lightMode === 'disabled') {
    lRadiusGroup.classList.add('hidden');
    lSoftnessGroup.classList.add('hidden');
    lAmbientGroup.classList.add('hidden');
  } else {
    lRadiusGroup.classList.remove('hidden');
    lSoftnessGroup.classList.remove('hidden');
    lAmbientGroup.classList.remove('hidden');
  }

  // Reload particle instances
  updateParticleCount();
  updateParticleThemes();
  particles.forEach(p => p.reset(true));
}

// Mouse/Touch triggers setup
function setupInputListeners() {
  window.addEventListener('mousemove', (e) => {
    mouse.targetX = e.clientX;
    mouse.targetY = e.clientY;
    mouse.isActive = true;
    idleTime = 0;
  });

  window.addEventListener('mouseleave', () => {
    mouse.isActive = false;
  });

  window.addEventListener('mousedown', (e) => {
    if (e.target.closest('#control-panel') || e.target.closest('#panel-trigger')) return;
    mouse.isDown = true;
    gsapAnimateMultiplier(2.2);
  });

  window.addEventListener('mouseup', () => {
    mouse.isDown = false;
    gsapAnimateMultiplier(1.0);
  });

  window.addEventListener('touchmove', (e) => {
    if (e.touches.length > 0) {
      mouse.targetX = e.touches[0].clientX;
      mouse.targetY = e.touches[0].clientY;
      mouse.isActive = true;
      idleTime = 0;
    }
  }, { passive: true });

  window.addEventListener('touchstart', (e) => {
    if (e.target.closest('#control-panel') || e.target.closest('#panel-trigger')) return;
    mouse.targetX = e.touches[0].clientX;
    mouse.targetY = e.touches[0].clientY;
    mouse.isActive = true;
    mouse.isDown = true;
    gsapAnimateMultiplier(2.2);
  }, { passive: true });

  window.addEventListener('touchend', () => {
    mouse.isDown = false;
    gsapAnimateMultiplier(1.0);
  });
}

// Smooth easing math for double collapses on hold click
let multInterval;
function gsapAnimateMultiplier(targetValue) {
  clearInterval(multInterval);
  multInterval = setInterval(() => {
    const diff = targetValue - mouse.sizeMultiplier;
    if (Math.abs(diff) < 0.01) {
      mouse.sizeMultiplier = targetValue;
      clearInterval(multInterval);
    } else {
      mouse.sizeMultiplier += diff * 0.15;
    }
  }, 16);
}

// Hide/Show Glass controls panel
function bindPanelToggles() {
  const panel = document.getElementById('control-panel');
  const trigger = document.getElementById('panel-trigger');
  const minimizeBtn = document.getElementById('minimize-btn');

  minimizeBtn.addEventListener('click', () => {
    panel.classList.add('minimized');
    trigger.classList.add('visible');
  });

  trigger.addEventListener('click', () => {
    panel.classList.remove('minimized');
    trigger.classList.remove('visible');
  });
}

// Main Frame physics & draw Loop
function loop() {
  if (settings.warpActive) {
    ctx.fillStyle = 'rgba(2, 2, 6, 0.12)';
    ctx.fillRect(0, 0, width, height);
  } else {
    ctx.clearRect(0, 0, width, height);
  }

  updateVirtualCursor();
  drawInteractiveOverlays();

  particles.forEach(p => {
    p.update();
    p.draw();
  });

  updateTelemetry();
  requestAnimationFrame(loop);
}

function init() {
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);
  
  setupInputListeners();
  bindUIControls();
  bindPanelToggles();
  
  nebula.style.background = presets['deep-space'].nebulaColor;
  
  loop();
}

window.addEventListener('DOMContentLoaded', init);
