import Phaser from 'phaser';

export class Wildlife extends Phaser.Physics.Arcade.Sprite {
  private wanderTimer = 0;
  private changeInterval = 2500;
  private startX: number;
  private startY: number;
  private maxRoam = 80;

  constructor(scene: Phaser.Scene, x: number, y: number, frame: string, species = 'hare') {
    super(scene, x, y, 'wildlife_sprite', frame);
    this.startX = x;
    this.startY = y;

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setDisplaySize(24, 24);
    this.setSize(16, 16);
    this.setDepth(y + 8);
    this.name = species;
  }

  public updateWildlife(delta: number, playerX?: number, playerY?: number): void {
    // Flee the player when close — the one behavior that makes the valley
    // feel inhabited rather than decorative.
    if (playerX !== undefined && playerY !== undefined) {
      const distToPlayer = Phaser.Math.Distance.Between(this.x, this.y, playerX, playerY);
      const fleeRadius = this.name === 'crane' ? 110 : this.name === 'deer' ? 130 : 80;
      if (distToPlayer < fleeRadius) {
        const fleeAngle = Phaser.Math.Angle.Between(playerX, playerY, this.x, this.y);
        const fleeSpeed = this.name === 'hare' ? 95 : this.name === 'deer' ? 110 : 70;
        this.setVelocity(Math.cos(fleeAngle) * fleeSpeed, Math.sin(fleeAngle) * fleeSpeed);
        this.setFlipX(Math.cos(fleeAngle) < 0);
        this.setDepth(this.y + 8);
        return;
      }
    }

    this.wanderTimer += delta;

    if (this.wanderTimer > this.changeInterval) {
      this.wanderTimer = 0;
      this.changeInterval = 2000 + Math.random() * 3500;

      // 40% chance to pause peacefully
      if (Math.random() < 0.45) {
        this.setVelocity(0, 0);
        return;
      }

      const angle = Math.random() * Math.PI * 2;
      const speed = 25 + Math.random() * 20;

      // Avoid roaming too far from origin habitat
      const distFromStart = Phaser.Math.Distance.Between(this.x, this.y, this.startX, this.startY);
      if (distFromStart > this.maxRoam) {
        const returnAngle = Phaser.Math.Angle.Between(this.x, this.y, this.startX, this.startY);
        this.setVelocity(Math.cos(returnAngle) * speed, Math.sin(returnAngle) * speed);
        this.setFlipX(Math.cos(returnAngle) < 0);
      } else {
        const vx = Math.cos(angle) * speed;
        const vy = Math.sin(angle) * speed;
        this.setVelocity(vx, vy);
        this.setFlipX(vx < 0);
      }
    }

    this.setDepth(this.y + 8);
  }
}
