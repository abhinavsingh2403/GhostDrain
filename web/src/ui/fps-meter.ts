/**
 * Real-time FPS and frame-time monitor.
 *
 * Computes rolling frame delta over the last 60 frames to provide
 * accurate, jitter-free performance telemetry on target hardware.
 * Source: docs/ARCHITECTURE.md section 10, docs/ROADMAP_TASKS.md Spike S1.
 */

export interface FpsTelemetry {
  fps: number;
  frameTimeMs: number;
}

export class FpsMeter {
  private frameTimes: number[] = [];
  private lastTimestamp: number = 0;
  private maxSamples: number = 60;

  /**
   * Record a frame timestamp and return the current telemetry.
   * @param timestamp Current timestamp in milliseconds (from performance.now() or rAF)
   */
  public tick(timestamp: number): FpsTelemetry {
    if (this.lastTimestamp > 0) {
      const delta = timestamp - this.lastTimestamp;
      if (delta > 0 && delta < 1000) {
        this.frameTimes.push(delta);
        if (this.frameTimes.length > this.maxSamples) {
          this.frameTimes.shift();
        }
      }
    }
    this.lastTimestamp = timestamp;

    if (this.frameTimes.length === 0) {
      return { fps: 60, frameTimeMs: 16.6 };
    }

    const sum = this.frameTimes.reduce((a, b) => a + b, 0);
    const avgDelta = sum / this.frameTimes.length;
    const fps = Math.round(1000 / avgDelta);
    const frameTimeMs = Math.round(avgDelta * 10) / 10;

    return { fps, frameTimeMs };
  }

  /**
   * Reset all collected samples.
   */
  public reset(): void {
    this.frameTimes = [];
    this.lastTimestamp = 0;
  }
}
