/**
 * The six places in Gitakure, as data.
 *
 * The world map, the travel menu and the save file all read from this list, so
 * a location's name, subtitle and spawn point are defined once.
 */

import type { LocationId, TilePos } from '@/shared/types';

export interface LocationDef {
  id: LocationId;
  name: string;
  subtitle: string;
  blurb: string;
  scene: string;
  spawn: TilePos;
  /** Map size in tiles, used by the world map drawing. */
  width: number;
  height: number;
}

export const LOCATIONS: LocationDef[] = [
  {
    id: 'village',
    name: 'Secluded Village',
    subtitle: 'Where the path begins',
    blurb: 'A square, a well, and enough roofs to call home.',
    scene: 'VillageScene',
    spawn: { tx: 20, ty: 17 },
    width: 40,
    height: 30,
  },
  {
    id: 'riverside',
    name: 'Riverside',
    subtitle: 'The river remembers rain',
    blurb: 'A wooden bridge, fishing rocks, and water that never hurries.',
    scene: 'RiversideScene',
    spawn: { tx: 4, ty: 16 },
    width: 32,
    height: 22,
  },
  {
    id: 'forest',
    name: 'Bamboo Forest',
    subtitle: 'Old paths, older trees',
    blurb: 'Mushrooms, deer, and a trail the village stopped using.',
    scene: 'ForestScene',
    spawn: { tx: 3, ty: 12 },
    width: 32,
    height: 24,
  },
  {
    id: 'farmland',
    name: 'Farmland',
    subtitle: 'Paddy, well and weather',
    blurb: 'Rice, vegetables, and a farmhouse that smells of rain.',
    scene: 'FarmlandScene',
    spawn: { tx: 4, ty: 19 },
    width: 30,
    height: 22,
  },
  {
    id: 'shrine',
    name: 'Shrine and Ruins',
    subtitle: 'A gate older than the village',
    blurb: 'Stone lanterns, a forgotten shrine, and milestones in the moss.',
    scene: 'ShrineScene',
    spawn: { tx: 11, ty: 17 },
    width: 24,
    height: 20,
  },
  {
    id: 'hideaway',
    name: "Developer's Hideaway",
    subtitle: 'A desk facing the fields',
    blurb: 'One window, two shelves, and the work that made all this.',
    scene: 'HideawayScene',
    spawn: { tx: 10, ty: 13 },
    width: 20,
    height: 16,
  },
];

export const LOCATION_BY_ID: Record<LocationId, LocationDef> = Object.fromEntries(
  LOCATIONS.map((l) => [l.id, l]),
) as Record<LocationId, LocationDef>;