import { addDiscovery, addJournalEntry, type WorldDiscovery, type JournalEntry } from '@/storage/db';

export interface GitHubRepoSummary {
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  language: string | null;
  stargazersCount: number;
  fork: boolean;
}

export interface InterpretedDevelopmentHistory {
  username: string;
  totalRepos: number;
  firstRepoYear: number;
  yearsOfJourney: number;
  favoriteLanguages: string[];
  keyMilestones: {
    year: number;
    title: string;
    narrative: string;
    repoName?: string;
  }[];
  generatedDiscoveries: WorldDiscovery[];
  openingJournalEntry: JournalEntry;
  rateLimited?: boolean;
}

const LANGUAGE_POETICS: Record<string, { title: string; desc: string; icon: string }> = {
  Rust: {
    title: 'The Iron-Forged Temple Lantern',
    desc: 'Forged with exactness and endurance, cast from iron that never yields to corrosion.',
    icon: '🏮',
  },
  Python: {
    title: 'The Carved Green Bamboo Inkwell',
    desc: 'Gentle, expressive, and flowing like clean mountain water through bamboo chutes.',
    icon: '🎋',
  },
  TypeScript: {
    title: 'The Interlocking Stone Garden Path',
    desc: 'Every stone measured and laid with deliberate symmetry to guide feet through the mist.',
    icon: '🪨',
  },
  JavaScript: {
    title: 'The Wandering Canal Firefly',
    desc: 'Quick, adaptable, and lighting up unexpected corners of the evening.',
    icon: '✨',
  },
  Go: {
    title: 'The Swift Canal Courier Vallam',
    desc: 'Trim, purposeful, and cutting cleanly through backwater tides with zero unnecessary baggage.',
    icon: '🛶',
  },
  'C++': {
    title: 'The Ancient Chiseled Foundation Pillar',
    desc: 'Solid granite quarried from deep mountain bedrock, holding the whole ceiling without complaint.',
    icon: '🏛️',
  },
  C: {
    title: 'The Deep Mountain Spring',
    desc: 'The original pure source from which all the valley rivers eventually flowed.',
    icon: '💧',
  },
  HTML: {
    title: 'The Washi Paper Sliding Screen',
    desc: 'Diffusing sunlight into warm softness, framing the world with clean structure.',
    icon: '📜',
  },
  CSS: {
    title: 'The Indigo Silk Tapestry',
    desc: 'Dyed with backwater indigo and madder root, draping the timber frames in quiet elegance.',
    icon: '🧵',
  },
};

export class GitHubHistoryInterpreter {
  /**
   * Fetches public repositories & profile info safely with no backend.
   */
  public static async fetchAndInterpret(username: string): Promise<InterpretedDevelopmentHistory> {
    const cleanUser = username.trim().replace(/^@/, '');
    if (!cleanUser) {
      return this.generateDefaultTranquilHistory('Valley Wanderer');
    }

    try {
      // 1. Fetch user profile
      const userRes = await fetch(`https://api.github.com/users/${encodeURIComponent(cleanUser)}`);
      if (userRes.status === 403 || userRes.status === 429) {
        const fallback = this.generateDefaultTranquilHistory(cleanUser);
        fallback.rateLimited = true;
        return fallback;
      }
      if (!userRes.ok) {
        return this.generateDefaultTranquilHistory(cleanUser);
      }
      const userData = await userRes.json();

      // 2. Fetch public repos (up to 100)
      const reposRes = await fetch(
        `https://api.github.com/users/${encodeURIComponent(cleanUser)}/repos?sort=created&direction=asc&per_page=100`
      );
      const repos: GitHubRepoSummary[] = reposRes.ok ? await reposRes.json() : [];

      return this.interpret(cleanUser, userData, repos);
    } catch {
      return this.generateDefaultTranquilHistory(cleanUser);
    }
  }

  /**
   * Transforms raw GitHub data into poetic, pressure-free countryside memories.
   */
  public static interpret(
    username: string,
    userData: { public_repos?: number; created_at?: string; name?: string },
    repos: GitHubRepoSummary[]
  ): InterpretedDevelopmentHistory {
    const currentYear = new Date().getFullYear();
    const accountCreatedYear = userData.created_at ? new Date(userData.created_at).getFullYear() : currentYear;
    const yearsOfJourney = Math.max(1, currentYear - accountCreatedYear + 1);

    // Collect language counts
    const langMap: Record<string, number> = {};
    repos.forEach((r) => {
      if (r.language) {
        langMap[r.language] = (langMap[r.language] || 0) + 1;
      }
    });
    const sortedLangs = Object.entries(langMap)
      .sort((a, b) => b[1] - a[1])
      .map(([lang]) => lang)
      .slice(0, 3);

    // 1. First Repository: The "Old Seed"
    const firstRepo = repos.length > 0 ? repos[0] : null;
    const firstRepoYear = firstRepo ? new Date(firstRepo.createdAt).getFullYear() : accountCreatedYear;

    // 2. Identify 2-4 subtle milestones (never flood the player)
    const milestones: InterpretedDevelopmentHistory['keyMilestones'] = [];

    milestones.push({
      year: firstRepoYear,
      title: 'The First Spark of Curiosity',
      narrative: firstRepo
        ? `In ${firstRepoYear}, the first repository '${firstRepo.name}' was planted like a wild bamboo sprout. A journey had quietly begun.`
        : `A path opened in ${firstRepoYear}. Every craft begins with a single curious step.`,
      repoName: firstRepo?.name,
    });

    if (yearsOfJourney >= 3) {
      milestones.push({
        year: firstRepoYear + Math.floor(yearsOfJourney / 2),
        title: 'Deep Roots in the Soil',
        narrative: `Across multiple seasons, patience grew. Solutions were contemplated, libraries explored, and quiet perseverance became habit.`,
      });
    }

    // 3. Convert into 3 initial gradual discoveries (not 100!)
    const discoveries: WorldDiscovery[] = [
      {
        id: `gh_first_seed_${username}`,
        title: firstRepo ? `Keepsake of ${firstRepo.name}` : 'A Weathered Wooden Compass',
        subtitle: `Memory of Year ${firstRepoYear}`,
        category: 'github_memory',
        discoveredAt: new Date().toISOString(),
        description: `Resting under the eaves of the tea cottage lies a carved talisman inscribed with ${firstRepoYear}. It carries the quiet gratitude of learning something new for the first time.`,
        quote: 'The seeds of yesterday cast long, comforting shadows today.',
        icon: '🌱',
      },
      {
        id: `gh_journey_lantern_${username}`,
        title: 'The Traveler’s River Lantern',
        subtitle: `${yearsOfJourney} Seasons of Craft`,
        category: 'architecture',
        discoveredAt: new Date().toISOString(),
        description: `Floating beside the Kerala backwater canal, this oil lantern burns gently. Its flame signifies that no effort made in passion is ever forgotten.`,
        quote: 'Like water carving a canal, patience builds a world without noise.',
        icon: '🏮',
      },
    ];

    if (sortedLangs.length > 0) {
      const topLang = sortedLangs[0];
      const poetic = LANGUAGE_POETICS[topLang] || {
        title: `The Scroll of ${topLang}`,
        desc: `Bound with bamboo cord in the village archive, these notes record thoughts written in the syntax of ${topLang}.`,
        icon: '📜',
      };

      discoveries.push({
        id: `gh_craft_tome_${username}_${topLang}`,
        title: poetic.title,
        subtitle: `Language of Craft · ${topLang}`,
        category: 'folklore',
        discoveredAt: new Date().toISOString(),
        description: poetic.desc,
        quote: 'Every language is a different window looking out at the same mountain.',
        icon: poetic.icon,
      });
    }

    const openingJournalEntry: JournalEntry = {
      id: `journal_welcome_${Date.now()}`,
      title: `Arrival at Gitakure Valley — ${username}`,
      createdAt: new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }),
      season: 'Monsoon Spring',
      weather: 'Gentle Rain',
      timeOfDay: 'Dusk',
      text: `Left the clatter of keyboards and notifications behind. The sound of rain dripping from the tharavadu clay tiles blends with the wind rustling through Japanese bamboo. Here, nobody asks what I shipped today. The river simply flows.`,
      source: 'github_memory',
    };

    return {
      username,
      totalRepos: repos.length || userData.public_repos || 0,
      firstRepoYear,
      yearsOfJourney,
      favoriteLanguages: sortedLangs,
      keyMilestones: milestones,
      generatedDiscoveries: discoveries,
      openingJournalEntry,
    };
  }

  /**
   * Default serene memory for offline or disconnected players.
   */
  public static generateDefaultTranquilHistory(name = 'Valley Wanderer'): InterpretedDevelopmentHistory {
    const openingJournalEntry: JournalEntry = {
      id: `journal_solitude_${Date.now()}`,
      title: 'A Letter from the Tea Porch',
      createdAt: new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }),
      season: 'Monsoon Spring',
      weather: 'Sakura Breeze',
      timeOfDay: 'Morning',
      text: `Sat on the veranda with hot spiced tea. Watched an egret land on the bank of the backwater canal. No deadlines, no backlogs, no unread tickets. Just the slow drift of clouds over the Western Ghats and the smell of wet earth.`,
      source: 'valley_chronicle',
    };

    const discoveries: WorldDiscovery[] = [
      {
        id: 'default_sanctuary_stone',
        title: 'The Moss-Covered Stepping Stone',
        subtitle: 'Foundations of Stillness',
        category: 'nature',
        discoveredAt: new Date().toISOString(),
        description: 'Smooth river rock laid where the canal meets the bamboo grove. Cool beneath the feet, weathered by decades of rainfall.',
        quote: 'Rest is the ground from which all genuine creations rise.',
        icon: '🪨',
      },
      {
        id: 'default_kettuvallam',
        title: 'The Moored Wooden Country Boat',
        subtitle: 'Resting on the Canal',
        category: 'architecture',
        discoveredAt: new Date().toISOString(),
        description: 'A traditional wooden vallam tied gently to the coconut palm. It sways with the rhythm of the water, waiting for nowhere in particular.',
        quote: 'There is no haste in a river that knows where it is going.',
        icon: '🛶',
      },
    ];

    return {
      username: name,
      totalRepos: 0,
      firstRepoYear: new Date().getFullYear() - 2,
      yearsOfJourney: 2,
      favoriteLanguages: ['Silence', 'Curiosity'],
      keyMilestones: [
        {
          year: new Date().getFullYear(),
          title: 'The Choice to Rest',
          narrative: 'Decided to step into Gitakure and let the mind wander freely.',
        },
      ],
      generatedDiscoveries: discoveries,
      openingJournalEntry,
    };
  }

  /**
   * Persists discoveries & journal entries to IndexedDB smoothly.
   * Returns count of truly new discoveries unlocked.
   */
  public static async applyToLocalWorld(history: InterpretedDevelopmentHistory): Promise<{ newCount: number; isRepeat: boolean }> {
    let newCount = 0;
    for (const disc of history.generatedDiscoveries) {
      const isNew = await addDiscovery(disc);
      if (isNew) newCount++;
    }
    await addJournalEntry(history.openingJournalEntry);
    return { newCount, isRepeat: newCount === 0 };
  }
}
