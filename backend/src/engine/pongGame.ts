export class PongGame {
  public id: string;
  public p1Id: number; // Store the ID of Player 1
  public p2Id: number; // Store the ID of Player 2

  public state = {
    ball: { x: 400, y: 300, dx: -4, dy: 0 },
    p1X: 50,
    p1Y: 300,
    p2X: 740,
    p2Y: 300,
    score: { p1: 0, p2: 0 }
  };

  private xlen: number = 800;
  private ylen: number = 600;
  private radb: number = 10;

  private p1L: number = 50 - this.radb;
  private p1R: number = 60 + this.radb;
  private p1T: number = this.state.p1Y - this.radb;
  private p1B: number = this.state.p1Y + 100 + this.radb;
  private p2L: number = 740 - this.radb;
  private p2R: number = 750 + this.radb;
  private p2T: number = this.state.p2Y - this.radb;
  private p2B: number = this.state.p2Y + 100 + this.radb;

  private x: number = this.state.ball.x;
  private y: number = this.state.ball.y;

  private isReset = false;
  // constructor(id: string) {
  //   this.id = id;
  // }

 constructor(id: string, p1Id: number, p2Id: number) {
    this.id = id;
    this.p1Id = p1Id;
    this.p2Id = p2Id;
  }

  delay(ms: number) {
    return new Promise( resolve => setTimeout(resolve, ms) );
  }

  updatePaddleY() {
    this.p1T = this.state.p1Y - this.radb;
    this.p1B = this.state.p1Y + 100 + this.radb;
    this.p2T = this.state.p2Y - this.radb;
    this.p2B = this.state.p2Y + 100 + this.radb;
  }

  async resetball() {
    this.isReset = true;
    this.state.ball.x = this.xlen/2;
    this.state.ball.y = this.ylen/2;
    this.state.ball.dx = 2;
    this.state.ball.dy = 2;
    this.state.p1Y = this.ylen/2;
    this.state.p2Y = this.ylen/2;
    this.updatePaddleY();
    await this.delay(1000);
    this.isReset = false;
  }

  update() {
    if (this.isReset === true)
      return;
    // console.log(`${this.state.ball.x}, ${this.state.ball.y}\n`);
    // 1. Test next ball position
    this.x = this.state.ball.x + this.state.ball.dx;
    this.y = this.state.ball.y + this.state.ball.dy;
    
    // 2. Horizontal wall collision
    if (this.y - this.radb <= 0 || this.y + this.radb >= this.ylen) {
      this.state.ball.dy *= -1;
      return ;
    }
    
    // 3. Vertical wall collision / score update
    if (this.x - this.radb <= 0 || this.x + this.radb >= this.xlen) {
      if (this.x < this.xlen / 2)
        this.state.score.p1 += 1;
      else
        this.state.score.p2 += 1;
      this.resetball();
      return ;
    }
    // console.log(`${this.p2T}, ${this.p2B}`);
    // 4. Left Paddle collision
    if (this.x >= this.p1L && this.x <= this.p1R && this.y >= this.p1T && this.y <= this.p1B) {
      // return;
      // console.log(`${this.p1T}, ${this.p1B}`);
      let hor = 0, ver = 0;
      ver = (this.state.ball.x - this.p1R) / this.state.ball.dx * -1;
      // If dy = 0, can't touch top or bottom
      if (this.state.ball.dy > 0)
        hor = (this.p1T - this.state.ball.y) / this.state.ball.dy;
      else if (this.state.ball.dy < 0)
        hor = (this.state.ball.y - this.p1B) / this.state.ball.dy * -1;
      // console.log(`${hor}, ${ver}`);
      this.state.ball.x += ver * this.state.ball.dx;
      this.state.ball.y += hor * this.state.ball.dy;
      // console.log(`${this.state.ball.x}, ${this.state.ball.y}\n`);

      if (hor > ver)
        this.state.ball.dy *= -1;
      else if (hor < ver)
        this.state.ball.dx *= -1;
      else {
        this.state.ball.dy *= -1;
        this.state.ball.dx *= -1;
      }
      this.state.ball.x += (1 - ver) * this.state.ball.dx;
      this.state.ball.y += (1 - hor) * this.state.ball.dy;
    }

    // 5. Right Paddle collision
    else if (this.x >= this.p2L && this.x <= this.p2R && this.y >= this.p2T && this.y <= this.p2B) {
      let hor = 0, ver = 0;
      // console.log(`${this.state.ball.x}, ${this.state.ball.y}\n`);
      ver = (this.p2L - this.state.ball.x) / this.state.ball.dx;
      if (this.state.ball.dy > 0)
        hor = (this.p2T - this.state.ball.y) / this.state.ball.dy;
      else if (this.state.ball.dy < 0)
        hor = (this.state.ball.y - this.p2B) / this.state.ball.dy * -1;

      this.state.ball.x += ver * this.state.ball.dx;
      this.state.ball.y += hor * this.state.ball.dy;

      if (hor > ver)
        this.state.ball.dy *= -1;
      else if (hor < ver)
        this.state.ball.dx *= -1;
      else {
        // this.state.ball.dy *= -1;
        // this.state.ball.dx *= -1;
      }
      this.state.ball.x += (1 - ver) * this.state.ball.dx;
      this.state.ball.y += (1 - hor) * this.state.ball.dy;
    }
    // ... paddle collision logic ...
    else {
      this.state.ball.x = this.x;
      this.state.ball.y = this.y;
    }
  }

  // handleInput(userId: 'p1' | 'p2', action: 'up' | 'down') {
  //   if (userId === 'p1') {
  //     this.state.p1Y += (action === 'up' ? -5 : 5);
  //   } else {
  //     this.state.p2Y += (action === 'up' ? -5 : 5);
  //   }
  // }

    // Instead of passing 'p1' or 'p2', we pass the userId
  // The game engine decides which paddle to move
  handleInput(userId: number, action: 'up' | 'down') {
    if (userId === this.p1Id) {
      // Move Player 1 Paddle
      this.state.p1Y += (action === 'up' ? -10 : 10);
      if (this.state.p1Y > this.ylen - 100)
        this.state.p1Y = this.ylen - 100;
      if (this.state.p1Y < 0)
        this.state.p1Y = 0;
      // this.p1T += (action === 'up' ? -10 : 10);
      // this.p1B += (action === 'up' ? -10 : 10);
    } 
    else if (userId === this.p2Id) {
      // Move Player 2 Paddle
      this.state.p2Y += (action === 'up' ? -10 : 10);
      if (this.state.p2Y > this.ylen - 100)
        this.state.p2Y = this.ylen - 100;
      if (this.state.p2Y < 0)
        this.state.p2Y = 0;
      // this.p2T += (action === 'up' ? -10 : 10);
      // this.p2B += (action === 'up' ? -10 : 10);
    }
    this.updatePaddleY();
    // If userId matches neither, ignore (spectator trying to cheat)
  }
}