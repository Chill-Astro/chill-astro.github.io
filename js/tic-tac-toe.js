(() => {
    const WIN_LENGTH = 4;
    const SEARCH_DEPTH = 6;
    const TTT_HELPER_API = "https://ttt-helper.chill-astro.workers.dev";
    const modePicker = document.getElementById("mode-picker");
    const game = document.getElementById("ttt-game");
    const gameContent = document.getElementById("ttt-game-content");
    const status = document.getElementById("ttt-status");
    const boardElement = document.getElementById("ttt-board");
    const cells = [...document.querySelectorAll(".ttt-cell")];
    const pauseButton = document.getElementById("pause-game");
    const restartButton = document.getElementById("restart-game");
    const changeModeButton = document.getElementById("change-mode");
    const modeLabel = document.getElementById("mode-label");
    const winLine = document.getElementById("ttt-win-line");
    const pausedOverlay = document.getElementById("paused-overlay");
    const modeTitle = document.getElementById("mode-title");
    const modeDescription = document.querySelector("#mode-picker .ttt-mode-dialog > p");
    const modeOptions = document.getElementById("mode-options");
    const difficultyOptions = document.getElementById("difficulty-options");
    const boardSizeOptions = document.getElementById("board-size-options");
    const onlineButton = document.getElementById("online-mode-button");
    const onlineOptions = document.getElementById("online-options");
    const onlineCreateOptions = document.getElementById("online-create-options");
    const onlineBackButton = document.getElementById("online-back-button");
    const joinRoomForm = document.getElementById("join-room-form");
    const roomCodeInput = document.getElementById("room-code-input");
    const joinRoomButton = document.getElementById("join-room-button");
    const createRoomButton = document.getElementById("create-room-button");
    const confirmCreateRoomButton = document.getElementById("confirm-create-room");
    const onlineFeedback = document.getElementById("online-feedback");
    const onlineSizeButtons = [...document.querySelectorAll("[data-online-board-size]")];
    const lobbyWaitingPanel = document.getElementById("lobby-waiting-panel");
    const onlineRoomCode = document.getElementById("online-room-code");
    const copyRoomCodeButton = document.getElementById("copy-room-code");
    const lobbyCountdown = document.getElementById("lobby-countdown");
    const cancelLobbyButton = document.getElementById("cancel-lobby");
    const endOnlineMatchButton = document.getElementById("end-online-match");
    const backButton = document.getElementById("mode-back");
    const boardSizeBackButton = document.getElementById("board-size-back");
    const modeButtons = [...document.querySelectorAll('.ttt-mode-button[data-mode="ai"], .ttt-mode-button[data-mode="pvp"]')];
    const difficultyButtons = [...document.querySelectorAll(".ttt-mode-button[data-difficulty]")];
    const boardSizeButtons = [...document.querySelectorAll(".ttt-mode-button[data-board-size]")];

    if (!modePicker || !game || !gameContent || !status || !boardElement || cells.length !== 25 || !pauseButton || !restartButton || !changeModeButton || !modeLabel || !winLine || !pausedOverlay || modeButtons.length !== 2 || difficultyButtons.length !== 2 || boardSizeButtons.length !== 2 || !onlineButton || !onlineOptions || !onlineCreateOptions || !onlineBackButton || !joinRoomForm || !roomCodeInput || !joinRoomButton || !createRoomButton || !confirmCreateRoomButton || !onlineFeedback || onlineSizeButtons.length !== 2 || !lobbyWaitingPanel || !onlineRoomCode || !copyRoomCodeButton || !lobbyCountdown || !cancelLobbyButton || !endOnlineMatchButton || !modeTitle || !modeDescription || !modeOptions || !difficultyOptions || !boardSizeOptions || !backButton || !boardSizeBackButton) {
        console.error("Tic Tac Toe Online could not initialize because required game elements are missing.");
        return;
    }

    // Show online mode only when the helper responds and is not rate-limited.
    fetch(`${TTT_HELPER_API}/api/match/health`, { cache: "no-store" })
        .then(response => {
            if (response.ok) onlineButton.hidden = false;
        })
        .catch(() => { onlineButton.hidden = true; });

    const directions = [
        { row: 0, column: 1, name: "horizontal" },
        { row: 1, column: 0, name: "vertical" },
        { row: 1, column: 1, name: "diagonal-down" },
        { row: 1, column: -1, name: "diagonal-up" }
    ];

    let boardSize = 4;
    let winningCombinations = buildWinningCombinations(boardSize);
    let mode = null;
    let difficulty = null;
    let marks = Array(boardSize * boardSize).fill("");
    let currentPlayer = "X";
    let paused = false;
    let gameOver = false;
    let aiTimeout = 0;

    // Online specific state
    let onlineRoomId = null;
    let onlineRole = null; // 'X' or 'O'
    let playerToken = null;
    let pollInterval = 0;
    let lobbyTimerInterval = 0;
    let lobbyExpiresAt = 0;
    let onlineReady = false;
    let selectedOnlineSize = 4;

    function buildWinningCombinations(size) {
        const combinations = [];
        for (let row = 0; row < size; row += 1) {
            for (let column = 0; column < size; column += 1) {
                for (const direction of directions) {
                    const endRow = row + direction.row * (WIN_LENGTH - 1);
                    const endColumn = column + direction.column * (WIN_LENGTH - 1);
                    if (endRow < 0 || endRow >= size || endColumn < 0 || endColumn >= size) continue;

                    const indexes = Array.from({ length: WIN_LENGTH }, (_, step) =>
                        (row + direction.row * step) * size + column + direction.column * step
                    );
                    combinations.push({
                        cells: indexes,
                        row,
                        column,
                        deltaRow: direction.row,
                        deltaColumn: direction.column,
                        direction: direction.name
                    });
                }
            }
        }
        return combinations;
    }

    function getWinner(state) {
        for (const combination of winningCombinations) {
            const first = state[combination.cells[0]];
            if (first && combination.cells.every(index => state[index] === first)) {
                return { player: first, ...combination };
            }
        }
        return null;
    }

    function getStatusText() {
        if (paused) return "Game paused";
        if (mode === "online") {
            if (!onlineReady) return "Waiting for opponent";
            return currentPlayer === onlineRole ? `Your turn (${onlineRole})` : "Opponent's turn";
        }
        return currentPlayer;
    }

    function render() {
        const aiThinking = mode === "ai" && currentPlayer === "O" && !gameOver && !paused;
        const onlineWaiting = mode === "online" && (!onlineReady || currentPlayer !== onlineRole);

        cells.forEach((cell, index) => {
            const mark = marks[index];
            const active = index < boardSize * boardSize;
            cell.hidden = !active;
            if (!active) return;
            const row = Math.floor(index / boardSize) + 1;
            const column = (index % boardSize) + 1;
            cell.textContent = mark;
            cell.classList.toggle("mark-x", mark === "X");
            cell.classList.toggle("mark-o", mark === "O");
            cell.setAttribute("aria-label", `Row ${row}, column ${column}, ${mark || "empty"}`);
            cell.disabled = !mode || paused || gameOver || aiThinking || onlineWaiting || Boolean(mark);
        });

        pauseButton.textContent = paused ? "Resume" : "Pause";
        pauseButton.disabled = !mode || gameOver || mode === "online";
        restartButton.disabled = !mode || mode === "online";
        changeModeButton.disabled = !mode;
        restartButton.hidden = mode === "online";
        changeModeButton.hidden = mode === "online";
        endOnlineMatchButton.hidden = mode !== "online";
        document.querySelector(".ttt-actions")?.classList.toggle("online-active", mode === "online");
        status.textContent = getStatusText();
        status.classList.toggle("is-paused", paused);
        game.classList.toggle("is-paused", paused);
        pausedOverlay.hidden = !paused;
    }

    function clearAiTurn() {
        if (aiTimeout) {
            window.clearTimeout(aiTimeout);
            aiTimeout = 0;
        }
    }

    function clearWinDisplay() {
        winLine.classList.remove("is-visible");
        winLine.hidden = true;
        winLine.removeAttribute("data-line");
        winLine.removeAttribute("data-direction");
        winLine.style.cssText = "";
        cells.forEach(cell => cell.classList.remove("is-winning"));
    }

    function showWinningStroke(winner) {
        winner.cells.forEach(index => cells[index].classList.add("is-winning"));
        const centerX = ((winner.column + winner.deltaColumn * (WIN_LENGTH - 1) / 2 + 0.5) / boardSize) * 100;
        const centerY = ((winner.row + winner.deltaRow * (WIN_LENGTH - 1) / 2 + 0.5) / boardSize) * 100;
        const diagonalScale = winner.direction.startsWith("diagonal") ? Math.SQRT2 : 1;
        const span = ((WIN_LENGTH - 1) / boardSize) * 100 * diagonalScale;
        const angle = winner.direction === "horizontal" ? 0 : winner.direction === "vertical" ? 90 : winner.direction === "diagonal-down" ? 45 : -45;
        winLine.dataset.line = `${winner.row}-${winner.column}`;
        winLine.dataset.direction = winner.direction;
        winLine.style.left = `${centerX}%`;
        winLine.style.top = `${centerY}%`;
        winLine.style.width = `${span}%`;
        winLine.style.transform = `translate(-50%, -50%) rotate(${angle}deg)`;
        winLine.hidden = false;
        requestAnimationFrame(() => winLine.classList.add("is-visible"));
    }

    function finishRound(winner) {
        const resultSound = !winner ? "tttDraw" : mode === "ai" && winner.player !== "X" ? "tttDefeat" : "tttVictory";
        playGameSound(resultSound);
        gameOver = true;
        paused = false;
        pauseButton.hidden = true;
        endOnlineMatchButton.hidden = mode !== "online";
        document.querySelector(".ttt-actions")?.classList.toggle("online-active", mode === "online");
        if (winner) {
            showWinningStroke(winner);
            if (mode === "ai") status.textContent = winner.player === "X" ? "You win!" : "The AI wins.";
            else if (mode === "online") status.textContent = winner.player === onlineRole ? "You win!" : "Opponent wins.";
            else status.textContent = `Player ${winner.player} wins!`;
        } else {
            status.textContent = "It's a draw.";
        }
        renderCellsOnly();
    }

    function renderCellsOnly() {
        cells.forEach((cell, index) => {
            const active = index < boardSize * boardSize;
            cell.hidden = !active;
            if (!active) return;
            const mark = marks[index];
            cell.textContent = mark;
            cell.classList.toggle("mark-x", mark === "X");
            cell.classList.toggle("mark-o", mark === "O");
            cell.setAttribute("aria-label", `Row ${Math.floor(index / boardSize) + 1}, column ${(index % boardSize) + 1}, ${mark || "empty"}`);
            cell.disabled = true;
        });
        pausedOverlay.hidden = true;
    }

    function placeMark(index, player) {
        if (gameOver || paused || marks[index]) return;
        playGameSound(player === "X" ? "tttMoveX" : "tttMoveO");
        marks[index] = player;
        const winner = getWinner(marks);
        if (winner) {
            finishRound(winner);
            return;
        }
        if (marks.every(Boolean)) {
            finishRound(null);
            return;
        }

        currentPlayer = player === "X" ? "O" : "X";
        render();
        if (mode === "ai" && currentPlayer === "O") scheduleAiMove();
    }

    function candidateMoves(state) {
        if (state.every(mark => !mark)) {
            const middle = Math.floor(boardSize / 2);
            return [middle * boardSize + middle];
        }
        const candidates = new Set();
        state.forEach((mark, index) => {
            if (!mark) return;
            const row = Math.floor(index / boardSize);
            const column = index % boardSize;
            for (let rowOffset = -1; rowOffset <= 1; rowOffset += 1) {
                for (let columnOffset = -1; columnOffset <= 1; columnOffset += 1) {
                    const nextRow = row + rowOffset;
                    const nextColumn = column + columnOffset;
                    if (nextRow < 0 || nextRow >= boardSize || nextColumn < 0 || nextColumn >= boardSize) continue;
                    const nextIndex = nextRow * boardSize + nextColumn;
                    if (!state[nextIndex]) candidates.add(nextIndex);
                }
            }
        });
        return [...candidates];
    }

    function evaluate(state) {
        const weights = [0, 3, 18, 180, 12000];
        let score = 0;
        for (const combination of winningCombinations) {
            let aiMarks = 0;
            let humanMarks = 0;
            for (const index of combination.cells) {
                if (state[index] === "O") aiMarks += 1;
                else if (state[index] === "X") humanMarks += 1;
            }
            if (aiMarks && humanMarks) continue;
            if (aiMarks) score += weights[aiMarks];
            if (humanMarks) score -= weights[humanMarks] * 1.12;
        }
        state.forEach((mark, index) => {
            if (!mark) return;
            const row = Math.floor(index / boardSize);
            const column = index % boardSize;
            const middle = (boardSize - 1) / 2;
            const centerValue = boardSize - 1 - Math.abs(middle - row) - Math.abs(middle - column);
            score += (mark === "O" ? 1 : -1) * centerValue * 0.4;
        });
        return score;
    }

    function orderedMoves(state, player) {
        return candidateMoves(state)
            .map(index => {
                state[index] = player;
                const score = evaluate(state);
                state[index] = "";
                return { index, score };
            })
            .sort((a, b) => player === "O" ? b.score - a.score : a.score - b.score)
            .slice(0, 10)
            .map(move => move.index);
    }

    function minimax(state, player, depth, alpha, beta) {
        const winner = getWinner(state);
        if (winner) return winner.player === "O" ? 100000 + depth : -100000 - depth;
        if (depth === 0 || state.every(Boolean)) return evaluate(state);

        const moves = orderedMoves(state, player);
        if (player === "O") {
            let best = -Infinity;
            for (const index of moves) {
                state[index] = player;
                best = Math.max(best, minimax(state, "X", depth - 1, alpha, beta));
                state[index] = "";
                alpha = Math.max(alpha, best);
                if (beta <= alpha) break;
            }
            return best;
        }

        let best = Infinity;
        for (const index of moves) {
            state[index] = player;
            best = Math.min(best, minimax(state, "O", depth - 1, alpha, beta));
            state[index] = "";
            beta = Math.min(beta, best);
            if (beta <= alpha) break;
        }
        return best;
    }

    function chooseGodMove() {
        const moves = candidateMoves(marks);
        for (const index of moves) {
            marks[index] = "O";
            const wins = Boolean(getWinner(marks));
            marks[index] = "";
            if (wins) return index;
        }
        for (const index of moves) {
            marks[index] = "X";
            const blocks = Boolean(getWinner(marks));
            marks[index] = "";
            if (blocks) return index;
        }

        let bestScore = -Infinity;
        let bestMoves = [];
        for (const index of orderedMoves(marks, "O")) {
            marks[index] = "O";
            const score = minimax(marks, "X", SEARCH_DEPTH - 1, -Infinity, Infinity);
            marks[index] = "";
            if (score > bestScore) {
                bestScore = score;
                bestMoves = [index];
            } else if (score === bestScore) {
                bestMoves.push(index);
            }
        }
        return bestMoves[Math.floor(Math.random() * bestMoves.length)];
    }

    function chooseBeginnerMove() {
        const moves = candidateMoves(marks);
        if (Math.random() < 0.35) {
            const winningMove = moves.find(index => {
                marks[index] = "O";
                const wins = Boolean(getWinner(marks));
                marks[index] = "";
                return wins;
            });
            if (winningMove !== undefined) return winningMove;
        }

        if (Math.random() < 0.2) {
            const blockingMove = moves.find(index => {
                marks[index] = "X";
                const blocks = Boolean(getWinner(marks));
                marks[index] = "";
                return blocks;
            });
            if (blockingMove !== undefined) return blockingMove;
        }
        return moves[Math.floor(Math.random() * moves.length)];
    }

    function scheduleAiMove() {
        clearAiTurn();
        render();
        aiTimeout = window.setTimeout(() => {
            aiTimeout = 0;
            if (mode !== "ai" || paused || gameOver || currentPlayer !== "O") return;
            const move = difficulty === "god" ? chooseGodMove() : chooseBeginnerMove();
            if (Number.isInteger(move)) placeMark(move, "O");
        }, 320);
    }

    function resetRound() {
        clearAiTurn();
        marks = Array(boardSize * boardSize).fill("");
        currentPlayer = "X";
        paused = false;
        gameOver = false;
        pauseButton.hidden = mode === "online";
        clearWinDisplay();
        render();
    }

    function showModeScreen() {
        if (pollInterval) clearInterval(pollInterval);
        if (lobbyTimerInterval) clearInterval(lobbyTimerInterval);
        lobbyTimerInterval = 0;
        lobbyWaitingPanel.hidden = true;
        onlineOptions.hidden = true;
        onlineCreateOptions.hidden = true;
        onlineFeedback.textContent = "";
        createRoomButton.hidden = false;
        confirmCreateRoomButton.disabled = false;
        joinRoomForm.hidden = false;
        confirmCreateRoomButton.textContent = `Create ${selectedOnlineSize}x${selectedOnlineSize} lobby`;
        modeTitle.textContent = "Choose a mode";
        modeDescription.textContent = "Play against the AI or take turns with a friend.";
        modeOptions.hidden = false;
        difficultyOptions.hidden = true;
        boardSizeOptions.hidden = true;
    }

    function showDifficultyScreen() {
        playGameSound("tttMenu");
        modeTitle.textContent = "Choose difficulty";
        modeDescription.textContent = "Pick how challenging you want the AI to be.";
        modeOptions.hidden = true;
        difficultyOptions.hidden = false;
        boardSizeOptions.hidden = true;
        difficultyButtons[0].focus({ preventScroll: true });
    }

    function showBoardSizeScreen() {
        playGameSound("tttMenu");
        modeTitle.textContent = "Choose a board size";
        modeDescription.textContent = "Pick the grid for your two-player game.";
        modeOptions.hidden = true;
        difficultyOptions.hidden = true;
        boardSizeOptions.hidden = false;
        boardSizeButtons[0].focus({ preventScroll: true });
    }

    function showOnlineOptions() {
        playGameSound("tttMenu");
        modeTitle.textContent = "Online Matchmaking";
        modeDescription.textContent = "Create a room code or join an existing lobby.";
        modeOptions.hidden = true;
        difficultyOptions.hidden = true;
        boardSizeOptions.hidden = true;
        onlineOptions.hidden = false;
        onlineCreateOptions.hidden = true;
        joinRoomForm.hidden = false;
        createRoomButton.hidden = false;
        onlineFeedback.textContent = "";
    }

    function selectMode(nextMode, nextDifficulty = null, nextBoardSize = null) {
        playGameSound("tttMenu");
        mode = nextMode;
        difficulty = nextDifficulty;
        boardSize = nextBoardSize ?? (mode === "ai" && difficulty === "god" ? 5 : 4);
        winningCombinations = buildWinningCombinations(boardSize);
        boardElement.style.setProperty("--ttt-grid-size", boardSize);
        boardElement.setAttribute("aria-label", `${boardSize} by ${boardSize} Tic-Tac-Toe board`);
        game.classList.remove("is-choosing");
        modePicker.hidden = true;
        gameContent.setAttribute("aria-hidden", "false");
        modeLabel.textContent = mode === "ai"
            ? `AI · ${difficulty === "god" ? "God Mode · 5x5" : "Beginner · 4x4"}`
            : `Two-player · ${boardSize}x${boardSize}`;
        resetRound();
        const middle = Math.floor(boardSize / 2);
        cells[middle * boardSize + middle].focus({ preventScroll: true });
    }

    function startOnlineGame(size, role) {
        mode = "online";
        boardSize = size;
        winningCombinations = buildWinningCombinations(boardSize);
        boardElement.style.setProperty("--ttt-grid-size", boardSize);
        boardElement.setAttribute("aria-label", `${boardSize} by ${boardSize} Tic-Tac-Toe board`);
        game.classList.remove("is-choosing");
        modePicker.hidden = true;
        gameContent.setAttribute("aria-hidden", "false");
        modeLabel.textContent = `Online · Lobby ${onlineRoomId} · Role ${role}`;
        resetRound();
    }

    // Event Listeners for UI Navigation
    modeButtons.forEach(button => {
        button.addEventListener("click", () => {
            if (button.dataset.mode === "ai") showDifficultyScreen();
            else showBoardSizeScreen();
        });
    });

    onlineButton.addEventListener("click", showOnlineOptions);

    difficultyButtons.forEach(button => {
        button.addEventListener("click", () => selectMode("ai", button.dataset.difficulty));
    });

    boardSizeButtons.forEach(button => {
        button.addEventListener("click", () => selectMode("pvp", null, Number(button.dataset.boardSize)));
    });

    onlineBackButton.addEventListener("click", () => {
        showModeScreen();
        onlineButton.focus({ preventScroll: true });
    });

    backButton.addEventListener("click", () => {
        showModeScreen();
        modeButtons[0].focus({ preventScroll: true });
    });

    boardSizeBackButton.addEventListener("click", () => {
        showModeScreen();
        modeButtons[1].focus({ preventScroll: true });
    });

    onlineSizeButtons.forEach(button => {
        button.addEventListener("click", () => {
            onlineSizeButtons.forEach(btn => {
                btn.classList.remove("is-active");
                btn.setAttribute("aria-pressed", "false");
            });
            button.classList.add("is-active");
            button.setAttribute("aria-pressed", "true");
            selectedOnlineSize = Number(button.dataset.onlineBoardSize);
            confirmCreateRoomButton.textContent = `Create ${selectedOnlineSize}x${selectedOnlineSize} lobby`;
        });
    });

    // Reveal board size choices only after the user chooses to create a lobby.
    createRoomButton.addEventListener("click", async () => {
        joinRoomForm.hidden = true;
        onlineCreateOptions.hidden = false;
        createRoomButton.hidden = true;
    });

    // Create Room
    confirmCreateRoomButton.addEventListener("click", async () => {
        confirmCreateRoomButton.disabled = true;
        onlineFeedback.textContent = "Creating room...";
        try {
            const res = await fetch(`${TTT_HELPER_API}/api/match/create?size=${selectedOnlineSize}`, { method: "POST" });
            if (res.status === 429) onlineButton.hidden = true;
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to create room");

            onlineRoomId = data.roomId;
            onlineRole = data.role;
            playerToken = data.token;
            onlineReady = false;

            onlineRoomCode.textContent = onlineRoomId;
            lobbyWaitingPanel.hidden = false;
            onlineCreateOptions.hidden = true;
            onlineRoomCode.textContent = onlineRoomId;
            lobbyExpiresAt = Date.now() + 30_000;
            lobbyCountdown.textContent = "30";
            onlineFeedback.textContent = "Waiting for opponent to join...";
            if (lobbyTimerInterval) clearInterval(lobbyTimerInterval);
            lobbyTimerInterval = window.setInterval(() => {
                const secondsLeft = Math.max(0, Math.ceil((lobbyExpiresAt - Date.now()) / 1000));
                lobbyCountdown.textContent = String(secondsLeft);
                if (secondsLeft === 0) {
                    clearInterval(lobbyTimerInterval);
                    lobbyTimerInterval = 0;
                    if (!onlineReady) {
                        onlineFeedback.textContent = "This lobby expired. Create another one to play.";
                        lobbyWaitingPanel.hidden = true;
                        onlineRoomId = null;
                        playerToken = null;
                        if (pollInterval) clearInterval(pollInterval);
                    }
                }
            }, 250);
            pollForOpponent();
        } catch (err) {
            onlineFeedback.textContent = err.message;
        } finally {
            confirmCreateRoomButton.disabled = false;
        }
    });

    // Join Room
    joinRoomForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const code = roomCodeInput.value.trim().toUpperCase();
        if (!code) return;

        onlineFeedback.textContent = "Joining room...";
        try {
            const res = await fetch(`${TTT_HELPER_API}/api/match/join?room=${encodeURIComponent(code)}`, { method: "POST" });
            if (res.status === 429) onlineButton.hidden = true;
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to join room");

            onlineRoomId = data.roomId;
            onlineRole = data.role;
            playerToken = data.token;
            onlineReady = true;
            onlineRoomCode.textContent = onlineRoomId;
            lobbyWaitingPanel.hidden = true;
            if (lobbyTimerInterval) clearInterval(lobbyTimerInterval);
            lobbyTimerInterval = 0;

            startOnlineGame(data.size, onlineRole);
            onlineFeedback.textContent = "Connected! Game starting...";
            startPollingState();
        } catch (err) {
            onlineFeedback.textContent = err.message;
        }
    });

    copyRoomCodeButton.addEventListener("click", () => {
        navigator.clipboard.writeText(onlineRoomId).then(() => {
            copyRoomCodeButton.textContent = "Copied!";
            setTimeout(() => copyRoomCodeButton.textContent = "Copy code", 2000);
        }).catch(() => {
            onlineFeedback.textContent = "Copy failed. Select and copy the code above.";
        });
    });

    cancelLobbyButton.addEventListener("click", async () => {
        if (pollInterval) clearInterval(pollInterval);
        pollInterval = 0;
        if (onlineRoomId && playerToken) {
            try {
                const response = await fetch(`${TTT_HELPER_API}/api/match/end`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ room: onlineRoomId, token: playerToken })
                });
                if (!response.ok && response.status !== 404) throw new Error("The lobby could not be closed. Please try again.");
            } catch (error) {
                onlineFeedback.textContent = error.message || "The lobby could not be reached. Please try again.";
                pollForOpponent();
                return;
            }
        }
        if (lobbyTimerInterval) clearInterval(lobbyTimerInterval);
        pollInterval = 0;
        lobbyTimerInterval = 0;
        onlineRoomId = null;
        playerToken = null;
        onlineReady = false;
        lobbyWaitingPanel.hidden = true;
        onlineCreateOptions.hidden = true;
        joinRoomForm.hidden = false;
        createRoomButton.hidden = false;
        onlineFeedback.textContent = "Lobby cancelled.";
    });

    endOnlineMatchButton.addEventListener("click", async () => {
        endOnlineMatchButton.disabled = true;
        if (pollInterval) clearInterval(pollInterval);
        if (onlineRoomId && playerToken) {
            try {
                const response = await fetch(`${TTT_HELPER_API}/api/match/end`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ room: onlineRoomId, token: playerToken })
                });
                if (!response.ok && response.status !== 404) throw new Error("The match could not be ended. Please try again.");
            } catch (error) {
                onlineFeedback.textContent = error.message || "The helper could not be reached. Please try again.";
                endOnlineMatchButton.disabled = false;
                if (!gameOver) startPollingState();
                return;
            }
        }
        onlineRoomId = null;
        playerToken = null;
        onlineReady = false;
        endOnlineMatchButton.disabled = false;
        changeModeButton.click();
    });

    function startPollingState() {
        if (pollInterval) clearInterval(pollInterval);
        pollInterval = setInterval(async () => {
            if (!onlineRoomId) return;
            try {
                const res = await fetch(`${TTT_HELPER_API}/api/match/state?room=${encodeURIComponent(onlineRoomId)}&token=${encodeURIComponent(playerToken)}`);
                const data = await res.json();
                if (res.ok) {
                    onlineReady = true;
                    marks = data.board;
                    currentPlayer = data.turn;
                    if (data.status === "ended") {
                        clearInterval(pollInterval);
                        pollInterval = 0;
                        showOnlineMatchEnded(data.reason === "disconnect" ? "Opponent disconnected. Match ended." : "The lobby was closed.");
                        return;
                    }
                    if (data.status === "playing" && onlineFeedback.textContent.includes("Waiting")) {
                        onlineFeedback.textContent = "Opponent joined!";
                    }
                    if (data.status === "finished") {
                        const winner = getWinner(marks);
                        finishRound(winner);
                        clearInterval(pollInterval);
                    } else {
                        render();
                    }
                } else if (res.status === 404) {
                    clearInterval(pollInterval);
                    pollInterval = 0;
                    showOnlineMatchEnded("The lobby expired or the opponent disconnected. Match ended.");
                }
            } catch (e) {
                console.error("Polling error", e);
            }
        }, 1200);
    }

    function pollForOpponent() {
        if (pollInterval) clearInterval(pollInterval);
        pollInterval = setInterval(async () => {
            if (!onlineRoomId) return;
            try {
                const res = await fetch(`${TTT_HELPER_API}/api/match/state?room=${encodeURIComponent(onlineRoomId)}&token=${encodeURIComponent(playerToken)}`);
                const data = await res.json();
                if (res.ok && data.status === "playing") {
                    onlineReady = true;
                    if (lobbyTimerInterval) clearInterval(lobbyTimerInterval);
                    lobbyTimerInterval = 0;
                    marks = data.board;
                    currentPlayer = data.turn;
                    onlineFeedback.textContent = "Opponent joined! Your turn.";
                    clearInterval(pollInterval);
                    startOnlineGame(data.size || selectedOnlineSize, onlineRole);
                    render();
                    startPollingState();
                }
            } catch (e) {}
        }, 1200);
    }

    function showOnlineMatchEnded(message) {
        if (pollInterval) clearInterval(pollInterval);
        pollInterval = 0;
        if (lobbyTimerInterval) clearInterval(lobbyTimerInterval);
        lobbyTimerInterval = 0;
        onlineReady = false;
        gameOver = true;
        paused = false;
        pauseButton.hidden = true;
        endOnlineMatchButton.hidden = false;
        endOnlineMatchButton.disabled = false;
        document.querySelector(".ttt-actions")?.classList.add("online-active");
        status.textContent = message;
        renderCellsOnly();
    }

    // Cell Clicks (Supports PvP, AI, and Online Move Submissions)
    cells.forEach((cell, index) => {
        cell.addEventListener("click", async () => {
            if (mode === "pvp") {
                placeMark(index, currentPlayer);
            } else if (mode === "ai" && currentPlayer === "X") {
                placeMark(index, currentPlayer);
            } else if (mode === "online" && currentPlayer === onlineRole && !marks[index] && !gameOver && !paused) {
                // Optimistic local update
                playGameSound(onlineRole === "X" ? "tttMoveX" : "tttMoveO");
                marks[index] = onlineRole;
                const nextTurn = onlineRole === "X" ? "O" : "X";
                currentPlayer = nextTurn;
                render();

                try {
                    const res = await fetch(`${TTT_HELPER_API}/api/match/move`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            room: onlineRoomId,
                            token: playerToken,
                            index: index
                        })
                    });
                    const data = await res.json();
                    if (!res.ok) {
                        if (res.status === 404) {
                            showOnlineMatchEnded("Opponent disconnected. Match ended.");
                            return;
                        }
                        throw new Error(data.error);
                    }

                    onlineReady = true;
                    marks = data.board;
                    currentPlayer = data.turn;
                    if (data.status === "finished") {
                        const winner = getWinner(marks);
                        finishRound(winner);
                        if (pollInterval) clearInterval(pollInterval);
                    } else {
                        render();
                    }
                } catch (e) {
                    console.error("Failed to sync move", e);
                }
            }
        });
    });

    document.addEventListener("pointerdown", event => {
        if (event.target.closest(".ttt-game button")) playGameSound("tttPress");
    }, { capture: true });
    document.addEventListener("click", event => {
        if (event.detail === 0 && event.target.closest(".ttt-game button")) playGameSound("tttPress");
    }, { capture: true });

    pauseButton.addEventListener("click", () => {
        if (gameOver || mode === "online") return;
        paused = !paused;
        playGameSound("tttPause");
        if (paused) clearAiTurn();
        render();
        if (!paused && mode === "ai" && currentPlayer === "O") scheduleAiMove();
    });

    restartButton.addEventListener("click", () => {
        if (mode !== "online") resetRound();
    });

    changeModeButton.addEventListener("click", () => {
        clearAiTurn();
        if (pollInterval) clearInterval(pollInterval);
        mode = null;
        difficulty = null;
        boardSize = 4;
        winningCombinations = buildWinningCombinations(boardSize);
        boardElement.style.setProperty("--ttt-grid-size", boardSize);
        boardElement.setAttribute("aria-label", `${boardSize} by ${boardSize} Tic-Tac-Toe board`);
        modeLabel.textContent = "AI · Beginner · 4x4";
        game.classList.add("is-choosing");
        modePicker.hidden = false;
        gameContent.setAttribute("aria-hidden", "true");
        showModeScreen();
        clearWinDisplay();
        paused = false;
        gameOver = false;
        render();
    });

    render();
})();
