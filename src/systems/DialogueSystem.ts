/**
 * Dialogue system: queues lines and drives the on-screen dialogue box.
 * Lines are shown one at a time; Space/Enter advances, Esc closes.
 */

export interface DialogueLine {
  speaker: string;
  text: string;
  portraitKey?: string;
}

export class DialogueSystem {
  private queue: DialogueLine[] = [];
  private active = false;
  private listeners = new Set<(line: DialogueLine | null) => void>();

  open(speaker: string, lines: string[], portraitKey?: string): void {
    this.queue = lines.map((text) => ({ speaker, text, portraitKey }));
    this.active = true;
    this.emit();
  }

  advance(): boolean {
    if (!this.active) return false;
    this.queue.shift();
    if (this.queue.length === 0) {
      this.active = false;
      this.emit(null);
      return false;
    }
    this.emit();
    return true;
  }

  close(): void {
    this.queue = [];
    this.active = false;
    this.emit(null);
  }

  isOpen(): boolean {
    return this.active;
  }

  current(): DialogueLine | null {
    return this.queue[0] ?? null;
  }

  onLine(cb: (line: DialogueLine | null) => void): () => void {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  private emit(line?: DialogueLine | null): void {
    const l = line === undefined ? this.current() : line;
    for (const cb of this.listeners) cb(l);
  }
}