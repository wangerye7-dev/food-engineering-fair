(() => {
  const BANK = window.QUESTION_BANK_V3;
  const SESSION_KEY = 'zmd_challenge_session_v3';
  const LAST_KEY = 'zmd_challenge_last_ids_v3';
  const content = document.getElementById('challengeContent');
  const nextBtn = document.getElementById('nextBtn');
  const header = document.getElementById('challengeHeader');
  const stepper = document.getElementById('stepper');
  const moduleBadge = document.getElementById('moduleBadge');
  const progressText = document.getElementById('progressText');
  let session = loadSession();
  let phase = session ? (session.finished ? 'result' : 'question') : 'intro';

  const moduleNames = {processing:'食品智能加工技术', quality:'食品质量与安全', joint:'专业协同决策'};
  const typeNames = {single:'单项决策', multi:'多项判断', order:'工序排序'};
  const dimensionNames = {};
  [...BANK.processing,...BANK.quality,...BANK.joint].forEach(q => dimensionNames[q.dimension] = q.dimensionName);

  function shuffle(arr){const a=[...arr];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
  function pickOne(list, excluded=[]){const candidates=list.filter(q=>!excluded.includes(q.id));const source=candidates.length?candidates:list;return source[Math.floor(Math.random()*source.length)]}
  function pickTwo(list, excluded=[]){const first=pickOne(list,excluded);const second=pickOne(list.filter(q=>q.id!==first.id),[...excluded,first.id]);return [first,second]}
  function createPaper(){
    const last=JSON.parse(localStorage.getItem(LAST_KEY)||'[]');
    const selected=[];
    BANK.blueprint.processingDimensions.forEach(dim=>selected.push(pickOne(BANK.processing.filter(q=>q.dimension===dim),last)));
    BANK.blueprint.qualityDimensions.forEach(dim=>selected.push(pickOne(BANK.quality.filter(q=>q.dimension===dim),last)));
    selected.push(...pickTwo(BANK.joint,last));
    const paperQuestions=selected.map(q=>({id:q.id,optionOrder:q.type==='single'||q.type==='multi'?shuffle(q.options.map((_,i)=>i)):[],itemOrder:q.type==='order'?shuffle(q.items.map((_,i)=>i)):[]}));
    const s={version:3,id:uid('EXP'),createdAt:new Date().toISOString(),index:0,questions:paperQuestions,answers:[],finished:false};
    localStorage.setItem(SESSION_KEY,JSON.stringify(s));return s;
  }
  function loadSession(){try{const s=JSON.parse(localStorage.getItem(SESSION_KEY)||'null');if(!s||s.version!==3||!Array.isArray(s.questions)||s.questions.length!==10)return null;return s}catch(e){return null}}
  function save(){localStorage.setItem(SESSION_KEY,JSON.stringify(session))}
  function allQuestions(){return [...BANK.processing,...BANK.quality,...BANK.joint]}
  function getQuestion(ref){return allQuestions().find(q=>q.id===ref.id)}
  function current(){const ref=session.questions[session.index];return {ref,q:getQuestion(ref)}}
  function moduleClass(major){return major==='processing'?'processing':major==='quality'?'quality':'joint'}
  function renderIntro(){
    header.classList.add('hidden');
    content.innerHTML=`<div class="challenge-intro"><span class="badge">食品工厂体验</span><h2>完成10项随机任务，解锁专业协同能力报告</h2><p class="muted">题目覆盖食品加工、质量安全和协同决策。每题10分，总分100分。</p><div class="challenge-module-grid"><section class="challenge-module-card processing"><span>加工设计师</span><strong>4题 · 40分</strong><small>原料选择、工艺设计、参数控制、异常处置</small></section><section class="challenge-module-card quality"><span>质量安全官</span><strong>4题 · 40分</strong><small>风险识别、记录审核、标签合规、产品放行</small></section><section class="challenge-module-card joint"><span>专业协同</span><strong>2题 · 20分</strong><small>综合判断加工结果、质量证据和放行条件</small></section></div><div class="challenge-total"><span>每次从题库随机生成不同任务组合</span><strong>100分</strong></div><div class="notice" style="margin-top:18px"><b>体验提示：</b>每题提交后会显示得分依据和参考处理。关键风险选择将在结果页单独提示。</div></div>`;
    nextBtn.textContent='开始体验';nextBtn.classList.remove('hidden');
  }
  function setupStepper(){stepper.innerHTML=session.questions.map((_,i)=>`<span class="step ${i<session.index?'done':i===session.index?'active':''}"></span>`).join('')}
  function answerDraft(q){const saved=session.answers[session.index];if(saved)return saved.draft;if(q.type==='single')return {selected:null};if(q.type==='multi')return {selected:[]};return {order:[]}}
  function renderQuestion(){
    phase='question';header.classList.remove('hidden');setupStepper();
    const {ref,q}=current();const draft=answerDraft(q);const existing=session.answers[session.index];
    moduleBadge.textContent=`${moduleNames[q.major]} · ${q.dimensionName}`;moduleBadge.className=`badge module-${moduleClass(q.major)}`;
    progressText.textContent=`第 ${session.index+1} / 10 题 · ${typeNames[q.type]} · 10分`;
    let body='';
    if(q.type==='single')body=`<div class="choice-grid">${ref.optionOrder.map((oi,n)=>{const o=q.options[oi];return `<button type="button" class="choice ${draft.selected===oi?'selected':''}" data-option="${oi}"><span class="option-letter">${String.fromCharCode(65+n)}</span><span>${o.text}</span></button>`}).join('')}</div>`;
    else if(q.type==='multi')body=`<p class="help">可选择多个处理要点。</p><div class="choice-grid">${ref.optionOrder.map(oi=>{const o=q.options[oi];return `<button type="button" class="choice ${draft.selected.includes(oi)?'selected':''}" data-option="${oi}" aria-pressed="${draft.selected.includes(oi)}"><span class="option-check">${draft.selected.includes(oi)?'✓':''}</span><span>${o.text}</span></button>`}).join('')}</div>`;
    else{const chosen=draft.order||[];const remaining=ref.itemOrder.filter(i=>!chosen.includes(i));body=`<p class="help">依次点击工序，完成正确排序。</p><div class="order-zone"><div class="order-title">当前顺序</div><div class="order-selected">${chosen.length?chosen.map((i,pos)=>`<button type="button" class="order-chip" data-remove="${i}"><b>${pos+1}</b>${q.items[i]}</button>`).join(''):'<span class="muted">尚未选择</span>'}</div></div><div class="order-pool">${remaining.map(i=>`<button type="button" class="choice compact" data-item="${i}">${q.items[i]}</button>`).join('')}</div><button type="button" class="text-btn" id="resetOrder">重置顺序</button>`}
    content.innerHTML=`<article class="question-card"><div class="question-meta"><span class="tag">${q.difficulty}</span><span class="tag">${q.dimensionName}</span><span class="tag">10分</span></div><h2>${q.title}</h2><p class="question-stem">${q.stem}</p>${body}<div id="feedbackPanel"></div></article>`;
    bindQuestionEvents(q,draft);
    if(existing&&existing.submitted){renderFeedback(existing,q);nextBtn.textContent=session.index===9?'查看体验报告':'下一题'}else nextBtn.textContent='提交本题';
    nextBtn.classList.remove('hidden');
  }
  function bindQuestionEvents(q,draft){
    if(session.answers[session.index]?.submitted)return;
    if(q.type==='single')document.querySelectorAll('[data-option]').forEach(b=>b.onclick=()=>{draft.selected=Number(b.dataset.option);content.querySelectorAll('[data-option]').forEach(x=>x.classList.toggle('selected',x===b));storeDraft(draft)});
    if(q.type==='multi')document.querySelectorAll('[data-option]').forEach(b=>b.onclick=()=>{const i=Number(b.dataset.option);draft.selected=draft.selected.includes(i)?draft.selected.filter(x=>x!==i):[...draft.selected,i];storeDraft(draft);renderQuestion()});
    if(q.type==='order'){document.querySelectorAll('[data-item]').forEach(b=>b.onclick=()=>{draft.order.push(Number(b.dataset.item));storeDraft(draft);renderQuestion()});document.querySelectorAll('[data-remove]').forEach(b=>b.onclick=()=>{draft.order=draft.order.filter(x=>x!==Number(b.dataset.remove));storeDraft(draft);renderQuestion()});const reset=document.getElementById('resetOrder');if(reset)reset.onclick=()=>{draft.order=[];storeDraft(draft);renderQuestion()}}
  }
  function storeDraft(draft){session.answers[session.index]={draft,submitted:false};save()}
  function normalize(raw,max){return Math.max(0,Math.min(10,Math.round(raw/max*10)))}
  function calculate(q,draft){
    let raw=0,critical=false,correctAnswer='',detail='';
    if(q.type==='single'){const o=q.options[draft.selected];raw=o.score;critical=!!o.critical;const best=q.options.map((x,i)=>({x,i})).sort((a,b)=>b.x.score-a.x.score)[0];correctAnswer=best.x.text;detail=o.feedback}
    else if(q.type==='multi'){const selected=draft.selected||[];selected.forEach(i=>{const o=q.options[i];if(o.correct)raw+=o.score;else{raw-=o.penalty||5;if(o.critical)critical=true}});raw=Math.max(0,Math.min(q.maxScore,raw));const correct=q.options.filter(o=>o.correct);correctAnswer=correct.map(o=>o.text).join('；');const missed=correct.filter(o=>!selected.includes(q.options.indexOf(o))).map(o=>o.text);const wrong=selected.filter(i=>!q.options[i].correct).map(i=>q.options[i].text);detail=[missed.length?`遗漏：${missed.join('；')}`:'正确要点已覆盖',wrong.length?`误选：${wrong.join('；')}`:'未选择错误项'].join('。')}
    else{const seq=draft.order||[];const matches=q.items.reduce((n,_,i)=>n+(seq[i]===i?1:0),0);raw=matches*(q.maxScore/q.items.length);correctAnswer=q.items.map((x,i)=>`${i+1}.${x}`).join(' → ');detail=`共 ${matches} 个位置正确。`}
    return {score:normalize(raw,q.maxScore),rawScore:raw,critical,correctAnswer,detail};
  }
  function submitCurrent(){
    const {q}=current();const entry=session.answers[session.index];const draft=entry?.draft||answerDraft(q);
    if(q.type==='single'&&draft.selected===null){toast('请先选择一个处理方案');return false}if(q.type==='multi'&&(!draft.selected||draft.selected.length===0)){toast('请至少选择一个要点');return false}if(q.type==='order'&&(!draft.order||draft.order.length!==q.items.length)){toast('请完成全部工序排序');return false}
    const result=calculate(q,draft);session.answers[session.index]={draft,submitted:true,...result,questionId:q.id,major:q.major,dimension:q.dimension,maxScore:10,title:q.title};save();renderFeedback(session.answers[session.index],q);nextBtn.textContent=session.index===9?'查看体验报告':'下一题';return true;
  }
  function renderFeedback(answer,q){const panel=document.getElementById('feedbackPanel');if(!panel)return;panel.innerHTML=`<div class="answer-feedback ${answer.critical?'critical':''}"><div class="feedback-score"><strong>${answer.score}</strong><span>/ 10分</span></div><div><h3>${answer.critical?'发现关键风险点':'本题得分依据'}</h3><p>${answer.detail}</p><p><b>参考处理：</b>${answer.correctAnswer}</p><p class="muted"><b>知识提示：</b>${q.rationale}</p>${q.redlineNote&&q.redlineNote!=='无'?`<p class="redline-note">${q.redlineNote}</p>`:''}</div></div>`;content.querySelectorAll('button.choice,button.order-chip,button.text-btn').forEach(b=>b.disabled=true)}
  function nextStep(){if(phase==='intro'){session=createPaper();phase='question';renderQuestion();return}if(phase==='result')return;const entry=session.answers[session.index];if(!entry||!entry.submitted){submitCurrent();return}if(session.index<9){session.index++;save();renderQuestion()}else finish()}
  function scoreSummary(){const answers=session.answers;const processAnswers=answers.filter(a=>a.major==='processing');const qualityAnswers=answers.filter(a=>a.major==='quality');const jointAnswers=answers.filter(a=>a.major==='joint');const processingScore=processAnswers.reduce((s,a)=>s+a.score,0);const qualityScore=qualityAnswers.reduce((s,a)=>s+a.score,0);const jointScore=jointAnswers.reduce((s,a)=>s+a.score,0);const total=processingScore+qualityScore+jointScore;const criticals=answers.filter(a=>a.critical);return {processingScore,qualityScore,jointScore,total,criticals,processAnswers,qualityAnswers,jointAnswers}}
  function titleFor(total,criticals){if(criticals.length)return '食品风险复盘员';if(total>=90)return '食品产业协同达人';if(total>=80)return '食品工厂决策能手';if(total>=70)return '食品生产实践能手';return '食品产业体验者'}
  function dimensionRows(list){return list.map(a=>`<div class="dimension-row"><span>${dimensionNames[a.dimension]}</span><b>${a.score}/10</b></div>`).join('')}
  function finish(){session.finished=true;session.completedAt=new Date().toISOString();const summary=scoreSummary();session.summary=summary;save();localStorage.setItem(LAST_KEY,JSON.stringify(session.questions.map(x=>x.id)));const record={id:session.id,version:3,createdAt:session.completedAt,total:summary.total,processingScore:summary.processingScore,qualityScore:summary.qualityScore,jointScore:summary.jointScore,criticalCount:summary.criticals.length,title:titleFor(summary.total,summary.criticals),questionIds:session.questions.map(x=>x.id),answers:session.answers};const list=getStore(KEYS.challenge);list.push(record);setStore(KEYS.challenge,list);phase='result';renderResult()}
  function renderResult(){
    header.classList.add('hidden');nextBtn.classList.add('hidden');const s=session.summary||scoreSummary();const title=titleFor(s.total,s.criticals);
    content.innerHTML=`<div class="result-report"><div class="report-head"><span class="badge">体验完成</span><h2>食品产业能力体验报告</h2><p class="muted">体验编号：${session.id}</p></div><section class="total-score-card"><div class="total-score-number">${s.total}<small>/100</small></div><div><h3>${title}</h3><p>本次报告由10项随机任务生成，展示加工、质量安全与专业协同三个方面的表现。</p></div></section><div class="result-module-grid"><section class="result-module processing"><h3>食品智能加工技术</h3><div class="big-score">${s.processingScore}<small>/40</small></div>${dimensionRows(s.processAnswers)}</section><section class="result-module quality"><h3>食品质量与安全</h3><div class="big-score">${s.qualityScore}<small>/40</small></div>${dimensionRows(s.qualityAnswers)}</section><section class="result-module joint"><h3>专业协同决策</h3><div class="big-score">${s.jointScore}<small>/20</small></div>${dimensionRows(s.jointAnswers)}</section></div><div class="release-box ${s.criticals.length?'critical':''}"><h3>${s.criticals.length?'本次选择中发现关键风险点':'本次选择未触发关键风险点'}</h3><p>${s.criticals.length?`共 ${s.criticals.length} 项。建议重点关注记录真实性、交叉污染和产品放行条件。`:'你能够兼顾产品品质、食品安全和协同决策。'}</p></div><details class="answer-details"><summary>查看10道题得分明细</summary>${session.answers.map((a,i)=>`<div class="detail-row"><div><b>${i+1}. ${a.title}</b><span>${moduleNames[a.major]} · ${dimensionNames[a.dimension]}</span></div><strong>${a.score}/10</strong></div>`).join('')}</details><div class="receipt">体验凭证：${session.id}</div><div class="button-row" style="justify-content:center"><button class="btn btn-primary" id="restartBtn">再体验一次</button><a class="btn btn-secondary" href="majors.html">查看专业协同</a></div></div>`;
    document.getElementById('restartBtn').onclick=()=>{localStorage.removeItem(SESSION_KEY);session=null;phase='intro';renderIntro()};
  }
  nextBtn.addEventListener('click',nextStep);if(phase==='intro')renderIntro();else if(phase==='result')renderResult();else renderQuestion();
})();
