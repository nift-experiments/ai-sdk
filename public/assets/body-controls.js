// Delegated controls for static authored-body markup; React islands own theirs.
(()=>{
 const copiedPath='m15.56 4-.53.53-8.8 8.8c-.68.68-1.78.68-2.47 0l.53-.54-.53.53-2.79-2.79L.44 10 1.5 8.94l.53.53 2.8 2.8c.1.09.25.09.35 0l8.79-8.8.53-.53z';
 const feedback=new WeakMap();
 function copy(button,value,label){
  if(!navigator.clipboard?.writeText)return;
  navigator.clipboard.writeText(value).then(()=>{
   const prior=feedback.get(button);if(prior)clearTimeout(prior.timeout);
   const original=prior?.original??button.innerHTML;
   button.setAttribute('aria-label','Copied');
   button.innerHTML='<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path fill-rule="evenodd" clip-rule="evenodd" d="'+copiedPath+'"></path></svg>';
   const timeout=setTimeout(()=>{button.innerHTML=original;button.setAttribute('aria-label',label);feedback.delete(button);},1500);
   feedback.set(button,{original,timeout});
  }).catch(()=>{});
 }
 document.addEventListener('click',e=>{
  const tab=e.target.closest('[role=tab]');
  if(tab&&!tab.closest('[data-ai-island]')){
   for(const t of tab.closest('[role=tablist]').querySelectorAll('[role=tab]')){
    const active=t===tab;t.setAttribute('aria-selected',String(active));t.tabIndex=active?0:-1;
    for(const c of ['font-medium','text-gray-1000','shadow-[inset_0_-2px_0_0_var(--ds-gray-1000)]'])t.classList.toggle(c,active);
    for(const c of ['text-gray-900','hover:text-gray-1000'])t.classList.toggle(c,!active);
    const panel=document.getElementById(t.getAttribute('aria-controls'));if(panel){panel.hidden=!active;panel.tabIndex=active?0:-1;}
   }
  }
  const button=e.target.closest('button[aria-label="Copy command"],button[aria-label="Copy to clipboard"]');
  if(!button||button.closest('[data-ai-island]'))return;
  const label=button.getAttribute('aria-label');
  if(label==='Copy command'){
   const pre=button.parentElement.querySelector('pre');if(!pre)return;
   const lines=[...pre.children].map(line=>[...line.childNodes].filter(node=>!(node.nodeType===1&&node.classList.contains('select-none'))).map(node=>node.textContent).join(''));
   copy(button,lines.join('\n'),label);
  }else{
   const box=button.closest('figure')||button.parentElement,code=box.querySelector('code');if(code)copy(button,code.textContent,label);
  }
 });
 document.addEventListener('keydown',e=>{
  const t=e.target.closest('[role=tab]');if(!t||t.closest('[data-ai-island]'))return;
  const tabs=[...t.closest('[role=tablist]').querySelectorAll('[role=tab]')],i=tabs.indexOf(t);
  const n=e.key==='ArrowRight'?(i+1)%tabs.length:e.key==='ArrowLeft'?(i+tabs.length-1)%tabs.length:e.key==='Home'?0:e.key==='End'?tabs.length-1:null;
  if(n!==null){e.preventDefault();tabs[n].click();tabs[n].focus();}
 });
})();

// Static landing cards retain independent clipboard controls without React mounts.
document.addEventListener('click',async(event)=>{const button=event.target.closest?.('[data-ai-copy]');if(!button)return;event.preventDefault();try{await navigator.clipboard.writeText(button.dataset.aiCopy);}catch{return;}const icon=button.querySelector('svg'),oldIcon=icon?.innerHTML;if(icon)icon.innerHTML='<path fill="currentColor" fill-rule="evenodd" d="M14.06 3.44a.75.75 0 0 1 0 1.06l-7.5 7.5a.75.75 0 0 1-1.06 0l-3.5-3.5a.75.75 0 0 1 1.06-1.06L6.03 10.41l6.97-6.97a.75.75 0 0 1 1.06 0Z"/>';const label=button.getAttribute('aria-label');button.setAttribute('aria-label','Copied');setTimeout(()=>{button.setAttribute('aria-label',label);if(icon)icon.innerHTML=oldIcon;},2000);});
