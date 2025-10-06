import { createPiece, checkCollision, rotatePiece } from "./utils";
export class Tetris {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        this.currentPiece = null;
        this.nextPiece = null;
        this.score = 0;
        this.level = 1;
        this.lines = 0;
        this.gameOver = false;
        this.board = this.createBoard();
        this.nextPiece = createPiece();
        this.spawnPiece();
    }
    createBoard() {
        return Array.from({ length: this.height }, () => Array(this.width).fill(null));
    }
    spawnPiece() {
        this.currentPiece = this.nextPiece || createPiece();
        this.nextPiece = createPiece();
        // Проверяем, можно ли разместить новую фигуру
        if (this.currentPiece && checkCollision(this.board, this.currentPiece)) {
            this.gameOver = true;
        }
    }
    move(dx) {
        if (!this.currentPiece || this.gameOver)
            return;
        const newPiece = { ...this.currentPiece, x: this.currentPiece.x + dx };
        if (!checkCollision(this.board, newPiece)) {
            this.currentPiece = newPiece;
        }
    }
    rotate(direction = 1) {
        if (!this.currentPiece || this.gameOver)
            return;
        const newPiece = rotatePiece(this.currentPiece, direction);
        if (!checkCollision(this.board, newPiece)) {
            this.currentPiece = newPiece;
        }
    }
    softDrop() {
        if (!this.currentPiece || this.gameOver)
            return;
        const newPiece = { ...this.currentPiece, y: this.currentPiece.y + 1 };
        if (!checkCollision(this.board, newPiece)) {
            this.currentPiece = newPiece;
            this.score += 1;
        }
        else {
            this.lockPiece();
        }
    }
    hardDrop() {
        if (!this.currentPiece || this.gameOver)
            return;
        let dropDistance = 0;
        let testPiece = { ...this.currentPiece };
        while (!checkCollision(this.board, { ...testPiece, y: testPiece.y + 1 })) {
            testPiece.y++;
            dropDistance++;
        }
        this.currentPiece = testPiece;
        this.score += dropDistance * 2;
        this.lockPiece();
    }
    lockPiece() {
        if (!this.currentPiece)
            return;
        // Помещаем фигуру на доску
        for (let y = 0; y < this.currentPiece.shape.length; y++) {
            for (let x = 0; x < this.currentPiece.shape[y].length; x++) {
                if (this.currentPiece.shape[y][x]) {
                    const boardY = this.currentPiece.y + y;
                    const boardX = this.currentPiece.x + x;
                    if (boardY >= 0 && boardX >= 0 && boardY < this.height && boardX < this.width) {
                        this.board[boardY][boardX] = this.currentPiece.color;
                    }
                }
            }
        }
        // Проверяем заполненные линии
        const linesCleared = this.clearLines();
        this.updateScore(linesCleared);
        this.spawnPiece();
    }
    clearLines() {
        let linesCleared = 0;
        let y = this.height - 1;
        while (y >= 0) {
            if (this.board[y].every(cell => cell !== null)) {
                // Удаляем линию и добавляем новую пустую сверху
                this.board.splice(y, 1);
                this.board.unshift(Array(this.width).fill(null));
                linesCleared++;
                // Не уменьшаем y, так как нужно проверить новую линию на этой позиции
            }
            else {
                y--;
            }
        }
        return linesCleared;
    }
    updateScore(linesCleared) {
        const linePoints = [0, 40, 100, 300, 1200];
        this.score += linePoints[linesCleared] * this.level;
        this.lines += linesCleared;
        this.level = Math.floor(this.lines / 10) + 1;
    }
    tick() {
        if (this.gameOver)
            return;
        if (!this.currentPiece) {
            this.spawnPiece();
            return;
        }
        const newPiece = { ...this.currentPiece, y: this.currentPiece.y + 1 };
        if (!checkCollision(this.board, newPiece)) {
            this.currentPiece = newPiece;
        }
        else {
            this.lockPiece();
        }
    }
    reset() {
        this.board = this.createBoard();
        this.currentPiece = null;
        this.nextPiece = createPiece();
        this.score = 0;
        this.level = 1;
        this.lines = 0;
        this.gameOver = false;
        this.spawnPiece();
    }
}
//# sourceMappingURL=tetris.js.map