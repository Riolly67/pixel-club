// ==========================================
// PIXEL CLUB - SCRIPT COMPLET
// 9 MINI-JEUX
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
  simon: 'Simon',
  pong: 'Pong'
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
    simon,
    pong
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
    <p>Observe la séquence puis reproduis-la sans te tromper.</p>
    <div id="simonModes"></div>
    <div class="score" id="simonStatus">Choisis un mode et commence !</div>
    <div class="simon-board">
      <button class="simon-pad simon-green" data-pad="0" aria-label="Vert"></button>
      <button class="simon-pad simon-red" data-pad="1" aria-label="Rouge"></button>
      <button class="simon-pad simon-yellow" data-pad="2" aria-label="Jaune"></button>
      <button class="simon-pad simon-blue" data-pad="3" aria-label="Bleu"></button>
    </div>
    <div id="simonActions"></div>
    <p class="help">En deux joueurs, chacun joue à son tour. Le meilleur score gagne.</p>
  `);
  const pads=[...document.querySelectorAll('.simon-pad')];
  const status=document.getElementById('simonStatus');
  const actions=document.getElementById('simonActions');
  const modes=document.getElementById('simonModes');
  let mode='solo', sequence=[], position=0, accepting=false, timers=[], round=0;
  let player=1, scores=[0,0], best=record('simon',0), generation=0;
  function clearTimers(){timers.forEach(clearTimeout);timers=[];}
  function later(fn,ms){const id=setTimeout(fn,ms);timers.push(id);return id;}
  function flash(index,duration=280){
    pads[index].classList.add('active');
    later(()=>pads[index].classList.remove('active'),duration);
  }
  function showSequence(token){
    accepting=false;
    status.textContent=`${mode==='two'?'Joueur '+player+' · ':''}Mémorise ${sequence.length} couleur(s)...`;
    let i=0;
    const playNext=()=>{
      if(token!==generation)return;
      if(i>=sequence.length){position=0;accepting=true;status.textContent=`${mode==='two'?'Joueur '+player+' · ':''}À toi de jouer !`;return;}
      const index=sequence[i++];
      pads[index].classList.add('active');
      later(()=>{pads[index].classList.remove('active');later(playNext,180);},380);
    };
    later(playNext,500);
  }
  function startTurn(){
    generation++;clearTimers();sequence=[];position=0;round=0;accepting=false;
    nextRound();
  }
  function nextRound(){
    round++;sequence.push(Math.floor(Math.random()*4));showSequence(generation);
  }
  function start(){
    player=1;scores=[0,0];startTurn();
    status.textContent=mode==='two'?'Joueur 1 commence !':'Nouvelle partie !';
  }
  function finishTurn(){
    accepting=false;
    const result=Math.max(0,round-1);
    scores[player-1]=result;
    if(mode==='solo'&&result>best){best=result;saveRecord('simon',best);}
    if(mode==='solo'){
      if(result>best){best=result;saveRecord('simon',best);}
      status.textContent=`Perdu ! Score : ${result} · Record : ${best}`;
      actions.innerHTML='';actions.append(button('Rejouer',start));return;
    }
    if(player===1){player=2;status.textContent=`Joueur 1 : ${scores[0]} points. Au tour du joueur 2 !`;startTurn();}
    else{
      const winner=scores[0]===scores[1]?'Égalité !':`Le joueur ${scores[0]>scores[1]?1:2} gagne !`;
      status.textContent=`${winner} Scores : ${scores[0]} – ${scores[1]}`;
      actions.innerHTML='';actions.append(button('Revanche',start));
    }
  }
  function press(index){
    if(!accepting)return;
    flash(index,130);
    if(sequence[position]!==index){finishTurn();return;}
    position++;
    if(position===sequence.length){
      accepting=false;
      if(mode==='solo'&&round>best){best=round;saveRecord('simon',best);}
      status.textContent=`${mode==='two'?'Joueur '+player+' · ':''}Bien joué ! Niveau ${round}`;
      later(nextRound,650);
    }
  }
  pads.forEach((pad,index)=>pad.addEventListener('click',()=>press(index)));
  modes.append(button('Solo',()=>{mode='solo';start();}),button('Deux joueurs',()=>{mode='two';start();}));
  actions.append(button('Commencer',start));
  cleanup=()=>{generation++;clearTimers();accepting=false;};
}


// ==========================================
// 1. SNAKE
// ==========================================

function snake() {
  shell(`
    <h3>🐍 Snake</h3><p>Mange les pommes et évite les murs et les autres serpents !</p>
    <div id="snakeModes"></div><div class="score" id="snakeScore"></div>
    <canvas id="snakeCanvas" width="480" height="480"></canvas>
    <div id="snakeButtons"></div>
    <p class="help">Solo : flèches · Deux joueurs : joueur 1 = ZQSD, joueur 2 = flèches · Espace = pause</p>
  `);
  const canvas=document.getElementById('snakeCanvas'),ctx=canvas.getContext('2d'),size=24,total=20;
  const scoreEl=document.getElementById('snakeScore'),controls=document.getElementById('snakeButtons');
  let mode='solo',snakes=[],apple={x:14,y:10},bonus=null,scores=[0,0],best=record('snake',0),dead=false,paused=false,timer=null,bonusTimer=null;
  const dirs={up:{x:0,y:-1},down:{x:0,y:1},left:{x:-1,y:0},right:{x:1,y:0}};
  function randomPosition(){return{x:Math.floor(Math.random()*total),y:Math.floor(Math.random()*total)};}
  function occupied(x,y){return snakes.some(s=>s.body.some(p=>p.x===x&&p.y===y));}
  function newApple(){let p;do{p=randomPosition();}while(occupied(p.x,p.y));apple=p;}
  function start(nextMode=mode){clearInterval(timer);clearTimeout(bonusTimer);mode=nextMode;scores=[0,0];dead=false;paused=false;bonus=null;
    snakes=[{body:[{x:4,y:9},{x:3,y:9},{x:2,y:9}],dir:dirs.right,next:dirs.right,color:'#39bda5',head:'#9af0d9',alive:true},
      {body:[{x:15,y:10},{x:16,y:10},{x:17,y:10}],dir:dirs.left,next:dirs.left,color:'#a58bff',head:'#d2c6ff',alive:true}];
    newApple();controls.innerHTML='';
    if(mode==='solo') [['↑','up'],['←','left'],['↓','down'],['→','right']].forEach(([t,d])=>controls.append(button(t,()=>turn(0,d))));
    draw();timer=setInterval(step,125);
  }
  function circle(x,y,r,color){ctx.fillStyle=color;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();}
  function draw(){ctx.fillStyle='#10172a';ctx.fillRect(0,0,480,480);ctx.strokeStyle='#ffffff12';for(let i=0;i<=total;i++){ctx.beginPath();ctx.moveTo(i*size,0);ctx.lineTo(i*size,480);ctx.stroke();ctx.beginPath();ctx.moveTo(0,i*size);ctx.lineTo(480,i*size);ctx.stroke();}
    circle(apple.x*size+12,apple.y*size+12,9,'#ff435d');if(bonus)circle(bonus.x*size+12,bonus.y*size+12,10,'#ffd447');
    snakes.slice(0,mode==='two'?2:1).forEach(s=>s.body.forEach((p,i)=>{ctx.fillStyle=i===0?s.head:s.color;ctx.fillRect(p.x*size,p.y*size,size,size);}));
    scoreEl.textContent=mode==='two'?`Joueur 1 : ${scores[0]} · Joueur 2 : ${scores[1]}${paused?' · PAUSE':''}`:`Score : ${scores[0]} · Record : ${best}${paused?' · PAUSE':''}`;
  }
  function turn(index,d){const s=snakes[index];if(!s||!s.alive)return;const v=dirs[d];if(v.x!==-s.dir.x||v.y!==-s.dir.y)s.next=v;}
  function end(winner=null){dead=true;clearInterval(timer);if(mode==='solo'&&scores[0]>best){best=scores[0];saveRecord('snake',best);}draw();scoreEl.textContent=mode==='two'?(winner?`Joueur ${winner} gagne ! · ${scores[0]} – ${scores[1]}`:'Match terminé'):`Partie terminée · Score : ${scores[0]} · Record : ${best}`;controls.append(button('Rejouer',()=>start(mode)));}
  function step(){if(dead||paused)return;snakes.forEach(s=>s.dir=s.next);
    const next=snakes.map(s=>({x:s.body[0].x+s.dir.x,y:s.body[0].y+s.dir.y}));
    const ate=next.map(p=>p.x===apple.x&&p.y===apple.y);
    const crashes=snakes.map((s,i)=>{const p=next[i],own=ate[i]?s.body:s.body.slice(0,-1);return p.x<0||p.y<0||p.x>=total||p.y>=total||own.some(q=>q.x===p.x&&q.y===p.y)|| (mode==='two'&&snakes[1-i].body.some(q=>q.x===p.x&&q.y===p.y));});
    if(mode==='solo'&&crashes[0]){end();return;}if(mode==='two'&&(crashes[0]||crashes[1])){end(crashes[0]&&!crashes[1]?2:crashes[1]&&!crashes[0]?1:null);return;}
    snakes.forEach((s,i)=>{s.body.unshift(next[i]);if(ate[i])scores[i]++;else s.body.pop();if(bonus&&next[i].x===bonus.x&&next[i].y===bonus.y){scores[i]+=5;bonus=null;clearTimeout(bonusTimer);}});
    if(ate.some(Boolean)){newApple();if(!bonus&&Math.random()<.08){do{bonus=randomPosition();}while(occupied(bonus.x,bonus.y)||bonus.x===apple.x&&bonus.y===apple.y);bonusTimer=setTimeout(()=>{bonus=null;draw();},5000);}}
    if(mode==='solo'&&scores[0]>best){best=scores[0];saveRecord('snake',best);}draw();
  }
  const keydown=e=>{const k=e.key.toLowerCase();const map1={z:'up',s:'down',q:'left',d:'right'},map2={ArrowUp:'up',ArrowDown:'down',ArrowLeft:'left',ArrowRight:'right'};if(mode==='two'&&map1[k]){e.preventDefault();turn(0,map1[k]);}else if(map2[e.key]){e.preventDefault();turn(mode==='two'?1:0,map2[e.key]);}if(e.code==='Space'){e.preventDefault();paused=!paused;draw();}};
  document.addEventListener('keydown',keydown);
  document.getElementById('snakeModes').append(button('Solo',()=>start('solo')),button('Deux joueurs',()=>start('two')));
  start('solo');cleanup=()=>{clearInterval(timer);clearTimeout(bonusTimer);document.removeEventListener('keydown',keydown);};
}


// ==========================================
// 2. MEMORY
// ==========================================


function memory() {
  shell(`
    <h3>Memory</h3>
    <p>Retrouve les paires. Les grilles sont carrées à chaque niveau !</p>
    <div id="levels"></div>
    <div id="memoryModes"></div>
    <div class="score" id="memoryScore"></div>
    <div class="memory-grid" id="memoryGrid"></div>
    <div id="memoryActions"></div>
  `);
  const images=['🍉','🚀','🎧','⭐','🍀','🐙','🎲','🌈','🍓','🦊','⚽','🎮','🍩','🐸','🎯','🧩','🍕','🐼','🌻','🎸','🚲','🦋','🍪','🐳','⚡','🏀','🍒','🛸','🐢','🎨','🍇','🦄','🥑','🐝','🎁','🌙','🍍','🦖','🎤','🏆','🧸','🍋','🐬','🎹','🌵','🧁','🦉','🚀','💎','🍭'];
  const levels=[
    {name:'Facile',pairs:8,side:4},
    {name:'Normal',pairs:18,side:6},
    {name:'Difficile',pairs:32,side:8},
    {name:'Expert',pairs:50,side:10}
  ];
  let timer=null, mode='solo', currentLevel=0;
  const levelsEl=document.getElementById('levels');
  const modesEl=document.getElementById('memoryModes');
  const grid=document.getElementById('memoryGrid');
  const score=document.getElementById('memoryScore');
  const actions=document.getElementById('memoryActions');
  levels.forEach((level,index)=>levelsEl.append(button(`${level.name} · ${level.pairs} paires`,()=>start(index))));
  modesEl.append(button('Solo',()=>{mode='solo';start(currentLevel);}),button('Deux joueurs',()=>{mode='two';start(currentLevel);}));
  function start(index){
    clearTimeout(timer);currentLevel=index;
    const level=levels[index];
    const cards=[...images.slice(0,level.pairs),...images.slice(0,level.pairs)];
    for(let i=cards.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[cards[i],cards[j]]=[cards[j],cards[i]];}
    let first=null,lock=false,moves=0,pairs=0,turn=1;
    const points=[0,0],startTime=Date.now();
    grid.innerHTML='';grid.style.gridTemplateColumns=`repeat(${level.side}, minmax(0, 1fr))`;
    grid.style.width=`min(100%, ${level.side*54}px)`;
    grid.style.maxWidth='100%';
    grid.style.setProperty('--memory-side',level.side);
    actions.innerHTML='';
    function update(){score.textContent=mode==='two'?`Joueur ${turn} · Paires : ${points[0]} – ${points[1]} · Trouvées : ${pairs}/${level.pairs}`:`Coups : ${moves} · Paires : ${pairs}/${level.pairs}`;}
    cards.forEach(emoji=>{
      const card=document.createElement('button');card.className='memory-tile';card.textContent='?';
      card.addEventListener('click',()=>{
        if(lock||card.classList.contains('open')||card.classList.contains('done'))return;
        card.classList.add('open');card.textContent=emoji;
        if(!first){first=card;return;}
        moves++;
        if(first.textContent===card.textContent){
          first.classList.add('done');card.classList.add('done');first=null;pairs++;
          if(mode==='two')points[turn-1]++;
        }else{
          lock=true;const previous=first;first=null;
          if(mode==='two')turn=turn===1?2:1;
          timer=setTimeout(()=>{previous.classList.remove('open');card.classList.remove('open');previous.textContent='?';card.textContent='?';lock=false;update();},750);
        }
        update();
        if(pairs===level.pairs){
          const seconds=Math.floor((Date.now()-startTime)/1000);
          if(mode==='solo'){
            const key='memory-'+index,old=record(key,null);
            if(!old||moves<old.moves)saveRecord(key,{moves,time:seconds});
            const best=record(key,{moves,time:seconds});
            score.textContent=`Bravo ! ${moves} coups en ${seconds}s. Record : ${best.moves} coups !`;
          }else{
            score.textContent=points[0]===points[1]?`Égalité ! ${points[0]} paire(s) chacun.`:`Joueur ${points[0]>points[1]?1:2} gagne avec ${Math.max(...points)} paires !`;
          }
        }
      });
      grid.append(card);
    });
    update();
    actions.append(button('Recommencer',()=>start(currentLevel)));
  }
  start(0);
  cleanup=()=>clearTimeout(timer);
}
function memory() {
  shell(`
    <h3>Memory</h3>
    <p>Retrouve les paires. Les grilles sont carrées à chaque niveau !</p>
    <div id="levels"></div>
    <div id="memoryModes"></div>
    <div class="score" id="memoryScore"></div>
    <div class="memory-grid" id="memoryGrid"></div>
    <div id="memoryActions"></div>
  `);
  const images=['🍉','🚀','🎧','⭐','🍀','🐙','🎲','🌈','🍓','🦊','⚽','🎮','🍩','🐸','🎯','🧩','🍕','🐼','🌻','🎸','🚲','🦋','🍪','🐳','⚡','🏀','🍒','🛸','🐢','🎨','🍇','🦄','🥑','🐝','🎁','🌙','🍍','🦖','🎤','🏆','🧸','🍋','🐬','🎹','🌵','🧁','🦉','🚀','💎','🍭'];
  const levels=[
    {name:'Facile',pairs:8,side:4},
    {name:'Normal',pairs:18,side:6},
    {name:'Difficile',pairs:32,side:8},
    {name:'Expert',pairs:50,side:10}
  ];
  let timer=null, mode='solo', currentLevel=0;
  const levelsEl=document.getElementById('levels');
  const modesEl=document.getElementById('memoryModes');
  const grid=document.getElementById('memoryGrid');
  const score=document.getElementById('memoryScore');
  const actions=document.getElementById('memoryActions');
  levels.forEach((level,index)=>levelsEl.append(button(`${level.name} · ${level.pairs} paires`,()=>start(index))));
  modesEl.append(button('Solo',()=>{mode='solo';start(currentLevel);}),button('Deux joueurs',()=>{mode='two';start(currentLevel);}));
  function start(index){
    clearTimeout(timer);currentLevel=index;
    const level=levels[index];
    const cards=[...images.slice(0,level.pairs),...images.slice(0,level.pairs)];
    for(let i=cards.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[cards[i],cards[j]]=[cards[j],cards[i]];}
    let first=null,lock=false,moves=0,pairs=0,turn=1;
    const points=[0,0],startTime=Date.now();
    grid.innerHTML='';grid.style.gridTemplateColumns=`repeat(${level.side}, minmax(0, 1fr))`;
    grid.style.width=`min(100%, ${level.side*54}px)`;
    grid.style.maxWidth='100%';
    grid.style.setProperty('--memory-side',level.side);
    actions.innerHTML='';
    function update(){score.textContent=mode==='two'?`Joueur ${turn} · Paires : ${points[0]} – ${points[1]} · Trouvées : ${pairs}/${level.pairs}`:`Coups : ${moves} · Paires : ${pairs}/${level.pairs}`;}
    cards.forEach(emoji=>{
      const card=document.createElement('button');card.className='memory-tile';card.textContent='?';
      card.addEventListener('click',()=>{
        if(lock||card.classList.contains('open')||card.classList.contains('done'))return;
        card.classList.add('open');card.textContent=emoji;
        if(!first){first=card;return;}
        moves++;
        if(first.textContent===card.textContent){
          first.classList.add('done');card.classList.add('done');first=null;pairs++;
          if(mode==='two')points[turn-1]++;
        }else{
          lock=true;const previous=first;first=null;
          if(mode==='two')turn=turn===1?2:1;
          timer=setTimeout(()=>{previous.classList.remove('open');card.classList.remove('open');previous.textContent='?';card.textContent='?';lock=false;update();},750);
        }
        update();
        if(pairs===level.pairs){
          const seconds=Math.floor((Date.now()-startTime)/1000);
          if(mode==='solo'){
            const key='memory-'+index,old=record(key,null);
            if(!old||moves<old.moves)saveRecord(key,{moves,time:seconds});
            const best=record(key,{moves,time:seconds});
            score.textContent=`Bravo ! ${moves} coups en ${seconds}s. Record : ${best.moves} coups !`;
          }else{
            score.textContent=points[0]===points[1]?`Égalité ! ${points[0]} paire(s) chacun.`:`Joueur ${points[0]>points[1]?1:2} gagne avec ${Math.max(...points)} paires !`;
          }
        }
      });
      grid.append(card);
    });
    update();actions.append(button('Recommencer',()=>start(index)));
  }
  start(0);
  cleanup=()=>clearTimeout(timer);
}
// ==========================================
// 6. 2048
// ==========================================

function game2048() {
  shell(`
    <h3>2048</h3><p>Utilise les flèches pour déplacer les cases.</p>
    <div id="modes2048"></div><div class="score" id="score2048"></div>
    <div class="board2048" id="board2048"></div><div id="actions2048"></div>
  `);
  let board=Array(16).fill(0),score=0,best=record('2048',0),over=false,mode='solo',player=1,playerScores=[0,0];
  const el=document.getElementById('board2048'),status=document.getElementById('score2048');
  const addTile=()=>{const empty=board.map((v,i)=>v===0?i:null).filter(v=>v!==null);if(empty.length)board[empty[Math.floor(Math.random()*empty.length)]]=Math.random()<.9?2:4;};
  function render(){el.innerHTML='';board.forEach(v=>{const tile=document.createElement('div');tile.className='tile2048'+(v?' v'+v:'');tile.textContent=v||'';el.append(tile);});status.textContent=mode==='two'?`Joueur ${player} · Scores : ${playerScores[0]} – ${playerScores[1]} · Score total : ${score}`:`Score : ${score} | Record : ${best}`+(over?' | Partie terminée':'');}
  function canMove(){for(let i=0;i<16;i++){if(!board[i])return true;if(i%4<3&&board[i]===board[i+1])return true;if(i<12&&board[i]===board[i+4])return true;}return false;}
  function move(direction){if(over)return;const old=board.join(','),before=score;
    for(let line=0;line<4;line++){const ids=Array.from({length:4},(_,i)=>direction==='left'?line*4+i:direction==='right'?line*4+3-i:direction==='up'?i*4+line:(3-i)*4+line);const values=ids.map(i=>board[i]).filter(Boolean),result=[];for(let i=0;i<values.length;i++){if(values[i]===values[i+1]){result.push(values[i]*2);score+=values[i]*2;i++;}else result.push(values[i]);}while(result.length<4)result.push(0);ids.forEach((id,i)=>board[id]=result[i]);}
    if(old!==board.join(',')){const gained=score-before;addTile();if(mode==='two')playerScores[player-1]+=gained;if(score>best){best=score;saveRecord('2048',best);}if(!board.includes(0)&&!canMove()){over=true;if(mode==='two')status.textContent=playerScores[0]===playerScores[1]?'Égalité !':`Joueur ${playerScores[0]>playerScores[1]?1:2} gagne !`; }else if(mode==='two')player=player===1?2:1;render();}
  }
  function reset(){board=Array(16).fill(0);score=0;over=false;player=1;playerScores=[0,0];addTile();addTile();render();}
  document.getElementById('modes2048').append(button('Solo',()=>{mode='solo';reset();}),button('Deux joueurs (à tour de rôle)',()=>{mode='two';reset();}));
  const keyHandler=e=>{const keys={ArrowLeft:'left',ArrowRight:'right',ArrowUp:'up',ArrowDown:'down',q:'left',d:'right',z:'up',s:'down'};const dir=keys[e.key]||keys[e.key.toLowerCase()];if(dir){e.preventDefault();move(dir);}};
  document.addEventListener('keydown',keyHandler);reset();document.getElementById('actions2048').append(button('Nouvelle partie',reset));cleanup=()=>document.removeEventListener('keydown',keyHandler);
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
    <div id="breakoutModes"></div>
    <p class="help">Solo : flèches. Coop à deux : joueur 1 = Q/D, joueur 2 = ←/→. Les deux contrôlent la raquette.</p>
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
  let coopMode=false;
  function keyDown(e) {
    if(['ArrowLeft','ArrowRight','q','d','Q','D'].includes(e.key))e.preventDefault();
    if(e.key==='ArrowLeft'||(coopMode&&e.key.toLowerCase()==='q'))leftPressed=true;
    if(e.key==='ArrowRight'||(coopMode&&e.key.toLowerCase()==='d'))rightPressed=true;
    if(e.code==='Space'){e.preventDefault();launch();}
  }
  function keyUp(e){if(e.key==='ArrowLeft'||(coopMode&&e.key.toLowerCase()==='q'))leftPressed=false;if(e.key==='ArrowRight'||(coopMode&&e.key.toLowerCase()==='d'))rightPressed=false;}
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
  document.getElementById('breakoutModes').append(button('Solo',()=>{coopMode=false;message.textContent='Mode solo activé.';}),button('Deux joueurs coop',()=>{coopMode=true;message.textContent='Coop activée : Q/D et flèches contrôlent la même raquette.';}));
  createBricks();updateScore();draw();
  cleanup=()=>{
    running=false;cancelAnimationFrame(animation);
    document.removeEventListener('keydown',keyDown);document.removeEventListener('keyup',keyUp);
    canvas.removeEventListener('mousemove',mouseMove);release();
  };
}

// ==========================================
// 8. PONG - NOUVEAU JEU 2 JOUEURS
// ==========================================

function pong() {
  shell(`
    <h3>🏓 Pong</h3>
    <p>Deux joueurs, deux raquettes : marque 5 points pour gagner !</p>
    <div class="score" id="pongScore">Joueur 1 : 0 · Joueur 2 : 0</div>
    <canvas id="pongCanvas" width="640" height="400"></canvas>
    <div id="pongActions"></div>
    <p class="help">Joueur 1 : Z / S · Joueur 2 : ↑ / ↓</p>
  `);
  const canvas=document.getElementById('pongCanvas'),ctx=canvas.getContext('2d');
  const scoreEl=document.getElementById('pongScore'),actions=document.getElementById('pongActions');
  const W=canvas.width,H=canvas.height,paddles=[{x:22,y:160,w:12,h:80,up:'z',down:'s',score:0},{x:W-34,y:160,w:12,h:80,up:'ArrowUp',down:'ArrowDown',score:0}];
  let ball={x:W/2,y:H/2,r:9,dx:4,dy:2},keys={},running=true,raf=0,finished=false;
  function resetBall(direction){ball={x:W/2,y:H/2,r:9,dx:4*direction,dy:(Math.random()-.5)*5};}
  function draw(){ctx.fillStyle='#10172a';ctx.fillRect(0,0,W,H);ctx.strokeStyle='#ffffff55';ctx.setLineDash([9,12]);ctx.beginPath();ctx.moveTo(W/2,0);ctx.lineTo(W/2,H);ctx.stroke();ctx.setLineDash([]);ctx.fillStyle='#65e3d2';paddles.forEach(p=>ctx.fillRect(p.x,p.y,p.w,p.h));ctx.beginPath();ctx.arc(ball.x,ball.y,ball.r,0,Math.PI*2);ctx.fill();scoreEl.textContent=`Joueur 1 : ${paddles[0].score} · Joueur 2 : ${paddles[1].score}`;}
  function step(){if(!running)return;paddles.forEach(p=>{if(keys[p.up])p.y-=6;if(keys[p.down])p.y+=6;p.y=Math.max(0,Math.min(H-p.h,p.y));});ball.x+=ball.dx;ball.y+=ball.dy;if(ball.y-ball.r<0||ball.y+ball.r>H)ball.dy*=-1;paddles.forEach((p,i)=>{const toward=i===0?ball.dx<0:ball.dx>0;const plane=i===0?p.x+p.w:p.x;if(toward&&ball.x-ball.r<=plane+p.w&&ball.x+ball.r>=plane&&ball.y>=p.y&&ball.y<=p.y+p.h){ball.dx=(i===0?1:-1)*Math.abs(ball.dx)*1.04;ball.dy+=((ball.y-(p.y+p.h/2))/(p.h/2))*2;}});if(ball.x<-ball.r){paddles[1].score++;resetBall(-1);}if(ball.x>W+ball.r){paddles[0].score++;resetBall(1);}if(paddles.some(p=>p.score>=5)){running=false;finished=true;actions.innerHTML='';actions.append(button(`Joueur ${paddles[0].score>=5?1:2} gagne ! Rejouer`,restart));}draw();if(running)raf=requestAnimationFrame(step);}
  function restart(){paddles.forEach(p=>{p.score=0;p.y=(H-p.h)/2;});keys={};finished=false;running=true;resetBall(Math.random()<.5?-1:1);draw();cancelAnimationFrame(raf);raf=requestAnimationFrame(step);}
  const down=e=>{if(['ArrowUp','ArrowDown','z','s','Z','S'].includes(e.key)){e.preventDefault();keys[e.key.length===1?e.key.toLowerCase():e.key]=true;}};
  const up=e=>{keys[e.key.length===1?e.key.toLowerCase():e.key]=false;};
  document.addEventListener('keydown',down);document.addEventListener('keyup',up);
  actions.append(button('Recommencer',restart));draw();raf=requestAnimationFrame(step);
  cleanup=()=>{running=false;cancelAnimationFrame(raf);document.removeEventListener('keydown',down);document.removeEventListener('keyup',up);};
}
