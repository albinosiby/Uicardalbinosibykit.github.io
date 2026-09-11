import { animations } from './data.js';
import { prompts } from './prompts.js';
import { createPreview } from './previews.js';
import { createModal } from './modal.js';
import { copyText } from './interactions.js';

const previews=new Map();
const entries=new Map(animations.map(entry=>[entry.id,entry]));
const gallery=document.querySelector('#animations');
const cards=[...gallery.querySelectorAll('.card-item')];
const search=document.querySelector('.search');
const filters=[...document.querySelectorAll('.filter-btn')];
let category='All', paused=false;
const modal=createModal(open=>previews.forEach(preview=>preview.setSuspended(open)));
for(const card of cards) {
  const entry=entries.get(card.dataset.id);
  previews.set(entry.id,createPreview(card.querySelector('.card-preview'),entry));
  card.querySelectorAll('button').forEach(button=>{button.disabled=false;});
}
function filter() {
  const query=search.value.trim().toLocaleLowerCase();
  let count=0;
  for(const card of cards) {
    const entry=entries.get(card.dataset.id);
    const text=[entry.name,entry.description,...entry.category].join(' ').toLocaleLowerCase();
    const matches=(category==='All'||entry.category.includes(category))&&text.includes(query);
    card.hidden=!matches;
    previews.get(entry.id).setSuspended(!matches);
    if(matches) count++;
  }
  document.querySelector('#result-count').textContent=`${count} animation${count===1?'':'s'}`;
  document.querySelector('#empty-state').hidden=count!==0;
}
search.disabled=false;
search.addEventListener('input',filter);
filters.forEach(button=>{
  button.disabled=false;
  button.addEventListener('click',()=>{
    category=button.dataset.category;
    filters.forEach(item=>{const selected=item===button; item.classList.toggle('active',selected); item.setAttribute('aria-pressed',String(selected));});
    filter();
  });
});
gallery.addEventListener('click',async event=>{
  const button=event.target.closest('[data-action]');
  if(!button) return;
  const entry=entries.get(button.closest('.card-item').dataset.id);
  if(button.dataset.action==='demo') modal.open(entry);
  if(button.dataset.action==='copy' && !await copyText(prompts[entry.id])) modal.open(entry,true);
});
const pauseButton=document.querySelector('#pause-all');
pauseButton.disabled=false;
pauseButton.addEventListener('click',()=>{
  paused=!paused;
  previews.forEach(preview=>preview.setPaused(paused));
  pauseButton.textContent=paused?'Play animations':'Pause animations';
  pauseButton.setAttribute('aria-pressed',String(paused));
});
document.querySelector('#load-status').hidden=true;
