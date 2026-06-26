/**
 * CanvasRenderer.ts
 * High-performance 2D Canvas Drawing Engine
 * Optimized for Retina displays and low CPU draw cycles.
 */

import { Particle, EngineConfig } from './ParticleEngine';

export class CanvasRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private width: number = 0;
  private height: number = 0;
  private dpr: number = 1;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const context = canvas.getContext('2d', { alpha: false });
    if (!context) {
      throw new Error('Could not acquire 2D canvas context');
    }
    this.ctx = context;
    this.detectDPR();
  }

  /**
   * Detects the window Device Pixel Ratio to support high-DPI Retina screens.
   */
  private detectDPR(): void {
    if (typeof window !== 'undefined') {
      this.dpr = window.devicePixelRatio || 1;
    } else {
      this.dpr = 1;
    }
  }

  /**
   * Resizes the canvas backing store dimensions to match client layout bounding rects.
   * Multiplies by DPR for crisp, high-fidelity rendering.
   */
  public resize(width: number, height: number): void {
    this.detectDPR();
    this.width = width;
    this.height = height;

    // Adjust canvas element dimensions
    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${height}px`;

    // Adjust backing store dimensions for high-DPI scaling
    this.canvas.width = width * this.dpr;
    this.canvas.height = height * this.dpr;

    // Scale the drawing context to handle drawing calls in standard CSS pixels
    this.ctx.scale(this.dpr, this.dpr);
  }

  /**
   * Runs the full rendering pipeline for a single frame.
   */
  public render(
    particles: Particle[],
    time: number,
    mouseX: number,
    mouseY: number,
    isMouseOver: boolean,
    config: EngineConfig
  ): void {
    // 1. Clear with base background color #050816
    this.ctx.fillStyle = '#050816';
    this.ctx.fillRect(0, 0, this.width, this.height);

    // 2. Draw the ultra-subtle animated dot grid (Background Layer 0)
    this.drawDotGrid(time, mouseX, mouseY, isMouseOver);

    // 3. Draw Particles, layered for cinematic depth sorting
    // We run three linear passes (Layer 1, then Layer 2, then Layer 3)
    // This is significantly faster than sorting the 6,000 particle array at 60fps.
    
    // Pass 1: Background Layer (Subtle, slow, tiny)
    this.ctx.beginPath();
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      if (p.layer === 1) {
        this.ctx.fillStyle = p.color;
        this.ctx.globalAlpha = p.opacity;
        this.ctx.fillRect(p.x - p.size * 0.5, p.y - p.size * 0.5, p.size, p.size);
      }
    }

    // Pass 2: Midground Layer (Main movement waves)
    this.ctx.beginPath();
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      if (p.layer === 2) {
        this.ctx.fillStyle = p.color;
        this.ctx.globalAlpha = p.opacity;
        this.ctx.fillRect(p.x - p.size * 0.5, p.y - p.size * 0.5, p.size, p.size);
      }
    }

    // Pass 3: Foreground Layer (Fast, highlights, glows)
    // Glowing particles require sub-pixel circle paths, drawn individually
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      if (p.layer === 3) {
        this.ctx.globalAlpha = p.opacity;

        if (p.isGlowing && p.glowColor) {
          // Dual-pass glow rendering:
          // A. Draw soft outer halo envelope (radius scaled up 3x)
          const glowSize = p.size * 3.5;
          this.ctx.fillStyle = p.glowColor;
          this.ctx.globalAlpha = p.opacity * 0.35 * config.glowIntensity;
          
          this.ctx.beginPath();
          this.ctx.arc(p.x, p.y, glowSize, 0, Math.PI * 2);
          this.ctx.fill();

          // B. Draw high-brightness inner core (soft white or white-capped violet)
          this.ctx.fillStyle = '#ffffff';
          this.ctx.globalAlpha = p.opacity * 1.0;
          this.ctx.beginPath();
          this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          this.ctx.fill();
        } else {
          // Standard foreground particle: draw square/rect for high speed
          this.ctx.fillStyle = p.color;
          this.ctx.fillRect(p.x - p.size * 0.5, p.y - p.size * 0.5, p.size, p.size);
        }
      }
    }

    // Reset global alpha
    this.ctx.globalAlpha = 1.0;

    // 4. Overlay soft cinematic vignette around screen edges
    this.drawVignette();
  }

  /**
   * Renders an ultra-subtle dot grid that gently breathes based on a sine wave.
   * Reactive to mouse: dots near cursor light up slightly, creating an organic hover response.
   */
  private drawDotGrid(
    time: number,
    mouseX: number,
    mouseY: number,
    isMouseOver: boolean
  ): void {
    const spacing = 45; // grid cell size
    const dotRadius = 0.65;
    
    // Set breathing rate
    const breatheCycle = time * 0.38;

    this.ctx.fillStyle = 'rgba(255, 255, 255, 1)';

    for (let x = spacing; x < this.width; x += spacing) {
      for (let y = spacing; y < this.height; y += spacing) {
        // Core breathing animation: oscillates opacity between 1.2% and 2.5%
        // Subtle offset based on coordinates creates an elegant diagonal wave
        const waveOffset = (x * 0.0006) + (y * 0.0006);
        let baseOpacity = 0.012 + Math.sin(breatheCycle + waveOffset) * 0.007;

        // Reactive mouse lighting:
        // Dots close to cursor smoothly illuminate up to 4% opacity
        if (isMouseOver) {
          const dx = mouseX - x;
          const dy = mouseY - y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const activeRadius = 180;

          if (dist < activeRadius) {
            const ease = 1.0 - dist / activeRadius;
            const glowFactor = ease * ease; // quadratic falloff
            baseOpacity += glowFactor * 0.024;
          }
        }

        // Draw dot
        this.ctx.globalAlpha = baseOpacity;
        this.ctx.beginPath();
        this.ctx.arc(x, y, dotRadius, 0, Math.PI * 2);
        this.ctx.fill();
      }
    }
  }

  /**
   * Creates a deep cinematic vignette.
   * Blends the screen borders into solid dark #050608.
   */
  private drawVignette(): void {
    const cx = this.width / 2;
    const cy = this.height / 2;
    
    // Scale vignette radii to screen bounds
    const innerRadius = Math.min(this.width, this.height) * 0.35;
    const outerRadius = Math.max(this.width, this.height) * 0.85;

    const vignette = this.ctx.createRadialGradient(
      cx,
      cy,
      innerRadius,
      cx,
      cy,
      outerRadius
    );

    // Fade to solid background color at the edges
    vignette.addColorStop(0, 'rgba(5, 8, 22, 0)');
    vignette.addColorStop(0.5, 'rgba(5, 8, 22, 0.2)');
    vignette.addColorStop(1, 'rgba(5, 8, 22, 0.90)');

    this.ctx.fillStyle = vignette;
    this.ctx.fillRect(0, 0, this.width, this.height);
  }
}
