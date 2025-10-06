export const COLORS = [
    "#00e5ff", // neon blue
    "#ff00ff", // neon pink
    "#00ff88", // neon green
    "#a000f0", // neon purple
    "#ffaa00", // neon orange
];
export const SHAPES = [
    [
        [1, 1, 1, 1] // I
    ],
    [
        [1, 1],
        [1, 1] // O
    ],
    [
        [0, 1, 0],
        [1, 1, 1] // T
    ],
    [
        [1, 0, 0],
        [1, 1, 1] // L
    ],
    [
        [0, 0, 1],
        [1, 1, 1] // J
    ],
    [
        [0, 1, 1],
        [1, 1, 0] // S
    ],
    [
        [1, 1, 0],
        [0, 1, 1] // Z
    ]
];
export function createPiece() {
    const shapeIndex = Math.floor(Math.random() * SHAPES.length);
    const colorIndex = Math.floor(Math.random() * COLORS.length);
    return {
        shape: SHAPES[shapeIndex],
        x: Math.floor((10 - SHAPES[shapeIndex][0].length) / 2),
        y: 0,
        color: COLORS[colorIndex]
    };
}
export function checkCollision(board, piece) {
    for (let y = 0; y < piece.shape.length; y++) {
        for (let x = 0; x < piece.shape[y].length; x++) {
            if (piece.shape[y][x]) {
                const boardX = piece.x + x;
                const boardY = piece.y + y;
                // Проверяем выход за границы
                if (boardX < 0 || boardX >= board[0].length || boardY >= board.length) {
                    return true;
                }
                // Проверяем столкновение с другими фигурами (только если внутри игрового поля)
                if (boardY >= 0 && board[boardY][boardX] !== null) { // Проверяем на null
                    return true;
                }
            }
        }
    }
    return false;
}
export function rotatePiece(piece, direction = 1) {
    const shape = piece.shape;
    const rows = shape.length;
    const cols = shape[0].length;
    // Создаем новую матрицу для повернутой фигуры
    const newShape = [];
    if (direction === 1) { // По часовой стрелке
        for (let x = 0; x < cols; x++) {
            newShape[x] = [];
            for (let y = rows - 1; y >= 0; y--) {
                newShape[x][rows - 1 - y] = shape[y][x];
            }
        }
    }
    else { // Против часовой стрелки
        for (let x = cols - 1; x >= 0; x--) {
            newShape[cols - 1 - x] = [];
            for (let y = 0; y < rows; y++) {
                newShape[cols - 1 - x][y] = shape[y][x];
            }
        }
    }
    return {
        ...piece,
        shape: newShape
    };
}
//# sourceMappingURL=utils.js.map