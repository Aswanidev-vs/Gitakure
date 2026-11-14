import Phaser from 'phaser';
import { Player } from '@/game/entities/Player';
import { NPC } from '@/game/entities/NPC';
import { Wildlife } from '@/game/entities/Wildlife';
import { FarmSystem } from '@/game/systems/FarmSystem';
import { gameActions, gameStore } from '@/state/game-store';
import { soundEngine } from '@/audio/procedural-audio';

export class ValleyScene extends Phaser.Scene {
  private player!: Player;
  private farmSystem!: FarmSystem;
  private npcs: NPC[] = [];
  private wildlifeList: Wildlife[] = [];
  private timeOverlay!: Phaser.GameObjects.Rectangle;
  private timeAccumulator = 0;

  constructor() {
    super({ key: 'ValleyScene' });
  }

  create(): void {
    const mapWidth = 1600;
    const mapHeight = 1200;

    this.physics.world.setBounds(0, 0, mapWidth, mapHeight);

    // 1. Lush Countryside Grass Ground
    for (let x = 0; x < mapWidth; x += 70) {
      for (let y = 0; y < mapHeight; y += 70) {
        const frame = (x + y) % 140 === 0 ? 'rpg_terrain_p01_r00_c00' : 'rpg_terrain_p01_r00_c01';
        const tile = this.add.sprite(x + 35, y + 35, 'rpg_terrain', frame);
        tile.setDisplaySize(72, 72);
        tile.setDepth(0);
      }
    }

    // 2. Sparkling Mountain River (East side, x: 1100 to 1220)
    for (let y = 0; y < mapHeight; y += 32) {
      for (let x = 1120; x <= 1260; x += 32) {
        const waterTile = this.add.sprite(x, y + 16, 'water_environmental', 'water_environmental_p00_r04_c00');
        waterTile.setDisplaySize(34, 34);
        waterTile.setDepth(2);
        waterTile.setTint(0x4a8594);
      }
    }

    // Wooden Bridge across the river (y: 560 to 640)
    for (let x = 1110; x <= 1270; x += 32) {
      const bridgeTile = this.add.sprite(x, 600, 'buildings_interiors', 'buildings_interiors_p00_r01_c02');
      bridgeTile.setDisplaySize(36, 48);
      bridgeTile.setDepth(3);
    }

    // 3. Dirt pathways linking Village, Terraces, Shrine, and River
    const hPaths: { x1: number; x2: number; y: number }[] = [
      { x1: 240, x2: 1120, y: 600 },
    ];
    const vPaths: { x: number; y1: number; y2: number }[] = [
      { x: 720, y1: 200, y2: 600 },
      { x: 300, y1: 280, y2: 600 },
    ];

    hPaths.forEach((p) => {
      for (let px = p.x1; px <= p.x2; px += 24) {
        const pt = this.add.sprite(px, p.y, 'rpg_terrain', 'rpg_terrain_p01_r01_c01');
        pt.setDisplaySize(28, 28);
        pt.setDepth(1);
        pt.setTint(0xb59975);
      }
    });

    vPaths.forEach((p) => {
      for (let py = p.y1; py <= p.y2; py += 24) {
        const pt = this.add.sprite(p.x, py, 'rpg_terrain', 'rpg_terrain_p01_r01_c01');
        pt.setDisplaySize(28, 28);
        pt.setDepth(1);
        pt.setTint(0xb59975);
      }
    });

    // 4. Village Buildings & Shrines
    // Shinto Torii Shrine (North Center: x 720, y 180)
    const shrineBuilding = this.add.sprite(720, 160, 'buildings_interiors', 'buildings_interiors_p00_r01_c00');
    shrineBuilding.setDisplaySize(128, 96);
    shrineBuilding.setDepth(160);

    const toriiGate = this.add.sprite(720, 240, 'buildings_interiors', 'buildings_interiors_p00_r01_c01');
    toriiGate.setDisplaySize(96, 72);
    toriiGate.setDepth(240);
    toriiGate.setTint(0xd6533c); // Torii Vermilion

    // Village Elder's Tea House (Northwest: x 280, y 250)
    const teaHouse = this.add.sprite(280, 240, 'buildings_interiors', 'buildings_interiors_p00_r02_c00');
    teaHouse.setDisplaySize(130, 92);
    teaHouse.setDepth(240);

    // Gardener's Cottage (West: x 220, y 680)
    const cottage = this.add.sprite(220, 680, 'buildings_interiors', 'buildings_interiors_p00_r02_c01');
    cottage.setDisplaySize(110, 84);
    cottage.setDepth(680);

    // River Fishing Shack (East by the bridge: x 1060, y 550)
    const fishingShack = this.add.sprite(1060, 540, 'buildings_interiors', 'buildings_interiors_p00_r02_c02');
    fishingShack.setDisplaySize(96, 78);
    fishingShack.setDepth(540);

    // 5. Trees & Bamboo Groves
    const treePositions = [
      // Cherry Blossom grove near Shrine
      { x: 620, y: 150, frame: 'trees_and_vegetation_p01_r00_c00', tint: 0xffd9e4 },
      { x: 820, y: 150, frame: 'trees_and_vegetation_p01_r00_c00', tint: 0xffd9e4 },
      { x: 670, y: 280, frame: 'trees_and_vegetation_p01_r00_c04', tint: 0xffc4d8 },
      { x: 770, y: 280, frame: 'trees_and_vegetation_p01_r00_c04', tint: 0xffc4d8 },
      // Bamboo forest in South
      { x: 380, y: 920, frame: 'trees_and_vegetation_p01_r02_c00' },
      { x: 440, y: 950, frame: 'trees_and_vegetation_p01_r02_c00' },
      { x: 500, y: 910, frame: 'trees_and_vegetation_p01_r02_c00' },
      { x: 560, y: 960, frame: 'trees_and_vegetation_p01_r02_c00' },
      { x: 620, y: 920, frame: 'trees_and_vegetation_p01_r02_c00' },
      // Pines around borders
      { x: 120, y: 140, frame: 'trees_and_vegetation_p01_r00_c02' },
      { x: 440, y: 120, frame: 'trees_and_vegetation_p01_r00_c02' },
      { x: 1000, y: 160, frame: 'trees_and_vegetation_p01_r00_c02' },
      { x: 1380, y: 320, frame: 'trees_and_vegetation_p01_r00_c02' },
      { x: 1420, y: 720, frame: 'trees_and_vegetation_p01_r00_c02' },
      { x: 920, y: 940, frame: 'trees_and_vegetation_p01_r00_c02' },
    ];

    treePositions.forEach((pos) => {
      const tree = this.add.sprite(pos.x, pos.y, 'trees_and_vegetation', pos.frame);
      tree.setDisplaySize(90, 84);
      tree.setDepth(pos.y + 40);
      if (pos.tint) tree.setTint(pos.tint);
    });

    // 6. Interactive Farm Terraces (Center Valley: x 560 to 880, y 520 to 760)
    this.farmSystem = new FarmSystem(this);
    for (let tx = 18; tx <= 26; tx += 2) {
      for (let ty = 18; ty <= 24; ty += 2) {
        this.farmSystem.registerPlot(tx, ty);
      }
    }

    // 7. Player Character (Starts at crossroads)
    this.player = new Player(this, 620, 600);

    // Camera follow with soft deadzone. Zoom 1 shows the valley at the
    // native pixel density of the 72px tiles and ~70px player.
    this.cameras.main.setBounds(0, 0, mapWidth, mapHeight);
    this.cameras.main.startFollow(this.player, true, 0.12, 0.12);
    this.cameras.main.setZoom(1.0);
    this.cameras.main.roundPixels = true;

    // 8. NPCs
    this.setupNPCs();

    // 9. Wildlife Entities
    this.setupWildlife();

    // 10. Ambient Day / Night Overlay
    this.timeOverlay = this.add.rectangle(0, 0, mapWidth, mapHeight, 0x141c18, 0.0);
    this.timeOverlay.setOrigin(0);
    this.timeOverlay.setDepth(9999);
    this.timeOverlay.setScrollFactor(0); // stick to screen

    // 11. Weather Particles (Sakura petals drifting)
    this.setupWeatherParticles();

    // 12. Input Handler: Clicking ground to till/water/plant directly
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      // Convert screen click to world coords
      const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
      const tileX = Math.floor(worldPoint.x / 32);
      const tileY = Math.floor(worldPoint.y / 32);

      // Check if near player
      const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, worldPoint.x, worldPoint.y);
      if (dist < 90) {
        this.farmSystem.interactWithPlot(tileX, tileY);
      }
    });

    // Start calm background chime generator
    soundEngine.startAmbientValley();
  }

  private setupNPCs(): void {
    const npcConfigs = [
      {
        id: 'ren',
        name: 'Elder Ren',
        title: 'Village Elder & Historian',
        x: 320,
        y: 290,
        atlas: 'npc',
        frame: 'npc_p01_r00_c00',
        dialogue: {
          speaker: 'Elder Ren (蓮長老)',
          title: 'Keeper of Valley History',
          portraitAtlas: 'npc',
          portraitFrame: 'npc_p01_r00_c00',
          text: 'Welcome, traveler. Gitakure is a valley that remembers. Here, nothing rushes. The bamboo bends with the wind and the river always reaches the sea. Tend your rice, drink fresh spring water, and let your spirit settle.',
          options: [
            {
              label: 'How does farming work here?',
              nextText: 'Use your Iron Hoe on the soil plots in the center valley. Once tilled, sow your radish or rice seeds, then sprinkle them with the bamboo watering can. With each passing day, they flourish.',
            },
            {
              label: 'Tell me of the Forgotten Shrine.',
              nextText: 'To the north stands the Torii gate. There dwells the sacred Kitsune Spirit. When developers share their work and rest with the shrine, the valley receives gentle seasonal blessings.',
            },
          ],
        },
      },
      {
        id: 'aoi',
        name: 'Gardener Aoi',
        title: 'Valley Herbalist',
        x: 520,
        y: 560,
        atlas: 'npc',
        frame: 'npc_p01_r00_c01',
        dialogue: {
          speaker: 'Aoi (葵)',
          title: 'Valley Herbalist & Florist',
          portraitAtlas: 'npc',
          portraitFrame: 'npc_p01_r00_c01',
          text: 'The morning mist feels so refreshing today! If you ever need advice on planting sweet Daikon or fragrant Mountain Tea, I am always here among the terraces. Remember: wet soil looks dark and rich!',
          options: [
            {
              label: 'Can I have some gardening advice?',
              nextText: 'Always water your crops after sowing! When rain falls from the heavens, all your plots drink naturally without extra work.',
            },
          ],
        },
      },
      {
        id: 'kaito',
        name: 'Fisher Kaito',
        title: 'River Angler',
        x: 1080,
        y: 630,
        atlas: 'npc',
        frame: 'npc_p01_r00_c02',
        dialogue: {
          speaker: 'Kaito (海斗)',
          title: 'River Angler',
          portraitAtlas: 'npc',
          portraitFrame: 'npc_p01_r00_c02',
          text: 'Ah, the sound of the stream! Look closely into the clear water — golden sweetfish (Ayu) swim against the current. Take a deep breath of the mountain air with me.',
          options: [
            {
              label: 'What fish inhabit this river?',
              nextText: 'Char, Ayu, and the legendary Starlight Koi that only appears when developers enjoy true peace of mind.',
            },
          ],
        },
      },
      {
        id: 'kitsune',
        name: 'Kitsune Spirit',
        title: 'Guardian of Gitakure Shrine',
        x: 720,
        y: 200,
        atlas: 'npc',
        frame: 'npc_p01_r00_c03',
        dialogue: {
          speaker: 'Kitsune Spirit (白狐の神使)',
          title: 'Sanctuary Guardian',
          portraitAtlas: 'npc',
          portraitFrame: 'npc_p01_r00_c03',
          text: 'Mortals often race against imaginary hourglasses. But here in Gitakure, we honor both your creative sparks and your deep, restorative slumber. Come present your offerings at the Sanctuary.',
          options: [
            {
              label: 'Open GitHub Sanctuary',
              action: () => {
                gameActions.toggleModal('shrine');
              },
            },
          ],
        },
      },
    ];

    npcConfigs.forEach((cfg) => {
      const npc = new NPC(this, cfg);
      this.npcs.push(npc);
    });
  }

  private setupWildlife(): void {
    const wildlifeCoords = [
      { x: 500, y: 920, frame: 'wildlife_sprite_p01_r00_c01', species: 'hare' },
      { x: 540, y: 960, frame: 'wildlife_sprite_p01_r00_c01', species: 'hare' },
      { x: 680, y: 180, frame: 'wildlife_sprite_p01_r00_c00', species: 'fox' },
      { x: 760, y: 190, frame: 'wildlife_sprite_p01_r00_c00', species: 'fox' },
      { x: 1140, y: 480, frame: 'wildlife_sprite_p01_r00_c03', species: 'crane' },
      { x: 1200, y: 780, frame: 'wildlife_sprite_p01_r00_c03', species: 'crane' },
      { x: 880, y: 880, frame: 'wildlife_sprite_p01_r00_c02', species: 'deer' },
    ];

    wildlifeCoords.forEach((w) => {
      const animal = new Wildlife(this, w.x, w.y, w.frame, w.species);
      this.wildlifeList.push(animal);
    });
  }

  private setupWeatherParticles(): void {
    // Falling cherry blossom petals
    const particles = this.add.particles(0, 0, 'environmental_effects', {
      frame: 'environmental_effects_p01_r00_c00',
      x: { min: 0, max: 1600 },
      y: 0,
      lifespan: 8000,
      speedY: { min: 30, max: 70 },
      speedX: { min: 20, max: 50 },
      scale: { start: 0.8, end: 0.4 },
      rotate: { min: 0, max: 360 },
      frequency: 250,
      tint: 0xffd1dc,
      blendMode: Phaser.BlendModes.NORMAL,
    });
    particles.setDepth(5000);
  }

  update(_time: number, delta: number): void {
    // 1. Update Player
    const playerState = this.player.updatePlayer(delta);

    // 2. Check NPC Proximities
    this.npcs.forEach((npc) => {
      npc.checkPlayerProximity(playerState.x, playerState.y, playerState.interactPressed);
    });

    // 3. Update Wildlife (with player position so they can flee)
    this.wildlifeList.forEach((animal) => {
      animal.updateWildlife(delta, playerState.x, playerState.y);
    });

    // 4. Advance In-Game Time gently
    this.timeAccumulator += delta;
    if (this.timeAccumulator >= 2000) {
      this.timeAccumulator = 0;
      const prevHour = gameStore.timeState.hour;
      gameActions.advanceTime(10); // 10 in-game minutes every 2s

      // Dawn growth: trigger on crossing into hour 6 (robust to tick granularity).
      const nowHour = gameStore.timeState.hour;
      const nowMinute = gameStore.timeState.minute;
      const crossedDawn = prevHour < 6 && nowHour >= 6;
      const hitDawn = nowHour === 6 && nowMinute === 0;
      if (crossedDawn || hitDawn) {
        this.farmSystem.growAllCrops(1);
        gameActions.addToast('Dawn rises. Crops bathe in early morning dew.', 'nature');
      }

      this.updateDayNightOverlay();
    }
  }

  private updateDayNightOverlay(): void {
    const { timeOfDay } = gameStore.timeState;
    if (timeOfDay === 'morning') {
      this.timeOverlay.setFillStyle(0xfff7e6, 0.04);
    } else if (timeOfDay === 'noon') {
      this.timeOverlay.setFillStyle(0xffffff, 0.0);
    } else if (timeOfDay === 'dusk') {
      this.timeOverlay.setFillStyle(0xa25547, 0.22); // Warm Japanese twilight
    } else if (timeOfDay === 'night') {
      this.timeOverlay.setFillStyle(0x0e1b26, 0.58); // Deep starry midnight
    } else {
      // Dawn
      this.timeOverlay.setFillStyle(0xffd5b3, 0.12);
    }
  }
}
