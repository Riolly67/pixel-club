
// ========================================
// PIXEL CLUB - VERSION COMPLETE
// ========================================

let cleanup = null;

const panel = document.getElementById('gamePanel');
const area = document.getElementById('playArea');
const heading = document.getElementById('gameHeading');

const titles = {
    snake: 'Snake',
    memory: 'Memory',
    tictactoe: 'Morpion',
    reaction: 'Test de réflexes',
    '2048': '2048',
    connect4: 'Puissance 4'
};

const games = {
    snake,
    memory,
    tictactoe,
    reaction,
    '2048': game2048,
    connect4
};

function button(text, action) {
    const b = document.createElement('button');
    b.className = 'action';
    b.textContent = text;
    b.onclick = action;
    return b;
}

function shell(html) {
    panel.innerHTML = `<div class="game-content">${html}</div>`;
}

function record(key, fallback) {
    try {
        const value = localStorage.getItem('pixel-' + key);
        return value === null ? fallback : JSON.parse(value);
    } catch {
        return fallback;
    }
}

function saveRecord(key, value) {
    localStorage.setItem('pixel-' + key, JSON.stringify(value));
}

function stopGame() {
    if (cleanup) cleanup();
    cleanup = null;
    document.onkeydown = null;
}

function openGame(name) {
    if (!games[name]) return;

    stopGame();
    heading.textContent = titles[name];
    area.classList.remove('hidden');

    games[name]();
    area.scrollIntoView({ behavior: 'smooth' });
}

// Cartes déjà présentes dans index.html
document.querySelectorAll('[data-game]').forEach(button => {
    button.onclick = () => openGame(button.dataset.game);
});

// Ajout automatique de la carte Puissance 4
const gameGrid = document.querySelector('.game-grid');

if (gameGrid && !document.querySelector('[data-game="connect4"]')) {
    const card = document.createElement('button');
    card.className = 'game-card';
    card.dataset.game = 'connect4';
    card.innerHTML = `
        <span class="game-icon">🔴🟡</span>
        <span class="tag">DUEL</span>
        <span class="game-title">Puissance 4</span>
        <span class="game-desc">Aligne quatre jetons pour gagner !</span>
        <span class="play-label">JOUER ↗</span>
    `;
    card.onclick = () => openGame('connect4');
    gameGrid.append(card);
}

document.getElementById('backButton').onclick = () => {
    stopGame();
    area.classList.add('hidden');
    document.getElementById('games').scrollIntoView({
        behavior: 'smooth'
    });
};


// ========================================
// SNAKE
// ========================================

function snake() {
    shell(`
        <h3>🐍 Snake</h3>
        <p>Mange les pommes et évite les murs !</p>
        <div class="score" id="snakeScore"></div>
        <canvas id="snakeCanvas" width="480" height="480"></canvas>
        <div id="snakeButtons"></div>
        <p>🍎 Pomme : +1 point | 🍏 Fruit doré : +5 points</p>
        <p>Utilise les flèches ou les boutons tactiles.</p>
    `);

    const canvas = document.getElementById('snakeCanvas');
    const ctx = canvas.getContext('2d');

    const size = 20;
    const total = 24;

    let body = [
        {x: 7, y: 12},
        {x: 6, y: 12},
        {x: 5, y: 12}
    ];

    let direction = {x: 1, y: 0};
    let nextDirection = {x: 1, y: 0};
    let apple = {x: 15, y: 12};
    let bonus = null;

    let score = 0;
    let best = record('snake', 0);
    let dead = false;
    let paused = false;
    let bonusTimer = null;

    function randomPosition() {
        return {
            x: Math.floor(Math.random() * total),
            y: Math.floor(Math.random() * total)
        };
    }

    function occupied(pos) {
        return body.some(p => p.x === pos.x && p.y === pos.y);
    }

    function newApple() {
        do {
            apple = randomPosition();
        } while (occupied(apple));
    }

    function draw() {
        ctx.fillStyle = '#10172a';
        ctx.fillRect(0, 0, 480, 480);

        ctx.strokeStyle = '#ffffff10';

        for (let i = 0; i <= total; i++) {
            ctx.beginPath();
            ctx.moveTo(i * size, 0);
            ctx.lineTo(i * size, 480);
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(0, i * size);
            ctx.lineTo(480, i * size);
            ctx.stroke();
        }

        // Pomme rouge
        ctx.fillStyle = '#ff435d';
        ctx.beginPath();
        ctx.arc(apple.x * size + 10, apple.y * size + 11, 8, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#65db83';
        ctx.fillRect(apple.x * size + 9, apple.y * size + 1, 3, 7);

        // Pomme dorée
        if (bonus) {
            ctx.fillStyle = '#ffd447';
            ctx.beginPath();
            ctx.arc(bonus.x * size + 10, bonus.y * size + 10, 9, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#fff2a8';
            ctx.beginPath();
            ctx.arc(bonus.x * size + 7, bonus.y * size + 7, 3, 0, Math.PI * 2);
            ctx.fill();
        }

        // Serpent continu : rectangles qui se touchent
        body.forEach((p, i) => {
            ctx.fillStyle = i === 0 ? '#9af0d9' : '#39bda5';

            ctx.fillRect(
                p.x * size,
                p.y * size,
                size + 0.5,
                size + 0.5
            );

            if (i === 0) {
                ctx.fillStyle = '#14233a';
                ctx.beginPath();
                ctx.arc(p.x * size + 14, p.y * size + 6, 2, 0, Math.PI * 2);
                ctx.arc(p.x * size + 14, p.y * size + 14, 2, 0, Math.PI * 2);
                ctx.fill();
            }
        });

        document.getElementById('snakeScore').textContent =
            `Score : ${score} | Record : ${best}` +
            (paused ? ' | Pause' : '');
    }

    function endGame() {
        if (dead) return;

        dead = true;
        clearInterval(timer);
        clearTimeout(bonusTimer);

        if (score > best) {
            best = score;
            saveRecord('snake', best);
        }

        draw();

        document.getElementById('snakeButtons')
            .append(button('Rejouer', snake));
    }

    function step() {
        if (dead || paused) return;

        direction = nextDirection;

        const head = {
            x: body[0].x + direction.x,
            y: body[0].y + direction.y
        };

        const eatingApple =
            head.x === apple.x && head.y === apple.y;

        if (
            head.x < 0 || head.y < 0 ||
            head.x >= total || head.y >= total ||
            body.slice(0, eatingApple ? body.length : -1)
                .some(p => p.x === head.x && p.y === head.y)
        ) {
            endGame();
            return;
        }

        body.unshift(head);

        if (eatingApple) {
            score++;
            newApple();

            // Fruit doré très rare : 4 % de chance
            if (!bonus && Math.random() < 0.04) {
                do {
                    bonus = randomPosition();
                } while (
                    occupied(bonus) ||
                    (bonus.x === apple.x && bonus.y === apple.y)
                );

                bonusTimer = setTimeout(() => {
                    bonus = null;
                    draw();
                }, 5000);
            }
        } else if (
            bonus &&
            head.x === bonus.x &&
            head.y === bonus.y
        ) {
            score += 5;
            bonus = null;
            clearTimeout(bonusTimer);
        } else {
            body.pop();
        }

        if (score > best) {
            best = score;
            saveRecord('snake', best);
        }

        draw();
    }

    function turn(x, y) {
        if (x !== -direction.x || y !== -direction.y) {
            nextDirection = {x, y};
        }
    }

    document.onkeydown = e => {
        const keys = {
            ArrowUp: [0, -1],
            ArrowDown: [0, 1],
            ArrowLeft: [-1, 0],
            ArrowRight: [1, 0]
        };

        if (keys[e.key]) {
            e.preventDefault();
            turn(...keys[e.key]);
        }

        if (e.code === 'Space') {
            e.preventDefault();
            paused = !paused;
            draw();
        }
    };

    const controls = document.getElementById('snakeButtons');

    [
        ['↑', 0, -1],
        ['←', -1, 0],
        ['↓', 0, 1],
        ['→', 1, 0]
    ].forEach(([label, x, y]) => {
        const b = button(label, () => turn(x, y));
        b.classList.add('snake-control');
        controls.append(b);
    });

    draw();

    const timer = setInterval(step, 125);

    cleanup = () => {
        clearInterval(timer);
        clearTimeout(bonusTimer);
    };
}


// ========================================
// MEMORY
// ========================================

function memory() {
    shell(`
        <h3>🧠 Memory</h3>
        <p>Retrouve toutes les paires !</p>
        <div id="levels" class="level-row"></div>
        <div class="score" id="memoryScore"></div>
        <div class="memory-grid" id="memoryGrid"></div>
        <div id="memoryActions"></div>
    `);

    const images = [
        '🍉', '🚀', '🎧', '⭐',
        '🍀', '🐙', '🎲', '🌈',
        '🦊', '🍓', '⚽', '🌻'
    ];

    const levels = [
        {name: 'Facile', pairs: 4},
        {name: 'Moyen', pairs: 6},
        {name: 'Difficile', pairs: 8},
        {name: 'Expert', pairs: 10},
        {name: 'Extrême', pairs: 12}
    ];

    let timer = null;
    let finished = false;

    levels.forEach((level, i) => {
        document.getElementById('levels').append(
            button(level.name + ' (' + level.pairs + ' paires)', () => start(i))
        );
    });

    function start(index) {
        clearTimeout(timer);
        finished = false;

        const level = levels[index];

        let cards = [
            ...images.slice(0, level.pairs),
            ...images.slice(0, level.pairs)
        ].sort(() => Math.random() - 0.5);

        let first = null;
        let lock = false;
        let moves = 0;
        let pairs = 0;
        const startTime = Date.now();

        const grid = document.getElementById('memoryGrid');
        const score = document.getElementById('memoryScore');

        grid.innerHTML = '';
        grid.style.gridTemplateColumns =
            level.pairs >= 10
                ? 'repeat(6, minmax(40px, 65px))'
                : 'repeat(4, minmax(48px, 75px))';

        document.getElementById('memoryActions').innerHTML = '';

        cards.forEach(emoji => {
            const card = document.createElement('button');
            card.className = 'memory-tile';
            card.textContent = '?';

            card.onclick = () => {
                if (finished || lock ||
                    card.classList.contains('open') ||
                    card.classList.contains('done')) return;

                card.classList.add('open');
                card.textContent = emoji;

                if (!first) {
                    first = card;
                    return;
                }

                moves++;

                if (first.textContent === card.textContent) {
                    first.classList.add('done');
                    card.classList.add('done');
                    first = null;
                    pairs++;

                    score.textContent =
                        `Coups : ${moves} | Paires : ${pairs}/${level.pairs}`;

                    if (pairs === level.pairs) {
                        finished = true;

                        const seconds = Math.floor((Date.now() - startTime) / 1000);
                        const key = 'memory-' + level.name;
                        const old = record(key, null);

                        if (!old || moves < old.moves) {
                            saveRecord(key, {moves, time: seconds});
                        }

                        const best = record(key, {moves, time: seconds});

                        score.textContent =
                            `Bravo ! ${moves} coups en ${seconds}s. Record : ${best.moves} coups !`;
                    }
                } else {
                    lock = true;
                    const previous = first;
                    first = null;

                    timer = setTimeout(() => {
                        previous.classList.remove('open');
                        card.classList.remove('open');
                        previous.textContent = '?';
                        card.textContent = '?';
                        lock = false;

                        score.textContent =
                            `Coups : ${moves} | Paires : ${pairs}/${level.pairs}`;
                    }, 750);

                    score.textContent =
                        `Coups : ${moves} | Paires : ${pairs}/${level.pairs}`;
                }
            };

            grid.append(card);
        });

        document.getElementById('memoryActions')
            .append(button('Recommencer', () => start(index)));
    }

    start(0);

    cleanup = () => clearTimeout(timer);
}


// ========================================
// MORPION CONTRE IA OU A DEUX
// ========================================

function tictactoe() {
    shell(`
        <h3>❌ Morpion ⭕</h3>
        <div id="ticModes"></div>
        <div class="score" id="ticStatus">À toi de jouer !</div>
        <div class="tic-grid" id="ticGrid"></div>
        <div id="ticActions"></div>
    `);

    let mode = 'ai';
    let cells = [];
    let turn = 'X';
    let over = false;
    let buttons = [];
    let aiTimer = null;

    const wins = [
        [0,1,2], [3,4,5], [6,7,8],
        [0,3,6], [1,4,7], [2,5,8],
        [0,4,8], [2,4,6]
    ];

    const grid = document.getElementById('ticGrid');
    const status = document.getElementById('ticStatus');

    document.getElementById('ticModes').append(
        button('Contre l’IA', () => { mode = 'ai'; reset(); }),
        button('Deux joueurs', () => { mode = 'two'; reset(); })
    );

    function winner(a) {
        for (const line of wins) {
            if (a[line[0]] && line.every(i => a[i] === a[line[0]])) {
                return a[line[0]];
            }
        }
        return a.every(Boolean) ? 'draw' : null;
    }

    function minimax(a, max) {
        const w = winner(a);

        if (w === 'O') return 10;
        if (w === 'X') return -10;
        if (w === 'draw') return 0;

        let best = max ? -Infinity : Infinity;

        for (let i = 0; i < 9; i++) {
            if (!a[i]) {
                a[i] = max ? 'O' : 'X';
                const value = minimax(a, !max);
                a[i] = '';
                best = max
                    ? Math.max(best, value)
                    : Math.min(best, value);
            }
        }

        return best;
    }

    function play(i, ai = false) {
        if (over || cells[i]) return;
        if (mode === 'ai' && turn === 'O' && !ai) return;

        cells[i] = turn;
        buttons[i].textContent = turn;

        const w = winner(cells);

        if (w) {
            over = true;
            status.textContent =
                w === 'draw' ? 'Match nul !' :
                mode === 'ai' && w === 'O' ? 'L’IA a gagné !' :
                w + ' a gagné !';
            return;
        }

        turn = turn === 'X' ? 'O' : 'X';

        status.textContent = mode === 'ai'
            ? (turn === 'X' ? 'À toi de jouer !' : 'L’IA réfléchit...')
            : 'Au tour de ' + turn;

        if (mode === 'ai' && turn === 'O') {
            aiTimer = setTimeout(() => {
                if (over) return;

                let best = -Infinity;
                let choice = -1;

                for (let j = 0; j < 9; j++) {
                    if (!cells[j]) {
                        cells[j] = 'O';
                        const v = minimax(cells, false);
                        cells[j] = '';

                        if (v > best) {
                            best = v;
                            choice = j;
                        }
                    }
                }

                if (choice >= 0) play(choice, true);
            }, 300);
        }
    }

    function reset() {
        clearTimeout(aiTimer);
        cells = Array(9).fill('');
        turn = 'X';
        over = false;
        grid.innerHTML = '';
        buttons = [];
        status.textContent = 'À toi de jouer !';

        for (let i = 0; i < 9; i++) {
            const b = document.createElement('button');
            b.className = 'tic-cell';
            b.onclick = () => play(i);
            grid.append(b);
            buttons.push(b);
        }

        document.getElementById('ticActions').innerHTML = '';
        document.getElementById('ticActions').append(
            button('Rejouer', reset)
        );
    }

    reset();
    cleanup = () => clearTimeout(aiTimer);
}


// ========================================
// TEST DE REFLEXES
// ========================================

function reaction() {
    shell(`
        <h3>⚡ Test de réflexes</h3>
        <p>Clique ou appuie sur ESPACE dès que l'écran devient vert !</p>
        <div class="score" id="reactionRecord"></div>
        <div class="reaction-box" id="reactionBox" tabindex="0">
            Clique ou appuie sur ESPACE pour commencer
        </div>
        <p id="animalResult"></p>
    `);

    const box = document.getElementById('reactionBox');
    const result = document.getElementById('animalResult');
    const score = document.getElementById('reactionRecord');

    let state = 'idle';
    let start = 0;
    let best = record('reaction', null);
    let timer = null;

    function updateRecord() {
        score.textContent =
            'Record : ' +
            (best === null ? '—' : best.toFixed(3) + ' seconde(s)');
    }

    function handleReaction() {
        if (state === 'idle' || state === 'result') {
            state = 'waiting';
            box.className = 'reaction-box wait';
            box.textContent = 'Attends le vert...';
            result.textContent = '';

            timer = setTimeout(() => {
                state = 'ready';
                start = performance.now();
                box.className = 'reaction-box ready';
                box.textContent = 'MAINTENANT !';
            }, 1000 + Math.random() * 3000);

        } else if (state === 'waiting') {
            clearTimeout(timer);
            state = 'result';
            box.className = 'reaction-box';
            box.textContent = 'Trop tôt ! Recommence.';

        } else if (state === 'ready') {
            const seconds = (performance.now() - start) / 1000;

            if (best === null || seconds < best) {
                best = seconds;
                saveRecord('reaction', best);
            }

            state = 'result';
            box.className = 'reaction-box';
            box.textContent = seconds.toFixed(3) + ' seconde(s) ! Rejouer';

            let animal;

            if (seconds < 0.18) animal = 'Guépard 🐆';
            else if (seconds < 0.25) animal = 'Dauphin 🐬';
            else if (seconds < 0.35) animal = 'Renard 🦊';
            else if (seconds < 0.50) animal = 'Chat 🐈';
            else if (seconds < 0.70) animal = 'Panda 🐼';
            else animal = 'Escargot 🐌';

            result.textContent = 'Ton animal : ' + animal;
            updateRecord();
        }
    }

    box.onclick = handleReaction;

    document.onkeydown = e => {
        if (e.code === 'Space' && !e.repeat) {
            e.preventDefault();
            handleReaction();
        }
    };

    updateRecord();

    cleanup = () => clearTimeout(timer);
}


// ========================================
// 2048
// ========================================

function game2048() {
    shell(`
        <h3>2048</h3>
        <p>Utilise les flèches ou glisse sur le plateau.</p>
        <div class="score" id="score2048"></div>
        <div class="board2048" id="board2048"></div>
        <div id="actions2048"></div>
    `);

    let board = Array(16).fill(0);
    let score = 0;
    let best = record('2048', 0);
    let over = false;

    const el = document.getElementById('board2048');

    function addTile() {
        const empty = board
            .map((v, i) => v === 0 ? i : null)
            .filter(v => v !== null);

        if (empty.length) {
            board[empty[Math.floor(Math.random() * empty.length)]] =
                Math.random() < 0.9 ? 2 : 4;
        }
    }

    function render() {
        el.innerHTML = '';

        board.forEach(v => {
            const tile = document.createElement('div');
            tile.className = 'tile2048' + (v ? ' v' + v : '');
            tile.textContent = v || '';
            if (v) tile.classList.add('tile-pop');
            el.append(tile);
        });

        document.getElementById('score2048').textContent =
            `Score : ${score} | Record : ${best}` +
            (over ? ' | Partie terminée' : '');
    }

    function canMove() {
        for (let i = 0; i < 16; i++) {
            if (!board[i]) return true;
            if (i % 4 < 3 && board[i] === board[i + 1]) return true;
            if (i < 12 && board[i] === board[i + 4]) return true;
        }
        return false;
    }

    function move(direction) {
        if (over) return;

        const old = board.join(',');

        for (let line = 0; line < 4; line++) {
            const ids = Array.from({length: 4}, (_, i) => {
                if (direction === 'left') return line * 4 + i;
                if (direction === 'right') return line * 4 + 3 - i;
                if (direction === 'up') return i * 4 + line;
                return (3 - i) * 4 + line;
            });

            const values = ids.map(i => board[i]).filter(Boolean);
            const result = [];

            for (let i = 0; i < values.length; i++) {
                if (values[i] === values[i + 1]) {
                    result.push(values[i] * 2);
                    score += values[i] * 2;
                    i++;
                } else {
                    result.push(values[i]);
                }
            }

            while (result.length < 4) result.push(0);
            ids.forEach((id, i) => board[id] = result[i]);
        }

        if (old !== board.join(',')) {
            addTile();

            if (score > best) {
                best = score;
                saveRecord('2048', best);
            }

            if (!board.includes(0) && !canMove()) over = true;
            render();
        }
    }

    document.onkeydown = e => {
        const keys = {
            ArrowLeft: 'left',
            ArrowRight: 'right',
            ArrowUp: 'up',
            ArrowDown: 'down'
        };

        if (keys[e.key]) {
            e.preventDefault();
            move(keys[e.key]);
        }
    };

    // Commandes tactiles par glissement
    let touchStartX = 0;
    let touchStartY = 0;

    el.ontouchstart = e => {
        touchStartX = e.changedTouches[0].screenX;
        touchStartY = e.changedTouches[0].screenY;
    };

    el.ontouchend = e => {
        const dx = e.changedTouches[0].screenX - touchStartX;
        const dy = e.changedTouches[0].screenY - touchStartY;

        if (Math.max(Math.abs(dx), Math.abs(dy)) < 25) return;

        if (Math.abs(dx) > Math.abs(dy)) {
            move(dx > 0 ? 'right' : 'left');
        } else {
            move(dy > 0 ? 'down' : 'up');
        }
    };

    addTile();
    addTile();
    render();

    document.getElementById('actions2048')
        .append(button('Nouvelle partie', game2048));

    cleanup = () => {};
}


// ========================================
// PUISSANCE 4
// ========================================

function connect4() {
    shell(`
        <h3>🔴 Puissance 4 🟡</h3>
        <p>Deux joueurs : alignez quatre jetons pour gagner !</p>
        <div class="score" id="c4Status">Au tour du rouge 🔴</div>
        <div id="c4Columns"></div>
        <div class="connect4-board" id="c4Board"></div>
        <div id="c4Actions"></div>
    `);

    const ROWS = 6;
    const COLS = 7;

    let board = Array.from(
        {length: ROWS},
        () => Array(COLS).fill(null)
    );

    let player = 'red';
    let over = false;

    const grid = document.getElementById('c4Board');
    const status = document.getElementById('c4Status');
    const columns = document.getElementById('c4Columns');

    function render() {
        grid.innerHTML = '';

        for (let r = 0; r < ROWS; r++) {
            for (let c = 0; c < COLS; c++) {
                const cell = document.createElement('button');
                cell.className = 'c4-cell';

                if (board[r][c]) {
                    cell.classList.add(board[r][c]);
                }

                cell.setAttribute(
                    'aria-label',
                    `Ligne ${r + 1}, colonne ${c + 1}`
                );

                cell.onclick = () => drop(c);
                grid.append(cell);
            }
        }
    }

    function checkWin(row, col) {
        const directions = [
            [0, 1],
            [1, 0],
            [1, 1],
            [1, -1]
        ];

        for (const [dr, dc] of directions) {
            let count = 1;

            for (const sign of [-1, 1]) {
                let r = row + dr * sign;
                let c = col + dc * sign;

                while (
                    r >= 0 && r < ROWS &&
                    c >= 0 && c < COLS &&
                    board[r][c] === player
                ) {
                    count++;
                    r += dr * sign;
                    c += dc * sign;
                }
            }

            if (count >= 4) return true;
        }

        return false;
    }

    function drop(col) {
        if (over) return;

        let row = -1;

        for (let r = ROWS - 1; r >= 0; r--) {
            if (!board[r][col]) {
                row = r;
                break;
            }
        }

        if (row === -1) return;

        board[row][col] = player;
        render();

        if (checkWin(row, col)) {
            over = true;
            status.textContent =
                (player === 'red' ? '🔴 Rouge' : '🟡 Jaune') +
                ' a gagné ! Bravo !';
            return;
        }

        if (board.every(row => row.every(Boolean))) {
            over = true;
            status.textContent = 'Match nul !';
            return;
        }

        player = player === 'red' ? 'yellow' : 'red';

        status.textContent = player === 'red'
            ? 'Au tour du rouge 🔴'
            : 'Au tour du jaune 🟡';
    }

    for (let c = 0; c < COLS; c++) {
        const b = button('↓', () => drop(c));
        b.classList.add('c4-column-button');
        columns.append(b);
    }

    document.getElementById('c4Actions')
        .append(button('Nouvelle partie', connect4));

    render();
    cleanup = () => {};
}
