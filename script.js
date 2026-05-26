// Cosmic Space-Time Canvas Simulator
// High-performance canvas particle engine with force fields and chromatic aberration

const canvas = document.getElementById('cosmic-canvas');
const ctx = canvas.getContext('2d');
const nebula = document.getElementById('nebula');

// Simulation Settings & Configurations
const settings = {
  starCount: 300,
  crossRatio: 0.25, // 25% "+" stars, 75% dot stars
  baseSpeed: 0.4,
  twinkleActive: true,
  forceType: 'repel', // repel, attract, vortex, none
  forceStrength: 1.5,
  forceRadius: 180,
  aberrationActive: true,
  aberrationRadius: 120,
  aberrationWidth: 60,
  aberrationSplit: 8,
  warpActive: false, // Starburst flow from center for Warp Drive preset
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
  angle: 0 // Used for virtual cursor orbit
};

// Preset Definitions
const presets = {
  'deep-space': {
    starCount: 300,
    crossRatio: 25,
    baseSpeed: 0.4,
    twinkleActive: true,
    forceType: 'repel',
    forceStrength: 1.5,
    forceRadius: 180,
    aberrationActive: true,
    aberrationRadius: 120,
    aberrationWidth: 60,
    aberrationSplit: 8,
    warpActive: false,
    colorTheme: 'deep-space',
    nebulaColor: 'radial-gradient(circle at 50% 50%, rgba(94, 102, 255, 0.04) 0%, rgba(0, 0, 0, 0) 70%)'
  },
  'warp-drive': {
    starCount: 500,
    crossRatio: 10,
    baseSpeed: 4.0,
    twinkleActive: false,
    forceType: 'repel',
    forceStrength: 1.0,
    forceRadius: 100,
    aberrationActive: true,
    aberrationRadius: 200,
    aberrationWidth: 80,
    aberrationSplit: 12,
    warpActive: true,
    colorTheme: 'warp',
    nebulaColor: 'radial-gradient(circle at 50% 50%, rgba(0, 240, 255, 0.05) 0%, rgba(0, 0, 0, 0) 80%)'
  },
  'black-hole': {
    starCount: 400,
    crossRatio: 20,
    baseSpeed: 0.2,
    twinkleActive: true,
    forceType: 'attract',
    forceStrength: 3.5,
    forceRadius: 300,
    aberrationActive: true,
    aberrationRadius: 140,
    aberrationWidth: 100,
    aberrationSplit: 18,
    warpActive: false,
    colorTheme: 'monochrome',
    nebulaColor: 'radial-gradient(circle at 50% 50%, rgba(255, 94, 151, 0.03) 0%, rgba(0, 0, 0, 0) 60%)'
  },
  'nebula-vortex': {
    starCount: 450,
    crossRatio: 35,
    baseSpeed: 0.6,
    twinkleActive: true,
    forceType: 'vortex',
    forceStrength: 2.2,
    forceRadius: 250,
    aberrationActive: true,
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

// Initialize Canvas Sizing
function resizeCanvas() {
  dpr = window.devicePixelRatio || 1;
  width = window.innerWidth;
  height = window.innerHeight;
  
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  ctx.scale(dpr, dpr);
  
  // Re-generate particles to fit new canvas size if count changed or initializing
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
    // Spatial positioning
    if (fullRandom) {
      this.x = Math.random() * width;
      this.y = Math.random() * height;
    } else {
      // If warp mode is active, spawn particles at screen center
      if (settings.warpActive) {
        this.x = width / 2 + (Math.random() - 0.5) * 50;
        this.y = height / 2 + (Math.random() - 0.5) * 50;
      } else {
        // Linear wrap spawning: Spawn right at the boundary opposite of movement
        if (Math.random() > 0.5) {
          this.x = this.baseVx > 0 ? -10 : width + 10;
          this.y = Math.random() * height;
        } else {
          this.x = Math.random() * width;
          this.y = this.baseVy > 0 ? -10 : height + 10;
        }
      }
    }

    // Velocity vectors
    this.vx = 0;
    this.vy = 0;
    
    // Set natural drift direction based on canvas coordinate space
    if (settings.warpActive) {
      // Warp direction is outward from center
      const angle = Math.random() * Math.PI * 2;
      const speed = (0.2 + Math.random() * 0.8) * settings.baseSpeed;
      this.baseVx = Math.cos(angle) * speed;
      this.baseVy = Math.sin(angle) * speed;
      this.warpDistance = 0;
    } else {
      // Normal drift
      const angle = (220 + Math.random() * 80) * (Math.PI / 180); // Drift upwards and left
      const speed = (0.1 + Math.random() * 0.9) * settings.baseSpeed;
      this.baseVx = Math.cos(angle) * speed;
      this.baseVy = Math.sin(angle) * speed;
    }

    // Visual attributes
    this.size = 0.5 + Math.random() * 1.5;
    this.baseAlpha = 0.2 + Math.random() * 0.8;
    this.alpha = this.baseAlpha;
    this.twinklePhase = Math.random() * Math.PI * 2;
    this.twinkleSpeed = 0.01 + Math.random() * 0.03;
    
    // Determine type (Cross vs Dot)
    this.isCross = Math.random() < settings.crossRatio;
    this.flareLength = this.isCross ? 3 + Math.random() * 5 : 0;
    
    // Dynamic Hue customization depending on palette theme
    this.colorSeed = Math.random();
    this.assignColors();
  }

  assignColors() {
    if (settings.colorTheme === 'neon-swarm') {
      // Neon pinks, cyan, and vibrant golds
      if (this.colorSeed < 0.4) {
        this.r = 0; this.g = 240; this.b = 255; // Neon Cyan
      } else if (this.colorSeed < 0.8) {
        this.r = 255; this.g = 94; this.b = 200; // Neon Pink
      } else {
        this.r = 255; this.g = 215; this.b = 0; // Neon Gold
      }
    } else if (settings.colorTheme === 'warp') {
      // Warp drive: Cyan/white streaks
      if (this.colorSeed < 0.6) {
        this.r = 230; this.g = 245; this.b = 255; // Icy White
      } else {
        this.r = 0; this.g = 200; this.b = 255; // Cosmic Cyan
      }
    } else if (settings.colorTheme === 'deep-space') {
      // Standard deep space: Soft blue stars and white stars
      if (this.colorSeed < 0.3) {
        this.r = 165; this.g = 185; this.b = 255; // Soft Celestial Blue
      } else {
        this.r = 255; this.g = 255; this.b = 255; // Pure White
      }
    } else {
      // Monochrome clean
      this.r = 255; this.g = 255; this.b = 255;
    }
  }

  update() {
    // Twinkle modulation
    if (settings.twinkleActive) {
      this.twinklePhase += this.twinkleSpeed;
      this.alpha = this.baseAlpha + Math.sin(this.twinklePhase) * 0.2;
      this.alpha = Math.max(0.1, Math.min(1.0, this.alpha));
    } else {
      this.alpha = this.baseAlpha;
    }

    // Starburst exponential acceleration in Warp Drive
    if (settings.warpActive) {
      const dx = this.x - width / 2;
      const dy = this.y - height / 2;
      const d = Math.sqrt(dx * dx + dy * dy);
      
      if (d > 10) {
        // Accelerate stars as they move outwards
        const accelFactor = 1 + (d / 200) * settings.baseSpeed * 0.15;
        this.vx = (dx / d) * settings.baseSpeed * accelFactor;
        this.vy = (dy / d) * settings.baseSpeed * accelFactor;
        this.size = Math.max(0.4, (d / width) * 2.5); // Stars grow as they rush past
      } else {
        this.vx = this.baseVx;
        this.vy = this.baseVy;
      }
    } else {
      // Reset to drift values
      this.vx = this.baseVx;
      this.vy = this.baseVy;
    }

    // Force Field Calculations
    if (settings.forceType !== 'none' && mouse.x !== undefined && mouse.y !== undefined) {
      const dx = this.x - mouse.x;
      const dy = this.y - mouse.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < settings.forceRadius) {
        // Calculate interaction strength (inverse linear gradient fade, peak at center)
        const strength = (1 - dist / settings.forceRadius);
        const effectVal = strength * settings.forceStrength * (mouse.isDown ? 3.5 : 1.0) * mouse.sizeMultiplier;
        
        if (settings.forceType === 'repel') {
          // Push away from cursor
          const angle = Math.atan2(dy, dx);
          this.vx += Math.cos(angle) * effectVal * 2.5;
          this.vy += Math.sin(angle) * effectVal * 2.5;
        } else if (settings.forceType === 'attract') {
          // Pull towards cursor (Gravitational)
          const angle = Math.atan2(dy, dx);
          this.vx -= Math.cos(angle) * effectVal * 3.5;
          this.vy -= Math.sin(angle) * effectVal * 3.5;

          // If clicked and very close, shrink and pull completely into singularity
          if (mouse.isDown && dist < 40) {
            this.x += (mouse.x - this.x) * 0.2;
            this.y += (mouse.y - this.y) * 0.2;
            this.alpha *= 0.8;
            if (dist < 5) this.reset(false);
          }
        } else if (settings.forceType === 'vortex') {
          // Tangential vortex rotation
          const angle = Math.atan2(dy, dx);
          const swirlAngle = angle + Math.PI / 2; // Tangent vector
          
          // Pull slightly in and swirl intensely
          const pullVal = effectVal * 0.5;
          this.vx += (Math.cos(swirlAngle) * effectVal * 3.0) - (Math.cos(angle) * pullVal);
          this.vy += (Math.sin(swirlAngle) * effectVal * 3.0) - (Math.sin(angle) * pullVal);
        }
      }
    }

    // Physics movement integration
    this.x += this.vx;
    this.y += this.vy;

    // Boundary Wrap / Reset
    if (settings.warpActive) {
      // Warp Mode: reset if offscreen
      if (this.x < -20 || this.x > width + 20 || this.y < -20 || this.y > height + 20) {
        this.reset(false);
      }
    } else {
      // Drift wrap bounds
      if (this.x < -30 && this.vx <= 0) this.x = width + 20;
      else if (this.x > width + 30 && this.vx >= 0) this.x = -20;
      
      if (this.y < -30 && this.vy <= 0) this.y = height + 20;
      else if (this.y > height + 30 && this.vy >= 0) this.y = -20;
    }
  }

  draw() {
    // 1. Calculate chromatic aberration split distance based on mouse position
    let aberrationAmt = 0;
    let radAngle = 0;

    if (settings.aberrationActive && mouse.x !== undefined && mouse.y !== undefined) {
      const dx = this.x - mouse.x;
      const dy = this.y - mouse.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      // Check if inside aberration ring zone
      const distFromRing = Math.abs(dist - settings.aberrationRadius);
      const halfWidth = settings.aberrationWidth / 2;

      if (distFromRing < halfWidth) {
        // Bell-shaped displacement factor (quadratic peak in center of ring, fades at borders)
        const normDist = distFromRing / halfWidth;
        const bellCurve = 1.0 - (normDist * normDist);
        
        aberrationAmt = bellCurve * settings.aberrationSplit * (mouse.isDown ? 1.8 : 1.0);
        radAngle = Math.atan2(dy, dx);
      }
    }

    // 2. Perform rendering
    if (aberrationAmt > 0.4) {
      // Enable Screen blending to combine sub-pixel RGB layers back to white perfectly
      ctx.globalCompositeOperation = 'screen';
      
      // Calculate split vector projections
      const dxRed = Math.cos(radAngle) * aberrationAmt;
      const dyRed = Math.sin(radAngle) * aberrationAmt;
      
      // Red Channel (Offset outwards)
      this.drawShape(this.x + dxRed, this.y + dyRed, `rgba(255, 0, 80, ${this.alpha})`);
      
      // Blue Channel (Offset inwards)
      this.drawShape(this.x - dxRed, this.y - dyRed, `rgba(0, 200, 255, ${this.alpha})`);
      
      // Green Channel (Anchor at center or minor orthogonal offset)
      this.drawShape(this.x, this.y, `rgba(0, 255, 100, ${this.alpha})`);
      
      // Restore default compositing
      ctx.globalCompositeOperation = 'source-over';
    } else {
      // Normal single rendering pass (extremely high performance)
      this.drawShape(this.x, this.y, `rgba(${this.r}, ${this.g}, ${this.b}, ${this.alpha})`);
    }
  }

  drawShape(x, y, color) {
    ctx.fillStyle = color;
    ctx.strokeStyle = color;
    
    if (this.isCross) {
      // "+" shaped lens flare stars
      ctx.lineWidth = 1;
      
      ctx.beginPath();
      // Horizontal flare spike
      ctx.moveTo(x - this.flareLength, y);
      ctx.lineTo(x + this.flareLength, y);
      // Vertical flare spike
      ctx.moveTo(x, y - this.flareLength);
      ctx.lineTo(x, y + this.flareLength);
      ctx.stroke();

      // Core glow
      ctx.beginPath();
      ctx.arc(x, y, this.size * 1.2, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Beautiful spherical star dot
      ctx.beginPath();
      ctx.arc(x, y, this.size, 0, Math.PI * 2);
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

// Handle particle count adjustments dynamically
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

// Re-evaluate star color assignments
function updateParticleThemes() {
  particles.forEach(p => p.assignColors());
}

// Virtual Auto-Orbit (Lissajous path for mouse if user is idle)
let idleTime = 0;
function updateVirtualCursor() {
  if (!mouse.isActive) {
    idleTime += 0.008;
    // Lissajous curve movement
    mouse.targetX = width / 2 + Math.sin(idleTime) * (width * 0.25);
    mouse.targetY = height / 2 + Math.cos(idleTime * 0.7) * (height * 0.25);
    
    // Smoothly drag virtual coordinates
    if (mouse.x === undefined) {
      mouse.x = mouse.targetX;
      mouse.y = mouse.targetY;
    } else {
      mouse.x += (mouse.targetX - mouse.x) * 0.05;
      mouse.y += (mouse.targetY - mouse.y) * 0.05;
    }
  } else {
    // Interpolate towards physical mouse pointer
    mouse.x += (mouse.targetX - mouse.x) * 0.15;
    mouse.y += (mouse.targetY - mouse.y) * 0.15;
  }
}

// Rendering the UI Lens/Grid indicators around the cursor
function drawInteractiveOverlays() {
  if (mouse.x === undefined || mouse.y === undefined) return;
  
  const pulseScale = 1.0 + Math.sin(Date.now() * 0.003) * 0.03;
  const opacityBase = mouse.isDown ? 0.35 : 0.15;

  // 1. Draw Force Field boundary glow (faint indigo/cyan disk)
  if (settings.forceType !== 'none') {
    const fieldRad = settings.forceRadius * pulseScale;
    
    const grad = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, fieldRad);
    if (settings.forceType === 'repel') {
      grad.addColorStop(0, `rgba(94, 102, 255, ${opacityBase * 0.8})`);
      grad.addColorStop(0.5, `rgba(94, 102, 255, ${opacityBase * 0.2})`);
      grad.addColorStop(1, 'rgba(94, 102, 255, 0)');
    } else if (settings.forceType === 'attract') {
      grad.addColorStop(0, `rgba(255, 94, 151, ${opacityBase * 0.8})`);
      grad.addColorStop(0.6, `rgba(255, 94, 151, ${opacityBase * 0.2})`);
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
    
    // Fine boundary ring
    ctx.strokeStyle = settings.forceType === 'attract' ? `rgba(255, 94, 151, ${opacityBase * 0.4})` : `rgba(94, 102, 255, ${opacityBase * 0.4})`;
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.arc(mouse.x, mouse.y, fieldRad, 0, Math.PI * 2);
    ctx.stroke();
  }

  // 2. Draw Chromatic Aberration focal ring (sci-fi vector scope)
  if (settings.aberrationActive) {
    const abRad = settings.aberrationRadius;
    const abWidth = settings.aberrationWidth;

    // Faint ring indicating the aberration center
    ctx.strokeStyle = `rgba(255, 255, 255, ${opacityBase * 0.35})`;
    ctx.lineWidth = 0.8;
    ctx.setLineDash([4, 12]); // Dash ring
    
    // Rotate ring overlay over time
    ctx.save();
    ctx.translate(mouse.x, mouse.y);
    ctx.rotate(Date.now() * 0.0003);
    ctx.beginPath();
    ctx.arc(0, 0, abRad, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
    
    ctx.setLineDash([]); // Reset dash

    // Draw aberration scope zone gradient
    const ringGrad = ctx.createRadialGradient(
      mouse.x, mouse.y, abRad - abWidth / 2, 
      mouse.x, mouse.y, abRad + abWidth / 2
    );
    ringGrad.addColorStop(0, 'rgba(0, 240, 255, 0)');
    ringGrad.addColorStop(0.5, `rgba(255, 255, 255, ${opacityBase * 0.12})`);
    ringGrad.addColorStop(1, 'rgba(255, 94, 151, 0)');
    
    ctx.fillStyle = ringGrad;
    ctx.beginPath();
    ctx.arc(mouse.x, mouse.y, abRad + abWidth / 2, 0, Math.PI * 2);
    ctx.arc(mouse.x, mouse.y, abRad - abWidth / 2, 0, Math.PI * 2, true); // Ring path punch out
    ctx.fill();
  }
}

// Frame Rate & Telemetry Management
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

// Bind UI Settings Dashboard Controls to Engine
function bindUIControls() {
  // Elements
  const sStarCount = document.getElementById('star-count');
  const vStarCount = document.getElementById('val-star-count');
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

  const tAberration = document.getElementById('aberration-active');
  const sAberrationRad = document.getElementById('aberration-radius');
  const vAberrationRad = document.getElementById('val-aberration-radius');
  const sAberrationWidth = document.getElementById('aberration-width');
  const vAberrationWidth = document.getElementById('val-aberration-width');
  const sAberrationSplit = document.getElementById('aberration-split');
  const vAberrationSplit = document.getElementById('val-aberration-split');

  const presetsGrid = document.querySelectorAll('.btn-preset');
  
  // Updates
  sStarCount.addEventListener('input', (e) => {
    settings.starCount = parseInt(e.target.value);
    vStarCount.innerText = settings.starCount;
    updateParticleCount();
  });

  sCrossRatio.addEventListener('input', (e) => {
    const val = parseInt(e.target.value);
    settings.crossRatio = val / 100;
    vCrossRatio.innerText = `${val}%`;
    // Instantly alter ratios of some particles
    particles.forEach(p => {
      p.isCross = Math.random() < settings.crossRatio;
      p.flareLength = p.isCross ? 3 + Math.random() * 5 : 0;
    });
  });

  sBaseSpeed.addEventListener('input', (e) => {
    settings.baseSpeed = parseFloat(e.target.value);
    vBaseSpeed.innerText = `${settings.baseSpeed.toFixed(1)}x`;
    // Reassign base speeds
    particles.forEach(p => {
      const angle = Math.atan2(p.baseVy, p.baseVx);
      p.baseVx = Math.cos(angle) * (0.1 + Math.random() * 0.9) * settings.baseSpeed;
      p.baseVy = Math.sin(angle) * (0.1 + Math.random() * 0.9) * settings.baseSpeed;
    });
  });

  tTwinkle.addEventListener('change', (e) => {
    settings.twinkleActive = e.target.checked;
  });

  fType.addEventListener('change', (e) => {
    settings.forceType = e.target.value;
  });

  sForceStr.addEventListener('input', (e) => {
    settings.forceStrength = parseFloat(e.target.value);
    vForceStr.innerText = settings.forceStrength.toFixed(1);
  });

  sForceRad.addEventListener('input', (e) => {
    settings.forceRadius = parseInt(e.target.value);
    vForceRad.innerText = `${settings.forceRadius}px`;
  });

  tAberration.addEventListener('change', (e) => {
    settings.aberrationActive = e.target.checked;
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

  // Preset selectors
  presetsGrid.forEach(btn => {
    btn.addEventListener('click', () => {
      presetsGrid.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      applyPreset(btn.dataset.preset);
    });
  });
}

// Core preset applicator
function applyPreset(presetKey) {
  const preset = presets[presetKey];
  if (!preset) return;

  // Apply properties to settings
  Object.keys(preset).forEach(key => {
    if (key !== 'nebulaColor') {
      settings[key] = preset[key];
    }
  });

  // Apply Nebula CSS Gradient
  nebula.style.background = preset.nebulaColor;

  // Update UI control positions to match active preset values
  document.getElementById('star-count').value = preset.starCount;
  document.getElementById('val-star-count').innerText = preset.starCount;

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

  document.getElementById('aberration-active').checked = preset.aberrationActive;

  document.getElementById('aberration-radius').value = preset.aberrationRadius;
  document.getElementById('val-aberration-radius').innerText = `${preset.aberrationRadius}px`;

  document.getElementById('aberration-width').value = preset.aberrationWidth;
  document.getElementById('val-aberration-width').innerText = `${preset.aberrationWidth}px`;

  document.getElementById('aberration-split').value = preset.aberrationSplit;
  document.getElementById('val-aberration-split').innerText = `${preset.aberrationSplit}px`;

  // Trigger engine updates
  updateParticleCount();
  updateParticleThemes();
  
  // Re-initialize velocity profiles for warp drive triggers
  particles.forEach(p => p.reset(true));
}

// Setup Mouse and Touch Listeners
function setupInputListeners() {
  window.addEventListener('mousemove', (e) => {
    mouse.targetX = e.clientX;
    mouse.targetY = e.clientY;
    mouse.isActive = true;
    idleTime = 0; // reset idle
  });

  window.addEventListener('mouseleave', () => {
    mouse.isActive = false;
  });

  window.addEventListener('mousedown', (e) => {
    // Prevent down states when clicking inside the floating controls
    if (e.target.closest('#control-panel') || e.target.closest('#panel-trigger')) return;
    
    mouse.isDown = true;
    // Animate zoom multiplier for high attraction/suction click effect
    gsapAnimateMultiplier(2.2);
  });

  window.addEventListener('mouseup', () => {
    mouse.isDown = false;
    gsapAnimateMultiplier(1.0);
  });

  // Touch screens mobile support
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

// Ease the force sizing scale for dynamic click implosions smoothly
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

// Bind panel minimize/open togglers
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

// Primary Simulation Render & Physics Loop
function loop() {
  // Ultra-clean cosmic decay erase path: draws a faint trails overlay
  // or a crisp clear screen depending on warp speed
  if (settings.warpActive) {
    ctx.fillStyle = 'rgba(2, 2, 6, 0.12)'; // Faint trail smears for hyper speed streaks
    ctx.fillRect(0, 0, width, height);
  } else {
    ctx.clearRect(0, 0, width, height);
  }

  // Update mouse orbital telemetry & smoothing
  updateVirtualCursor();

  // Draw force field and aberration overlays under particles
  drawInteractiveOverlays();

  // Render & Physics updates for each particle
  particles.forEach(p => {
    p.update();
    p.draw();
  });

  // Gather performance frame-speeds
  updateTelemetry();

  requestAnimationFrame(loop);
}

// Initialize Everything
function init() {
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);
  
  setupInputListeners();
  bindUIControls();
  bindPanelToggles();
  
  // Set default initial background gradient styling
  nebula.style.background = presets['deep-space'].nebulaColor;
  
  loop();
}

// Start simulation on load
window.addEventListener('DOMContentLoaded', init);
