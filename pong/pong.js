(() => {
    const canvas = document.getElementById("pong-court");
    const context = canvas?.getContext("2d");
    const toggleButton = document.getElementById("game-toggle");
    const pauseButton = document.getElementById("pause-game");
    const restartButton = document.getElementById("restart-game");
    const endButton = document.getElementById("end-game");
    const fullscreenButton = document.getElementById("fullscreen-game");
    const matchClock = document.getElementById("match-clock");
    const gameElement = document.querySelector(".pong-game");

    if (!canvas || !context || !toggleButton || !pauseButton || !restartButton || !endButton || !fullscreenButton || !matchClock || !gameElement) {
        console.error("Pong could not initialize because required game elements are missing.");
        return;
    }

    const matchDuration = 60;
    const width = canvas.width;
    const height = canvas.height;
    const paddleWidth = 14;
    const paddleHeight = 108;
    const paddleInset = 28;
    const ballRadius = 10;
    const keysDown = new Set();
    const heldControls = new Set();
    const scores = { left: 0, right: 0 };
    const paddles = {
        left: { x: paddleInset, y: (height - paddleHeight) / 2 },
        right: { x: width - paddleInset - paddleWidth, y: (height - paddleHeight) / 2 }
    };
    const ball = { x: width / 2, y: height / 2, vx: 0, vy: 0 };
    const speed = { paddle: 520, initialBall: 390, maximumBall: 760 };

    const overlay = document.getElementById("court-overlay");
    const overlayTitle = document.getElementById("overlay-title");
    const overlayMessage = document.getElementById("overlay-message");
    const scoreOutputs = {
        left: [
            document.getElementById("left-score"),
            document.getElementById("court-left-score")
        ],
        right: [
            document.getElementById("right-score"),
            document.getElementById("court-right-score")
        ]
    };
    let started = false;
    let running = false;
    let lastFrame = 0;
    let serveAt = 0;
    let matchRemaining = matchDuration;
    let matchDeadline = 0;
    let displayedClock = "";
    let animationFrame = 0;

    function gameColors() {
        const styles = getComputedStyle(document.documentElement);
        return {
            foreground: styles.getPropertyValue("--text").trim() || "#111",
            background: styles.getPropertyValue("--bg").trim() || "#fff",
            muted: styles.getPropertyValue("--card-border").trim() || "#e6e6e6"
        };
    }

    function drawCourt() {
        const { foreground, background, muted } = gameColors();
        context.fillStyle = background;
        context.fillRect(0, 0, width, height);

        context.strokeStyle = muted;
        context.lineWidth = 3;
        context.setLineDash([12, 14]);
        context.beginPath();
        context.moveTo(width / 2, 20);
        context.lineTo(width / 2, height - 20);
        context.stroke();
        context.setLineDash([]);

        context.fillStyle = foreground;
        context.beginPath();
        context.roundRect(paddles.left.x, paddles.left.y, paddleWidth, paddleHeight, 7);
        context.roundRect(paddles.right.x, paddles.right.y, paddleWidth, paddleHeight, 7);
        context.fill();
        context.beginPath();
        context.arc(ball.x, ball.y, ballRadius, 0, Math.PI * 2);
        context.fill();
    }

    function updateScores() {
        for (const side of ["left", "right"]) {
            for (const output of scoreOutputs[side]) {
                if (output) output.textContent = String(scores[side]);
            }
        }
    }

    function updateClock() {
        const totalSeconds = Math.max(0, Math.ceil(matchRemaining));
        const display = `${Math.floor(totalSeconds / 60)}:${String(totalSeconds % 60).padStart(2, "0")}`;
        if (display === displayedClock) return;
        displayedClock = display;
        matchClock.textContent = display;
        matchClock.setAttribute("aria-label", `${totalSeconds} seconds remaining`);
    }

    function showGameActions() {
        pauseButton.hidden = false;
        restartButton.hidden = false;
        endButton.hidden = false;
    }

    function hideGameActions() {
        pauseButton.hidden = true;
        restartButton.hidden = true;
        endButton.hidden = true;
    }

    function setOverlay(title, message, buttonText) {
        if (!overlay || !overlayTitle || !overlayMessage) return;
        overlay.hidden = false;
        overlayTitle.textContent = title;
        overlayMessage.textContent = message;
        toggleButton.textContent = buttonText;
    }

    function resetBall(direction, now = performance.now()) {
        ball.x = width / 2;
        ball.y = height / 2;
        ball.vx = 0;
        ball.vy = 0;
        serveAt = now + 650;
        ball.serveDirection = direction;
    }

    function resetPaddles() {
        paddles.left.y = (height - paddleHeight) / 2;
        paddles.right.y = (height - paddleHeight) / 2;
    }

    function serveBall() {
        const angle = (Math.random() * 0.7) - 0.35;
        ball.vx = Math.cos(angle) * speed.initialBall * ball.serveDirection;
        ball.vy = Math.sin(angle) * speed.initialBall;
    }

    function startGame() {
        if (!started) {
            started = true;
            scores.left = 0;
            scores.right = 0;
            resetPaddles();
            resetBall(Math.random() < 0.5 ? -1 : 1);
            matchRemaining = matchDuration;
            updateScores();
            updateClock();
        }
        running = true;
        overlay.hidden = true;
        toggleButton.textContent = "Resume game";
        showGameActions();
        matchDeadline = performance.now() + matchRemaining * 1000;
        lastFrame = 0;
        animationFrame = requestAnimationFrame(tick);
    }

    function pauseGame() {
        if (!running) return;
        matchRemaining = Math.max(0, (matchDeadline - performance.now()) / 1000);
        updateClock();
        if (matchRemaining <= 0) {
            finishTimedMatch();
            return;
        }
        running = false;
        cancelAnimationFrame(animationFrame);
        pauseButton.hidden = true;
        setOverlay("Paused", "Take a breather. The next point is waiting.", "Resume game");
    }

    function restartGame() {
        started = true;
        scores.left = 0;
        scores.right = 0;
        resetPaddles();
        resetBall(Math.random() < 0.5 ? -1 : 1);
        matchRemaining = matchDuration;
        updateScores();
        updateClock();
        running = true;
        overlay.hidden = true;
        showGameActions();
        matchDeadline = performance.now() + matchDuration * 1000;
        lastFrame = 0;
        animationFrame = requestAnimationFrame(tick);
    }

    function finishTimedMatch() {
        running = false;
        started = false;
        matchRemaining = 0;
        updateClock();
        cancelAnimationFrame(animationFrame);
        hideGameActions();
        const result = scores.left === scores.right
            ? "It's a draw!"
            : `${scores.left > scores.right ? "Left" : "Right"} player wins!`;
        setOverlay(
            result,
            `Time's up! Final score: ${scores.left}–${scores.right}.`,
            "Play again"
        );
        drawCourt();
    }

    function endGame() {
        if (!started) return;
        running = false;
        started = false;
        cancelAnimationFrame(animationFrame);
        hideGameActions();
        setOverlay(
            "Game over",
            `Final score: ${scores.left}–${scores.right}.`,
            "Play again"
        );
        drawCourt();
    }

    function scorePoint(side, now) {
        scores[side] += 1;
        updateScores();
        resetBall(side === "left" ? 1 : -1, now);
    }

    function controlIsDown(control) {
        const keys = {
            "left-up": ["w", "W"],
            "left-down": ["s", "S"],
            "right-up": ["ArrowUp"],
            "right-down": ["ArrowDown"]
        };
        return heldControls.has(control) || keys[control].some(key => keysDown.has(key));
    }

    function movePaddles(delta) {
        if (controlIsDown("left-up")) paddles.left.y -= speed.paddle * delta;
        if (controlIsDown("left-down")) paddles.left.y += speed.paddle * delta;
        if (controlIsDown("right-up")) paddles.right.y -= speed.paddle * delta;
        if (controlIsDown("right-down")) paddles.right.y += speed.paddle * delta;

        paddles.left.y = Math.max(0, Math.min(height - paddleHeight, paddles.left.y));
        paddles.right.y = Math.max(0, Math.min(height - paddleHeight, paddles.right.y));
    }

    function collideWithPaddle(paddle, direction) {
        const ballNearPaddle = direction < 0
            ? ball.x - ballRadius <= paddle.x + paddleWidth
            : ball.x + ballRadius >= paddle.x;
        const overlapsPaddle = ball.y + ballRadius >= paddle.y
            && ball.y - ballRadius <= paddle.y + paddleHeight;

        if (!ballNearPaddle || !overlapsPaddle) return;

        const hitPosition = (ball.y - (paddle.y + paddleHeight / 2)) / (paddleHeight / 2);
        const angle = hitPosition * 1.05;
        const currentSpeed = Math.min(
            Math.hypot(ball.vx, ball.vy) * 1.045,
            speed.maximumBall
        );

        ball.vx = Math.cos(angle) * currentSpeed * -direction;
        ball.vy = Math.sin(angle) * currentSpeed;
        ball.x = direction < 0
            ? paddle.x + paddleWidth + ballRadius
            : paddle.x - ballRadius;
    }

    function updateBall(delta, now) {
        if (!ball.vx && now >= serveAt) serveBall();
        if (!ball.vx) return;

        ball.x += ball.vx * delta;
        ball.y += ball.vy * delta;

        if (ball.y - ballRadius <= 0) {
            ball.y = ballRadius;
            ball.vy = Math.abs(ball.vy);
        } else if (ball.y + ballRadius >= height) {
            ball.y = height - ballRadius;
            ball.vy = -Math.abs(ball.vy);
        }

        if (ball.vx < 0) collideWithPaddle(paddles.left, -1);
        else collideWithPaddle(paddles.right, 1);

        if (ball.x + ballRadius < 0) scorePoint("right", now);
        else if (ball.x - ballRadius > width) scorePoint("left", now);
    }

    function tick(now) {
        if (!running) return;

        matchRemaining = Math.max(0, (matchDeadline - now) / 1000);
        updateClock();
        if (matchRemaining <= 0) {
            finishTimedMatch();
            return;
        }

        const delta = lastFrame ? Math.min((now - lastFrame) / 1000, 0.03) : 0;
        lastFrame = now;
        movePaddles(delta);
        updateBall(delta, now);
        drawCourt();
        animationFrame = requestAnimationFrame(tick);
    }

    function handleKeyDown(event) {
        const controls = ["w", "W", "s", "S", "ArrowUp", "ArrowDown"];
        if (!controls.includes(event.key)) return;
        if (event.key.startsWith("Arrow") && running) event.preventDefault();
        keysDown.add(event.key);
    }

    function handleKeyUp(event) {
        keysDown.delete(event.key);
    }

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("keyup", handleKeyUp);
    window.addEventListener("blur", () => {
        keysDown.clear();
        heldControls.clear();
        document.querySelectorAll(".touch-button.is-pressed").forEach(button => {
            button.classList.remove("is-pressed");
        });
    });
    document.addEventListener("visibilitychange", () => {
        if (document.hidden) {
            lastFrame = 0;
        }
    });

    document.querySelectorAll(".touch-button").forEach(button => {
        const control = button.dataset.control;

        button.addEventListener("pointerdown", event => {
            event.preventDefault();
            heldControls.add(control);
            button.classList.add("is-pressed");
            button.setPointerCapture(event.pointerId);
        });

        const release = () => {
            heldControls.delete(control);
            button.classList.remove("is-pressed");
        };

        button.addEventListener("pointerup", release);
        button.addEventListener("pointercancel", release);
        button.addEventListener("lostpointercapture", release);
    });

    toggleButton.addEventListener("click", startGame);
    pauseButton.addEventListener("click", pauseGame);
    restartButton.addEventListener("click", restartGame);
    endButton.addEventListener("click", endGame);
    fullscreenButton.addEventListener("click", async () => {
        try {
            if (document.fullscreenElement === gameElement) {
                await document.exitFullscreen();
            } else {
                await gameElement.requestFullscreen();
            }
        } catch (error) {
            console.error("Failed to change Pong fullscreen mode:", error);
        }
    });
    document.addEventListener("fullscreenchange", () => {
        const isFullscreen = document.fullscreenElement === gameElement;
        fullscreenButton.setAttribute("aria-label", isFullscreen ? "Exit fullscreen" : "Enter fullscreen");
        fullscreenButton.setAttribute("aria-pressed", String(isFullscreen));
    });
    updateClock();
    drawCourt();
})();
