(() => {
    const GRID_SIZE = 16;
    const START_SPEED = 150;
    const MIN_SPEED = 72;
    const SPEED_STEP = 2;
    const STORE_KEY = "modern-snake-best";
    const canvas = document.getElementById("snake-board");
    const game = document.getElementById("snake-game");
    const scoreOutput = document.getElementById("snake-score");
    const bestOutput = document.getElementById("snake-best");
    const overlay = document.getElementById("snake-overlay");
    const overlayTitle = document.getElementById("snake-overlay-title");
    const overlayDescription = document.getElementById("snake-overlay-description");
    const overlayAction = document.getElementById("snake-overlay-action");
    const pauseButton = document.getElementById("snake-pause");
    const restartButton = document.getElementById("snake-restart");
    const endButton = document.getElementById("snake-end");
    const directionButtons = [...document.querySelectorAll(".snake-touch-button[data-direction]")];
    const portraitNudgeQuery = window.matchMedia("(orientation: landscape) and (max-height: 500px) and (hover: none) and (pointer: coarse)");

    if (!canvas || !game || !scoreOutput || !bestOutput || !overlay || !overlayTitle || !overlayDescription || !overlayAction || !pauseButton || !restartButton || !endButton || directionButtons.length !== 4) {
        console.error("Modern Snake could not initialize because required game elements are missing.");
        return;
    }

    const context = canvas.getContext("2d");
    if (!context) return;

    const vectors = {
        up: { x: 0, y: -1 },
        right: { x: 1, y: 0 },
        down: { x: 0, y: 1 },
        left: { x: -1, y: 0 }
    };
    const keyDirections = {
        ArrowUp: "up", KeyW: "up",
        ArrowRight: "right", KeyD: "right",
        ArrowDown: "down", KeyS: "down",
        ArrowLeft: "left", KeyA: "left"
    };

    let snake = [];
    let apple = { x: 15, y: 10 };
    let direction = "right";
    let queuedDirection = "right";
    let phase = "ready";
    let score = 0;
    let best = 0;
    let timer = 0;
    let swipeStart = null;

    function readBest() {
        try {
            const value = Number(window.localStorage.getItem(STORE_KEY) || 0);
            return Number.isFinite(value) && value > 0 ? value : 0;
        } catch (error) {
            console.warn("Modern Snake could not read its best score:", error);
            return 0;
        }
    }

    function format(value) {
        return String(Math.max(0, Math.floor(value)));
    }

    function updateScores() {
        scoreOutput.textContent = format(score);
        bestOutput.textContent = format(best);
    }

    function sound(name) {
        if (typeof window.playGameSound === "function") window.playGameSound(name);
    }

    function getColor(name, fallback) {
        const value = getComputedStyle(document.body).getPropertyValue(name).trim();
        return value || fallback;
    }

    function draw() {
        const size = canvas.getBoundingClientRect().width;
        if (!size) return;
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const pixelSize = Math.round(size * dpr);
        if (canvas.width !== pixelSize || canvas.height !== pixelSize) {
            canvas.width = pixelSize;
            canvas.height = pixelSize;
        }
        context.setTransform(dpr, 0, 0, dpr, 0, 0);

        const cellSize = size / GRID_SIZE;
        const boardColor = getColor("--snake-board", getColor("--bg", "#080808"));
        const gridColor = getColor("--snake-grid-line", "rgba(255,255,255,.12)");
        const snakeColor = getColor("--snake-body", getColor("--text", "#fff"));
        const eyeColor = getColor("--snake-eye", boardColor);
        const appleColor = getColor("--snake-apple", getColor("--text", "#fff"));

        context.clearRect(0, 0, size, size);
        context.fillStyle = boardColor;
        context.fillRect(0, 0, size, size);

        context.strokeStyle = gridColor;
        context.lineWidth = Math.max(1, size / 600);
        context.beginPath();
        for (let cell = 1; cell < GRID_SIZE; cell += 1) {
            const point = cell * cellSize;
            context.moveTo(point, 0);
            context.lineTo(point, size);
            context.moveTo(0, point);
            context.lineTo(size, point);
        }
        context.stroke();

        if (apple) drawApple(apple.x * cellSize, apple.y * cellSize, cellSize, appleColor);

        snake.forEach((part, index) => {
            const inset = cellSize * 0.09;
            context.fillStyle = snakeColor;
            context.fillRect(part.x * cellSize + inset, part.y * cellSize + inset, cellSize - inset * 2, cellSize - inset * 2);
            if (index === 0) drawEyes(part, cellSize, eyeColor);
        });

        canvas.setAttribute("aria-label", `Snake board. Score ${score}. Snake length ${snake.length}. Use arrow keys or W A S D to move.`);
    }

    function drawEyes(head, cellSize, eyeColor) {
        const centers = {
            right: [[0.72, 0.32], [0.72, 0.68]],
            left: [[0.28, 0.32], [0.28, 0.68]],
            up: [[0.32, 0.28], [0.68, 0.28]],
            down: [[0.32, 0.72], [0.68, 0.72]]
        }[direction];
        context.fillStyle = eyeColor;
        centers.forEach(([x, y]) => {
            context.beginPath();
            context.arc((head.x + x) * cellSize, (head.y + y) * cellSize, cellSize * 0.075, 0, Math.PI * 2);
            context.fill();
        });
    }

    function drawApple(x, y, cellSize, color) {
        context.fillStyle = color;
        context.beginPath();
        context.arc(x + cellSize * 0.5, y + cellSize * 0.56, cellSize * 0.34, 0, Math.PI * 2);
        context.fill();
        context.strokeStyle = color;
        context.lineWidth = Math.max(2, cellSize * 0.07);
        context.lineCap = "round";
        context.beginPath();
        context.moveTo(x + cellSize * 0.5, y + cellSize * 0.25);
        context.lineTo(x + cellSize * 0.55, y + cellSize * 0.12);
        context.stroke();
        context.fillStyle = color;
        context.beginPath();
        context.ellipse(x + cellSize * 0.65, y + cellSize * 0.2, cellSize * 0.12, cellSize * 0.06, -0.5, 0, Math.PI * 2);
        context.fill();
    }

    function spawnApple() {
        const freeCells = [];
        for (let y = 0; y < GRID_SIZE; y += 1) {
            for (let x = 0; x < GRID_SIZE; x += 1) {
                if (!snake.some(part => part.x === x && part.y === y)) freeCells.push({ x, y });
            }
        }
        if (!freeCells.length) return null;
        return freeCells[Math.floor(Math.random() * freeCells.length)];
    }

    function setPhase(nextPhase) {
        phase = nextPhase;
        game.dataset.phase = nextPhase;
        const showGameActions = nextPhase === "running" || nextPhase === "paused";
        pauseButton.hidden = !showGameActions;
        restartButton.hidden = !showGameActions;
        endButton.hidden = !showGameActions;
        pauseButton.disabled = !showGameActions;
        endButton.disabled = !showGameActions;
        pauseButton.textContent = nextPhase === "paused" ? "Resume" : "Pause";
        overlay.hidden = nextPhase === "running";

        if (nextPhase === "ready") {
            overlayTitle.textContent = "Ready to play?";
            overlayDescription.textContent = "Eat the apples and avoid the edges. Use the direction buttons, arrow keys, or WASD.";
            overlayAction.textContent = "Start game";
        } else if (nextPhase === "paused") {
            overlayTitle.textContent = "Paused";
            overlayDescription.textContent = "Take a breather. Your snake is waiting.";
            overlayAction.textContent = "Resume";
        } else if (nextPhase === "over") {
            overlayTitle.textContent = "Game over";
            overlayDescription.textContent = `Score: ${format(score)}. Ready for another run?`;
            overlayAction.textContent = "Play again";
        }
    }

    function resetSnake() {
        snake = [
            { x: 10, y: 11 },
            { x: 9, y: 11 },
            { x: 8, y: 11 }
        ];
        direction = "right";
        queuedDirection = "right";
        score = 0;
        apple = spawnApple();
        updateScores();
        draw();
    }

    function startGame() {
        if (pauseForOrientation()) return;
        window.clearTimeout(timer);
        if (phase === "over") resetSnake();
        setPhase("running");
        sound("snakeStart");
        timer = window.setTimeout(step, START_SPEED);
    }

    function stopGame() {
        window.clearTimeout(timer);
        timer = 0;
    }

    function pauseForOrientation() {
        if (!portraitNudgeQuery.matches) return false;
        if (phase === "running") {
            stopGame();
            setPhase("paused");
            sound("snakePause");
        }
        return true;
    }

    function finishGame() {
        stopGame();
        setPhase("over");
        updateScores();
        sound("snakeCrash");
    }

    function endGame() {
        if (phase !== "running" && phase !== "paused") return;
        stopGame();
        setPhase("over");
        overlayTitle.textContent = "Run ended";
        overlayDescription.textContent = `Score: ${format(score)}. Ready for another run?`;
        updateScores();
        sound("snakeEnd");
    }

    function step() {
        if (phase !== "running") return;
        if (pauseForOrientation()) return;
        direction = queuedDirection;
        const vector = vectors[direction];
        const head = snake[0];
        const nextHead = { x: head.x + vector.x, y: head.y + vector.y };
        const eating = apple && nextHead.x === apple.x && nextHead.y === apple.y;
        const bodyToCheck = eating ? snake : snake.slice(0, -1);

        if (nextHead.x < 0 || nextHead.x >= GRID_SIZE || nextHead.y < 0 || nextHead.y >= GRID_SIZE || bodyToCheck.some(part => part.x === nextHead.x && part.y === nextHead.y)) {
            finishGame();
            return;
        }

        snake.unshift(nextHead);
        if (eating) {
            score += 1;
            if (score > best) {
                best = score;
                try {
                    window.localStorage.setItem(STORE_KEY, String(best));
                } catch (error) {
                    console.warn("Modern Snake could not save its best score:", error);
                }
            }
            apple = spawnApple();
            updateScores();
            sound("snakeEat");
            if (!apple) {
                finishGame();
                return;
            }
        } else {
            snake.pop();
        }

        draw();
        const speed = Math.max(MIN_SPEED, START_SPEED - score * SPEED_STEP);
        timer = window.setTimeout(step, speed);
    }

    function setDirection(nextDirection) {
        if (phase !== "running" || !vectors[nextDirection] || queuedDirection !== direction) return;
        const current = vectors[direction];
        const next = vectors[nextDirection];
        if (current.x + next.x === 0 && current.y + next.y === 0) return;
        queuedDirection = nextDirection;
    }

    function togglePause() {
        if (pauseForOrientation()) return;
        if (phase === "running") {
            stopGame();
            setPhase("paused");
            sound("snakePause");
        } else if (phase === "paused") {
            setPhase("running");
            sound("snakeStart");
            timer = window.setTimeout(step, START_SPEED);
        }
    }

    overlayAction.addEventListener("click", () => {
        if (phase === "paused") togglePause();
        else startGame();
    });

    pauseButton.addEventListener("click", togglePause);
    endButton.addEventListener("click", endGame);
    restartButton.addEventListener("click", () => {
        if (pauseForOrientation()) return;
        sound("snakeButton");
        resetSnake();
        if (phase === "running" || phase === "paused" || phase === "over") startGame();
        else setPhase("ready");
    });

    directionButtons.forEach(button => {
        button.addEventListener("click", () => {
            sound("snakeButton");
            setDirection(button.dataset.direction);
        });
    });

    document.addEventListener("keydown", event => {
        if (event.code === "Space") {
            if (phase === "running" || phase === "paused") {
                event.preventDefault();
                togglePause();
            }
            return;
        }
        const nextDirection = keyDirections[event.code];
        if (nextDirection) {
            event.preventDefault();
            setDirection(nextDirection);
        }
    });

    canvas.addEventListener("pointerdown", event => {
        swipeStart = { x: event.clientX, y: event.clientY };
    });

    canvas.addEventListener("pointerup", event => {
        if (!swipeStart) return;
        const dx = event.clientX - swipeStart.x;
        const dy = event.clientY - swipeStart.y;
        swipeStart = null;
        if (Math.max(Math.abs(dx), Math.abs(dy)) < 18) return;
        setDirection(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "right" : "left") : (dy > 0 ? "down" : "up"));
    });

    document.addEventListener("visibilitychange", () => {
        if (document.hidden && phase === "running") togglePause();
    });
    portraitNudgeQuery.addEventListener("change", event => {
        if (event.matches) pauseForOrientation();
    });
    window.addEventListener("resize", draw);
    new MutationObserver(draw).observe(document.documentElement, {
        attributes: true,
        attributeFilter: ["data-theme"]
    });
    window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", draw);

    best = readBest();
    updateScores();
    resetSnake();
    setPhase("ready");
})();
