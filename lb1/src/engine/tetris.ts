// engine/tetris.ts
import { Piece, GameState } from "./types";
import { createPiece, checkCollision, rotatePiece } from "./utils";

export class Tetris {
    public board: (string | null)[][];
    public currentPiece: Piece | null = null;
    public nextPiece: Piece | null = null;
    public score: number = 0;
    public level: number = 1;
    public lines: number = 0;
    public gameOver: boolean = false;

    constructor(public width: number, public height: number) {
        this.board = this.createBoard();
        this.nextPiece = createPiece();
        this.spawnPiece();
    }

    private createBoard(): (string | null)[][] {
        return Array.from({ length: this.height }, () => Array(this.width).fill(null));
    }

    public spawnPiece(): void {
        this.currentPiece = this.nextPiece || createPiece();
        this.nextPiece = createPiece();

        // Проверяем, можно ли разместить новую фигуру
        if (this.currentPiece && checkCollision(this.board, this.currentPiece)) {
            this.gameOver = true;
        }
    }

    public move(dx: number): void {
        if (!this.currentPiece || this.gameOver) return;

        const newPiece = { ...this.currentPiece, x: this.currentPiece.x + dx };
        if (!checkCollision(this.board, newPiece)) {
            this.currentPiece = newPiece;
        }
    }

    public rotate(direction: number = 1): void {
        if (!this.currentPiece || this.gameOver) return;

        const newPiece = rotatePiece(this.currentPiece, direction);
        if (!checkCollision(this.board, newPiece)) {
            this.currentPiece = newPiece;
        }
    }

    public softDrop(): void {
        if (!this.currentPiece || this.gameOver) return;

        const newPiece = { ...this.currentPiece, y: this.currentPiece.y + 1 };
        if (!checkCollision(this.board, newPiece)) {
            this.currentPiece = newPiece;
            this.score += 1;
        } else {
            this.lockPiece();
        }
    }

    public hardDrop(): void {
        if (!this.currentPiece || this.gameOver) return;

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

    private lockPiece(): void {
        if (!this.currentPiece) return;

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

    private clearLines(): number {
        let linesCleared = 0;
        let y = this.height - 1;

        while (y >= 0) {
            if (this.board[y].every(cell => cell !== null)) {
                // Удаляем линию и добавляем новую пустую сверху
                this.board.splice(y, 1);
                this.board.unshift(Array(this.width).fill(null));
                linesCleared++;
                // Не уменьшаем y, так как нужно проверить новую линию на этой позиции
            } else {
                y--;
            }
        }

        return linesCleared;
    }

    private updateScore(linesCleared: number): void {
        const linePoints = [0, 40, 100, 300, 1200];
        this.score += linePoints[linesCleared] * this.level;
        this.lines += linesCleared;
        this.level = Math.floor(this.lines / 10) + 1;
    }

    public tick(): void {
        if (this.gameOver) return;

        if (!this.currentPiece) {
            this.spawnPiece();
            return;
        }

        const newPiece = { ...this.currentPiece, y: this.currentPiece.y + 1 };
        if (!checkCollision(this.board, newPiece)) {
            this.currentPiece = newPiece;
        } else {
            this.lockPiece();
        }
    }

    public reset(): void {
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