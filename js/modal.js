import { createPreview } from './previews.js';
import { prompts } from './prompts.js';
import { copyText, notify } from './interactions.js';

export function createModal(onOpenChange) {
  const dialog=document.querySelector('#demo-dialog');
  const previewHost=document.querySelector('#demo-preview');
  const prompt=document.querySelector('#demo-prompt');
  let preview=null, entry=null, returnFocus=null;
  let pause=false, previousOverflow='';
  const controls=document.querySelector('#demo-controls');
  const buttons=[['Previous',()=>preview?.step(-1)],['Pause',()=>{
    pause=!pause; preview?.setPaused(pause);
    pauseButton.textContent=pause?'Play':'Pause';
    pauseButton.setAttribute('aria-pressed',String(pause));
  }],['Next',()=>preview?.step(1)],['Replay / interact',()=>preview?.replay()]];
  const rendered=buttons.map(([label,action])=>{
    const button=document.createElement('button'); button.className='btn'; button.textContent=label;
    button.addEventListener('click',action); controls.append(button); return button;
  });
  const pauseButton=rendered[1];
  function open(next, manualCopy=false) {
    entry=next;
    if(!dialog.open) { returnFocus=document.activeElement; previousOverflow=document.body.style.overflow; }
    preview?.destroy();
    document.querySelector('#demo-title').textContent=entry.name;
    document.querySelector('#demo-description').textContent=entry.description;
    document.querySelector('#demo-breakdown').textContent=prompts[entry.id].split('Motion behavior and states:\n')[1].split('\n\nImplementation:')[0].replace(/\n+/g,' ');
    document.querySelector('#demo-uses').replaceChildren(...entry.bestFor.map(use=>{
      const li=document.createElement('li'); li.textContent=use; return li;
    }));
    document.querySelector('#demo-hint').textContent=`${entry.interaction}. Focus the preview and use ← / → or Enter. Pause stops autoplay.`;
    prompt.textContent=prompts[entry.id];
    if(!dialog.open) dialog.showModal();
    document.body.style.overflow='hidden';
    onOpenChange(true);
    preview=createPreview(previewHost,entry);
    pause=false; pauseButton.textContent='Pause'; pauseButton.setAttribute('aria-pressed','false');
    if(manualCopy) selectPrompt();
  }
  function selectPrompt() {
    prompt.focus();
    const range=document.createRange(); range.selectNodeContents(prompt);
    const selection=window.getSelection(); selection.removeAllRanges(); selection.addRange(range);
    document.querySelector('#demo-hint').textContent='Clipboard access is unavailable. The prompt is selected: press Ctrl+C or ⌘C to copy, or use your device’s Copy command.';
  }
  document.querySelector('#demo-copy').addEventListener('click',async()=>{
    if(entry && !await copyText(prompts[entry.id])) { selectPrompt(); notify('Select and copy the prompt below.'); }
  });
  dialog.querySelector('.modal-close').addEventListener('click',()=>dialog.close());
  dialog.addEventListener('click',event=>{
    const bounds=dialog.getBoundingClientRect();
    if(event.target===dialog && (event.clientX<bounds.left||event.clientX>bounds.right||event.clientY<bounds.top||event.clientY>bounds.bottom)) dialog.close();
  });
  dialog.addEventListener('close',()=>{
    preview?.destroy(); preview=null;
    document.body.style.overflow=previousOverflow;
    onOpenChange(false);
    returnFocus?.focus();
  });
  return { open };
}
