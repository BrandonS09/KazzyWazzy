// Fully Functional Multiplayer Game Implementations

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {};
}

class TicTacToe {
  constructor(container, onMove, onGameEnd, isPlayer1) {
    this.container = container;
    this.onMove = onMove;
    this.onGameEnd = onGameEnd;
    this.isPlayer1 = isPlayer1;
    this.playerSymbol = isPlayer1 ? 'X' : 'O';
    this.opponentSymbol = isPlayer1 ? 'O' : 'X';
    this.board = Array(9).fill(null);
    this.currentTurn = 'X'; // X always goes first
    this.gameOver = false;
    this.winner = null;
    this.render();
  }

  makeMove(index) {
    if (this.gameOver || this.board[index] !== null) return;
    if (this.currentTurn !== this.playerSymbol) return; // Not your turn

    this.board[index] = this.playerSymbol;
    this.currentTurn = this.opponentSymbol;
    this.render();

    const winner = this.checkWinner();
    if (winner) {
      this.gameOver = true;
      this.winner = winner;
      this.onMove({ type: 'move', index, gameState: winner === this.playerSymbol ? 'win' : 'loss' });
      setTimeout(() => this.onGameEnd(winner === this.playerSymbol ? 'win' : 'loss'), 500);
      return;
    }

    if (this.board.every(cell => cell !== null)) {
      this.gameOver = true;
      this.onMove({ type: 'move', index, gameState: 'draw' });
      setTimeout(() => this.onGameEnd('draw'), 500);
      return;
    }

    this.onMove({ type: 'move', index });
  }

  receivedMove(data) {
    if (this.gameOver) return;

    this.board[data.index] = this.opponentSymbol;
    this.currentTurn = this.playerSymbol;

    if (data.gameState === 'win') {
      this.gameOver = true;
      this.winner = this.opponentSymbol;
      this.render();
      setTimeout(() => this.onGameEnd('loss'), 500);
      return;
    }

    if (data.gameState === 'loss') {
      this.gameOver = true;
      this.winner = this.playerSymbol;
      this.render();
      setTimeout(() => this.onGameEnd('win'), 500);
      return;
    }

    if (data.gameState === 'draw') {
      this.gameOver = true;
      this.render();
      setTimeout(() => this.onGameEnd('draw'), 500);
      return;
    }

    this.render();
  }

  checkWinner() {
    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8],
      [0, 3, 6], [1, 4, 7], [2, 5, 8],
      [0, 4, 8], [2, 4, 6]
    ];

    for (let [a, b, c] of lines) {
      if (this.board[a] && this.board[a] === this.board[b] && this.board[a] === this.board[c]) {
        return this.board[a];
      }
    }
    return null;
  }

  render() {
    const isMyTurn = this.currentTurn === this.playerSymbol && !this.gameOver;
    const statusText = this.gameOver
      ? (this.winner === this.playerSymbol ? '✓ You Won!' : this.winner === this.opponentSymbol ? '✗ You Lost!' : '= Draw')
      : (isMyTurn ? '▶ Your Turn' : '⏳ Opponent Turn');

    this.container.innerHTML = `
      <div class="game-container">
        <h2>Tic Tac Toe</h2>
        <div class="game-status">${statusText}</div>
        <div class="tic-tac-toe-board">
          ${this.board.map((cell, idx) => `
            <div class="cell" onclick="window.currentGame.makeMove(${idx})"
                 style="cursor: ${this.gameOver || this.board[idx] ? 'default' : 'pointer'}">
              <span style="font-size: 2em; font-weight: bold; color: ${cell === 'X' ? '#667eea' : cell === 'O' ? '#ff6b6b' : 'transparent'}">
                ${cell || ''}
              </span>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }
}

class ConnectFour {
  constructor(container, onMove, onGameEnd, isPlayer1) {
    this.container = container;
    this.onMove = onMove;
    this.onGameEnd = onGameEnd;
    this.isPlayer1 = isPlayer1;
    this.playerPiece = isPlayer1 ? 'P' : 'O';
    this.opponentPiece = isPlayer1 ? 'O' : 'P';
    this.board = Array(42).fill(null);
    this.cols = 7;
    this.rows = 6;
    this.currentTurn = 'P'; // Player 1 (red) always goes first
    this.gameOver = false;
    this.winner = null;
    this.render();
  }

  makeMove(col) {
    if (this.gameOver) return;
    if (this.currentTurn !== this.playerPiece) return; // Not your turn

    for (let row = this.rows - 1; row >= 0; row--) {
      const idx = row * this.cols + col;
      if (this.board[idx] === null) {
        this.board[idx] = this.playerPiece;
        this.currentTurn = this.opponentPiece;
        this.render();

        const winner = this.checkWinner();
        if (winner) {
          this.gameOver = true;
          this.winner = winner;
          this.onMove({ type: 'move', col, gameState: winner === this.playerPiece ? 'win' : 'loss' });
          setTimeout(() => this.onGameEnd(winner === this.playerPiece ? 'win' : 'loss'), 500);
          return;
        }

        if (this.board.every(cell => cell !== null)) {
          this.gameOver = true;
          this.onMove({ type: 'move', col, gameState: 'draw' });
          setTimeout(() => this.onGameEnd('draw'), 500);
          return;
        }

        this.onMove({ type: 'move', col });
        return;
      }
    }
  }

  receivedMove(data) {
    if (this.gameOver) return;

    for (let row = this.rows - 1; row >= 0; row--) {
      const idx = row * this.cols + data.col;
      if (this.board[idx] === null) {
        this.board[idx] = this.opponentPiece;
        this.currentTurn = this.playerPiece;
        this.render();

        if (data.gameState === 'win') {
          this.gameOver = true;
          this.winner = this.opponentPiece;
          setTimeout(() => this.onGameEnd('loss'), 500);
          return;
        }

        if (data.gameState === 'loss') {
          this.gameOver = true;
          this.winner = this.playerPiece;
          setTimeout(() => this.onGameEnd('win'), 500);
          return;
        }

        if (data.gameState === 'draw') {
          this.gameOver = true;
          setTimeout(() => this.onGameEnd('draw'), 500);
          return;
        }

        return;
      }
    }
  }

  checkWinner() {
    // Horizontal
    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col <= this.cols - 4; col++) {
        const idx = row * this.cols + col;
        const piece = this.board[idx];
        if (piece && this.board[idx + 1] === piece && this.board[idx + 2] === piece && this.board[idx + 3] === piece) {
          return piece;
        }
      }
    }

    // Vertical
    for (let col = 0; col < this.cols; col++) {
      for (let row = 0; row <= this.rows - 4; row++) {
        const idx = row * this.cols + col;
        const piece = this.board[idx];
        if (piece && this.board[idx + this.cols] === piece &&
            this.board[idx + this.cols * 2] === piece &&
            this.board[idx + this.cols * 3] === piece) {
          return piece;
        }
      }
    }

    // Diagonal \
    for (let row = 0; row <= this.rows - 4; row++) {
      for (let col = 0; col <= this.cols - 4; col++) {
        const idx = row * this.cols + col;
        const piece = this.board[idx];
        if (piece && this.board[idx + this.cols + 1] === piece &&
            this.board[idx + (this.cols + 1) * 2] === piece &&
            this.board[idx + (this.cols + 1) * 3] === piece) {
          return piece;
        }
      }
    }

    // Diagonal /
    for (let row = 3; row < this.rows; row++) {
      for (let col = 0; col <= this.cols - 4; col++) {
        const idx = row * this.cols + col;
        const piece = this.board[idx];
        if (piece && this.board[idx - this.cols + 1] === piece &&
            this.board[idx - (this.cols - 1) * 2] === piece &&
            this.board[idx - (this.cols - 1) * 3] === piece) {
          return piece;
        }
      }
    }

    return null;
  }

  render() {
    const rows = [];
    for (let r = 0; r < this.rows; r++) {
      const cells = [];
      for (let c = 0; c < this.cols; c++) {
        const idx = r * this.cols + c;
        const piece = this.board[idx];
        let color = '#f0f0f0';
        if (piece === 'P') color = '#ff6b6b';
        if (piece === 'O') color = '#ffd93d';

        cells.push(`
          <div class="cell-circle" onclick="window.currentGame.makeMove(${c})"
               style="background-color: ${color}; cursor: ${this.gameOver || this.board[idx] ? 'default' : 'pointer'}"></div>
        `);
      }
      rows.push(`<div class="row">${cells.join('')}</div>`);
    }

    const isMyTurn = this.currentTurn === this.playerPiece && !this.gameOver;
    const statusText = this.gameOver
      ? (this.winner === this.playerPiece ? '✓ You Won!' : this.winner === this.opponentPiece ? '✗ You Lost!' : '= Draw')
      : (isMyTurn ? '▶ Your Turn - Click Column' : '⏳ Opponent Turn');

    this.container.innerHTML = `
      <div class="game-container">
        <h2>Connect Four</h2>
        <div class="game-status">${statusText}</div>
        <div class="connect-four-board">
          ${rows.join('')}
        </div>
      </div>
    `;
  }
}

class Checkers {
  constructor(container, onMove, onGameEnd, isPlayer1) {
    this.container = container;
    this.onMove = onMove;
    this.onGameEnd = onGameEnd;
    this.isPlayer1 = isPlayer1;
    this.playerColor = isPlayer1 ? 'red' : 'black';
    this.opponentColor = isPlayer1 ? 'black' : 'red';
    this.board = this.initializeBoard();
    this.currentTurn = 'red'; // Red generally goes first
    this.gameOver = false;
    this.selectedPiece = null;
    this.winner = null;
    this.mustJump = false;
    this.render();
  }

  initializeBoard() {
    const board = Array(8).fill(null).map(() => Array(8).fill(null));
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        if ((r + c) % 2 === 1) { // Dark squares only
          if (r < 3) board[r][c] = { color: 'black', isKing: false };
          else if (r > 4) board[r][c] = { color: 'red', isKing: false };
        }
      }
    }
    return board;
  }

  handleSquareClick(r, c) {
    if (this.gameOver || this.currentTurn !== this.playerColor) return;

    const piece = this.board[r][c];

    // If a piece is already selected, check if clicking a valid move target
    if (this.selectedPiece) {
      if (piece && piece.color === this.playerColor) {
        // Switch selection
        this.selectedPiece = { r, c };
        this.render();
        return;
      }
      
      const moves = this.getValidMoves(this.selectedPiece.r, this.selectedPiece.c);
      const move = moves.find(m => m.r === r && m.c === c);
      
      if (move) {
        // Execute move
        const fromR = this.selectedPiece.r;
        const fromC = this.selectedPiece.c;
        const pieceMoved = this.board[fromR][fromC];
        
        // Move piece
        this.board[r][c] = pieceMoved;
        this.board[fromR][fromC] = null;
        
        let didJump = false;
        if (move.jump) {
          this.board[move.jump.r][move.jump.c] = null; // Remove captured piece
          didJump = true;
        }

        // Kinging
        let becameKing = false;
        if (pieceMoved.color === 'red' && r === 0 && !pieceMoved.isKing) {
          pieceMoved.isKing = true;
          becameKing = true;
        } else if (pieceMoved.color === 'black' && r === 7 && !pieceMoved.isKing) {
          pieceMoved.isKing = true;
          becameKing = true;
        }

        // Check for double jumps
        let doubleJumpAvailable = false;
        if (didJump && !becameKing) {
          const furtherMoves = this.getValidMoves(r, c).filter(m => m.jump);
          if (furtherMoves.length > 0) {
            doubleJumpAvailable = true;
            this.selectedPiece = { r, c }; // Keep selection on jumping piece
          }
        }

        if (!doubleJumpAvailable) {
          this.currentTurn = this.opponentColor;
          this.selectedPiece = null;
        }

        this.render();
        
        // Check game over
        const winner = this.checkWinner();
        if (winner) {
          this.endGame(winner);
        }

        // Broadcast move
        this.onMove({ 
          type: 'checkers_move', 
          from: {r: fromR, c: fromC}, 
          to: {r, c}, 
          didJump, 
          doubleJumpAvailable,
          gameState: winner ? (winner === this.playerColor ? 'win' : 'loss') : null
        });
        return;
      }
    }

    // Select piece
    if (piece && piece.color === this.playerColor) {
      this.selectedPiece = { r, c };
      this.render();
    }
  }

  receivedMove(data) {
    if (this.gameOver) return;

    if (data.type === 'checkers_move') {
      const { from, to, didJump, doubleJumpAvailable, gameState } = data;
      const pieceMoved = this.board[from.r][from.c];
      
      this.board[to.r][to.c] = pieceMoved;
      this.board[from.r][from.c] = null;

      if (didJump) {
        const jumpR = (from.r + to.r) / 2;
        const jumpC = (from.c + to.c) / 2;
        this.board[jumpR][jumpC] = null;
      }

      // Kinging
      if (pieceMoved.color === 'red' && to.r === 0) pieceMoved.isKing = true;
      if (pieceMoved.color === 'black' && to.r === 7) pieceMoved.isKing = true;

      if (!doubleJumpAvailable) {
        this.currentTurn = this.playerColor;
      }

      this.render();

      if (gameState === 'win') {
        this.endGame(this.opponentColor);
      } else if (gameState === 'loss') {
        this.endGame(this.playerColor);
      }
    }
  }

  getValidMoves(r, c) {
    const piece = this.board[r][c];
    if (!piece) return [];
    
    const moves = [];
    const directions = [];
    
    // Red moves up (-1), Black moves down (+1)
    if (piece.color === 'red' || piece.isKing) directions.push(-1);
    if (piece.color === 'black' || piece.isKing) directions.push(1);

    const cols = [-1, 1];

    for (let dRow of directions) {
      for (let dCol of cols) {
        const nr = r + dRow;
        const nc = c + dCol;

        // Normal move
        if (this.isValidSquare(nr, nc) && this.board[nr][nc] === null) {
          moves.push({ r: nr, c: nc });
        }

        // Jump move
        const jr = r + 2 * dRow;
        const jc = c + 2 * dCol;
        if (this.isValidSquare(jr, jc) && this.board[jr][jc] === null) {
           const midPiece = this.board[nr][nc];
           if (midPiece && midPiece.color !== piece.color) {
             moves.push({ r: jr, c: jc, jump: {r: nr, c: nc} });
           }
        }
      }
    }

    // Force jumps if any exist for this piece (simplified forced jump)
    const jumps = moves.filter(m => m.jump);
    if (jumps.length > 0) return jumps;

    return moves;
  }

  isValidSquare(r, c) {
    return r >= 0 && r < 8 && c >= 0 && c < 8;
  }

  checkWinner() {
    let redCount = 0;
    let blackCount = 0;
    for(let r=0; r<8; r++){
      for(let c=0; c<8; c++){
          if(this.board[r][c]?.color === 'red') redCount++;
          if(this.board[r][c]?.color === 'black') blackCount++;
      }
    }
    if (redCount === 0) return 'black';
    if (blackCount === 0) return 'red';
    return null;
  }

  endGame(winnerColor) {
    this.gameOver = true;
    this.winner = winnerColor;
    const result = winnerColor === this.playerColor ? 'win' : 'loss';
    this.render();
    setTimeout(() => this.onGameEnd(result), 500);
  }

  render() {
    const isMyTurn = this.currentTurn === this.playerColor && !this.gameOver;
    const statusText = this.gameOver
      ? (this.winner === this.playerColor ? '✓ You Won!' : '✗ You Lost!')
      : (isMyTurn ? '▶ Your Turn' : '⏳ Opponent Turn');

    let boardHtml = '';
    
    // We should render board from Player 1's perspective (Red at bottom)
    // If Player 2 (Black), maybe rotate board? Let's keep it fixed for simplicity.
    const isP2 = !this.isPlayer1;

    for (let r = 0; r < 8; r++) {
      let actualR = isP2 ? 7 - r : r;
      let rowHtml = '';
      for (let c = 0; c < 8; c++) {
        let actualC = isP2 ? 7 - c : c;
        const isDark = (actualR + actualC) % 2 === 1;
        const piece = this.board[actualR][actualC];
        
        let highlight = '';
        if (this.selectedPiece && this.selectedPiece.r === actualR && this.selectedPiece.c === actualC) {
          highlight = 'border: 2px solid yellow;';
        }

        let pieceHtml = '';
        if (piece) {
            const isKingStr = piece.isKing ? 'K' : '';
            pieceHtml = `<div class="checkers-piece ${piece.color}" style="${highlight}">${isKingStr}</div>`;
        }

        // Check if an available move target
        let targetDot = '';
        if (this.selectedPiece && isMyTurn) {
           const moves = this.getValidMoves(this.selectedPiece.r, this.selectedPiece.c);
           if (moves.find(m => m.r === actualR && m.c === actualC)) {
               targetDot = `<div class="move-dot"></div>`;
           }
        }

        rowHtml += `<div class="checkers-square ${isDark ? 'dark' : 'light'}" 
             onclick="window.currentGame.handleSquareClick(${actualR}, ${actualC})">
          ${pieceHtml}
          ${targetDot}
        </div>`;
      }
      boardHtml += `<div class="checkers-row">${rowHtml}</div>`;
    }

    this.container.innerHTML = `
      <div class="game-container">
        <h2>Checkers</h2>
        <div class="game-status">${statusText}</div>
        <div class="checkers-board ${isP2 ? 'rotated' : ''}">
          ${boardHtml}
        </div>
      </div>
    `;
  }
}

class Chess {
  constructor(container, onMove, onGameEnd, isPlayer1) {
    this.container = container;
    this.onMove = onMove;
    this.onGameEnd = onGameEnd;
    this.isPlayer1 = isPlayer1;
    this.playerColor = isPlayer1 ? 'white' : 'black';
    this.opponentColor = isPlayer1 ? 'black' : 'white';
    this.board = this.initializeBoard();
    this.currentTurn = 'white';
    this.gameOver = false;
    this.selectedSquare = null;
    this.lastDoublePawnMove = null; // for En Passant
    this.castlingStatus = {
      white: { moved: false, kingSideRookMoved: false, queenSideRookMoved: false },
      black: { moved: false, kingSideRookMoved: false, queenSideRookMoved: false }
    };
    
    // Set global reference early so render callbacks can find it
    window.currentGame = this;
    
    this.render();
  }

  initializeBoard() {
    const board = Array(8).fill(null).map(() => Array(8).fill(null));
    const layout = ['R', 'N', 'B', 'Q', 'K', 'B', 'N', 'R'];
    
    // Black pieces (top)
    for (let i = 0; i < 8; i++) {
      board[0][i] = { type: layout[i], color: 'black' };
      board[1][i] = { type: 'P', color: 'black' };
    }
    
    // White pieces (bottom)
    for (let i = 0; i < 8; i++) {
      board[6][i] = { type: 'P', color: 'white' };
      board[7][i] = { type: layout[i], color: 'white' };
    }
    
    return board;
  }

  handleSquareClick(r, c) {
    if (this.gameOver || this.currentTurn !== this.playerColor) return;

    if (this.selectedSquare) {
      if (this.selectedSquare.r === r && this.selectedSquare.c === c) {
        this.selectedSquare = null;
        this.render();
        return;
      }

      const moves = this.getLegalMoves(this.selectedSquare.r, this.selectedSquare.c);
      const move = moves.find(m => m.r === r && m.c === c);

      if (move) {
        this.executeMove(this.selectedSquare.r, this.selectedSquare.c, r, c, move);
        return;
      }

      const piece = this.board[r][c];
      if (piece && piece.color === this.playerColor) {
        this.selectedSquare = { r, c };
        this.render();
      }
    } else {
      const piece = this.board[r][c];
      if (piece && piece.color === this.playerColor) {
        this.selectedSquare = { r, c };
        this.render();
      }
    }
  }

  executeMove(fromR, fromC, toR, toC, moveOptions = {}) {
    const piece = this.board[fromR][fromC];

    // Handle special moves
    if (moveOptions.isEnPassant && this.lastDoublePawnMove) {
      this.board[this.lastDoublePawnMove.r][this.lastDoublePawnMove.c] = null;
    }

    if (moveOptions.isCastling) {
      const rookFromC = toC === 6 ? 7 : 0;
      const rookToC = toC === 6 ? 5 : 3;
      const rook = this.board[fromR][rookFromC];
      this.board[fromR][rookToC] = rook;
      this.board[fromR][rookFromC] = null;
    }

    // Actual move
    this.board[toR][toC] = piece;
    this.board[fromR][fromC] = null;

    // Promotion
    if (piece.type === 'P' && (toR === 0 || toR === 7)) {
      piece.type = 'Q';
    }

    // Update statuses
    if (piece.type === 'K') this.castlingStatus[piece.color].moved = true;
    if (piece.type === 'R') {
      if (fromC === 0) this.castlingStatus[piece.color].queenSideRookMoved = true;
      if (fromC === 7) this.castlingStatus[piece.color].kingSideRookMoved = true;
    }
    this.lastDoublePawnMove = (piece.type === 'P' && Math.abs(toR - fromR) === 2) ? { r: toR, c: toC } : null;

    this.currentTurn = this.currentTurn === 'white' ? 'black' : 'white';
    this.selectedSquare = null;

    const winner = this.checkGameEndStatus();
    this.onMove({ 
      type: 'chess_move', 
      from: { r: fromR, c: fromC }, 
      to: { r: toR, c: toC }, 
      options: moveOptions,
      gameState: winner ? (winner === this.playerColor ? 'win' : winner === 'draw' ? 'draw' : 'loss') : null
    });

    this.render();
    if (winner) {
      setTimeout(() => this.onGameEnd(winner === this.playerColor ? 'win' : winner === 'draw' ? 'draw' : 'loss'), 500);
    }
  }

  receivedMove(data) {
    if (this.gameOver) return;
    if (data.type === 'chess_move') {
      const { from, to, options, gameState } = data;
      const piece = this.board[from.r][from.c];

      if (options.isEnPassant && this.lastDoublePawnMove) {
        this.board[this.lastDoublePawnMove.r][this.lastDoublePawnMove.c] = null;
      }
      if (options.isCastling) {
        const rookFromC = to.c === 6 ? 7 : 0;
        const rookToC = to.c === 6 ? 5 : 3;
        this.board[from.r][rookToC] = this.board[from.r][rookFromC];
        this.board[from.r][rookFromC] = null;
      }

      this.board[to.r][to.c] = piece;
      this.board[from.r][from.c] = null;

      if (piece.type === 'P' && (to.r === 0 || to.r === 7)) piece.type = 'Q';
      if (piece.type === 'K') this.castlingStatus[piece.color].moved = true;
      if (piece.type === 'R') {
        if (from.c === 0) this.castlingStatus[piece.color].queenSideRookMoved = true;
        if (from.c === 7) this.castlingStatus[piece.color].kingSideRookMoved = true;
      }
      this.lastDoublePawnMove = (piece.type === 'P' && Math.abs(to.r - from.r) === 2) ? { r: to.r, c: to.c } : null;

      this.currentTurn = this.playerColor;
      this.render();
      if (gameState) {
        this.gameOver = true;
        setTimeout(() => this.onGameEnd(gameState === 'win' ? 'loss' : gameState === 'loss' ? 'win' : 'draw'), 500);
      }
    }
  }

  getLegalMoves(r, c) {
    const pseudoMoves = this.getPseudoLegalMoves(r, c);
    return pseudoMoves.filter(m => {
      const originalPiece = this.board[r][c];
      const targetPiece = this.board[m.r][m.c];
      this.board[m.r][m.c] = originalPiece;
      this.board[r][c] = null;
      let epPawn = null;
      if (m.isEnPassant && this.lastDoublePawnMove) {
        epPawn = this.board[this.lastDoublePawnMove.r][this.lastDoublePawnMove.c];
        this.board[this.lastDoublePawnMove.r][this.lastDoublePawnMove.c] = null;
      }
      const inCheck = this.isKingInCheck(originalPiece.color);
      this.board[r][c] = originalPiece;
      this.board[m.r][m.c] = targetPiece;
      if (m.isEnPassant && this.lastDoublePawnMove) {
        this.board[this.lastDoublePawnMove.r][this.lastDoublePawnMove.c] = epPawn;
      }
      return !inCheck;
    });
  }

  getPseudoLegalMoves(r, c, includeCastling = true) {
    const piece = this.board[r][c];
    if (!piece) return [];
    const moves = [];
    const opponent = piece.color === 'white' ? 'black' : 'white';

    const addMove = (nr, nc, options = {}) => {
      if (nr >= 0 && nr < 8 && nc >= 0 && nc < 8) {
        const target = this.board[nr][nc];
        if (!target || target.color === opponent) {
          moves.push({ r: nr, c: nc, ...options });
          return !target;
        }
      }
      return false;
    };

    switch (piece.type) {
      case 'P':
        const dir = piece.color === 'white' ? -1 : 1;
        if (this.board[r + dir]?.[c] === null) {
          moves.push({ r: r + dir, c: c });
          if (((piece.color === 'white' && r === 6) || (piece.color === 'black' && r === 1)) && this.board[r + 2 * dir]?.[c] === null) {
            moves.push({ r: r + 2 * dir, c: c });
          }
        }
        for (let dc of [-1, 1]) {
          const target = this.board[r + dir]?.[c + dc];
          if (target && target.color === opponent) moves.push({ r: r + dir, c: c + dc });
          if (!target && this.lastDoublePawnMove && this.lastDoublePawnMove.r === r && this.lastDoublePawnMove.c === c + dc) {
            moves.push({ r: r + dir, c: c + dc, isEnPassant: true });
          }
        }
        break;
      case 'R': this.addSlidingMoves(moves, r, c, [[1, 0], [-1, 0], [0, 1], [0, -1]]); break;
      case 'B': this.addSlidingMoves(moves, r, c, [[1, 1], [1, -1], [-1, 1], [-1, -1]]); break;
      case 'Q': this.addSlidingMoves(moves, r, c, [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]); break;
      case 'N': [[2, 1], [2, -1], [-2, 1], [-2, -1], [1, 2], [1, -2], [-1, 2], [-1, -2]].forEach(([dr, dc]) => addMove(r + dr, c + dc)); break;
      case 'K':
        [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]].forEach(([dr, dc]) => addMove(r + dr, c + dc));
        if (includeCastling && !this.castlingStatus[piece.color].moved && !this.isKingInCheck(piece.color)) {
          if (!this.castlingStatus[piece.color].kingSideRookMoved && !this.board[r][c+1] && !this.board[r][c+2] && !this.isSquareUnderAttack(r, c+1, opponent)) moves.push({ r, c: c+2, isCastling: true });
          if (!this.castlingStatus[piece.color].queenSideRookMoved && !this.board[r][c-1] && !this.board[r][c-2] && !this.board[r][c-3] && !this.isSquareUnderAttack(r, c-1, opponent)) moves.push({ r, c: c-2, isCastling: true });
        }
        break;
    }
    return moves;
  }

  addSlidingMoves(moves, r, c, directions) {
    const piece = this.board[r][c];
    directions.forEach(([dr, dc]) => {
      let nr = r + dr, nc = c + dc;
      while (nr >= 0 && nr < 8 && nc >= 0 && nc < 8) {
        const target = this.board[nr][nc];
        if (!target) { moves.push({ r: nr, c: nc }); } else {
          if (target.color !== piece.color) moves.push({ r: nr, c: nc });
          break;
        }
        nr += dr; nc += dc;
      }
    });
  }

  isKingInCheck(color) {
    let kr, kc;
    for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
      const p = this.board[r][c];
      if (p && p.type === 'K' && p.color === color) { kr = r; kc = c; break; }
    }
    return this.isSquareUnderAttack(kr, kc, color === 'white' ? 'black' : 'white');
  }

  isSquareUnderAttack(tr, tc, attackerColor) {
    for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
      const p = this.board[r][c];
      if (p && p.color === attackerColor) {
        if (p.type === 'P') {
          const dir = p.color === 'white' ? -1 : 1;
          if (r + dir === tr && Math.abs(c - tc) === 1) return true;
        } else if (this.getPseudoLegalMoves(r, c, false).find(m => m.r === tr && m.c === tc)) return true;
      }
    }
    return false;
  }

  checkGameEndStatus() {
    let anyMove = false;
    for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
      const p = this.board[r][c];
      if (p && p.color === this.currentTurn && this.getLegalMoves(r, c).length > 0) { anyMove = true; break; }
    }
    if (!anyMove) return this.isKingInCheck(this.currentTurn) ? (this.currentTurn === 'white' ? 'black' : 'white') : 'draw';
    return null;
  }

  render() {
    const pieces = {
      'white': { 'K': '♔', 'Q': '♕', 'R': '♖', 'B': '♗', 'N': '♘', 'P': '♙' },
      'black': { 'K': '♚', 'Q': '♛', 'R': '♜', 'B': '♝', 'N': '♞', 'P': '♟' }
    };
    let boardHtml = '';
    const isP2 = !this.isPlayer1;
    for (let r = 0; r < 8; r++) {
      let actualR = isP2 ? 7 - r : r;
      let rowHtml = '';
      for (let c = 0; c < 8; c++) {
        let actualC = isP2 ? 7 - c : c;
        const piece = this.board[actualR][actualC];
        const isTarget = this.selectedSquare && this.getLegalMoves(this.selectedSquare.r, this.selectedSquare.c).find(m => m.r === actualR && m.c === actualC);
        rowHtml += `<div class="chess-square ${(actualR + actualC) % 2 === 1 ? 'dark' : 'light'} ${this.selectedSquare?.r === actualR && this.selectedSquare?.c === actualC ? 'selected' : ''}" 
                     onclick="window.currentGame.handleSquareClick(${actualR}, ${actualC})">
          ${piece ? `<span class="chess-piece ${piece.color}">${pieces[piece.color][piece.type]}</span>` : ''}
          ${isTarget ? '<div class="move-hint"></div>' : ''}
        </div>`;
      }
      boardHtml += `<div class="chess-row">${rowHtml}</div>`;
    }
    const isMyTurn = this.currentTurn === this.playerColor;
    this.container.innerHTML = `<div class="game-container"><h2>Chess</h2><div class="game-status">${this.gameOver ? 'Game Over' : (isMyTurn ? 'Your Turn' : 'Partner\'s Turn')}${!this.gameOver && this.isKingInCheck(this.currentTurn) ? ' (CHECK!)' : ''}</div><div class="chess-board">${boardHtml}</div></div>`;
  }
}


class RockPaperScissors {
  constructor(container, onMove, onGameEnd, isPlayer1) {
    this.container = container;
    this.onMove = onMove;
    this.onGameEnd = onGameEnd;
    this.isPlayer1 = isPlayer1;
    this.rounds = 3;
    this.currentRound = 0;
    this.playerScore = 0;
    this.opponentScore = 0;
    this.gameOver = false;
    this.playerMove = null;
    this.opponentMove = null;
    this.showResult = false;
    this.render();
  }

  makeMove(choice) {
    if (this.showResult || this.gameOver) return;

    this.playerMove = choice;
    this.showResult = true;
    this.onMove({ type: 'rps', choice });
    this.render();

    setTimeout(() => {
      this.currentRound++;
      this.showResult = false;
      this.playerMove = null;
      this.opponentMove = null;

      if (this.currentRound >= this.rounds) {
        this.gameOver = true;
        if (this.playerScore > this.opponentScore) {
          this.onGameEnd('win');
        } else if (this.playerScore < this.opponentScore) {
          this.onGameEnd('loss');
        } else {
          this.onGameEnd('draw');
        }
      } else {
        this.render();
      }
    }, 1500);
  }

  receivedMove(data) {
    this.opponentMove = data.choice;

    if (this.playerMove) {
      const result = this.compareChoices(this.playerMove, this.opponentMove);
      if (result === 'win') this.playerScore++;
      if (result === 'loss') this.opponentScore++;
    }

    this.render();
  }

  compareChoices(player, opponent) {
    if (player === opponent) return 'tie';
    if (player === 'rock' && opponent === 'scissors') return 'win';
    if (player === 'paper' && opponent === 'rock') return 'win';
    if (player === 'scissors' && opponent === 'paper') return 'win';
    return 'loss';
  }

  render() {
    if (this.currentRound >= this.rounds) {
      this.container.innerHTML = `
        <div class="game-container">
          <h2>Rock Paper Scissors - Game Over!</h2>
          <div class="game-status">Final Scores</div>
          <div class="trivia-score">
            <div>You: <strong>${this.playerScore}</strong></div>
            <div>Opponent: <strong>${this.opponentScore}</strong></div>
          </div>
        </div>
      `;
      return;
    }

    const choices = ['rock', 'paper', 'scissors'];
    const emojis = { rock: '✊', paper: '✋', scissors: '✌️' };

    let resultHtml = '';
    if (this.showResult && this.playerMove && this.opponentMove) {
      const result = this.compareChoices(this.playerMove, this.opponentMove);
      const resultText = result === 'win' ? '✓ You Won!' : result === 'loss' ? '✗ You Lost!' : '= Tie!';
      resultHtml = `
        <div style="margin: 20px 0; font-size: 1.2em; font-weight: bold; color: #667eea;">
          ${resultText}
        </div>
      `;
    }

    this.container.innerHTML = `
      <div class="game-container">
        <h2>Rock Paper Scissors - Round ${this.currentRound + 1}/${this.rounds}</h2>
        <div class="game-status">You: ${this.playerScore} | Opponent: ${this.opponentScore}</div>
        ${resultHtml}
        ${this.showResult ? `
          <div style="display: flex; justify-content: space-around; margin: 20px 0; font-size: 2em;">
            <div>You: ${emojis[this.playerMove]}</div>
            <div>vs</div>
            <div>Opponent: ${emojis[this.opponentMove] || '?'}</div>
          </div>
        ` : `
          <div class="rps-choices">
            ${choices.map(choice => `
              <button class="choice-btn" onclick="window.currentGame.makeMove('${choice}')"
                      ${this.showResult ? 'disabled' : ''}>
                <div style="font-size: 2em;">${emojis[choice]}</div>
                <div>${choice}</div>
              </button>
            `).join('')}
          </div>
        `}
      </div>
    `;
  }
}

class GroupWatch {
  constructor(container, onMove, onGameEnd, isPlayer1) {
    this.container = container;
    this.onMove = onMove;
    this.onGameEnd = onGameEnd;
    this.isPlayer1 = isPlayer1;

    this.videoId = null;
    this.player = null;

    this.isPlaying = false;
    this.currentTime = 0;
    this.lastSyncTime = 0;

    this.showPresets = true;
    this.isSyncing = false; // prevent feedback loops

    this.presetVideos = [
      { title: 'Lo-Fi Hip Hop Beats', id: 'jfKfPfyJFDc' },
      { title: 'Chill Jazz Vibes', id: 'rUxyKA_-grg' },
      { title: 'Nature Documentary Trailer', id: 'n8X9_MgEdCo' },
      { title: 'Motivational Speech', id: 'ZXsQAXx_ao0' },
      { title: 'Funny Cat Videos Compilation', id: 'J---aiyznGQ' }
    ];

    this.loadYouTubeAPI();
    this.render();
  }

  /* ---------------- API LOADING ---------------- */

  loadYouTubeAPI() {
    if (window.YT && window.YT.Player) return;

    const tag = document.createElement('script');
    tag.src = "https://www.youtube.com/iframe_api";
    document.body.appendChild(tag);
  }

  waitForYT(callback) {
    if (window.YT && YT.Player) return callback();
    window.onYouTubeIframeAPIReady = callback;
  }

  /* ---------------- VIDEO HELPERS ---------------- */

  extractVideoId(url) {
    if (!url) return null;

    if (url.includes('youtube.com/watch')) {
      const match = url.match(/v=([a-zA-Z0-9_-]{11})/);
      return match ? match[1] : null;
    }

    if (url.includes('youtu.be/')) {
      const match = url.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
      return match ? match[1] : null;
    }

    if (/^[a-zA-Z0-9_-]{11}$/.test(url)) return url;

    return null;
  }

  /* ---------------- PLAYER ---------------- */

  initPlayer() {
    this.player = new YT.Player('youtube-player', {
      height: '400',
      width: '100%',
      videoId: this.videoId,
      playerVars: {
        autoplay: 0,
        controls: 1
      },
      events: {
        onReady: () => this.onPlayerReady(),
        onStateChange: (e) => this.onPlayerStateChange(e)
      }
    });

    // periodic sync check
    this.startSyncLoop();
  }

  onPlayerReady() {
    console.log('Player ready');
  }

  onPlayerStateChange(event) {
    if (this.isSyncing) return;

    const state = event.data;

    if (state === YT.PlayerState.PLAYING) {
      this.isPlaying = true;
      this.currentTime = this.player.getCurrentTime();

      this.sendMove({
        type: 'playback',
        isPlaying: true,
        currentTime: this.currentTime
      });
    }

    if (state === YT.PlayerState.PAUSED) {
      this.isPlaying = false;
      this.currentTime = this.player.getCurrentTime();

      this.sendMove({
        type: 'playback',
        isPlaying: false,
        currentTime: this.currentTime
      });
    }
  }

  /* ---------------- SYNC ---------------- */

  startSyncLoop() {
    clearInterval(this.syncInterval);

    this.syncInterval = setInterval(() => {
      if (!this.player || !this.isPlaying) return;

      const time = this.player.getCurrentTime();

      this.sendMove({
        type: 'sync',
        currentTime: time
      });
    }, 3000);
  }

  applySync(data) {
    if (!this.player) return;

    const local = this.player.getCurrentTime();
    const diff = Math.abs(local - data.currentTime);

    // correct drift if too large
    if (diff > 1.5) {
      this.isSyncing = true;
      this.player.seekTo(data.currentTime, true);
      setTimeout(() => (this.isSyncing = false), 300);
    }
  }

  /* ---------------- NETWORK SEND ---------------- */

  sendMove(payload) {
    this.lastSyncTime = Date.now();
    this.onMove(payload);
  }

  /* ---------------- RECEIVERS ---------------- */

  receivedVideoSelection(data) {
    this.videoId = data.videoId;
    this.showPresets = false;
    this.render();
  }

  receivedPlayback(data) {
    if (!this.player) return;

    this.isSyncing = true;

    if (data.isPlaying) {
      this.player.seekTo(data.currentTime, true);
      this.player.playVideo();
    } else {
      this.player.pauseVideo();
    }

    setTimeout(() => (this.isSyncing = false), 300);
  }

  receivedSync(data) {
    this.applySync(data);
  }

  /* ---------------- UI ACTIONS ---------------- */

  selectPreset(videoId) {
    this.videoId = videoId;
    this.showPresets = false;

    this.sendMove({ type: 'video-selected', videoId });
    this.render();
  }

  submitCustomUrl() {
    const input = document.getElementById('youtube-url-input');
    if (!input) return;

    const url = input.value.trim();
    const videoId = this.extractVideoId(url);

    if (!videoId) {
      alert('Invalid YouTube URL or video ID');
      return;
    }

    this.videoId = videoId;
    this.showPresets = false;

    this.sendMove({ type: 'video-selected', videoId });
    this.render();
  }

  changeVideo() {
    this.videoId = null;
    this.showPresets = true;

    if (this.player) {
      this.player.destroy();
      this.player = null;
    }

    this.render();
  }

  /* ---------------- RENDER ---------------- */

  render() {
    if (this.showPresets && !this.videoId) {
      this.container.innerHTML = `
        <div class="youtube-watch-container">
          <h2>🎬 Watch Together on YouTube</h2>

          <div class="preset-grid">
            ${this.presetVideos.map(v => `
              <button onclick="window.currentGame.selectPreset('${v.id}')">
                ${v.title}
              </button>
            `).join('')}
          </div>

          <input id="youtube-url-input" placeholder="Paste YouTube URL"/>
          <button onclick="window.currentGame.submitCustomUrl()">Load</button>
        </div>
      `;
      return;
    }

    if (this.videoId) {
      this.container.innerHTML = `
        <div class="youtube-watch-container">
          <h2>🎬 Watching Together</h2>
          <div id="youtube-player"></div>
          <button onclick="window.currentGame.changeVideo()">Change Video</button>
        </div>
      `;

      this.waitForYT(() => this.initPlayer());
    }
  }
}