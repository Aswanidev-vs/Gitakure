/**
 * The developer's hideaway: one room, a desk, a window on the fields, and the
 * work that paid for the valley. The only interior in the game so far.
 */

import type { TerrainId } from '@/art/tiles/terrain';
import { WorldScene, type WorldOptions } from './WorldScene';
import type { FloraPlacement, PropPlacement, WorldSpec } from '@/world/Scenery';

const W = 20;
const H = 16;

function buildHideawayMap(): WorldSpec {
  const g: TerrainId[][] = [];
  for (let y = 0; y < H; y++) {
    const row: TerrainId[] = [];
    for (let x = 0; x < W; x++) row.push('grass_tall');
    g.push(row);
  }
  const set = (x: number, y: number, id: TerrainId): void => {
    if (x >= 0 && y >= 0 && x < W && y < H) g[y]![x] = id;
  };
  const rect = (x0: number, y0: number, x1: number, y1: number, id: TerrainId): void => {
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) set(x, y, id);
  };

  rect(3, 3, 16, 12, 'wood_floor');
  rect(3, 3, 16, 3, 'tatami');
  rect(3, 12, 16, 12, 'tatami');
  rect(9, 13, 10, 15, 'path');
  rect(9, 12, 10, 12, 'wood_floor');
  rect(3, 3, 3, 12, 'stone_floor');
  rect(16, 3, 16, 12, 'stone_floor');

  const props: PropPlacement[] = [
    { tx: 5, ty: 4, id: 'desk', verb: 'Work', label: 'Writing desk', lines: ['A notebook open to a page of small drawings: a bridge, a roof, a river that goes on too long.'] },
    { tx: 7, ty: 4, id: 'computer', verb: 'Use', label: 'Computer', lines: ['The screen is dark. A postcard from a repository is pinned to the wall beside it.'] },
    { tx: 10, ty: 3, id: 'bookshelf', verb: 'Read', label: 'Bookshelf', lines: ['Field guides, a book on paddy, and three spines that have been read so often they open by themselves.'] },
    { tx: 11, ty: 3, id: 'bookshelf', verb: 'Read', label: 'Bookshelf', lines: ['Notebooks, one for each year. The earliest is mostly weather.'] },
    { tx: 13, ty: 4, id: 'computer', verb: 'Use', label: 'Workstation', lines: ['A second machine, older, still warm. It has been running something for a long time.'] },
    { tx: 5, ty: 8, id: 'workbench', verb: 'Craft', label: 'Workbench', lines: ['A half-built lantern, a soldering iron, and a jar of screws sorted by size.'] },
    { tx: 14, ty: 8, id: 'crate', verb: 'Search', label: 'Post crate', lines: ['Letters from the village, a seed catalogue, and a parcel that has not been opened.'] },
    { tx: 14, ty: 9, id: 'barrel', verb: 'Search', label: 'Umbrella stand', lines: ['Two umbrellas, one walking stick, and a rolled map of the valley.'] },
    { tx: 9, ty: 2, id: 'window', verb: 'Look out', label: 'Window', lines: ['The fields go on until the hills take over. Someone is walking the paddy bund, very slowly.'] },
    { tx: 4, ty: 11, id: 'lantern', solid: false },
    { tx: 15, ty: 11, id: 'lantern', solid: false },
    { tx: 4, ty: 4, id: 'flower_pot', solid: false, noShadow: true },
    { tx: 15, ty: 4, id: 'flower_pot', solid: false, noShadow: true },
  ];

  const flora: FloraPlacement[] = [
    { tx: 2, ty: 6, id: 'bamboo' },
    { tx: 17, ty: 6, id: 'banana' },
    { tx: 2, ty: 14, id: 'fern' },
    { tx: 17, ty: 14, id: 'fern' },
  ];

  return {
    key: 'HideawayScene',
    width: W,
    height: H,
    tiles: g,
    spawn: { tx: 10, ty: 13 },
    props,
    flora,
    ambience: 'indoor',
    dayNight: true,
    weather: false,
    startMinutes: 9 * 60,
  };
}

export class HideawayScene extends WorldScene {
  constructor() {
    const options: WorldOptions = {
      ...buildHideawayMap(),
      location: 'hideaway',
      npcs: false,
      sync: true,
      save: true,
      music: 'village',
    };
    super(options);
  }

  protected build(): void {
    if (!this.journal.has("Developer's Hideaway")) {
      this.journal.add({
        day: this.clock_.getClock().day,
        kind: 'discovery',
        title: "Developer's Hideaway",
        body: 'One room at the edge of the fields. The desk faces the window; the window faces everything you made.',
      });
    }
  }
}