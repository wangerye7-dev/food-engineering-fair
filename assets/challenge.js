
(() => {
  const BANK = window.QUESTION_BANK_V2;
  const SESSION_KEY = 'zmd_challenge_session_v2';
  const LAST_KEY = 'zmd_challenge_last_ids_v2';
  const content = document.getElementById('challengeContent');
  const nextBtn = document.getElementById('nextBtn');
  const header = document.getElementById('challengeHeader');
  const stepper = document.getElementById('stepper');
  const moduleBadge = document.getElementById('moduleBadge');
  const progressText = document.getElementById('progressText');
  let session = loadSession();
  let phase = session ? (session.finished ? 'result' : 'question') : 'intro';

  const majorNames = {processing:'食品智能加工技术', quality:'食品质量与安全', joint:'双专业联合会签'};
  const typeNames = {single:'单项决策', multi:'多项风险判断', order:'工艺顺序排列'};
  const dimensionNames = {};
  [...BANK.processing,...BANK.quality,...BANK.joint].forEach(q => dimensionNames[q.dimension] = q.dimensionName);

  function shuffle(arr){const a=[...arr];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
  function pickOne(list, excluded){const candidates=list.filter(q=>!excluded.includes(q.id));const source=candidates.length?candidates:list;return source[Math.floor(Math.random()*source.length)]}
  function createPaper(){
    const last = JSON.parse(localStorage.getItem(LAST_KEY)||'[]');
    const selected=[];
    BANK.blueprint.processingDimensions.forEach(dim=>selected.push(pickOne(BANK.processing.filter(q=>q.dimension===dim),last)));
    BANK.blueprint.qualityDimensions.forEach(dim=>selected.push(pickOne(BANK.quality.filter(q=>q.dimension===dim),last)));
    selected.push(pickOne(BANK.joint,last));
    const paperQuestions=selected.map(q=>({
      id:q.id,
      optionOrder:q.type==='single'||q.type==='multi'?shuffle(q.options.map((_,i)=>i)):[],
      itemOrder:q.type==='order'?shuffle(q.items.map((_,i)=>i)):[]
    }));
    const s={version:2,id:uid('CHL'),createdAt:new Date().toISOString(),index:0,questions:paperQuestions,answers:[],finished:false};
    localStorage.setItem(SESSION_KEY,JSON.stringify(s));
    return s;
  }
  function loadSession(){try{const s=JSON.parse(localStorage.getItem(SESSION_KEY)||'null');if(!s||s.version!==2||!Array.isArray(s.questions)||s.questions.length!==9)return null;return s}catch(e){return null}}
  function save(){localStorage.setItem(SESSION_KEY,JSON.stringify(session))}
  function getQuestion(ref){return [...BANK.processing,...BANK.quality,...BANK.joint].find(q=>q.id===ref.id)}
  function current(){const ref=session.questions[session.index];return {ref,q:getQuestion(ref)}}
  function moduleClass(major){return major==='processing'?'processing':major==='quality'?'quality':'joint'}
  function renderIntro(){
    header.classList.add('hidden');
    content.innerHTML=`<div class="challenge-intro"><span class="badge">题库随机模式 V2</span><h2>两个专业分开测评，最后联合会签</h2><p class="muted">系统从46道题库中按能力维度随机抽取9项任务。每次重新挑战会生成不同试卷。</p><div class="dual-major-grid"><div class="major-track processing"><h3>食品智能加工技术</h3><p>角色：加工设计师</p><ul><li>原料与产品设计 25分</li><li>工艺流程设计 25分</li><li>工艺参数控制 25分</li><li>生产异常处置 25分</li></ul></div><div class="major-track quality"><h3>食品质量与安全</h3><p>角色：质量安全官</p><ul><li>现场风险识别 25分</li><li>检验与记录审核 25分</li><li>标签与合规审核 25分</li><li>产品放行判断 25分</li></ul></div></div><div class="notice" style="margin-top:18px"><b>评分说明：</b>单选题按处理完整程度给分；多选题按正确要点累计、错误选项扣分；排序题每个正确位置5分。关键风险错误将在结果页单独提示。</div></div>`;
    nextBtn.textContent='开始随机抽题'; nextBtn.classList.remove('hidden');
  }
  function setupStepper(){stepper.innerHTML=session.questions.map((_,i)=>`<span class="step ${i<session.index?'done':i===session.index?'active':''}"></span>`).join('')}
  function answerDraft(q){
    const saved=session.answers[session.index];
    if(saved) return saved.draft;
    if(q.type==='single') return {selected:null};
    if(q.type==='multi') return {selected:[]};
    return {order:[]};
  }
  function renderQuestion(){
    phase='question'; header.classList.remove('hidden'); setupStepper();
    const {ref,q}=current(); const draft=answerDraft(q); const existing=session.answers[session.index];
    moduleBadge.textContent=`${majorNames[q.major]} · ${q.dimensionName}`;
    moduleBadge.className=`badge module-${moduleClass(q.major)}`;
    progressText.textContent=`第 ${session.index+1} / ${session.questions.length} 题 · ${typeNames[q.type]} · 满分 ${q.maxScore} 分`;
    let body='';
    if(q.type==='single'){
      body=`<div class="choice-grid single-options">${ref.optionOrder.map((oi,n)=>{const o=q.options[oi];return `<button type="button" class="choice ${draft.selected===oi?'selected':''}" data-option="${oi}"><span class="option-letter">${String.fromCharCode(65+n)}</span><span>${o.text}</span></button>`}).join('')}</div>`;
    } else if(q.type==='multi'){
      body=`<p class="help">可选择多个处理要点，再提交本题。</p><div class="choice-grid multi-options">${ref.optionOrder.map((oi,n)=>{const o=q.options[oi];return `<button type="button" class="choice ${draft.selected.includes(oi)?'selected':''}" data-option="${oi}" aria-pressed="${draft.selected.includes(oi)}"><span class="option-check">${draft.selected.includes(oi)?'✓':''}</span><span>${o.text}</span></button>`}).join('')}</div>`;
    } else {
      const chosen=draft.order||[]; const remaining=ref.itemOrder.filter(i=>!chosen.includes(i));
      body=`<p class="help">按顺序点击工序，已选择内容会依次进入上方序列。</p><div class="order-zone"><div class="order-title">当前顺序</div><div class="order-selected">${chosen.length?chosen.map((i,pos)=>`<button type="button" class="order-chip" data-remove="${i}"><b>${pos+1}</b>${q.items[i]}</button>`).join(''):'<span class="muted">尚未选择</span>'}</div></div><div class="order-pool">${remaining.map(i=>`<button type="button" class="choice compact" data-item="${i}">${q.items[i]}</button>`).join('')}</div><button type="button" class="text-btn" id="resetOrder">重置顺序</button>`;
    }
    content.innerHTML=`<article class="question-card"><div class="question-meta"><span class="tag">题号 ${q.id}</span><span class="tag">${q.difficulty}</span><span class="tag">${q.dimensionName}</span></div><h2>${q.title}</h2><p class="question-stem">${q.stem}</p>${body}<div id="feedbackPanel"></div></article>`;
    bindQuestionEvents(q,draft);
    if(existing&&existing.submitted){renderFeedback(existing,q);nextBtn.textContent=session.index===8?'查看能力报告':'下一题';}
    else nextBtn.textContent='提交本题并查看得分';
    nextBtn.classList.remove('hidden');
  }
  function bindQuestionEvents(q,draft){
    if(session.answers[session.index]?.submitted)return;
    if(q.type==='single') document.querySelectorAll('[data-option]').forEach(b=>b.onclick=()=>{draft.selected=Number(b.dataset.option);content.querySelectorAll('[data-option]').forEach(x=>x.classList.toggle('selected',x===b));storeDraft(draft)});
    if(q.type==='multi') document.querySelectorAll('[data-option]').forEach(b=>b.onclick=()=>{const i=Number(b.dataset.option);draft.selected=draft.selected.includes(i)?draft.selected.filter(x=>x!==i):[...draft.selected,i];storeDraft(draft);renderQuestion()});
    if(q.type==='order'){
      document.querySelectorAll('[data-item]').forEach(b=>b.onclick=()=>{draft.order.push(Number(b.dataset.item));storeDraft(draft);renderQuestion()});
      document.querySelectorAll('[data-remove]').forEach(b=>b.onclick=()=>{draft.order=draft.order.filter(x=>x!==Number(b.dataset.remove));storeDraft(draft);renderQuestion()});
      const reset=document.getElementById('resetOrder');if(reset)reset.onclick=()=>{draft.order=[];storeDraft(draft);renderQuestion()};
    }
  }
  function storeDraft(draft){session.answers[session.index]={draft,submitted:false};save()}
  function calculate(q,draft){
    let score=0,critical=false,correctAnswer='',detail='';
    if(q.type==='single'){
      const o=q.options[draft.selected]; score=o.score; critical=!!o.critical;
      const best=q.options.map((x,i)=>({x,i})).sort((a,b)=>b.x.score-a.x.score)[0];
      correctAnswer=best.x.text; detail=o.feedback;
    } else if(q.type==='multi'){
      const selected=draft.selected||[];
      selected.forEach(i=>{const o=q.options[i];if(o.correct)score+=o.score;else{score-=o.penalty||5;if(o.critical)critical=true}});
      score=Math.max(0,Math.min(q.maxScore,score));
      const correct=q.options.filter(o=>o.correct); correctAnswer=correct.map(o=>o.text).join('；');
      const missed=correct.filter(o=>!selected.includes(q.options.indexOf(o))).map(o=>o.text);
      const wrong=selected.filter(i=>!q.options[i].correct).map(i=>q.options[i].text);
      detail=[missed.length?`遗漏要点：${missed.join('；')}`:'正确要点已覆盖',wrong.length?`误选：${wrong.join('；')}`:'未选择错误项'].join('。');
    } else {
      const seq=draft.order||[]; const matches=q.items.reduce((n,_,i)=>n+(seq[i]===i?1:0),0); score=matches*5;
      correctAnswer=q.items.map((x,i)=>`${i+1}.${x}`).join(' → '); detail=`共 ${matches} 个位置正确，每个正确位置5分。`;
    }
    return {score,critical,correctAnswer,detail};
  }
  function submitCurrent(){
    const {q}=current();const entry=session.answers[session.index];const draft=entry?.draft||answerDraft(q);
    if(q.type==='single'&&draft.selected===null){toast('请先选择一个处理方案');return false}
    if(q.type==='multi'&&(!draft.selected||draft.selected.length===0)){toast('请至少选择一个要点');return false}
    if(q.type==='order'&&(!draft.order||draft.order.length!==q.items.length)){toast('请完成全部工序排序');return false}
    const result=calculate(q,draft);
    session.answers[session.index]={draft,submitted:true,...result,questionId:q.id,major:q.major,dimension:q.dimension,maxScore:q.maxScore,title:q.title};save();renderFeedback(session.answers[session.index],q);nextBtn.textContent=session.index===8?'查看能力报告':'下一题';return true;
  }
  function renderFeedback(answer,q){
    const panel=document.getElementById('feedbackPanel'); if(!panel)return;
    panel.innerHTML=`<div class="answer-feedback ${answer.critical?'critical':''}"><div class="feedback-score"><strong>${answer.score}</strong><span>/ ${q.maxScore} 分</span></div><div><h3>${answer.critical?'出现关键风险错误':'本题评分依据'}</h3><p>${answer.detail}</p><p><b>参考处理：</b>${answer.correctAnswer}</p><p class="muted"><b>专业说明：</b>${q.rationale}</p>${q.redlineNote&&q.redlineNote!=='无'?`<p class="redline-note">${q.redlineNote}</p>`:''}</div></div>`;
    content.querySelectorAll('button.choice,button.order-chip,button.text-btn').forEach(b=>b.disabled=true);
  }
  function nextStep(){
    if(phase==='intro') {session=createPaper();phase='question';renderQuestion();return}
    if(phase==='result') return;
    const entry=session.answers[session.index];
    if(!entry||!entry.submitted){submitCurrent();return}
    if(session.index<session.questions.length-1){session.index++;save();renderQuestion()}else finish()
  }
  function scoreSummary(){
    const answers=session.answers;
    const processAnswers=answers.filter(a=>a.major==='processing');
    const qualityAnswers=answers.filter(a=>a.major==='quality');
    const jointAnswer=answers.find(a=>a.major==='joint');
    const processingScore=processAnswers.reduce((s,a)=>s+a.score,0);
    const qualityScore=qualityAnswers.reduce((s,a)=>s+a.score,0);
    const jointScore=jointAnswer?.score||0;
    const criticals=answers.filter(a=>a.critical);
    return {processingScore,qualityScore,jointScore,criticals,processAnswers,qualityAnswers,jointAnswer};
  }
  function titleFor(major,score){
    if(major==='processing')return score>=90?'工艺设计先锋':score>=80?'工艺控制能手':score>=70?'加工技术实践者':'加工技能学习者';
    return score>=90?'质量安全守门人':score>=80?'质量审核能手':score>=70?'风险识别实践者':'质量安全学习者';
  }
  function dimensionRows(list){return list.map(a=>`<div class="dimension-row"><span>${dimensionNames[a.dimension]}</span><b>${a.score} / ${a.maxScore}</b></div>`).join('')}
  function finish(){
    session.finished=true;session.completedAt=new Date().toISOString();const summary=scoreSummary();session.summary=summary;save();
    localStorage.setItem(LAST_KEY,JSON.stringify(session.questions.map(x=>x.id)));
    const release=summary.criticals.length?'暂不具备放行资格':'具备规范协同决策意识';
    const record={id:session.id,version:2,createdAt:session.completedAt,processingScore:summary.processingScore,qualityScore:summary.qualityScore,jointScore:summary.jointScore,criticalCount:summary.criticals.length,releaseConclusion:release,processingTitle:titleFor('processing',summary.processingScore),qualityTitle:titleFor('quality',summary.qualityScore),questionIds:session.questions.map(x=>x.id),answers:session.answers};
    const list=getStore(KEYS.challenge);list.push(record);setStore(KEYS.challenge,list);
    phase='result';renderResult();
  }
  function renderResult(){
    header.classList.add('hidden');nextBtn.classList.add('hidden');const s=session.summary||scoreSummary();
    const release=s.criticals.length?'暂不具备放行资格':'具备规范协同决策意识';
    content.innerHTML=`<div class="result-report"><div class="report-head"><span class="badge">挑战完成</span><h2>双专业职业能力报告</h2><p class="muted">挑战编号：${session.id}</p></div><div class="result-major-grid"><section class="result-major processing"><h3>食品智能加工技术</h3><div class="big-score">${s.processingScore}<small>/100</small></div><p class="result-title">${titleFor('processing',s.processingScore)}</p>${dimensionRows(s.processAnswers)}</section><section class="result-major quality"><h3>食品质量与安全</h3><div class="big-score">${s.qualityScore}<small>/100</small></div><p class="result-title">${titleFor('quality',s.qualityScore)}</p>${dimensionRows(s.qualityAnswers)}</section></div><section class="joint-result"><div><h3>双专业联合会签</h3><p class="muted">联合决策题独立计分，不与两个专业基础能力混算。</p></div><div class="joint-score">${s.jointScore}<small>/20</small></div></section><div class="release-box ${s.criticals.length?'critical':''}"><h3>${release}</h3><p>关键风险错误：${s.criticals.length} 项。${s.criticals.length?'关键错误不能由其他题目高分抵消，请重点复习记录真实性、交叉污染和产品放行条件。':'本次挑战未触发关键红线，但仍需在真实岗位中依据企业制度和审核程序执行。'}</p></div><details class="answer-details"><summary>查看本次9道题得分明细</summary>${session.answers.map((a,i)=>`<div class="detail-row"><div><b>${i+1}. ${a.title}</b><span>${majorNames[a.major]} · ${dimensionNames[a.dimension]}</span></div><strong>${a.score}/${a.maxScore}</strong></div>`).join('')}</details><div class="receipt">完成凭证：${session.id}</div><div class="button-row" style="justify-content:center"><button class="btn btn-primary" id="restartBtn">重新随机抽题</button><a class="btn btn-secondary" href="majors.html">了解两个专业</a></div><p class="help" style="text-align:center">本结果用于展会互动体验，不作为正式学业成绩、职业资格或产品检验结论。</p></div>`;
    document.getElementById('restartBtn').onclick=()=>{localStorage.removeItem(SESSION_KEY);session=null;phase='intro';renderIntro()};
  }
  nextBtn.addEventListener('click',nextStep);
  if(phase==='intro')renderIntro();else if(phase==='result')renderResult();else renderQuestion();
})();
