import { ElementType, CANVAS_WIDTH, CANVAS_HEIGHT } from '../arkanoidConstants';

export class Ball {
  public x: number;
  public y: number;
  public radius: number = 8;
  public dx: number = 4;
  public dy: number = -4;
  public speed: number = 5;
  public element: ElementType = ElementType.NORMAL;
  public elementTimer: number = 0;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  public update() {
    this.x += this.dx;
    this.y += this.dy;

    if (this.x - this.radius <= 0) {
      this.x = this.radius;
      this.dx *= -1;
    } else if (this.x + this.radius >= CANVAS_WIDTH) {
      this.x = CANVAS_WIDTH - this.radius;
      this.dx *= -1;
    }

    if (this.y - this.radius <= 0) {
      this.y = this.radius;
      this.dy *= -1;
    }

    if (this.element !== ElementType.NORMAL) {
      this.elementTimer--;
      if (this.elementTimer <= 0) {
        this.element = ElementType.NORMAL;
      }
    }
  }

  public setElement(newElement: ElementType, duration: number = 300) {
    this.element = newElement;
    this.elementTimer = duration;
  }

  public draw(ctx: CanvasRenderingContext2D) {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);

    if (this.element === ElementType.FIRE) ctx.fillStyle = '#ef4444';
    else if (this.element === ElementType.ICE) ctx.fillStyle = '#38bdf8';
    else if (this.element === ElementType.LIGHTNING) ctx.fillStyle = '#facc15';
    else ctx.fillStyle = '#ffffff';

    ctx.fill();
    ctx.closePath();
  }

  public reset(x: number, y: number) {
    this.x = x;
    this.y = y;
    this.dx = 4;
    this.dy = -4;
    this.element = ElementType.NORMAL;
  }
}
