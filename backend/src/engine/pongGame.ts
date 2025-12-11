export class PongGame {
  public id: string;
  public state = {
    ball: { x: 50, y: 50, dx: 1, dy: 1 },
    p1Y: 50,
    p2Y: 50,
    score: { p1: 0, p2: 0 }
  };

  constructor(id: string) {
    this.id = id;
  }

  update() {
    // 1. Move Ball
    this.state.ball.x += this.state.ball.dx;
    this.state.ball.y += this.state.ball.dy;

    // 2. Simple Collision / Bouncing logic
    if (this.state.ball.y <= 0 || this.state.ball.y >= 100) {
      this.state.ball.dy *= -1;
    }
    // ... paddle collision logic ...
  }

  handleInput(userId: 'p1' | 'p2', action: 'up' | 'down') {
    if (userId === 'p1') {
      this.state.p1Y += (action === 'up' ? -5 : 5);
    } else {
      this.state.p2Y += (action === 'up' ? -5 : 5);
    }
  }
}