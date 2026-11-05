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
    '2048': '2048',
    connect4: 'Puissance 4'
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
        '2048': game2048,
        connect4
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
        <canvas id="snakeCanvas" width="480" height="480" aria-label="Plateau de Snake"></canvas>
        <div id="snakeButtons"></div>
        <p>Pomme : +1 point | Fruit doré : +5 points</p>
    `);

    const canvas = document.getElementById('snakeCanvas');
    const ctx = canvas.getContext('2d');

    const size = 24;
    const total = 20;

    let snakeBody = [
        {x:7,y:9},
        {x:6,y:9},
        {x:5,y:9}
    ];

    let direction = {x:1,y:0};
    let nextDirection = {x:1,y:0};

    let apple = {x:14,y:10};
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
        ctx.fillRect(0,0,480,480);

        ctx.strokeStyle = '#ffffff10';

        for(let i=0;i<=20;i++) {
            ctx.beginPath();
            ctx.moveTo(i*24,0);
            ctx.lineTo(i*24,480);
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(0,i*24);
            ctx.lineTo(480,i*24);
            ctx.stroke();
        }

        circle(apple.x*24+12,apple.y*24+13,9,'#ff435d');

        ctx.fillStyle = '#65db83';
        ctx.fillRect(apple.x*24+11,apple.y*24+1,4,8);

        if(bonus) {
            circle(bonus.x*24+12,bonus.y*24+12,10,'#ffd447');
        }

        snakeBody.forEach((p,i) => {

            ctx.fillStyle = i===0 ? '#9af0d9' : '#39bda5';
            ctx.fillRect(p.x*24, p.y*24, 24, 24);

            if(i===0) {
                circle(p.x*24+16,p.y*24+7,2.5,'#14233a');
                circle(p.x*24+16,p.y*24+17,2.5,'#14233a');
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

            if(!bonus && Math.random()<0.08) {
                do { bonus = randomPosition(); }
                    while(snakeBody.some(p=>p.x===bonus.x && p.y===bonus.y) ||
                          (bonus.x===apple.x && bonus.y===apple.y));

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
        '🍀','🐙','🎲','🌈','🍓','🦊','⚽','🎮','🍩','🐸'
    ];

    const levels = [
        {name:'Débutant',pairs:3},
        {name:'Facile',pairs:4},
        {name:'Intermédiaire',pairs:6},
        {name:'Difficile',pairs:8},
        {name:'Expert',pairs:10}
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

    start(0);

    cleanup=()=>clearTimeout(timer);
}
