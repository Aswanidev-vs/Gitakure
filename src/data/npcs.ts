/**
 * The people of Gitakure.
 *
 * Schedules are expressed as blocks of in-game minutes and a home location.
 * A villager is placed by resolving the block containing the current clock, so
 * nobody stands frozen in one spot — the village looks different at dusk than at
 * noon, and the player can find someone by thinking about where they'd be.
 */

import type { CharacterSkin } from '@/art/characters';
import { PAL } from '@/art/palette';
import type { DayPhase, LocationId } from '@/shared/types';

export interface ScheduleBlock {
  /** Minutes since midnight. */
  from: number;
  to: number;
  location: LocationId;
  /** Anchor tile the NPC idles around during this block. */
  tx: number;
  ty: number;
  /** Optional activity label shown in dialogue. */
  doing?: string;
}

export interface NpcDef {
  id: string;
  name: string;
  role: string;
  skin: CharacterSkin;
  /** Home location when no schedule resolves. */
  home: LocationId;
  schedule: ScheduleBlock[];
  /** Lines for the first meeting, keyed by phase. */
  greeting: string;
  /** Repeated small talk, picked deterministically by day. */
  smallTalk: string[];
  /** Optional line shown when the world has grown past a threshold. */
  lateLine?: { minLandmarks: number; text: string };
}

const M = (h: number, m = 0): number => h * 60 + m;

export const NPCS: NpcDef[] = [
  {
    id: 'ilaya',
    name: 'Ilaya',
    role: 'Village elder',
    home: 'village',
    greeting:
      'You came back. The village kept your place — it always does. Sit with me a while and I will tell you what the seasons have been doing.',
    smallTalk: [
      'The river was higher this year. It remembers rain we have forgotten.',
      'Every stone here was carried by someone who thought it mattered.',
      'Do not hurry. Nothing in this valley is late.',
    ],
    lateLine: { minLandmarks: 4, text: 'The square has grown strange and bright with new work. I like it.' },
    skin: {
      skin: '#c49a76',
      skinShade: '#9c7454',
      hair: '#cfc8c0',
      hairLit: '#eae4dc',
      hairStyle: 'bun',
      outfit: '#8a7a5c',
      outfitDark: '#635640',
      trim: PAL.parchment,
      trousers: '#5b5347',
      beard: true,
    },
    schedule: [
      { from: M(0), to: M(6), location: 'village', tx: 30, ty: 30, doing: 'asleep' },
      { from: M(6), to: M(8), location: 'village', tx: 30, ty: 31, doing: 'sweeping the step' },
      { from: M(8), to: M(11), location: 'village', tx: 28, ty: 22, doing: 'sitting by the square' },
      { from: M(11), to: M(14), location: 'village', tx: 33, ty: 20, doing: 'at the noticeboard' },
      { from: M(14), to: M(18), location: 'shrine', tx: 22, ty: 18, doing: 'tending the shrine' },
      { from: M(18), to: M(22), location: 'village', tx: 26, ty: 26, doing: 'watching the lanterns' },
      { from: M(22), to: M(24), location: 'village', tx: 30, ty: 30, doing: 'asleep' },
    ],
  },
  {
    id: 'cheru',
    name: 'Cheru',
    role: 'Shopkeeper',
    home: 'village',
    greeting:
      'Seeds, twine, lamp oil, and rice flour if the mill ran. You will want seeds. Everyone wants seeds eventually.',
    smallTalk: [
      'I ordered forty packets of tomato seed. Forty. Do not ask me why.',
      'If you grow something you cannot name, bring it here and we will name it together.',
      'The shop is older than the road. The road came to the shop.',
    ],
    skin: {
      skin: '#a97a56',
      skinShade: '#835c3f',
      hair: '#241c22',
      hairLit: '#3d2f36',
      hairStyle: 'short',
      outfit: '#6b7a44',
      outfitDark: '#4a5730',
      trim: PAL.parchment,
      trousers: '#4a4436',
      hat: 'cap',
    },
    schedule: [
      { from: M(0), to: M(7), location: 'village', tx: 44, ty: 34, doing: 'asleep' },
      { from: M(7), to: M(12), location: 'village', tx: 44, ty: 27, doing: 'opening the shop' },
      { from: M(12), to: M(14), location: 'village', tx: 40, ty: 26, doing: 'eating' },
      { from: M(14), to: M(20), location: 'village', tx: 44, ty: 27, doing: 'behind the counter' },
      { from: M(20), to: M(24), location: 'village', tx: 44, ty: 34, doing: 'asleep' },
    ],
  },
  {
    id: 'kannan',
    name: 'Kannan',
    role: 'Blacksmith',
    home: 'village',
    greeting:
      'Mind the sparks. Everything I make is a little bit on fire when it is new — that is how you know it worked.',
    smallTalk: [
      'Iron remembers the shape it was. Wood forgets. That is the whole difference.',
      'I made hinges for the shrine gate. They will outlive me and the gate.',
      'Bring me a broken tool and I will bring it back with opinions.',
    ],
    skin: {
      skin: '#8d6144',
      skinShade: '#6b4630',
      hair: '#1d1519',
      hairLit: '#33262c',
      hairStyle: 'bald',
      outfit: '#5a4a44',
      outfitDark: '#3e332f',
      trim: PAL.parchmentDim,
      trousers: '#3a3230',
      beard: true,
      build: 'sturdy',
      apron: true,
    },
    schedule: [
      { from: M(0), to: M(6), location: 'village', tx: 52, ty: 36, doing: 'asleep' },
      { from: M(6), to: M(11), location: 'village', tx: 52, ty: 26, doing: 'at the forge' },
      { from: M(11), to: M(12), location: 'village', tx: 50, ty: 30, doing: 'washing up' },
      { from: M(12), to: M(17), location: 'village', tx: 52, ty: 26, doing: 'at the forge' },
      { from: M(17), to: M(21), location: 'village', tx: 24, ty: 24, doing: 'drinking tea' },
      { from: M(21), to: M(24), location: 'village', tx: 52, ty: 36, doing: 'asleep' },
    ],
  },
  {
    id: 'meera',
    name: 'Meera',
    role: 'Librarian',
    home: 'village',
    greeting:
      'The library is mostly one shelf and a window. But the shelf has everything worth reading in it, so we do not worry about the rest.',
    smallTalk: [
      'Someone wrote a whole book about how to wait for rain. It is very good.',
      'I am cataloguing by mood now. It is not standard. It is better.',
      'If you find a page in the forest, it is probably mine.',
    ],
    skin: {
      skin: '#c9a07c',
      skinShade: '#a37c5b',
      hair: '#2f2228',
      hairLit: '#4b3540',
      hairStyle: 'long',
      outfit: '#5b6b8a',
      outfitDark: '#3f4c64',
      trim: PAL.parchment,
      trousers: '#3f4658',
      hat: 'none',
    },
    schedule: [
      { from: M(0), to: M(7), location: 'village', tx: 36, ty: 36, doing: 'asleep' },
      { from: M(7), to: M(9), location: 'village', tx: 36, ty: 26, doing: 'unlocking up' },
      { from: M(9), to: M(13), location: 'village', tx: 36, ty: 26, doing: 'reading' },
      { from: M(13), to: M(14), location: 'village', tx: 32, ty: 30, doing: 'walking' },
      { from: M(14), to: M(19), location: 'village', tx: 36, ty: 26, doing: 'reading' },
      { from: M(19), to: M(24), location: 'village', tx: 36, ty: 36, doing: 'asleep' },
    ],
  },
  {
    id: 'arjun',
    name: 'Arjun',
    role: 'Carpenter',
    home: 'village',
    greeting:
      'You hear that? Nothing. No saw. I am between things. It is the best part of the work.',
    smallTalk: [
      'A house is just a promise about the weather.',
      'I am building a chair with no back. It is a chair about trust.',
      'That bridge you crossed — my father set the piles. They are still true.',
    ],
    skin: {
      skin: '#b0805c',
      skinShade: '#8b6244',
      hair: '#33241f',
      hairLit: '#4e3930',
      hairStyle: 'crop',
      outfit: '#7a6a4a',
      outfitDark: '#584c34',
      trim: PAL.parchmentDim,
      trousers: '#4a4034',
      hat: 'straw',
      build: 'sturdy',
    },
    schedule: [
      { from: M(0), to: M(6), location: 'village', tx: 18, ty: 40, doing: 'asleep' },
      { from: M(6), to: M(11), location: 'riverside', tx: 30, ty: 30, doing: 'mending the bridge' },
      { from: M(11), to: M(13), location: 'village', tx: 20, ty: 30, doing: 'eating' },
      { from: M(13), to: M(18), location: 'village', tx: 18, ty: 28, doing: 'in the workshop' },
      { from: M(18), to: M(22), location: 'farmland', tx: 26, ty: 20, doing: 'fixing a fence' },
      { from: M(22), to: M(24), location: 'village', tx: 18, ty: 40, doing: 'asleep' },
    ],
  },
  {
    id: 'thenga',
    name: 'Thenga',
    role: 'Farmer',
    home: 'farmland',
    greeting:
      'The paddy does not care whether you are watching. That is either the most comforting thing in the world or the most lonely. I have not decided.',
    smallTalk: [
      'Rice likes an audience of water and nothing else.',
      'The field by the well is yours if you want it. Try something small first.',
      'You water in the evening and you get quiet in the morning. That is the deal.',
    ],
    skin: {
      skin: '#8a5f42',
      skinShade: '#6a4630',
      hair: '#211a1e',
      hairLit: '#372a30',
      hairStyle: 'wrap',
      outfit: '#6d7a48',
      outfitDark: '#4c5730',
      trim: PAL.parchmentDim,
      trousers: '#4a4a38',
      hat: 'straw',
      beard: true,
      build: 'sturdy',
    },
    schedule: [
      { from: M(0), to: M(5), location: 'farmland', tx: 20, ty: 34, doing: 'asleep' },
      { from: M(5), to: M(8), location: 'farmland', tx: 18, ty: 22, doing: 'checking the water' },
      { from: M(8), to: M(12), location: 'farmland', tx: 24, ty: 20, doing: 'in the paddy' },
      { from: M(12), to: M(14), location: 'farmland', tx: 20, ty: 34, doing: 'eating' },
      { from: M(14), to: M(18), location: 'farmland', tx: 24, ty: 20, doing: 'in the paddy' },
      { from: M(18), to: M(21), location: 'village', tx: 28, ty: 24, doing: 'at the square' },
      { from: M(21), to: M(24), location: 'farmland', tx: 20, ty: 34, doing: 'asleep' },
    ],
  },
  {
    id: 'valli',
    name: 'Valli',
    role: 'Shrine maiden',
    home: 'shrine',
    greeting:
      'The shrine was here before the path. People built the path to reach it and then forgot which one they were serving.',
    smallTalk: [
      'Sweep the steps, light the lamp, listen. The rest is optional.',
      'There is a stone behind the shrine that hums if you are quiet. Try it.',
      'The moss is older than the roof. We do not argue with the moss.',
    ],
    skin: {
      skin: '#c9a07c',
      skinShade: '#a37c5b',
      hair: '#1f1a1f',
      hairLit: '#3a2f35',
      hairStyle: 'long',
      outfit: '#e8e2d4',
      outfitDark: '#c2bbaa',
      trim: '#a2545f',
      trousers: '#d6cfc0',
      hat: 'none',
    },
    schedule: [
      { from: M(0), to: M(5), location: 'shrine', tx: 22, ty: 26, doing: 'asleep' },
      { from: M(5), to: M(7), location: 'shrine', tx: 22, ty: 18, doing: 'sweeping the steps' },
      { from: M(7), to: M(11), location: 'shrine', tx: 22, ty: 16, doing: 'tending the altar' },
      { from: M(11), to: M(13), location: 'shrine', tx: 20, ty: 24, doing: 'resting' },
      { from: M(13), to: M(17), location: 'shrine', tx: 22, ty: 18, doing: 'sweeping' },
      { from: M(17), to: M(20), location: 'forest', tx: 30, ty: 34, doing: 'gathering herbs' },
      { from: M(20), to: M(24), location: 'shrine', tx: 22, ty: 26, doing: 'asleep' },
    ],
  },
  {
    id: 'kadal',
    name: 'Kadal',
    role: 'Fisherman',
    home: 'riverside',
    greeting:
      'You can sit. The fish do not mind and neither do I. They are more patient than either of us.',
    smallTalk: [
      'The river gives you exactly what you were not looking for.',
      'I caught a boot, a bottle, and once a key that opened nothing. Good years.',
      'At dusk the water turns the colour of tea. That is when I stop working.',
    ],
    skin: {
      skin: '#96674a',
      skinShade: '#734a33',
      hair: '#2a2126',
      hairLit: '#42343c',
      hairStyle: 'wrap',
      outfit: '#4f6a70',
      outfitDark: '#374d52',
      trim: PAL.parchmentDim,
      trousers: '#3f4a50',
      beard: true,
    },
    schedule: [
      { from: M(0), to: M(5), location: 'riverside', tx: 22, ty: 36, doing: 'asleep' },
      { from: M(5), to: M(9), location: 'riverside', tx: 28, ty: 26, doing: 'fishing' },
      { from: M(9), to: M(12), location: 'riverside', tx: 24, ty: 30, doing: 'mending nets' },
      { from: M(12), to: M(14), location: 'village', tx: 26, ty: 26, doing: 'eating' },
      { from: M(14), to: M(19), location: 'riverside', tx: 28, ty: 26, doing: 'fishing' },
      { from: M(19), to: M(22), location: 'village', tx: 24, ty: 24, doing: 'drinking tea' },
      { from: M(22), to: M(24), location: 'riverside', tx: 22, ty: 36, doing: 'asleep' },
    ],
  },
  {
    id: 'ponni',
    name: 'Ponni',
    role: 'Florist',
    home: 'village',
    greeting:
      'Careful — that one is not a weed, it is a plan. Everything here is either a plan or a mistake and I have stopped telling them apart.',
    smallTalk: [
      'Flowers are crops that decided to be honest about it.',
      'Bring me something from the forest and I will tell you its name and its mood.',
      'The blossom trees bloom on their own schedule and it is not mine.',
    ],
    skin: {
      skin: '#b58462',
      skinShade: '#906347',
      hair: '#3a2a24',
      hairLit: '#564035',
      hairStyle: 'bun',
      outfit: '#8a5c72',
      outfitDark: '#653f52',
      trim: PAL.parchment,
      trousers: '#4a4050',
      apron: true,
    },
    schedule: [
      { from: M(0), to: M(6), location: 'village', tx: 16, ty: 34, doing: 'asleep' },
      { from: M(6), to: M(9), location: 'village', tx: 16, ty: 26, doing: 'watering' },
      { from: M(9), to: M(12), location: 'village', tx: 14, ty: 24, doing: 'arranging flowers' },
      { from: M(12), to: M(13), location: 'village', tx: 20, ty: 28, doing: 'eating' },
      { from: M(13), to: M(18), location: 'forest', tx: 26, ty: 30, doing: 'gathering' },
      { from: M(18), to: M(21), location: 'village', tx: 16, ty: 26, doing: 'watering' },
      { from: M(21), to: M(24), location: 'village', tx: 16, ty: 34, doing: 'asleep' },
    ],
  },
  {
    id: 'thevan',
    name: 'Thevan',
    role: 'Hermit',
    home: 'forest',
    greeting:
      'Hm. You walked the long path. Most turn back at the bamboo. Sit, or do not — I am not your host.',
    smallTalk: [
      'The forest has been counting. It does not tell me the number.',
      'I came here to be away from the noise of other people\'s plans. You are noise. Stay anyway.',
      'There are stones out there that were placed on purpose. You can feel it if you stand still.',
    ],
    skin: {
      skin: '#9c7150',
      skinShade: '#785238',
      hair: '#c2b8ae',
      hairLit: '#ded6cc',
      hairStyle: 'long',
      outfit: '#4a4a3a',
      outfitDark: '#323226',
      trim: PAL.parchmentDeep,
      trousers: '#3f3f32',
      beard: true,
    },
    schedule: [
      { from: M(0), to: M(7), location: 'forest', tx: 40, ty: 40, doing: 'asleep' },
      { from: M(7), to: M(12), location: 'forest', tx: 40, ty: 34, doing: 'sitting' },
      { from: M(12), to: M(15), location: 'forest', tx: 34, ty: 40, doing: 'walking' },
      { from: M(15), to: M(19), location: 'forest', tx: 40, ty: 34, doing: 'sitting' },
      { from: M(19), to: M(22), location: 'shrine', tx: 30, ty: 26, doing: 'visiting the shrine' },
      { from: M(22), to: M(24), location: 'forest', tx: 40, ty: 40, doing: 'asleep' },
    ],
  },
  {
    id: 'naandu',
    name: 'Naandu',
    role: 'Travelling merchant',
    home: 'village',
    greeting:
      'Once a season I come through with things nobody asked for and everybody needs. Today: lamps, rope, and a very ugly kettle.',
    smallTalk: [
      'I trade in objects and in rumours. The objects keep better.',
      'Three valleys over they are building something enormous out of sticks. I did not stay to see it.',
      'If you ever need a thing you cannot name, describe it badly and I will find it.',
    ],
    skin: {
      skin: '#a3704f',
      skinShade: '#7e5238',
      hair: '#221b1f',
      hairLit: '#3b2e34',
      hairStyle: 'crop',
      outfit: '#8a6a3c',
      outfitDark: '#634b28',
      trim: PAL.accent,
      trousers: '#4a4030',
      hat: 'straw',
      apron: true,
    },
    schedule: [
      { from: M(0), to: M(8), location: 'village', tx: 40, ty: 40, doing: 'asleep at the inn' },
      { from: M(8), to: M(11), location: 'village', tx: 32, ty: 30, doing: 'setting up the stall' },
      { from: M(11), to: M(19), location: 'village', tx: 32, ty: 30, doing: 'at the stall' },
      { from: M(19), to: M(22), location: 'village', tx: 24, ty: 24, doing: 'at the tea house' },
      { from: M(22), to: M(24), location: 'village', tx: 40, ty: 40, doing: 'asleep at the inn' },
    ],
  },
  {
    id: 'sudha',
    name: 'Sudha',
    role: 'Student',
    home: 'village',
    greeting:
      'Sorry — I am mid-thought. Do you ever notice the river sounds different when you are trying to think? It is louder. Rudely louder.',
    smallTalk: [
      'I am writing down every bird I see. There are eleven. There might be twelve.',
      'Everyone says the library is small. Nobody says it is enough.',
      'I want to build something that outlives me. Is that a strange thing to want at my age?',
    ],
    skin: {
      skin: '#c69a72',
      skinShade: '#a07855',
      hair: '#2b2028',
      hairLit: '#453540',
      hairStyle: 'bun',
      outfit: '#5b7a8a',
      outfitDark: '#3f5a66',
      trim: PAL.parchment,
      trousers: '#414a56',
    },
    schedule: [
      { from: M(0), to: M(6), location: 'village', tx: 34, ty: 40, doing: 'asleep' },
      { from: M(6), to: M(8), location: 'village', tx: 34, ty: 30, doing: 'walking to the library' },
      { from: M(8), to: M(12), location: 'village', tx: 36, ty: 26, doing: 'reading' },
      { from: M(12), to: M(13), location: 'village', tx: 30, ty: 28, doing: 'eating' },
      { from: M(13), to: M(16), location: 'riverside', tx: 30, ty: 32, doing: 'watching the water' },
      { from: M(16), to: M(19), location: 'village', tx: 36, ty: 26, doing: 'reading' },
      { from: M(19), to: M(24), location: 'village', tx: 34, ty: 40, doing: 'asleep' },
    ],
  },
];

export const NPC_BY_ID: Record<string, NpcDef> = Object.fromEntries(NPCS.map((n) => [n.id, n]));

export const NPC_SKINS: Record<string, CharacterSkin> = Object.fromEntries(NPCS.map((n) => [n.id, n.skin]));

/** Which phase a minute-of-day falls into. */
export function phaseForMinute(minuteOfDay: number): DayPhase {
  const m = ((minuteOfDay % 1440) + 1440) % 1440;
  if (m < 300) return 'night';
  if (m < 420) return 'dawn';
  if (m < 720) return 'morning';
  if (m < 1020) return 'afternoon';
  if (m < 1140) return 'dusk';
  return 'night';
}

/** Resolve an NPC's schedule block for a given minute-of-day. */
export function scheduleAt(npc: NpcDef, minuteOfDay: number): ScheduleBlock {
  const m = ((minuteOfDay % 1440) + 1440) % 1440;
  const blocks = [...npc.schedule].sort((a, b) => a.from - b.from);
  for (const b of blocks) {
    if (m >= b.from && m < b.to) return b;
  }
  return blocks[0] ?? { from: 0, to: 1440, location: npc.home, tx: 20, ty: 20 };
}

/** Human-readable clock for the HUD. */
export function formatClock(minuteOfDay: number): string {
  const m = ((Math.floor(minuteOfDay) % 1440) + 1440) % 1440;
  const h24 = Math.floor(m / 60);
  const mm = m % 60;
  const suffix = h24 < 12 ? 'am' : 'pm';
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h12}:${mm.toString().padStart(2, '0')} ${suffix}`;
}