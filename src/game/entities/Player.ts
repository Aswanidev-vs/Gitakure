import Phaser from 'phaser';
import { soundEngine } from '@/audio/procedural-audio';

export class Player extends Phaser.Physics.Arcade.Sprite {
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasdKeys!: {
    W: Phaser.Input.Keyboard.Key;
    A: Phaser.Input.Keyboard.Key;
    S: Phaser.Input.Keyboard.Key;
    D: Phaser.Input.Keyboard.Key;
    SHIFT: Phaser.Input.Keyboard.Key;
    E: Phaser.Input.Keyboard.Key;
    SPACE: Phaser.Input.Keyboard.Key;
  };
  private stepTimer = 0;
  private facing: 'down' | 'up' | 'left' | 'right' = 'down';

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'pixel_character_sheets', 'pixel_character_sheets_p04_r07_c04');
    scene.add.existing(this);
    scene.physics.add.existing(this);

    // Render at native frame resolution so the pixel art stays crisp.
    // Frames in this atlas vary in size; the p04_r07 portrait set is ~36x71.
    this.setOrigin(0.5, 0.82);
    // Collision body sized to the feet, not the whole sprite.
    this.setSize(18, 12);
    this.setOffset(9, 58);
    this.setCollideWorldBounds(true);
    this.setDepth(y);

    if (scene.input.keyboard) {
      this.cursors = scene.input.keyboard.createCursorKeys();
      this.wasdKeys = scene.input.keyboard.addKeys({
        W: Phaser.Input.Keyboard.KeyCodes.W,
        A: Phaser.Input.Keyboard.KeyCodes.A,
        S: Phaser.Input.Keyboard.KeyCodes.S,
        D: Phaser.Input.Keyboard.KeyCodes.D,
        SHIFT: Phaser.Input.Keyboard.KeyCodes.SHIFT,
        E: Phaser.Input.Keyboard.KeyCodes.E,
        SPACE: Phaser.Input.Keyboard.KeyCodes.SPACE,
      }) as typeof this.wasdKeys;
    }
  }

  public updatePlayer(delta: number): { x: number; y: number; isMoving: boolean; interactPressed: boolean } {
    let vx = 0;
    let vy = 0;

    const isRunning = this.wasdKeys?.SHIFT?.isDown || this.cursors?.shift?.isDown;
    const speed = isRunning ? 150 : 95;

    const left = this.wasdKeys?.A?.isDown || this.cursors?.left?.isDown;
    const right = this.wasdKeys?.D?.isDown || this.cursors?.right?.isDown;
    const up = this.wasdKeys?.W?.isDown || this.cursors?.up?.isDown;
    const down = this.wasdKeys?.S?.isDown || this.cursors?.down?.isDown;

    if (left) {
      vx -= speed;
      this.facing = 'left';
    } else if (right) {
      vx += speed;
      this.facing = 'right';
    }

    if (up) {
      vy -= speed;
      this.facing = 'up';
    } else if (down) {
      vy += speed;
      this.facing = 'down';
    }

    // Normalize diagonal
    if (vx !== 0 && vy !== 0) {
      vx *= 0.7071;
      vy *= 0.7071;
    }

    this.setVelocity(vx, vy);

    const isMoving = vx !== 0 || vy !== 0;

    // Depth sort by player feet
    this.setDepth(this.y + 16);

    // Frame selection and direction.
    // p04_r07_c04..c07 are the four portrait frames of one character set;
    // using one family keeps the player a consistent, visible size as it turns.
    if (this.facing === 'left') {
      this.setFrame('pixel_character_sheets_p04_r07_c06');
      this.setFlipX(true);
    } else if (this.facing === 'right') {
      this.setFrame('pixel_character_sheets_p04_r07_c06');
      this.setFlipX(false);
    } else if (this.facing === 'up') {
      this.setFrame('pixel_character_sheets_p04_r07_c07');
      this.setFlipX(false);
    } else {
      this.setFrame('pixel_character_sheets_p04_r07_c04');
      this.setFlipX(false);
    }

    // Gentle footstep sounds
    if (isMoving) {
      this.stepTimer += delta;
      if (this.stepTimer > (isRunning ? 260 : 380)) {
        this.stepTimer = 0;
        soundEngine.playStep();
      }
    } else {
      this.stepTimer = 0;
    }

    const interactPressed =
      Phaser.Input.Keyboard.JustDown(this.wasdKeys?.E) ||
      Phaser.Input.Keyboard.JustDown(this.wasdKeys?.SPACE);

    return {
      x: this.x,
      y: this.y,
      isMoving,
      interactPressed,
    };
  }

  public getFacing(): 'down' | 'up' | 'left' | 'right' {
    return this.facing;
  }
}
