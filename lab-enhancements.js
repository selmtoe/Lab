import {youtubeId,timeText,encodeState,stateFromUrl,pageState} from './library-tools.js';
import {createResearch} from './lab-research.js';

const state={records:[],token:null,toolOrigin:'https://selmtoe.github.io',videos:[],timer:null,tools:new Map(),replays:new Map(),jobs:[],scoreWidgets:new Set()};
const node=(tag,text,cls)=>{const element=document.createElement(tag);if(text!==undefined)element.textContent=text;if(cls)element.className=cls;return element;};
const button=(text,action,cls='btn-outline')=>{const b=node('button',text,cls);b.type='button';b.onclick=e=>{e.stopPropagation();Promise.resolve().then(()=>action(e)).catch(error=>{const d=b.closest('dialog');if(d){let message=d.querySelector('.lab-action-status');if(!message){message=node('p',undefined,'lab-form-error lab-action-status');message.setAttribute('role','alert');d.append(message);}message.textContent=error.message;message.scrollIntoView({block:'nearest'});}else notice(error.message,true);});};return b;};
const notice=(text,error=false)=>{const target=document.getElementById('lab-status');target.textContent=text;target.classList.toggle('lab-form-error',error);};
async function api(path,options={}){const response=await fetch(path,{...options,headers:{'Content-Type':'application/json',...(state.token?{'X-Lab-Token':state.token}:{}),...options.headers}});const result=await response.json();if(!response.ok)throw Error(result.error||'操作に失敗しました。');return result;}
const post=(path,value)=>api(path,{method:'POST',body:JSON.stringify(value)});
const recordId=r=>r.legacyId||r.id.replace(new RegExp('^'+r.kind+'-'),'');
const videoKey=r=>r.videoKey||r.mediaId||r.id;
const byId=id=>state.records.find(r=>r.id===id);
function tags(parent,values){for(const tag of values||[]){const t=node('span',tag,'tag');t.onclick=e=>{e.stopPropagation();window.router('tags',tag);};parent.append(t);}}
function dialog(title,wide=false){const d=node('dialog',undefined,'lab-dialog'+(wide?' lab-tool-dialog':''));d.append(node('h2',title));d.addEventListener('close',()=>{state.tools.delete(d);d.remove();});document.body.append(d);return d;}
function field(parent,label,name,value='',type='text',options=null){const wrap=node('label',label);const input=node(type==='textarea'?'textarea':options?'select':'input');input.name=name;
    if(options)for(const [value,text]of options){const option=node('option',text);option.value=value;input.append(option);}else if(type!=='textarea')input.type=type;
    if(type==='textarea')input.rows=8;input.value=value;wrap.append(input);parent.append(wrap);return input;
}
function footer(d,form,label,action){const actions=node('div',undefined,'lab-inline-actions');const submit=button(label,()=>{});submit.type='submit';submit.classList.add('lab-primary');actions.append(submit,button('閉じる',()=>d.close()));form.append(actions);const error=node('p',undefined,'lab-form-error');form.append(error);form.onsubmit=async event=>{event.preventDefault();submit.disabled=true;error.textContent='';try{await action();}catch(e){error.textContent=e.message;}finally{submit.disabled=false;}};}
function rebuildViews(){
    const map=r=>({...r,id:recordId(r),labRecordId:r.id,content:r.content||'',notes:r.description||'',externalUrl:r.kind==='article'?r.url:'',
        url:r.url||(r.snapshot?'https://selmtoe.github.io/Tetris_Simulator/F/index.html#'+encodeState(r.snapshot):'')});
    window.LAB_ARTICLES=state.records.filter(r=>r.kind==='article').map(map);
    window.LAB_TETOFU=state.records.filter(r=>r.kind==='tetofu').map(map);
    const videos=state.records.filter(r=>r.kind==='video').map(r=>({...map(r),labMatches:[],labVideoKey:videoKey(r)}));
    for(const match of state.records.filter(r=>r.kind==='match')){
        const key=videoKey(match);let video=videos.find(v=>(match.youtubeId&&v.youtubeId===match.youtubeId)||v.labVideoKey===key);
        if(!video){video={id:'analysis-'+String(key).replace(/[^\w-]/g,'').slice(-64),title:match.videoTitle||match.title.replace(/ · 試合\d+$/,''),date:match.date,
            tags:[],content:'',description:'',youtubeId:match.youtubeId||'',labVideoKey:key,labMatches:[],labVirtual:true};videos.push(video);}
        video.labMatches.push(match);video.tags=[...new Set([...(video.tags||[]),...(match.tags||[]),...match.bookmarks?.flatMap(m=>m.tags||[])||[]])];
        video.youtubeOffsetSeconds ??= match.youtubeOffsetSeconds||0;
    }
    for(const video of videos){video.labMatches.sort((a,b)=>a.startSeconds-b.startSeconds);if(video.labVirtual)video.description=`解析 ${video.labMatches.length}試合 · ${[...new Set(video.labMatches.flatMap(m=>m.players||[]).filter(Boolean))].join(' / ')}`;}
    window.LAB_VIDEOS=state.videos=videos;
    document.getElementById('lab-analysis-nav').hidden=!videos.some(v=>v.labMatches.length);
}
async function refresh(preserveTime=false){const current=preserveTime?window.labVideoTime?.():NaN;const data=state.token?await api('/api/records'):await(await fetch('./data/library.json')).json();state.records=data.records||[];state.replays.clear();rebuildViews();window.LabExtension.ready=true;window.dispatchEvent(new HashChangeEvent('hashchange'));if(Number.isFinite(current)&&location.hash.startsWith('#videos/'))window.seekDetailVideo(current);}
function openEdit(record={}){
    if(!record.kind||record.kind==='article')return import('./vendor/lab-editor.js').then(m=>m.openArticle(record,{node,button,post,api,refresh,notice,state,research,recordId,field}));
    const d=dialog(record.id?'編集する':'新しく追加する'),form=node('form');d.append(form);
    const title=field(form,'タイトル','title',record.title||'');title.required=true;title.maxLength=250;
    const kind=field(form,'種類','kind',record.kind||'article','text',[['article','記事'],['video','動画'],['tetofu','テト譜']]);
    if(record.id)kind.disabled=true;
    field(form,'タグ（カンマ区切り）','tags',(record.tags||[]).join(', '));field(form,'一覧に表示する短い説明','description',record.description||'');const content=field(form,'本文','content',record.content||'','textarea');
    const help=node('p',undefined,'lab-help-text');content.after(help);
    const preview=node('div',undefined,'article-body lab-edit-preview');preview.hidden=true;form.append(button('本文の見え方を確認',()=>{preview.innerHTML=window.renderMarkdown(content.value);preview.hidden=!preview.hidden;}),preview);
    const url=field(form,'外部リンク（必要な場合だけ）','url',record.url||'','url'),youtube=field(form,'YouTubeのURL','youtube',record.youtubeId?'https://www.youtube.com/watch?v='+record.youtubeId:'','url');
    const updateFields=()=>{youtube.parentElement.hidden=kind.value!=='video';help.textContent=kind.value==='video'?'[13:46]{積み, 判断} メモ の形式で書くと、その時刻に移動できます。':'# 見出し、**太字**、[リンク名](URL) が使えます。局面を記事に使うときは、記事エディタの資料棚から選びます。';};kind.onchange=updateFields;updateFields();
    field(form,'公開範囲','visibility',record.visibility||'private','text',[['private','このPCだけ'],['public','公開対象にする']]);
    form.append(node('p','保存はこのPCに行います。公開サイトへの反映は「公開管理」から送信してください。','lab-help-text'));
    footer(d,form,'保存する',async()=>{const values=Object.fromEntries(new FormData(form));values.kind=kind.value;values.youtubeId=youtubeId(values.youtube);delete values.youtube;values.tags=values.tags.split(',').map(t=>t.trim()).filter(Boolean);if(record.id){values.id=record.id;values.revision=record.revision;}if(record.videoKey)values.videoKey=record.videoKey;
        const saved=await post('/api/records',values);d.close();await refresh(true);notice('保存しました。');if(!record.id)window.router(saved.kind==='article'?'articles':saved.kind==='video'?'videos':'tetofu',saved.kind==='tetofu'?null:recordId(saved));});
    if(record.id)form.append(button('ごみ箱に移す',async()=>{await post('/api/trash',{id:record.id,revision:record.revision});d.close();await refresh();notice('ごみ箱に移しました。');}));d.showModal();
}
function videoRecord(video){return byId(video.labRecordId)||{kind:'video',title:video.title,videoKey:video.labVideoKey,tags:video.tags||[],content:video.content||'',youtubeId:video.youtubeId||'',visibility:'private'};}
function openVideoSettings(video){
    const source=videoRecord(video),d=dialog('動画・解析結果の設定'),form=node('form');d.append(form);
    field(form,'動画のタイトル','title',source.title);field(form,'YouTubeのURL','youtube',video.youtubeId?'https://www.youtube.com/watch?v='+video.youtubeId:'','url');
    field(form,'タグ（カンマ区切り。試合にも追加します）','tags',(video.tags||[]).join(', '));
    field(form,'公開範囲（この動画の解析結果にも適用）','visibility','','text',[['','変更しない'],['private','このPCだけ'],['public','公開する']]);
    const more=node('details');more.append(node('summary','動画の時刻がずれる場合'));field(more,'YouTubeの時刻 − 元動画の時刻（秒）','offset',video.youtubeOffsetSeconds||0,'number').step='.01';form.append(more);
    form.append(node('p',`この動画に関連する ${video.labMatches.length} 試合をまとめて設定します。動画ファイルはアップロードしません。`));
    footer(d,form,'保存する',async()=>{const v=Object.fromEntries(new FormData(form)),id=youtubeId(v.youtube),offset=Number(v.offset),list=v.tags.split(',').map(t=>t.trim()).filter(Boolean);
        const saved=await post('/api/records',{...source,title:v.title,youtubeId:id,youtubeOffsetSeconds:offset,tags:list,...(v.visibility?{visibility:v.visibility}:{})});
        if(video.labMatches.length)await post('/api/bulk-update',{records:video.labMatches.map(r=>({id:r.id,revision:r.revision})),patch:{youtubeId:id,youtubeOffsetSeconds:offset,tags:list,...(v.visibility?{visibility:v.visibility}:{})}});
        d.close();await refresh();window.router('videos',recordId(saved));notice('動画の情報と解析結果を設定しました。');});d.showModal();
}
async function openImports(){
    const d=dialog('完成した解析結果を取り込む');
    d.append(node('p','① PCの配信解析で解析・修正 → ②「修正を再判定」→ ③ ここに完成結果を取り込みます。','lab-help-text'));
    const status=node('p',undefined,'lab-action-status');status.setAttribute('role','status');
    const preview=node('section'),sources=node('div'),search=field(sources,'このPCの解析履歴を探す','query'),list=node('div',undefined,'lab-scroll');sources.append(list);
    const showPreview=value=>{
        if(value.cancelled)return;
        preview.replaceChildren(node('h3',value.title),node('p',`取り込み可能 ${value.matches.length}試合 · 未完成 ${value.excluded.length}試合`));
        const rows=node('div',undefined,'lab-scroll');for(const m of value.matches)rows.append(node('p',`${m.existing?'登録済み・変更があれば更新':'新しく追加'} · ${m.title}`));
        for(const m of value.excluded)rows.append(node('p',`試合${m.index}：${m.reason}`,'lab-help-text'));preview.append(rows);
        preview.append(node('p','新規・盤面が変わった試合は非公開で保存します。タグ、研究メモ、YouTubeのリンクと時刻補正は残します。','lab-help-text'));
        const commit=button('完成した試合を取り込む',async()=>{commit.disabled=true;status.textContent='取り込んでいます…';try{const r=await post('/api/import-completed',{id:value.id});d.close();await refresh();notice(`追加 ${r.imported}試合 · 更新 ${r.updated}試合 · 変更なし ${r.skipped}試合。${r.changed?'内容が変わった試合は再採点・公開確認をしてください。':''}`);}finally{commit.disabled=false;}},'btn-outline lab-primary');commit.disabled=!value.matches.length;preview.append(commit);
        if(value.matches.length){const download=node('a','この完成結果を1つのファイルに保存','btn-outline');download.href=value.downloadUrl;download.download=value.title.replace(/[\\/:*?"<>|]/g,'_')+'.tetris-lab.json';preview.append(download);}
        preview.scrollIntoView({block:'nearest'});
    };
    const pick=button('PCの解析ファイルを選ぶ',async()=>{pick.disabled=true;status.textContent='ファイル選択を開いています…';try{showPreview(await post('/api/choose-completed',{}));status.textContent='';}finally{pick.disabled=false;}});
    d.append(pick,node('p','配信解析の出力フォルダーにある batch-results.json を選びます。1試合だけなら simulator 内の *_tetris_recovered.json も選べます。','lab-help-text'));
    const file=field(d,'保存しておいたLab完成ファイル（.tetris-lab.json）','completed','','file');file.accept='.json';file.onchange=async()=>{try{const chosen=file.files?.[0];if(!chosen)return;if(chosen.size>28*1024*1024)throw Error('ファイルが大きすぎます。配信ごとに分けてください。');status.textContent='完成ファイルを確認しています…';showPreview(await post('/api/prepare-upload',JSON.parse(await chosen.text())));status.textContent='';}catch(e){status.textContent=e.message;}};
    const history=node('details');history.append(node('summary','ファイルを探さず、このPCの解析履歴から選ぶ'),sources);d.append(preview,status,history,button('閉じる',()=>d.close()));d.showModal();
    try{const {batches}=await api('/api/batches');const render=()=>{list.replaceChildren();for(const batch of batches.filter(b=>(b.title+' '+b.folder).toLowerCase().includes(search.value.toLowerCase()))){const row=node('div',undefined,'lab-list-row');row.append(node('strong',batch.title),node('p',`${batch.matches}試合 · ${batch.date} · ${batch.folder}`));const b=button('完成結果を確認',async()=>{b.disabled=true;status.textContent='完成結果を確認しています…';try{showPreview(await post('/api/prepare-import',{id:batch.id}));status.textContent='';}finally{b.disabled=false;}});row.append(b);list.append(row);}};search.oninput=render;render();}catch(e){status.textContent=e.message;}
}
async function openPublication(){
    const result=await api('/api/public-preview'),d=dialog('公開する内容を確認');d.append(node('p',`公開 ${result.records.length}件 / このPCだけ ${result.privateCount}件`),node('p','公開する資料・解析結果・公開メモだけを送信します。動画はYouTubeへのリンクです。'));
    const list=node('div',undefined,'lab-scroll');for(const r of result.records)list.append(node('p',r.title));const status=node('p');
    const publish=button('Labに公開する',async()=>{publish.disabled=true;status.textContent='公開サイトに反映しています…';try{const value=await post('/api/publish',{digest:result.digest});status.textContent=value.message;}catch(e){status.textContent=e.message;}finally{publish.disabled=false;}});publish.classList.add('lab-primary');
    d.append(list,publish,button('公開用ファイルだけ保存',async()=>{const value=await post('/api/export-public',{digest:result.digest});status.textContent=value.message;}),button('閉じる',()=>d.close()),status);d.showModal();
}
async function openAnalysis(){const result=await post('/api/open-native',{});notice(result.message);}
function openBookmark(video){
    const time=window.labVideoTime?.();const nativeTime=(Number.isFinite(time)?time:0)-(video.youtubeId?(video.youtubeOffsetSeconds||0):0);
    const match=video.labMatches.find(r=>r.startSeconds<=nativeTime&&r.endSeconds>=nativeTime);const target=match||videoRecord(video);
    const d=dialog('現在位置にメモを追加'),form=node('form');d.append(form);const seconds=field(form,'動画の時刻（秒）','seconds',Number.isFinite(time)?time.toFixed(2):0,'number');seconds.min=0;seconds.step='.01';
    const note=field(form,'メモ','note','','textarea');note.required=true;field(form,'タグ（カンマ区切り）','tags');field(form,'公開範囲','visibility','private','text',[['private','このPCだけ'],['public','公開する']]);
    footer(d,form,'メモを追加する',async()=>{const v=Object.fromEntries(new FormData(form));const mark={seconds:Number(v.seconds)-(match&&video.youtubeId?(video.youtubeOffsetSeconds||0):0),note:v.note,tags:v.tags.split(',').map(t=>t.trim()).filter(Boolean),visibility:v.visibility};
        await post('/api/records',{...target,bookmarks:[...(target.bookmarks||[]),mark]});d.close();await refresh(true);notice('時刻付きメモを追加しました。');});d.showModal();
}

// Video/replay additions are attached to the existing router and YouTube player.
function boardElement(board,label,player=null){
    const wrap=node('div',undefined,'lab-board-block'),grid=node('div',undefined,'lab-board');wrap.append(node('div',label),grid);
    const cells=typeof board==='string'?board:(board||[]).flat().map(c=>c||'_').join('');
    for(const value of cells.padStart(400,'_').slice(-200))grid.append(node('span',undefined,'lab-cell lab-'+(/^[IOTLSJZG]$/.test(value)?value:'empty')));
    if(player){const queue=node('div',undefined,'lab-queue');queue.append(node('small','HOLD','lab-queue-label'),player.hold?mino(player.hold):node('span','なし'));
        queue.append(node('small','手元・NEXT','lab-queue-label'));const pieces=node('div',undefined,'lab-queue-pieces');for(const piece of ((player.active||'')+(player.next||'')).replace(/[^IOTLSJZ]/g,'').slice(0,7))pieces.append(mino(piece));queue.append(pieces);wrap.append(queue);}
    return wrap;
}
function mino(piece){
    const shapes={I:[[0,1],[1,1],[2,1],[3,1]],O:[[1,0],[2,0],[1,1],[2,1]],T:[[1,0],[0,1],[1,1],[2,1]],S:[[1,0],[2,0],[0,1],[1,1]],Z:[[0,0],[1,0],[1,1],[2,1]],J:[[0,0],[0,1],[1,1],[2,1]],L:[[2,0],[0,1],[1,1],[2,1]]};
    const colors={I:'#4ec7cd',O:'#eac44a',T:'#b56fc7',S:'#82c964',Z:'#e97d7d',J:'#587aca',L:'#e0a15a'};const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox','0 0 36 20');svg.classList.add('lab-mino');svg.setAttribute('role','img');svg.setAttribute('aria-label',piece+'ミノ');
    for(const[x,y]of shapes[piece]||[]){const rect=document.createElementNS(svg.namespaceURI,'rect');for(const[k,v]of Object.entries({x:x*8+2,y:y*8+2,width:8,height:8,fill:colors[piece]}))rect.setAttribute(k,v);svg.append(rect);}return svg;
}
const watchedJobs=new Set();
function watchJob(job){watchedJobs.add(job.id);state.jobs=[...state.jobs.filter(j=>j.id!==job.id),job];renderScoreWidgets();}
function renderScoreWidgets(){for(const widget of state.scoreWidgets){if(!widget.element.isConnected)state.scoreWidgets.delete(widget);else widget.render();}}
async function scoreMatches(matches){
    if(state.scorePending)return;
    const ids=matches.map(r=>r.id);state.scorePending=ids;state.scoreError=null;renderScoreWidgets();
    try{const job=await post('/api/score',{ids});watchJob(job);notice('AI採点を開始しました。進捗は各試合の行に表示します。');}
    catch(error){state.scoreError={ids,message:error.message};notice(error.message,true);}
    finally{state.scorePending=null;renderScoreWidgets();}
}
function scoreWidget(matches,label,compact=false){
    const element=node('div',undefined,'lab-score-widget'+(compact?' lab-score-compact':'')),actions=node('div',undefined,'lab-score-actions'),status=node('p',undefined,'lab-score-status'),progress=node('progress'),detail=node('small',undefined,'lab-score-detail');
    const ids=new Set(matches.map(r=>r.id));if(matches.length===1)element.dataset.scoreRecord=matches[0].id;
    status.setAttribute('role','status');progress.setAttribute('aria-label',matches.length===1?'この試合の採点進捗':'動画の採点進捗');
    const start=button(label,()=>scoreMatches(matches)),result=button(matches.length===1?'採点結果を見る':'研究ノートを開く',()=>window.router('research',matches.length===1?matches[0].id:null));
    actions.append(start,result);element.append(actions,status,progress,detail);
    const render=()=>{
        const running=state.jobs.find(j=>j.kind==='score'&&j.status==='running'),related=[...state.jobs].reverse().find(j=>j.kind==='score'&&((j.recordIds||[]).some(id=>ids.has(id))||(j.matches||[]).some(m=>ids.has(m.id))));
        const items=(related?.matches||[]).filter(m=>ids.has(m.id)),pending=state.scorePending?.some(id=>ids.has(id)),error=state.scoreError?.ids.some(id=>ids.has(id))?state.scoreError.message:state.jobsError;
        const done=items.reduce((n,m)=>n+(m.completed||0),0),total=items.reduce((n,m)=>n+(m.total||0),0),ownStatus=matches.length===1?items[0]?.status:null;
        const active=related?.status==='running';
        start.disabled=!!(state.scorePending||running)||!matches.some(m=>m.status==='complete'&&m.simulator?.combined);
        start.textContent=pending?'開始中…':active?(ownStatus==='queued'?'順番待ち':ownStatus==='scored'?'保存待ち':'採点中…'):label;
        element.classList.toggle('is-running',!!active||!!pending);status.classList.toggle('lab-form-error',!!error||related?.status==='failed');
        progress.hidden=!active&&!pending;progress.max=Math.max(1,total);if(total)progress.value=done;else progress.removeAttribute('value');
        detail.textContent=matches.length===1?(items[0]?.players||[]).map(p=>`${p.player.toUpperCase()} ${p.completed} / ${p.total}手`).join(' · '):total?`${items.length<matches.length?`直近の採点対象 ${items.length} / ${matches.length}試合 · `:''}${done} / ${total}手 · 完了 ${items.filter(m=>['complete','scored'].includes(m.status)).length} / ${items.length}試合`:'';
        result.hidden=related?.status!=='complete'||ownStatus==='stale';
        if(error)status.textContent=error;
        else if(pending)status.textContent='採点を開始しています…';
        else if(active)status.textContent=ownStatus==='queued'?'順番待ち':ownStatus==='scored'?'採点終了 · 候補を保存しています':total?`採点中 · ${Math.floor(done/total*100)}%`:(related.progress||'採点を準備しています…');
        else if(ownStatus==='stale')status.textContent='完成結果が更新されたため、もう一度採点してください。';
        else if(related?.status==='complete')status.textContent=`採点完了 · 候補 ${items.reduce((n,m)=>n+(m.candidates||0),0)}件${related.cached===related.tasks?'（保存済みの結果）':''}`;
        else if(related)status.textContent=related.status==='cancelled'?'採点を中止しました':related.status==='interrupted'?'採点が中断されました。もう一度実行できます。':related.progress;
        else status.textContent=running?'ほかの試合を採点中です。完了後に実行できます。':start.disabled?'解析失敗のため採点できません。':'未採点';
    };
    state.scoreWidgets.add({element,render});render();return element;
}
async function scoringSettings(){
    const current=await api('/api/scoring-settings'),d=dialog('AI採点の設定'),form=node('form');d.append(form,node('p','この設定を次回も使います。動画ページの採点ボタンで、候補の保存までまとめて実行します。','lab-help-text'));
    field(form,'採点するプレイヤー','players',current.players,'text',[['both','P1・P2の両方'],['p1','P1のみ'],['p2','P2のみ']]);
    for(const[key,label,min,max]of [['nodeBudget','各手で考える量',500,20000],['detailNodeBudget','気になる手を詳しく調べる量',5000,100000],['thresholdScore','候補にする評価差（点）',100,5000],['planLength','候補に残す手順の長さ',1,12],['parallelism','同時に採点する組数',1,4]]){const el=field(form,label,key,current[key],'number');el.min=min;el.max=max;el.step=1;}
    form.append(node('p','考える量を増やすほど時間がかかります。同時採点は別の試合・プレイヤーを分担し、各手の考える量は変えません。同じデータ・設定の完了結果は再利用します。','lab-help-text'));
    footer(d,form,'設定を保存',async()=>{const value=Object.fromEntries(new FormData(form));for(const key of Object.keys(value))if(key!=='players')value[key]=Number(value[key]);await post('/api/scoring-settings',value);d.close();notice('採点設定を保存しました。');});d.showModal();
}
function replayPages(match){
    if(state.replays.has(match.id))return state.replays.get(match.id);
    if(match.status!=='complete'||!match.simulator?.combined)return [];
    let replay=stateFromUrl(match.simulator.combined);if(window.TetrisEventCodec.isEventReplay(replay))replay=window.TetrisEventCodec.decodeCollection(replay,{compactBoards:true});
    const pages=replay.cases?.[replay.currentCase||0]?.pages||[];state.replays.set(match.id,pages);return pages;
}
function timeOffset(video){return video.youtubeId?Number(video.youtubeOffsetSeconds)||0:0;}
function mountPlayback(video,left){
    const wrapper=left.querySelector('.video-wrapper'),status=node('p',undefined,'lab-playback-status');
    status.setAttribute('role','status');wrapper.after(status);
    if(!video.youtubeId){status.textContent=state.token?'動画・解析結果を編集からYouTubeのリンクを設定してください。':'YouTubeのリンクはまだ登録されていません。';return;}
    const target=node('div');target.id='yt-player-detail';wrapper.replaceChildren(target);
    window.startDetailYouTube(video.youtubeId,{title:video.title,initialTime:(video.labMatches[0]?.startSeconds||0)+timeOffset(video),
        onReady:()=>{status.textContent='';status.classList.remove('lab-form-error');},
        onError:code=>{status.classList.toggle('lab-form-error',code!=='timeout');status.textContent=code==='timeout'?'動画の再生ボタンを押してください。時刻連動の接続を待っています。':[101,150].includes(code)?'この動画はYouTube側で埋め込み再生が許可されていません。':code===100?'動画が削除されたか、非公開になっています。':`YouTubeを読み込めませんでした（${code}）。ページを再読み込みしてください。`;}});
}
function mountVideo(video){
    const left=document.querySelector('.video-sticky-area'),right=document.querySelector('.video-detail-container > .article-body');if(!left||!right)return;
    mountPlayback(video,left);
    if(state.token){const controls=node('div',undefined,'lab-inline-actions');controls.append(button('動画・解析結果を編集',()=>openVideoSettings(video)),button('現在位置にメモを追加',()=>openBookmark(video)));
        const original=byId(video.labRecordId);if(original)controls.append(button('本文・タグを編集',()=>openEdit(original)));left.append(controls);}
    if(video.youtubeId){const links=node('div',undefined,'lab-source-link'),a=node('a','元のYouTubeを開く');a.href='https://www.youtube.com/watch?v='+video.youtubeId;a.target='_blank';a.rel='noopener';links.append(a,button('リンクをコピー',async()=>{await navigator.clipboard.writeText(a.href);notice('元動画のリンクをコピーしました。');}));left.append(links);}
    const marks=[];for(const mark of videoRecord(video).bookmarks||[])marks.push({...mark,displaySeconds:mark.seconds});
    for(const match of video.labMatches)for(const mark of match.bookmarks||[])marks.push({...mark,displaySeconds:mark.seconds+timeOffset(video)});
    if(marks.length){const section=node('section',undefined,'lab-analysis-panel');section.append(node('h2','追加したメモ'));
        for(const mark of marks.sort((a,b)=>a.displaySeconds-b.displaySeconds)){const row=node('div',undefined,'lab-bookmark');row.append(button('▶ '+timeText(mark.displaySeconds),()=>window.seekDetailVideo(mark.displaySeconds),'ts-link'),node('p',mark.note));tags(row,mark.tags);section.append(row);}right.append(section);}
    if(!video.labMatches.length)return;
    const section=node('section',undefined,'lab-analysis-panel');section.append(node('h2',`動画解析 · ${video.labMatches.length}試合`));
    if(state.token){section.append(scoreWidget(video.labMatches,'この動画をまとめてAI採点'),button('AI採点の設定',scoringSettings));}
    const filter=node('input',undefined,'lab-tag-filter');filter.placeholder='選手・タグ・メモから試合を絞り込む';filter.setAttribute('aria-label','解析した試合を絞り込む');section.append(filter);
    const list=node('div',undefined,'lab-match-list');section.append(list);right.prepend(section);
    const work=node('section',undefined,'lab-workbench'),title=node('h3','解析した試合を選択してください'),positionText=node('p',undefined,'lab-position');
    const followLabel=node('label',undefined,'lab-follow'),follow=node('input');follow.type='checkbox';follow.checked=true;followLabel.append(follow,'動画に局面を合わせる');
    const slider=node('input');slider.type='range';slider.min=0;slider.max=0;slider.value=0;slider.setAttribute('aria-label','解析した局面');
    const boards=node('div',undefined,'lab-boards'),actions=node('div',undefined,'lab-inline-actions'),matchActions=node('div',undefined,'lab-inline-actions');
    const player=node('select');player.setAttribute('aria-label','研究するプレイヤー');for(const[value,label]of [['both','P1・P2を一緒に見る'],['p1','P1を研究する'],['p2','P2を研究する']]){const o=node('option',label);o.value=value;player.append(o);}
    const steps=node('div',undefined,'lab-inline-actions');steps.append(button('前の局面',()=>{slider.value=Math.max(0,Number(slider.value)-1);slider.oninput();}),button('次の局面',()=>{slider.value=Math.min(pages.length-1,Number(slider.value)+1);slider.oninput();}),player);
    work.append(title,matchActions,followLabel,positionText,slider,steps,boards,actions);left.append(work);
    let selected=null,pages=[],lastPosition=-1,lastSeekAt=0;const rows=new Map();
    const renderList=()=>{list.replaceChildren();rows.clear();const query=filter.value.toLowerCase();
        for(const [index,match]of video.labMatches.entries()){
            if(query&&!JSON.stringify([match.title,match.players,match.tags,match.bookmarks]).toLowerCase().includes(query))continue;
            const row=node('div',undefined,'lab-match-row'+(selected?.id===match.id?' active':''));rows.set(match.id,row);
            row.append(button('▶ '+timeText(match.startSeconds+timeOffset(video)),()=>{choose(match);window.seekDetailVideo(match.startSeconds+timeOffset(video));},'ts-link'),node('strong',`試合 ${match.analysis?.index||index+1}`));
            row.append(node('p',(match.players||[]).filter(Boolean).join(' / ')));if(match.status==='failed')row.append(node('span','解析失敗','lab-failed'));else row.append(node('small',({reviewed:'確認済み',edited:'手直し済み・再確認待ち'})[match.reviewState]||'動画との確認前'));tags(row,match.tags);if(state.token&&match.status==='complete')row.append(scoreWidget([match],'この試合を採点',true));list.append(row);
        }};
    const showPosition=index=>{if(!selected||!pages.length)return;index=Math.max(0,Math.min(index,pages.length-1));if(index===lastPosition)return;lastPosition=index;slider.value=index;
        const page=pages[index],seconds=selected.startSeconds+(page.time||0);positionText.textContent=`局面 ${index+1} / ${pages.length} · 動画 ${timeText(seconds+timeOffset(video))}`;
        boards.replaceChildren(boardElement(page.p1?.board,'P1',page.p1));if(page.p2)boards.append(boardElement(page.p2.board,'P2',page.p2));actions.replaceChildren();
        const reference={...selected,startSeconds:seconds,phase:index,player:player.value,_matchStart:selected.startSeconds};const data=pageState(page,player.value);
        actions.append(button('ここから練習',()=>openTool('sim',data,reference)));
        if(state.token)actions.append(button('研究ノートに保存',()=>research.capture(data,reference)));};
    const choose=match=>{if(selected?.id===match.id)return;selected=match;lastPosition=-1;for(const[id,row]of rows)row.classList.toggle('active',id===match.id);
        title.textContent=match.title;pages=replayPages(match);slider.max=Math.max(0,pages.length-1);slider.disabled=!pages.length;actions.replaceChildren();boards.replaceChildren();matchActions.replaceChildren();
        if(!pages.length){positionText.textContent='解析失敗：この試合の結果は確定していません。';return;}
        showPosition(0);
        if(state.token){matchActions.append(scoreWidget([match],'この試合をAI採点'),node('small','解析結果の修正はPCの配信解析で行い、完成後にもう一度取り込んでください。','lab-help-text'));}
    };
    const sync=seconds=>{if(!Number.isFinite(seconds))return;const native=seconds-timeOffset(video);const match=video.labMatches.find(r=>r.startSeconds<=native&&r.endSeconds>=native);if(!match)return;choose(match);
        let low=0,high=pages.length;while(low<high){const middle=(low+high)>>1;if((pages[middle].time||0)<=native-match.startSeconds)low=middle+1;else high=middle;}showPosition(Math.max(0,low-1));};
    state.onSeek=seconds=>{lastSeekAt=Date.now();sync(seconds);};slider.oninput=()=>{showPosition(Number(slider.value));window.seekDetailVideo(selected.startSeconds+(pages[Number(slider.value)]?.time||0)+timeOffset(video));};
    player.onchange=()=>{const index=lastPosition;lastPosition=-1;showPosition(index);};filter.oninput=renderList;renderList();choose(video.labMatches[0]);
    state.timer=setInterval(()=>{if(!work.isConnected){clearInterval(state.timer);return;}if(follow.checked&&Date.now()-lastSeekAt>800)sync(window.labVideoTime?.());},250);
}
async function saveSnapshot(data,reference){
    const record=await post('/api/records',{kind:'tetofu',title:(reference.title+' · '+timeText(reference.startSeconds||0)).slice(0,250),tags:reference.tags||[],snapshot:data,parentId:reference.id,
        youtubeId:reference.youtubeId||'',startSeconds:reference.startSeconds||0,youtubeOffsetSeconds:reference.youtubeOffsetSeconds||0,visibility:'private',
        sourceRef:research.sourceRef(reference),research:{stage:'candidate',notes:''}});
    await refresh(true);notice('局面をテト譜の資料として追加しました。元の解析結果はそのまま残しています。');return record;
}
function openTool(kind,data,reference){
    try{detailPlayer?.pauseVideo?.();}catch{}
    const d=dialog(reference._scoring?`${reference.player.toUpperCase()}の試合をAI採点`:kind==='sim'?'シミュレーターで試す':'エディタで検討する',true),actions=node('div',undefined,'lab-inline-actions'),frame=node('iframe',undefined,'lab-tool-frame');
    frame.title=kind==='sim'?'シミュレーター':'エディタ';frame.setAttribute('sandbox','allow-scripts allow-same-origin allow-downloads');
    const base=state.token?state.toolOrigin+'/':'https://selmtoe.github.io/Tetris_Simulator/';
    const originalP2=kind==='editor'&&data.m==='1P'&&(reference.player||reference.sourceRef?.player)==='p2';
    frame.src=base+(kind==='editor'?'F/':'')+(originalP2?'?labPlayer=p2':'')+'#'+encodeState(data);
    const context={frame,kind,reference,pending:null};state.tools.set(d,context);
    const request=action=>{context.pending=action;frame.contentWindow.postMessage({type:state.token?'requestLabState':'requestState'},state.toolOrigin);};
    if(state.token)actions.append(button('今の内容を資料に保存',()=>request('save')));
    if(state.token&&reference.kind==='tetofu'&&reference.snapshot)actions.append(button('この資料を更新',()=>request('update')));
    if(state.token&&kind==='editor'){
        actions.append(button('表示中の局面を研究ノートに保存',()=>request('research')),button('AI採点を開く',()=>frame.contentWindow.postMessage({type:'openLabScoring'},state.toolOrigin)),button('採点結果を取り込む',()=>{context.pending='score';frame.contentWindow.postMessage({type:'requestLabScore'},state.toolOrigin);}));
    }
    actions.append(button(kind==='sim'?'エディタへ渡す':'シミュレーターへ渡す',()=>request(kind==='sim'?'editor':'sim')),button('操作ガイド',()=>research.guide('editor')),button('閉じる',()=>d.close()));
    d.append(node('p',kind==='editor'?'盤面の色を選んでマスを塗ります。「前の局面」「次の局面」で移動します。保存先は上のボタンから選べます。':'練習後の手順は「今の内容を資料に保存」で残せます。','lab-help-text'),actions,frame);d.showModal();
}
window.addEventListener('message',event=>{
    if(event.origin!==state.toolOrigin)return;
    for(const[d,context]of state.tools){if(event.source!==context.frame.contentWindow)continue;
        if(event.data?.type==='labScoreResponse'&&context.pending==='score'){context.pending=null;try{research.scoreReport(event.data.report,context.reference);}catch(error){let p=d.querySelector('.lab-action-status');if(!p){p=node('p',undefined,'lab-form-error lab-action-status');d.prepend(p);}p.textContent=error.message;}return;}
        if(event.data?.type==='loadFumen'&&event.data?.target==='editor'){const data=event.data.data;if(data&&[2,3,4].includes(Number(data.v))){d.close();openTool('editor',data,context.reference);}return;}
        if(event.data?.type!=='saveSnapshotResponse'||event.data?.target!=='hub'||!context.pending)return;
        const action=context.pending;context.pending=null;const data=event.data.data;if(!data||![2,3,4].includes(Number(data.v)))return;
        if(action==='research'){
            const current=event.data.current;if(!current?.page)return;const ref={...context.reference,phase:current.pageIndex};if(Number.isFinite(current.page.time))ref.startSeconds=(ref._matchStart??ref.startSeconds??0)+current.page.time;
            research.capture(pageState(current.page,context.reference.player==='p2'&&!context.reference._scoring?'p2':'p1'),ref);
        }else if(action==='update')post('/api/records',{id:context.reference.id,revision:context.reference.revision,snapshot:data}).then(async()=>{d.close();await refresh();notice('この資料の盤面・手順を更新しました。');}).catch(e=>notice(e.message,true));
        else if(action==='save')saveSnapshot(data,context.reference).then(()=>d.close()).catch(e=>notice(e.message,true));else{d.close();openTool(action,data,{...context.reference,_fullMatch:false});}return;
    }
});
function decorateCard(card,item){
    if(item.type==='テト譜'&&item.snapshot){card.onclick=()=>research.openDetail(byId(item.labRecordId)||item);}
    if(state.token&&item.labRecordId){const record=byId(item.labRecordId);if(record)card.prepend(button('編集',()=>openEdit(record),'btn-outline lab-card-edit'));}
    if(item.type==='動画'&&item.labMatches?.length){const count=node('div',`解析 ${item.labMatches.length}試合 · 動画と局面を一緒に確認`,'lab-analysis-count');card.append(count);}
}
function afterRoute(page,id){clearInterval(state.timer);state.timer=null;state.onSeek=null;
    if(page==='videos'&&id){const video=state.videos.find(v=>v.id===id);if(video)mountVideo(video);}
    if(page==='articles'&&id){const record=state.records.find(r=>r.kind==='article'&&recordId(r)===id);if(record){if(state.token)document.querySelector('.article-header')?.append(button('この記事を編集',()=>openEdit(record)));research.renderCitations(record);}}
    if(page==='videos'&&id&&state.pendingSource){const ref=state.pendingSource;state.pendingSource=null;window.seekDetailVideo(ref.seconds+(ref.youtubeId?(ref.youtubeOffsetSeconds||0):0));}
}
function renderAnalysis(){const main=document.getElementById('main-view');main.replaceChildren(node('h2','動画解析','section-title'));const list=node('div',undefined,'list-container');main.append(list);
    for(const video of state.videos.filter(v=>v.labMatches.length))window.renderCard(list,{...video,type:'動画',action:()=>window.router('videos',video.id)});
    if(!list.children.length)list.append(node('p','公開されている解析結果はまだありません。'));}
const research=createResearch({state,node,button,dialog,field,footer,post,refresh,notice,boardElement,openTool,openEdit,recordId,byId,tags});
window.LabExtension={afterRoute,decorateCard,renderAnalysis,renderResearch:research.renderWorkspace,onSeek:seconds=>state.onSeek?.(seconds)};
const ownerbar=node('div',undefined,'lab-ownerbar');ownerbar.hidden=true;const status=node('p',undefined,'lab-status');status.id='lab-status';status.setAttribute('role','status');document.querySelector('header').after(ownerbar,status);
try{const response=['127.0.0.1','localhost'].includes(location.hostname)?await fetch('/api/session'):null;if(response?.ok&&response.headers.get('Content-Type')?.includes('application/json')){const session=await response.json();state.token=session.token;state.toolOrigin=session.toolOrigin;}}catch{}
if(state.token){ownerbar.hidden=false;ownerbar.append(node('small','このPCで編集できます'),button('記事を書く',()=>openEdit()),button('動画・リンクを追加',()=>openEdit({kind:'video'})),button('完成結果を取り込む',openImports),button('PCの配信解析を開く',openAnalysis),button('公開管理',openPublication),button('バックアップ',async()=>{await post('/api/backup',{});notice('このPCにバックアップを保存しました。');}));
    ownerbar.append(button('研究ノート',()=>window.router('research')),button('使い方',()=>research.guide()));
    const advanced=node('a','詳細管理','btn-outline');advanced.href='library.html';ownerbar.append(advanced);
    const activeJobs=node('div',undefined,'lab-ownerbar');activeJobs.hidden=true;status.after(activeJobs);
    let pollingJobs=false;
    const pollJobs=async()=>{if(pollingJobs)return;pollingJobs=true;try{const{jobs}=await api('/api/jobs');state.jobs=jobs;state.jobsError=null;const running=jobs.filter(j=>j.status==='running');activeJobs.replaceChildren();activeJobs.hidden=!running.length;
        for(const job of running)activeJobs.append(node('small',job.title+'：'+job.progress),button('中止',async()=>{await post('/api/cancel',{id:job.id});notice('解析を中止しました。');}));
        const ended=jobs.filter(j=>watchedJobs.has(j.id)&&j.status!=='running');if(ended.length){const data=await api('/api/records');state.records=data.records;rebuildViews();window.dispatchEvent(new Event('lab-records-updated'));
            if(!state.writing&&!document.querySelector('dialog[open]')&&!location.hash.startsWith('#videos/'))window.dispatchEvent(new HashChangeEvent('hashchange'));
            notice(ended.map(j=>j.progress).join(' '),ended.some(j=>j.status==='failed'));for(const j of ended)watchedJobs.delete(j.id);}for(const j of running)watchedJobs.add(j.id);
    }catch{state.jobsError='進捗を取得できません。接続が戻ると再表示します。';}finally{pollingJobs=false;renderScoreWidgets();}};
    pollJobs();setInterval(pollJobs,1500);
}
try{await refresh();}catch(error){notice('追加データを読み込めませんでした。既存の資料は引き続き使えます。',true);}
