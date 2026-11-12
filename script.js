// ==========================================
// PIXEL CLUB - SCRIPT COMPLET
// 7 MINI-JEUX
// ==========================================

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
  connect4: 'Puissance 4',
  breakout: 'Casse-briques'
};

document.querySelectorAll('[data-game]').forEach(card => {
  card.addEventListener('click', () => openGame(card.dataset.game));
});

document.getElementById('backButton').addEventListener('click', () => {
  stopGame();
  area.classList.add('hidden');
  document.getElementById('games').scrollIntoView({behavior:'smooth'});
});

function stopGame() {
  if (cleanup) cleanup();
  cleanup = null;
  document.onkeydown = null;
}

function openGame(name) {
  stopGame();
  if (!titles[name]) return;

  heading.textContent = titles[name];
  area.classList.remove('hidden');

  const games = {
    snake,
    memory,
    tictactoe,
    reaction,
    '2048': game2048,
    connect4,
    breakout
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
  b.addEventListener('click', action);
  return b;
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
  try {
    localStorage.setItem('pixel-' + key, JSON.stringify(value));
  } catch {}
}

// ==========================================
// 1. SNAKE
// ==========================================

function snake() {
  shell(`
    <h3>🐍 Snake</h3>
    <p>Mange les pommes et évite les murs !</p>
    <div class="score" id="snakeScore"></div>
    <canvas id="snakeCanvas" width="480" height="480"></canvas>
    <div id="snakeButtons"></div>
    <p class="help">Flèches pour jouer · Espace pour mettre en pause</p>
  `);

  const canvas = document.getElementById('snakeCanvas');
  const ctx = canvas.getContext('2d');
  const size = 24;
  const total = 20;

  let body = [{x:7,y:9},{x:6,y:9},{x:5,y:9}];
  let direction = {x:1,y:0};
  let nextDirection = {x:1,y:0};
  let apple = {x:14,y:10};
  let bonus = null;
  let score = 0;
  let best = record('snake',0);
  let dead = false;
  let paused = false;
  let timer;
  let bonusTimer;

  function randomPosition() {
    return {
      x:Math.floor(Math.random()*total),
      y:Math.floor(Math.random()*total)
    };
  }

  function occupied(x,y) {
    return body.some(p=>p.x===x && p.y===y);
  }

  function newApple() {
    do { apple=randomPosition(); }
    while(occupied(apple.x,apple.y));
  }

  function circle(x,y,r,color) {
    ctx.fillStyle=color;
    ctx.beginPath();
    ctx.arc(x,y,r,0,Math.PI*2);
    ctx.fill();
  }

  function draw() {
    ctx.fillStyle='#10172a';
    ctx.fillRect(0,0,480,480);
    ctx.strokeStyle='#ffffff12';

    for(let i=0;i<=total;i++) {
      ctx.beginPath();
      ctx.moveTo(i*size,0);
      ctx.lineTo(i*size,480);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(0,i*size);
      ctx.lineTo(480,i*size);
      ctx.stroke();
    }

    circle(apple.x*size+12,apple.y*size+13,9,'#ff435d');

    ctx.fillStyle='#65db83';
    ctx.fillRect(apple.x*size+11,apple.y*size+1,4,8);

    if(bonus) {
      circle(bonus.x*size+12,bonus.y*size+12,10,'#ffd447');
    }

    body.forEach((p,i)=>{
      ctx.fillStyle=i===0?'#9af0d9':'#39bda5';
      ctx.fillRect(p.x*size,p.y*size,size,size);

      if(i===0) {
        circle(p.x*size+16,p.y*size+7,2.5,'#14233a');
        circle(p.x*size+16,p.y*size+17,2.5,'#14233a');
      }
    });

    document.getElementById('snakeScore').textContent =
      `Score : ${score} | Record : ${best}`+(paused?' | PAUSE':'');
  }

  function endGame() {
    dead=true;
    clearInterval(timer);

    if(score>best) {
      best=score;
      saveRecord('snake',best);
    }

    draw();
    document.getElementById('snakeButtons').append(button('Rejouer',snake));
  }

  function step() {
    if(dead || paused) return;

    direction=nextDirection;

    const head={
      x:body[0].x+direction.x,
      y:body[0].y+direction.y
    };

    const eatingApple=head.x===apple.x && head.y===apple.y;
    const collisionBody=eatingApple?body:body.slice(0,-1);

    if(head.x<0 || head.y<0 || head.x>=total || head.y>=total ||
       collisionBody.some(p=>p.x===head.x && p.y===head.y)) {
      endGame();
      return;
    }

    body.unshift(head);

    if(eatingApple) {
      score++;
      newApple();

      if(!bonus && Math.random()<0.08) {
        do { bonus=randomPosition(); }
        while(occupied(bonus.x,bonus.y) ||
          (bonus.x===apple.x && bonus.y===apple.y));

        bonusTimer=setTimeout(()=>{
          bonus=null;
          draw();
        },5000);
      }
    } else if(bonus && head.x===bonus.x && head.y===bonus.y) {
      score+=5;
      bonus=null;
      clearTimeout(bonusTimer);
    } else {
      body.pop();
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

  document.onkeydown=e=>{
    const keys={
      ArrowUp:[0,-1],
      ArrowDown:[0,1],
      ArrowLeft:[-1,0],
      ArrowRight:[1,0]
    };

    if(keys[e.key]) {
      e.preventDefault();
      turn(...keys[e.key]);
    }

    if(e.code==='Space') {
      e.preventDefault();
      paused=!paused;
      draw();
    }
  };

  const controls=document.getElementById('snakeButtons');

  [['↑',0,-1],['←',-1,0],['↓',0,1],['→',1,0]].forEach(([t,x,y])=>{
    controls.append(button(t,()=>turn(x,y)));
  });

  draw();
  timer=setInterval(step,125);

  cleanup=()=>{
    clearInterval(timer);
    clearTimeout(bonusTimer);
  };
}

// ==========================================
// 2. MEMORY
// ==========================================

function memory() {
  shell(`
    <h3>Memory</h3>
    <p>Retrouve toutes les paires !</p>
    <div id="levels"></div>
    <div class="score" id="memoryScore"></div>
    <div class="memory-grid" id="memoryGrid"></div>
    <div id="memoryActions"></div>
  `);

  const images=['🍉','🚀','🎧','⭐','🍀','🐙','🎲','🌈','🍓','🦊','⚽','🎮','🍩','🐸'];
  const levels=[
    {name:'Débutant',pairs:3},
    {name:'Facile',pairs:4},
    {name:'Intermédiaire',pairs:6},
    {name:'Difficile',pairs:8},
    {name:'Expert',pairs:10}
  ];

  let timer;

  levels.forEach((level,index)=>{
    document.getElementById('levels').append(
      button(`${level.name} (${level.pairs} paires)`,()=>start(index))
    );
  });

  function start(index) {
    clearTimeout(timer);

    const level=levels[index];
    const cards=[
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
    score.textContent=`Paires : 0/${level.pairs}`;

    cards.forEach(emoji=>{
      const card=document.createElement('button');
      card.className='memory-tile';
      card.textContent='?';

      card.addEventListener('click',()=>{
        if(lock || card.classList.contains('open') ||
           card.classList.contains('done')) return;

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

        score.textContent=`Coups : ${moves} | Paires : ${pairs}/${level.pairs}`;

        if(pairs===level.pairs) {
          const seconds=Math.floor((Date.now()-startTime)/1000);
          const key='memory-'+index;
          const old=record(key,null);

          if(!old || moves<old.moves) {
            saveRecord(key,{moves,time:seconds});
          }

          const best=record(key,{moves,time:seconds});
          score.textContent=`Bravo ! ${moves} coups en ${seconds}s. Record : ${best.moves} coups !`;
        }
      });

      grid.append(card);
    });

    document.getElementById('memoryActions')
      .append(button('Recommencer',()=>start(index)));
  }

  start(0);
  cleanup=()=>clearTimeout(timer);
}

// ==========================================
// 3. MORPION
// ==========================================

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

  function winner(board) {
    for(const line of wins) {
      if(board[line[0]] && line.every(i=>board[i]===board[line[0]])) {
        return board[line[0]];
      }
    }
    return board.every(Boolean)?'draw':null;
  }

  function minimax(board,maximizing) {
    const result=winner(board);
    if(result==='O') return 10;
    if(result==='X') return -10;
    if(result==='draw') return 0;

    let best=maximizing?-Infinity:Infinity;

    for(let i=0;i<9;i++) {
      if(!board[i]) {
        board[i]=maximizing?'O':'X';
        const value=minimax(board,!maximizing);
        board[i]='';
        best=maximizing?Math.max(best,value):Math.min(best,value);
      }
    }
    return best;
  }

  function play(index,fromAI=false) {
    if(over || cells[index]) return;
    if(mode==='ai' && turn==='O' && !fromAI) return;

    cells[index]=turn;
    buttons[index].textContent=turn;

    const result=winner(cells);

    if(result) {
      over=true;
      status.textContent=result==='draw'?'Match nul !':
        mode==='ai' && result==='O'?'L’IA a gagné !':result+' a gagné !';
      return;
    }

    turn=turn==='X'?'O':'X';
    status.textContent=mode==='ai'
      ?turn==='X'?'À toi de jouer !':'L’IA réfléchit...'
      :'Au tour de '+turn;

    if(mode==='ai' && turn==='O') {
      setTimeout(()=>{
        if(over) return;
        let best=-Infinity;
        let choice=-1;

        for(let i=0;i<9;i++) {
          if(!cells[i]) {
            cells[i]='O';
            const value=minimax(cells,false);
            cells[i]='';
            if(value>best) {
              best=value;
              choice=i;
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
      b.addEventListener('click',()=>play(i));
      grid.append(b);
      buttons.push(b);
    }

    document.getElementById('ticActions').innerHTML='';
    document.getElementById('ticActions').append(button('Rejouer',reset));
  }

  reset();
}

// ==========================================
// 4. TEST DE REFLEXES
// ==========================================

function reaction() {
  shell(`
    <h3>Test de réflexes</h3>
    <p>Clique ou appuie sur Espace dès que l'écran devient vert !</p>
    <div class="score" id="reactionRecord"></div>
    <div class="reaction-box" id="reactionBox">Clique pour commencer</div>
    <p id="animalResult"></p>
  `);

  const box=document.getElementById('reactionBox');
  const result=document.getElementById('animalResult');
  const score=document.getElementById('reactionRecord');

  let state='idle';
  let start=0;
  let best=record('reaction',null);
  let timer;

  function updateRecord() {
    score.textContent='Record : '+(best===null?'—':best.toFixed(3)+' seconde(s)');
  }

  updateRecord();

  function react() {
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
  }

  box.addEventListener('click',react);

  const keyHandler=e=>{
    if(e.code==='Space' && !e.repeat) {
      e.preventDefault();
      react();
    }
  };

  document.addEventListener('keydown',keyHandler);

  cleanup=()=>{
    clearTimeout(timer);
    document.removeEventListener('keydown',keyHandler);
  };
}

// ==========================================
// 5. PUISSANCE 4
// ==========================================

function connect4() {
  shell(`
    <h3>🔴 Puissance 4 🟡</h3>
    <p>Aligne quatre jetons pour gagner !</p>
    <div class="score" id="c4Status">Au tour du joueur rouge</div>
    <div id="c4Columns"></div>
    <div class="connect4-board" id="c4Board"></div>
    <div id="c4Actions"></div>
  `);

  const rows=6, cols=7;
  const board=Array.from({length:rows},()=>Array(cols).fill(''));
  const grid=document.getElementById('c4Board');
  const status=document.getElementById('c4Status');
  const columnButtons=document.getElementById('c4Columns');

  let current='red';
  let finished=false;

  function playerName(player) {
    return player==='red'?'rouge':'jaune';
  }

  function hasWon(row,col,player) {
    const directions=[[0,1],[1,0],[1,1],[1,-1]];

    for(const [dr,dc] of directions) {
      let count=1;

      for(const sign of [-1,1]) {
        let r=row+dr*sign;
        let c=col+dc*sign;

        while(r>=0 && r<rows && c>=0 && c<cols && board[r][c]===player) {
          count++;
          r+=dr*sign;
          c+=dc*sign;
        }
      }

      if(count>=4) return true;
    }

    return false;
  }

  function render() {
    grid.innerHTML='';

    for(let r=0;r<rows;r++) {
      for(let c=0;c<cols;c++) {
        const cell=document.createElement('div');
        cell.className='c4-cell'+(board[r][c]?' '+board[r][c]:'');
        grid.append(cell);
      }
    }

    if(!finished) {
      status.textContent='Au tour du joueur '+playerName(current);
    }
  }

  function play(col) {
    if(finished) return;

    let row=rows-1;
    while(row>=0 && board[row][col]) row--;
    if(row<0) return;

    board[row][col]=current;
    render();

    if(hasWon(row,col,current)) {
      finished=true;
      status.textContent='Le joueur '+playerName(current)+' a gagné ! 🎉';
      return;
    }

    if(board.every(line=>line.every(Boolean))) {
      finished=true;
      status.textContent='Match nul !';
      return;
    }

    current=current==='red'?'yellow':'red';
    status.textContent='Au tour du joueur '+playerName(current);
  }

  for(let c=0;c<cols;c++) {
    const b=button('↓',()=>play(c));
    b.classList.add('c4-column-button');
    columnButtons.append(b);
  }

  document.getElementById('c4Actions').append(button('Rejouer',connect4));
  render();
}

// ==========================================
// 6. 2048
// ==========================================

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
    const empty=board.map((v,i)=>v===0?i:null).filter(v=>v!==null);

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
      el.append(tile);
    });

    document.getElementById('score2048').textContent=
      `Score : ${score} | Record : ${best}`+(over?' | Partie terminée':'');
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
      const ids=Array.from({length:4},(_,i)=>{
        if(direction==='left') return line*4+i;
        if(direction==='right') return line*4+3-i;
        if(direction==='up') return i*4+line;
        return (3-i)*4+line;
      });

      const values=ids.map(i=>board[i]).filter(Boolean);
      const result=[];

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

// ==========================================
// 7. CASSE-BRIQUES
// ==========================================

function breakout() {
  shell(`
    <h3>🧱 Casse-briques</h3>
    <p>Détruis toutes les briques avec la balle !</p>
    <div class="score" id="breakoutScore">Score : 0 · Vies : 3</div>
    <canvas id="breakoutCanvas" width="560" height="420"></canvas>
    <div class="breakout-controls">
      <button class="action secondary" id="breakoutLeft">← Gauche</button>
      <button class="action" id="breakoutStart">Lancer la balle</button>
      <button class="action secondary" id="breakoutRight">Droite →</button>
    </div>
    <p class="help">Déplace la raquette avec les flèches, la souris ou les boutons.</p>
    <div id="breakoutMessage"></div>
  `);

  const canvas=document.getElementById('breakoutCanvas');
  const ctx=canvas.getContext('2d');
  const scoreDisplay=document.getElementById('breakoutScore');
  const message=document.getElementById('breakoutMessage');
  const startButton=document.getElementById('breakoutStart');

  const W=canvas.width;
  const H=canvas.height;

  const paddle={
    width:105,
    height:13,
    x:(W-105)/2,
    y:H-32,
    speed:7
  };

  const ball={
    x:W/2,
    y:paddle.y-10,
    radius:8,
    dx:3.5,
    dy:-4
  };

  const brickRows=5;
  const brickCols=9;
  const brickWidth=52;
  const brickHeight=17;
  const brickGap=8;
  const brickTop=55;
  const brickLeft=(W-(brickCols*(brickWidth+brickGap)-brickGap))/2;

  const colors=['#ff6b83','#ffad66','#ffe16b','#65e3d2','#a58bff'];

  let bricks=[];
  let score=0;
  let lives=3;
  let running=false;
  let launched=false;
  let finished=false;
  let animation=null;
  let leftPressed=false;
  let rightPressed=false;

  function createBricks() {
    bricks=[];

    for(let r=0;r<brickRows;r++) {
      for(let c=0;c<brickCols;c++) {
        bricks.push({
          x:brickLeft+c*(brickWidth+brickGap),
          y:brickTop+r*(brickHeight+brickGap),
          width:brickWidth,
          height:brickHeight,
          color:colors[r],
          alive:true
        });
      }
    }
  }

  function resetBall() {
    ball.x=paddle.x+paddle.width/2;
    ball.y=paddle.y-ball.radius-2;
    ball.dx=3.5*(Math.random()<0.5?-1:1);
    ball.dy=-4;
    launched=false;
    startButton.textContent='Lancer la balle';
  }

  function updateScore() {
    scoreDisplay.textContent=`Score : ${score} · Vies : ${lives}`;
  }

  function draw() {
    ctx.clearRect(0,0,W,H);

    // Fond
    ctx.fillStyle='#10172a';
    ctx.fillRect(0,0,W,H);

    // Décoration
    ctx.fillStyle='#ffffff12';
    for(let i=0;i<25;i++) {
      ctx.fillRect((i*83)%W,(i*47)%H,2,2);
    }

    // Briques
    bricks.forEach(brick=>{
      if(!brick.alive) return;

      ctx.fillStyle=brick.color;
      ctx.beginPath();
      ctx.roundRect(brick.x,brick.y,brick.width,brick.height,5);
      ctx.fill();

      ctx.fillStyle='#ffffff35';
      ctx.fillRect(brick.x+5,brick.y+3,brick.width-10,3);
    });

    // Raquette
    ctx.fillStyle='#65e3d2';
    ctx.beginPath();
    ctx.roundRect(paddle.x,paddle.y,paddle.width,paddle.height,7);
    ctx.fill();

    // Balle
    ctx.fillStyle='#ffffff';
    ctx.beginPath();
    ctx.arc(ball.x,ball.y,ball.radius,0,Math.PI*2);
    ctx.fill();

    // Petit halo
    ctx.shadowColor='#65e3d2';
    ctx.shadowBlur=12;
    ctx.beginPath();
    ctx.arc(ball.x,ball.y,ball.radius-3,0,Math.PI*2);
    ctx.fill();
    ctx.shadowBlur=0;
  }

  function movePaddle() {
    if(leftPressed) paddle.x-=paddle.speed;
    if(rightPressed) paddle.x+=paddle.speed;

    paddle.x=Math.max(0,Math.min(W-paddle.width,paddle.x));

    if(!launched) {
      ball.x=paddle.x+paddle.width/2;
      ball.y=paddle.y-ball.radius-2;
    }
  }

  function collisionWithPaddle() {
    if(
      ball.dy>0 &&
      ball.y+ball.radius>=paddle.y &&
      ball.y-ball.radius<=paddle.y+paddle.height &&
      ball.x>=paddle.x &&
      ball.x<=paddle.x+paddle.width
    ) {
      const hit=(ball.x-(paddle.x+paddle.width/2))/(paddle.width/2);
      ball.dx=hit*5;
      ball.dy=-Math.sqrt(Math.max(8,ball.dx*ball.dx+ball.dy*ball.dy));
      ball.y=paddle.y-ball.radius;
    }
  }

  function finish(won) {
    running=false;
    finished=true;
    cancelAnimationFrame(animation);

    message.innerHTML=won
      ? '<p>🎉 Bravo ! Tu as détruit toutes les briques !</p>'
      : '<p>Partie terminée ! Essaie encore.</p>';

    startButton.textContent='Rejouer';
  }

  function update() {
    if(!running) return;

    movePaddle();

    if(launched) {
      ball.x+=ball.dx;
      ball.y+=ball.dy;

      // Murs gauche et droit
      if(ball.x-ball.radius<=0 || ball.x+ball.radius>=W) {
        ball.dx*=-1;
      }

      // Mur du haut
      if(ball.y-ball.radius<=0) {
        ball.dy=Math.abs(ball.dy);
      }

      collisionWithPaddle();

      // Collision avec les briques
      for(const brick of bricks) {
        if(!brick.alive) continue;

        if(
          ball.x+ball.radius>brick.x &&
          ball.x-ball.radius<brick.x+brick.width &&
          ball.y+ball.radius>brick.y &&
          ball.y-ball.radius<brick.y+brick.height
        ) {
          brick.alive=false;
          score+=10;
          ball.dy*=-1;
          updateScore();
          break;
        }
      }

      // Balle perdue
      if(ball.y-ball.radius>H) {
        lives--;
        updateScore();

        if(lives<=0) {
          finish(false);
          return;
        }

        resetBall();
      }

      // Toutes les briques détruites
      if(bricks.every(brick=>!brick.alive)) {
        finish(true);
        return;
      }
    }

    draw();
    animation=requestAnimationFrame(update);
  }

  function launch() {
    if(finished) {
      restart();
      return;
    }

    if(!launched) {
      launched=true;
      startButton.textContent='Balle lancée';
    }

    if(!running) {
      running=true;
      message.textContent='';
      update();
    }
  }

  function restart() {
    cancelAnimationFrame(animation);

    score=0;
    lives=3;
    running=false;
    launched=false;
    finished=false;
    leftPressed=false;
    rightPressed=false;

    paddle.x=(W-paddle.width)/2;

    createBricks();
    resetBall();
    updateScore();

    message.textContent='Bonne chance !';
    draw();
    launch();
  }

  function stop() {
    running=false;
    cancelAnimationFrame(animation);
    leftPressed=false;
    rightPressed=false;
  }

  // Clavier
  function keyDown(e) {
    if(e.key==='ArrowLeft') {
      e.preventDefault();
      leftPressed=true;
    }

    if(e.key==='ArrowRight') {
      e.preventDefault();
      rightPressed=true;
    }

    if(e.code==='Space') {
      e.preventDefault();
      launch();
    }
  }

  function keyUp(e) {
    if(e.key==='ArrowLeft') leftPressed=false;
    if(e.key==='ArrowRight') rightPressed=false;
  }

  document.addEventListener('keydown',keyDown);
  document.addEventListener('keyup',keyUp);

  // Souris
  function mouseMove(e) {
    const rect=canvas.getBoundingClientRect();
    const scale=W/rect.width;
    const mouseX=(e.clientX-rect.left)*scale;

    paddle.x=Math.max(
      0,
      Math.min(W-paddle.width,mouseX-paddle.width/2)
    );
  }

  canvas.addEventListener('mousemove',mouseMove);

  // Commandes tactiles
  const leftButton=document.getElementById('breakoutLeft');
  const rightButton=document.getElementById('breakoutRight');

  leftButton.addEventListener('pointerdown',e=>{
    e.preventDefault();
    leftPressed=true;
  });

  rightButton.addEventListener('pointerdown',e=>{
    e.preventDefault();
    rightPressed=true;
  });

  function releaseControls() {
    leftPressed=false;
    rightPressed=false;
  }

  leftButton.addEventListener('pointerup',releaseControls);
  rightButton.addEventListener('pointerup',releaseControls);
  leftButton.addEventListener('pointerleave',releaseControls);
  rightButton.addEventListener('pointerleave',releaseControls);
  leftButton.addEventListener('pointercancel',releaseControls);
  rightButton.addEventListener('pointercancel',releaseControls);

  startButton.addEventListener('click',launch);

  createBricks();
  updateScore();
  draw();

  cleanup=()=>{
    stop();
    document.removeEventListener('keydown',keyDown);
    document.removeEventListener('keyup',keyUp);
    canvas.removeEventListener('mousemove',mouseMove);
  };
}
