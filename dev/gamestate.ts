class GameState {
  public alicePos: [number, number]; // position of the alice in the game in board coordinates
  public cardPositions: [number, number][]; // position of the cards in the game in board coordinates

  constructor(alicePos: [number, number], cardPositions: [number, number][]) {
    this.alicePos = alicePos;
    this.cardPositions = cardPositions;
  }

  // return the value of the state and if the state is terminal (game over)
  // higher value is better gamestate for the alice (100 is win, -100 is lose)
  public getScore(): [number, boolean] {
    for (let z of this.cardPositions) {
      // game over
      if (Board.samePosition(z, this.alicePos)) {
        return [-100, true];
      }
    }

    // win
    if (this.alicePos[1] == 0) {
      return [100, true];
    }

    let aliceScore = this.alicePos[1] * -10;
    return [aliceScore, false];
  }

  // create a copy of the gamestate
  public copy(): GameState {
    const cardPosCopy = Object.assign([], this.cardPositions);

    return new GameState(this.alicePos, cardPosCopy);
  }
}
