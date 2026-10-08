(() => {
    const WIN_LENGTH = 4;
    const SEARCH_DEPTH = 4;
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
    const backButton = document.getElementById("mode-back");
    const modeButtons = [...document.querySelectorAll(".ttt-mode-button[data-mode]")];
    const difficultyButtons = [...document.querySelectorAll(".ttt-mode-button[data-difficulty]")];

    if (!modePicker || !game || !gameContent || !status || !boardElement || cells.length !== 25 || !pauseButton || !restartButton || !changeModeButton || !modeLabel || !winLine || !pausedOverlay || modeButtons.length !== 2 || difficultyButtons.length !== 2 || !modeTitle || !modeDescription || !modeOptions || !difficultyOptions || !backButton) {
        console.error("Tic Tac Toe Online could not initialize because required game elements are missing.");
        return;
    }

    const directions = [
        { row: 0, column: 1, name: "horizontal" },
        { row: 1, column: 0, name: "vertical" },
        { row: 1, column: 1, name: "diagonal-down" },
        { row: 1, column: -1, name: "diagonal-up" }
    ];

    let boardSize = 5;

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

    let winningCombinations = buildWinningCombinations(boardSize);
    let mode = null;
    let difficulty = null;
    let marks = Array(boardSize * boardSize).fill("");
    let currentPlayer = "X";
    let paused = false;
    let gameOver = false;
    let aiTimeout = 0;

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
        if (!mode) return "Choose a mode to begin.";
        if (paused) return "Game paused";
        if (mode === "ai" && currentPlayer === "O" && !gameOver) return "AI is thinking…";
        if (mode === "ai") return "Your turn · X";
        return `Player ${currentPlayer}'s turn`;
    }

    function render() {
        const aiThinking = mode === "ai" && currentPlayer === "O" && !gameOver && !paused;

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
            cell.disabled = !mode || paused || gameOver || aiThinking || Boolean(mark);
        });

        pauseButton.textContent = paused ? "Resume" : "Pause";
        pauseButton.disabled = !mode || gameOver;
        restartButton.disabled = !mode;
        changeModeButton.disabled = !mode;
        status.textContent = getStatusText();
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
        if (winner) {
            showWinningStroke(winner);
            if (mode === "ai") status.textContent = winner.player === "X" ? "You win!" : "The AI wins.";
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
        const winningMove = moves.find(index => {
            marks[index] = "O";
            const wins = Boolean(getWinner(marks));
            marks[index] = "";
            return wins;
        });
        if (winningMove !== undefined) return winningMove;

        if (Math.random() < 0.35) {
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
        pauseButton.hidden = false;
        clearWinDisplay();
        render();
    }

    function showModeScreen() {
        modeTitle.textContent = "Choose a mode";
        modeDescription.textContent = "Play against the AI or take turns with a friend.";
        modeOptions.hidden = false;
        difficultyOptions.hidden = true;
    }

    function showDifficultyScreen() {
        playGameSound("tttMenu");
        modeTitle.textContent = "Choose difficulty";
        modeDescription.textContent = "Pick how challenging you want the AI to be.";
        modeOptions.hidden = true;
        difficultyOptions.hidden = false;
        difficultyButtons[0].focus({ preventScroll: true });
    }

    function selectMode(nextMode, nextDifficulty = null) {
        playGameSound("tttMenu");
        mode = nextMode;
        difficulty = nextDifficulty;
        boardSize = mode === "ai" && difficulty === "god" ? 5 : 4;
        winningCombinations = buildWinningCombinations(boardSize);
        boardElement.style.setProperty("--ttt-grid-size", boardSize);
        boardElement.setAttribute("aria-label", `${boardSize} by ${boardSize} Tic-Tac-Toe board`);
        game.classList.remove("is-choosing");
        modePicker.hidden = true;
        gameContent.setAttribute("aria-hidden", "false");
        modeLabel.textContent = mode === "ai"
            ? `AI · ${difficulty === "god" ? "God Mode · 5×5" : "Beginner · 4×4"}`
            : "Two-player mode · 4×4";
        resetRound();
        const middle = Math.floor(boardSize / 2);
        cells[middle * boardSize + middle].focus({ preventScroll: true });
    }

    modeButtons.forEach(button => {
        button.addEventListener("click", () => {
            if (button.dataset.mode === "ai") showDifficultyScreen();
            else selectMode("pvp");
        });
    });

    difficultyButtons.forEach(button => {
        button.addEventListener("click", () => selectMode("ai", button.dataset.difficulty));
    });

    backButton.addEventListener("click", () => {
        showModeScreen();
        modeButtons[0].focus({ preventScroll: true });
    });

    cells.forEach((cell, index) => {
        cell.addEventListener("click", () => {
            if (mode !== "pvp" && mode !== "ai") return;
            if (mode === "ai" && currentPlayer !== "X") return;
            placeMark(index, currentPlayer);
        });
    });

    document.addEventListener("pointerdown", event => {
        if (event.target.closest(".ttt-game button")) playGameSound("tttPress");
    }, { capture: true });
    document.addEventListener("click", event => {
        if (event.detail === 0 && event.target.closest(".ttt-game button")) playGameSound("tttPress");
    }, { capture: true });

    pauseButton.addEventListener("click", () => {
        if (gameOver) return;
        paused = !paused;
        playGameSound("tttPause");
        if (paused) clearAiTurn();
        render();
        if (!paused && mode === "ai" && currentPlayer === "O") scheduleAiMove();
    });

    restartButton.addEventListener("click", resetRound);

    changeModeButton.addEventListener("click", () => {
        clearAiTurn();
        mode = null;
        difficulty = null;
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
