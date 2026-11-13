/**
 * Data URLs for the pixel icons and portraits, for use in DOM UI.
 *
 * The world is painted into canvases at boot; the HTML layer cannot reference
 * those canvases directly, so the few images the HUD needs are exported once
 * and cached. Painting is deterministic, so this is cheap and never fetches.
 */

import { paintPortrait, type CharacterSkin } from '@/art/characters';
import { paintIcon, type IconId } from '@/art/ui';
import { NPC_SKINS } from '@/data/npcs';

const cache = new Map<string, string>();

function fromCanvas(key: string, paint: () => HTMLCanvasElement): string {
  const hit = cache.get(key);
  if (hit) return hit;
  if (typeof document === 'undefined') return '';
  const url = paint().toDataURL('image/png');
  cache.set(key, url);
  return url;
}

export function iconUrl(id: IconId): string {
  return fromCanvas(`icon:${id}`, () => paintIcon(id).toCanvas());
}

export function portraitUrl(npcId: string): string {
  return fromCanvas(`portrait:${npcId}`, () => {
    const skin = NPC_SKINS[npcId] ?? NPC_SKINS['ilaya']!;
    return paintPortrait(skin, npcId.length * 37 + 11).toCanvas();
  });
}

export function portraitForSkin(key: string, skin: CharacterSkin): string {
  return fromCanvas(`portrait:${key}`, () => paintPortrait(skin, key.length * 37 + 11).toCanvas());
}