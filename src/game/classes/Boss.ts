import { CANVAS_WIDTH } from '../arkanoidConstants';

export class Boss {
  public x: number = 180;
  public y: number = 55;
  public width: number = 80;
  public height: number = 35;
  public hp: number = 20;
  public maxHp: number = 20;
  public active: boolean = false;
  private dir: number = 2;

  constructor() {}

  public update() {
    if (!this.active) return;
    this.x += this.dir;
    if (this.x <= 30 || this.x + this.width >= 420) {
      this.dir *= -1;
    }
  }

  public takeDamage(amount: number): boolean {
    this.hp -= amount;
    if (this.hp <= 0) {
      this.active = false;
      return true;
    }
    return false;
  }

  public draw(ctx: CanvasRenderingContext2D) {
    if (!this.active) return;

    ctx.save();
    ctx.translate(this.x, this.y);

    if (this.maxHp >= 30) {
      // Corpo Principal da Nave
      ctx.fillStyle = '#475569';
      ctx.beginPath();
      ctx.roundRect(0, 10, this.width, this.height - 15, 8);
      ctx.fill();
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = '#38bdf8';
      ctx.shadowBlur = 15;
      ctx.shadowColor = '#38bdf8';
      ctx.beginPath();
      ctx.arc(this.width / 2, 18, 14, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.moveTo(5, 20);
      ctx.lineTo(-15, this.height);
      ctx.lineTo(10, this.height - 5);
      ctx.closePath();
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(this.width - 5, 20);
      ctx.lineTo(this.width + 15, this.height);
      ctx.lineTo(this.width - 10, this.height - 5);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#f97316';
      ctx.fillRect(20, this.height - 5, 12, 8 + Math.sin(Date.now() * 0.02) * 4);
      ctx.fillRect(this.width - 32, this.height - 5, 12, 8 + Math.cos(Date.now() * 0.02) * 4);
    } else {
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.roundRect(0, 0, this.width, this.height, 10);
      ctx.fill();
      ctx.strokeStyle = '#f87171';
      ctx.lineWidth = 3;
      ctx.stroke();
    }

    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, -10, this.width, 6);
    ctx.fillStyle = '#22c55e';
    const hpWidth = (this.hp / this.maxHp) * this.width;
    ctx.fillRect(0, -10, hpWidth, 6);

    ctx.restore();
  }
}
