import { reactive } from 'vue';
import type {
  InventoryItem,
  ToolType,
  TimeOfDay,
  Season,
  WeatherType,
  DialogueNode,
  GitHubValleyBlessing,
  ToastMessage,
} from '@/types';
import { soundEngine } from '@/audio/procedural-audio';
import { GitHubService } from '@/github/github-service';

export interface GameStoreState {
  inventory: InventoryItem[];
  activeTool: ToolType;
  timeState: {
    day: number;
    season: Season;
    hour: number; // 0 to 24
    minute: number;
    timeOfDay: TimeOfDay;
  };
  weather: WeatherType;
  activeModal: 'inventory' | 'shrine' | 'journal' | null;
  currentDialogue: DialogueNode | null;
  toasts: ToastMessage[];
  blessing: GitHubValleyBlessing;
  stats: {
    cropsHarvested: number;
    seedsPlanted: number;
    talkCount: number;
  };
  audioMuted: boolean;
}

const initialInventory: InventoryItem[] = [
  {
    id: 'tool_hoe',
    name: 'Iron Hoe',
    japaneseName: '備中鍬',
    description: 'Forged tool for turning wild earth into fertile crop beds.',
    category: 'tool',
    count: 1,
    iconFrame: 'farming_pixel_art_p01_r00_c01',
    atlas: 'farming_pixel_art',
  },
  {
    id: 'tool_water',
    name: 'Bamboo Water Can',
    japaneseName: '竹水差し',
    description: 'Carved bamboo pitcher for hydrating dry garden plots.',
    category: 'tool',
    count: 1,
    iconFrame: 'farming_pixel_art_p01_r00_c06',
    atlas: 'farming_pixel_art',
  },
  {
    id: 'seed_radish',
    name: 'Daikon Radish Seeds',
    japaneseName: '大根の種',
    description: 'Crisp, sweet winter radish. Grows in 2 gentle stages.',
    category: 'seed',
    count: 8,
    iconFrame: 'farming_pixel_art_p01_r00_c02',
    atlas: 'farming_pixel_art',
  },
  {
    id: 'seed_rice',
    name: 'Valley Rice Seeds',
    japaneseName: '谷の稲種',
    description: 'Hearty golden valley rice. Loves moist soil by the stream.',
    category: 'seed',
    count: 6,
    iconFrame: 'farming_pixel_art_p01_r00_c03',
    atlas: 'farming_pixel_art',
  },
  {
    id: 'seed_tea',
    name: 'Mountain Tea Seeds',
    japaneseName: '山茶の種',
    description: 'Fragrant hillside green tea. Highly revered by village elders.',
    category: 'seed',
    count: 4,
    iconFrame: 'farming_pixel_art_p01_r00_c04',
    atlas: 'farming_pixel_art',
  },
  {
    id: 'seed_starlight',
    name: 'Starlight Spore',
    japaneseName: '星の種子',
    description: 'A glowing seed blessed by the valley shrine. Emits soft twilight luminescence.',
    category: 'seed',
    count: 2,
    iconFrame: 'environmental_effects_p01_r00_c01',
    atlas: 'environmental_effects',
  },
  {
    id: 'tool_basket',
    name: 'Woven Harvest Basket',
    japaneseName: '編み籠',
    description: 'For collecting ripe vegetables, wild mushrooms, and river pebbles.',
    category: 'tool',
    count: 1,
    iconFrame: 'farming_pixel_art_p01_r00_c07',
    atlas: 'farming_pixel_art',
  },
  {
    id: 'tool_lantern',
    name: 'Washi Paper Lantern',
    japaneseName: '和紙提灯',
    description: 'Casts a gentle warm amber light during evening and starry nights.',
    category: 'tool',
    count: 1,
    iconFrame: 'buildings_interiors_p01_r00_c00',
    atlas: 'buildings_interiors',
  },
];

export const gameStore = reactive<GameStoreState>({
  inventory: initialInventory,
  activeTool: 'hoe',
  timeState: {
    day: 1,
    season: 'spring',
    hour: 7,
    minute: 30,
    timeOfDay: 'morning',
  },
  weather: 'sakura_breeze',
  activeModal: null,
  currentDialogue: null,
  toasts: [],
  blessing: GitHubService.getDefaultBlessing(),
  stats: {
    cropsHarvested: 0,
    seedsPlanted: 0,
    talkCount: 0,
  },
  audioMuted: false,
});

export const gameActions = {
  setActiveTool(tool: ToolType) {
    gameStore.activeTool = tool;
    soundEngine.playPluck(1);
  },

  toggleModal(modal: 'inventory' | 'shrine' | 'journal') {
    if (gameStore.activeModal === modal) {
      gameStore.activeModal = null;
    } else {
      gameStore.activeModal = modal;
      soundEngine.playPluck(3);
    }
  },

  closeModal() {
    gameStore.activeModal = null;
  },

  openDialogue(node: DialogueNode) {
    gameStore.currentDialogue = node;
    soundEngine.playPluck(4);
  },

  closeDialogue() {
    gameStore.currentDialogue = null;
  },

  toggleMute() {
    gameStore.audioMuted = soundEngine.toggleMute();
  },

  addToast(text: string, category: 'farm' | 'blessing' | 'nature' | 'info' = 'info') {
    const id = Math.random().toString(36).substring(2, 9);
    gameStore.toasts.push({ id, text, category });
    setTimeout(() => {
      gameStore.toasts = gameStore.toasts.filter((t) => t.id !== id);
    }, 4200);
  },

  addItem(item: Omit<InventoryItem, 'count'>, amount = 1) {
    const existing = gameStore.inventory.find((i) => i.id === item.id);
    if (existing) {
      existing.count += amount;
    } else {
      gameStore.inventory.push({ ...item, count: amount });
    }
  },

  consumeItem(id: string, amount = 1): boolean {
    const item = gameStore.inventory.find((i) => i.id === id);
    if (!item || item.count < amount) return false;
    item.count -= amount;
    if (item.count <= 0 && item.category !== 'tool') {
      gameStore.inventory = gameStore.inventory.filter((i) => i.id !== id);
    }
    return true;
  },

  async applyGitHubBlessing(username: string) {
    const blessing = await GitHubService.fetchUserBlessing(username);
    gameStore.blessing = blessing;

    // Apply gentle game blessing
    if (blessing.blessingType === 'starlight_dew') {
      this.addItem({
        id: 'seed_starlight',
        name: 'Starlight Spore',
        japaneseName: '星の種子',
        description: 'A rare celestial spore gifted by the shrine.',
        category: 'seed',
        iconFrame: 'environmental_effects_p01_r00_c01',
        atlas: 'environmental_effects',
      }, 2);
    } else if (blessing.blessingType === 'calm_rain') {
      gameStore.weather = 'gentle_rain';
    } else if (blessing.blessingType === 'peaceful_rest') {
      gameStore.weather = 'sakura_breeze';
    }

    this.addToast(`Blessed by ${blessing.title}!`, 'blessing');
  },

  advanceTime(minutesPassed: number) {
    let newMinute = gameStore.timeState.minute + minutesPassed;
    let newHour = gameStore.timeState.hour;
    let newDay = gameStore.timeState.day;

    while (newMinute >= 60) {
      newMinute -= 60;
      newHour += 1;
    }

    if (newHour >= 24) {
      newHour = 0;
      newDay += 1;
      this.addToast(`Day ${newDay} begins in Gitakure.`, 'nature');
    }

    gameStore.timeState.minute = newMinute;
    gameStore.timeState.hour = newHour;
    gameStore.timeState.day = newDay;

    // Update time of day
    if (newHour >= 5 && newHour < 8) {
      gameStore.timeState.timeOfDay = 'dawn';
    } else if (newHour >= 8 && newHour < 12) {
      gameStore.timeState.timeOfDay = 'morning';
    } else if (newHour >= 12 && newHour < 17) {
      gameStore.timeState.timeOfDay = 'noon';
    } else if (newHour >= 17 && newHour < 20) {
      gameStore.timeState.timeOfDay = 'dusk';
    } else {
      gameStore.timeState.timeOfDay = 'night';
    }
  },
};
