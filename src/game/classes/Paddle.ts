import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../arkanoidConstants';

export class Paddle {
  public width: number = 90;
  public height: number = 14;
  public x: number = (CANVAS_WIDTH - this.width) / 2;
  public y: number = CANVAS_HEIGHT - 35;
  public speed: number = 8;
  public isExpanded: boolean = false;
  public expandTimer: number = 0;
  public laserActive: boolean = false;
  public laserTimer: number = 0;

  public update(moveDir: 'left' | 'right' | 'none') {
    if (moveDir === 'left') {
      this.x = Math.max(0, this.x - this.speed);
    } else if (moveDir === 'right') {
      this.x = Math.min(CANVAS_WIDTH - this.width, this.x + this.speed);
    }

    if (this.isExpanded) {
      this.expandTimer--;
      if (this.expandTimer <= 0) {
        this.width = 90;
        this.isExpanded = false;
      }
    }

    if (this.laserActive) {
      this.laserTimer--;
      if (this.laserTimer <= 0) {
        this.laserActive = false;
      }
    }
  }

  public expand() {
    if (!this.isExpanded) {
      this.width = 130;
      this.isExpanded = true;
    }
    this.expandTimer = 400;
  }

  public enableLaser() {
    this.laserActive = true;
    this.laserTimer = 400;
  }

  public draw(ctx: CanvasRenderingContext2D) {
    ctx.fillStyle = this.laserActive ? '#f97316' : '#6366f1';
    ctx.fillRect(this.x, this.y, this.width, this.height);
    ctx.strokeStyle = '#a855f7';
    ctx.lineWidth = 2;
    ctx.strokeRect(this.x, this.y, this.width, this.height);
  }
}
