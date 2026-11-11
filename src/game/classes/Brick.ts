import { BrickType } from '../arkanoidConstants';

export class Brick {
  public x: number;
  public y: number;
  public width: number = 47;
  public height: number = 22;
  public type: BrickType;
  public hp: number;
  public maxHp: number;
  public status: boolean = true;
  public color: string;
  public portalTarget: { x: number; y: number } | undefined;

  constructor(
    x: number,
    y: number,
    type: BrickType,
    hp: number = 1,
    color: string = '#34d399',
    portalTarget?: { x: number; y: number },
  ) {
    this.x = x;
    this.y = y;
    this.type = type;
    this.hp = hp;
    this.maxHp = hp;
    this.color = color;
    this.portalTarget = portalTarget;
  }

  public hit(): boolean {
    this.hp--;
    if (this.hp <= 0) {
      this.status = false;
      return true;
    }
    return false;
  }

  public draw(ctx: CanvasRenderingContext2D) {
    if (!this.status) return; // <-- Usa status para blocos, em vez de active

    ctx.save();
    ctx.beginPath();
    const radius = 4;
    if (ctx.roundRect) {
      ctx.roundRect(this.x, this.y, this.width, this.height, radius);
    } else {
      ctx.rect(this.x, this.y, this.width, this.height);
    }

    if (this.type === BrickType.PORTAL) {
      ctx.fillStyle = '#c084fc';
    } else if (this.type === BrickType.EXPLOSIVE) {
      ctx.fillStyle = '#f97316';
    } else {
      if (this.hp >= this.maxHp) {
        ctx.fillStyle = this.color;
      } else if (this.hp === 3) {
        ctx.fillStyle = '#facc15';
      } else if (this.hp === 2) {
        ctx.fillStyle = '#60a5fa';
      } else {
        ctx.fillStyle = '#34d399';
      }
    }

    ctx.fill();
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    if (this.type === BrickType.PORTAL) {
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 10px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('🌀', this.x + this.width / 2, this.y + this.height / 2);
    }

    ctx.restore();
  }
}
