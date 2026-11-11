export class RewindManager {
  private history: { ball: any; paddle: any }[] = [];
  private maxFrames = 180; // ~3 segundos a 60 FPS

  public recordState(ballState: any, paddleState: any) {
    this.history.push({
      ball: JSON.parse(JSON.stringify(ballState)),
      paddle: JSON.parse(JSON.stringify(paddleState)),
    });
    if (this.history.length > this.maxFrames) {
      this.history.shift();
    }
  }

  public rewind(): { ball: any; paddle: any } | null {
    if (this.history.length > 0) {
      return this.history.shift() || null;
    }
    return null;
  }

  public clear() {
    this.history = [];
  }
}
