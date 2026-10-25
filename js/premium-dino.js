(() => {
    const game = document.getElementById('dino-game');
    const stage = document.querySelector('.dino-stage');
    const frame = document.querySelector('.dino-frame');
    const layoutRoot = document.querySelector('.dino-main');
    const overlay = document.getElementById('dino-overlay');
    const title = document.getElementById('overlay-title');
    const message = document.getElementById('overlay-message');
    const startButton = document.getElementById('start-game');
    const scoreOut = document.getElementById('dino-score');
    const bestOut = document.getElementById('dino-best');
    const pauseButton = document.getElementById('pause-game');
    const restartButton = document.getElementById('restart-game');
    const endButton = document.getElementById('end-game');
    const jumpButton = document.getElementById('jump-button');
    const duckButton = document.getElementById('duck-button');
    const fullscreenButton = document.getElementById('fullscreen-game');
    const requiredElements = [
        game, stage, frame, layoutRoot, overlay, title, message, startButton,
        scoreOut, bestOut, pauseButton, restartButton, endButton, jumpButton,
        duckButton, fullscreenButton
    ];

    if (requiredElements.some(element => !element)) {
        throw new Error('Premium Dino is missing required game UI elements.');
    }

    const format = value => String(Math.floor(value)).padStart(5, '0');
    const designWidth = 1158;
    const designHeight = 420;
    let phase = 'ready';
    let best = 0;
    let runner;
    let duckPointerId = null;

    try {
        const saved = Number(localStorage.getItem('premium-dino-best') || 0);
        best = Number.isFinite(saved) && saved > 0 ? saved : 0;
    } catch (error) {
        console.warn('Premium Dino best score is unavailable:', error);
    }
    bestOut.textContent = format(best);

    function showOverlay(heading, copy, buttonText) {
        title.textContent = heading;
        message.textContent = copy;
        startButton.textContent = buttonText;
        overlay.hidden = false;
    }

    function showActiveControls() {
        pauseButton.hidden = false;
        restartButton.hidden = false;
        endButton.hidden = false;
    }

    function begin() {
        if (!runner?.tRex || startButton.disabled || phase === 'running') {
            return;
        }
        if (phase === 'paused') {
            runner.play();
        } else if (phase === 'over') {
            runner.restart();
        } else {
            runner.start();
        }
        phase = 'running';
        document.activeElement?.blur();
        overlay.hidden = true;
        showActiveControls();
    }

    function jump() {
        if (phase !== 'running') {
            begin();
        }
        if (phase === 'running') {
            runner.start();
        }
    }

    function endRun(finalScore) {
        setDuck(false);
        phase = 'over';
        scoreOut.textContent = format(finalScore);
        if (finalScore > best) {
            best = finalScore;
            bestOut.textContent = format(best);
            try {
                localStorage.setItem('premium-dino-best', String(best));
            } catch (error) {
                console.warn('Premium Dino could not save the best score:', error);
            }
        }
        pauseButton.hidden = true;
        restartButton.hidden = true;
        endButton.hidden = true;
        showOverlay('Run over', `You scored ${format(finalScore)}. Ready for another run?`, 'Play again');
    }

    function restart() {
        setDuck(false);
        runner.stop();
        runner.restart();
        phase = 'running';
        document.activeElement?.blur();
        overlay.hidden = true;
        scoreOut.textContent = format(0);
        showActiveControls();
    }

    function setDuck(isDucking) {
        if (runner?.tRex) {
            runner.setDucking(isDucking);
        }
        duckButton.classList.toggle('is-pressed', isDucking);
    }

    function syncLayoutScale() {
        const fullscreen = document.fullscreenElement === game;
        const scale = fullscreen
            ? Math.min((window.innerWidth - 24) / designWidth, (window.innerHeight - 24) / designHeight)
            : Math.min(1.2, layoutRoot.clientWidth / designWidth);
        stage.style.zoom = String(Math.max(0.1, scale));
    }

    startButton.disabled = true;
    runner = new Runner('.dino-frame', {
        MANUAL_CONTROL: true,
        onReady: () => { startButton.disabled = false; },
        onError: error => {
            startButton.disabled = true;
            showOverlay('Game unavailable', 'The T-Rex game resources could not be loaded.', 'Unavailable');
            startButton.disabled = true;
            console.error('Premium Dino could not initialize:', error);
        },
        onScore: score => { scoreOut.textContent = format(score); },
        onGameOver: endRun
    });

    syncLayoutScale();
    window.addEventListener('resize', syncLayoutScale);
    if ('ResizeObserver' in window) {
        new ResizeObserver(syncLayoutScale).observe(layoutRoot);
    }

    startButton.addEventListener('click', begin);
    function pause() {
        if (phase !== 'running') {
            return;
        }
        setDuck(false);
        runner.stop();
        phase = 'paused';
        pauseButton.hidden = true;
        showOverlay('Paused', 'Take a breather. Your run is waiting.', 'Resume');
    }
    pauseButton.addEventListener('click', pause);
    restartButton.addEventListener('click', restart);
    endButton.addEventListener('click', () => {
        if (phase === 'running' || phase === 'paused') {
            runner.gameOver();
        }
    });

    jumpButton.addEventListener('click', jump);
    duckButton.addEventListener('pointerdown', event => {
        event.preventDefault();
        duckPointerId = event.pointerId;
        setDuck(true);
        try {
            duckButton.setPointerCapture(event.pointerId);
        } catch (error) {
            console.warn('Premium Dino could not capture the duck control pointer:', error);
        }
    });
    ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(type => {
        duckButton.addEventListener(type, event => {
            if (duckPointerId === null || event.pointerId === duckPointerId) {
                duckPointerId = null;
                setDuck(false);
            }
        });
    });

    document.addEventListener('keydown', event => {
        if (event.target.closest?.('input, textarea, select, [contenteditable="true"]')) {
            return;
        }
        if (event.target.closest?.('button, a')) {
            return;
        }
        if (['Space', 'ArrowUp', 'ArrowDown'].includes(event.code)) {
            event.preventDefault();
        }
        if ((event.code === 'Space' || event.code === 'ArrowUp') && !event.repeat) {
            jump();
        } else if (phase === 'running' && event.code === 'ArrowDown') {
            setDuck(true);
        }
    });
    document.addEventListener('keyup', event => {
        if (event.code === 'ArrowDown') {
            setDuck(false);
        }
    });
    window.addEventListener('blur', pause);
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) pause();
    });

    fullscreenButton.addEventListener('click', async () => {
        try {
            if (document.fullscreenElement === game) {
                await document.exitFullscreen();
            } else {
                await game.requestFullscreen();
            }
        } catch (error) {
            console.error('Premium Dino could not change fullscreen mode:', error);
        }
    });
    document.addEventListener('fullscreenchange', () => {
        const fullscreen = document.fullscreenElement === game;
        syncLayoutScale();
        fullscreenButton.setAttribute('aria-label', fullscreen ? 'Exit fullscreen' : 'Enter fullscreen');
        fullscreenButton.setAttribute('aria-pressed', String(fullscreen));
    });
})();
