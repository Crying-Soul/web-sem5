// main.ts
import { Tetris } from "./engine/tetris";
const canvas = document.getElementById("tetris");
const ctx = canvas.getContext("2d", { alpha: false });
const nextCanvas = document.getElementById("next");
const nextCtx = nextCanvas.getContext("2d");
const scoreEl = document.getElementById("score");
const levelEl = document.getElementById("level");
const linesEl = document.getElementById("lines");
const usernameInput = document.getElementById("username");
const btnPause = document.getElementById("btn-pause");
const btnLeaderboard = document.getElementById("btn-leaderboard");
const recentScoresEl = document.getElementById("recent-scores");
// Модальные окна
const startModal = document.getElementById("start-modal");
const pauseModal = document.getElementById("pause-modal");
const gameoverModal = document.getElementById("gameover-modal");
const leaderboardModal = document.getElementById("leaderboard-modal");
// Кнопки модальных окон
const modalInput = document.getElementById("modal-input");
const modalButton = document.getElementById("modal-button");
const resumeButton = document.getElementById("resume-button");
const restartModalButton = document.getElementById("restart-modal-button");
const gameoverRestart = document.getElementById("gameover-restart");
const closeLeaderboard = document.getElementById("close-leaderboard");
const clearLeaderboard = document.getElementById("clear-leaderboard");
// Элементы отображения результатов
const finalScoreEl = document.getElementById("final-score");
const finalLevelEl = document.getElementById("final-level");
const finalLinesEl = document.getElementById("final-lines");
const leaderboardPreviewList = document.getElementById("leaderboard-preview-list");
const gameoverLeaderboard = document.getElementById("gameover-leaderboard");
const leaderboardList = document.getElementById("leaderboard-list");
const TILE = 40;
const C_W = 10;
const C_H = 20;
const LOGICAL_W = C_W * TILE;
const LOGICAL_H = C_H * TILE;
let game = new Tetris(C_W, C_H);
let username = "";
let animationFrameId;
let particleSystems = [];
let paused = false;
class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * 8;
        this.vy = (Math.random() - 0.5) * 8;
        this.life = 1;
        this.maxLife = 1;
        this.color = color;
        this.size = Math.random() * 3 + 1;
    }
    update(dt) {
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        this.vy += 0.1 * dt;
        this.life -= 0.02 * dt;
    }
    draw(ctx) {
        const alpha = this.life / this.maxLife;
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x - this.size / 2, this.y - this.size / 2, this.size, this.size);
        ctx.restore();
    }
}
class ParticleSystem {
    constructor(x, y, color, count = 20) {
        this.particles = [];
        this.x = x;
        this.y = y;
        for (let i = 0; i < count; i++) {
            this.particles.push(new Particle(x, y, color));
        }
    }
    update(dt) {
        this.particles = this.particles.filter(particle => {
            particle.update(dt);
            return particle.life > 0;
        });
    }
    draw(ctx) {
        this.particles.forEach(particle => particle.draw(ctx));
    }
    isAlive() {
        return this.particles.length > 0;
    }
}
// Leaderboard functions
function getLeaderboard() {
    const stored = localStorage.getItem("tetris.leaderboard");
    return stored ? JSON.parse(stored) : [];
}
function saveToLeaderboard(entry) {
    const leaderboard = getLeaderboard();
    // Проверяем, не является ли это дубликатом (по имени и счету)
    const isDuplicate = leaderboard.some(item => item.name === entry.name && item.score === entry.score);
    // Если это не дубликат, добавляем в таблицу
    if (!isDuplicate) {
        leaderboard.push(entry);
    }
    leaderboard.sort((a, b) => b.score - a.score);
    const topScores = leaderboard.slice(0, 20);
    localStorage.setItem("tetris.leaderboard", JSON.stringify(topScores));
    return topScores.findIndex(score => score.date === entry.date && score.name === entry.name) + 1;
}
function getRecentScores() {
    const leaderboard = getLeaderboard();
    return leaderboard
        .sort((a, b) => b.date - a.date)
        .slice(0, 5);
}
function renderLeaderboard(list, container, showCurrent = false) {
    container.innerHTML = '';
    list.forEach((entry, index) => {
        const item = document.createElement('div');
        item.className = 'leaderboard-item';
        if (showCurrent && entry.name === username) {
            item.classList.add('current');
        }
        const date = new Date(entry.date).toLocaleDateString();
        item.innerHTML = `
            <div class="rank">${index + 1}</div>
            <div class="name">${entry.name}</div>
            <div class="score">${entry.score.toLocaleString()}</div>
            <div class="details">Lvl ${entry.level}</div>
        `;
        container.appendChild(item);
    });
    if (list.length === 0) {
        container.innerHTML = '<div style="text-align: center; color: var(--muted); padding: 20px;">Пока нет результатов</div>';
    }
}
function renderRecentScores() {
    const recentScores = getRecentScores();
    recentScoresEl.innerHTML = '';
    if (recentScores.length === 0) {
        recentScoresEl.innerHTML = '<div style="text-align: center; color: var(--muted);">Пока нет результатов</div>';
        return;
    }
    recentScores.forEach(entry => {
        const item = document.createElement('div');
        item.className = 'recent-score-item';
        const date = new Date(entry.date).toLocaleDateString();
        item.innerHTML = `
            <div>
                <div>${entry.name}</div>
                <div class="date">${date}</div>
            </div>
            <div class="score-value">${entry.score.toLocaleString()}</div>
        `;
        recentScoresEl.appendChild(item);
    });
}
function showModal(modal) {
    document.querySelectorAll('.modal-overlay').forEach(m => {
        m.classList.remove('active');
    });
    modal.classList.add('active');
}
function hideAllModals() {
    document.querySelectorAll('.modal-overlay').forEach(m => {
        m.classList.remove('active');
    });
}
function handleGameOver() {
    if (!username) {
        username = "Игрок";
        usernameInput.value = username;
        localStorage.setItem("tetris.username", username);
    }
    if (game.gameOver) {
        const entry = {
            name: username,
            score: game.score,
            level: game.level,
            lines: game.lines,
            date: Date.now()
        };
        const position = saveToLeaderboard(entry);
        finalScoreEl.textContent = game.score.toLocaleString();
        finalLevelEl.textContent = String(game.level);
        finalLinesEl.textContent = String(game.lines);
        const leaderboard = getLeaderboard();
        renderLeaderboard(leaderboard.slice(0, 5), gameoverLeaderboard, true);
        renderRecentScores();
        renderLeaderboard(leaderboard.slice(0, 3), leaderboardPreviewList);
    }
    showModal(gameoverModal);
}
// Event Listeners
modalButton.addEventListener("click", () => {
    if (modalInput.value.trim()) {
        username = modalInput.value.trim();
        localStorage.setItem("tetris.username", username);
        hideAllModals();
        usernameInput.value = username;
        createParticleSystem(LOGICAL_W / 2, LOGICAL_H / 2, "#00e5ff", 50);
        renderRecentScores();
        // Перезапускаем игру при первом входе
        game = new Tetris(C_W, C_H);
        paused = false;
    }
});
modalInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
        modalButton.click();
    }
});
resumeButton.addEventListener("click", () => {
    hideAllModals();
    paused = false;
    btnPause.textContent = "Пауза";
});
restartModalButton.addEventListener("click", () => {
    hideAllModals();
    game = new Tetris(C_W, C_H);
    paused = false;
    btnPause.textContent = "Пауза";
    particleSystems = [];
    createParticleSystem(LOGICAL_W / 2, LOGICAL_H / 2, "#00ff88", 30);
});
gameoverRestart.addEventListener("click", () => {
    hideAllModals();
    game = new Tetris(C_W, C_H);
    paused = false;
    btnPause.textContent = "Пауза";
    particleSystems = [];
    createParticleSystem(LOGICAL_W / 2, LOGICAL_H / 2, "#00ff88", 30);
});
btnLeaderboard.addEventListener("click", () => {
    const leaderboard = getLeaderboard();
    renderLeaderboard(leaderboard, leaderboardList, true);
    showModal(leaderboardModal);
});
closeLeaderboard.addEventListener("click", () => {
    hideAllModals();
});
clearLeaderboard.addEventListener("click", () => {
    if (confirm("Вы уверены, что хотите очистить таблицу рекордов?")) {
        localStorage.removeItem("tetris.leaderboard");
        renderLeaderboard([], leaderboardList);
        renderRecentScores();
        const leaderboard = getLeaderboard();
        renderLeaderboard(leaderboard.slice(0, 3), leaderboardPreviewList);
        renderLeaderboard(leaderboard.slice(0, 5), gameoverLeaderboard, true);
    }
});
// Инициализация
if (localStorage.getItem("tetris.username")) {
    username = localStorage.getItem("tetris.username");
    usernameInput.value = username;
    hideAllModals();
    renderRecentScores();
}
else {
    showModal(startModal);
}
// Показ превью таблицы рекордов при старте
const initialLeaderboard = getLeaderboard();
renderLeaderboard(initialLeaderboard.slice(0, 3), leaderboardPreviewList);
function setupCanvasScale() {
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(LOGICAL_W * dpr);
    canvas.height = Math.round(LOGICAL_H * dpr);
    canvas.style.width = `${LOGICAL_W}px`;
    canvas.style.height = `${LOGICAL_H}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const nextDpr = dpr;
    nextCanvas.width = Math.round(nextCanvas.clientWidth * nextDpr);
    nextCanvas.height = Math.round(nextCanvas.clientHeight * nextDpr);
    nextCtx.setTransform(nextDpr, 0, 0, nextDpr, 0, 0);
}
setupCanvasScale();
window.addEventListener("resize", setupCanvasScale);
function gravityInterval(level) {
    return Math.max(100, 100 * Math.pow(0.8, Math.max(1, level) - 1));
}
let last = performance.now();
let accumulator = 0;
let gravity = gravityInterval(game.level);
function drawGhostPiece(ctx) {
    if (!game.currentPiece)
        return;
    let dropDistance = 0;
    let testPiece = { ...game.currentPiece };
    while (!checkCollision(game.board, { ...testPiece, y: testPiece.y + 1 })) {
        testPiece.y++;
        dropDistance++;
    }
    if (dropDistance === 0)
        return;
    const ghostPiece = { ...game.currentPiece, y: game.currentPiece.y + dropDistance };
    const m = ghostPiece.shape;
    ctx.save();
    ctx.globalAlpha = 0.3;
    for (let y = 0; y < m.length; y++) {
        for (let x = 0; x < m[y].length; x++) {
            if (m[y][x]) {
                const px = ghostPiece.x + x;
                const py = ghostPiece.y + y;
                if (py >= 0) {
                    ctx.strokeStyle = ghostPiece.color;
                    ctx.lineWidth = 2;
                    ctx.strokeRect(px * TILE + 2, py * TILE + 2, TILE - 4, TILE - 4);
                    ctx.fillStyle = ghostPiece.color;
                    ctx.fillRect(px * TILE + 4, py * TILE + 4, TILE - 8, TILE - 8);
                }
            }
        }
    }
    ctx.restore();
}
function checkCollision(board, piece) {
    // Проверяем, что board существует и имеет правильные размеры
    if (!board || board.length === 0 || board[0].length === 0) {
        return false;
    }
    for (let y = 0; y < piece.shape.length; y++) {
        for (let x = 0; x < piece.shape[y].length; x++) {
            if (piece.shape[y][x]) {
                const boardX = piece.x + x;
                const boardY = piece.y + y;
                // Проверка границ
                if (boardX < 0 || boardX >= board[0].length || boardY >= board.length) {
                    return true;
                }
                // Проверка столкновения с другими фигурами (только если boardY >= 0)
                if (boardY >= 0 && board[boardY] && board[boardY][boardX] !== null) {
                    return true;
                }
            }
        }
    }
    return false;
}
function updateParticles(dt) {
    particleSystems = particleSystems.filter(system => {
        system.update(dt);
        return system.isAlive();
    });
}
function createParticleSystem(x, y, color, count = 20) {
    particleSystems.push(new ParticleSystem(x, y, color, count));
}
function render() {
    // Очистка canvas с градиентом
    const gradient = ctx.createLinearGradient(0, 0, 0, LOGICAL_H);
    gradient.addColorStop(0, "#0a1018");
    gradient.addColorStop(1, "#050a12");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, LOGICAL_W, LOGICAL_H);
    // Сетка
    ctx.strokeStyle = "rgba(255, 255, 255, 0.03)";
    ctx.lineWidth = 1;
    for (let x = 0; x <= C_W; x++) {
        ctx.beginPath();
        ctx.moveTo(x * TILE, 0);
        ctx.lineTo(x * TILE, LOGICAL_H);
        ctx.stroke();
    }
    for (let y = 0; y <= C_H; y++) {
        ctx.beginPath();
        ctx.moveTo(0, y * TILE);
        ctx.lineTo(LOGICAL_W, y * TILE);
        ctx.stroke();
    }
    // Отрисовка стакана
    for (let y = 0; y < C_H; y++) {
        for (let x = 0; x < C_W; x++) {
            const cell = game.board[y][x];
            const px = x * TILE;
            const py = y * TILE;
            if (cell) {
                drawTile(ctx, x, y, cell);
            }
            else {
                ctx.fillStyle = "rgba(255, 255, 255, 0.02)";
                ctx.fillRect(px, py, TILE, TILE);
            }
            ctx.strokeStyle = "rgba(0, 0, 0, 0.25)";
            ctx.strokeRect(px + 0.5, py + 0.5, TILE - 1, TILE - 1);
        }
    }
    drawGhostPiece(ctx);
    if (game.currentPiece) {
        drawPiece(ctx, game.currentPiece);
    }
    particleSystems.forEach(system => system.draw(ctx));
    renderPreview(nextCtx, game.nextPiece);
    scoreEl.textContent = game.score.toLocaleString();
    levelEl.textContent = String(game.level);
    linesEl.textContent = String(game.lines);
    if (game.gameOver) {
        ctx.fillStyle = "rgba(2, 2, 8, 0.85)";
        const boxH = 100;
        ctx.fillRect(0, (LOGICAL_H / 2) - (boxH / 2), LOGICAL_W, boxH);
        ctx.fillStyle = "#fff";
        ctx.font = "bold 24px Inter, Arial";
        ctx.textAlign = "center";
        ctx.fillText("GAME OVER", LOGICAL_W / 2, LOGICAL_H / 2 - 10);
        ctx.font = "16px Inter, Arial";
        ctx.fillText("Нажми Рестарт", LOGICAL_W / 2, LOGICAL_H / 2 + 20);
        handleGameOver();
    }
}
function drawTile(ctx, x, y, color) {
    const px = x * TILE;
    const py = y * TILE;
    ctx.fillStyle = color;
    ctx.fillRect(px + 1, py + 1, TILE - 2, TILE - 2);
    ctx.shadowColor = color;
    ctx.shadowBlur = 10;
    ctx.fillRect(px + 1, py + 1, TILE - 2, TILE - 2);
    ctx.shadowBlur = 0;
    const gradient = ctx.createLinearGradient(px, py, px, py + TILE);
    gradient.addColorStop(0, "rgba(255, 255, 255, 0.3)");
    gradient.addColorStop(0.5, "rgba(255, 255, 255, 0.1)");
    gradient.addColorStop(1, "transparent");
    ctx.fillStyle = gradient;
    ctx.fillRect(px + 2, py + 2, TILE - 4, TILE / 2);
    ctx.strokeStyle = "rgba(0, 0, 0, 0.4)";
    ctx.lineWidth = 1;
    ctx.strokeRect(px + 1, py + 1, TILE - 2, TILE - 2);
}
function drawPiece(ctx, piece) {
    const m = piece.shape;
    for (let y = 0; y < m.length; y++) {
        for (let x = 0; x < m[y].length; x++) {
            if (m[y][x]) {
                const px = piece.x + x;
                const py = piece.y + y;
                if (py >= 0) {
                    drawTile(ctx, px, py, piece.color);
                }
            }
        }
    }
}
function renderPreview(ctx, piece) {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    const gradient = ctx.createLinearGradient(0, 0, 0, ctx.canvas.height);
    gradient.addColorStop(0, "rgba(255, 255, 255, 0.05)");
    gradient.addColorStop(1, "rgba(255, 255, 255, 0.02)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
    ctx.lineWidth = 1;
    ctx.strokeRect(0.5, 0.5, ctx.canvas.width - 1, ctx.canvas.height - 1);
    if (!piece)
        return;
    const m = piece.shape;
    const scale = 20;
    const offsetX = (ctx.canvas.width - m[0].length * scale) / 2;
    const offsetY = (ctx.canvas.height - m.length * scale) / 2;
    for (let y = 0; y < m.length; y++) {
        for (let x = 0; x < m[y].length; x++) {
            if (m[y][x]) {
                ctx.fillStyle = piece.color;
                ctx.fillRect(offsetX + x * scale + 1, offsetY + y * scale + 1, scale - 2, scale - 2);
                ctx.shadowColor = piece.color;
                ctx.shadowBlur = 8;
                ctx.fillRect(offsetX + x * scale + 1, offsetY + y * scale + 1, scale - 2, scale - 2);
                ctx.shadowBlur = 0;
            }
        }
    }
}
// Управление
const keyState = {};
const keyRepeat = {};
const REPEAT_DELAY = 200;
const REPEAT_INTERVAL = 50;
document.addEventListener("keydown", (e) => {
    if (e.key === "p" || e.key === "P" || e.key === "з" || e.key === "З") {
        e.preventDefault();
        paused = !paused;
        btnPause.textContent = paused ? "Продолжить" : "Пауза";
        if (paused) {
            showModal(pauseModal);
        }
        else {
            hideAllModals();
        }
        return;
    }
    if (paused || game.gameOver || !username)
        return;
    if (!keyState[e.key]) {
        keyState[e.key] = true;
        keyRepeat[e.key] = performance.now();
        handleKeyPress(e.key);
    }
});
document.addEventListener("keyup", (e) => {
    keyState[e.key] = false;
});
function handleKeyPress(key) {
    switch (key) {
        case "ArrowLeft":
        case "a":
        case "A":
        case "ф":
        case "Ф":
            game.move(-1);
            break;
        case "ArrowRight":
        case "d":
        case "D":
        case "в":
        case "В":
            game.move(1);
            break;
        case "ArrowDown":
        case "s":
        case "S":
        case "ы":
        case "Ы":
            game.softDrop();
            break;
        case "ArrowUp":
        case "w":
        case "W":
        case "ц":
        case "Ц":
            game.rotate();
            break;
        case " ":
            game.hardDrop();
            if (game.currentPiece) {
                createParticleSystem(game.currentPiece.x * TILE + TILE / 2, game.currentPiece.y * TILE + TILE / 2, game.currentPiece.color, 30);
            }
            break;
        case "z":
        case "Z":
        case "я":
        case "Я":
            game.rotate(-1);
            break;
    }
}
function processKeyRepeat(now) {
    if (paused || game.gameOver || !username)
        return;
    Object.keys(keyState).forEach(key => {
        if (keyState[key] && now - keyRepeat[key] > REPEAT_DELAY) {
            if ((now - keyRepeat[key] - REPEAT_DELAY) % REPEAT_INTERVAL < 16) {
                handleKeyPress(key);
            }
        }
    });
}
function gameLoop(now = performance.now()) {
    const dt = Math.min(now - last, 1000 / 60);
    last = now;
    processKeyRepeat(now);
    if (!paused && !game.gameOver && username) {
        accumulator += dt;
        while (accumulator >= gravity) {
            game.tick();
            if (game.gameOver) {
                break;
            }
            accumulator -= gravity;
        }
        gravity = gravityInterval(game.level);
    }
    updateParticles(dt);
    render();
    if (game.gameOver && !gameoverModal.classList.contains('active')) {
        handleGameOver();
    }
    animationFrameId = requestAnimationFrame(gameLoop);
}
animationFrameId = requestAnimationFrame(gameLoop);
btnPause.addEventListener("click", () => {
    paused = !paused;
    btnPause.textContent = paused ? "Продолжить" : "Пауза";
    if (paused) {
        showModal(pauseModal);
    }
    else {
        hideAllModals();
    }
});
usernameInput.addEventListener("change", () => {
    username = usernameInput.value.trim();
    localStorage.setItem("tetris.username", username);
});
window.addEventListener("beforeunload", () => {
    cancelAnimationFrame(animationFrameId);
});
//# sourceMappingURL=main.js.map