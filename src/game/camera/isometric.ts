export interface IsoPoint {
  x: number;
  y: number;
}

export interface GridPoint {
  gx: number;
  gy: number;
}

export class IsometricHelper {
  public static readonly TILE_WIDTH = 64;
  public static readonly TILE_HEIGHT = 32;

  /**
   * Converts grid coordinates (gx, gy) to 2D isometric screen space.
   */
  public static gridToScreen(gx: number, gy: number, originX = 800, originY = 120): IsoPoint {
    const halfW = this.TILE_WIDTH / 2;
    const halfH = this.TILE_HEIGHT / 2;
    const x = (gx - gy) * halfW + originX;
    const y = (gx + gy) * halfH + originY;
    return { x, y };
  }

  /**
   * Converts screen space coordinates (x, y) back to isometric grid coordinates.
   */
  public static screenToGrid(x: number, y: number, originX = 800, originY = 120): GridPoint {
    const halfW = this.TILE_WIDTH / 2;
    const halfH = this.TILE_HEIGHT / 2;
    const dx = x - originX;
    const dy = y - originY;
    const gx = Math.round((dx / halfW + dy / halfH) / 2);
    const gy = Math.round((dy / halfH - dx / halfW) / 2);
    return { gx, gy };
  }

  /**
   * Computes proper isometric depth sorting so nearer objects occlude further objects.
   */
  public static getIsoDepth(gx: number, gy: number, layerOffset = 0): number {
    return Math.floor((gx + gy) * 10) + layerOffset;
  }
}
