
export interface Piece {
  shape: number[][];
  x: number;
  y: number;
  color: string;
}

export interface GameState {
  board: (string | null)[][];
  currentPiece: Piece | null;
  nextPiece: Piece | null;
  score: number;
  level: number;
  lines: number;
  gameOver: boolean;
}