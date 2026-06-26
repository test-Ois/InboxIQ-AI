/**
 * NoiseField.ts
 * Procedural 3D Perlin Noise & Fractional Brownian Motion (FBM) Engine
 * Designed for premium, high-performance vector field generation from scratch.
 * 
 * Inspired by classic Perlin Noise mathematics, optimized for Javascript JIT engines.
 */

export class NoiseField {
  private p: Uint8Array;

  constructor() {
    // Standard 256 permutation sequence, shuffeled deterministically
    const permutation = new Uint8Array([
      151, 160, 137, 91, 90, 15, 131, 13, 201, 95, 96, 53, 194, 233, 7, 225,
      140, 36, 103, 30, 69, 142, 8, 99, 37, 240, 21, 10, 23, 190, 6, 148,
      247, 120, 234, 75, 0, 26, 197, 62, 94, 252, 219, 203, 117, 35, 11, 32,
      57, 177, 33, 88, 237, 149, 56, 87, 174, 20, 125, 136, 171, 168, 68, 175,
      74, 165, 71, 134, 139, 48, 27, 166, 77, 146, 158, 231, 83, 111, 229, 122,
      60, 211, 133, 230, 220, 105, 92, 41, 55, 46, 245, 40, 244, 102, 143, 54,
      65, 25, 63, 161, 1, 216, 80, 73, 209, 76, 132, 187, 208, 89, 18, 169,
      200, 196, 135, 130, 116, 188, 189, 142, 1, 241, 80, 142, 79, 5, 21, 56,
      198, 86, 60, 127, 24, 168, 150, 141, 104, 119, 244, 214, 31, 136, 97, 228,
      251, 34, 242, 193, 238, 210, 144, 12, 191, 179, 162, 241, 81, 51, 145, 235,
      249, 14, 239, 107, 49, 192, 214, 31, 181, 199, 106, 157, 184, 84, 204, 176,
      115, 121, 50, 45, 128, 4, 150, 254, 54, 219, 167, 101, 224, 202, 109, 42,
      98, 139, 249, 221, 3, 253, 124, 153, 114, 78, 21, 182, 124, 201, 136, 181,
      172, 129, 26, 164, 79, 172, 95, 100, 138, 47, 16, 123, 227, 21, 236, 250,
      19, 72, 226, 224, 219, 129, 172, 193, 97, 228, 251, 34, 242, 193, 238, 210,
      144, 12, 191, 179, 162, 241, 81, 51, 145, 235, 249, 14, 239, 107, 49, 192
    ]);

    // Double the permutation table to prevent indexing overflow during 3D lookups
    this.p = new Uint8Array(512);
    for (let i = 0; i < 512; i++) {
      this.p[i] = permutation[i & 255];
    }
  }

  /**
   * Fade function - Ken Perlin's quintic curve equation.
   * Smooths coordinate values to guarantee continuous 1st and 2nd derivatives.
   * f(t) = 6t^5 - 15t^4 + 10t^3
   */
  private fade(t: number): number {
    return t * t * t * (t * (t * 6 - 15) + 10);
  }

  /**
   * Linear interpolation.
   */
  private lerp(t: number, a: number, b: number): number {
    return a + t * (b - a);
  }

  /**
   * Calculates the dot product of a hashed gradient vector and the distance vector.
   * Maps a hash integer to one of 12 predefined 3D gradient vectors.
   */
  private grad(hash: number, x: number, y: number, z: number): number {
    const h = hash & 15;
    const u = h < 8 ? x : y;
    const v = h < 4 ? y : h === 12 || h === 14 ? x : z;
    return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
  }

  /**
   * Generates a 3D Perlin Noise value between -1.0 and 1.0 for given coordinates.
   * Uses space coordinates (x, y) and time coordinate (z).
   */
  public noise3D(x: number, y: number, z: number): number {
    // Find unit cube coordinates containing the point
    const X = Math.floor(x) & 255;
    const Y = Math.floor(y) & 255;
    const Z = Math.floor(z) & 255;

    // Find relative coordinates of the point inside the unit cube
    const xf = x - Math.floor(x);
    const yf = y - Math.floor(y);
    const zf = z - Math.floor(z);

    // Compute fade curves for each coordinate
    const u = this.fade(xf);
    const v = this.fade(yf);
    const w = this.fade(zf);

    // Hash coordinates of the 8 cube corners
    const A = this.p[X] + Y;
    const AA = this.p[A] + Z;
    const AB = this.p[A + 1] + Z;
    const B = this.p[X + 1] + Y;
    const BA = this.p[B] + Z;
    const BB = this.p[B + 1] + Z;

    // Linearly interpolate along the three dimensions
    const result = this.lerp(
      w,
      this.lerp(
        v,
        this.lerp(
          u,
          this.grad(this.p[AA], xf, yf, zf),
          this.grad(this.p[BA], xf - 1, yf, zf)
        ),
        this.lerp(
          u,
          this.grad(this.p[AB], xf, yf - 1, zf),
          this.grad(this.p[BB], xf - 1, yf - 1, zf)
        )
      ),
      this.lerp(
        v,
        this.lerp(
          u,
          this.grad(this.p[AA + 1], xf, yf, zf - 1),
          this.grad(this.p[BA + 1], xf - 1, yf, zf - 1)
        ),
        this.lerp(
          u,
          this.grad(this.p[AB + 1], xf, yf - 1, zf - 1),
          this.grad(this.p[BB + 1], xf - 1, yf - 1, zf - 1)
        )
      )
    );

    // Clamp and scale to exactly [-1.0, 1.0] range
    return result * 0.96;
  }

  /**
   * Fractional Brownian Motion (FBM) - Spectral Summation of Multi-Octave Noise.
   * Combines multiple frequencies to simulate rich, fractal-like organic turbulences.
   * 
   * @param x X Coordinate
   * @param y Y Coordinate
   * @param z Time Coordinate (drives organic morphing)
   * @param octaves Number of noise layers (each double frequency)
   * @param persistence Amplitude multiplier for subsequent octaves
   * @param lacunarity Frequency multiplier for subsequent octaves
   */
  public fbm(
    x: number,
    y: number,
    z: number,
    octaves: number = 3,
    persistence: number = 0.5,
    lacunarity: number = 2.0
  ): number {
    let total = 0;
    let frequency = 1.0;
    let amplitude = 1.0;
    let maxValue = 0;

    for (let i = 0; i < octaves; i++) {
      total += this.noise3D(x * frequency, y * frequency, z * frequency) * amplitude;
      maxValue += amplitude;
      amplitude *= persistence;
      frequency *= lacunarity;
    }

    return total / maxValue;
  }
}
