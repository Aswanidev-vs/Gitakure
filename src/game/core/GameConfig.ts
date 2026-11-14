import type { GraphicsQuality, GraphicsSettings } from '@/types';

// Performance defaults per spec §18: WebGL, pixel ratio capped, shadows off,
// one directional light, hemisphere light, no mandatory post-processing.
export const QUALITY_PRESETS: Record<GraphicsQuality, GraphicsSettings> = {
  low: {
    quality: 'low',
    pixelRatioCap: 1.5,
    shadows: false,
    antialias: true,
    maxPixelCount: 1920 * 1080,
  },
  medium: {
    quality: 'medium',
    pixelRatioCap: 1.5,
    shadows: true,
    antialias: true,
    maxPixelCount: 2560 * 1440,
  },
  high: {
    quality: 'high',
    pixelRatioCap: 2,
    shadows: true,
    antialias: true,
    maxPixelCount: 3840 * 2160,
  },
};

export function resolveGraphics(quality: GraphicsQuality): GraphicsSettings {
  return { ...QUALITY_PRESETS[quality] };
}