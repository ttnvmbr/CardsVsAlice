/// <reference path="card.ts" />

//minimax function
function miniMax(
  board: GameState,
  depth: number,
  isCard: boolean,
  alice: Alice,
  cards: Card[]
): number {
  if (depth === 0) {
    return board.getScore()[0];
  }
  // if win or lose, return score
  let result = board.getScore()[1];
  if (result) {
    return board.getScore()[0];
  }

  if (isCard) {
    let bestScore: number = +Infinity;
    for (let k: number = 0; k < cards.length; k++) {
      let position = board.cardPositions[k];
      let legalMoves: [number, number][] = cards[k].getMoves(position);
      for (let m: number = 0; m < legalMoves.length; m++) {
        let gameCopy = board.copy();
        gameCopy.cardPositions[k] = legalMoves[m];
        let score = miniMax(gameCopy, depth - 1, false, alice, cards);
        if (score + depth < bestScore) {
          bestScore = score + depth;
        }
      }
    }
    return bestScore;
  } else {
    let bestScore: number = -Infinity;
    let position = board.alicePos;
    let legalMoves: [number, number][] = alice.getMoves(position);
    for (let m: number = 0; m < legalMoves.length; m++) {
      let gameCopy = board.copy();
      gameCopy.alicePos = legalMoves[m];
      let score = miniMax(gameCopy, depth - 1, true, alice, cards);
      if (score - depth > bestScore) {
        bestScore = score - depth;
      }
    }
    return bestScore;
  }
}

class GameAI {
  // let the AI choose a move, and update both the
  // card and the gamestate

  public static moveCard(alice: Alice, cards: Card[], gameState: GameState) {
    let t0 = performance.now();
    let bestScore: number = +Infinity;
    let bestPlayer: number = -1;
    let bestMove: [number, number] = [-1, -1];
    let depth: number = 4;
    let isCard: boolean = true;

    for (let k: number = 0; k < cards.length; k++) {
      let legalMoves: [number, number][] = cards[k].getMoves();
      for (let m: number = 0; m < legalMoves.length; m++) {
        let gameCopy = gameState.copy();
        gameCopy.cardPositions[k] = legalMoves[m];
        let score = miniMax(gameCopy, depth, isCard, alice, cards);
        if (score < bestScore) {
          bestScore = score;
          bestMove = legalMoves[m];
          bestPlayer = k;
        }
      }
    }

    cards[bestPlayer].setPosition(bestMove);
    gameState.cardPositions[bestPlayer] = bestMove;

    let t1 = performance.now();
    console.log("AI move took " + (t1 - t0) + " milliseconds.");
  }
}
