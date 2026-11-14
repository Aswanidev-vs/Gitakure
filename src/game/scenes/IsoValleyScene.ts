import Phaser from 'phaser';
import { IsometricHelper } from '@/game/camera/isometric';
import { gameBridge } from '@/bridge/game-bridge';
import { soundscapes } from '@/game/audio/soundscapes';
import { addDiscovery, addJournalEntry } from '@/storage/db';
import type { DialogueNode, WeatherType, Season, TimeOfDay } from '@/types';

interface InteractiveSeat {
  gx: number;
  gy: number;
  name: string;
  type: 'campfire' | 'veranda' | 'riverside';
}

interface ValleyNPC {
  id: string;
  name: string;
  sprite: Phaser.GameObjects.Sprite;
  shadow: Phaser.GameObjects.Ellipse;
  gx: number;
  gy: number;
  homeGx: number;
  homeGy: number;
  wanderRadius: number;
  isMoving: boolean;
  timer: number;
  getDialogue: (timeOfDay: TimeOfDay) => DialogueNode;
}

interface ForageSpot {
  id: string;
  title: string;
  subtitle: string;
  category: 'nature' | 'architecture' | 'github_memory' | 'folklore';
  icon: string;
  gx: number;
  gy: number;
  description: string;
  sprite?: Phaser.GameObjects.Sprite;
  collected: boolean;
}

interface SwimmingKoi {
  sprite: Phaser.GameObjects.Sprite;
  gx: number;
  gy: number;
  speed: number;
  direction: number;
}

export class IsoValleyScene extends Phaser.Scene {
  private playerSprite!: Phaser.Physics.Arcade.Sprite;
  private playerShadow!: Phaser.GameObjects.Ellipse;
  private playerGx = 10;
  private playerGy = 10;
  private isSitting = false;
  private isFishing = false;
  private fishingTimer = 0;
  private fishingBobber?: Phaser.GameObjects.Arc;
  private playerFacing: 'dr' | 'dl' | 'ur' | 'ul' = 'dr';
  private walkAnimTimer = 0;
  private walkAnimFrame = 0;

  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasdKeys!: {
    W: Phaser.Input.Keyboard.Key;
    A: Phaser.Input.Keyboard.Key;
    S: Phaser.Input.Keyboard.Key;
    D: Phaser.Input.Keyboard.Key;
    SHIFT: Phaser.Input.Keyboard.Key;
    E: Phaser.Input.Keyboard.Key;
    C: Phaser.Input.Keyboard.Key;
    F: Phaser.Input.Keyboard.Key;
  };

  private campfireSprite?: Phaser.GameObjects.Sprite;
  private campfireLight?: Phaser.GameObjects.Arc;
  private campfireFrameTimer = 0;
  private campfireFrame = 0;
  private campfireParticles?: Phaser.GameObjects.Particles.ParticleEmitter;

  private ambientTintOverlay!: Phaser.GameObjects.Rectangle;
  private weatherParticles?: Phaser.GameObjects.Particles.ParticleEmitter;
  private fireflyParticles?: Phaser.GameObjects.Particles.ParticleEmitter;

  private treeSprites: Phaser.GameObjects.Sprite[] = [];
  private npcs: ValleyNPC[] = [];
  private forageSpots: ForageSpot[] = [];
  private swimmingKoi: SwimmingKoi[] = [];
  private butterflies: Phaser.GameObjects.Sprite[] = [];

  private interactiveSeats: InteractiveSeat[] = [
    { gx: 13, gy: 14, name: 'Riverside Campfire Log', type: 'campfire' },
    { gx: 12, gy: 8, name: 'Tharavadu Veranda Bench', type: 'veranda' },
    { gx: 5, gy: 6, name: 'Tea Porch Tatami Bench', type: 'veranda' },
    { gx: 17, gy: 16, name: 'Canal Stepping Stone', type: 'riverside' },
  ];

  private stepTimer = 0;
  private currentWeather: WeatherType = 'sakura_breeze';
  private currentSeason: Season = 'spring';
  private currentTimeOfDay: TimeOfDay = 'dusk';
  private lastPromptText = '';
  private virtualMovement = { dx: 0, dy: 0 };

  constructor() {
    super({ key: 'IsoValleyScene' });
  }

  create(): void {
    // 1. Build Fixed 2:1 Isometric Countryside Terrain
    this.buildTerrain();

    // 2. Build Japanese-Kerala Architecture & Flora
    this.buildWorldProps();

    // 3. Campfire by the backwater canal
    this.setupCampfire();

    // 4. Wildlife (Koi, Heron, Butterflies, Cat)
    this.setupWildlife();

    // 5. Forageable Valley Keepsakes
    this.setupForageables();

    // 6. Village NPCs (Master Ren, Devaki Amma, Appu)
    this.setupNPCs();

    // 7. Player Character with Bespoke Sprites
    this.setupPlayer();

    // 8. Camera
    this.cameras.main.startFollow(this.playerSprite, true, 0.08, 0.08);
    this.cameras.main.setZoom(1.35);
    this.cameras.main.roundPixels = true;

    // 9. Ambient Lighting & Weather Overlays
    this.setupLightingAndWeather();

    // 10. Bridge Event Listeners
    this.setupBridgeListeners();

    // 11. Input Setup
    if (this.input.keyboard) {
      this.cursors = this.input.keyboard.createCursorKeys();
      this.wasdKeys = this.input.keyboard.addKeys({
        W: Phaser.Input.Keyboard.KeyCodes.W,
        A: Phaser.Input.Keyboard.KeyCodes.A,
        S: Phaser.Input.Keyboard.KeyCodes.S,
        D: Phaser.Input.Keyboard.KeyCodes.D,
        SHIFT: Phaser.Input.Keyboard.KeyCodes.SHIFT,
        E: Phaser.Input.Keyboard.KeyCodes.E,
        C: Phaser.Input.Keyboard.KeyCodes.C,
        F: Phaser.Input.Keyboard.KeyCodes.F,
      }) as typeof this.wasdKeys;
    }

    // Start soundscapes
    soundscapes.init();
    soundscapes.setWeather('sakura_breeze');
  }

  private buildTerrain(): void {
    // 26 x 26 Isometric Countryside Grid
    for (let gx = 0; gx < 26; gx++) {
      for (let gy = 0; gy < 26; gy++) {
        const { x, y } = IsometricHelper.gridToScreen(gx, gy);
        const depth = IsometricHelper.getIsoDepth(gx, gy, 0);

        let textureKey = 'tile_grass';

        // East: Flowing Kerala Backwater Canal (gx >= 17)
        if (gx >= 17) {
          textureKey = (gx + gy) % 6 === 0 ? 'tile_water_lily' : 'tile_water';
        }
        // South: Terraced Paddy Fields (gx: 4-12, gy: 15-22)
        else if (gx >= 4 && gx <= 12 && gy >= 15 && gy <= 22) {
          textureKey = 'tile_paddy';
        }
        // Cobblestone path connecting Tea Pavilion, Torii Grove, and Tharavadu
        else if (
          (gx >= 5 && gx <= 13 && gy === 5) || // horizontal connector
          (gx === 9 && gy >= 2 && gy <= 5) ||  // path to Torii shrine
          (gx === 13 && gy >= 5 && gy <= 13)    // path to Tharavadu & campfire
        ) {
          textureKey = 'tile_stone_path';
        }
        // Soil path from homestead to canal dock
        else if (gy === 9 && gx >= 13 && gx <= 17) {
          textureKey = 'tile_soil_path';
        }
        // Wildflower meadow patches
        else if ((gx * 17 + gy * 31) % 5 === 0) {
          textureKey = 'tile_grass_flowers';
        }

        const tile = this.add.sprite(x, y + 4, textureKey);
        tile.setOrigin(0.5, 0.5);
        tile.setDepth(depth);

        // Water gentle shimmering tween
        if (textureKey.startsWith('tile_water')) {
          this.tweens.add({
            targets: tile,
            alpha: 0.88,
            duration: 1800 + ((gx * 23 + gy * 41) % 1200),
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut',
          });
        }
      }
    }

    // Wooden Canal Footbridge spanning banks at gy = 9, gx = 16 to 18
    for (let gx = 16; gx <= 18; gx++) {
      const { x, y } = IsometricHelper.gridToScreen(gx, 9);
      const bridge = this.add.sprite(x, y - 6, 'prop_wooden_bridge');
      bridge.setDepth(IsometricHelper.getIsoDepth(gx, 9, 4));
    }
  }

  private buildWorldProps(): void {
    // 1. Traditional Kerala Tharavadu Homestead (gx: 12, gy: 6)
    const tharavaduPos = IsometricHelper.gridToScreen(12, 6);
    const tharavadu = this.add.sprite(tharavaduPos.x, tharavaduPos.y - 30, 'prop_tharavadu');
    tharavadu.setDepth(IsometricHelper.getIsoDepth(12, 6, 25));

    // Veranda Bench on Tharavadu front
    const bench1Pos = IsometricHelper.gridToScreen(12, 8);
    const bench1 = this.add.sprite(bench1Pos.x, bench1Pos.y - 8, 'prop_bench');
    bench1.setDepth(IsometricHelper.getIsoDepth(12, 8, 8));

    // 2. Japanese Tea Pavilion (Northwest: gx: 5, gy: 4)
    const teaPos = IsometricHelper.gridToScreen(5, 4);
    const teaPavilion = this.add.sprite(teaPos.x, teaPos.y - 25, 'prop_tea_house');
    teaPavilion.setDepth(IsometricHelper.getIsoDepth(5, 4, 25));

    // Tea Porch Bench
    const teaBenchPos = IsometricHelper.gridToScreen(5, 6);
    const teaBench = this.add.sprite(teaBenchPos.x, teaBenchPos.y - 8, 'prop_bench');
    teaBench.setDepth(IsometricHelper.getIsoDepth(5, 6, 8));

    // 3. Sacred Torii & Kavu Grove (North: gx: 9, gy: 2)
    const toriiPos = IsometricHelper.gridToScreen(9, 2);
    const torii = this.add.sprite(toriiPos.x, toriiPos.y - 20, 'prop_torii_shrine');
    torii.setDepth(IsometricHelper.getIsoDepth(9, 2, 25));

    // Stone Lanterns along pathways
    const lanternPositions = [
      { gx: 8, gy: 3 },
      { gx: 10, gy: 3 },
      { gx: 13, gy: 8 },
    ];
    lanternPositions.forEach((lp) => {
      const pos = IsometricHelper.gridToScreen(lp.gx, lp.gy);
      const lantern = this.add.sprite(pos.x, pos.y - 12, 'prop_stone_lantern');
      lantern.setDepth(IsometricHelper.getIsoDepth(lp.gx, lp.gy, 6));

      // Warm radial glow on ground
      const glow = this.add.circle(pos.x, pos.y, 18, 0xffc857, 0.16);
      glow.setDepth(IsometricHelper.getIsoDepth(lp.gx, lp.gy, 1));
    });

    // 4. Moored Wooden Country Boat (Kettuvallam) along canal (gx: 18, gy: 12)
    const boatPos = IsometricHelper.gridToScreen(18, 12);
    const boat = this.add.sprite(boatPos.x, boatPos.y - 8, 'prop_kettuvallam');
    boat.setDepth(IsometricHelper.getIsoDepth(18, 12, 6));

    // Gentle boat water rocking
    this.tweens.add({
      targets: boat,
      y: boatPos.y - 11,
      angle: { from: -0.8, to: 0.8 },
      duration: 2400,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // 5. Trees & Flora (Bespoke Japanese-Kerala Plants)
    const trees = [
      // Kerala Coconut Palms along canal & paddy
      { gx: 16, gy: 5, key: 'tree_coconut_palm', yOff: 40 },
      { gx: 16, gy: 8, key: 'tree_coconut_palm', yOff: 40 },
      { gx: 16, gy: 14, key: 'tree_coconut_palm', yOff: 40 },
      { gx: 16, gy: 18, key: 'tree_coconut_palm', yOff: 40 },
      { gx: 3, gy: 15, key: 'tree_coconut_palm', yOff: 40 },
      // Ancient Flowering Sakura by Sacred Torii Grove
      { gx: 11, gy: 2, key: 'tree_sakura', yOff: 35 },
      { gx: 7, gy: 2, key: 'tree_sakura', yOff: 35 },
      // Bamboo Stems in Northwest grove
      { gx: 3, gy: 3, key: 'tree_bamboo', yOff: 30 },
      { gx: 4, gy: 2, key: 'tree_bamboo', yOff: 30 },
      { gx: 3, gy: 7, key: 'tree_bamboo', yOff: 30 },
      // Tropical Banana Plants near homestead
      { gx: 10, gy: 7, key: 'tree_banana', yOff: 22 },
      { gx: 15, gy: 7, key: 'tree_banana', yOff: 22 },
      { gx: 14, gy: 10, key: 'tree_banana', yOff: 22 },
      // Fragrant Jasmine Bushes
      { gx: 11, gy: 9, key: 'bush_jasmine', yOff: 10 },
      { gx: 14, gy: 14, key: 'bush_jasmine', yOff: 10 },
    ];

    trees.forEach((t, idx) => {
      const pos = IsometricHelper.gridToScreen(t.gx, t.gy);
      const sprite = this.add.sprite(pos.x, pos.y - t.yOff, t.key);
      sprite.setDepth(IsometricHelper.getIsoDepth(t.gx, t.gy, 15));
      this.treeSprites.push(sprite);

      // Organic wind swaying
      this.tweens.add({
        targets: sprite,
        angle: { from: -1.4, to: 1.4 },
        duration: 2600 + (idx % 5) * 350,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    });
  }

  private setupCampfire(): void {
    const pos = IsometricHelper.gridToScreen(13, 14);
    this.campfireSprite = this.add.sprite(pos.x, pos.y - 10, 'prop_campfire_0');
    this.campfireSprite.setDepth(IsometricHelper.getIsoDepth(13, 14, 8));

    // Warm radial glow on the earth
    this.campfireLight = this.add.circle(pos.x, pos.y, 44, 0xff9900, 0.22);
    this.campfireLight.setDepth(IsometricHelper.getIsoDepth(13, 14, 1));

    // Campfire bench
    const benchPos = IsometricHelper.gridToScreen(13, 15);
    const bench = this.add.sprite(benchPos.x, benchPos.y - 8, 'prop_bench');
    bench.setDepth(IsometricHelper.getIsoDepth(13, 15, 6));

    // Rising glowing ember particles
    this.campfireParticles = this.add.particles(pos.x, pos.y - 12, 'fx_spark', {
      speedY: { min: -35, max: -12 },
      speedX: { min: -8, max: 8 },
      scale: { start: 0.8, end: 0.1 },
      alpha: { start: 1, end: 0 },
      lifespan: 1400,
      frequency: 200,
      blendMode: Phaser.BlendModes.ADD,
    });
    this.campfireParticles.setDepth(IsometricHelper.getIsoDepth(13, 14, 9));
  }

  private setupWildlife(): void {
    // 1. Swimming Koi Fish in the Canal
    const koiPositions = [
      { gx: 18, gy: 8, speed: 18 },
      { gx: 19, gy: 14, speed: 14 },
      { gx: 18, gy: 18, speed: 20 },
    ];
    koiPositions.forEach((k) => {
      const pos = IsometricHelper.gridToScreen(k.gx, k.gy);
      const sprite = this.add.sprite(pos.x, pos.y, 'wildlife_koi');
      sprite.setDepth(IsometricHelper.getIsoDepth(k.gx, k.gy, 1));
      sprite.setAlpha(0.8);

      this.swimmingKoi.push({
        sprite,
        gx: k.gx,
        gy: k.gy,
        speed: k.speed,
        direction: Math.random() > 0.5 ? 1 : -1,
      });

      this.tweens.add({
        targets: sprite,
        y: pos.y + 3,
        duration: 1200,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    });

    // 2. White River Heron at canal stepping stone
    const heronPos = IsometricHelper.gridToScreen(17, 16);
    const heron = this.add.sprite(heronPos.x, heronPos.y - 14, 'wildlife_heron');
    heron.setDepth(IsometricHelper.getIsoDepth(17, 16, 8));

    // 3. Swallowtail Butterflies over tropical garden
    const bfPositions = [
      { gx: 11, gy: 8 },
      { gx: 6, gy: 5 },
    ];
    bfPositions.forEach((bp) => {
      const pos = IsometricHelper.gridToScreen(bp.gx, bp.gy);
      const bf = this.add.sprite(pos.x, pos.y - 14, 'wildlife_butterfly');
      bf.setDepth(IsometricHelper.getIsoDepth(bp.gx, bp.gy, 18));
      this.butterflies.push(bf);

      this.tweens.add({
        targets: bf,
        x: pos.x + 22,
        y: pos.y - 18,
        duration: 2200,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    });
  }

  private setupForageables(): void {
    const spots: Omit<ForageSpot, 'collected'>[] = [
      {
        id: 'forage_bamboo',
        title: 'Wild Bamboo Shoot (竹の子)',
        subtitle: 'Harvested from the tranquil bamboo grove',
        category: 'nature',
        icon: '🎍',
        gx: 3,
        gy: 4,
        description: 'Tender sweet bamboo shoot pushing through the rich loam. In Japanese countryside cooking, boiled gently with rice water.',
      },
      {
        id: 'forage_ribbon',
        title: 'Sacred Torii Ribbon (注連縄の紙垂)',
        subtitle: 'Blessed at the Shinto-Kerala Grove',
        category: 'folklore',
        icon: '⛩️',
        gx: 9,
        gy: 3,
        description: 'A folded white washi paper ribbon tied with mountain coconut coir string, offering peaceful protection to passing travellers.',
      },
      {
        id: 'forage_banana',
        title: 'Golden Nendran Banana (നേന്ത്രപ്പഴം)',
        subtitle: 'Grown along the fertile homestead hedge',
        category: 'nature',
        icon: '🍌',
        gx: 14,
        gy: 11,
        description: 'A ripe, naturally sweet highland banana from the family garden. Shared on banana leaf plates during rural festivals.',
      },
      {
        id: 'forage_jasmine',
        title: 'Fragrant Wild Jasmine (മുല്ലപ്പൂവ്)',
        subtitle: 'Gathered near the canal stepping stone',
        category: 'nature',
        icon: '🌸',
        gx: 15,
        gy: 15,
        description: 'Tiny white night-blooming jasmine flowers with an intoxicating sweet fragrance that drifts over the water after dusk.',
      },
    ];

    spots.forEach((s) => {
      const pos = IsometricHelper.gridToScreen(s.gx, s.gy);
      const sprite = this.add.sprite(pos.x, pos.y - 6, 'prop_keepsake_node');
      sprite.setDepth(IsometricHelper.getIsoDepth(s.gx, s.gy, 6));

      this.tweens.add({
        targets: sprite,
        y: pos.y - 12,
        alpha: 0.82,
        duration: 1500,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });

      this.forageSpots.push({ ...s, sprite, collected: false });
    });
  }

  private setupNPCs(): void {
    const configs: {
      id: string;
      name: string;
      gx: number;
      gy: number;
      textureKey: string;
      wanderRadius: number;
      getDialogue: (timeOfDay: TimeOfDay) => DialogueNode;
    }[] = [
      {
        id: 'ren',
        name: 'Master Ren',
        gx: 6,
        gy: 5,
        textureKey: 'npc_ren',
        wanderRadius: 2,
        getDialogue: (timeOfDay) => {
          let text = 'In the city, I thought speed proved mastery. Here in the valley, watching the morning mist rise over the paddy, I discovered that clarity only comes when you put the brush down and listen.';
          if (timeOfDay === 'dusk' || timeOfDay === 'night') {
            text = 'The crickets are tuning their instruments for the night. Sit beside the lantern; the best thoughts always arrive when you stop chasing them.';
          } else if (timeOfDay === 'dawn') {
            text = 'Early dawn carries the sharp scent of mountain pine and wet earth. A single cup of green tea before speaking clears the mind completely.';
          }
          return {
            speaker: 'Master Ren (蓮先生)',
            title: 'Former City Calligrapher',
            portraitAtlas: 'npc',
            portraitFrame: 'npc_ren',
            text,
            options: [
              {
                label: 'How do you spend your days here?',
                nextText: 'Brewing green tea with fresh mountain rainwater, sweeping the veranda, and watching the clouds crawl across the hills.',
              },
            ],
          };
        },
      },
      {
        id: 'devaki',
        name: 'Devaki Amma',
        gx: 12,
        gy: 7,
        textureKey: 'npc_devaki',
        wanderRadius: 1,
        getDialogue: (timeOfDay) => {
          let text = 'Have you drank warm spiced ginger tea today, child? The monsoon rain is coming over the canal. Sit on the porch; nobody has to hurry anywhere when the rain sings.';
          if (timeOfDay === 'night' || timeOfDay === 'dusk') {
            text = 'I just lit the brass Nilavilakku lamp inside the courtyard. Come sit on the wooden bench; the night jasmine is filling the whole breeze with sweetness.';
          }
          return {
            speaker: 'Devaki Amma (ദേവകി അമ്മ)',
            title: 'Tharavadu Matriarch',
            portraitAtlas: 'npc',
            portraitFrame: 'npc_devaki',
            text,
            options: [
              {
                label: 'The house is so peaceful.',
                nextText: 'These clay tiles have kept generations dry through a hundred monsoons. Rest your tired mind here.',
              },
            ],
          };
        },
      },
      {
        id: 'appu',
        name: 'Appu',
        gx: 16,
        gy: 10,
        textureKey: 'npc_appu',
        wanderRadius: 2,
        getDialogue: (timeOfDay) => {
          let text = 'Look there! A blue-winged kingfisher just dived near the boat. If you sit very still by the campfire tonight, the golden fireflies will land right beside you!';
          if (timeOfDay === 'night') {
            text = 'See the stars reflected in the water canal? The old boatmen say each reflection is a secret wish being rested in the deep.';
          }
          return {
            speaker: 'Appu (അപ്പു)',
            title: 'Canal Wanderer',
            portraitAtlas: 'npc',
            portraitFrame: 'npc_appu',
            text,
            options: [
              {
                label: 'Can I fish here?',
                nextText: 'Press F near the canal bank! We never rush the fish; watching the float dance on the water is the whole joy.',
              },
            ],
          };
        },
      },
      {
        id: 'kuro',
        name: 'Kuro the Cat',
        gx: 11,
        gy: 8,
        textureKey: 'wildlife_cat',
        wanderRadius: 2,
        getDialogue: () => ({
          speaker: 'Kuro (クロ)',
          title: 'Veranda Sleeping Cat',
          portraitAtlas: 'npc',
          portraitFrame: 'wildlife_cat',
          text: '*Purrs deeply and stretches tiny paws towards a warm patch of sunlight on the veranda.* Purrrrr...',
          options: [
            {
              label: 'Gently pet Kuro behind the ears.',
              nextText: 'Kuro closes eyes and rolls onto side, entirely untroubled by pull requests or deadlines.',
            },
          ],
        }),
      },
    ];

    configs.forEach((cfg) => {
      const pos = IsometricHelper.gridToScreen(cfg.gx, cfg.gy);
      const shadow = this.add.ellipse(pos.x, pos.y + 2, 16, 8, 0x000000, 0.22);
      shadow.setDepth(IsometricHelper.getIsoDepth(cfg.gx, cfg.gy, 1));

      const sprite = this.add.sprite(pos.x, pos.y - 14, cfg.textureKey);
      sprite.setDepth(IsometricHelper.getIsoDepth(cfg.gx, cfg.gy, 10));

      this.npcs.push({
        id: cfg.id,
        name: cfg.name,
        sprite,
        shadow,
        gx: cfg.gx,
        gy: cfg.gy,
        homeGx: cfg.gx,
        homeGy: cfg.gy,
        wanderRadius: cfg.wanderRadius,
        isMoving: false,
        timer: Math.random() * 3000 + 2000,
        getDialogue: cfg.getDialogue,
      });
    });
  }

  private setupPlayer(): void {
    const startPos = IsometricHelper.gridToScreen(this.playerGx, this.playerGy);
    this.playerShadow = this.add.ellipse(startPos.x, startPos.y + 2, 18, 9, 0x000000, 0.25);
    this.playerShadow.setDepth(IsometricHelper.getIsoDepth(this.playerGx, this.playerGy, 1));

    this.playerSprite = this.physics.add.sprite(startPos.x, startPos.y - 14, 'player_walk_dr_0');
    this.playerSprite.setSize(18, 16);
    this.playerSprite.setOffset(7, 18);
    this.playerSprite.setDepth(IsometricHelper.getIsoDepth(this.playerGx, this.playerGy, 12));
  }

  private setupLightingAndWeather(): void {
    // Ambient Day/Night overlay
    this.ambientTintOverlay = this.add.rectangle(0, 0, 2400, 1800, 0x141c18, 0.12);
    this.ambientTintOverlay.setOrigin(0);
    this.ambientTintOverlay.setDepth(9999);
    this.ambientTintOverlay.setScrollFactor(0);

    // Falling Sakura Petals / Weather
    this.weatherParticles = this.add.particles(0, 0, 'fx_petal', {
      x: { min: -200, max: 2000 },
      y: -50,
      lifespan: 7000,
      speedY: { min: 45, max: 80 },
      speedX: { min: 25, max: 55 },
      scale: { start: 0.9, end: 0.4 },
      rotate: { min: 0, max: 360 },
      frequency: 240,
      blendMode: Phaser.BlendModes.NORMAL,
    });
    this.weatherParticles.setDepth(5000);

    // Evening Fireflies
    this.fireflyParticles = this.add.particles(0, 0, 'fx_firefly', {
      x: { min: 700, max: 1300 },
      y: { min: 200, max: 600 },
      lifespan: 4000,
      speedY: { min: -8, max: 8 },
      speedX: { min: -12, max: 12 },
      scale: { start: 0.7, end: 0.2 },
      frequency: 600,
      blendMode: Phaser.BlendModes.ADD,
    });
    this.fireflyParticles.setDepth(4900);
  }

  public getCurrentWeather(): WeatherType {
    return this.currentWeather;
  }

  public setWeatherState(weather: WeatherType, season: Season): void {
    this.currentWeather = weather;
    this.currentSeason = season;

    if (!this.weatherParticles || !this.ambientTintOverlay) return;

    if (weather === 'gentle_rain') {
      this.ambientTintOverlay.setFillStyle(0x182c30, 0.22);
      this.weatherParticles.setTexture('fx_rain');
      this.weatherParticles.setConfig({
        speedY: { min: 140, max: 220 },
        speedX: { min: -15, max: -5 },
        scale: { start: 0.8, end: 0.4 },
        frequency: 80,
        lifespan: 3500,
      });
      soundscapes.setWeather('gentle_rain');
    } else {
      this.ambientTintOverlay.setFillStyle(0x141c18, 0.10);
      this.weatherParticles.setTexture('fx_petal');
      this.weatherParticles.setConfig({
        speedY: { min: 45, max: 80 },
        speedX: { min: 25, max: 55 },
        scale: { start: 0.9, end: 0.4 },
        frequency: 240,
        lifespan: 7000,
      });
      soundscapes.setWeather('sakura_breeze');
    }
  }

  private setupBridgeListeners(): void {
    gameBridge.on('player_sit', (p: any) => {
      this.isSitting = true;
      this.isFishing = false;
      this.playerSprite.setVelocity(0, 0);
      this.playerSprite.setTexture('player_sit');
      soundscapes.playSitSound();

      if (p?.locationName?.toLowerCase().includes('campfire')) {
        this.playerSprite.setTint(0xffd4aa);
      }
    });

    gameBridge.on('player_stand', () => {
      this.isSitting = false;
      this.playerSprite.clearTint();
      this.playerSprite.setTexture(`player_walk_${this.playerFacing}_0`);
    });

    gameBridge.on('fishing_start', () => {
      this.startFishing();
    });

    gameBridge.on('fishing_end', () => {
      this.stopFishing();
    });

    gameBridge.on('campfire_toggle', (p: { isLit: boolean }) => {
      if (this.campfireSprite && this.campfireLight && this.campfireParticles) {
        this.campfireSprite.setVisible(p.isLit);
        this.campfireLight.setVisible(p.isLit);
        this.campfireParticles.setActive(p.isLit).setVisible(p.isLit);
      }
    });

    gameBridge.on('weather_change', (payload: any) => {
      if (payload?.weather) {
        this.setWeatherState(payload.weather, this.currentSeason);
      }
    });

    gameBridge.on('time_tick', (payload: any) => {
      if (payload?.season) this.currentSeason = payload.season;
      if (payload?.timeOfDay) this.currentTimeOfDay = payload.timeOfDay;
    });

    gameBridge.on('camera_zoom', (p: { zoom: number }) => {
      if (p?.zoom) this.cameras.main.setZoom(p.zoom);
    });

    gameBridge.on('reduced_motion', (p: { enabled: boolean }) => {
      if (this.weatherParticles) {
        if (p?.enabled) this.weatherParticles.pause();
        else this.weatherParticles.resume();
      }
    });

    gameBridge.on('virtual_joystick', (p: { dx: number; dy: number }) => {
      this.virtualMovement = { dx: p?.dx || 0, dy: p?.dy || 0 };
    });
  }

  private startFishing(): void {
    if (this.isFishing) return;
    const grid = IsometricHelper.screenToGrid(this.playerSprite.x, this.playerSprite.y);
    const gx = Math.round(grid.gx);

    if (gx < 14 || gx > 18) {
      gameBridge.emit('interaction_prompt', { text: 'Walk closer to the canal bank to fish peacefully', key: 'WASD' });
      return;
    }

    this.isFishing = true;
    this.isSitting = false;
    this.playerSprite.setVelocity(0, 0);
    this.playerSprite.setTexture('player_fish');

    const bobberPos = IsometricHelper.gridToScreen(19, Math.round(grid.gy));
    this.fishingBobber = this.add.circle(bobberPos.x, bobberPos.y, 4, 0xd34e36);
    this.fishingBobber.setDepth(IsometricHelper.getIsoDepth(19, Math.round(grid.gy), 3));

    soundscapes.playFootstep('water');

    this.tweens.add({
      targets: this.fishingBobber,
      y: bobberPos.y + 4,
      duration: 1100,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    this.fishingTimer = 3500 + Math.random() * 2000;
  }

  private stopFishing(): void {
    if (!this.isFishing) return;
    this.isFishing = false;
    this.playerSprite.setTexture(`player_walk_${this.playerFacing}_0`);
    if (this.fishingBobber) {
      this.fishingBobber.destroy();
      this.fishingBobber = undefined;
    }
  }

  private async reelInCatch(): Promise<void> {
    this.stopFishing();
    soundscapes.playGentleChime(4);

    const catches = [
      {
        id: `catch_${Date.now()}`,
        title: 'Silver River Mussel (പുഴ മുത്തുച്ചിപ്പി)',
        subtitle: 'Found resting peacefully in the canal silt',
        category: 'nature' as const,
        icon: '🐚',
        description: 'An ancient freshwater bivalve shell with an iridescent mother-of-pearl sheen. Handed back to the clear water.',
      },
      {
        id: `catch_${Date.now()}`,
        title: 'Polished Canal Jade (കനാൽ കല്ല്)',
        subtitle: 'Rolled smooth by decades of mountain tides',
        category: 'nature' as const,
        icon: '🪨',
        description: 'A soothing sea-green river stone, perfectly rounded and cool to the touch.',
      },
      {
        id: `catch_${Date.now()}`,
        title: 'Golden River Carp (സുവർണ്ണ മത്സ്യം)',
        subtitle: 'A gentle visitor from the backwater depths',
        category: 'nature' as const,
        icon: '🐟',
        description: 'A peaceful golden carp that fluttered its fins curiously, received a blessing, and swam smoothly back home.',
      },
      {
        id: `catch_${Date.now()}`,
        title: 'Blooming Blue Lotus (നീലത്താമര)',
        subtitle: 'Floating gently past the moored boat',
        category: 'nature' as const,
        icon: '🪷',
        description: 'A radiant wild water lily petal carrying sweet river dew.',
      },
    ];

    const item = catches[Math.floor(Math.random() * catches.length)];

    await addDiscovery({
      id: item.id,
      title: item.title,
      subtitle: item.subtitle,
      category: item.category,
      discoveredAt: new Date().toISOString(),
      description: item.description,
      icon: item.icon,
    });

    await addJournalEntry({
      id: `journal_${Date.now()}`,
      title: item.title,
      createdAt: new Date().toISOString(),
      season: this.currentSeason,
      weather: this.currentWeather,
      timeOfDay: this.currentTimeOfDay,
      text: item.description,
      source: 'valley_chronicle',
    });

    gameBridge.notifyDiscovery({
      id: item.id,
      title: item.title,
      subtitle: item.subtitle,
      category: item.category,
      discoveredAt: new Date().toISOString(),
      description: item.description,
      icon: item.icon,
    });
  }

  private updateNPCWandering(delta: number): void {
    this.npcs.forEach((npc) => {
      if (npc.isMoving) return;

      npc.timer -= delta;
      if (npc.timer <= 0) {
        npc.timer = Math.random() * 4500 + 3500;

        if (Math.random() > 0.45) {
          const dx = Phaser.Math.Between(-npc.wanderRadius, npc.wanderRadius);
          const dy = Phaser.Math.Between(-npc.wanderRadius, npc.wanderRadius);
          const targetGx = Phaser.Math.Clamp(npc.homeGx + dx, 2, 16);
          const targetGy = Phaser.Math.Clamp(npc.homeGy + dy, 2, 22);

          if (targetGx !== npc.gx || targetGy !== npc.gy) {
            const dest = IsometricHelper.gridToScreen(targetGx, targetGy);
            npc.isMoving = true;
            npc.sprite.setFlipX(targetGx < npc.gx);

            this.tweens.add({
              targets: [npc.sprite, npc.shadow],
              x: dest.x,
              y: (target: any) => (target === npc.shadow ? dest.y + 2 : dest.y - 14),
              duration: 1800,
              ease: 'Linear',
              onUpdate: () => {
                npc.sprite.setDepth(npc.sprite.y + 12);
                npc.shadow.setDepth(npc.shadow.y);
              },
              onComplete: () => {
                npc.gx = targetGx;
                npc.gy = targetGy;
                npc.isMoving = false;
              },
            });
          }
        } else {
          npc.sprite.setFlipX(!npc.sprite.flipX);
        }
      }
    });
  }

  private updateWildlife(delta: number): void {
    // Fish swimming back and forth in canal
    this.swimmingKoi.forEach((f) => {
      f.gx += (f.direction * (f.speed * delta)) / 10000;
      if (f.gx > 22) {
        f.direction = -1;
        f.sprite.setFlipX(true);
      } else if (f.gx < 17) {
        f.direction = 1;
        f.sprite.setFlipX(false);
      }
      const pos = IsometricHelper.gridToScreen(f.gx, f.gy);
      f.sprite.setPosition(pos.x, pos.y);
    });
  }

  private updatePrompts(): void {
    let prompt: { text: string; key: string } | null = null;

    // 1. Check nearby forageables
    for (const spot of this.forageSpots) {
      if (spot.collected || !spot.sprite) continue;
      const dist = Phaser.Math.Distance.Between(this.playerSprite.x, this.playerSprite.y, spot.sprite.x, spot.sprite.y);
      if (dist < 42) {
        prompt = { text: `Collect ${spot.title}`, key: 'E' };
        break;
      }
    }

    // 2. Check nearby NPCs
    if (!prompt) {
      for (const npc of this.npcs) {
        const dist = Phaser.Math.Distance.Between(this.playerSprite.x, this.playerSprite.y, npc.sprite.x, npc.sprite.y);
        if (dist < 50) {
          prompt = { text: `Talk with ${npc.name}`, key: 'E' };
          break;
        }
      }
    }

    // 3. Check nearby seats
    if (!prompt) {
      for (const seat of this.interactiveSeats) {
        const seatPos = IsometricHelper.gridToScreen(seat.gx, seat.gy);
        const dist = Phaser.Math.Distance.Between(this.playerSprite.x, this.playerSprite.y, seatPos.x, seatPos.y);
        if (dist < 48) {
          prompt = { text: `Sit at ${seat.name}`, key: 'E' };
          break;
        }
      }
    }

    // 4. Check canal fishing readiness
    if (!prompt && !this.isFishing) {
      const grid = IsometricHelper.screenToGrid(this.playerSprite.x, this.playerSprite.y);
      const gx = Math.round(grid.gx);
      if (gx >= 14 && gx <= 18) {
        prompt = { text: 'Cast Line into Canal', key: 'F' };
      }
    }

    const currentPromptKey = prompt ? `${prompt.key}:${prompt.text}` : '';
    if (currentPromptKey !== this.lastPromptText) {
      this.lastPromptText = currentPromptKey;
      gameBridge.emit('interaction_prompt', prompt);
    }
  }

  update(_time: number, delta: number): void {
    // Campfire animated flickering
    if (this.campfireSprite && this.campfireSprite.visible) {
      this.campfireFrameTimer += delta;
      if (this.campfireFrameTimer > 180) {
        this.campfireFrameTimer = 0;
        this.campfireFrame = (this.campfireFrame + 1) % 3;
        this.campfireSprite.setTexture(`prop_campfire_${this.campfireFrame}`);
      }
    }

    // Wildlife & NPC behaviors
    this.updateNPCWandering(delta);
    this.updateWildlife(delta);

    // Fishing timer logic
    if (this.isFishing) {
      this.fishingTimer -= delta;
      if (this.fishingTimer <= 0) {
        this.reelInCatch();
      }

      const cancelKey = this.wasdKeys?.W?.isDown || this.wasdKeys?.A?.isDown || this.wasdKeys?.S?.isDown || this.wasdKeys?.D?.isDown;
      if (cancelKey) {
        this.stopFishing();
        gameBridge.emit('fishing_end');
      }
      return;
    }

    if (this.isSitting) {
      const standKey = this.wasdKeys?.W?.isDown || this.wasdKeys?.A?.isDown || this.wasdKeys?.S?.isDown || this.wasdKeys?.D?.isDown;
      if (standKey) {
        gameBridge.notifySitting(false);
      }
      return;
    }

    let vx = 0;
    let vy = 0;
    const isRunning = this.wasdKeys?.SHIFT?.isDown || this.cursors?.shift?.isDown;
    const speed = isRunning ? 140 : 85;

    const left = this.wasdKeys?.A?.isDown || this.cursors?.left?.isDown;
    const right = this.wasdKeys?.D?.isDown || this.cursors?.right?.isDown;
    const up = this.wasdKeys?.W?.isDown || this.cursors?.up?.isDown;
    const down = this.wasdKeys?.S?.isDown || this.cursors?.down?.isDown;

    if (left) {
      vx -= speed * 1.1;
      vy += speed * 0.55;
      this.playerFacing = 'ul';
    } else if (right) {
      vx += speed * 1.1;
      vy -= speed * 0.55;
      this.playerFacing = 'dr';
    }

    if (up) {
      vx -= speed * 1.1;
      vy -= speed * 0.55;
      this.playerFacing = 'ur';
    } else if (down) {
      vx += speed * 1.1;
      vy += speed * 0.55;
      this.playerFacing = 'dl';
    }

    // Touch / Mobile virtual joystick input
    if (this.virtualMovement.dx !== 0 || this.virtualMovement.dy !== 0) {
      vx = this.virtualMovement.dx * speed;
      vy = this.virtualMovement.dy * speed;
      if (Math.abs(vx) > Math.abs(vy)) {
        this.playerFacing = vx < 0 ? 'ul' : 'dr';
      } else {
        this.playerFacing = vy < 0 ? 'ur' : 'dl';
      }
    }

    this.playerSprite.setVelocity(vx, vy);

    // Dynamic Walk Cycle Animation
    const isMoving = vx !== 0 || vy !== 0;
    if (isMoving) {
      this.walkAnimTimer += delta;
      if (this.walkAnimTimer > (isRunning ? 120 : 180)) {
        this.walkAnimTimer = 0;
        this.walkAnimFrame = (this.walkAnimFrame + 1) % 4;
        this.playerSprite.setTexture(`player_walk_${this.playerFacing}_${this.walkAnimFrame}`);
      }
    } else {
      this.playerSprite.setTexture(`player_walk_${this.playerFacing}_0`);
    }

    this.playerShadow.setPosition(this.playerSprite.x, this.playerSprite.y + 16);
    this.playerShadow.setDepth(this.playerSprite.y);

    if (isMoving) {
      this.stepTimer += delta;
      if (this.stepTimer > (isRunning ? 260 : 380)) {
        this.stepTimer = 0;

        const grid = IsometricHelper.screenToGrid(this.playerSprite.x, this.playerSprite.y);
        const gx = Math.round(grid.gx);
        const gy = Math.round(grid.gy);

        let terrain: 'grass' | 'wood' | 'stone' | 'water' = 'grass';
        if (gy === 9 && gx >= 16 && gx <= 18) {
          terrain = 'wood'; // Wooden bridge
        } else if (gx >= 17) {
          terrain = 'water';
        } else if (
          (gx >= 5 && gx <= 13 && gy === 5) ||
          (gx === 9 && gy >= 2 && gy <= 5) ||
          (gx === 13 && gy >= 5 && gy <= 13)
        ) {
          terrain = 'stone'; // Cobblestone path
        }

        soundscapes.playFootstep(terrain);
      }
    }

    this.playerSprite.setDepth(this.playerSprite.y + 16);

    // Update dynamic interaction prompts
    this.updatePrompts();

    // Key inputs
    const interactPressed = Phaser.Input.Keyboard.JustDown(this.wasdKeys?.E) || Phaser.Input.Keyboard.JustDown(this.cursors?.space);
    const sitPressed = Phaser.Input.Keyboard.JustDown(this.wasdKeys?.C);
    const fishPressed = Phaser.Input.Keyboard.JustDown(this.wasdKeys?.F);

    if (sitPressed) {
      gameBridge.notifySitting(true, 'Soft Grass Verge');
      return;
    }

    if (fishPressed) {
      this.startFishing();
      return;
    }

    if (interactPressed) {
      // 1. Forage spot check
      for (const spot of this.forageSpots) {
        if (spot.collected || !spot.sprite) continue;
        const dist = Phaser.Math.Distance.Between(this.playerSprite.x, this.playerSprite.y, spot.sprite.x, spot.sprite.y);
        if (dist < 42) {
          spot.collected = true;
          this.tweens.add({
            targets: spot.sprite,
            scaleX: 0,
            scaleY: 0,
            alpha: 0,
            duration: 350,
            onComplete: () => spot.sprite?.destroy(),
          });

          soundscapes.playGentleChime(2);

          addDiscovery({
            id: spot.id,
            title: spot.title,
            subtitle: spot.subtitle,
            category: spot.category,
            discoveredAt: new Date().toISOString(),
            description: spot.description,
            icon: spot.icon,
          });

          addJournalEntry({
            id: `journal_${Date.now()}`,
            title: spot.title,
            createdAt: new Date().toISOString(),
            season: this.currentSeason,
            weather: this.currentWeather,
            timeOfDay: this.currentTimeOfDay,
            text: spot.description,
            source: 'personal',
          });

          gameBridge.notifyDiscovery({
            id: spot.id,
            title: spot.title,
            subtitle: spot.subtitle,
            category: spot.category,
            discoveredAt: new Date().toISOString(),
            description: spot.description,
            icon: spot.icon,
          });
          return;
        }
      }

      // 2. Check nearby seats
      for (const seat of this.interactiveSeats) {
        const seatPos = IsometricHelper.gridToScreen(seat.gx, seat.gy);
        const dist = Phaser.Math.Distance.Between(this.playerSprite.x, this.playerSprite.y, seatPos.x, seatPos.y);
        if (dist < 48) {
          gameBridge.notifySitting(true, seat.name);
          return;
        }
      }

      // 3. Check nearby NPCs
      for (const npc of this.npcs) {
        const dist = Phaser.Math.Distance.Between(this.playerSprite.x, this.playerSprite.y, npc.sprite.x, npc.sprite.y);
        if (dist < 50) {
          gameBridge.emit('dialogue_open', npc.getDialogue(this.currentTimeOfDay));
          return;
        }
      }
    }
  }
}
