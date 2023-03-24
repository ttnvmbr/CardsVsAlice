/// <reference path="gamestate.ts" />

class Game {
  private alice: Alice; // the alice (=player)
  private cards: Card[] = []; // list of cards in the game (=computer/AI)
  private gameOver: boolean = false;
  private gameOverScreen: boolean = false;
  private gameState: GameState; // current gameState (=position of alice and cards)

  private readonly CARDS: number = 4; // number of cards

  private playerTurn: boolean = true; // player has first turn

  constructor() {
    Board.getInstance(); // init board

    // create alice for the player and put on middle of bottom row
    this.alice = new Alice();
    this.alice.initPosition([
      Math.floor(Board.getInstance().getSize() / 2),
      Board.getInstance().getSize() - 1,
    ]);

    // create a list with cards for the AI
    let cardPos: [number, number][] = [];
    for (let c = 0; c < this.CARDS; c++) {
      let z: Card = new Card();
      let pos: [number, number] = [
        Math.floor((c / this.CARDS) * Board.getInstance().getSize()) + 1,
        0,
      ];
      z.initPosition(pos);
      cardPos.push(pos);
      this.cards.push(z);
    }

    // alice and cards are also stored in the gameState for use by the AI
    // !!! when positions are updated, both the gameState and the gameObject should be updated !!!
    this.gameState = new GameState(this.alice.boardPosition, cardPos);

    // register input events
    window.addEventListener("click", (e: MouseEvent) => this.onWindowClick(e));
    window.addEventListener("touchend", (e) =>
      this.onTouchStart(e as TouchEvent)
    );

    // start gameloop
    this.gameLoop();
  }

  // touch input
  private onTouchStart(e: TouchEvent) {
    let touchobj = e.changedTouches[0];
    this.playerMove(touchobj.clientX, touchobj.clientY);
  }

  // mouse input
  private onWindowClick(e: MouseEvent): void {
    this.playerMove(e.x, e.y);
  }

  // move player to tile after touch/mouse input
  private playerMove(x: number, y: number): void {
    // which tile was clicked?
    let boardPos: [number, number] = Board.getInstance().screenToBoardPos([
      x,
      y,
    ]);

    // check if cards are still moving
    let moving = false;
    for (let go of this.cards) {
      if (go.moving) {
        moving = true;
      }
    }

    // only respond to input during player turn when no cards are moving, and not game over
    if (this.playerTurn && !moving && !this.gameOver) {
      let legalMoves: [number, number][] = this.alice.getMoves();

      // check if requested move is a legal move
      for (let m of legalMoves) {
        if (Board.samePosition(m, boardPos)) {
          this.alice.setPosition(boardPos);
          this.gameState.alicePos = boardPos;
          this.playerTurn = false;

          // check win
          if (this.gameState.getScore()[1]) {
            this.gameOver = true;
          }
        }
      }
    } else {
      console.log("Not player turn, yet");
    }
  }

  private showGameOver() {
    if (this.gameOverScreen) return;

    let text =
      this.gameState.getScore()[0] == -100
        ? "Oh no, Alice is captured!"
        : "Alice won!";
    let element = document.createElement("h1");
    element.innerHTML = text;
    element.classList.add("ui");
    document.body.appendChild(element);

    let btn = document.createElement("button");
    btn.innerHTML = "Play again";
    btn.type = "submit";
    element.appendChild(btn);
    btn.onclick = function () {
      window.location.reload();
    };
    btn.classList.add("restart-button");
    document.body.appendChild(btn);

    this.gameOverScreen = true;
  }

  private gameLoop() {
    // move alice
    this.alice.update();

    // move cards
    for (let go of this.cards) {
      go.update();
    }

    // AI needs to make a move if it is not the player's turn
    if (!this.playerTurn) {
      GameAI.moveCard(this.alice, this.cards, this.gameState);
      this.playerTurn = true;

      // check lose
      if (this.gameState.getScore()[1]) {
        this.gameOver = true;
      }
    }

    if (this.gameOver) {
      this.showGameOver();
    }

    requestAnimationFrame(() => this.gameLoop());
  }
}

console.log("Start AI Chess");
window.addEventListener("load", () => new Game());
