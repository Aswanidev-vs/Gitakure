import Phaser from 'phaser';
import { IsometricHelper } from '@/game/camera/isometric';
import { gameBridge } from '@/bridge/game-bridge';
import { soundscapes } from '@/game/audio/soundscapes';
import type { DialogueNode } from '@/types';

interface InteractiveSeat {
  gx: number;
  gy: number;
  name: string;
  type: 'campfire' | 'veranda' | 'riverside';
}

export class IsoValleyScene extends Phaser.Scene {
  private playerSprite!: Phaser.Physics.Arcade.Sprite;
  private playerGx = 10;
  private playerGy = 10;
  private isSitting = false;

  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasdKeys!: {
    W: Phaser.Input.Keyboard.Key;
    A: Phaser.Input.Keyboard.Key;
    S: Phaser.Input.Keyboard.Key;
    D: Phaser.Input.Keyboard.Key;
    SHIFT: Phaser.Input.Keyboard.Key;
    E: Phaser.Input.Keyboard.Key;
    C: Phaser.Input.Keyboard.Key;
  };

  private campfireSprite?: Phaser.GameObjects.Sprite;
  private campfireLight?: Phaser.GameObjects.Arc;

  private ambientTintOverlay!: Phaser.GameObjects.Rectangle;
  private weatherParticles?: Phaser.GameObjects.Particles.ParticleEmitter;
  private fireflyParticles?: Phaser.GameObjects.Particles.ParticleEmitter;

  private npcs: { sprite: Phaser.GameObjects.Sprite; gx: number; gy: number; dialogue: DialogueNode }[] = [];
  private interactiveSeats: InteractiveSeat[] = [
    { gx: 12, gy: 8, name: 'Riverside Campfire Log', type: 'campfire' },
    { gx: 6, gy: 4, name: 'Tea Porch Veranda', type: 'veranda' },
    { gx: 14, gy: 14, name: 'Canal Stepping Stone', type: 'riverside' },
  ];

  private stepTimer = 0;

  constructor() {
    super({ key: 'IsoValleyScene' });
  }

  create(): void {
    // 1. Build Isometric Ground Terrain
    this.buildTerrain();

    // 2. Build Japanese-Kerala Architecture & Flora
    this.buildWorldProps();

    // 3. Campfire by the backwater canal
    this.setupCampfire();

    // 4. Village NPCs with Barakamon Rural Spirit
    this.setupNPCs();

    // 5. Player in Isometric Space
    this.setupPlayer();

    // 6. Camera Follow
    this.cameras.main.startFollow(this.playerSprite, true, 0.08, 0.08);
    this.cameras.main.setZoom(1.35);
    this.cameras.main.roundPixels = true;

    // 7. Ambient Lighting & Weather Overlays
    this.setupLightingAndWeather();

    // 8. Bridge Event Listeners
    this.setupBridgeListeners();

    // 9. Input Setup
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
      }) as typeof this.wasdKeys;
    }

    // Start soundscapes
    soundscapes.init();
  }

  private buildTerrain(): void {
    // Grid: 24 x 24 isometric diamond tiles
    for (let gx = 0; gx < 24; gx++) {
      for (let gy = 0; gy < 24; gy++) {
        const { x, y } = IsometricHelper.gridToScreen(gx, gy);
        const depth = IsometricHelper.getIsoDepth(gx, gy, 0);

        // East canal (gx >= 16) represents Kerala backwaters
        if (gx >= 16) {
          const waterTile = this.add.sprite(x, y, 'water_environmental', 'water_environmental_p00_r04_c00');
          waterTile.setDisplaySize(68, 36);
          waterTile.setDepth(depth);
          waterTile.setTint(0x3e7482); // Backwater teal
        } else {
          // Lush earth / paddy terrain
          const frame = (gx + gy) % 2 === 0 ? 'rpg_terrain_p01_r00_c00' : 'rpg_terrain_p01_r00_c01';
          const ground = this.add.sprite(x, y, 'rpg_terrain', frame);
          ground.setDisplaySize(66, 34);
          ground.setDepth(depth);
          ground.setTint(0x8fa372); // Calming tea green
        }
      }
    }

    // Wooden canal bridge connecting banks at gy = 10, gx = 15 to 17
    for (let gx = 15; gx <= 18; gx++) {
      const { x, y } = IsometricHelper.gridToScreen(gx, 10);
      const bridge = this.add.sprite(x, y - 8, 'buildings_interiors', 'buildings_interiors_p00_r01_c02');
      bridge.setDisplaySize(48, 36);
      bridge.setDepth(IsometricHelper.getIsoDepth(gx, 10, 4));
    }
  }

  private buildWorldProps(): void {
    // 1. Japanese Wooden Tea House (Northwest: gx: 5, gy: 3)
    const teaHousePos = IsometricHelper.gridToScreen(5, 3);
    const teaHouse = this.add.sprite(teaHousePos.x, teaHousePos.y - 20, 'buildings_interiors', 'buildings_interiors_p00_r02_c00');
    teaHouse.setDisplaySize(140, 100);
    teaHouse.setDepth(IsometricHelper.getIsoDepth(5, 3, 20));

    // 2. Kerala Traditional Tharavadu House (Northeast by canal: gx: 12, gy: 3)
    const tharavaduPos = IsometricHelper.gridToScreen(12, 3);
    const tharavadu = this.add.sprite(tharavaduPos.x, tharavaduPos.y - 25, 'buildings_interiors', 'buildings_interiors_p00_r01_c00');
    tharavadu.setDisplaySize(150, 110);
    tharavadu.setDepth(IsometricHelper.getIsoDepth(12, 3, 20));
    tharavadu.setTint(0xdfba9e); // Clay tile roof warmth

    // 3. Shinto-Kerala Sacred Grove Shrine (North: gx: 8, gy: 1)
    const toriiPos = IsometricHelper.gridToScreen(8, 1);
    const torii = this.add.sprite(toriiPos.x, toriiPos.y - 20, 'buildings_interiors', 'buildings_interiors_p00_r01_c01');
    torii.setDisplaySize(90, 75);
    torii.setDepth(IsometricHelper.getIsoDepth(8, 1, 25));
    torii.setTint(0xd34e36);

    // 4. Wooden Country Boat (Kettuvallam) moored along canal (gx: 17, gy: 12)
    const boatPos = IsometricHelper.gridToScreen(17, 12);
    const boat = this.add.sprite(boatPos.x, boatPos.y - 6, 'buildings_interiors', 'buildings_interiors_p00_r02_c03');
    boat.setDisplaySize(80, 48);
    boat.setDepth(IsometricHelper.getIsoDepth(17, 12, 5));
    boat.setTint(0x8a6245);

    // Gentle boat rocking tween
    this.tweens.add({
      targets: boat,
      y: boatPos.y - 9,
      duration: 2200,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // 5. Coconut Palms & Banana Plants (Kerala) + Bamboo & Cherry Blossoms (Japanese)
    const flora = [
      // Coconut Palms by the canal
      { gx: 15, gy: 5, frame: 'trees_and_vegetation_p01_r00_c04', scale: 1.2, tint: 0x98b870 },
      { gx: 15, gy: 9, frame: 'trees_and_vegetation_p01_r00_c04', scale: 1.3, tint: 0x98b870 },
      { gx: 15, gy: 15, frame: 'trees_and_vegetation_p01_r00_c04', scale: 1.2, tint: 0x98b870 },
      // Sakura trees near shrine
      { gx: 7, gy: 1, frame: 'trees_and_vegetation_p01_r00_c00', scale: 1.1, tint: 0xffd9e6 },
      { gx: 9, gy: 1, frame: 'trees_and_vegetation_p01_r00_c00', scale: 1.1, tint: 0xffd9e6 },
      // Bamboo grove in South
      { gx: 3, gy: 18, frame: 'trees_and_vegetation_p01_r02_c00', scale: 1.0 },
      { gx: 5, gy: 19, frame: 'trees_and_vegetation_p01_r02_c00', scale: 1.0 },
      { gx: 7, gy: 20, frame: 'trees_and_vegetation_p01_r02_c00', scale: 1.0 },
      // Banana plants around homestead
      { gx: 4, gy: 7, frame: 'trees_and_vegetation_p01_r02_c01', scale: 0.9 },
      { gx: 11, gy: 6, frame: 'trees_and_vegetation_p01_r02_c01', scale: 0.9 },
    ];

    flora.forEach((f) => {
      const pos = IsometricHelper.gridToScreen(f.gx, f.gy);
      const sprite = this.add.sprite(pos.x, pos.y - 30, 'trees_and_vegetation', f.frame);
      sprite.setScale(f.scale);
      sprite.setDepth(IsometricHelper.getIsoDepth(f.gx, f.gy, 15));
      if (f.tint) sprite.setTint(f.tint);
    });
  }

  private setupCampfire(): void {
    const pos = IsometricHelper.gridToScreen(12, 8);
    this.campfireSprite = this.add.sprite(pos.x, pos.y - 10, 'environmental_effects', 'environmental_effects_p01_r00_c01');
    this.campfireSprite.setDisplaySize(32, 32);
    this.campfireSprite.setDepth(IsometricHelper.getIsoDepth(12, 8, 8));
    this.campfireSprite.setTint(0xff7a33);

    // Warm radial glow on the ground
    this.campfireLight = this.add.circle(pos.x, pos.y, 48, 0xffaa44, 0.25);
    this.campfireLight.setDepth(IsometricHelper.getIsoDepth(12, 8, 1));

    // Flame flicker animation
    this.tweens.add({
      targets: [this.campfireSprite, this.campfireLight],
      scaleX: 1.08,
      scaleY: 1.15,
      alpha: 0.85,
      duration: 380,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  private setupNPCs(): void {
    const villagers: {
      gx: number;
      gy: number;
      atlas: string;
      frame: string;
      dialogue: DialogueNode;
    }[] = [
      {
        gx: 6,
        gy: 5,
        atlas: 'npc',
        frame: 'npc_p01_r00_c00',
        dialogue: {
          speaker: 'Master Ren (蓮先生)',
          title: 'Former City Calligrapher',
          portraitAtlas: 'npc',
          portraitFrame: 'npc_p01_r00_c00',
          text: 'In the city, I thought speed proved mastery. Here in the valley, watching the morning mist rise over the paddy, I discovered that clarity only comes when you put the brush down and listen.',
          options: [
            {
              label: 'How do you spend your days here?',
              nextText: 'Brewing green tea with fresh mountain rainwater, sweeping the veranda, and watching the clouds crawl across the hills.',
            },
          ],
        },
      },
      {
        gx: 13,
        gy: 4,
        atlas: 'npc',
        frame: 'npc_p01_r00_c01',
        dialogue: {
          speaker: 'Devaki Amma (ദേവകി അമ്മ)',
          title: 'Tharavadu Matriarch',
          portraitAtlas: 'npc',
          portraitFrame: 'npc_p01_r00_c01',
          text: 'Have you drank warm spiced ginger tea today, child? The monsoon rain is coming over the canal. Sit on the porch; nobody has to hurry anywhere when the rain sings.',
          options: [
            {
              label: 'The house is so peaceful.',
              nextText: 'These clay tiles have kept generations dry through a hundred monsoons. Rest your tired mind here.',
            },
          ],
        },
      },
      {
        gx: 14,
        gy: 11,
        atlas: 'npc',
        frame: 'npc_p01_r00_c02',
        dialogue: {
          speaker: 'Appu (അപ്പു)',
          title: 'Canal Wanderer',
          portraitAtlas: 'npc',
          portraitFrame: 'npc_p01_r00_c02',
          text: 'Look there! A blue-winged kingfisher just dived near the boat. If you sit very still by the campfire tonight, the golden fireflies will land right beside you!',
          options: [
            {
              label: 'Can I sit by the campfire?',
              nextText: 'Of course! Press C or click Sit. Listening to the sparks crackle while the river gurgles is the best feeling in the world.',
            },
          ],
        },
      },
    ];

    villagers.forEach((v) => {
      const pos = IsometricHelper.gridToScreen(v.gx, v.gy);
      const sprite = this.add.sprite(pos.x, pos.y - 16, v.atlas, v.frame);
      sprite.setDisplaySize(32, 42);
      sprite.setDepth(IsometricHelper.getIsoDepth(v.gx, v.gy, 10));

      this.npcs.push({
        sprite,
        gx: v.gx,
        gy: v.gy,
        dialogue: v.dialogue,
      });
    });
  }

  private setupPlayer(): void {
    const startPos = IsometricHelper.gridToScreen(this.playerGx, this.playerGy);
    this.playerSprite = this.physics.add.sprite(startPos.x, startPos.y - 16, 'pixel_character_sheets', 'pixel_character_sheets_p02_r00_c00');
    this.playerSprite.setDisplaySize(32, 42);
    this.playerSprite.setSize(18, 16);
    this.playerSprite.setOffset(0, 10);
    this.playerSprite.setDepth(IsometricHelper.getIsoDepth(this.playerGx, this.playerGy, 12));
  }

  private setupLightingAndWeather(): void {
    // Screen tint overlay for day/dusk/night/monsoon
    this.ambientTintOverlay = this.add.rectangle(0, 0, 2400, 1800, 0x141c18, 0.15);
    this.ambientTintOverlay.setOrigin(0);
    this.ambientTintOverlay.setDepth(9999);
    this.ambientTintOverlay.setScrollFactor(0);

    // Falling Sakura & Monsoon Rain particles
    this.weatherParticles = this.add.particles(0, 0, 'environmental_effects', {
      frame: 'environmental_effects_p01_r00_c00',
      x: { min: -200, max: 2000 },
      y: -50,
      lifespan: 7000,
      speedY: { min: 45, max: 85 },
      speedX: { min: 25, max: 55 },
      scale: { start: 0.7, end: 0.35 },
      rotate: { min: 0, max: 360 },
      frequency: 280,
      tint: 0xffd5e0,
      blendMode: Phaser.BlendModes.NORMAL,
    });
    this.weatherParticles.setDepth(5000);

    // Evening Fireflies near water & campfire
    this.fireflyParticles = this.add.particles(0, 0, 'environmental_effects', {
      frame: 'environmental_effects_p01_r00_c02',
      x: { min: 700, max: 1300 },
      y: { min: 200, max: 600 },
      lifespan: 4000,
      speedY: { min: -10, max: 10 },
      speedX: { min: -15, max: 15 },
      scale: { start: 0.5, end: 0.1 },
      frequency: 600,
      tint: 0xffe680,
      blendMode: Phaser.BlendModes.ADD,
    });
    this.fireflyParticles.setDepth(4900);
  }

  private setupBridgeListeners(): void {
    gameBridge.on('player_sit', () => {
      this.isSitting = true;
      this.playerSprite.setVelocity(0, 0);
      this.playerSprite.setFrame('pixel_character_sheets_p02_r00_c03'); // Rest pose
      soundscapes.playSitSound();
    });

    gameBridge.on('player_stand', () => {
      this.isSitting = false;
    });

    gameBridge.on('campfire_toggle', (p: { isLit: boolean }) => {
      if (this.campfireSprite && this.campfireLight) {
        this.campfireSprite.setVisible(p.isLit);
        this.campfireLight.setVisible(p.isLit);
      }
    });
  }

  update(_time: number, delta: number): void {
    if (this.isSitting) {
      // If sitting, pressing movement key stands up gently
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

    // Isometric 4-way movement
    const left = this.wasdKeys?.A?.isDown || this.cursors?.left?.isDown;
    const right = this.wasdKeys?.D?.isDown || this.cursors?.right?.isDown;
    const up = this.wasdKeys?.W?.isDown || this.cursors?.up?.isDown;
    const down = this.wasdKeys?.S?.isDown || this.cursors?.down?.isDown;

    if (left) {
      vx -= speed * 1.1;
      vy += speed * 0.55;
      this.playerSprite.setFlipX(true);
      this.playerSprite.setFrame('pixel_character_sheets_p02_r00_c01');
    } else if (right) {
      vx += speed * 1.1;
      vy -= speed * 0.55;
      this.playerSprite.setFlipX(false);
      this.playerSprite.setFrame('pixel_character_sheets_p02_r00_c01');
    }

    if (up) {
      vx -= speed * 1.1;
      vy -= speed * 0.55;
      this.playerSprite.setFrame('pixel_character_sheets_p02_r00_c02');
    } else if (down) {
      vx += speed * 1.1;
      vy += speed * 0.55;
      this.playerSprite.setFrame('pixel_character_sheets_p02_r00_c00');
    }

    this.playerSprite.setVelocity(vx, vy);

    // Footsteps
    const isMoving = vx !== 0 || vy !== 0;
    if (isMoving) {
      this.stepTimer += delta;
      if (this.stepTimer > (isRunning ? 280 : 420)) {
        this.stepTimer = 0;
        soundscapes.playFootstep();
      }
    }

    // Dynamic depth sorting based on current screen Y
    this.playerSprite.setDepth(this.playerSprite.y + 16);

    // Check interaction key (E or Space)
    const interactPressed = Phaser.Input.Keyboard.JustDown(this.wasdKeys?.E) || Phaser.Input.Keyboard.JustDown(this.cursors?.space);
    const sitPressed = Phaser.Input.Keyboard.JustDown(this.wasdKeys?.C);

    if (sitPressed) {
      gameBridge.notifySitting(true, 'Soft Grass Verge');
      return;
    }

    if (interactPressed) {
      // 1. Check nearby seats
      for (const seat of this.interactiveSeats) {
        const seatPos = IsometricHelper.gridToScreen(seat.gx, seat.gy);
        const dist = Phaser.Math.Distance.Between(this.playerSprite.x, this.playerSprite.y, seatPos.x, seatPos.y);
        if (dist < 48) {
          gameBridge.notifySitting(true, seat.name);
          return;
        }
      }

      // 2. Check nearby NPCs
      for (const npc of this.npcs) {
        const dist = Phaser.Math.Distance.Between(this.playerSprite.x, this.playerSprite.y, npc.sprite.x, npc.sprite.y);
        if (dist < 50) {
          gameBridge.emit('dialogue_open', npc.dialogue);
          return;
        }
      }
    }
  }
}
