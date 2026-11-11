import { CANVAS_WIDTH, CANVAS_HEIGHT, BrickType, ElementType, PowerUp } from './arkanoidConstants';
import { Ball } from './classes/Ball';
import { Paddle } from './classes/Paddle';
import { Brick } from './classes/Brick';
import { Boss } from './classes/Boss';
import { RewindManager } from './classes/RewindManager';
import { SoundManager } from './classes/SoundManager';

interface Particle {
  x: number;
  y: number;
  dx: number;
  dy: number;
  size: number;
  color: string;
  alpha: number;
  life: number;
}

interface LightningBolt {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  alpha: number;
}

interface BossProjectile {
  x: number;
  y: number;
  width: number;
  height: number;
  dy: number;
}

export class ArkanoidEngine {
  public paddle: Paddle;
  public balls: Ball[] = [];
  public bricks: Brick[] = [];
  public powerUps: PowerUp[] = [];
  public particles: Particle[] = [];
  public lightningBolts: LightningBolt[] = [];
  public bossProjectiles: BossProjectile[] = []; // <-- Tiros ativos do Boss
  public boss: Boss;
  public rewindManager: RewindManager;

  public score: number = 0;
  public lives: number = 3;
  public level: number = 1;
  public isGameOver: boolean = false;
  public isVictory: boolean = false;
  public bossMode: boolean = false;
  public moveDir: 'left' | 'right' | 'none' = 'none';

  private consecutiveBreakCount: number = 0;
  private bossAttackTimer: number = 0;
  private nextLifeMilestone: number = 10000;

  constructor() {
    this.paddle = new Paddle();
    this.boss = new Boss();
    this.rewindManager = new RewindManager();
    this.initLevel();
  }

  public initLevel() {
    this.powerUps = [];
    this.bricks = [];
    this.particles = [];
    this.lightningBolts = [];
    this.bossProjectiles = [];
    this.consecutiveBreakCount = 0;
    this.bossAttackTimer = 0;

    const initialBallCount = Math.min(3, this.level);
    this.balls = [];

    for (let i = 0; i < initialBallCount; i++) {
      const startX = CANVAS_WIDTH / 2 + (i - (initialBallCount - 1) / 2) * 35;
      const ball = new Ball(startX, CANVAS_HEIGHT - 60);
      const angleOffset = (i - (initialBallCount - 1) / 2) * 1.5;
      ball.dx = 4 + angleOffset;
      ball.dy = -4 - this.level * 0.15;
      this.balls.push(ball);
    }

    if (this.level === 3) {
      this.bossMode = true;
      this.boss.active = true;
      this.boss.hp = 20;
      this.boss.maxHp = 20;
    } else if (this.level === 4) {
      this.bossMode = true;
      this.boss.active = true;
      this.boss.hp = 25;
      this.boss.maxHp = 25;
    } else if (this.level === 5) {
      this.bossMode = true;
      this.boss.active = true;
      this.boss.hp = 30;
      this.boss.maxHp = 30;
    } else if (this.level % 3 === 0 && this.level > 5) {
      this.bossMode = true;
      this.boss.active = true;
      this.boss.hp = 5 + this.level * 5;
      this.boss.maxHp = this.boss.hp;
    } else {
      this.bossMode = false;
      this.boss.active = false;
      const rows = 5;
      const cols = 9;
      const offsetX = 24;
      const offsetY = 55;

      const rowColors = ['#f87171', '#fb923c', '#facc15', '#60a5fa', '#34d399'];

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          let type = BrickType.NORMAL;
          let hp = rows - r;

          if (r === 1 && c % 3 === 0) {
            type = BrickType.EXPLOSIVE;
          } else if (r === 2 && (c === 2 || c === 6)) {
            type = BrickType.PORTAL;
            hp = 2;
          }

          this.bricks.push(new Brick(offsetX + c * 48, offsetY + r * 23, type, hp, rowColors[r]));
        }
      }
    }
  }

  private createExplosion(x: number, y: number, color: string) {
    const particleCount = 14;
    for (let i = 0; i < particleCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 3.5 + 1;
      this.particles.push({
        x: x + 23,
        y: y + 11,
        dx: Math.cos(angle) * speed,
        dy: Math.sin(angle) * speed,
        size: Math.random() * 3.5 + 1.5,
        color: color,
        alpha: 1.0,
        life: 1.0,
      });
    }
  }

  private triggerChainLightning(sourceBrick: Brick) {
    const spreadRadius = 65;

    this.bricks.forEach((targetBrick) => {
      if (!targetBrick.status || targetBrick === sourceBrick) return;

      const srcCenterX = sourceBrick.x + sourceBrick.width / 2;
      const srcCenterY = sourceBrick.y + sourceBrick.height / 2;
      const tgtCenterX = targetBrick.x + targetBrick.width / 2;
      const tgtCenterY = targetBrick.y + targetBrick.height / 2;

      const distance = Math.hypot(tgtCenterX - srcCenterX, tgtCenterY - srcCenterY);

      if (distance <= spreadRadius) {
        targetBrick.hit();

        this.lightningBolts.push({
          x1: srcCenterX,
          y1: srcCenterY,
          x2: tgtCenterX,
          y2: tgtCenterY,
          alpha: 1.0,
        });

        this.createExplosion(targetBrick.x, targetBrick.y, '#38bdf8');

        if (!targetBrick.status) {
          this.score += 150;
        }
      }
    });
  }

  public update() {
    if (this.isGameOver || this.isVictory) return;

    this.paddle.update(this.moveDir);

    if (this.score >= this.nextLifeMilestone) {
      this.lives++;
      SoundManager.playExtraLife();
      this.nextLifeMilestone += 10000;
    }

    if (this.bossMode && this.boss.active) {
      this.boss.update();
      this.bossAttackTimer++;

      if (this.bossAttackTimer >= 90) {
        this.bossAttackTimer = 0;
        this.bossProjectiles.push({
          x: this.boss.x + this.boss.width / 2 - 6,
          y: this.boss.y + this.boss.height,
          width: 12,
          height: 16,
          dy: 4 + this.level * 0.3,
        });
        SoundManager.playBrickHit();
      }
    }

    this.bossProjectiles.forEach((proj, idx) => {
      proj.y += proj.dy;

      if (
        proj.x + proj.width >= this.paddle.x &&
        proj.x <= this.paddle.x + this.paddle.width &&
        proj.y + proj.height >= this.paddle.y &&
        proj.y <= this.paddle.y + this.paddle.height
      ) {
        SoundManager.playLoseLife();
        this.lives--;
        this.bossProjectiles.splice(idx, 1);

        if (this.lives <= 0) {
          this.isGameOver = true;
          SoundManager.playGameOver();
        }
      }

      if (proj.y > CANVAS_HEIGHT) {
        this.bossProjectiles.splice(idx, 1);
      }
    });

    this.particles.forEach((p, idx) => {
      p.x += p.dx;
      p.y += p.dy;
      p.life -= 0.035;
      p.alpha = Math.max(0, p.life);
      if (p.life <= 0) {
        this.particles.splice(idx, 1);
      }
    });

    this.lightningBolts.forEach((bolt, idx) => {
      bolt.alpha -= 0.08;
      if (bolt.alpha <= 0) {
        this.lightningBolts.splice(idx, 1);
      }
    });

    if (this.balls.length > 0) {
      this.rewindManager.recordState(this.balls[0], this.paddle);
    }

    this.balls.forEach((ball, index) => {
      ball.update();

      if (ball.y - ball.radius <= 52 && ball.dy < 0 && ball.element !== ElementType.FIRE) {
        ball.element = ElementType.FIRE;
        ball.dy = Math.abs(ball.dy);
        this.consecutiveBreakCount = 0;
        SoundManager.playPowerUp();
      }

      if (ball.element === ElementType.FIRE && ball.y < 15) {
        ball.y = 15;
        ball.dy = Math.abs(ball.dy);
      }

      if (
        ball.x + ball.radius >= this.paddle.x &&
        ball.x - ball.radius <= this.paddle.x + this.paddle.width &&
        ball.y + ball.radius >= this.paddle.y &&
        ball.y - ball.radius <= this.paddle.y + this.paddle.height
      ) {
        ball.y = this.paddle.y - ball.radius;
        ball.dy = -Math.abs(ball.dy);
        ball.element = ElementType.NORMAL;
        this.consecutiveBreakCount = 0;
        const hitPoint = ball.x - (this.paddle.x + this.paddle.width / 2);
        ball.dx = hitPoint * 0.15;
        SoundManager.playBounce();
      }

      // --- COLISÃO DA BOLA COM O BOSS ---
      if (this.bossMode && this.boss.active) {
        if (
          ball.x >= this.boss.x &&
          ball.x <= this.boss.x + this.boss.width &&
          ball.y - ball.radius <= this.boss.y + this.boss.height &&
          ball.y + ball.radius >= this.boss.y
        ) {
          ball.y = this.boss.y + this.boss.height + ball.radius;
          ball.dy *= -1;
          SoundManager.playBrickHit();

          const damage = ball.element === ElementType.FIRE ? 3 : 1;
          const defeated = this.boss.takeDamage(damage);

          if (defeated) {
            if (this.level < 5) {
              this.level++;
              SoundManager.playVictory();
              this.initLevel();
            } else {
              this.isVictory = true;
              SoundManager.playVictory();

              for (let i = 0; i < 120; i++) {
                const colors: string[] = ['#f87171', '#38bdf8', '#facc15', '#34d399', '#c084fc'];
                const randomColor = colors[Math.floor(Math.random() * colors.length)] || '#ffffff';

                this.particles.push({
                  x: this.boss.x + this.boss.width / 2,
                  y: this.boss.y + this.boss.height / 2,
                  dx: (Math.random() - 0.5) * 15,
                  dy: (Math.random() - 0.5) * 15,
                  size: Math.random() * 6 + 2,
                  color: randomColor,
                  alpha: 1.0,
                  life: 3.0,
                });
              }
            }
          }
        }
      }

      this.bricks.forEach((brick) => {
        if (!brick.status) return;

        if (
          ball.x + ball.radius >= brick.x &&
          ball.x - ball.radius <= brick.x + brick.width &&
          ball.y + ball.radius >= brick.y &&
          ball.y - ball.radius <= brick.y + brick.height
        ) {
          SoundManager.playBrickHit();

          if (brick.type === BrickType.PORTAL) {
            ball.x = brick.x + brick.width / 2;
            ball.y = 20;
            ball.element = ElementType.FIRE;
            ball.dx = (Math.random() - 0.5) * 6;
            ball.dy = Math.abs(ball.dy);
            SoundManager.playPowerUp();
            this.createExplosion(brick.x, brick.y, '#c084fc');
          }

          const damage = ball.element === ElementType.FIRE ? brick.hp : 1;
          for (let d = 0; d < damage; d++) {
            brick.hit();
          }

          if (ball.element !== ElementType.FIRE && brick.type !== BrickType.PORTAL) {
            ball.dy *= -1;
          }

          if (!brick.status) {
            this.consecutiveBreakCount++;

            if (this.consecutiveBreakCount >= 5) {
              this.lives++;
              SoundManager.playExtraLife();
              this.consecutiveBreakCount = 0;
            }

            if (ball.element === ElementType.FIRE || Math.random() < 0.3) {
              this.triggerChainLightning(brick);
            }

            let brickColor = '#34d399';
            if (brick.type === BrickType.PORTAL) brickColor = '#c084fc';
            else if (brick.maxHp === 2) brickColor = '#60a5fa';
            else if (brick.maxHp === 3) brickColor = '#facc15';
            else if (brick.maxHp === 4) brickColor = '#fb923c';
            else if (brick.maxHp >= 5) brickColor = '#f87171';

            this.createExplosion(brick.x, brick.y, brickColor);

            this.score += 250;
            if (Math.random() < 0.15) {
              const types: ('laser' | 'expand' | 'multiball' | 'slow' | 'catch' | 'life')[] = [
                'laser',
                'expand',
                'multiball',
                'slow',
                'catch',
                'life',
              ];
              const chosen = types[Math.floor(Math.random() * types.length)]!;
              this.powerUps.push({
                id: Math.random().toString(),
                type: chosen,
                x: brick.x + 15,
                y: brick.y,
                width: 24,
                height: 16,
                dy: 2,
              });
            }
          }
        }
      });

      if (ball.y - ball.radius > CANVAS_HEIGHT) {
        this.balls.splice(index, 1);
        this.consecutiveBreakCount = 0;
      }
    });

    if (this.balls.length === 0) {
      this.lives--;
      this.consecutiveBreakCount = 0;
      if (this.lives <= 0) {
        this.isGameOver = true;
        SoundManager.playGameOver();
      } else {
        SoundManager.playLoseLife();
        const respawnCount = Math.min(3, this.level);
        for (let i = 0; i < respawnCount; i++) {
          const startX = CANVAS_WIDTH / 2 + (i - (respawnCount - 1) / 2) * 35;
          this.balls.push(new Ball(startX, this.paddle.y - 20));
        }
      }
    }

    this.powerUps.forEach((p, idx) => {
      p.y += p.dy;
      if (
        p.x + p.width >= this.paddle.x &&
        p.x <= this.paddle.x + this.paddle.width &&
        p.y + p.height >= this.paddle.y &&
        p.y <= this.paddle.y + this.paddle.height
      ) {
        this.applyPowerUp(p.type);
        this.powerUps.splice(idx, 1);
      }
    });

    if (!this.bossMode && this.bricks.every((b) => !b.status)) {
      this.level++;
      SoundManager.playVictory();
      this.initLevel();
    }
  }

  public triggerRestart() {
    this.score = 0;
    this.lives = 3;
    this.level = 1;
    this.isGameOver = false;
    this.isVictory = false;
    this.consecutiveBreakCount = 0;
    this.nextLifeMilestone = 10000;
    this.initLevel();
  }

  private applyPowerUp(type: string) {
    if (type === 'expand') {
      this.paddle.expand();
      SoundManager.playPowerUp();
    } else if (type === 'laser') {
      this.paddle.enableLaser();
      SoundManager.playPowerUp();
    } else if (type === 'multiball') {
      this.balls.push(new Ball(this.paddle.x, this.paddle.y - 20));
      SoundManager.playPowerUp();
    } else if (type === 'slow') {
      SoundManager.playPowerUp();
    } else if (type === 'catch') {
      SoundManager.playPowerUp();
    } else if (type === 'life') {
      this.lives++;
      SoundManager.playExtraLife();
    }
  }

  public render(ctx: CanvasRenderingContext2D) {
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Linha néon decorativa no topo
    ctx.save();
    const gradient = ctx.createLinearGradient(0, 0, 0, 12);
    gradient.addColorStop(0, 'rgba(249, 115, 22, 0.6)');
    gradient.addColorStop(1, 'rgba(249, 115, 22, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, CANVAS_WIDTH, 12);

    ctx.strokeStyle = 'rgba(249, 115, 22, 0.9)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, 10);
    ctx.lineTo(CANVAS_WIDTH, 10);
    ctx.stroke();
    ctx.restore();

    this.paddle.draw(ctx);
    this.balls.forEach((b) => b.draw(ctx));

    this.bricks.forEach((b) => {
      b.draw(ctx);
      if (b.status && b.type === BrickType.PORTAL) {
        ctx.save();
        ctx.strokeStyle = '#c084fc';
        ctx.lineWidth = 2;
        ctx.shadowBlur = 8;
        ctx.shadowColor = '#c084fc';
        ctx.strokeRect(b.x + 2, b.y + 2, b.width - 4, b.height - 4);
        ctx.restore();
      }
    });

    if (this.bossMode) this.boss.draw(ctx);

    this.bossProjectiles.forEach((proj) => {
      ctx.save();
      ctx.fillStyle = '#ef4444';
      ctx.shadowBlur = 10;
      ctx.shadowColor = '#ef4444';
      ctx.beginPath();
      if (ctx.roundRect) {
        ctx.roundRect(proj.x, proj.y, proj.width, proj.height, 4);
      } else {
        ctx.rect(proj.x, proj.y, proj.width, proj.height);
      }
      ctx.fill();
      ctx.restore();
    });

    this.lightningBolts.forEach((bolt) => {
      ctx.save();
      ctx.globalAlpha = bolt.alpha;
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2.5;
      ctx.shadowBlur = 10;
      ctx.shadowColor = '#38bdf8';
      ctx.beginPath();
      ctx.moveTo(bolt.x1, bolt.y1);
      const midX = (bolt.x1 + bolt.x2) / 2 + (Math.random() * 10 - 5);
      const midY = (bolt.y1 + bolt.y2) / 2 + (Math.random() * 10 - 5);
      ctx.lineTo(midX, midY);
      ctx.lineTo(bolt.x2, bolt.y2);
      ctx.stroke();
      ctx.restore();
    });

    this.particles.forEach((p) => {
      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    this.powerUps.forEach((p) => {
      ctx.save();
      ctx.beginPath();
      const radius = p.height / 2;
      if (ctx.roundRect) {
        ctx.roundRect(p.x, p.y, p.width, p.height, radius);
      } else {
        ctx.rect(p.x, p.y, p.width, p.height);
      }

      if (p.type === 'life') ctx.fillStyle = '#f43f5e';
      else if (p.type === 'expand') ctx.fillStyle = '#34d399';
      else if (p.type === 'laser') ctx.fillStyle = '#f97316';
      else if (p.type === 'multiball') ctx.fillStyle = '#38bdf8';
      else if (p.type === 'slow') ctx.fillStyle = '#a855f7';
      else ctx.fillStyle = '#facc15';

      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      let symbol = '★';
      if (p.type === 'life') symbol = '♥';
      else if (p.type === 'expand') symbol = '↔';
      else if (p.type === 'laser') symbol = '⚡';
      else if (p.type === 'multiball') symbol = '⚽';
      else if (p.type === 'slow') symbol = '⏱';

      ctx.fillText(symbol, p.x + p.width / 2, p.y + p.height / 2);
      ctx.restore();
    });
  }
}
