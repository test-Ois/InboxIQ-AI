/**
 * ParticleEngine.ts
 * Core Physics Simulation Engine for procedural flows
 * Designed from scratch to compute coordinates, layers, and forces.
 */

import { NoiseField } from './NoiseField';

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  baseSize: number;
  opacity: number;
  baseOpacity: number;
  layer: number; // 1: Background, 2: Midground, 3: Foreground
  speedScale: number;
  isGlowing: boolean;
  color: string;       // HSL color string
  glowColor?: string;  // Glow shadow color
  life: number;        // Normalized age [0..1]
  ageSpeed: number;    // Easing speed of life cycle
}

export interface EngineConfig {
  particleCount: number;
  particleSpeed: number;
  noiseScale: number;
  noiseStrength: number;
  flowStrength: number;
  particleSize: number;
  opacity: number;
  glowIntensity: number;
  waveFrequency: number;
  mouseInfluence: number;
  animationSpeed: number;
}

export class ParticleEngine {
  public particles: Particle[] = [];
  private noiseField: NoiseField;
  private width: number = 0;
  private height: number = 0;
  private config: EngineConfig;

  // Curated premium HSL palettes: Deep Violet, Steel Blue, Muted Slate, Soft White
  private readonly colors = {
    blue: 'hsl(261, 84%, 58%)',      // #7c3aed (oklch(0.50 0.22 285))
    steel: 'hsl(210, 25%, 62%)',     // Steel Blue
    slate: 'hsl(215, 16%, 45%)',     // Muted Slate
    white: 'hsl(210, 20%, 98%)',     // Soft White
  };

  private readonly glowColors = {
    blue: 'rgba(124, 58, 237, 0.4)',  // Deep Violet glow
    steel: 'rgba(148, 163, 184, 0.3)',
    slate: 'rgba(100, 116, 139, 0.2)',
    white: 'rgba(245, 247, 250, 0.3)',
  };

  constructor(width: number, height: number, config: EngineConfig) {
    this.width = width;
    this.height = height;
    this.config = config;
    this.noiseField = new NoiseField();
    this.initParticles();
  }

  /**
   * Initializes the particle array based on count and depth distributions.
   * - Layer 1 (Background): ~65% of particles (slow, faint, 1px)
   * - Layer 2 (Midground): ~25% of particles (medium, 1.2px)
   * - Layer 3 (Foreground): ~10% of particles (faster, 1.5px-2px, includes glows)
   */
  public initParticles(): void {
    this.particles = [];
    const count = this.config.particleCount;

    for (let i = 0; i < count; i++) {
      this.particles.push(this.createParticle(true));
    }
  }

  /**
   * Creates a single particle.
   * @param randomizeLife If true, initializes with a random life progress [0..1] to stagger lifecycles.
   */
  private createParticle(randomizeLife: boolean = false): Particle {
    const rand = Math.random();
    let layer = 1;
    let speedScale = 0.35;
    let baseOpacity = 0.12 + Math.random() * 0.12;
    let sizeMultiplier = 0.8;
    let isGlowing = false;

    // Layer distributions
    if (rand > 0.65 && rand <= 0.90) {
      layer = 2;
      speedScale = 0.75;
      baseOpacity = 0.25 + Math.random() * 0.18;
      sizeMultiplier = 1.1;
    } else if (rand > 0.90) {
      layer = 3;
      speedScale = 1.35;
      baseOpacity = 0.45 + Math.random() * 0.25;
      sizeMultiplier = 1.5;
      // 8% of foreground particles are glowing
      isGlowing = Math.random() < 0.08;
    }

    // Color distribution: 50% Steel, 35% Slate, 10% Deep Violet, 5% Soft White
    const colorRand = Math.random();
    let color = this.colors.steel;
    let glowColor = this.glowColors.steel;

    if (colorRand < 0.35) {
      color = this.colors.slate;
      glowColor = this.glowColors.slate;
    } else if (colorRand >= 0.35 && colorRand < 0.45) {
      color = this.colors.blue;
      glowColor = this.glowColors.blue;
    } else if (colorRand >= 0.45 && colorRand < 0.50) {
      color = this.colors.white;
      glowColor = this.glowColors.white;
    }

    // If it's a glowing foreground particle, make it Electric Purple!
    if (isGlowing) {
      color = 'hsl(270, 91%, 65%)'; // Electric Purple
      glowColor = 'rgba(168, 85, 247, 0.5)'; // Electric Purple glow
    }

    const life = randomizeLife ? Math.random() : 0.0;
    // Normalized aging speed: will live between 150 to 450 frames
    const ageSpeed = 0.0018 + Math.random() * 0.0015;

    // Position spread across screen
    const x = Math.random() * this.width;
    const y = Math.random() * this.height;

    // Base size config
    const baseSize = this.config.particleSize * sizeMultiplier;

    return {
      x,
      y,
      vx: (Math.random() - 0.5) * 0.2,
      vy: (Math.random() - 0.5) * 0.2,
      size: baseSize,
      baseSize,
      opacity: baseOpacity,
      baseOpacity,
      layer,
      speedScale,
      isGlowing,
      color,
      glowColor,
      life,
      ageSpeed,
    };
  }

  /**
   * Rescales the screen boundary dimensions.
   */
  public resize(width: number, height: number): void {
    this.width = width;
    this.height = height;
    
    // Stagger particles that fall outside new boundaries
    for (const p of this.particles) {
      if (p.x > width || p.y > height) {
        p.x = Math.random() * width;
        p.y = Math.random() * height;
        p.life = Math.random(); // prevent flashing
      }
    }
  }

  /**
   * Update all particle positions, velocities, and boundaries.
   * 
   * @param time The elapsed frame timestamp in seconds
   * @param mouseX Cursor X coordinate
   * @param mouseY Cursor Y coordinate
   * @param isMouseOver True if mouse is active inside the screen boundaries
   */
  public update(time: number, mouseX: number, mouseY: number, isMouseOver: boolean): void {
    const {
      particleSpeed,
      noiseScale,
      noiseStrength,
      flowStrength,
      glowIntensity,
      waveFrequency,
      mouseInfluence,
      animationSpeed,
    } = this.config;

    // Pre-calculate scaling metrics for performance inside loop
    const nScale = noiseScale * waveFrequency * 0.0006;
    const timeOffset = time * animationSpeed * 0.08;

    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];

      // 1. Advance lifecycle (fade-in and fade-out smoothly)
      p.life += p.ageSpeed;
      if (p.life >= 1.0) {
        // Respawn decayed particle at a random screen location
        this.particles[i] = this.createParticle(false);
        continue;
      }

      // Calculate lifecycle opacity multiplier
      // Curves up to 1.0 quickly, then decays to 0.0 at the end
      let lifeWeight = 1.0;
      if (p.life < 0.15) {
        lifeWeight = p.life / 0.15; // smooth fade in
      } else if (p.life > 0.8) {
        lifeWeight = (1.0 - p.life) / 0.2; // smooth fade out
      }

      p.opacity = p.baseOpacity * lifeWeight * this.config.opacity;

      // 2. Procedural Vector Field Force
      // Compute 3D Perlin noise coordinates
      const nx = p.x * nScale;
      const ny = p.y * nScale;
      const nz = timeOffset;

      // Draw multi-octave morphing flow using FBM
      const noiseVal = this.noiseField.fbm(nx, ny, nz, 3, 0.45, 1.8);
      
      // Map noise value (-1.0 to 1.0) to direction angle
      const angle = noiseVal * Math.PI * 2 * noiseStrength;

      // Force vectors derived from flow angle
      const fx = Math.cos(angle) * flowStrength * 0.02;
      const fy = Math.sin(angle) * flowStrength * 0.02;

      // Integrate vector field forces into velocity
      p.vx += fx * p.speedScale;
      p.vy += fy * p.speedScale;

      // Apply light friction/drag to maintain calm, elegant velocities
      p.vx *= 0.94;
      p.vy *= 0.94;

      // 3. Elegant Mouse-bending Interaction
      if (isMouseOver) {
        const dx = mouseX - p.x;
        const dy = mouseY - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        // Define cursor influence radius (220px baseline)
        const radius = 220;

        if (dist < radius && dist > 2) {
          // Cubic ease-out weight based on distance
          const pct = 1.0 - dist / radius;
          const attractionWeight = pct * pct * pct;

          // Gracefully pull particle toward cursor (creates smooth bending)
          // The force is proportional to mouseInfluence and particle speed scale
          const forceFactor = attractionWeight * mouseInfluence * p.speedScale * 0.04;
          
          p.vx += (dx / dist) * forceFactor;
          p.vy += (dy / dist) * forceFactor;

          // Slightly slow down particles as they get very close to cursor
          // This creates a premium, slow-motion fluid clustering instead of chaotic scattering
          if (dist < 80) {
            const clampFactor = 0.9 + (dist / 80) * 0.08;
            p.vx *= clampFactor;
            p.vy *= clampFactor;
          }
        }
      }

      // 4. Position Integration
      // Apply speed scale multipliers based on depth layers
      const speedMultiplier = particleSpeed * p.speedScale * 0.6;
      p.x += p.vx * speedMultiplier;
      p.y += p.vy * speedMultiplier;

      // 5. Boundary Easing
      // If a particle drifts past borders, let it age out quickly or wrap organically
      const padding = 50;
      if (
        p.x < -padding ||
        p.x > this.width + padding ||
        p.y < -padding ||
        p.y > this.height + padding
      ) {
        // Accelerate aging to fade out rather than snapping abruptly
        p.life += p.ageSpeed * 5;
      }
    }
  }

  /**
   * Dynamically modifies the active particle count.
   * If new count is larger, we initialize new particles.
   * If smaller, we slice the array to preserve performance.
   */
  public updateParticleCount(newCount: number): void {
    this.config.particleCount = newCount;
    if (this.particles.length === newCount) return;

    if (this.particles.length < newCount) {
      const diff = newCount - this.particles.length;
      for (let i = 0; i < diff; i++) {
        this.particles.push(this.createParticle(true));
      }
    } else {
      this.particles = this.particles.slice(0, newCount);
    }
  }

  /**
   * Bulk updates the configuration object when modified from UI.
   */
  public updateConfig(newConfig: Partial<EngineConfig>): void {
    this.config = { ...this.config, ...newConfig };
    if (newConfig.particleCount !== undefined) {
      this.updateParticleCount(newConfig.particleCount);
    }
  }
}
