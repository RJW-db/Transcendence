export class PongGame {
  public matchId: number;
  public roomId: string;
  public p1Id: number; // Store the ID of Player 1
  public p2Id: number; // Store the ID of Player 2
  public end = false;

  public state = {
    ball: { x: 400, y: 300, dx: -2, dy: 2 },
    p1X: 50,
    p1Y: 250,
    p2X: 740,
    p2Y: 250,
    score: { p1: 0, p2: 0 }
  };

  //Size of window and radius of ball
  private xlen: number = 800;
  private ylen: number = 600;
  private radb: number = 10;

  //Paddle limits with ball radius, assuming ball is a single point
  private p1L: number = 50 - this.radb;
  private p1R: number = 60 + this.radb;
  private p1T: number = this.state.p1Y - this.radb;
  private p1B: number = this.state.p1Y + 100 + this.radb;
  private p2L: number = 740 - this.radb;
  private p2R: number = 750 + this.radb;
  private p2T: number = this.state.p2Y - this.radb;
  private p2B: number = this.state.p2Y + 100 + this.radb;

  //Check for score change or wait for delay and check for movement input
  private isReset = false;
  private paddleChange = false;

  constructor(matchId: number, roomId: string, p1Id: number, p2Id: number) {
    this.matchId = matchId;
    this.roomId = roomId;
    this.p1Id = p1Id;
    this.p2Id = p2Id;
  }

  //Setup match for first start, chooses random x direction for first ball
  init() {
    let dir = Math.random();
    if (dir > 0.5)
      this.reset(1);
    else
      this.reset(-1);
    
  }

  //Pause timer
  delay(ms: number) {
    return new Promise( resolve => setTimeout(resolve, ms) );
  }

  //Updates paddle boundries after movement input;
  updatePaddleY() {
    this.p1T = this.state.p1Y - this.radb;
    this.p1B = this.state.p1Y + 100 + this.radb;
    this.p2T = this.state.p2Y - this.radb;
    this.p2B = this.state.p2Y + 100 + this.radb;
  }

  //Resets match after point or set for first round
  async reset(player: number) {
    this.isReset = true;
    this.state.ball.x = this.xlen/2;
    this.state.ball.y = this.ylen/2;
    this.state.ball.dx = 3 * player / 2;
    this.state.ball.dy = (Math.random() * 3 - 1.5) / 2;
    // this.state.ball.x = 60;
    // this.state.ball.y = 450;
    // this.state.ball.dx = -0.05;
    // this.state.ball.dy = -0.1;
    this.state.p1Y = this.ylen/2 - 50;
    this.state.p2Y = this.ylen/2 - 50;
    this.updatePaddleY();
    await this.delay(1000);
    this.isReset = false;
  }

  //Calculates speed for changing of angle after hitting paddle,
  //based on distance from middle of paddle with max angle to prevent
  //x of zero or x in wrong direction
  angleX(paddleY: number) {
    const maxAngle = Math.PI/3;
    let player = 1;
    if (this.state.ball.dx > 0 )
      player = -1;
    let posY = (paddleY + 50 - this.state.ball.y);
    let offsetY = posY / 50;
    let angle = offsetY * maxAngle;
    // console.log(`${this.state.ball.x} --- ${this.state.ball.dx}`);
    let speed = Math.sqrt(Math.pow(this.state.ball.dx, 2) + Math.pow(this.state.ball.dy, 2));
    this.state.ball.dx = speed * Math.cos(angle);
    this.state.ball.dy = speed * -Math.sin(angle);

    this.state.ball.dx *= player;
    // console.log(`${this.state.ball.x} --- ${this.state.ball.dx} ${player}`);

  }

  //Calculates collision based on boundries of left or right paddle
  checkCollision(L: number, R: number, T: number, B: number) {

    let newX = this.state.ball.x + this.state.ball.dx;
    let newY = this.state.ball.y + this.state.ball.dy;
    let curX = this.state.ball.x;
    let curY = this.state.ball.y;

    let tx = Infinity;
    let ty = Infinity;

    //Check if paddle moved over ball, move ball slightly above or
    //below paddle depending on position of ball
    if (curX > L && curX < R && curY > T && curY < B) {
      if (this.state.ball.y > T + 2 * this.radb)
        this.state.ball.y = B + 0.5;
      else
        this.state.ball.y = T + 0.5;
    }

    //Check which side of the paddle we would hit based on direction
    //if previous pos is before that side and next pos is after,
    //then we have had a collision and we calculate how much percent
    //of one movement speed step we moved to encounter the collision
    if (this.state.ball.dx < 0 && curX >= R && newX < R)
      tx = (R - curX) / this.state.ball.dx;
    else if (this.state.ball.dx > 0 && curX <= L && newX > L)
      tx = (L - curX) / this.state.ball.dx;

    //Same as above but now for the horizontal paddle collision
    if (this.state.ball.dy > 0 && curY <= T && newY > T)
      ty = (T - curY) / this.state.ball.dy;
    else if (this.state.ball.dy < 0 && curY >= B && newY < B)
      ty = (B - curY) / this.state.ball.dy;

    let hitX = false;
    let hitY = false;

    //Checks for y intersect at the x intersect and sets hitX to true
    //if found
    if (tx >= 0 && tx <= 1) {
      let yAtTx = curY + tx * (this.state.ball.dy);
      if (yAtTx >= T && yAtTx <= B)
        hitX = true;
    }
    //Same as above but for x intersect at y
    if (ty >= 0 && ty <= 1) {
      let xAtTy = curX + ty * (this.state.ball.dx);
      if (xAtTy >= L && xAtTy <= R)
        hitY = true;
    }

    //Handles one or both found intersects
    if (hitX || hitY) {
      let t = 0;
      let changeAngle = false;

      //If it hits directly on the corner both directions get flipped
      //and speed gets increased
      if (hitX && hitY && tx === ty) {
        this.state.ball.dx *= -1.1;
        this.state.ball.dy *= -1.1;
        t = tx;
      }
      //If an x intersect has been found and no y intersect or the y
      //intersect is larger, we increase the speed and prepare to
      //change the angle
      else if (hitX && (!hitY || tx < ty)) {
        this.state.ball.dx *= 1.1;
        this.state.ball.dy *= 1.1;
        changeAngle = true;
        t = tx
      }
      //If the top or bottom of the paddle has been hit the y 
      //directiong gets flipped
      else if (hitY) {
        this.state.ball.dy *= -1;
        t = ty;
      }

      //Calculate the x and y position of the ball on intersect
      //based on timestep before collision
      this.state.ball.x = curX + t * (newX - curX);
      this.state.ball.y = curY + t * (newY - curY);

      //Changes angle if paddle side has been hit
      if (changeAngle)
        this.angleX(T);

      //Updates the balls position with the remaining timestep in the
      //direction
      this.state.ball.x += this.state.ball.dx * (1 - t);
      this.state.ball.y += this.state.ball.dy * (1 - t);
      
      return true;
    }
    return false;
  }
  
  update() {
    if (this.isReset === true)
      return;

    // Paddlechange false needs to be done before end of function, not at start
    this.paddleChange = false;
    // console.log(`${this.state.ball.x}, ${this.state.ball.y}\n`);
    // 1. Test next ball position

    //Calls the paddle collision check with 1 paddle's boundries based
    //on direction, exits if collision found
    if (this.state.ball.dx < 0) {
      if (this.checkCollision(this.p1L, this.p1R, this.p1T,this.p1B))
        return;
    }
    else {
      if (this.checkCollision(this.p2L, this.p2R, this.p2T,this.p2B))
        return;
    }

    let newX = this.state.ball.x + this.state.ball.dx;
    let newY = this.state.ball.y + this.state.ball.dy;
    let t = 0;

    //Check for horizontal wall collision and we update the ball
    //and exit
    if (newY - this.radb <= 0 || newY + this.radb >= this.ylen) {
      if (this.state.ball.dy > 0)
        t = (this.ylen - this.radb - this.state.ball.y) / this.state.ball.dy
      else if (this.state.ball.dy < 0)
        t = (this.state.ball.y - this.radb) / this.state.ball.dy * -1;
      this.state.ball.y += t * this.state.ball.dy
      this.state.ball.dy *= -1;
      this.state.ball.y += (1 - t) * this.state.ball.dy;
      this.state.ball.x = newX;
      this.state.ball.y 
      return ;
    }
    
    //Check for vertical wall collision, updates score if found,
    //resets all the positions and exits
    if (newX - this.radb <= 0 || newX + this.radb >= this.xlen) {
      if (newX < this.xlen / 2) {
        this.state.score.p2 += 1;
        this.reset(1);
      }
      else {
        this.state.score.p1 += 1;
        this.reset(-1);
      }
      if (this.state.score.p1 === -1 || this.state.score.p2 === -1)
        this.end = true;
      return ;
    }

    //If no collisions found, update ball to new position
    this.state.ball.x = newX;
    this.state.ball.y = newY;
  }

  // Instead of passing 'p1' or 'p2', we pass the userId
  // The game engine decides which paddle to move
  handleInput(userId: number, action: 'up' | 'down') {
    let pLimT = 0, pLimB = 0;
    
    //Limit to 1 paddle move per frame
    if (this.paddleChange === true)
      return;

    //Check which user gives input
    if (userId === this.p1Id) {
      //Check where ball is to prevent trapping ball between paddle
      //and border
      if (this.state.ball.x >= this.p1L && this.state.ball.x <= this.p1R) {
        if (this.state.ball.y >= this.p1B)
          pLimB = 2 * this.radb + 1;
        else
          pLimT = 2 * this.radb + 1;
      }
      //Updates paddle, limiting top and bottom border, including
      //limit if trapping ball
      this.state.p1Y += (action === 'up' ? -5 : 5);
      if (this.state.p1Y > this.ylen - 100 - pLimB)
        this.state.p1Y = this.ylen - 100 - pLimB;
      if (this.state.p1Y < 0 + pLimT)
        this.state.p1Y = 0 + pLimT;
    }
    //Same as above but for p2
    else if (userId === this.p2Id) {
      if (this.state.ball.x >= this.p2L && this.state.ball.x <= this.p2R) {
        if (this.state.ball.y >= this.p2B)
          pLimB = 2 * this.radb + 1;
        else
          pLimT = 2 * this.radb + 1;
      }
      this.state.p2Y += (action === 'up' ? -5 : 5);
      if (this.state.p2Y > this.ylen - 100 - pLimB)
        this.state.p2Y = this.ylen - 100 - pLimB;
      if (this.state.p2Y < 0 + pLimT)
        this.state.p2Y = 0 + pLimT;
    }
    this.updatePaddleY();
    this.paddleChange = true;
    // If userId matches neither, ignore (spectator trying to cheat)
  }
}