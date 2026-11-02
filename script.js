const panel=document.getElementById('gamePanel'), area=document.getElementById('playArea'), heading=document.getElementById('gameHeading');
const titles={snake:'Snake',memory:'Memory',tictactoe:'Morpion',reaction:'Test de réflexes','2048':'2048'};
document.querySelectorAll('[data-game]').forEach(b=>b.addEventListener('click',()=>openGame(b.dataset.game)));
document.getElementById('backButton').addEventListener('click',()=>{area.classList.add('hidden');document.getElementById('games').scrollIntoView({behavior:'smooth'});});
function openGame(name){heading.textContent=titles[name];area.classList.remove('hidden');({snake,memory,tictactoe,reaction,2048:game2048})[name]();area.scrollIntoView({behavior:'smooth',block:'start'});}
function shell(html){panel.innerHTML=`<div class="game-content">${html}</div>`;}
function btn(label,fn,secondary=false){const b=document.createElement('button');b.className='action'+(secondary?' secondary':'');b.textContent=label;b.onclick=fn;return b;}

// SNAKE
function snake(){
 shell('<h3>Snake</h3><p>Utilise les flèches du clavier ou les boutons.</p><div class="score" id="snakeScore">Score : 0</div><canvas class="snake-canvas" id="snakeCanvas" width="360" height="360"></canvas><div id="snakeControls"></div><p class="help">Espace pour mettre en pause · Évite les murs et ta queue.</p>');
 const c=document.getElementById('snakeCanvas'),ctx=c.getContext('2d'),n=18,cell=20;let body=[{x:8,y:9},{x:7,y:9},{x:6,y:9}],dir={x:1,y:0},food={x:13,y:9},score=0,timer=null,paused=false,dead=false;
 function place(){do{food={x:Math.floor(Math.random()*n),y:Math.floor(Math.random()*n)}}while(body.some(p=>p.x===food.x&&p.y===food.y));}
 function draw(){ctx.fillStyle='#0d1323';ctx.fillRect(0,0,360,360);ctx.fillStyle='#ffbd72';ctx.fillRect(food.x*cell+3,food.y*cell+3,14,14);body.forEach((p,i)=>{ctx.fillStyle=i?'#4bbdaa':'#9af0d9';ctx.fillRect(p.x*cell+2,p.y*cell+2,16,16)});}
 function step(){if(paused||dead)return;const h={x:body[0].x+dir.x,y:body[0].y+dir.y};if(h.x<0||h.y<0||h.x>=n||h.y>=n||body.some(p=>p.x===h.x&&p.y===h.y)){dead=true;clearInterval(timer);document.getElementById('snakeScore').textContent=`Terminé ! Score : ${score}`;document.getElementById('snakeControls').append(btn('Rejouer',snake));return;}body.unshift(h);if(h.x===food.x&&h.y===food.y){score++;document.getElementById('snakeScore').textContent='Score : '+score;place()}else body.pop();draw();}
 function turn(x,y){if(x!==-dir.x||y!==-dir.y)dir={x,y};}
 document.onkeydown=e=>{if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(e.key))e.preventDefault();if(e.key==='ArrowUp')turn(0,-1);if(e.key==='ArrowDown')turn(0,1);if(e.key==='ArrowLeft')turn(-1,0);if(e.key==='ArrowRight')turn(1,0);if(e.key===' ')paused=!paused;};
 const controls=document.getElementById('snakeControls');[['↑',0,-1],['←',-1,0],['↓',0,1],['→',1,0]].forEach(([t,x,y])=>{const b=btn(t,()=>turn(x,y),true);controls.append(b)});draw();timer=setInterval(step,125);
}

// MEMORY
function memory(){
 shell('<h3>Memory</h3><p>Retourne les cartes deux par deux pour trouver les symboles identiques.</p><div class="score" id="memScore">Coups : 0 · Paires : 0/8</div><div class="memory-grid" id="memoryGrid"></div>');
 const symbols=['🍉','🚀','🎧','⭐','🍀','🐙','🎲','🌈'];let deck=[...symbols,...symbols].sort(()=>Math.random()-.5),first=null,lock=false,moves=0,pairs=0;
 const grid=document.getElementById('memoryGrid'),score=document.getElementById('memScore');
 deck.forEach((s,i)=>{const b=document.createElement('button');b.className='memory-tile';b.textContent='?';b.onclick=()=>{if(lock||b.classList.contains('open')||b.classList.contains('done'))return;b.textContent=s;b.classList.add('open');if(first===null){first=b;return;}moves++;if(first.textContent===s){first.classList.replace('open','done');b.classList.replace('open','done');first=null;pairs++;}else{lock=true;const prev=first;first=null;setTimeout(()=>{prev.textContent='?';b.textContent='?';prev.classList.remove('open');b.classList.remove('open');lock=false;},700);}score.textContent=`Coups : ${moves} · Paires : ${pairs}/8`;if(pairs===8)score.textContent+=` · Bravo !`;};grid.append(b);});
 panel.querySelector('.game-content').append(btn('Nouvelle partie',memory,true));
}

// TIC TAC TOE
function tictactoe(){
 shell('<h3>Morpion</h3><p>À deux joueurs, sur le même écran.</p><div class="score" id="ticStatus">Au tour de X</div><div class="tic-grid" id="ticGrid"></div>');
 let cells=Array(9).fill(''),turn='X',over=false;const grid=document.getElementById('ticGrid'),status=document.getElementById('ticStatus');
 const wins=[[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
 cells.forEach((_,i)=>{const b=document.createElement('button');b.className='tic-cell';b.onclick=()=>{if(over||cells[i])return;cells[i]=turn;b.textContent=turn;b.style.color=turn==='X'?'#65e3d2':'#ff91bd';const win=wins.some(line=>line.every(j=>cells[j]===turn));if(win){status.textContent=`${turn} a gagné !`;over=true;}else if(cells.every(Boolean)){status.textContent='Match nul !';over=true;}else{turn=turn==='X'?'O':'X';status.textContent='Au tour de '+turn;}};grid.append(b);});
 panel.querySelector('.game-content').append(btn('Rejouer',tictactoe,true));
}

// REACTION
function reaction(){
 shell('<h3>Test de réflexes</h3><p>Attends que la zone passe au vert, puis clique le plus vite possible.</p><div class="score" id="reactionScore">Meilleur temps : —</div><div class="reaction-box" id="reactionBox">Clique pour commencer</div><p class="help">Ne clique pas avant le signal !</p>');
 const box=document.getElementById('reactionBox'),score=document.getElementById('reactionScore');let state='idle',start=0,timeout=null,best=null;
 box.onclick=()=>{if(state==='idle'||state==='result'){state='wait';box.className='reaction-box wait';box.textContent='Attends le vert…';timeout=setTimeout(()=>{state='ready';start=performance.now();box.className='reaction-box ready';box.textContent='MAINTENANT !';},1000+Math.random()*3000);}else if(state==='wait'){clearTimeout(timeout);state='result';box.className='reaction-box';box.textContent='Trop tôt ! Clique pour recommencer.';}else if(state==='ready'){const ms=Math.round(performance.now()-start);best=best===null?ms:Math.min(best,ms);state='result';box.className='reaction-box';box.textContent=`${ms} ms ! Clique pour rejouer.`;score.textContent=`Dernier temps : ${ms} ms · Meilleur : ${best} ms`;}}
}

// 2048
function game2048(){
 shell('<h3>2048</h3><p>Utilise les flèches du clavier ou glisse sur le plateau.</p><div class="score" id="score2048">Score : 0</div><div class="board2048" id="board2048"></div><p class="help">Les tuiles identiques fusionnent quand elles se rencontrent.</p>');
 let board=Array(16).fill(0),score=0,over=false;const el=document.getElementById('board2048'),scoreEl=document.getElementById('score2048');
 function add(){let empty=board.map((v,i)=>v?null:i).filter(v=>v!==null);if(empty.length)board[empty[Math.floor(Math.random()*empty.length)]]=Math.random()<.9?2:4;}
 function render(){el.innerHTML='';board.forEach(v=>{const d=document.createElement('div');d.className='tile2048'+(v?' v'+v:'');d.textContent=v||'';el.append(d)});scoreEl.textContent='Score : '+score+(over?' · Partie terminée':'');}
 function move(dir){if(over)return;let old=board.join(',');for(let line=0;line<4;line++){let ids=Array.from({length:4},(_,i)=>dir==='left'?line*4+i:dir==='right'?line*4+3-i:dir==='up'?i*4+line:(3-i)*4+line);let vals=ids.map(i=>board[i]).filter(Boolean),out=[];for(let i=0;i<vals.length;i++){if(vals[i]===vals[i+1]){out.push(vals[i]*2);score+=vals[i]*2;i++;}else out.push(vals[i]);}while(out.length<4)out.push(0);ids.forEach((id,i)=>board[id]=out[i]);}if(old!==board.join(',')){add();if(!board.includes(0)&&!canMove())over=true;render();}}
 function canMove(){for(let i=0;i<16;i++){if(!board[i])return true;if(i%4<3&&board[i]===board[i+1])return true;if(i<12&&board[i]===board[i+4])return true;}return false;}
 document.onkeydown=e=>{const m={ArrowLeft:'left',ArrowRight:'right',ArrowUp:'up',ArrowDown:'down'};if(m[e.key]){e.preventDefault();move(m[e.key]);}};
 let sx=0,sy=0;el.addEventListener('touchstart',e=>{sx=e.touches[0].clientX;sy=e.touches[0].clientY},{passive:true});el.addEventListener('touchend',e=>{let dx=e.changedTouches[0].clientX-sx,dy=e.changedTouches[0].clientY-sy;if(Math.max(Math.abs(dx),Math.abs(dy))>25)move(Math.abs(dx)>Math.abs(dy)?(dx>0?'right':'left'):(dy>0?'down':'up'));},{passive:true});
 add();add();render();panel.querySelector('.game-content').append(btn('Nouvelle partie',game2048,true));
}
