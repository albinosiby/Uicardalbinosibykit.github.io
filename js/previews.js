import { bindInteraction } from './interactions.js';

const interactive = new Set(['fan','vparallax','tilt','magnetic','zoom','slide','split','rotate','morph','elastic','perspective','flipreveal','glow']);
const single = new Set(['tilt','zoom','rotate','morph','elastic','perspective','flipreveal']);
const continuous = new Set(['infinite','wave']);
const mod = (n, count) => ((n % count) + count) % count;

export function createPreview(host, entry) {
  const type = entry.id;
  const media = matchMedia('(prefers-reduced-motion: reduce)');
  let reduced = media.matches, visible = false, paused = false, suspended = false;
  let active = 0, open = false, hovering = false, x = 0, y = 0;
  let time = 0, last = 0, frame = 0, revealed = false, disposed = false;
  let lastCycle = 0, springPosition = 0, springVelocity = 0;
  const large = host.classList.contains('modal-preview');
  const count = single.has(type) ? 1 : type === 'cube' ? 4 : type === 'infinite' ? 15 : 5;
  host.tabIndex = 0;
  host.setAttribute('role', 'group');
  host.setAttribute('aria-label', `${entry.name}. ${entry.interaction}. Use arrow keys to navigate; Enter to interact.`);
  const stage = document.createElement('div');
  stage.className = 'preview-stage';
  stage.setAttribute('aria-hidden', 'true');
  host.replaceChildren(stage);
  const cards = Array.from({ length: count }, (_, i) => {
    const card = document.createElement('div');
    card.className = 'motion-card';
    card.dataset.index = i;
    card.textContent = String(i + 1).padStart(2, '0');
    stage.append(card);
    return card;
  });
  if (type === 'flipreveal') {
    cards[0].classList.add('two-sided');
    cards[0].innerHTML = '<span class="face">Explore</span><span class="face back">Discovered!</span>';
  }
  if (type === 'perspective') {
    cards[0].style.transformStyle = 'preserve-3d';
    cards[0].innerHTML = '<span class="raised">01</span>';
  }
  if (type === 'slide' || type === 'split') {
    cards.forEach((card, i) => { card.hidden = i > (type === 'split' ? 2 : 1); });
    cards[0].classList.add('reveal-base');
    cards[0].textContent = 'Discover';
    if (type === 'split') {
      cards.slice(1, 3).forEach((card, i) => {
        card.textContent = '01';
        card.classList.add('split-half');
        card.style.clipPath = i === 0 ? 'inset(0 50% 0 0)' : 'inset(0 0 0 50%)';
      });
    }
  }
  if (type === 'glow') cards.forEach(card => {
    const halo = document.createElement('span');
    halo.className = 'glow-halo'; card.append(halo);
  });
  let progress, counter, dots;
  if (type === 'progress') {
    const bar = document.createElement('div');
    bar.className = 'preview-progress';
    progress = document.createElement('progress'); progress.max = count;
    progress.setAttribute('aria-label', 'Slide progress');
    counter = document.createElement('span');
    bar.append(progress, counter);
    dots = cards.map((_, i) => {
      const dot = document.createElement('button');
      dot.setAttribute('aria-label', `Show slide ${i + 1}`);
      dot.addEventListener('click', () => select(i));
      bar.append(dot); return dot;
    });
    host.append(bar);
  }
  let width = host.clientWidth;
  const resize = new ResizeObserver(entries => { width = entries[0].contentRect.width; render(); });
  resize.observe(host);
  function render() {
    const span = Math.max(1, Math.min(width * .21, large ? 140 : 98));
    const engaged = open || hovering;
    const scroll = type === 'sparallax' && !reduced ? Math.max(-1, Math.min(1, (innerHeight / 2 - host.getBoundingClientRect().top) / innerHeight)) : 0;
    cards.forEach((card, i) => {
      const d = mod(i - active + 2, count) - 2;
      const depth = mod(i - active, count);
      let tx = 0, ty = 0, tz = 0, rx = 0, ry = 0, rz = 0, scale = 1, opacity = 1;
      let blur = 0;
      card.style.transitionTimingFunction = type === 'elastic' ? 'cubic-bezier(.34,1.56,.64,1)' : '';
      card.style.transitionDuration = continuous.has(type) || type === 'sparallax' ? '0s' : '';
      switch (type) {
        case 'coverflow': tx=d*span*.8; tz=-Math.abs(d)*100; ry=-d*10; scale=1-Math.abs(d)*.12; opacity=1-Math.abs(d)*.18; break;
        case 'stack': tx=depth===4?-span:depth*5; ty=-depth*10; scale=1-depth*.065; opacity=depth===4?0:1-depth*.12; rz=depth===4?-18:0; break;
        case 'fan': rz=(i-2)*(engaged?24:7); ty=engaged?-10:15; card.style.transformOrigin='50% 100%'; break;
        case 'vparallax': tx=(i-2)*span*.55; ty=(i%2?22:-22)+y*(i+1)*12; tz=-i*35; scale=1-i*.05; break;
        case 'flip': ry=d*90; tz=-Math.abs(d)*90; opacity=d===0?1:0; card.style.backfaceVisibility='hidden'; break;
        case 'infinite': tx=mod(i*span-time*.035-active*span+span*count/2,span*count)-span*count/2; scale=.8; break;
        case 'tilt': rx=-y*8; ry=x*10; scale=engaged?1.03:1; break;
        case 'expand': tx=d*span; scale=d===0?1.15:.75; opacity=d===0?1:.65; break;
        case 'scroll': tx=(i-2)*span*.58; ty=revealed?0:50; scale=revealed?.72:.68; opacity=revealed?1:0; card.style.transitionDelay=revealed?`${i*100}ms`:'0ms'; break;
        case 'wave': tx=(i-2)*span*.64; ty=reduced?0:Math.sin(time*.002-i*.8)*18; rz=reduced?0:Math.sin(time*.002-i*.8)*3; scale=.72; break;
        case 'cube': ry=i*90-active*90; tz=large?66:44; card.style.backfaceVisibility='hidden'; card.style.transform=`rotateY(${ry}deg) translateZ(${tz}px)`; return;
        case 'depth': tx=depth*17; ty=-depth*12; tz=-depth*100; scale=1-depth*.06; opacity=1-depth*.13; break;
        case 'magnetic': { const base=(i-2)*span*.65; const distance=Math.hypot(x*width/2-base,y*100); const strength=engaged?Math.max(0,1-distance/180):0; tx=base+(x*width/2-base)*strength*.12; ty=y*12*strength; scale=.7+strength*.12; break; }
        case 'progress': tx=d*span*1.6; opacity=d===0?1:0; break;
        case 'curved': tx=Math.sin(d*.55)*span*1.7; ty=d*d*8; tz=-Math.abs(d)*85; ry=-d*18; scale=1-Math.abs(d)*.1; break;
        case 'zoom': scale=engaged?1.06:1; ty=engaged?-8:0; break;
        case 'slide': tx=i===1&&engaged?68:0; ty=i===1&&engaged?-8:0; break;
        case 'blur': tx=d*span*.85; scale=d===0?1:.8; blur=Math.abs(d)*1.1; opacity=d===0?1:.55; break;
        case 'split': tx=i===0?0:(i===1?-1:1)*(engaged?40:0); rz=i===0?0:(i===1?-1:1)*(engaged?12:0); break;
        case 'flipstack': tx=depth===4?span:depth*5; ty=-depth*8; ry=depth===4?130:0; scale=1-depth*.07; opacity=depth===4?0:1-depth*.1; break;
        case 'rotate': rz=engaged?(x<0?-5:5):0; scale=engaged?1.04:1; ty=engaged?-6:0; break;
        case 'morph': scale=engaged?1.2:1; card.style.borderRadius=engaged?'24px':'12px'; card.style.transform=`scale(${engaged?1.8:1},${engaged?.8:1})`; return;
        case 'elastic': ty=-springPosition*22; scale=1+springPosition*.08; card.style.transitionDuration='0s'; break;
        case 'perspective': rx=-y*18; ry=x*24; tz=engaged?35:0; stage.style.perspectiveOrigin=`${50+x*15}% ${50+y*15}%`; break;
        case 'fadeslide': tx=d*30; opacity=d===0?1:0; break;
        case 'shuffle': tx=depth===4?span:depth*3; ty=depth*3; rz=depth===4?24:(depth-2)*4; scale=1-depth*.035; opacity=depth===4?0:1; break;
        case 'sparallax': tx=(i-2)*span*.62; ty=(i%2?15:-15)+scroll*(i+1)*23; tz=-i*22; scale=.82-i*.03; break;
        case 'flipreveal': ry=open?180:0; break;
        case 'glow': tx=(i-2)*span*.67; scale=i===mod(active,count)?.9:.7; opacity=i===mod(active,count)?1:.65; card.querySelector('.glow-halo').style.opacity=i===mod(active,count)?'1':'0'; break;
        case 'circle': { const a=(i-active)*Math.PI*2/count; tx=Math.sin(a)*span*1.25; tz=Math.cos(a)*90-90; ty=-Math.cos(a)*8; scale=.78+Math.cos(a)*.18; opacity=.7+Math.cos(a)*.3; break; }
      }
      card.style.transform=`translate3d(${tx}px,${ty}px,${tz}px) rotateX(${rx}deg) rotateY(${ry}deg) rotate(${rz}deg) scale(${scale})`;
      card.style.opacity=opacity;
      card.style.filter=blur?`blur(${blur}px)`:'none';
      card.style.zIndex=String(type==='slide'||type==='split'?i+1:type==='circle'?Math.round(tz+200):type==='stack'||type==='depth'||type==='flipstack'||type==='shuffle'?count-depth:count-Math.abs(d));
    });
    if (progress) {
      progress.value=mod(active,count)+1;
      counter.textContent=`${mod(active,count)+1} / ${count}`;
      dots.forEach((dot,i)=>dot.setAttribute('aria-current',String(i===mod(active,count))));
    }
  }
  function select(index) { active=index; open=!open; lastCycle=time; render(); }
  function step(direction) { active+=direction; open=!open; lastCycle=time; keyboardPose(); render(); sync(); }
  function keyboardPose() {
    if (['tilt','perspective','magnetic','vparallax'].includes(type)) { x=open?.5:0; y=open?-.5:0; }
    if (type==='elastic' && reduced) springPosition=open?1:0;
  }
  function tick(now) {
    if (disposed) return;
    const delta=last?Math.min(now-last,32):0; last=now;
    if (!hovering) time+=delta;
    if(type==='elastic') {
      const target=open||hovering?1:0;
      const dt=delta/1000;
      springVelocity+=((260*(target-springPosition)-18*springVelocity)/.8)*dt;
      springPosition+=springVelocity*dt; render();
      if(Math.abs(target-springPosition)<.001 && Math.abs(springVelocity)<.001) { springPosition=target; render(); frame=0; return; }
    }
    if (!hovering && !interactive.has(type) && !continuous.has(type) && !['scroll','sparallax'].includes(type) && time-lastCycle>2400) {
      active++; lastCycle=time; render();
    }
    if (continuous.has(type) && !hovering) render();
    if (type==='sparallax') render();
    frame=requestAnimationFrame(tick);
  }
  function sync() {
    cancelAnimationFrame(frame); frame=0; last=0;
    const run=visible&&!paused&&!suspended&&!document.hidden&&!reduced;
    host.dataset.paused=String(!run);
    if (run && (!interactive.has(type) || type==='elastic')) frame=requestAnimationFrame(tick);
  }
  const observer=new IntersectionObserver(entries=>{
    visible=entries[0].isIntersecting;
    if (type==='scroll') { revealed=visible||reduced; render(); }
    sync();
  },{threshold:.1});
  observer.observe(host);
  const unbind=bindInteraction(host, {
    move(px,py) { hovering=true; x=reduced?0:px; y=reduced?0:py; if(interactive.has(type)) render(); if(type==='elastic') sync(); },
    leave() { hovering=false; x=0; y=0; if(interactive.has(type)) render(); if(type==='elastic') sync(); },
    step,
    toggle() { open=!open; if(!interactive.has(type)) active++; keyboardPose(); render(); sync(); },
    select: ['coverflow','expand','blur','glow','circle','curved','progress'].includes(type)?select:null
  });
  const visibility=()=>sync();
  const preference=()=>{ reduced=media.matches; revealed=true; x=0; y=0; render(); sync(); };
  document.addEventListener('visibilitychange',visibility);
  media.addEventListener('change',preference);
  revealed=reduced; render();
  return {
    step,
    replay() { active=0; time=0; lastCycle=0; open=!open; revealed=true; keyboardPose(); render(); sync(); },
    setPaused(value) { paused=value; sync(); },
    setSuspended(value) { suspended=value; sync(); },
    destroy() { disposed=true; cancelAnimationFrame(frame); observer.disconnect(); resize.disconnect(); unbind(); document.removeEventListener('visibilitychange',visibility); media.removeEventListener('change',preference); host.replaceChildren(); }
  };
}
