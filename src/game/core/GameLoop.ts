// Fixed-timestep game loop with delta clamping and an accumulator.

export type UpdateFn = (dt: number, elapsed: number) => void;

export class GameLoop {
  private readonly fixedStep = 1 / 60;
  private readonly maxFrameTime = 0.25; // clamp to avoid spiral of death
  private accumulator = 0;
  private lastTime = 0;
  private running = false;
  private rafId = 0;
  private readonly tickHandlers = new Set<UpdateFn>();
  private readonly renderHandlers = new Set<() => void>();
  private elapsed = 0;

  onTick(fn: UpdateFn): () => void {
    this.tickHandlers.add(fn);
    return () => this.tickHandlers.delete(fn);
  }

  onRender(fn: () => void): () => void {
    this.renderHandlers.add(fn);
    return () => this.renderHandlers.delete(fn);
  }

  start(): void {
    if (this.running) return;
    this.running = true;
    this.lastTime = performance.now();
    this.rafId = requestAnimationFrame(this.frame);
  }

  stop(): void {
    this.running = false;
    cancelAnimationFrame(this.rafId);
  }

  get isRunning(): boolean {
    return this.running;
  }

  private frame = (now: number): void => {
    if (!this.running) return;
    this.rafId = requestAnimationFrame(this.frame);
    let dt = (now - this.lastTime) / 1000;
    this.lastTime = now;
    if (dt > this.maxFrameTime) dt = this.maxFrameTime;
    this.accumulator += dt;

    while (this.accumulator >= this.fixedStep) {
      this.elapsed += this.fixedStep;
      for (const fn of this.tickHandlers) fn(this.fixedStep, this.elapsed);
      this.accumulator -= this.fixedStep;
    }

    for (const fn of this.renderHandlers) fn();
  };
}