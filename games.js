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

class Trivia {
  constructor(container, onMove, onGameEnd, isPlayer1) {
    this.container = container;
    this.onMove = onMove;
    this.onGameEnd = onGameEnd;
    this.isPlayer1 = isPlayer1;
    this.questions = [
      { q: 'What is the capital of France?', a: 'Paris', w: ['London', 'Berlin', 'Madrid'] },
      { q: 'What is 2 + 2?', a: '4', w: ['3', '5', '6'] },
      { q: 'What is the largest planet?', a: 'Jupiter', w: ['Saturn', 'Mars', 'Venus'] },
      { q: 'What color is the sky?', a: 'Blue', w: ['Red', 'Green', 'Yellow'] },
      { q: 'What is the smallest prime number?', a: '2', w: ['1', '3', '0'] },
      { q: 'What is the capital of Spain?', a: 'Madrid', w: ['Barcelona', 'Seville', 'Valencia'] },
      { q: 'How many continents are there?', a: '7', w: ['5', '6', '8'] },
      { q: 'What is the largest ocean?', a: 'Pacific', w: ['Atlantic', 'Indian', 'Arctic'] }
    ];
    this.currentQuestion = 0;
    this.playerScore = 0;
    this.opponentScore = 0;
    this.gameOver = false;
    this.answered = false;
    this.render();
  }

  selectAnswer(answer) {
    if (this.answered || this.gameOver) return;
    this.answered = true;

    const question = this.questions[this.currentQuestion];
    const correct = answer === question.a;

    if (correct) {
      this.playerScore++;
    }

    this.onMove({ type: 'answer', qIdx: this.currentQuestion, correct });

    setTimeout(() => {
      this.currentQuestion++;
      this.answered = false;

      if (this.currentQuestion >= 5) {
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
    }, 800);
  }

  receivedAnswer(data) {
    if (data.correct) {
      this.opponentScore++;
    }

    this.currentQuestion++;

    if (this.currentQuestion >= 5) {
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
  }

  render() {
    if (this.currentQuestion >= 5) {
      this.container.innerHTML = `
        <div class="game-container">
          <h2>Trivia - Game Over!</h2>
          <div class="game-status">Final Scores</div>
          <div class="trivia-score">
            <div>You: <strong>${this.playerScore}</strong></div>
            <div>Opponent: <strong>${this.opponentScore}</strong></div>
          </div>
        </div>
      `;
      return;
    }

    const q = this.questions[this.currentQuestion];
    const answers = [q.a, ...q.w].sort(() => Math.random() - 0.5);

    this.container.innerHTML = `
      <div class="game-container">
        <h2>Trivia - Question ${this.currentQuestion + 1}/5</h2>
        <div class="game-status">You: ${this.playerScore} | Opponent: ${this.opponentScore}</div>
        <div class="trivia-question">${q.q}</div>
        <div class="trivia-answers">
          ${answers.map(ans => `
            <button class="answer-btn" onclick="window.currentGame.selectAnswer('${ans}')"
                    ${this.answered ? 'disabled' : ''}>
              ${ans}
            </button>
          `).join('')}
        </div>
      </div>
    `;
  }
}

class WordBattle {
  constructor(container, onMove, onGameEnd, isPlayer1) {
    this.container = container;
    this.onMove = onMove;
    this.onGameEnd = onGameEnd;
    this.isPlayer1 = isPlayer1;
    this.words = ['JAVASCRIPT', 'PROGRAMMING', 'DEVELOPER', 'FUNCTION', 'VARIABLE', 'NETWORK', 'WEBSOCKET', 'DATABASE'];
    this.rounds = 4;
    this.currentRound = 0;
    this.playerScore = 0;
    this.opponentScore = 0;
    this.gameOver = false;
    this.currentWord = this.words[Math.floor(Math.random() * this.words.length)];
    this.answered = false;
    this.render();
  }

  submitAnswer() {
    if (this.answered || this.gameOver) return;
    this.answered = true;

    const input = document.getElementById('word-input');
    const answer = input.value.toUpperCase().trim();
    const correct = answer === this.currentWord;

    if (correct) {
      this.playerScore++;
    }

    this.onMove({ type: 'word', correct });

    setTimeout(() => {
      this.currentRound++;
      this.answered = false;

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
        this.currentWord = this.words[Math.floor(Math.random() * this.words.length)];
        this.render();
      }
    }, 800);
  }

  receivedAnswer(data) {
    if (data.correct) {
      this.opponentScore++;
    }

    this.currentRound++;

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
      this.currentWord = this.words[Math.floor(Math.random() * this.words.length)];
      this.render();
    }
  }

  render() {
    if (this.currentRound >= this.rounds) {
      this.container.innerHTML = `
        <div class="game-container">
          <h2>Word Battle - Game Over!</h2>
          <div class="game-status">Final Scores</div>
          <div class="trivia-score">
            <div>You: <strong>${this.playerScore}</strong></div>
            <div>Opponent: <strong>${this.opponentScore}</strong></div>
          </div>
        </div>
      `;
      return;
    }

    const half = Math.ceil(this.currentWord.length / 2);
    const partial = this.currentWord.substring(0, half) + '*'.repeat(this.currentWord.length - half);

    this.container.innerHTML = `
      <div class="game-container">
        <h2>Word Battle - Round ${this.currentRound + 1}/${this.rounds}</h2>
        <div class="game-status">You: ${this.playerScore} | Opponent: ${this.opponentScore}</div>
        <div class="word-prompt">Complete the word: <strong style="font-size: 1.3em">${partial}</strong></div>
        <input type="text" id="word-input" placeholder="Type the full word"
               onkeypress="if(event.key==='Enter') window.currentGame.submitAnswer()"
               ${this.answered ? 'disabled' : ''}>
        <button class="answer-btn" onclick="window.currentGame.submitAnswer()"
                ${this.answered ? 'disabled' : ''}>Submit</button>
      </div>
    `;

    setTimeout(() => {
      const input = document.getElementById('word-input');
      if (input && !this.answered) input.focus();
    }, 100);
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

class SimpleGuessing {
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
    this.playerGuess = null;
    this.targetNumber = Math.floor(Math.random() * 10) + 1;
    this.render();
  }

  makeGuess(num) {
    if (this.gameOver || this.playerGuess !== null) return;

    this.playerGuess = num;
    const correct = num === this.targetNumber;

    if (correct) {
      this.playerScore++;
    }

    this.onMove({ type: 'guess', number: num, correct });
    this.render();

    setTimeout(() => {
      this.currentRound++;
      this.playerGuess = null;
      this.targetNumber = Math.floor(Math.random() * 10) + 1;

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

  receivedGuess(data) {
    if (data.correct) {
      this.opponentScore++;
    }

    this.currentRound++;

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
      this.targetNumber = Math.floor(Math.random() * 10) + 1;
      this.render();
    }
  }

  render() {
    if (this.currentRound >= this.rounds) {
      this.container.innerHTML = `
        <div class="game-container">
          <h2>Number Guessing - Game Over!</h2>
          <div class="game-status">Final Scores</div>
          <div class="trivia-score">
            <div>You: <strong>${this.playerScore}</strong></div>
            <div>Opponent: <strong>${this.opponentScore}</strong></div>
          </div>
        </div>
      `;
      return;
    }

    const buttons = [];
    for (let i = 1; i <= 10; i++) {
      buttons.push(`
        <button class="guess-btn" onclick="window.currentGame.makeGuess(${i})"
                ${this.playerGuess !== null ? 'disabled' : ''}>
          ${i}
        </button>
      `);
    }

    const feedback = this.playerGuess !== null
      ? (this.playerGuess === this.targetNumber ? '✓ Correct!' : '✗ Wrong! The answer was: ' + this.targetNumber)
      : 'Guess a number 1-10';

    this.container.innerHTML = `
      <div class="game-container">
        <h2>Number Guessing - Round ${this.currentRound + 1}/${this.rounds}</h2>
        <div class="game-status">You: ${this.playerScore} | Opponent: ${this.opponentScore}</div>
        <div style="margin: 20px 0; font-size: 1.1em; color: #333;">${feedback}</div>
        <div class="guess-grid">
          ${buttons.join('')}
        </div>
      </div>
    `;
  }
}
