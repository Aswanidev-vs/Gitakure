import Phaser from 'phaser';

/**
 * Gitakure Bespoke Pixel Art Factory
 * Generates 100% cohesive, handcrafted 16-bit isometric pixel art directly into Phaser textures.
 * Blends Japanese and Kerala countryside architecture, flora, and characters with unified palette.
 */
export class PixelArtFactory {
  // Cohesive Japanese-Kerala Countryside Palette
  public static readonly PALETTE = {
    // Meadows & Vegetation
    grassDark: '#365427',
    grassMid: '#4d7537',
    grassLight: '#6d9c4e',
    grassHighlight: '#90be6c',
    grassFlowerPink: '#f4978e',
    grassFlowerYellow: '#f9dcc4',

    // Kerala Backwaters & Canals
    waterDeep: '#183842',
    waterMid: '#245260',
    waterSurface: '#377382',
    waterHighlight: '#62a8b8',
    waterFoam: '#d4f1f4',
    lilyGreen: '#3b7d44',
    lotusBlue: '#70a9a1',

    // Soils & Roads
    soilDark: '#3e271a',
    soilMid: '#5d3b27',
    soilLight: '#805338',
    stoneDark: '#33383b',
    stoneMid: '#4f585d',
    stoneLight: '#76838a',
    stoneHighlight: '#aab8bf',

    // Traditional Architecture (Teak timber & terracotta tiles)
    clayRoofDark: '#5a1f18',
    clayRoofMid: '#8e3427',
    clayRoofLight: '#bf4c3b',
    clayRoofRidge: '#e07260',
    woodDark: '#2a1a10',
    woodMid: '#472d1c',
    woodLight: '#6e482f',
    woodHighlight: '#946543',
    washiPaper: '#f2ede2',
    washiShadow: '#cfc4b2',
    toriiRed: '#b72218',
    toriiBright: '#db3225',

    // Flora
    palmTrunk: '#4f4035',
    palmFrondDark: '#28471c',
    palmFrondLight: '#4d7d35',
    sakuraBark: '#3d2e2c',
    sakuraPetalDark: '#b5536b',
    sakuraPetalMid: '#e07a93',
    sakuraPetalLight: '#f7b0c3',
    sakuraPetalWhite: '#fff0f3',
    bambooDark: '#2b572c',
    bambooLight: '#52964a',
    bananaLeafDark: '#32662c',
    bananaLeafLight: '#59a64a',
    bananaFruit: '#e8c547',

    // Characters & Accents
    strawHat: '#d6b265',
    strawShadow: '#9e7e38',
    indigoBlue: '#22384a',
    indigoLight: '#395c78',
    kasavuGold: '#cfa746',
    skinTone: '#eec7a2',
    skinShadow: '#c99e7b',
    catBlack: '#1d2123',
    catEyes: '#aacc33',
    fireOrange: '#f3722c',
    fireYellow: '#f9c74f',
    charcoal: '#1a1918',
  };

  /**
   * Generates all required game textures in Phaser's TextureManager
   */
  public static generateAll(scene: Phaser.Scene): void {
    const tm = scene.textures;

    // 1. Isometric Ground Tiles (64x40 px with 8px soil bevel)
    this.createTileGrass(tm);
    this.createTileGrassFlowers(tm);
    this.createTileWater(tm);
    this.createTileWaterLily(tm);
    this.createTilePaddy(tm);
    this.createTileStonePath(tm);
    this.createTileSoilPath(tm);
    this.createTileWoodDeck(tm);

    // 2. Japanese & Kerala Architecture Props
    this.createTharavaduHomestead(tm);
    this.createTeaPavilion(tm);
    this.createToriiShrine(tm);
    this.createCountryBoat(tm);
    this.createWoodenBridge(tm);
    this.createStoneLantern(tm);
    this.createGardenBench(tm);
    this.createCampfireFrames(tm);

    // 3. Countryside Trees & Flora
    this.createCoconutPalm(tm);
    this.createSakuraTree(tm);
    this.createBananaPlant(tm);
    this.createBambooGrove(tm);
    this.createJasmineBush(tm);

    // 4. Characters (Player & NPCs)
    this.createPlayerSprites(tm);
    this.createNPCSprites(tm);

    // 5. Wildlife (Heron, Fish, Cat, Butterfly)
    this.createWildlifeSprites(tm);

    // 6. Particles & Item Icons
    this.createParticleAndItemTextures(tm);
  }

  // -------------------------------------------------------------
  // ISOMETRIC TILES (64 x 40 px: 64x32 diamond + 8px 3D bevel)
  // -------------------------------------------------------------

  private static drawIsoDiamond(
    ctx: CanvasRenderingContext2D,
    topFill: string,
    leftBevel: string,
    rightBevel: string,
    bevelHeight = 8
  ): void {
    const w = 64;
    const h = 32;
    const midX = w / 2;
    const midY = h / 2;

    // 1. Left Bevel
    ctx.fillStyle = leftBevel;
    ctx.beginPath();
    ctx.moveTo(0, midY);
    ctx.lineTo(midX, h);
    ctx.lineTo(midX, h + bevelHeight);
    ctx.lineTo(0, midY + bevelHeight);
    ctx.closePath();
    ctx.fill();

    // 2. Right Bevel
    ctx.fillStyle = rightBevel;
    ctx.beginPath();
    ctx.moveTo(midX, h);
    ctx.lineTo(w, midY);
    ctx.lineTo(w, midY + bevelHeight);
    ctx.lineTo(midX, h + bevelHeight);
    ctx.closePath();
    ctx.fill();

    // 3. Diamond Top Surface
    ctx.fillStyle = topFill;
    ctx.beginPath();
    ctx.moveTo(midX, 0);
    ctx.lineTo(w, midY);
    ctx.lineTo(midX, h);
    ctx.lineTo(0, midY);
    ctx.closePath();
    ctx.fill();

    // Subtle crisp bevel outline
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.18)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(midX, 0);
    ctx.lineTo(w, midY);
    ctx.lineTo(midX, h);
    ctx.lineTo(0, midY);
    ctx.closePath();
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(midX, h);
    ctx.lineTo(midX, h + bevelHeight);
    ctx.stroke();
  }

  private static createTileGrass(tm: Phaser.Textures.TextureManager): void {
    if (tm.exists('tile_grass')) return;
    const canvas = tm.createCanvas('tile_grass', 64, 40);
    if (!canvas) return;
    const ctx = canvas.getContext();

    this.drawIsoDiamond(ctx, this.PALETTE.grassMid, this.PALETTE.soilMid, this.PALETTE.soilDark);

    // Subtle grass blade pixel specks
    ctx.fillStyle = this.PALETTE.grassHighlight;
    const grassDots = [
      [22, 10], [42, 12], [28, 20], [36, 16], [16, 18], [48, 18], [30, 8], [34, 24]
    ];
    grassDots.forEach(([x, y]) => {
      ctx.fillRect(x, y, 2, 2);
      ctx.fillStyle = this.PALETTE.grassLight;
      ctx.fillRect(x, y - 1, 1, 1);
    });

    canvas.refresh();
  }

  private static createTileGrassFlowers(tm: Phaser.Textures.TextureManager): void {
    if (tm.exists('tile_grass_flowers')) return;
    const canvas = tm.createCanvas('tile_grass_flowers', 64, 40);
    if (!canvas) return;
    const ctx = canvas.getContext();

    this.drawIsoDiamond(ctx, this.PALETTE.grassMid, this.PALETTE.soilMid, this.PALETTE.soilDark);

    // Grass texture
    ctx.fillStyle = this.PALETTE.grassHighlight;
    ctx.fillRect(20, 14, 2, 2);
    ctx.fillRect(44, 18, 2, 2);

    // Pink and yellow wildflowers
    const flowers = [
      { x: 30, y: 12, col: this.PALETTE.grassFlowerPink },
      { x: 34, y: 22, col: this.PALETTE.grassFlowerPink },
      { x: 22, y: 18, col: this.PALETTE.grassFlowerYellow },
      { x: 42, y: 14, col: this.PALETTE.grassFlowerYellow },
    ];
    flowers.forEach((f) => {
      ctx.fillStyle = f.col;
      ctx.fillRect(f.x, f.y, 2, 2);
      ctx.fillRect(f.x - 1, f.y, 1, 1);
      ctx.fillRect(f.x + 2, f.y, 1, 1);
      ctx.fillRect(f.x, f.y - 1, 1, 1);
      ctx.fillStyle = '#fff';
      ctx.fillRect(f.x, f.y, 1, 1);
    });

    canvas.refresh();
  }

  private static createTileWater(tm: Phaser.Textures.TextureManager): void {
    if (tm.exists('tile_water')) return;
    const canvas = tm.createCanvas('tile_water', 64, 40);
    if (!canvas) return;
    const ctx = canvas.getContext();

    this.drawIsoDiamond(ctx, this.PALETTE.waterMid, this.PALETTE.waterDeep, 'rgba(15, 35, 40, 0.9)');

    // Flowing water wave lines
    ctx.fillStyle = this.PALETTE.waterSurface;
    ctx.fillRect(24, 8, 16, 2);
    ctx.fillRect(16, 16, 18, 2);
    ctx.fillRect(36, 20, 14, 2);

    // Sun reflection sparkles
    ctx.fillStyle = this.PALETTE.waterHighlight;
    ctx.fillRect(28, 9, 8, 1);
    ctx.fillRect(22, 17, 7, 1);
    ctx.fillRect(38, 21, 6, 1);

    ctx.fillStyle = this.PALETTE.waterFoam;
    ctx.fillRect(31, 9, 2, 1);
    ctx.fillRect(25, 17, 2, 1);

    canvas.refresh();
  }

  private static createTileWaterLily(tm: Phaser.Textures.TextureManager): void {
    if (tm.exists('tile_water_lily')) return;
    const canvas = tm.createCanvas('tile_water_lily', 64, 40);
    if (!canvas) return;
    const ctx = canvas.getContext();

    this.drawIsoDiamond(ctx, this.PALETTE.waterMid, this.PALETTE.waterDeep, 'rgba(15, 35, 40, 0.9)');

    // Shimmer
    ctx.fillStyle = this.PALETTE.waterHighlight;
    ctx.fillRect(20, 10, 10, 1);
    ctx.fillRect(34, 24, 8, 1);

    // Round green lily pad with slit
    ctx.fillStyle = this.PALETTE.lilyGreen;
    ctx.beginPath();
    ctx.ellipse(32, 16, 8, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = this.PALETTE.waterMid;
    ctx.fillRect(32, 16, 4, 1);

    // Blue lotus flower bloom
    ctx.fillStyle = this.PALETTE.lotusBlue;
    ctx.fillRect(30, 13, 3, 3);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(31, 14, 1, 1);

    canvas.refresh();
  }

  private static createTilePaddy(tm: Phaser.Textures.TextureManager): void {
    if (tm.exists('tile_paddy')) return;
    const canvas = tm.createCanvas('tile_paddy', 64, 40);
    if (!canvas) return;
    const ctx = canvas.getContext();

    // Saturated wet mud with thin water sheen
    this.drawIsoDiamond(ctx, '#3f4e34', '#2c2217', '#1f1810');

    // Water puddle reflection in paddy
    ctx.fillStyle = '#4d6954';
    ctx.beginPath();
    ctx.ellipse(32, 16, 20, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    // Sown baby rice sprouts (bright spring shoots)
    ctx.fillStyle = '#8ce833';
    const sprouts = [
      [24, 12], [32, 10], [40, 12],
      [20, 16], [28, 16], [36, 16], [44, 16],
      [24, 20], [32, 22], [40, 20]
    ];
    sprouts.forEach(([x, y]) => {
      ctx.fillRect(x, y - 2, 2, 4);
      ctx.fillRect(x - 1, y - 3, 1, 2);
      ctx.fillRect(x + 2, y - 3, 1, 2);
    });

    canvas.refresh();
  }

  private static createTileStonePath(tm: Phaser.Textures.TextureManager): void {
    if (tm.exists('tile_stone_path')) return;
    const canvas = tm.createCanvas('tile_stone_path', 64, 40);
    if (!canvas) return;
    const ctx = canvas.getContext();

    this.drawIsoDiamond(ctx, this.PALETTE.stoneDark, '#1f2224', '#151718');

    // Flagstones with mossy crevices
    const stones = [
      { x: 26, y: 8, w: 12, h: 6 },
      { x: 16, y: 14, w: 14, h: 6 },
      { x: 34, y: 14, w: 14, h: 6 },
      { x: 26, y: 20, w: 12, h: 6 },
    ];
    stones.forEach((s) => {
      ctx.fillStyle = this.PALETTE.stoneMid;
      ctx.fillRect(s.x, s.y, s.w, s.h);
      ctx.fillStyle = this.PALETTE.stoneLight;
      ctx.fillRect(s.x + 1, s.y + 1, s.w - 2, 1);
      ctx.fillStyle = this.PALETTE.stoneHighlight;
      ctx.fillRect(s.x + 1, s.y + 1, 2, 1);
    });

    // Moss specks between stones
    ctx.fillStyle = this.PALETTE.grassDark;
    ctx.fillRect(30, 14, 2, 2);
    ctx.fillRect(20, 12, 1, 2);
    ctx.fillRect(44, 12, 2, 1);

    canvas.refresh();
  }

  private static createTileSoilPath(tm: Phaser.Textures.TextureManager): void {
    if (tm.exists('tile_soil_path')) return;
    const canvas = tm.createCanvas('tile_soil_path', 64, 40);
    if (!canvas) return;
    const ctx = canvas.getContext();

    this.drawIsoDiamond(ctx, this.PALETTE.soilMid, this.PALETTE.soilDark, '#29180e');

    // Worn loam pathway variations
    ctx.fillStyle = this.PALETTE.soilLight;
    ctx.fillRect(24, 12, 16, 8);
    ctx.fillStyle = this.PALETTE.soilDark;
    ctx.fillRect(20, 15, 3, 2);
    ctx.fillRect(38, 17, 4, 1);

    canvas.refresh();
  }

  private static createTileWoodDeck(tm: Phaser.Textures.TextureManager): void {
    if (tm.exists('tile_wood_deck')) return;
    const canvas = tm.createCanvas('tile_wood_deck', 64, 40);
    if (!canvas) return;
    const ctx = canvas.getContext();

    this.drawIsoDiamond(ctx, this.PALETTE.woodMid, this.PALETTE.woodDark, '#1e1109');

    // Horizontal wooden deck planks
    ctx.strokeStyle = this.PALETTE.woodDark;
    ctx.lineWidth = 1;
    for (let y = 6; y < 28; y += 4) {
      ctx.beginPath();
      ctx.moveTo(12 + Math.abs(16 - y), y);
      ctx.lineTo(52 - Math.abs(16 - y), y);
      ctx.stroke();

      ctx.fillStyle = this.PALETTE.woodHighlight;
      ctx.fillRect(16 + Math.abs(16 - y), y + 1, 4, 1);
    }

    canvas.refresh();
  }

  // -------------------------------------------------------------
  // BUILDINGS & LANDMARKS (Japanese-Kerala Architecture)
  // -------------------------------------------------------------

  private static createTharavaduHomestead(tm: Phaser.Textures.TextureManager): void {
    if (tm.exists('prop_tharavadu')) return;
    const canvas = tm.createCanvas('prop_tharavadu', 160, 130);
    if (!canvas) return;
    const ctx = canvas.getContext();

    // 1. Soft Shadow
    ctx.fillStyle = 'rgba(10, 18, 14, 0.45)';
    ctx.beginPath();
    ctx.ellipse(80, 115, 70, 14, 0, 0, Math.PI * 2);
    ctx.fill();

    // 2. Timber Foundation Platform (raised plinth / poomukham)
    ctx.fillStyle = this.PALETTE.stoneDark;
    ctx.fillRect(25, 88, 110, 18);
    ctx.fillStyle = this.PALETTE.woodDark;
    ctx.fillRect(27, 85, 106, 6);

    // Front stone steps
    ctx.fillStyle = this.PALETTE.stoneMid;
    ctx.fillRect(70, 96, 20, 8);
    ctx.fillStyle = this.PALETTE.stoneLight;
    ctx.fillRect(72, 98, 16, 2);

    // 3. Walls & Shoji Screen Doors
    ctx.fillStyle = this.PALETTE.washiPaper;
    ctx.fillRect(35, 48, 90, 40);

    // Wooden timber framing studs
    ctx.fillStyle = this.PALETTE.woodMid;
    ctx.fillRect(35, 48, 6, 40);
    ctx.fillRect(75, 48, 6, 40);
    ctx.fillRect(119, 48, 6, 40);
    ctx.fillRect(35, 48, 90, 4);
    ctx.fillRect(35, 84, 90, 4);

    // Warm inner light through shoji lattices
    ctx.fillStyle = '#ffcf77';
    ctx.fillRect(45, 54, 26, 28);
    ctx.fillRect(85, 54, 30, 28);

    // Shoji lattice grid
    ctx.fillStyle = this.PALETTE.woodDark;
    for (let x = 45; x <= 71; x += 6) ctx.fillRect(x, 54, 1, 28);
    for (let y = 54; y <= 82; y += 7) ctx.fillRect(45, y, 26, 1);
    for (let x = 85; x <= 115; x += 6) ctx.fillRect(x, 54, 1, 28);
    for (let y = 54; y <= 82; y += 7) ctx.fillRect(85, y, 30, 1);

    // Teak Veranda Pillars
    ctx.fillStyle = this.PALETTE.woodLight;
    ctx.fillRect(33, 46, 5, 44);
    ctx.fillRect(73, 46, 5, 44);
    ctx.fillRect(122, 46, 5, 44);

    // 4. Grand Terracotta Sloped Clay Tile Roof (Japanese Gable + Kerala Hipped Ridge)
    ctx.fillStyle = this.PALETTE.clayRoofMid;
    ctx.beginPath();
    ctx.moveTo(80, 10);
    ctx.lineTo(150, 46);
    ctx.lineTo(142, 54);
    ctx.lineTo(80, 32);
    ctx.lineTo(18, 54);
    ctx.lineTo(10, 46);
    ctx.closePath();
    ctx.fill();

    // Eaves under-shadow
    ctx.fillStyle = this.PALETTE.clayRoofDark;
    ctx.beginPath();
    ctx.moveTo(18, 54);
    ctx.lineTo(80, 32);
    ctx.lineTo(142, 54);
    ctx.lineTo(138, 58);
    ctx.lineTo(80, 37);
    ctx.lineTo(22, 58);
    ctx.closePath();
    ctx.fill();

    // Tiled ridges on roof
    ctx.strokeStyle = this.PALETTE.clayRoofRidge;
    ctx.lineWidth = 1;
    for (let i = -5; i <= 5; i++) {
      ctx.beginPath();
      ctx.moveTo(80, 10);
      ctx.lineTo(80 + i * 12, 48 - Math.abs(i) * 2);
      ctx.stroke();
    }

    // Traditional Top Ridge Finial (Thazhikakkudam / Onigawara crest)
    ctx.fillStyle = this.PALETTE.clayRoofLight;
    ctx.fillRect(77, 6, 6, 6);
    ctx.fillStyle = this.PALETTE.kasavuGold;
    ctx.fillRect(79, 3, 2, 4);

    // Hanging Brass / Paper Porch Lantern
    ctx.fillStyle = '#442b15';
    ctx.fillRect(78, 48, 1, 8); // wire
    ctx.fillStyle = this.PALETTE.fireOrange;
    ctx.fillRect(76, 56, 5, 6); // lamp body
    ctx.fillStyle = '#fff4cc';
    ctx.fillRect(77, 57, 3, 4); // glow core

    canvas.refresh();
  }

  private static createTeaPavilion(tm: Phaser.Textures.TextureManager): void {
    if (tm.exists('prop_tea_house')) return;
    const canvas = tm.createCanvas('prop_tea_house', 110, 95);
    if (!canvas) return;
    const ctx = canvas.getContext();

    // Shadow
    ctx.fillStyle = 'rgba(12, 20, 15, 0.4)';
    ctx.beginPath();
    ctx.ellipse(55, 82, 46, 10, 0, 0, Math.PI * 2);
    ctx.fill();

    // Raised cedar wood deck
    ctx.fillStyle = this.PALETTE.woodDark;
    ctx.fillRect(20, 62, 70, 10);
    ctx.fillStyle = this.PALETTE.woodMid;
    ctx.fillRect(22, 60, 66, 4);

    // Green tatami mats inside
    ctx.fillStyle = '#657e50';
    ctx.fillRect(30, 50, 50, 12);

    // Open Pillars
    ctx.fillStyle = this.PALETTE.woodLight;
    ctx.fillRect(24, 28, 4, 34);
    ctx.fillRect(82, 28, 4, 34);

    // Cast Iron Tea Kettle (Tetsubin) on table
    ctx.fillStyle = this.PALETTE.woodDark;
    ctx.fillRect(50, 52, 12, 6); // low tea table
    ctx.fillStyle = '#222';
    ctx.fillRect(54, 48, 5, 4); // iron pot
    ctx.fillStyle = '#fff';
    ctx.fillRect(56, 45, 1, 2); // steam

    // Thatched / Cedar Shingle Roof
    ctx.fillStyle = this.PALETTE.woodDark;
    ctx.beginPath();
    ctx.moveTo(55, 12);
    ctx.lineTo(102, 34);
    ctx.lineTo(95, 40);
    ctx.lineTo(55, 24);
    ctx.lineTo(15, 40);
    ctx.lineTo(8, 34);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = this.PALETTE.woodLight;
    for (let x = 18; x <= 92; x += 8) {
      ctx.fillRect(x, 26 + Math.abs(55 - x) * 0.15, 4, 2);
    }

    canvas.refresh();
  }

  private static createToriiShrine(tm: Phaser.Textures.TextureManager): void {
    if (tm.exists('prop_torii_shrine')) return;
    const canvas = tm.createCanvas('prop_torii_shrine', 80, 80);
    if (!canvas) return;
    const ctx = canvas.getContext();

    // Shadow
    ctx.fillStyle = 'rgba(10, 18, 14, 0.35)';
    ctx.beginPath();
    ctx.ellipse(40, 72, 32, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    // Stone base plinths
    ctx.fillStyle = this.PALETTE.stoneDark;
    ctx.fillRect(20, 65, 8, 7);
    ctx.fillRect(52, 65, 8, 7);
    ctx.fillStyle = this.PALETTE.stoneLight;
    ctx.fillRect(21, 65, 6, 2);
    ctx.fillRect(53, 65, 6, 2);

    // Red Torii Vertical Pillars
    ctx.fillStyle = this.PALETTE.toriiRed;
    ctx.fillRect(22, 16, 5, 50);
    ctx.fillRect(53, 16, 5, 50);
    ctx.fillStyle = this.PALETTE.toriiBright;
    ctx.fillRect(23, 16, 2, 50);
    ctx.fillRect(54, 16, 2, 50);

    // Bottom Crossbeam (Nuki)
    ctx.fillStyle = this.PALETTE.toriiRed;
    ctx.fillRect(16, 26, 48, 5);
    ctx.fillStyle = this.PALETTE.toriiBright;
    ctx.fillRect(16, 26, 48, 1);

    // Top Curved Main Beam (Kasagi & Shimaki) with black caps
    ctx.fillStyle = this.PALETTE.toriiRed;
    ctx.beginPath();
    ctx.moveTo(10, 15);
    ctx.quadraticCurveTo(40, 12, 70, 15);
    ctx.lineTo(72, 20);
    ctx.quadraticCurveTo(40, 17, 8, 20);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#1c1b1a'; // Black lacquer ends
    ctx.fillRect(8, 14, 6, 6);
    ctx.fillRect(66, 14, 6, 6);

    // Shimenawa (Twisted Rice Straw Rope)
    ctx.strokeStyle = this.PALETTE.strawHat;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(22, 31);
    ctx.quadraticCurveTo(40, 36, 55, 31);
    ctx.stroke();

    // Hanging White Shide Paper Streamers & Brass Bell
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(32, 33, 2, 6);
    ctx.fillRect(46, 33, 2, 6);
    ctx.fillStyle = this.PALETTE.kasavuGold;
    ctx.fillRect(39, 34, 3, 4); // bell

    // Small granite idol / sacred stone under gate
    ctx.fillStyle = this.PALETTE.stoneMid;
    ctx.fillRect(37, 60, 6, 8);
    ctx.fillStyle = this.PALETTE.grassDark;
    ctx.fillRect(36, 66, 8, 3); // moss

    canvas.refresh();
  }

  private static createCountryBoat(tm: Phaser.Textures.TextureManager): void {
    if (tm.exists('prop_kettuvallam')) return;
    const canvas = tm.createCanvas('prop_kettuvallam', 100, 60);
    if (!canvas) return;
    const ctx = canvas.getContext();

    // Water shadow & reflection
    ctx.fillStyle = 'rgba(14, 32, 38, 0.45)';
    ctx.beginPath();
    ctx.ellipse(50, 48, 42, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    // Wooden Boat Hull (curved jackwood planks sewn with coir rope)
    ctx.fillStyle = this.PALETTE.woodDark;
    ctx.beginPath();
    ctx.moveTo(10, 36);
    ctx.quadraticCurveTo(50, 52, 90, 36);
    ctx.lineTo(84, 30);
    ctx.quadraticCurveTo(50, 44, 16, 30);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = this.PALETTE.woodLight;
    ctx.fillRect(20, 32, 60, 2);

    // Arched Bamboo Wicker Canopy (Kettuvallam roof)
    ctx.fillStyle = '#7a5a3a';
    ctx.beginPath();
    ctx.arc(50, 30, 26, Math.PI, 0, false);
    ctx.closePath();
    ctx.fill();

    // Bamboo rib slats on canopy
    ctx.strokeStyle = '#5a3d24';
    ctx.lineWidth = 1;
    for (let x = 28; x <= 72; x += 8) {
      ctx.beginPath();
      ctx.moveTo(x, 30);
      ctx.lineTo(x, 10 + Math.abs(50 - x) * 0.4);
      ctx.stroke();
    }

    // Bamboo punting pole resting on deck
    ctx.strokeStyle = this.PALETTE.strawHat;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(8, 26);
    ctx.lineTo(92, 40);
    ctx.stroke();

    // Tiny hanging stern lantern
    ctx.fillStyle = this.PALETTE.fireOrange;
    ctx.fillRect(84, 28, 3, 4);

    canvas.refresh();
  }

  private static createWoodenBridge(tm: Phaser.Textures.TextureManager): void {
    if (tm.exists('prop_wooden_bridge')) return;
    const canvas = tm.createCanvas('prop_wooden_bridge', 64, 48);
    if (!canvas) return;
    const ctx = canvas.getContext();

    // Arch Deck Planks
    ctx.fillStyle = this.PALETTE.woodDark;
    ctx.beginPath();
    ctx.moveTo(0, 32);
    ctx.quadraticCurveTo(32, 20, 64, 32);
    ctx.lineTo(64, 38);
    ctx.quadraticCurveTo(32, 26, 0, 38);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = this.PALETTE.woodMid;
    ctx.beginPath();
    ctx.moveTo(0, 30);
    ctx.quadraticCurveTo(32, 18, 64, 30);
    ctx.lineTo(64, 34);
    ctx.quadraticCurveTo(32, 22, 0, 34);
    ctx.closePath();
    ctx.fill();

    // Handrail Posts & Top Rail
    ctx.fillStyle = this.PALETTE.woodLight;
    ctx.fillRect(8, 16, 3, 16);
    ctx.fillRect(30, 10, 3, 16);
    ctx.fillRect(52, 16, 3, 16);

    ctx.strokeStyle = this.PALETTE.woodLight;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(6, 18);
    ctx.quadraticCurveTo(32, 10, 56, 18);
    ctx.stroke();

    canvas.refresh();
  }

  private static createStoneLantern(tm: Phaser.Textures.TextureManager): void {
    if (tm.exists('prop_stone_lantern')) return;
    const canvas = tm.createCanvas('prop_stone_lantern', 24, 44);
    if (!canvas) return;
    const ctx = canvas.getContext();

    // Shadow
    ctx.fillStyle = 'rgba(10, 18, 14, 0.35)';
    ctx.beginPath();
    ctx.ellipse(12, 40, 8, 3, 0, 0, Math.PI * 2);
    ctx.fill();

    // Base
    ctx.fillStyle = this.PALETTE.stoneDark;
    ctx.fillRect(6, 34, 12, 6);
    ctx.fillStyle = this.PALETTE.stoneMid;
    ctx.fillRect(9, 22, 6, 12); // pillar

    // Lantern chamber
    ctx.fillStyle = this.PALETTE.stoneDark;
    ctx.fillRect(5, 18, 14, 4);
    ctx.fillStyle = '#ffcf55'; // warm amber light
    ctx.fillRect(7, 12, 10, 6);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(10, 14, 4, 3);

    // Roof Pagoda Cap
    ctx.fillStyle = this.PALETTE.stoneLight;
    ctx.beginPath();
    ctx.moveTo(12, 4);
    ctx.lineTo(22, 11);
    ctx.lineTo(2, 11);
    ctx.closePath();
    ctx.fill();

    // Jewel finial (hōju)
    ctx.fillStyle = this.PALETTE.stoneMid;
    ctx.fillRect(11, 2, 2, 3);

    canvas.refresh();
  }

  private static createGardenBench(tm: Phaser.Textures.TextureManager): void {
    if (tm.exists('prop_bench')) return;
    const canvas = tm.createCanvas('prop_bench', 36, 28);
    if (!canvas) return;
    const ctx = canvas.getContext();

    // Shadow
    ctx.fillStyle = 'rgba(10, 18, 14, 0.3)';
    ctx.fillRect(4, 22, 28, 4);

    // Legs
    ctx.fillStyle = this.PALETTE.woodDark;
    ctx.fillRect(6, 14, 3, 10);
    ctx.fillRect(27, 14, 3, 10);

    // Wooden Seat Plank
    ctx.fillStyle = this.PALETTE.woodMid;
    ctx.fillRect(4, 12, 28, 4);
    ctx.fillStyle = this.PALETTE.woodHighlight;
    ctx.fillRect(4, 12, 28, 1);

    // Backrest
    ctx.fillStyle = this.PALETTE.woodDark;
    ctx.fillRect(6, 4, 2, 9);
    ctx.fillRect(28, 4, 2, 9);
    ctx.fillStyle = this.PALETTE.woodLight;
    ctx.fillRect(4, 4, 28, 3);

    canvas.refresh();
  }

  private static createCampfireFrames(tm: Phaser.Textures.TextureManager): void {
    // 3 animated flame flickers
    for (let f = 0; f < 3; f++) {
      const key = `prop_campfire_${f}`;
      if (tm.exists(key)) continue;
      const canvas = tm.createCanvas(key, 40, 40);
      if (!canvas) continue;
      const ctx = canvas.getContext();

      // Shadow
      ctx.fillStyle = 'rgba(10, 18, 14, 0.4)';
      ctx.beginPath();
      ctx.ellipse(20, 32, 16, 6, 0, 0, Math.PI * 2);
      ctx.fill();

      // Stone ring around fire pit
      const stones = [
        [8, 28], [14, 33], [22, 34], [30, 32], [32, 26], [26, 24], [14, 24]
      ];
      ctx.fillStyle = this.PALETTE.stoneMid;
      stones.forEach(([sx, sy]) => {
        ctx.fillRect(sx, sy, 5, 4);
        ctx.fillStyle = this.PALETTE.stoneLight;
        ctx.fillRect(sx + 1, sy, 3, 1);
        ctx.fillStyle = this.PALETTE.stoneMid;
      });

      // Charred campfire logs
      ctx.fillStyle = this.PALETTE.charcoal;
      ctx.fillRect(14, 28, 12, 4);
      ctx.fillRect(18, 25, 4, 9);

      // Glowing coals
      ctx.fillStyle = this.PALETTE.fireOrange;
      ctx.fillRect(18, 27, 6, 3);

      // Dancing Flame Shapes
      ctx.fillStyle = this.PALETTE.fireOrange;
      ctx.beginPath();
      const offset = (f * 2) - 2;
      ctx.moveTo(15, 27);
      ctx.quadraticCurveTo(20 + offset, 10 - (f % 2) * 3, 25, 27);
      ctx.closePath();
      ctx.fill();

      // Yellow bright flame core
      ctx.fillStyle = this.PALETTE.fireYellow;
      ctx.beginPath();
      ctx.moveTo(17, 27);
      ctx.quadraticCurveTo(20 + offset * 0.5, 14, 23, 27);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(19, 21, 2, 4);

      canvas.refresh();
    }
  }

  // -------------------------------------------------------------
  // TREES & FLORA
  // -------------------------------------------------------------

  private static createCoconutPalm(tm: Phaser.Textures.TextureManager): void {
    if (tm.exists('tree_coconut_palm')) return;
    const canvas = tm.createCanvas('tree_coconut_palm', 72, 120);
    if (!canvas) return;
    const ctx = canvas.getContext();

    // Shadow
    ctx.fillStyle = 'rgba(10, 18, 14, 0.35)';
    ctx.beginPath();
    ctx.ellipse(30, 114, 18, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Tall curved palm trunk with rings
    ctx.strokeStyle = this.PALETTE.palmTrunk;
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(30, 114);
    ctx.quadraticCurveTo(24, 70, 38, 30);
    ctx.stroke();

    // Trunk ring segments
    ctx.strokeStyle = '#382b22';
    ctx.lineWidth = 1;
    for (let y = 110; y > 32; y -= 8) {
      const x = 30 + (114 - y) * 0.1;
      ctx.beginPath();
      ctx.moveTo(x - 3, y);
      ctx.lineTo(x + 3, y - 1);
      ctx.stroke();
    }

    // Coconut cluster at crown
    ctx.fillStyle = '#655731';
    ctx.fillRect(36, 28, 4, 4);
    ctx.fillRect(39, 30, 4, 4);
    ctx.fillRect(34, 31, 4, 4);

    // Drooping Palm Fronds
    const fronds = [
      { ex: 10, ey: 22, cx: 20, cy: 15 },
      { ex: 6, ey: 36, cx: 16, cy: 28 },
      { ex: 64, ey: 20, cx: 50, cy: 14 },
      { ex: 68, ey: 34, cx: 54, cy: 26 },
      { ex: 38, ey: 10, cx: 38, cy: 16 },
      { ex: 44, ey: 44, cx: 48, cy: 38 },
      { ex: 26, ey: 46, cx: 28, cy: 40 },
    ];
    fronds.forEach((fr) => {
      ctx.strokeStyle = this.PALETTE.palmFrondDark;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(38, 30);
      ctx.quadraticCurveTo(fr.cx, fr.cy, fr.ex, fr.ey);
      ctx.stroke();

      ctx.strokeStyle = this.PALETTE.palmFrondLight;
      ctx.lineWidth = 1;
      ctx.stroke();
    });

    canvas.refresh();
  }

  private static createSakuraTree(tm: Phaser.Textures.TextureManager): void {
    if (tm.exists('tree_sakura')) return;
    const canvas = tm.createCanvas('tree_sakura', 84, 100);
    if (!canvas) return;
    const ctx = canvas.getContext();

    // Ground Shadow
    ctx.fillStyle = 'rgba(10, 18, 14, 0.35)';
    ctx.beginPath();
    ctx.ellipse(42, 94, 28, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    // Gnarled dark trunk and branches
    ctx.fillStyle = this.PALETTE.sakuraBark;
    ctx.beginPath();
    ctx.moveTo(38, 94);
    ctx.lineTo(46, 94);
    ctx.lineTo(45, 60);
    ctx.lineTo(58, 44);
    ctx.lineTo(54, 42);
    ctx.lineTo(43, 56);
    ctx.lineTo(30, 46);
    ctx.lineTo(28, 50);
    ctx.lineTo(39, 62);
    ctx.closePath();
    ctx.fill();

    // Billowing Cherry Blossom Foliage Cloud Clusters
    const clouds = [
      { x: 42, y: 32, rx: 24, ry: 18 },
      { x: 26, y: 40, rx: 18, ry: 14 },
      { x: 58, y: 38, rx: 18, ry: 14 },
      { x: 42, y: 22, rx: 18, ry: 12 },
    ];
    clouds.forEach((c) => {
      ctx.fillStyle = this.PALETTE.sakuraPetalDark;
      ctx.beginPath();
      ctx.ellipse(c.x, c.y + 3, c.rx, c.ry, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = this.PALETTE.sakuraPetalMid;
      ctx.beginPath();
      ctx.ellipse(c.x, c.y, c.rx, c.ry, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = this.PALETTE.sakuraPetalLight;
      ctx.beginPath();
      ctx.ellipse(c.x - 3, c.y - 3, c.rx * 0.7, c.ry * 0.65, 0, 0, Math.PI * 2);
      ctx.fill();
    });

    // Petal highlights
    ctx.fillStyle = this.PALETTE.sakuraPetalWhite;
    ctx.fillRect(36, 18, 2, 2);
    ctx.fillRect(48, 24, 2, 2);
    ctx.fillRect(24, 35, 2, 2);

    canvas.refresh();
  }

  private static createBananaPlant(tm: Phaser.Textures.TextureManager): void {
    if (tm.exists('tree_banana')) return;
    const canvas = tm.createCanvas('tree_banana', 52, 64);
    if (!canvas) return;
    const ctx = canvas.getContext();

    // Shadow
    ctx.fillStyle = 'rgba(10, 18, 14, 0.3)';
    ctx.beginPath();
    ctx.ellipse(26, 60, 14, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    // Trunk
    ctx.fillStyle = '#4a7238';
    ctx.fillRect(24, 42, 5, 18);

    // Broad tropical leaves (Kerala banana leaf)
    const leaves = [
      { x1: 26, y1: 44, cx: 12, cy: 26, x2: 4, y2: 36 },
      { x1: 26, y1: 44, cx: 40, cy: 26, x2: 48, y2: 36 },
      { x1: 26, y1: 42, cx: 20, cy: 16, x2: 12, y2: 24 },
      { x1: 26, y1: 42, cx: 32, cy: 16, x2: 40, y2: 24 },
      { x1: 26, y1: 40, cx: 26, cy: 10, x2: 26, y2: 16 },
    ];
    leaves.forEach((l) => {
      ctx.fillStyle = this.PALETTE.bananaLeafDark;
      ctx.beginPath();
      ctx.moveTo(l.x1, l.y1);
      ctx.quadraticCurveTo(l.cx, l.cy, l.x2, l.y2);
      ctx.quadraticCurveTo(l.cx + 4, l.cy + 6, l.x1 + 3, l.y1);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = this.PALETTE.bananaLeafLight;
      ctx.lineWidth = 1;
      ctx.stroke();
    });

    // Hanging Yellow Banana Bunch
    ctx.fillStyle = this.PALETTE.bananaFruit;
    ctx.fillRect(24, 38, 4, 6);
    ctx.fillRect(27, 40, 3, 5);

    canvas.refresh();
  }

  private static createBambooGrove(tm: Phaser.Textures.TextureManager): void {
    if (tm.exists('tree_bamboo')) return;
    const canvas = tm.createCanvas('tree_bamboo', 38, 84);
    if (!canvas) return;
    const ctx = canvas.getContext();

    // Shadow
    ctx.fillStyle = 'rgba(10, 18, 14, 0.3)';
    ctx.beginPath();
    ctx.ellipse(19, 80, 14, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    // 3 Stalks of bamboo
    const stalks = [10, 19, 28];
    stalks.forEach((sx) => {
      ctx.fillStyle = this.PALETTE.bambooDark;
      ctx.fillRect(sx, 12, 3, 68);
      ctx.fillStyle = this.PALETTE.bambooLight;
      ctx.fillRect(sx, 12, 1, 68);

      // Bamboo ring nodes
      ctx.fillStyle = '#1c3a1e';
      for (let y = 72; y >= 16; y -= 12) {
        ctx.fillRect(sx - 1, y, 5, 2);
        // Spray of pointed leaves
        ctx.fillStyle = this.PALETTE.bambooLight;
        ctx.fillRect(sx + 3, y - 2, 4, 2);
        ctx.fillRect(sx + 6, y - 3, 3, 1);
        ctx.fillStyle = '#1c3a1e';
      }
    });

    canvas.refresh();
  }

  private static createJasmineBush(tm: Phaser.Textures.TextureManager): void {
    if (tm.exists('bush_jasmine')) return;
    const canvas = tm.createCanvas('bush_jasmine', 36, 30);
    if (!canvas) return;
    const ctx = canvas.getContext();

    // Shadow
    ctx.fillStyle = 'rgba(10, 18, 14, 0.3)';
    ctx.beginPath();
    ctx.ellipse(18, 26, 14, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    // Bush foliage
    ctx.fillStyle = '#264223';
    ctx.beginPath();
    ctx.ellipse(18, 16, 14, 10, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#3c6e38';
    ctx.beginPath();
    ctx.ellipse(16, 14, 11, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    // Starry white jasmine blooms (Mullappoo)
    ctx.fillStyle = '#ffffff';
    const blooms = [
      [12, 10], [22, 11], [16, 16], [26, 17], [10, 18], [20, 20]
    ];
    blooms.forEach(([x, y]) => {
      ctx.fillRect(x, y, 2, 2);
      ctx.fillRect(x - 1, y, 1, 1);
      ctx.fillRect(x + 2, y, 1, 1);
      ctx.fillRect(x, y - 1, 1, 1);
    });

    canvas.refresh();
  }

  // -------------------------------------------------------------
  // CHARACTERS & ANIMATIONS
  // -------------------------------------------------------------

  private static createPlayerSprites(tm: Phaser.Textures.TextureManager): void {
    // Walk cycles: 4 directions (dr, dl, ur, ul), 4 frames each
    const directions = ['dr', 'dl', 'ur', 'ul'];
    directions.forEach((dir) => {
      for (let f = 0; f < 4; f++) {
        const key = `player_walk_${dir}_${f}`;
        if (tm.exists(key)) continue;
        const canvas = tm.createCanvas(key, 32, 44);
        if (!canvas) continue;
        const ctx = canvas.getContext();

        this.drawHumanCharacter(ctx, {
          direction: dir,
          frame: f,
          hatColor: this.PALETTE.strawHat,
          hatBand: this.PALETTE.toriiRed,
          vestColor: this.PALETTE.indigoBlue,
          pantsColor: '#ded8c8',
          skinColor: this.PALETTE.skinTone,
          isSitting: false,
          isFishing: false,
        });

        canvas.refresh();
      }
    });

    // Player Sitting Pose
    if (!tm.exists('player_sit')) {
      const canvas = tm.createCanvas('player_sit', 32, 44);
      if (canvas) {
        const ctx = canvas.getContext();
        this.drawHumanCharacter(ctx, {
          direction: 'dr',
          frame: 0,
          hatColor: this.PALETTE.strawHat,
          hatBand: this.PALETTE.toriiRed,
          vestColor: this.PALETTE.indigoBlue,
          pantsColor: '#ded8c8',
          skinColor: this.PALETTE.skinTone,
          isSitting: true,
          isFishing: false,
        });
        canvas.refresh();
      }
    }

    // Player Fishing Pose
    if (!tm.exists('player_fish')) {
      const canvas = tm.createCanvas('player_fish', 48, 44);
      if (canvas) {
        const ctx = canvas.getContext();
        this.drawHumanCharacter(ctx, {
          direction: 'dr',
          frame: 0,
          hatColor: this.PALETTE.strawHat,
          hatBand: this.PALETTE.toriiRed,
          vestColor: this.PALETTE.indigoBlue,
          pantsColor: '#ded8c8',
          skinColor: this.PALETTE.skinTone,
          isSitting: false,
          isFishing: true,
        });
        canvas.refresh();
      }
    }
  }

  private static drawHumanCharacter(
    ctx: CanvasRenderingContext2D,
    opts: {
      direction: string;
      frame: number;
      hatColor: string;
      hatBand: string;
      vestColor: string;
      pantsColor: string;
      skinColor: string;
      isSitting: boolean;
      isFishing: boolean;
    }
  ): void {
    const cx = opts.isFishing ? 16 : 16;
    const isBack = opts.direction.startsWith('u');
    const isLeft = opts.direction.endsWith('l');

    // Bobbing offset on walk
    const bob = opts.isSitting ? 4 : opts.frame % 2 === 1 ? 1 : 0;

    // Legs / Feet
    if (opts.isSitting) {
      // Sitting crossed on knees
      ctx.fillStyle = opts.pantsColor;
      ctx.fillRect(cx - 7, 30, 14, 7);
      ctx.fillStyle = '#bfa780';
      ctx.fillRect(cx - 5, 36, 10, 3);
    } else {
      const legStep = opts.frame === 1 ? -3 : opts.frame === 3 ? 3 : 0;
      ctx.fillStyle = opts.pantsColor;
      ctx.fillRect(cx - 4 + legStep, 26 + bob, 3, 10);
      ctx.fillRect(cx + 2 - legStep, 26 + bob, 3, 10);

      // Straw sandals (Waraji)
      ctx.fillStyle = '#bfa780';
      ctx.fillRect(cx - 5 + legStep, 36 + bob, 4, 3);
      ctx.fillRect(cx + 1 - legStep, 36 + bob, 4, 3);
    }

    // Body & Vest / Haori
    ctx.fillStyle = opts.vestColor;
    ctx.fillRect(cx - 5, 16 + bob, 10, 11);

    if (!isBack) {
      // White collar / sash
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(cx - 2, 17 + bob, 4, 4);
      ctx.fillStyle = opts.hatBand;
      ctx.fillRect(cx - 5, 24 + bob, 10, 2); // waist sash
    }

    // Arms
    ctx.fillStyle = opts.skinColor;
    if (opts.isFishing) {
      // Arms extended holding bamboo fishing rod
      ctx.fillRect(cx + 4, 18 + bob, 6, 3);
      // Bamboo pole
      ctx.strokeStyle = '#c49a45';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cx + 8, 20 + bob);
      ctx.lineTo(cx + 30, 6 + bob);
      ctx.stroke();

      // Fishing line dropping into water
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(cx + 30, 6 + bob);
      ctx.lineTo(cx + 30, 36);
      ctx.stroke();

      // Red/white float on water
      ctx.fillStyle = '#d34e36';
      ctx.fillRect(cx + 29, 36, 3, 3);
    } else if (opts.isSitting) {
      ctx.fillRect(cx - 6, 22 + bob, 4, 6);
      ctx.fillRect(cx + 3, 22 + bob, 4, 6);
    } else {
      const armSwing = opts.frame === 1 ? 2 : opts.frame === 3 ? -2 : 0;
      ctx.fillRect(cx - 7, 18 + bob + armSwing, 3, 7);
      ctx.fillRect(cx + 5, 18 + bob - armSwing, 3, 7);
    }

    // Head / Face
    ctx.fillStyle = opts.skinColor;
    ctx.fillRect(cx - 4, 10 + bob, 8, 7);

    if (!isBack) {
      // Gentle eyes
      ctx.fillStyle = '#222';
      const eyeX = isLeft ? cx - 3 : cx;
      ctx.fillRect(eyeX, 12 + bob, 1, 2);
      ctx.fillRect(eyeX + 3, 12 + bob, 1, 2);
    }

    // Conical Straw Traveler Hat (Kasa / Thoppi)
    ctx.fillStyle = opts.hatColor;
    ctx.beginPath();
    ctx.moveTo(cx, 3 + bob);
    ctx.lineTo(cx + 10, 11 + bob);
    ctx.lineTo(cx - 10, 11 + bob);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = opts.hatBand;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cx - 9, 10 + bob);
    ctx.lineTo(cx + 9, 10 + bob);
    ctx.stroke();
  }

  private static createNPCSprites(tm: Phaser.Textures.TextureManager): void {
    // 1. Master Ren (Calligrapher in indigo robe with grey hair bun)
    if (!tm.exists('npc_ren')) {
      const canvas = tm.createCanvas('npc_ren', 32, 44);
      if (canvas) {
        const ctx = canvas.getContext();
        // Indigo robe
        ctx.fillStyle = '#1e2c38';
        ctx.fillRect(10, 16, 12, 20);
        // White sash
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(12, 17, 8, 3);
        // Head & Wise Grey Beard
        ctx.fillStyle = this.PALETTE.skinTone;
        ctx.fillRect(12, 8, 8, 8);
        ctx.fillStyle = '#c5ccd1';
        ctx.fillRect(11, 6, 10, 4); // grey hair
        ctx.fillRect(13, 14, 6, 5); // long beard
        // Eyes
        ctx.fillStyle = '#222';
        ctx.fillRect(14, 11, 1, 1);
        ctx.fillRect(17, 11, 1, 1);
        // Bamboo calligraphy brush in hand
        ctx.fillStyle = '#8f653b';
        ctx.fillRect(22, 16, 2, 8);
        ctx.fillStyle = '#111';
        ctx.fillRect(22, 23, 2, 3); // brush tip
        canvas.refresh();
      }
    }

    // 2. Devaki Amma (Kerala Matriarch in traditional Kasavu gold-bordered attire)
    if (!tm.exists('npc_devaki')) {
      const canvas = tm.createCanvas('npc_devaki', 32, 44);
      if (canvas) {
        const ctx = canvas.getContext();
        // Traditional off-white kasavu saree
        ctx.fillStyle = '#f5efe1';
        ctx.fillRect(10, 16, 12, 21);
        // Pure Gold border (Kasavu)
        ctx.fillStyle = this.PALETTE.kasavuGold;
        ctx.fillRect(10, 24, 12, 2);
        ctx.fillRect(14, 16, 3, 21);
        // Head & Silver Hair Bun
        ctx.fillStyle = this.PALETTE.skinTone;
        ctx.fillRect(12, 8, 8, 8);
        ctx.fillStyle = '#9aa1a6';
        ctx.fillRect(11, 6, 10, 4); // silver hair
        ctx.fillRect(7, 8, 4, 4); // side bun
        // Red Bindi / Pottu & gentle eyes
        ctx.fillStyle = '#b72218';
        ctx.fillRect(15, 10, 2, 2);
        ctx.fillStyle = '#222';
        ctx.fillRect(13, 12, 1, 1);
        ctx.fillRect(17, 12, 1, 1);
        canvas.refresh();
      }
    }

    // 3. Appu (Canal village boy with straw hat and rolled pants)
    if (!tm.exists('npc_appu')) {
      const canvas = tm.createCanvas('npc_appu', 32, 40);
      if (canvas) {
        const ctx = canvas.getContext();
        // Yellow cotton shirt
        ctx.fillStyle = '#e8a838';
        ctx.fillRect(11, 15, 10, 10);
        // Blue shorts
        ctx.fillStyle = '#3f678a';
        ctx.fillRect(11, 24, 10, 6);
        // Bare legs
        ctx.fillStyle = this.PALETTE.skinTone;
        ctx.fillRect(12, 30, 3, 7);
        ctx.fillRect(17, 30, 3, 7);
        // Face & energetic smile
        ctx.fillRect(12, 8, 8, 7);
        ctx.fillStyle = '#222';
        ctx.fillRect(14, 11, 1, 1);
        ctx.fillRect(17, 11, 1, 1);
        // Straw hat
        ctx.fillStyle = this.PALETTE.strawHat;
        ctx.fillRect(8, 6, 16, 3);
        ctx.fillRect(11, 3, 10, 4);
        canvas.refresh();
      }
    }
  }

  private static createWildlifeSprites(tm: Phaser.Textures.TextureManager): void {
    // 1. Kuro the Cat (Black cat with green eyes)
    if (!tm.exists('wildlife_cat')) {
      const canvas = tm.createCanvas('wildlife_cat', 24, 20);
      if (canvas) {
        const ctx = canvas.getContext();
        ctx.fillStyle = this.PALETTE.catBlack;
        // Body & Paws
        ctx.fillRect(5, 7, 13, 8);
        ctx.fillRect(6, 15, 2, 3);
        ctx.fillRect(15, 15, 2, 3);
        // Head & Pointed Ears
        ctx.fillRect(14, 4, 7, 7);
        ctx.fillRect(15, 2, 2, 2);
        ctx.fillRect(19, 2, 2, 2);
        // Curved Tail
        ctx.fillRect(2, 6, 3, 2);
        ctx.fillRect(3, 4, 2, 3);
        // Glowing Green Eyes
        ctx.fillStyle = this.PALETTE.catEyes;
        ctx.fillRect(17, 6, 1, 2);
        ctx.fillRect(19, 6, 1, 2);
        canvas.refresh();
      }
    }

    // 2. White River Heron (Standing on one leg)
    if (!tm.exists('wildlife_heron')) {
      const canvas = tm.createCanvas('wildlife_heron', 28, 36);
      if (canvas) {
        const ctx = canvas.getContext();
        // Slender yellow legs
        ctx.fillStyle = '#d4aa3b';
        ctx.fillRect(13, 22, 2, 12);
        // Graceful white body & neck
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.ellipse(14, 18, 6, 5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillRect(12, 8, 3, 11); // curved neck
        ctx.fillRect(13, 6, 5, 4);  // head
        // Long sharp yellow beak
        ctx.fillStyle = '#e8a838';
        ctx.fillRect(18, 7, 7, 2);
        // Black eye
        ctx.fillStyle = '#111';
        ctx.fillRect(15, 7, 1, 1);
        canvas.refresh();
      }
    }

    // 3. Golden River Koi (Swimming fish)
    if (!tm.exists('wildlife_koi')) {
      const canvas = tm.createCanvas('wildlife_koi', 24, 14);
      if (canvas) {
        const ctx = canvas.getContext();
        // Orange fish body with white belly
        ctx.fillStyle = '#e76f51';
        ctx.beginPath();
        ctx.ellipse(12, 7, 8, 4, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(9, 6, 4, 2);
        // Fins & Tail
        ctx.fillStyle = '#f4a261';
        ctx.fillRect(2, 5, 4, 4); // tail
        ctx.fillRect(11, 2, 3, 2); // dorsal fin
        // Eye
        ctx.fillStyle = '#111';
        ctx.fillRect(17, 6, 1, 1);
        canvas.refresh();
      }
    }

    // 4. Swallowtail Butterfly
    if (!tm.exists('wildlife_butterfly')) {
      const canvas = tm.createCanvas('wildlife_butterfly', 16, 16);
      if (canvas) {
        const ctx = canvas.getContext();
        // Teal emerald wings
        ctx.fillStyle = '#2a9d8f';
        ctx.fillRect(2, 2, 5, 5);
        ctx.fillRect(9, 2, 5, 5);
        ctx.fillRect(4, 8, 3, 4);
        ctx.fillRect(9, 8, 3, 4);
        ctx.fillStyle = '#e76f51';
        ctx.fillRect(4, 4, 2, 2);
        ctx.fillRect(10, 4, 2, 2);
        // Body
        ctx.fillStyle = '#1d2123';
        ctx.fillRect(7, 3, 2, 8);
        canvas.refresh();
      }
    }
  }

  // -------------------------------------------------------------
  // PARTICLES & KEEPSAKE ICONS
  // -------------------------------------------------------------

  private static createParticleAndItemTextures(tm: Phaser.Textures.TextureManager): void {
    // Sakura Petal
    if (!tm.exists('fx_petal')) {
      const canvas = tm.createCanvas('fx_petal', 8, 8);
      if (canvas) {
        const ctx = canvas.getContext();
        ctx.fillStyle = '#f7b0c3';
        ctx.beginPath();
        ctx.ellipse(4, 4, 3, 2, Math.PI / 4, 0, Math.PI * 2);
        ctx.fill();
        canvas.refresh();
      }
    }

    // Golden Spark / Ember
    if (!tm.exists('fx_spark')) {
      const canvas = tm.createCanvas('fx_spark', 6, 6);
      if (canvas) {
        const ctx = canvas.getContext();
        ctx.fillStyle = '#f9c74f';
        ctx.fillRect(2, 1, 2, 4);
        ctx.fillRect(1, 2, 4, 2);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(2, 2, 2, 2);
        canvas.refresh();
      }
    }

    // Firefly Glowing Orb
    if (!tm.exists('fx_firefly')) {
      const canvas = tm.createCanvas('fx_firefly', 10, 10);
      if (canvas) {
        const ctx = canvas.getContext();
        const grad = ctx.createRadialGradient(5, 5, 1, 5, 5, 5);
        grad.addColorStop(0, '#ffffff');
        grad.addColorStop(0.4, '#e9c46a');
        grad.addColorStop(1, 'rgba(233, 196, 106, 0)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 10, 10);
        canvas.refresh();
      }
    }

    // Raindrop streak
    if (!tm.exists('fx_rain')) {
      const canvas = tm.createCanvas('fx_rain', 4, 12);
      if (canvas) {
        const ctx = canvas.getContext();
        ctx.fillStyle = 'rgba(180, 220, 240, 0.7)';
        ctx.fillRect(1, 0, 2, 12);
        canvas.refresh();
      }
    }

    // Circular Water Ripple
    if (!tm.exists('fx_ripple')) {
      const canvas = tm.createCanvas('fx_ripple', 24, 12);
      if (canvas) {
        const ctx = canvas.getContext();
        ctx.strokeStyle = 'rgba(220, 245, 255, 0.75)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.ellipse(12, 6, 10, 4, 0, 0, Math.PI * 2);
        ctx.stroke();
        canvas.refresh();
      }
    }

    // Keepsake / Discovery Map Nodes (Glowing floating pickup)
    if (!tm.exists('prop_keepsake_node')) {
      const canvas = tm.createCanvas('prop_keepsake_node', 20, 20);
      if (canvas) {
        const ctx = canvas.getContext();
        // Golden glowing aura
        ctx.fillStyle = 'rgba(249, 199, 79, 0.35)';
        ctx.beginPath();
        ctx.arc(10, 10, 8, 0, Math.PI * 2);
        ctx.fill();
        // Inlaid Washi Ribbon Charm
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(8, 4, 4, 10);
        ctx.fillStyle = '#d34e36';
        ctx.fillRect(9, 6, 2, 4);
        canvas.refresh();
      }
    }
  }
}
