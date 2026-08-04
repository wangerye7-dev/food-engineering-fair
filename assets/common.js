
const KEYS={survey:'zmd_survey_submissions_v1',challenge:'zmd_challenge_results_v1',cooperation:'zmd_cooperation_leads_v1'};
function getStore(key){try{return JSON.parse(localStorage.getItem(key)||'[]')}catch(e){return []}}
function setStore(key,value){localStorage.setItem(key,JSON.stringify(value))}
function uid(prefix='ZMD'){const d=new Date();const stamp=d.getFullYear().toString()+String(d.getMonth()+1).padStart(2,'0')+String(d.getDate()).padStart(2,'0');return `${prefix}-${stamp}-${Math.random().toString(36).slice(2,8).toUpperCase()}`}
function toast(message){let node=document.querySelector('.toast');if(!node){node=document.createElement('div');node.className='toast';document.body.appendChild(node)}node.textContent=message;node.classList.add('show');setTimeout(()=>node.classList.remove('show'),2200)}
function csvEscape(value){const s=Array.isArray(value)?value.join('；'):(value??'').toString();return '"'+s.replaceAll('"','""')+'"'}
function downloadText(filename,text,type='text/plain;charset=utf-8'){const blob=new Blob(['\ufeff'+text],{type});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=filename;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}
function initNav(){const btn=document.querySelector('.menu-btn');const nav=document.querySelector('.nav');if(btn&&nav)btn.addEventListener('click',()=>nav.classList.toggle('open'));const path=location.pathname.split('/').pop()||'index.html';document.querySelectorAll('.nav a').forEach(a=>{if(a.getAttribute('href')===path)a.classList.add('active')})}
function footerYear(){document.querySelectorAll('[data-year]').forEach(n=>n.textContent=new Date().getFullYear())}
window.addEventListener('DOMContentLoaded',()=>{initNav();footerYear();if('serviceWorker' in navigator&&location.protocol.startsWith('http'))navigator.serviceWorker.register('sw.js').catch(()=>{})});
