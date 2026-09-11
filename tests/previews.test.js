import test from 'node:test';
import assert from 'node:assert/strict';
import { animations } from '../js/data.js';
import { createPreview } from '../js/previews.js';

// Minimal browser boundaries allow deterministic lifecycle and motion-preference checks.
class Element extends EventTarget {
  constructor() { super(); this.style={}; this.dataset={}; this.children=[]; this.className=''; this.clientWidth=375; this.classList={contains:name=>this.className.split(' ').includes(name),add:name=>{this.className+=' '+name;}}; }
  setAttribute(name,value) { this[name]=String(value); }
  append(...elements) { this.children.push(...elements); }
  replaceChildren(...elements) { this.children=elements; }
  getBoundingClientRect() { return {top:100,left:0,width:375,height:260}; }
  querySelector(selector) { return this.children.find(child=>child.className===selector.slice(1)); }
}
function environment(reduced) {
  const document=new EventTarget(); document.hidden=false; document.createElement=()=>new Element();
  const preference=new EventTarget(); preference.matches=reduced;
  const observers=[], frames=new Map(); let nextFrame=0;
  globalThis.document=document; globalThis.innerHeight=812;
  globalThis.matchMedia=()=>preference;
  globalThis.IntersectionObserver=class {
    constructor(callback) { this.callback=callback; this.disconnected=false; observers.push(this); }
    observe() {} disconnect() { this.disconnected=true; }
  };
  globalThis.ResizeObserver=class { observe() {} disconnect() {} };
  globalThis.requestAnimationFrame=callback=>{frames.set(++nextFrame,callback); return nextFrame;};
  globalThis.cancelAnimationFrame=id=>frames.delete(id);
  return {preference,observers,frames};
}

test('all previews have finite, visible states under reduced motion and clean up',()=>{
  const env=environment(true);
  for(const entry of animations) {
    const host=new Element();
    const preview=createPreview(host,entry);
    const cards=host.children[0].children;
    assert.ok(cards.length>0,entry.id);
    assert.ok(cards.some(card=>!card.hidden && card.style.opacity!==0),entry.id);
    preview.step(1); preview.step(-1); preview.replay();
    for(const card of cards) {
      assert.ok(!/NaN|Infinity/.test(card.style.transform),entry.id);
    }
    assert.equal(env.frames.size,0,`${entry.id} must not autoplay with reduced motion`);
    preview.destroy(); assert.equal(host.children.length,0);
  }
  assert.ok(env.observers.every(observer=>observer.disconnected));
});

test('offscreen, pause, modal suspension, and motion-preference changes stop autoplay',()=>{
  const env=environment(false),host=new Element();
  const preview=createPreview(host,animations[0]);
  assert.equal(env.frames.size,0);
  env.observers[0].callback([{isIntersecting:true}]); assert.equal(env.frames.size,1);
  preview.setPaused(true); assert.equal(env.frames.size,0);
  preview.setPaused(false); assert.equal(env.frames.size,1);
  preview.setSuspended(true); assert.equal(env.frames.size,0);
  preview.setSuspended(false); assert.equal(env.frames.size,1);
  env.preference.matches=true; env.preference.dispatchEvent(new Event('change')); assert.equal(env.frames.size,0);
  preview.destroy(); assert.equal(env.frames.size,0);
});
