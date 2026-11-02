// PIXEL CLUB - VERSION AMELIOREE

let cleanup = null;

const panel = document.getElementById('gamePanel');
const area = document.getElementById('playArea');
const heading = document.getElementById('gameHeading');

const titles = {
    snake: 'Snake',
    memory: 'Memory',
    tictactoe: 'Morpion',
    reaction: 'Test de réflexes',
    '2048': '2048'
};

document.querySelectorAll('[data-game]').forEach(button => {
    button.onclick = () => openGame(button.dataset.game);
});

document.getElementById('backButton').onclick = () => {
    stopGame();
    area.classList.add('hidden');
    document.getElementById('games').scrollIntoView({behavior:'smooth'});
};

function stopGame() {
    if (cleanup) cleanup();
    cleanup = null;
    document.onkeydown = null;
}

function openGame(name) {
    stopGame();
    heading.textContent = titles[name];
    area.classList.remove('hidden');

    const games = {
        snake,
        memory,
        tictactoe,
        reaction,
        '2048': game2048
    };

    games[name]();
    area.scrollIntoView({behavior:'smooth'});
}

function shell(html) {
    panel.innerHTML = `<div class="game-content">${html}</div>`;
}

function button(text, action) {
    const b = document.createElement('button');
    b.className = 'action';
    b.textContent = text;
    b.onclick = action;
    return b;
}

function record(key, fallback) {
    const value = localStorage.getItem('pixel-' + key);
    return value === null ? fallback : JSON.parse(value);
}

function saveRecord(key, value) {
    localStorage.setItem('pixel-' + key, JSON.stringify(value));
}

// =========================
// SNAKE
// =========================

function snake() {

    shell(`
        <h3>🐍 Snake</h3>
        <p>Mange les pommes et évite les murs !</p>
        <div class="score" id="snakeScore"></div>
        <canvas id="snakeCanvas" width="360" height="360"></canvas>
        <div id="snakeButtons"></div>
        <p>Pomme : +1 point | Fruit doré : +5 points</p>
    `);

    const canvas = document.getElementById('snakeCanvas');
    const ctx = canvas.getContext('2d');

    const size = 20;
    const total = 18;

    let snakeBody = [
        {x:7,y:9},
        {x:6,y:9},
        {x:5,y:9}
    ];

    let direction = {x:1,y:0};
    let nextDirection = {x:1,y:0};

    let apple = {x:12,y:9};
    let bonus = null;

    let score = 0;
    let best = record('snake', 0);
    let dead = false;
    let paused = false;

    function randomPosition() {
        return {
            x: Math.floor(Math.random()*total),
            y: Math.floor(Math.random()*total)
        };
    }

    function newApple() {
        do {
            apple = randomPosition();
        } while (snakeBody.some(p => p.x===apple.x && p.y===apple.y));
    }

    function circle(x,y,r,color) {
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(x,y,r,0,Math.PI*2);
        ctx.fill();
    }

    function draw() {

        ctx.fillStyle = '#10172a';
        ctx.fillRect(0,0,360,360);

        // Grille
        ctx.strokeStyle = '#ffffff10';

        for(let i=0;i<=18;i++) {
            ctx.beginPath();
            ctx.moveTo(i*20,0);
            ctx.lineTo(i*20,360);
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(0,i*20);
            ctx.lineTo(360,i*20);
            ctx.stroke();
        }

        // Pomme
        circle(apple.x*20+10,apple.y*20+11,8,'#ff435d');

        ctx.fillStyle = '#65db83';
        ctx.fillRect(apple.x*20+9,apple.y*20+1,3,7);

        // Fruit bonus
        if(bonus) {
            circle(bonus.x*20+10,bonus.y*20+10,9,'#ffd447');
        }

        // Serpent
        snakeBody.forEach((p,i) => {

            circle(
                p.x*20+10,
                p.y*20+10,
                i===0 ? 9 : 8,
                i===0 ? '#9af0d9' : '#39bda5'
            );

            if(i===0) {
                circle(p.x*20+13,p.y*20+7,2,'#14233a');
                circle(p.x*20+13,p.y*20+13,2,'#14233a');
            }
        });

        document.getElementById('snakeScore').textContent =
            `Score : ${score} | Record : ${best}`;
    }

    function endGame() {
        dead = true;
        clearInterval(timer);

        if(score > best) {
            best = score;
            saveRecord('snake',best);
        }

        draw();

        document.getElementById('snakeButtons')
            .append(button('Rejouer',snake));
    }

    function step() {

        if(dead || paused) return;

        direction = nextDirection;

        const head = {
            x:snakeBody[0].x+direction.x,
            y:snakeBody[0].y+direction.y
        };

        if(
            head.x<0 || head.y<0 ||
            head.x>=total || head.y>=total ||
            snakeBody.some(p=>p.x===head.x && p.y===head.y)
        ) {
            endGame();
            return;
        }

        snakeBody.unshift(head);

        if(head.x===apple.x && head.y===apple.y) {

            score++;
            newApple();

            if(!bonus && Math.random()<0.3) {
                bonus = randomPosition();

                bonusTimer = setTimeout(()=>{
                    bonus=null;
                    draw();
                },5000);
            }

        } else if(bonus && head.x===bonus.x && head.y===bonus.y) {

            score+=5;
            bonus=null;
            clearTimeout(bonusTimer);

        } else {
            snakeBody.pop();
        }

        if(score>best) {
            best=score;
            saveRecord('snake',best);
        }

        draw();
    }

    function turn(x,y) {
        if(x!==-direction.x || y!==-direction.y) {
            nextDirection={x,y};
        }
    }

    document.onkeydown = e => {

        const keys = {
            ArrowUp:[0,-1],
            ArrowDown:[0,1],
            ArrowLeft:[-1,0],
            ArrowRight:[1,0]
        };

        if(keys[e.key]) {
            e.preventDefault();
            turn(...keys[e.key]);
        }

        if(e.key===' ') paused=!paused;
    };

    const controls=document.getElementById('snakeButtons');

    [['↑',0,-1],['←',-1,0],['↓',0,1],['→',1,0]]
        .forEach(([t,x,y])=>{
            controls.append(button(t,()=>turn(x,y)));
        });

    draw();

    const timer=setInterval(step,125);
    let bonusTimer;

    cleanup=()=>{
        clearInterval(timer);
        clearTimeout(bonusTimer);
    };
}

// =========================
// MEMORY
// =========================

function memory() {

    shell(`
        <h3>Memory</h3>
        <p>Choisis ta difficulté !</p>
        <div id="levels"></div>
        <div class="score" id="memoryScore"></div>
        <div class="memory-grid" id="memoryGrid"></div>
        <div id="memoryActions"></div>
    `);

    const images = [
        '🍉','🚀','🎧','⭐',
        '🍀','🐙','🎲','🌈'
    ];

    const levels = [
        {name:'Facile',pairs:4},
        {name:'Moyen',pairs:6},
        {name:'Difficile',pairs:8}
    ];

    let timer;

    levels.forEach((level,i)=>{
        document.getElementById('levels')
            .append(button(level.name+' ('+level.pairs+' paires)',()=>start(i)));
    });

    function start(index) {

        clearTimeout(timer);

        const level=levels[index];

        let cards=[
            ...images.slice(0,level.pairs),
            ...images.slice(0,level.pairs)
        ].sort(()=>Math.random()-0.5);

        let first=null;
        let lock=false;
        let moves=0;
        let pairs=0;

        const startTime=Date.now();

        const grid=document.getElementById('memoryGrid');
        const score=document.getElementById('memoryScore');

        grid.innerHTML='';
        document.getElementById('memoryActions').innerHTML='';

        cards.forEach((emoji)=>{

            const card=document.createElement('button');

            card.className='memory-tile';
            card.textContent='?';

            card.onclick=()=>{

                if(lock || card.classList.contains('open')) return;
                if(card.classList.contains('done')) return;

                card.classList.add('open');
                card.textContent=emoji;

                if(!first) {
                    first=card;
                    return;
                }

                moves++;

                if(first.textContent===card.textContent) {

                    first.classList.add('done');
                    card.classList.add('done');

                    first=null;
                    pairs++;

                } else {

                    lock=true;

                    const previous=first;
                    first=null;

                    timer=setTimeout(()=>{
                        previous.classList.remove('open');
                        card.classList.remove('open');

                        previous.textContent='?';
                        card.textContent='?';

                        lock=false;
                    },700);
                }

                score.textContent=
                    `Coups : ${moves} | Paires : ${pairs}/${level.pairs}`;

                if(pairs===level.pairs) {

                    const seconds=Math.floor((Date.now()-startTime)/1000);
                    const key='memory-'+level.name;
                    const old=record(key,null);

                    if(!old || moves<old.moves) {
                        saveRecord(key,{moves,time:seconds});
                    }

                    const best=record(key,{moves,time:seconds});

                    score.textContent=
                        `Bravo ! ${moves} coups en ${seconds}s. Record : ${best.moves} coups !`;
                }
            };

            grid.append(card);
        });

        document.getElementById('memoryActions')
            .append(button('Recommencer',()=>start(index)));
    }

    start(1);

    cleanup=()=>clearTimeout(timer);
}

// =========================
// MORPION CONTRE IA
// =========================

function tictactoe() {

    shell(`
        <h3>Morpion</h3>
        <div id="ticModes"></div>
        <div class="score" id="ticStatus">À toi de jouer !</div>
        <div class="tic-grid" id="ticGrid"></div>
        <div id="ticActions"></div>
    `);

    let mode='ai';
    let cells=[];
    let turn='X';
    let over=false;
    let buttons=[];

    const wins=[
        [0,1,2],[3,4,5],[6,7,8],
        [0,3,6],[1,4,7],[2,5,8],
        [0,4,8],[2,4,6]
    ];

    const grid=document.getElementById('ticGrid');
    const status=document.getElementById('ticStatus');

    document.getElementById('ticModes').append(
        button('Contre l’IA',()=>{mode='ai';reset();}),
        button('Deux joueurs',()=>{mode='two';reset();})
    );

    function winner(a) {

        for(const line of wins) {
            if(a[line[0]] && line.every(i=>a[i]===a[line[0]])) {
                return a[line[0]];
            }
        }

        return a.every(Boolean)?'draw':null;
    }

    function minimax(a,max) {

        const w=winner(a);

        if(w==='O') return 10;
        if(w==='X') return -10;
        if(w==='draw') return 0;

        let best=max?-Infinity:Infinity;

        for(let i=0;i<9;i++) {

            if(!a[i]) {

                a[i]=max?'O':'X';

                const value=minimax(a,!max);

                a[i]='';

                best=max?Math.max(best,value):Math.min(best,value);
            }
        }

        return best;
    }

    function play(i,ai=false) {

        if(over || cells[i]) return;
        if(mode==='ai' && turn==='O' && !ai) return;

        cells[i]=turn;
        buttons[i].textContent=turn;

        const w=winner(cells);

        if(w) {
            over=true;
            status.textContent=
                w==='draw'?'Match nul !':
                mode==='ai' && w==='O'?'L’IA a gagné !':w+' a gagné !';
            return;
        }

        turn=turn==='X'?'O':'X';

        status.textContent=
            mode==='ai'?(turn==='X'?'À toi de jouer !':'L’IA réfléchit...'):
            'Au tour de '+turn;

        if(mode==='ai' && turn==='O') {

            setTimeout(()=>{

                let best=-Infinity;
                let choice=-1;

                for(let j=0;j<9;j++) {

                    if(!cells[j]) {

                        cells[j]='O';

                        const v=minimax(cells,false);

                        cells[j]='';

                        if(v>best) {
                            best=v;
                            choice=j;
                        }
                    }
                }

                if(choice>=0) play(choice,true);

            },300);
        }
    }

    function reset() {

        cells=Array(9).fill('');
        turn='X';
        over=false;

        grid.innerHTML='';
        buttons=[];

        status.textContent='À toi de jouer !';

        for(let i=0;i<9;i++) {

            const b=document.createElement('button');

            b.className='tic-cell';
            b.onclick=()=>play(i);

            grid.append(b);
            buttons.push(b);
        }

        document.getElementById('ticActions').innerHTML='';

        document.getElementById('ticActions')
            .append(button('Rejouer',reset));
    }

    reset();
}

// =========================
// TEST DE REFLEXES
// =========================

function reaction() {

    shell(`
        <h3>Test de réflexes</h3>
        <p>Clique dès que l'écran devient vert !</p>
        <div class="score" id="reactionRecord"></div>
        <div class="reaction-box" id="reactionBox">
            Clique pour commencer
        </div>
        <p id="animalResult"></p>
    `);

    const box=document.getElementById('reactionBox');
    const result=document.getElementById('animalResult');
    const score=document.getElementById('reactionRecord');

    let state='idle';
    let start;
    let best=record('reaction',null);
    let timer;

    function updateRecord() {
        score.textContent='Record : '+(best===null?'—':best.toFixed(3)+' seconde(s)');
    }

    updateRecord();

    box.onclick=()=>{

        if(state==='idle' || state==='result') {

            state='waiting';

            box.className='reaction-box wait';
            box.textContent='Attends le vert...';

            result.textContent='';

            timer=setTimeout(()=>{

                state='ready';

                start=performance.now();

                box.className='reaction-box ready';
                box.textContent='MAINTENANT !';

            },1000+Math.random()*3000);

        } else if(state==='waiting') {

            clearTimeout(timer);

            state='result';

            box.textContent='Trop tôt ! Réessaie.';
            box.className='reaction-box';

        } else if(state==='ready') {

            const seconds=(performance.now()-start)/1000;

            if(best===null || seconds<best) {
                best=seconds;
                saveRecord('reaction',best);
            }

            state='result';

            box.className='reaction-box';
            box.textContent=seconds.toFixed(3)+' seconde(s) ! Rejouer';

            let animal;

            if(seconds<0.18) animal='Guépard 🐆';
            else if(seconds<0.25) animal='Dauphin 🐬';
            else if(seconds<0.35) animal='Renard 🦊';
            else if(seconds<0.50) animal='Chat 🐈';
            else if(seconds<0.70) animal='Panda 🐼';
            else animal='Escargot 🐌';

            result.textContent='Ton animal : '+animal;

            updateRecord();
        }
    };

    cleanup=()=>clearTimeout(timer);
}

// =========================
// 2048
// =========================

function game2048() {

    shell(`
        <h3>2048</h3>
        <p>Utilise les flèches pour déplacer les cases.</p>
        <div class="score" id="score2048"></div>
        <div class="board2048" id="board2048"></div>
        <div id="actions2048"></div>
    `);

    let board=Array(16).fill(0);
    let score=0;
    let best=record('2048',0);
    let over=false;

    const el=document.getElementById('board2048');

    function addTile() {

        const empty=board
            .map((v,i)=>v===0?i:null)
            .filter(v=>v!==null);

        if(empty.length) {
            board[empty[Math.floor(Math.random()*empty.length)]]=
                Math.random()<0.9?2:4;
        }
    }

    function render() {

        el.innerHTML='';

        board.forEach(v=>{

            const tile=document.createElement('div');

            tile.className='tile2048'+(v?' v'+v:'');
            tile.textContent=v||'';

            if(v) tile.classList.add('tile-pop');

            el.append(tile);
        });

        document.getElementById('score2048').textContent=
            `Score : ${score} | Record : ${best}`+
            (over?' | Partie terminée':'');
    }

    function canMove() {

        for(let i=0;i<16;i++) {

            if(!board[i]) return true;

            if(i%4<3 && board[i]===board[i+1]) return true;

            if(i<12 && board[i]===board[i+4]) return true;
        }

        return false;
    }

    function move(direction) {

        if(over) return;

        const old=board.join(',');

        for(let line=0;line<4;line++) {

            let ids=Array.from({length:4},(_,i)=>{

                if(direction==='left') return line*4+i;
                if(direction==='right') return line*4+3-i;
                if(direction==='up') return i*4+line;

                return (3-i)*4+line;
            });

            let values=ids.map(i=>board[i]).filter(Boolean);
            let result=[];

            for(let i=0;i<values.length;i++) {

                if(values[i]===values[i+1]) {

                    result.push(values[i]*2);
                    score+=values[i]*2;
                    i++;

                } else {
                    result.push(values[i]);
                }
            }

            while(result.length<4) result.push(0);

            ids.forEach((id,i)=>board[id]=result[i]);
        }

        if(old!==board.join(',')) {

            addTile();

            if(score>best) {
                best=score;
                saveRecord('2048',best);
            }

            if(!board.includes(0) && !canMove()) over=true;

            render();
        }
    }

    document.onkeydown=e=>{

        const keys={
            ArrowLeft:'left',
            ArrowRight:'right',
            ArrowUp:'up',
            ArrowDown:'down'
        };

        if(keys[e.key]) {
            e.preventDefault();
            move(keys[e.key]);
        }
    };

    addTile();
    addTile();
    render();

    document.getElementById('actions2048')
        .append(button('Nouvelle partie',game2048));

    cleanup=()=>{};
}
