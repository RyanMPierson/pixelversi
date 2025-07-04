// --- Game Constants ---
const EMPTY = 0;
const WHITE = 1;
const BLACK = 2;
const BOARD_SIZE = 8;

// --- Game State ---
let board = [];
let currentPlayer = WHITE; // White always starts
let userPlayerColor = null; // Will be set by user choice
let gameActive = false;

// --- DOM Elements ---
const reversiBoard = document.getElementById('reversi-board');
const currentPlayerDisplay = document.getElementById('current-player-display');
const whiteScoreDisplay = document.getElementById('white-score');
const blackScoreDisplay = document.getElementById('black-score');
const gameMessage = document.getElementById('game-message');
const newGameBtn = document.getElementById('new-game-btn');
const playWhiteBtn = document.getElementById('play-white-btn');
const playBlackBtn = document.getElementById('play-black-btn');

// --- Game Initialization ---
function initializeBoard() {
    board = Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(EMPTY));
    board[3][3] = WHITE;
    board[3][4] = BLACK;
    board[4][3] = BLACK;
    board[4][4] = WHITE;
}

function renderBoard(justFlipped = [], placed = null) {
    reversiBoard.innerHTML = '';
    for (let r = 0; r < BOARD_SIZE; r++) {
        for (let c = 0; c < BOARD_SIZE; c++) {
            const cell = document.createElement('div');
            cell.classList.add('cell');
            cell.dataset.row = r;
            cell.dataset.col = c;

            if (board[r][c] !== EMPTY) {
                const piece = document.createElement('div');
                piece.classList.add('piece', board[r][c] === WHITE ? 'white' : 'black');
                // Animate flips
                if (justFlipped.some(f => f.r === r && f.c === c)) {
                    piece.classList.add(`flipping-to-${board[r][c] === WHITE ? 'white' : 'black'}`);
                    setTimeout(() => {
                        piece.classList.remove('flipping-to-white');
                        piece.classList.remove('flipping-to-black');
                    }, 500);
                }
                cell.appendChild(piece);
            }
            reversiBoard.appendChild(cell);
        }
    }
    updateScoreDisplay();
    updatePlayerDisplay();
    showValidMoves();
}

function updateScoreDisplay() {
    let whiteCount = 0;
    let blackCount = 0;
    for (let r = 0; r < BOARD_SIZE; r++) {
        for (let c = 0; c < BOARD_SIZE; c++) {
            if (board[r][c] === WHITE) {
                whiteCount++;
            } else if (board[r][c] === BLACK) {
                blackCount++;
            }
        }
    }
    whiteScoreDisplay.textContent = whiteCount;
    blackScoreDisplay.textContent = blackCount;
}

function updatePlayerDisplay() {
    currentPlayerDisplay.textContent = currentPlayer === WHITE ? 'White' : 'Black';
    currentPlayerDisplay.style.color = currentPlayer === WHITE ? '#ffcc00' : '#00ffff';
}

function showGameMessage(msg, isError = false) {
    gameMessage.textContent = msg;
    gameMessage.style.color = isError ? '#ff6666' : '#ccffcc'; // Red for error, green for success/info
}

// --- Game Logic ---

// Directions to check for flips (row_delta, col_delta)
const directions = [
    [-1, 0], [1, 0], [0, -1], [0, 1], // Horizontal & Vertical
    [-1, -1], [-1, 1], [1, -1], [1, 1]  // Diagonals
];

function isValidMove(row, col, player) {
    if (board[row][col] !== EMPTY) {
        return false;
    }

    for (const [dr, dc] of directions) {
        if (checkDirectionForFlip(row, col, dr, dc, player, false).length > 0) {
            return true;
        }
    }
    return false;
}

function checkDirectionForFlip(startR, startC, dr, dc, player, executeFlip = false) {
    const opponent = player === WHITE ? BLACK : WHITE;
    const flippedPieces = [];
    let r = startR + dr;
    let c = startC + dc;

    while (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE && board[r][c] === opponent) {
        flippedPieces.push({ r, c });
        r += dr;
        c += dc;
    }

    if (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE && board[r][c] === player) {
        return flippedPieces;
    }
    return [];
}

function getValidMoves(player) {
    const validMoves = [];
    for (let r = 0; r < BOARD_SIZE; r++) {
        for (let c = 0; c < BOARD_SIZE; c++) {
            if (isValidMove(r, c, player)) {
                validMoves.push({ r, c });
            }
        }
    }
    return validMoves;
}

function makeMove(row, col, player) {
    if (!isValidMove(row, col, player)) {
        showGameMessage("Invalid move!", true);
        return false;
    }

    board[row][col] = player;
    let justFlipped = [];
    for (const [dr, dc] of directions) {
        const flips = checkDirectionForFlip(row, col, dr, dc, player, false);
        flips.forEach(p => {
            board[p.r][p.c] = player;
            justFlipped.push({ r: p.r, c: p.c });
        });
    }
    renderBoard(justFlipped, { r: row, c: col });
    updateScoreDisplay();
    return true;
}

function switchPlayer() {
    currentPlayer = currentPlayer === WHITE ? BLACK : WHITE;
    updatePlayerDisplay();
    showValidMoves();
    checkGameOver();

    if (gameActive && currentPlayer !== userPlayerColor) {
        // It's computer's turn
        setTimeout(computerMove, 1000); // Delay for better UX
    }
}

function checkGameOver() {
    const whiteMoves = getValidMoves(WHITE);
    const blackMoves = getValidMoves(BLACK);

    if (whiteMoves.length === 0 && blackMoves.length === 0) {
        gameActive = false;
        const whiteScore = parseInt(whiteScoreDisplay.textContent);
        const blackScore = parseInt(blackScoreDisplay.textContent);

        let winnerMessage = '';
        if (whiteScore > blackScore) {
            winnerMessage = 'White wins!';
        } else if (blackScore > whiteScore) {
            winnerMessage = 'Black wins!';
        } else {
            winnerMessage = 'It\'s a draw!';
        }
        showGameMessage(`Game Over! ${winnerMessage}`);
    } else if (getValidMoves(currentPlayer).length === 0) {
        showGameMessage(`${currentPlayer === WHITE ? 'White' : 'Black'} has no moves. Skipping turn.`);
        setTimeout(switchPlayer, 1000); // Automatically switch if no moves
    }
}

function showValidMoves() {
    // Remove previous highlights
    document.querySelectorAll('.cell.valid-move').forEach(cell => {
        cell.classList.remove('valid-move');
    });

    if (gameActive && currentPlayer === userPlayerColor) {
        const validMoves = getValidMoves(userPlayerColor);
        validMoves.forEach(move => {
            const cellElement = reversiBoard.children[move.r * BOARD_SIZE + move.c];
            cellElement.classList.add('valid-move');
        });
    }
}

// --- Computer AI (Simple Greedy) ---
function computerMove() {
    const validMoves = getValidMoves(currentPlayer);
    if (validMoves.length === 0) {
        showGameMessage(`Computer (${currentPlayer === WHITE ? 'White' : 'Black'}) has no moves.`);
        setTimeout(switchPlayer, 1000); // Skip computer's turn
        return;
    }

    let bestMove = null;
    let maxFlips = -1;

    // Simulate each move to find the one that flips the most pieces
    for (const move of validMoves) {
        const tempBoard = JSON.parse(JSON.stringify(board)); // Deep copy
        let currentFlips = 0;

        tempBoard[move.r][move.c] = currentPlayer;

        for (const [dr, dc] of directions) {
            const opponent = currentPlayer === WHITE ? BLACK : WHITE;
            let r = move.r + dr;
            let c = move.c + dc;
            const piecesToFlipInDirection = [];

            while (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE && tempBoard[r][c] === opponent) {
                piecesToFlipInDirection.push({ r, c });
                r += dr;
                c += dc;
            }

            if (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE && tempBoard[r][c] === currentPlayer) {
                currentFlips += piecesToFlipInDirection.length;
            }
        }

        if (currentFlips > maxFlips) {
            maxFlips = currentFlips;
            bestMove = move;
        }
    }

    if (bestMove) {
        showGameMessage(`Computer (${currentPlayer === WHITE ? 'White' : 'Black'}) moves to (${bestMove.r}, ${bestMove.c})`);
        makeMove(bestMove.r, bestMove.c, currentPlayer);
        setTimeout(switchPlayer, 500); // Wait for animation before switching
    }
}

// --- Reset to Player Selection ---
function resetToPlayerSelection() {
    userPlayerColor = null;
    document.querySelector('.player-selection').style.display = 'block';
    newGameBtn.style.display = 'none';
    showGameMessage("Choose your player color to start!");
    reversiBoard.innerHTML = '';
    currentPlayerDisplay.textContent = '';
    whiteScoreDisplay.textContent = '2';
    blackScoreDisplay.textContent = '2';
}

// --- Event Listeners ---
reversiBoard.addEventListener('click', (event) => {
    if (!gameActive || currentPlayer !== userPlayerColor) {
        showGameMessage("It's not your turn or the game is not active!", true);
        return;
    }

    const cell = event.target.closest('.cell');
    if (cell) {
        const row = parseInt(cell.dataset.row);
        const col = parseInt(cell.dataset.col);

        if (makeMove(row, col, userPlayerColor)) {
            setTimeout(switchPlayer, 500); // Wait for animation before switching
        }
    }
});

newGameBtn.addEventListener('click', resetToPlayerSelection);
playWhiteBtn.addEventListener('click', () => startGame(WHITE));
playBlackBtn.addEventListener('click', () => startGame(BLACK));

function startGame(playerColor = null) {
    if (playerColor) {
        userPlayerColor = playerColor;
        document.querySelector('.player-selection').style.display = 'none';
        newGameBtn.style.display = 'block'; // Show new game button after selection
    } else if (userPlayerColor === null) {
        showGameMessage("Please select a player color first!", true);
        return;
    }

    initializeBoard();
    currentPlayer = WHITE; // White always goes first in Reversi
    gameActive = true;
    showGameMessage("Game started!");
    renderBoard();
    showValidMoves(); // Highlight initial valid moves

    if (currentPlayer !== userPlayerColor) {
        setTimeout(computerMove, 1000); // Computer's turn if user chose Black
    }
}

// Initial state: hide new game button until a player color is selected
newGameBtn.style.display = 'none';
showGameMessage("Choose your player color to start!");

const scanlines = document.getElementById('scanlines');
const scanlinesBtn = document.getElementById('toggle-scanlines-btn');

if (scanlinesBtn) {
    scanlinesBtn.addEventListener('click', () => {
        if (scanlines.style.display === 'none') {
            scanlines.style.display = 'block';
        } else {
            scanlines.style.display = 'none';
        }
    });
}

// Show scanlines by default
if (scanlines) scanlines.style.display = 'block';