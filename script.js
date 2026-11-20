// ==========================================
// PIXEL CLUB - SCRIPT COMPLET
// 8 MINI-JEUX
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
  breakout: 'Casse-briques',
  simon: 'Simon'
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
    breakout,
    simon
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
// JEU BONUS - SIMON
// ==========================================

function simon() {
  shell(`
    <h3>🎵 Simon</h3>
    <p>Mémorise la séquence de couleurs et reproduis-la dans le bon ordre.</p>
    <div class="score" id="simonStatus">Prêt ? Lance une partie !</div>
    <div class="simon-board">
      <button class="simon-pad simon-green" data-pad="0" aria-label="Vert"></button>
      <button class="simon-pad simon-red" data-pad="1" aria-label="Rouge"></button>
      <button class="simon-pad simon-yellow" data-pad="2" aria-label="Jaune"></button>
      <button class="simon-pad simon-blue" data-pad="3" aria-label="Bleu"></button>
    </div>
    <div id="simonActions"></div>
    <p class="help">Regarde la séquence, puis reproduis-la. Chaque tour ajoute une couleur.</p>
  `);
  const pads=[...document.querySelectorAll('.simon-pad')];
  const status=document.getElementById('simonStatus');
  const actions=document.getElementById('simonActions');
  let sequence=[], position=0, accepting=false, timers=[], best=record('simon',0), round=0;

  function wait(ms) { return new Promise(resolve=>{ const id=setTimeout(resolve,ms); timers.push(id); }); }
  async function flash(index) {
    const pad=pads[index];
    pad.classList.add('active');
    await wait(330);
    pad.classList.remove('active');
    await wait(170);
  }
  async function showSequence() {
    accepting=false;
    status.textContent=`Mémorise ${sequence.length} couleur(s)...`;
    await wait(450);
    for(const color of sequence) await flash(color);
    position=0;
    accepting=true;
    status.textContent='À toi de jouer !';
  }
  function nextRound() {
    round++;
    sequence.push(Math.floor(Math.random()*4));
    showSequence();
  }
  function start() {
    timers.forEach(clearTimeout); timers=[];
    sequence=[]; position=0; round=0; accepting=false;
    nextRound();
  }
  function press(index) {
    if(!accepting) return;
    flash(index);
    if(sequence[position]!==index) {
      accepting=false;
      status.textContent=`Raté ! Tu as réussi ${round-1} tour(s). Record : ${best}.`;
      actions.innerHTML='';
      actions.append(button('Rejouer',start));
      return;
    }
    position++;
    if(position===sequence.length) {
      accepting=false;
      if(round>best) { best=round; saveRecord('simon',best); }
      status.textContent=`Bien joué ! Niveau ${round} · Record : ${best}`;
      const id=setTimeout(nextRound,650); timers.push(id);
    }
  }
  pads.forEach((pad,index)=>pad.addEventListener('click',()=>press(index)));
  actions.append(button('Commencer',start));
  cleanup=()=>{timers.forEach(clearTimeout); timers=[]; accepting=false;};
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
    {name:'Difficile',pairs:3},
    {name:'Très difficile',pairs:4},
    {name:'Expert',pairs:6},
    {name:'Maître',pairs:8},
    {name:'Légende',pairs:10},
    {name:'Extrême',pairs:12},
    {name:'Ultime',pairs:14}
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
    const cards=[...images.slice(0,level.pairs),...images.slice(0,level.pairs)]
      .sort(()=>Math.random()-0.5);
    let first=null, lock=false, moves=0, pairs=0;
    const startTime=Date.now();
    const grid=document.getElementById('memoryGrid');
    const score=document.getElementById('memoryScore');
    grid.innerHTML='';
    grid.style.gridTemplateColumns=`repeat(${level.pairs<=4?4:Math.min(7,Math.ceil(Math.sqrt(cards.length)))}, minmax(36px, 1fr))`;
    grid.style.maxWidth=level.pairs<=4?'360px':'min(100%, 560px)';
    document.getElementById('memoryActions').innerHTML='';
    score.textContent=`Paires : 0/${level.pairs}`;

    cards.forEach(emoji=>{
      const card=document.createElement('button');
      card.className='memory-tile';
      card.textContent='?';
      card.addEventListener('click',()=>{
        if(lock || card.classList.contains('open') || card.classList.contains('done')) return;
        card.classList.add('open');
        card.textContent=emoji;
        if(!first) { first=card; return; }
        moves++;
        if(first.textContent===card.textContent) {
          first.classList.add('done'); card.classList.add('done');
          first=null; pairs++;
        } else {
          lock=true;
          const previous=first; first=null;
          timer=setTimeout(()=>{
            previous.classList.remove('open'); card.classList.remove('open');
            previous.textContent='?'; card.textContent='?'; lock=false;
          },700);
        }
        score.textContent=`Coups : ${moves} | Paires : ${pairs}/${level.pairs}`;
        if(pairs===level.pairs) {
          const seconds=Math.floor((Date.now()-startTime)/1000);
          const key='memory-'+index, old=record(key,null);
          if(!old || moves<old.moves) saveRecord(key,{moves,time:seconds});
          const best=record(key,{moves,time:seconds});
          score.textContent=`Bravo ! ${moves} coups en ${seconds}s. Record : ${best.moves} coups !`;
        }
      });
      grid.append(card);
    });
    document.getElementById('memoryActions').append(button('Recommencer',()=>start(index)));
  }
  start(0);
  cleanup=()=>{clearTimeout(timer);};
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
    <div id="c4Modes"></div>
    <div class="score" id="c4Status">À toi de jouer !</div>
    <div id="c4Columns"></div>
    <div class="connect4-board" id="c4Board"></div>
    <div id="c4Actions"></div>
  `);

  const rows=6, cols=7;
  let board, current, finished, mode='ai', thinking=false, aiTimer=null;
  const grid=document.getElementById('c4Board');
  const status=document.getElementById('c4Status');
  const columnButtons=document.getElementById('c4Columns');
  const modes=document.getElementById('c4Modes');
  const actions=document.getElementById('c4Actions');
  const centerOrder=[3,2,4,1,5,0,6];

  modes.append(
    button('Contre le bot',()=>{mode='ai';reset();}),
    button('Deux joueurs',()=>{mode='two';reset();})
  );

  function drop(b,col,player) {
    for(let r=rows-1;r>=0;r--) if(!b[r][col]) { b[r][col]=player; return r; }
    return -1;
  }
  function winning(b,player) {
    for(let r=0;r<rows;r++) for(let c=0;c<cols;c++) {
      if(b[r][c]!==player) continue;
      for(const [dr,dc] of [[0,1],[1,0],[1,1],[1,-1]]) {
        let count=1;
        for(let k=1;k<4;k++) {
          const rr=r+dr*k, cc=c+dc*k;
          if(rr<0||rr>=rows||cc<0||cc>=cols||b[rr][cc]!==player) break;
          count++;
        }
        if(count===4) return true;
      }
    }
    return false;
  }
  function available(b) { return centerOrder.filter(c=>!b[0][c]); }
  function scoreWindow(window,player) {
    const opponent=player==='red'?'yellow':'red';
    const mine=window.filter(x=>x===player).length;
    const theirs=window.filter(x=>x===opponent).length;
    const empty=window.filter(x=>!x).length;
    if(mine===4) return 100000;
    if(mine===3&&empty===1) return 90;
    if(mine===2&&empty===2) return 12;
    if(theirs===3&&empty===1) return -100;
    if(theirs===2&&empty===2) return -10;
    return 0;
  }
  function evaluate(b,player) {
    let score=0;
    for(let r=0;r<rows;r++) if(b[r][3]===player) score+=6;
    for(let r=0;r<rows;r++) for(let c=0;c<cols;c++) {
      for(const [dr,dc] of [[0,1],[1,0],[1,1],[1,-1]]) {
        const cells=[];
        for(let k=0;k<4;k++) {
          const rr=r+dr*k, cc=c+dc*k;
          if(rr<0||rr>=rows||cc<0||cc>=cols) { cells.length=0; break; }
          cells.push(b[rr][cc]);
        }
        if(cells.length===4) score+=scoreWindow(cells,player);
      }
    }
    return score;
  }
  function minimax(b,depth,alpha,beta,maximizing) {
    if(winning(b,'yellow')) return 100000+depth;
    if(winning(b,'red')) return -100000-depth;
    const moves=available(b);
    if(depth===0||!moves.length) return evaluate(b,'yellow');
    if(maximizing) {
      let value=-Infinity;
      for(const col of moves) {
        const copy=b.map(row=>row.slice()); drop(copy,col,'yellow');
        value=Math.max(value,minimax(copy,depth-1,alpha,beta,false));
        alpha=Math.max(alpha,value); if(alpha>=beta) break;
      }
      return value;
    } else {
      let value=Infinity;
      for(const col of moves) {
        const copy=b.map(row=>row.slice()); drop(copy,col,'red');
        value=Math.min(value,minimax(copy,depth-1,alpha,beta,true));
        beta=Math.min(beta,value); if(alpha>=beta) break;
      }
      return value;
    }
  }
  function chooseBotMove() {
    const moves=available(board);
    for(const col of moves) {
      const copy=board.map(row=>row.slice()); drop(copy,col,'yellow');
      if(winning(copy,'yellow')) return col;
    }
    for(const col of moves) {
      const copy=board.map(row=>row.slice()); drop(copy,col,'red');
      if(winning(copy,'red')) return col;
    }
    let best=-Infinity, choice=moves[0];
    for(const col of moves) {
      const copy=board.map(row=>row.slice()); drop(copy,col,'yellow');
      const value=minimax(copy,4,-Infinity,Infinity,false);
      if(value>best) { best=value; choice=col; }
    }
    return choice;
  }
  function render() {
    grid.innerHTML='';
    for(let r=0;r<rows;r++) for(let c=0;c<cols;c++) {
      const cell=document.createElement('div');
      cell.className='c4-cell'+(board[r][c]?' '+board[r][c]:'');
      grid.append(cell);
    }
    if(!finished) status.textContent=mode==='ai'&&current==='yellow'?'Le bot réfléchit...':'Au tour du joueur '+(current==='red'?'rouge':'jaune');
  }
  function play(col,fromBot=false) {
    if(finished||thinking||board[0][col]) return;
    if(mode==='ai'&&current==='yellow'&&!fromBot) return;
    const row=drop(board,col,current);
    if(row<0) return;
    render();
    if(winning(board,current)) {
      finished=true;
      status.textContent=mode==='ai'&&current==='yellow'?'Le bot a gagné !':'Le joueur '+(current==='red'?'rouge':'jaune')+' a gagné ! 🎉';
      return;
    }
    if(available(board).length===0) {
      finished=true; status.textContent='Match nul !'; return;
    }
    current=current==='red'?'yellow':'red';
    render();
    if(mode==='ai'&&current==='yellow') {
      thinking=true;
      aiTimer=setTimeout(()=>{
        thinking=false;
        if(!finished) play(chooseBotMove(),true);
      },350);
    }
  }
  function reset() {
    clearTimeout(aiTimer); thinking=false;
    board=Array.from({length:rows},()=>Array(cols).fill(''));
    current='red'; finished=false;
    columnButtons.innerHTML=''; actions.innerHTML='';
    for(let c=0;c<cols;c++) {
      const b=button('↓',()=>play(c));
      b.classList.add('c4-column-button'); columnButtons.append(b);
    }
    actions.append(button('Rejouer',reset));
    render();
  }
  reset();
  cleanup=()=>{clearTimeout(aiTimer);thinking=false;};
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
    <p>Casse toutes les briques, récupère les bonus et passe les niveaux !</p>
    <div class="score" id="breakoutScore">Niveau : 1 · Score : 0 · Vies : 3</div>
    <canvas id="breakoutCanvas" width="560" height="440"></canvas>
    <div class="breakout-controls">
      <button class="action secondary" id="breakoutLeft">← Gauche</button>
      <button class="action" id="breakoutStart">Lancer la balle</button>
      <button class="action secondary" id="breakoutRight">Droite →</button>
    </div>
    <p class="help">Flèches, souris ou boutons pour déplacer la raquette. Attrape les bonus qui tombent !</p>
    <div id="breakoutMessage"></div>
  `);
  const canvas=document.getElementById('breakoutCanvas'), ctx=canvas.getContext('2d');
  const scoreDisplay=document.getElementById('breakoutScore');
  const message=document.getElementById('breakoutMessage');
  const startButton=document.getElementById('breakoutStart');
  const W=canvas.width,H=canvas.height;
  const paddle={width:100,height:13,x:230,y:H-32,speed:7,baseWidth:100};
  const ball={x:W/2,y:paddle.y-10,radius:8,dx:3.5,dy:-4};
  const colors=['#ff6b83','#ffad66','#ffe16b','#65e3d2','#a58bff','#8db7ff','#ff8ac7'];
  let bricks=[], powerups=[], score=0, lives=3, level=1;
  let running=false,launched=false,finished=false,animation=null;
  let leftPressed=false,rightPressed=false,wideTimer=0,slowTimer=0;

  function createBricks() {
    bricks=[];
    const rows=Math.min(5+level,8), cols=12, gap=5, width=40, height=15;
    const left=(W-(cols*(width+gap)-gap))/2;
    for(let r=0;r<rows;r++) for(let c=0;c<cols;c++) {
      bricks.push({x:left+c*(width+gap),y:42+r*(height+gap),width,height,
        color:colors[(r+level-1)%colors.length],alive:true,hp:level>=4&&r%3===0?2:1});
    }
  }
  function resetBall() {
    ball.x=paddle.x+paddle.width/2; ball.y=paddle.y-ball.radius-2;
    const speed=3.4+Math.min(level*.25,2);
    ball.dx=speed*(Math.random()<.5?-1:1); ball.dy=-(speed+0.6);
    launched=false; startButton.textContent='Lancer la balle';
  }
  function updateScore() {
    scoreDisplay.textContent=`Niveau : ${level} · Score : ${score} · Vies : ${lives}`;
  }
  function draw() {
    ctx.fillStyle='#10172a'; ctx.fillRect(0,0,W,H);
    ctx.fillStyle='#ffffff12';
    for(let i=0;i<28;i++) ctx.fillRect((i*83)%W,(i*47)%H,2,2);
    bricks.forEach(b=>{
      if(!b.alive)return;
      ctx.fillStyle=b.color; ctx.beginPath(); ctx.roundRect(b.x,b.y,b.width,b.height,4); ctx.fill();
      ctx.fillStyle='#ffffff45'; ctx.fillRect(b.x+4,b.y+3,b.width-8,2);
      if(b.hp>1){ctx.fillStyle='#222';ctx.font='10px sans-serif';ctx.fillText('2',b.x+b.width/2-3,b.y+12);}
    });
    powerups.forEach(p=>{
      ctx.fillStyle=p.type==='wide'?'#65e3d2':p.type==='life'?'#ffdc45':'#a58bff';
      ctx.beginPath();ctx.arc(p.x,p.y,9,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='#101426';ctx.font='bold 11px sans-serif';ctx.textAlign='center';
      ctx.fillText(p.type==='wide'?'↔':p.type==='life'?'+':'S',p.x,p.y+4);
    });
    ctx.fillStyle='#65e3d2';ctx.beginPath();ctx.roundRect(paddle.x,paddle.y,paddle.width,paddle.height,7);ctx.fill();
    ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(ball.x,ball.y,ball.radius,0,Math.PI*2);ctx.fill();
  }
  function movePaddle() {
    if(leftPressed)paddle.x-=paddle.speed;
    if(rightPressed)paddle.x+=paddle.speed;
    paddle.x=Math.max(0,Math.min(W-paddle.width,paddle.x));
    if(!launched){ball.x=paddle.x+paddle.width/2;ball.y=paddle.y-ball.radius-2;}
  }
  function collidePaddle() {
    if(ball.dy>0&&ball.y+ball.radius>=paddle.y&&ball.y-ball.radius<=paddle.y+paddle.height&&
      ball.x>=paddle.x&&ball.x<=paddle.x+paddle.width) {
      const hit=(ball.x-(paddle.x+paddle.width/2))/(paddle.width/2);
      ball.dx=hit*5.2; ball.dy=-Math.sqrt(Math.max(9,ball.dx**2+ball.dy**2));
      ball.y=paddle.y-ball.radius;
    }
  }
  function end(won) {
    running=false;finished=true;cancelAnimationFrame(animation);
    message.textContent=won?'🏆 Bravo ! Tu as terminé tous les niveaux !':'Partie terminée ! Tu peux retenter ta chance.';
    startButton.textContent='Rejouer';
  }
  function nextLevel() {
    level++;
    if(level>5){end(true);return;}
    createBricks();powerups=[];paddle.width=paddle.baseWidth;paddle.x=(W-paddle.width)/2;
    resetBall();running=false;message.textContent=`Niveau ${level} ! Lance la balle quand tu es prêt.`;
    updateScore();draw();
  }
  function applyPowerup(type) {
    if(type==='wide'){paddle.width=150;wideTimer=Date.now()+9000;}
    if(type==='life'){lives=Math.min(5,lives+1);}
    if(type==='slow'){slowTimer=Date.now()+9000;ball.dx*=.72;ball.dy*=.72;}
    updateScore();
  }
  function update() {
    if(!running)return;
    movePaddle();
    if(Date.now()>wideTimer&&wideTimer){paddle.width=paddle.baseWidth;wideTimer=0;paddle.x=Math.min(paddle.x,W-paddle.width);}
    if(Date.now()>slowTimer&&slowTimer){ball.dx*=1.38;ball.dy*=1.38;slowTimer=0;}
    if(launched) {
      ball.x+=ball.dx;ball.y+=ball.dy;
      if(ball.x-ball.radius<=0||ball.x+ball.radius>=W)ball.dx*=-1;
      if(ball.y-ball.radius<=0)ball.dy=Math.abs(ball.dy);
      collidePaddle();
      for(const b of bricks) {
        if(!b.alive)continue;
        if(ball.x+ball.radius>b.x&&ball.x-ball.radius<b.x+b.width&&ball.y+ball.radius>b.y&&ball.y-ball.radius<b.y+b.height) {
          b.hp--;if(b.hp<=0){b.alive=false;score+=10;
            if(Math.random()<.16)powerups.push({x:b.x+b.width/2,y:b.y+b.height/2,type:['wide','life','slow'][Math.floor(Math.random()*3)]});
          } else score+=3;
          ball.dy*=-1;updateScore();break;
        }
      }
      powerups.forEach(p=>p.y+=2.4);
      powerups=powerups.filter(p=>{
        if(p.y+9>=paddle.y&&p.y-9<=paddle.y+paddle.height&&p.x>=paddle.x&&p.x<=paddle.x+paddle.width){applyPowerup(p.type);return false;}
        return p.y<H+15;
      });
      if(ball.y-ball.radius>H) {
        lives--;updateScore();
        if(lives<=0){end(false);return;}
        resetBall();
      }
      if(bricks.every(b=>!b.alive)){nextLevel();if(finished)return;}
    }
    draw();animation=requestAnimationFrame(update);
  }
  function launch() {
    if(finished){restart();return;}
    if(!launched){launched=true;startButton.textContent='Balle lancée';}
    if(!running){running=true;message.textContent='';update();}
  }
  function restart() {
    cancelAnimationFrame(animation);score=0;lives=3;level=1;running=false;launched=false;finished=false;
    leftPressed=false;rightPressed=false;powerups=[];wideTimer=0;slowTimer=0;
    paddle.width=paddle.baseWidth;paddle.x=(W-paddle.width)/2;
    createBricks();resetBall();updateScore();message.textContent='Bonne chance !';draw();launch();
  }
  function keyDown(e) {
    if(e.key==='ArrowLeft'){e.preventDefault();leftPressed=true;}
    if(e.key==='ArrowRight'){e.preventDefault();rightPressed=true;}
    if(e.code==='Space'){e.preventDefault();launch();}
  }
  function keyUp(e){if(e.key==='ArrowLeft')leftPressed=false;if(e.key==='ArrowRight')rightPressed=false;}
  function mouseMove(e) {
    const rect=canvas.getBoundingClientRect(),x=(e.clientX-rect.left)*(W/rect.width);
    paddle.x=Math.max(0,Math.min(W-paddle.width,x-paddle.width/2));
  }
  const leftButton=document.getElementById('breakoutLeft'),rightButton=document.getElementById('breakoutRight');
  const release=()=>{leftPressed=false;rightPressed=false;};
  leftButton.addEventListener('pointerdown',e=>{e.preventDefault();leftPressed=true;});
  rightButton.addEventListener('pointerdown',e=>{e.preventDefault();rightPressed=true;});
  ['pointerup','pointerleave','pointercancel'].forEach(type=>{
    leftButton.addEventListener(type,release);rightButton.addEventListener(type,release);
  });
  document.addEventListener('keydown',keyDown);document.addEventListener('keyup',keyUp);
  canvas.addEventListener('mousemove',mouseMove);startButton.addEventListener('click',launch);
  createBricks();updateScore();draw();
  cleanup=()=>{
    running=false;cancelAnimationFrame(animation);
    document.removeEventListener('keydown',keyDown);document.removeEventListener('keyup',keyUp);
    canvas.removeEventListener('mousemove',mouseMove);release();
  };
}
