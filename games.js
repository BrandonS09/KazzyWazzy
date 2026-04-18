// Game implementations for Team Game Pairing

class TicTacToe {
  constructor(container, onMove, onGameEnd) {
    this.container = container;
    this.onMove = onMove;
    this.onGameEnd = onGameEnd;
    this.board = Array(9).fill(null);
    this.currentPlayer = 'X'; // Player is always X, Opponent is O
    this.gameOver = false;
    this.render();
  }

  render() {
    this.container.innerHTML = `
      <div class="game-board tic-tac-toe">
        <div class="status">You: <strong>X</strong> | Opponent: <strong>O</strong></div>
        <div class="board">
          ${this.board.map((cell, index) => `
            <div class="cell" data-index="${index}" onclick="window.currentGame.makeMove(${index})">
              ${cell || ''}
            </div>
          `).join('')}
        </div>
        ${this.gameOver ? '<div class="game-status">Game Over</div>' : '<div class="game-status">Your Turn: X</div>'}
      </div>
    `;
  }

  makeMove(index) {
    if (this.board[index] || this.gameOver || this.currentPlayer !== 'X') return;
    
    this.board[index] = 'X';
    this.onMove({ type: 'move', index });
    this.currentPlayer = 'O';
    
    const winner = this.checkWinner();
    if (winner) {
      this.gameOver = true;
      this.onGameEnd(winner === 'X' ? 'win' : 'loss');
    } else if (this.board.every(cell => cell !== null)) {
      this.gameOver = true;
      this.onGameEnd('draw');
    }
    
    this.render();
  }

  receivedMove(index) {
    if (this.board[index] || this.gameOver) return;
    
    this.board[index] = 'O';
    this.currentPlayer = 'X';
    
    const winner = this.checkWinner();
    if (winner) {
      this.gameOver = true;
      this.onGameEnd(winner === 'O' ? 'loss' : 'win');
    } else if (this.board.every(cell => cell !== null)) {
      this.gameOver = true;
      this.onGameEnd('draw');
    }
    
    this.render();
  }

  checkWinner() {
    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8],
      [0, 3, 6], [1, 4, 7], [2, 5, 8],
      [0, 4, 8], [2, 4, 6]
    ];
    
    for (let line of lines) {
      const [a, b, c] = line;
      if (this.board[a] && this.board[a] === this.board[b] && this.board[a] === this.board[c]) {
        return this.board[a];
      }
    }
    return null;
  }
}

class ConnectFour {
  constructor(container, onMove, onGameEnd) {
    this.container = container;
    this.onMove = onMove;
    this.onGameEnd = onGameEnd;
    this.board = Array(42).fill(null); // 6 rows x 7 columns
    this.cols = 7;
    this.rows = 6;
    this.currentPlayer = 'R'; // Red (Player), Yellow (Opponent)
    this.gameOver = false;
    this.render();
  }

  render() {
    const boardHTML = Array(this.rows).fill(0).map((_, row) => `
      <div class="row">
        ${Array(this.cols).fill(0).map((_, col) => {
          const index = row * this.cols + col;
          const cell = this.board[index];
          return `
            <div class="cell" data-col="${col}" onclick="window.currentGame.dropPiece(${col})" 
                 style="background-color: ${cell === 'R' ? '#ff4444' : cell === 'Y' ? '#ffff00' : 'white'}">
            </div>
          `;
        }).join('')}
      </div>
    `).join('');

    this.container.innerHTML = `
      <div class="game-board connect-four">
        <div class="status">You: <span style="color: red;">●</span> Red | Opponent: <span style="color: gold;">●</span> Yellow</div>
        <div class="board">${boardHTML}</div>
        ${this.gameOver ? '<div class="game-status">Game Over</div>' : ''}
      </div>
    `;
  }

  dropPiece(col) {
    if (this.gameOver || this.currentPlayer !== 'R') return;
    
    for (let row = this.rows - 1; row >= 0; row--) {
      const index = row * this.cols + col;
      if (this.board[index] === null) {
        this.board[index] = 'R';
        this.onMove({ type: 'move', col });
        this.currentPlayer = 'Y';
        
        const winner = this.checkWinner();
        if (winner) {
          this.gameOver = true;
          this.onGameEnd(winner === 'R' ? 'win' : 'loss');
        } else if (this.board.every(cell => cell !== null)) {
          this.gameOver = true;
          this.onGameEnd('draw');
        }
        
        this.render();
        return;
      }
    }
  }

  receivedMove(col) {
    if (this.gameOver) return;
    
    for (let row = this.rows - 1; row >= 0; row--) {
      const index = row * this.cols + col;
      if (this.board[index] === null) {
        this.board[index] = 'Y';
        this.currentPlayer = 'R';
        
        const winner = this.checkWinner();
        if (winner) {
          this.gameOver = true;
          this.onGameEnd(winner === 'Y' ? 'loss' : 'win');
        } else if (this.board.every(cell => cell !== null)) {
          this.gameOver = true;
          this.onGameEnd('draw');
        }
        
        this.render();
        return;
      }
    }
  }

  checkWinner() {
    // Check horizontal
    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols - 3; col++) {
        const idx = row * this.cols + col;
        const piece = this.board[idx];
        if (piece && this.board[idx + 1] === piece && this.board[idx + 2] === piece && this.board[idx + 3] === piece) {
          return piece;
        }
      }
    }
    
    // Check vertical
    for (let col = 0; col < this.cols; col++) {
      for (let row = 0; row < this.rows - 3; row++) {
        const idx = row * this.cols + col;
        const piece = this.board[idx];
        if (piece && this.board[idx + this.cols] === piece && this.board[idx + this.cols * 2] === piece && this.board[idx + this.cols * 3] === piece) {
          return piece;
        }
      }
    }
    
    // Check diagonal (/)
    for (let row = 3; row < this.rows; row++) {
      for (let col = 0; col < this.cols - 3; col++) {
        const idx = row * this.cols + col;
        const piece = this.board[idx];
        if (piece && this.board[idx - this.cols + 1] === piece && this.board[idx - this.cols * 2 + 2] === piece && this.board[idx - this.cols * 3 + 3] === piece) {
          return piece;
        }
      }
    }
    
    // Check diagonal (\)
    for (let row = 0; row < this.rows - 3; row++) {
      for (let col = 0; col < this.cols - 3; col++) {
        const idx = row * this.cols + col;
        const piece = this.board[idx];
        if (piece && this.board[idx + this.cols + 1] === piece && this.board[idx + this.cols * 2 + 2] === piece && this.board[idx + this.cols * 3 + 3] === piece) {
          return piece;
        }
      }
    }
    
    return null;
  }
}

class Trivia {
  constructor(container, onMove, onGameEnd) {
    this.container = container;
    this.onMove = onMove;
    this.onGameEnd = onGameEnd;
    this.questions = [
      { q: 'What is the capital of France?', a: 'Paris', w: ['London', 'Berlin', 'Madrid'] },
      { q: 'What is 2 + 2?', a: '4', w: ['3', '5', '6'] },
      { q: 'What is the largest planet?', a: 'Jupiter', w: ['Saturn', 'Mars', 'Venus'] },
      { q: 'What color is the sky?', a: 'Blue', w: ['Red', 'Green', 'Yellow'] },
      { q: 'What is the smallest prime number?', a: '2', w: ['1', '3', '0'] }
    ];
    this.currentQuestion = 0;
    this.score = { player: 0, opponent: 0 };
    this.gameOver = false;
    this.render();
  }

  render() {
    if (this.currentQuestion >= this.questions.length) {
      const winner = this.score.player > this.score.opponent ? 'win' : 
                     this.score.player < this.score.opponent ? 'loss' : 'draw';
      this.container.innerHTML = `
        <div class="game-board trivia">
          <div class="game-status">Game Over!</div>
          <div class="score">Your Score: ${this.score.player}</div>
          <div class="score">Opponent Score: ${this.score.opponent}</div>
          <div class="result">${winner === 'win' ? 'YOU WIN!' : winner === 'loss' ? 'YOU LOSE!' : 'IT\'S A DRAW!'}</div>
        </div>
      `;
      if (!this.gameOver) {
        this.gameOver = true;
        this.onGameEnd(winner);
      }
      return;
    }

    const question = this.questions[this.currentQuestion];
    const answers = [question.a, ...question.w].sort(() => Math.random() - 0.5);

    this.container.innerHTML = `
      <div class="game-board trivia">
        <div class="score">You: ${this.score.player} | Opponent: ${this.score.opponent}</div>
        <div class="question">${question.q}</div>
        <div class="answers">
          ${answers.map(ans => `
            <button class="answer-btn" onclick="window.currentGame.selectAnswer('${ans}')">${ans}</button>
          `).join('')}
        </div>
      </div>
    `;
  }

  selectAnswer(ans) {
    if (this.gameOver) return;
    
    const question = this.questions[this.currentQuestion];
    const isCorrect = ans === question.a;
    
    if (isCorrect) {
      this.score.player++;
    }
    
    this.onMove({ type: 'answer', question: this.currentQuestion, correct: isCorrect });
    this.currentQuestion++;
    this.render();
  }

  receivedAnswer(data) {
    if (data.correct) {
      this.score.opponent++;
    }
  }
}

class WordBattle {
  constructor(container, onMove, onGameEnd) {
    this.container = container;
    this.onMove = onMove;
    this.onGameEnd = onGameEnd;
    this.rounds = 5;
    this.currentRound = 0;
    this.score = { player: 0, opponent: 0 };
    this.words = ['JAVASCRIPT', 'WEBRTC', 'WEBSOCKET', 'FIREBASE', 'DATABASE', 'FUNCTION'];
    this.currentWord = this.words[Math.floor(Math.random() * this.words.length)];
    this.playerAnswer = '';
    this.gameOver = false;
    this.render();
  }

  render() {
    if (this.currentRound >= this.rounds) {
      const winner = this.score.player > this.score.opponent ? 'win' : 
                     this.score.player < this.score.opponent ? 'loss' : 'draw';
      this.container.innerHTML = `
        <div class="game-board word-battle">
          <div class="game-status">Game Over!</div>
          <div class="score">Your Score: ${this.score.player}</div>
          <div class="score">Opponent Score: ${this.score.opponent}</div>
          <div class="result">${winner === 'win' ? 'YOU WIN!' : winner === 'loss' ? 'YOU LOSE!' : 'IT\'S A DRAW!'}</div>
        </div>
      `;
      if (!this.gameOver) {
        this.gameOver = true;
        this.onGameEnd(winner);
      }
      return;
    }

    this.container.innerHTML = `
      <div class="game-board word-battle">
        <div class="score">Round ${this.currentRound + 1}/${this.rounds}</div>
        <div class="score">You: ${this.score.player} | Opponent: ${this.score.opponent}</div>
        <div class="prompt">Spell this word: <strong>${this.currentWord.substring(0, Math.ceil(this.currentWord.length / 2))}...</strong></div>
        <input type="text" id="word-input" placeholder="Type the full word" value="${this.playerAnswer}">
        <button class="answer-btn" onclick="window.currentGame.submitWord()">Submit</button>
      </div>
    `;
  }

  submitWord() {
    if (this.gameOver) return;
    
    const input = document.getElementById('word-input');
    this.playerAnswer = input.value.toUpperCase();
    const isCorrect = this.playerAnswer === this.currentWord;
    
    if (isCorrect) {
      this.score.player++;
    }
    
    this.onMove({ type: 'word', word: this.playerAnswer, correct: isCorrect });
    this.currentRound++;
    this.currentWord = this.words[Math.floor(Math.random() * this.words.length)];
    this.playerAnswer = '';
    this.render();
  }

  receivedWord(data) {
    if (data.correct) {
      this.score.opponent++;
    }
  }
}

class QuickDraw {
  constructor(container, onMove, onGameEnd) {
    this.container = container;
    this.onMove = onMove;
    this.onGameEnd = onGameEnd;
    this.rounds = 3;
    this.currentRound = 0;
    this.score = { player: 0, opponent: 0 };
    this.prompts = ['Cat', 'House', 'Sun', 'Tree', 'Fish'];
    this.currentPrompt = this.prompts[Math.floor(Math.random() * this.prompts.length)];
    this.canvas = null;
    this.isDrawing = false;
    this.gameOver = false;
    this.roundStartTime = Date.now();
    this.render();
    this.setupCanvas();
  }

  render() {
    if (this.currentRound >= this.rounds) {
      const winner = this.score.player > this.score.opponent ? 'win' : 
                     this.score.player < this.score.opponent ? 'loss' : 'draw';
      this.container.innerHTML = `
        <div class="game-board quick-draw">
          <div class="game-status">Game Over!</div>
          <div class="score">Your Score: ${this.score.player}</div>
          <div class="score">Opponent Score: ${this.score.opponent}</div>
          <div class="result">${winner === 'win' ? 'YOU WIN!' : winner === 'loss' ? 'YOU LOSE!' : 'IT\'S A DRAW!'}</div>
        </div>
      `;
      if (!this.gameOver) {
        this.gameOver = true;
        this.onGameEnd(winner);
      }
      return;
    }

    this.container.innerHTML = `
      <div class="game-board quick-draw">
        <div class="score">Round ${this.currentRound + 1}/${this.rounds}</div>
        <div class="score">You: ${this.score.player} | Opponent: ${this.score.opponent}</div>
        <div class="prompt">Draw: <strong>${this.currentPrompt}</strong></div>
        <canvas id="draw-canvas" width="400" height="300"></canvas>
        <div class="controls">
          <button onclick="window.currentGame.clearCanvas()">Clear</button>
          <button onclick="window.currentGame.submitDrawing()">Submit</button>
        </div>
      </div>
    `;

    this.setupCanvas();
  }

  setupCanvas() {
    setTimeout(() => {
      this.canvas = document.getElementById('draw-canvas');
      if (!this.canvas) return;
      
      const ctx = this.canvas.getContext('2d');
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      ctx.strokeStyle = 'black';
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';

      let isDrawing = false;

      this.canvas.addEventListener('mousedown', (e) => {
        isDrawing = true;
        const rect = this.canvas.getBoundingClientRect();
        ctx.beginPath();
        ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
      });

      this.canvas.addEventListener('mousemove', (e) => {
        if (!isDrawing) return;
        const rect = this.canvas.getBoundingClientRect();
        ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
        ctx.stroke();
      });

      this.canvas.addEventListener('mouseup', () => { isDrawing = false; });
      this.canvas.addEventListener('mouseout', () => { isDrawing = false; });
    }, 0);
  }

  clearCanvas() {
    if (!this.canvas) return;
    const ctx = this.canvas.getContext('2d');
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  submitDrawing() {
    if (this.gameOver) return;
    
    const imageData = this.canvas.toDataURL('image/png');
    this.score.player++;
    this.onMove({ type: 'drawing', image: imageData });
    
    this.currentRound++;
    this.currentPrompt = this.prompts[Math.floor(Math.random() * this.prompts.length)];
    this.render();
  }

  receivedDrawing(data) {
    this.score.opponent++;
  }
}
