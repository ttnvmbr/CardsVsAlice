"use strict";
class GameObject extends HTMLElement {
    constructor() {
        super();
        this.pos = [0, 0];
        this.targetPos = [0, 0];
        this.speed = [2, 2];
        this.direction = 1;
        this.moving = false;
        document.body.appendChild(this);
    }
    update() {
        this.moving = false;
        for (let i = 0; i < 2; i++) {
            if (Math.abs(this.targetPos[i] - this.pos[i]) <= this.speed[i]) {
                this.pos[i] = this.targetPos[i];
            }
            else {
                this.moving = true;
            }
        }
        if (this.pos[0] > this.targetPos[0]) {
            this.pos[0] -= this.speed[0];
        }
        else if (this.pos[0] < this.targetPos[0]) {
            this.pos[0] += this.speed[0];
        }
        else if (this.pos[1] > this.targetPos[1]) {
            this.pos[1] -= this.speed[1];
        }
        else if (this.pos[1] < this.targetPos[1]) {
            this.pos[1] += this.speed[1];
        }
        this.style.width = this.width + "px";
        this.style.height = this.height + "px";
        this.style.backgroundSize = this.width + "px " + this.height + "px";
        this.style.transform = "translate(" + this.pos[0] + "px, " + this.pos[1] + "px) scale(" + this.direction + ",1)";
    }
}
class ChessPiece extends GameObject {
    constructor() {
        super();
        this.width = Board.getInstance().getTileSize();
        this.height = Board.getInstance().getTileSize();
    }
    setPosition(pos) {
        this.boardPosition = pos;
        this.targetPos = Board.getInstance().boardToScreenPos(this.boardPosition);
    }
    initPosition(pos) {
        this.setPosition(pos);
        this.pos = Board.getInstance().boardToScreenPos(this.boardPosition);
    }
}
class Alice extends ChessPiece {
    getMoves(from = this.boardPosition) {
        let moves = [];
        for (let i = -1; i < 2; i++) {
            for (let j = -1; j < 2; j++) {
                if (i == 0 && j == 0) {
                    continue;
                }
                let newPos = [from[0] + i, from[1] + j];
                if (Board.getInstance().legalPosition(newPos)) {
                    moves.push(newPos);
                }
            }
        }
        return moves;
    }
}
window.customElements.define("alice-component", Alice);
class Tile extends ChessPiece {
    constructor() {
        super();
        this.width = Board.getInstance().getTileSize();
        this.height = Board.getInstance().getTileSize();
        this.style.backgroundColor = "white";
    }
    setColor(color) {
        this.style.backgroundColor = color;
    }
    update() {
        super.update();
    }
    getMoves() {
        let moves = [];
        return moves;
    }
}
window.customElements.define("tile-component", Tile);
class Board {
    constructor() {
        this.BOARD_SIZE = 9;
        this.tileSize = 100;
        let smallestSide = Math.min(window.innerWidth, window.innerHeight);
        this.tileSize = Math.floor(smallestSide / this.BOARD_SIZE);
    }
    static getInstance() {
        if (Board.instance == null) {
            Board.instance = new Board();
            for (let i = 0; i < Board.getInstance().getSize(); i++) {
                for (let j = 0; j < Board.getInstance().getSize(); j++) {
                    let t = new Tile();
                    t.setColor((i + j) % 2 == 0 ? "#6a994e" : "#31572c");
                    t.initPosition([i, j]);
                    t.update();
                }
            }
        }
        return Board.instance;
    }
    legalPosition(pos) {
        return (pos[0] >= 0 &&
            pos[1] >= 0 &&
            pos[0] < this.BOARD_SIZE &&
            pos[1] < this.BOARD_SIZE);
    }
    getSize() {
        return this.BOARD_SIZE;
    }
    getTileSize() {
        return this.tileSize;
    }
    boardToScreenPos(boardPos) {
        return [boardPos[0] * this.tileSize, boardPos[1] * this.tileSize];
    }
    screenToBoardPos(screenPos) {
        return [
            Math.floor(screenPos[0] / this.tileSize),
            Math.floor(screenPos[1] / this.tileSize),
        ];
    }
    static samePosition(a, b) {
        return a[0] == b[0] && a[1] == b[1];
    }
}
class Card extends ChessPiece {
    getMoves(from = this.boardPosition) {
        let moves = [];
        for (let i = -2; i < 3; i++) {
            for (let j = -2; j < 3; j++) {
                if (Math.abs(i) == Math.abs(j) || i == 0 || j == 0) {
                    continue;
                }
                let newPos = [from[0] + i, from[1] + j];
                if (Board.getInstance().legalPosition(newPos)) {
                    moves.push(newPos);
                }
            }
        }
        return moves;
    }
}
window.customElements.define("card-component", Card);
class GameState {
    constructor(alicePos, cardPositions) {
        this.alicePos = alicePos;
        this.cardPositions = cardPositions;
    }
    getScore() {
        for (let z of this.cardPositions) {
            if (Board.samePosition(z, this.alicePos)) {
                return [-100, true];
            }
        }
        if (this.alicePos[1] == 0) {
            return [100, true];
        }
        let aliceScore = this.alicePos[1] * -10;
        return [aliceScore, false];
    }
    copy() {
        const cardPosCopy = Object.assign([], this.cardPositions);
        return new GameState(this.alicePos, cardPosCopy);
    }
}
class Game {
    constructor() {
        this.cards = [];
        this.gameOver = false;
        this.gameOverScreen = false;
        this.CARDS = 4;
        this.playerTurn = true;
        Board.getInstance();
        this.alice = new Alice();
        this.alice.initPosition([
            Math.floor(Board.getInstance().getSize() / 2),
            Board.getInstance().getSize() - 1,
        ]);
        let cardPos = [];
        for (let c = 0; c < this.CARDS; c++) {
            let z = new Card();
            let pos = [
                Math.floor((c / this.CARDS) * Board.getInstance().getSize()) + 1,
                0,
            ];
            z.initPosition(pos);
            cardPos.push(pos);
            this.cards.push(z);
        }
        this.gameState = new GameState(this.alice.boardPosition, cardPos);
        window.addEventListener("click", (e) => this.onWindowClick(e));
        window.addEventListener("touchend", (e) => this.onTouchStart(e));
        this.gameLoop();
    }
    onTouchStart(e) {
        let touchobj = e.changedTouches[0];
        this.playerMove(touchobj.clientX, touchobj.clientY);
    }
    onWindowClick(e) {
        this.playerMove(e.x, e.y);
    }
    playerMove(x, y) {
        let boardPos = Board.getInstance().screenToBoardPos([
            x,
            y,
        ]);
        let moving = false;
        for (let go of this.cards) {
            if (go.moving) {
                moving = true;
            }
        }
        if (this.playerTurn && !moving && !this.gameOver) {
            let legalMoves = this.alice.getMoves();
            for (let m of legalMoves) {
                if (Board.samePosition(m, boardPos)) {
                    this.alice.setPosition(boardPos);
                    this.gameState.alicePos = boardPos;
                    this.playerTurn = false;
                    if (this.gameState.getScore()[1]) {
                        this.gameOver = true;
                    }
                }
            }
        }
        else {
            console.log("Not player turn, yet");
        }
    }
    showGameOver() {
        if (this.gameOverScreen)
            return;
        let text = this.gameState.getScore()[0] == -100
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
    gameLoop() {
        this.alice.update();
        for (let go of this.cards) {
            go.update();
        }
        if (!this.playerTurn) {
            GameAI.moveCard(this.alice, this.cards, this.gameState);
            this.playerTurn = true;
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
function miniMax(board, depth, isCard, alice, cards) {
    if (depth === 0) {
        return board.getScore()[0];
    }
    let result = board.getScore()[1];
    if (result) {
        return board.getScore()[0];
    }
    if (isCard) {
        let bestScore = +Infinity;
        for (let k = 0; k < cards.length; k++) {
            let position = board.cardPositions[k];
            let legalMoves = cards[k].getMoves(position);
            for (let m = 0; m < legalMoves.length; m++) {
                let gameCopy = board.copy();
                gameCopy.cardPositions[k] = legalMoves[m];
                let score = miniMax(gameCopy, depth - 1, false, alice, cards);
                if (score + depth < bestScore) {
                    bestScore = score + depth;
                }
            }
        }
        return bestScore;
    }
    else {
        let bestScore = -Infinity;
        let position = board.alicePos;
        let legalMoves = alice.getMoves(position);
        for (let m = 0; m < legalMoves.length; m++) {
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
    static moveCard(alice, cards, gameState) {
        let t0 = performance.now();
        let bestScore = +Infinity;
        let bestPlayer = -1;
        let bestMove = [-1, -1];
        let depth = 4;
        let isCard = true;
        for (let k = 0; k < cards.length; k++) {
            let legalMoves = cards[k].getMoves();
            for (let m = 0; m < legalMoves.length; m++) {
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
//# sourceMappingURL=main.js.map