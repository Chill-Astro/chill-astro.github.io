(() => {
    const canvas = document.getElementById('dino-canvas');
    const ctx = canvas?.getContext('2d');
    const game = document.getElementById('dino-game');
    const stage = document.querySelector('.dino-stage');
    const overlay = document.getElementById('dino-overlay');
    const title = document.getElementById('overlay-title');
    const message = document.getElementById('overlay-message');
    const startButton = document.getElementById('start-game');
    const layoutRoot = document.querySelector('.dino-main');
    if (!canvas || !ctx || !game || !stage || !overlay || !startButton || !layoutRoot) return;

    const W = canvas.width, H = canvas.height, ground = Math.round(H * .9), dinoX = 50;
    const gravity = 2300, jumpVelocity = -625, jumpBufferDuration = .2;
    const cactusVariants = [
        { spriteX: 228, sourceW: 17, width: 17, height: 35, minScore: 0 },
        { spriteX: 245, sourceW: 34, width: 34, height: 35, minScore: 100 },
        { spriteX: 228, sourceW: 51, width: 51, height: 35, minScore: 250 },
        { spriteX: 332, sourceW: 25, width: 25, height: 50, minScore: 350 },
        { spriteX: 358, sourceW: 50, width: 50, height: 50, minScore: 600 },
        { spriteX: 412, sourceW: 75, width: 75, height: 50, minScore: 900 }
    ];
    const scoreOut = document.getElementById('dino-score');
    const bestOut = document.getElementById('dino-best');
    const pauseButton = document.getElementById('pause-game');
    const restartButton = document.getElementById('restart-game');
    const endButton = document.getElementById('end-game');
    const fullscreenButton = document.getElementById('fullscreen-game');
    const designWidth = 1158;
    const format = n => String(Math.floor(n)).padStart(5, '0');
    const sprite = new Image();
    sprite.src = '../assets/images/premium-dino-sprite.png';
    sprite.addEventListener('load', draw);

    let best = 0;
    try { best = Number(localStorage.getItem('premium-dino-best') || 0); } catch { /* Storage can be disabled. */ }
    let score = 0, speed = 360, obstacles = [], clouds = [], running = false, dead = false, ducking = false, nextScoreBeep = 500;
    let lastCactusVariant = -1;
    let dinoY = ground, vy = 0, jumpBuffer = 0, last = 0, elapsed = 0, obstacleTimer = 1.1, raf = 0;

    function syncLayoutScale() {
        const fullscreen = document.fullscreenElement === game;
        let scale = Math.min(1, layoutRoot.clientWidth / designWidth);
        if (fullscreen) {
            const stageHeight = 420;
            scale = Math.min((window.innerWidth - 24) / designWidth, (window.innerHeight - 24) / stageHeight);
        }
        stage.style.zoom = String(Math.max(0.1, scale));
    }

    syncLayoutScale();
    window.addEventListener('resize', syncLayoutScale);
    if ('ResizeObserver' in window) new ResizeObserver(syncLayoutScale).observe(layoutRoot);

    bestOut.textContent = format(best);

    function colors() {
        return {
            bg: '#fff',
            muted: '#000'
        };
    }

    function drawSprite(sx, sy, sw, sh, dx, dy, dw, dh) {
        if (!sprite.complete || !sprite.naturalWidth) return;
        ctx.save();
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(sprite, sx, sy, sw, sh, dx, dy, dw, dh);
        ctx.restore();
    }

    function draw() {
        const c = colors();
        ctx.clearRect(0, 0, W, H);
        ctx.fillStyle = c.bg;
        ctx.fillRect(0, 0, W, H);
        clouds.forEach(cloud => drawSprite(86, 2, 46, 14, cloud.x, cloud.y, 46, 14));

        ctx.strokeStyle = c.muted;
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(0, ground + 1); ctx.lineTo(W, ground + 1); ctx.stroke();
        ctx.fillStyle = c.muted;
        for (let i = 0; i < 14; i++) {
            const x = ((i * 91 - elapsed * speed * .65) % (W + 20) + W + 20) % (W + 20);
            ctx.fillRect(x, ground + 9 + (i % 3) * 7, 3 + i % 4, 2);
        }

        obstacles.forEach(obstacle => {
            if (obstacle.type === 'bird') {
                const frame = Math.sin(elapsed * 14) > 0 ? 0 : 46;
                drawSprite(134 + frame, 2, 46, 40, obstacle.x, obstacle.y, 46, 40);
            } else {
                const { spriteX, sourceW, sourceH, width, height } = obstacle;
                drawSprite(spriteX, 2, sourceW, sourceH, obstacle.x, ground - height, width, height);
            }
        });

        const onGround = dinoY >= ground - .1;
        let sourceX, sourceY = 2, sourceW, sourceH, destW, destH;
        if (ducking && onGround) {
            sourceX = Math.floor(elapsed * 8) % 2 ? 1171 : 1112;
            sourceY = 19;
            sourceW = 59; sourceH = 30; destW = 59; destH = 30;
        } else if (dinoY < ground - 1) {
            sourceX = 848; sourceW = 44; sourceH = 47; destW = 44; destH = 47;
        } else {
            sourceX = 936 + (Math.floor(elapsed * 12) % 2) * 44;
            sourceW = 44; sourceH = 47; destW = 44; destH = 47;
        }
        drawSprite(sourceX, sourceY, sourceW, sourceH, dinoX, dinoY - destH, destW, destH);
    }

    function show(heading, copy, buttonText) {
        title.textContent = heading;
        message.textContent = copy;
        startButton.textContent = buttonText;
        overlay.hidden = false;
    }

    function reset() {
        score = 0; speed = 360; elapsed = 0; dinoY = ground; vy = 0; jumpBuffer = 0; ducking = false; nextScoreBeep = 500;
        obstacles = [];
        lastCactusVariant = -1;
        clouds = Array.from({ length: 5 }, (_, i) => ({ x: 150 + i * 190, y: 54 + (i % 3) * 33 }));
        obstacleTimer = .9;
        scoreOut.textContent = format(0);
    }

    function begin() {
        if (running) return;
        playGameSound("dinoStart");
        if (dead) reset();
        dead = false; running = true; overlay.hidden = true;
        pauseButton.hidden = false; restartButton.hidden = false; endButton.hidden = false;
        last = 0;
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(tick);
    }

    function finish() {
        playGameSound("dinoHit");
        window.setTimeout(() => playGameSound("dinoOver"), 100);
        running = false; dead = true; ducking = false;
        cancelAnimationFrame(raf);
        pauseButton.hidden = true; restartButton.hidden = true; endButton.hidden = true;
        const finalScore = Math.floor(score);
        if (finalScore > best) {
            best = finalScore;
            try { localStorage.setItem('premium-dino-best', String(best)); } catch { /* Best score remains available for this visit. */ }
            bestOut.textContent = format(best);
        }
        show('Run over', `You scored ${format(finalScore)}. Ready for another run?`, 'Play again');
        draw();
    }

    function spawnObstacle() {
        if (score >= 1800 && Math.random() < .26) {
            obstacles.push({ type: 'bird', x: W + 10, y: ground - 70, width: 46, height: 40 });
            return;
        }
        const availableVariants = cactusVariants
            .map((variant, index) => ({ variant, index }))
            .filter(({ variant, index }) => score >= variant.minScore
                && index !== lastCactusVariant);
        const selected = availableVariants[Math.floor(Math.random() * availableVariants.length)];
        const { variant, index } = selected;
        lastCactusVariant = index;
        obstacles.push({
            type: 'cactus', x: W + 10,
            ...variant,
            sourceH: variant.height
        });
    }

    function tick(now) {
        if (!running) return;
        const dt = Math.min(last ? (now - last) / 1000 : 0, .04);
        last = now; elapsed += dt; score += dt * 100;
        if (score >= nextScoreBeep) {
            playGameSound("dinoMilestone");
            nextScoreBeep += 500;
        }
        speed = Math.min(760, 360 + score * .22);
        if (dinoY < ground || vy < 0) {
            dinoY += vy * dt + .5 * gravity * dt * dt;
            vy += gravity * dt;
            if (dinoY >= ground) { dinoY = ground; vy = 0; }
        }
        jumpBuffer = Math.max(0, jumpBuffer - dt);
        if (jumpBuffer > 0 && dinoY >= ground - 1) {
            vy = jumpVelocity;
            ducking = false;
            jumpBuffer = 0;
        }

        obstacleTimer -= dt;
        if (obstacleTimer <= 0) {
            spawnObstacle();
            obstacleTimer = .95 + Math.random() * .85 + 260 / speed;
        }
        obstacles.forEach(obstacle => { obstacle.x -= speed * dt; });
        obstacles = obstacles.filter(obstacle => obstacle.x > -100);
        clouds.forEach(cloud => { cloud.x -= speed * .12 * dt; if (cloud.x < -80) cloud.x = W + Math.random() * 100; });

        const crouched = ducking && dinoY >= ground - .1;
        const playerBox = crouched
            ? { x: dinoX + 2, y: ground - 30, w: 55, h: 30 }
            : { x: dinoX + 5, y: dinoY - 42, w: 35, h: 40 };
        for (const obstacle of obstacles) {
            if (obstacle.type === 'bird') {
                const overlapsBird = playerBox.x < obstacle.x + obstacle.width - 3
                    && playerBox.x + playerBox.w > obstacle.x + 3;
                if (overlapsBird && !crouched) { finish(); return; }
                continue;
            }

            const hit = {
                x: obstacle.x + 2,
                y: ground - obstacle.height + 2,
                w: obstacle.width - 4,
                h: obstacle.height - 2
            };
            if (playerBox.x < hit.x + hit.w && playerBox.x + playerBox.w > hit.x
                && playerBox.y < hit.y + hit.h && playerBox.y + playerBox.h > hit.y) {
                finish(); return;
            }
        }
        scoreOut.textContent = format(score);
        draw();
        raf = requestAnimationFrame(tick);
    }

    function jump() {
        if (!running) begin();
        jumpBuffer = jumpBufferDuration;
        if (dinoY >= ground - 1) {
            vy = jumpVelocity;
            ducking = false;
            jumpBuffer = 0;
            playGameSound("dinoJump");
        }
    }
    function setDuck(on) { ducking = on; }

    startButton.addEventListener('click', begin);
    pauseButton.addEventListener('click', () => {
        if (!running) return;
        playGameSound("dinoPause");
        running = false; cancelAnimationFrame(raf); pauseButton.hidden = true;
        show('Paused', 'Take a breather. Your run is waiting.', 'Resume');
    });
    restartButton.addEventListener('click', () => { running = false; dead = false; reset(); begin(); });
    endButton.addEventListener('click', () => { if (running || !dead) finish(); });

    document.getElementById('jump-button').addEventListener('click', jump);
    const duckButton = document.getElementById('duck-button');
    duckButton.addEventListener('pointerdown', event => {
        event.preventDefault(); setDuck(true); duckButton.classList.add('is-pressed');
        try { duckButton.setPointerCapture(event.pointerId); } catch { /* Pointer capture may be unavailable. */ }
    });
    ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(type => duckButton.addEventListener(type, () => {
        setDuck(false); duckButton.classList.remove('is-pressed');
    }));
    document.addEventListener('keydown', event => {
        if (['Space', 'ArrowUp', 'ArrowDown'].includes(event.code) && !event.repeat) event.preventDefault();
        if ((event.code === 'Space' || event.code === 'ArrowUp') && !event.repeat) jump();
        if (event.code === 'ArrowDown') setDuck(true);
    });
    document.addEventListener('keyup', event => { if (event.code === 'ArrowDown') setDuck(false); });
    window.addEventListener('blur', () => setDuck(false));

    fullscreenButton.addEventListener('click', async () => {
        try {
            if (document.fullscreenElement === game) await document.exitFullscreen();
            else await game.requestFullscreen();
        } catch { /* Fullscreen can be unavailable in embedded previews. */ }
    });
    document.addEventListener('fullscreenchange', () => {
        const fullscreen = document.fullscreenElement === game;
        syncLayoutScale();
        fullscreenButton.setAttribute('aria-label', fullscreen ? 'Exit fullscreen' : 'Enter fullscreen');
        fullscreenButton.setAttribute('aria-pressed', String(fullscreen));
    });

    reset();
    draw();
})();
