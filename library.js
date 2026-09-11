import {youtubeId,timeText,encodeState,stateFromUrl,pageState,unpackLabelBoard} from './library-tools.js';
const $=id=>document.getElementById(id);
const state={items:[],token:null,selected:null,trash:false,toolOrigin:'https://selmtoe.github.io',toolFrame:null,pending:null,batches:[],digest:null};
const types={article:'記事',video:'動画',tetofu:'テト譜',match:'解析した試合'};
const el=(tag,text,cls)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n;};
const button=(label,action,secondary=false)=>{const b=el('button',label,secondary?'secondary':'');b.type='button';b.onclick=()=>Promise.resolve().then(action).catch(e=>message(e.message,true));return b;};
function message(text,error=false){$('message').textContent=text;$('message').className=error?'error':'';}
async function api(path,options={}) {
    const response=await fetch(path,{...options,headers:{'Content-Type':'application/json',...(state.token?{'X-Lab-Token':state.token}:{}),...options.headers}});
    const body=await response.json();if(!response.ok)throw Error(body.error||'操作に失敗しました');return body;
}
const post=(path,value)=>api(path,{method:'POST',body:JSON.stringify(value)});
function safeUrl(value){if(!value)return null;try{const u=new URL(value,location.href);return ['http:','https:'].includes(u.protocol)?u.href:null;}catch{return null;}}
function link(parent,label,url){const href=safeUrl(url);if(!href)return;const a=el('a',label);a.href=href;a.target='_blank';a.rel='noopener';parent.append(a);}
function richText(content,seek){
    const container=el('div',undefined,'notes');
    const inline=(parent,text)=>{
        const pattern=/\*\*([^*]+)\*\*|\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g;let last=0;
        for(const match of text.matchAll(pattern)){parent.append(text.slice(last,match.index));if(match[1])parent.append(el('strong',match[1]));else link(parent,match[2],match[3]);last=match.index+match[0].length;}parent.append(text.slice(last));
    };
    for(const raw of String(content).split('\n')){
        const line=raw.trim();if(!line)continue;
        const heading=line.match(/^(#{1,4})\s+(.+)/);if(heading){const title=el(heading[1].length<3?'h2':'h3');inline(title,heading[2]);container.append(title);continue;}
        const timestamp=line.match(/^\[([\d:]+)\](?:\{([^}]*)\})?\s*(.*)/);
        if(timestamp){const row=el('p');const seconds=timestamp[1].split(':').reduce((sum,n)=>sum*60+Number(n),0);row.append(button(timestamp[1],()=>seek(seconds),true));if(timestamp[2])row.append(' ',el('span',timestamp[2],'tag'));row.append(' ');inline(row,timestamp[3]);container.append(row);continue;}
        if(/^<(img|iframe)\s/i.test(line)){
            const parsed=new DOMParser().parseFromString(line,'text/html').body.firstElementChild;
            const url=safeUrl(parsed?.getAttribute('src'));if(!url)continue;
            if(parsed.tagName==='IMG'){const img=el('img');img.src=url;img.alt=parsed.getAttribute('alt')||'';img.loading='lazy';container.append(img);}
            else if(parsed.tagName==='IFRAME'&&['selmtoe.github.io','www.youtube.com','www.youtube-nocookie.com'].includes(new URL(url).hostname)){
                const frame=el('iframe');frame.src=url;frame.title='記事内の資料';frame.loading='lazy';frame.setAttribute('sandbox','allow-scripts allow-same-origin');container.append(frame);
            }continue;
        }
        const p=el('p');inline(p,line.replace(/<br\s*\/?\s*>/gi,'\n'));container.append(p);
    }
    return container;
}
function renderList(){
    const query=$('search').value.toLocaleLowerCase(),kind=$('kind').value,status=$('status').value;
    const items=state.items.filter(r=>(!kind||r.kind===kind)&&(!status||r.status===status)&&JSON.stringify([r.title,r.tags,r.description,r.content,r.players,r.bookmarks]).toLocaleLowerCase().includes(query));
    state.filtered=items;
    $('counts').textContent=`${state.trash?'ごみ箱 · ':''}${items.length}件 / 全${state.items.length}件`;$('list').replaceChildren();
    for(const r of items){const b=el('button',undefined,'entry'+(r.id===state.selected?' active':''));
        b.append(el('span',`${types[r.kind]||r.kind} · ${r.date||''}${r.visibility==='private'?' · このPCだけ':''}`,'meta'),el('strong',r.title));
        if(r.players?.some(Boolean))b.append(el('div',r.players.filter(Boolean).join(' / '),'meta'));
        const tags=el('div',undefined,'tags');if(r.status)tags.append(el('span',r.status==='complete'?'解析成功':'解析失敗',r.status==='complete'?'tag':'tag failed'));
        for(const t of r.tags||[])tags.append(el('span',t,'tag'));b.append(tags);b.onclick=()=>select(r.id);$('list').append(b);
    }
    if(!items.length)$('list').append(el('p','該当する資料がありません。','empty'));
}
function boardView(board,label){
    const wrap=el('div',undefined,'board-wrap');wrap.append(el('span',label,'meta'));const grid=el('div',undefined,'board');
    const text=typeof board==='string'?board:(board||[]).flat().map(c=>c||'_').join('');
    for(const cell of text.padStart(400,'_').slice(-200)){const square=el('span');square.className='cell c-'+(/^[IOTLSJZG]$/.test(cell)?cell:'empty');grid.append(square);}wrap.append(grid);return wrap;
}
function select(id){
    const r=state.items.find(x=>x.id===id);if(!r)return;state.selected=id;state.toolFrame=null;state.pending=null;
    location.hash=`record/${encodeURIComponent(id)}`;renderList();const d=$('detail');d.replaceChildren(el('h1',r.title),el('div',`${types[r.kind]} · ${r.date||''}`,'meta'));
    if(state.trash){d.append(button('資料を戻す',async()=>{await post('/api/trash',{id:r.id,revision:r.revision,restore:true});await reload();message('資料を戻しました。');}));return;}
    if(r.status==='failed')d.append(el('p','解析失敗：この試合の結果は確定していません。','error'));
    if(r.description)d.append(el('p',r.description));
    const actions=el('div',undefined,'actions');link(actions,'外部リンク',r.url||r.externalUrl);
    const youtubeTime=seconds=>Math.max(0,Math.floor((seconds||0)+(r.youtubeOffsetSeconds||0)));
    if(r.youtubeId)link(actions,'YouTubeで試合の開始位置を開く',`https://www.youtube.com/watch?v=${r.youtubeId}&t=${youtubeTime(r.startSeconds)}s`);
    if(state.token)actions.append(button('編集する',()=>openForm(r)));d.append(actions);
    let youtubeFrame=null;
    if(r.youtubeId&&/^[\w-]{11}$/.test(r.youtubeId)){youtubeFrame=el('iframe');youtubeFrame.src=`https://www.youtube.com/embed/${r.youtubeId}?start=${youtubeTime(r.startSeconds)}&playsinline=1`;youtubeFrame.title=r.title;youtubeFrame.allow='autoplay; encrypted-media; picture-in-picture; fullscreen';youtubeFrame.allowFullscreen=true;youtubeFrame.referrerPolicy='strict-origin-when-cross-origin';d.append(youtubeFrame);}
    const seek=seconds=>{if(youtubeFrame)youtubeFrame.src=`https://www.youtube.com/embed/${r.youtubeId}?start=${youtubeTime(seconds)}&autoplay=1&playsinline=1`;};
    if(r.content){const details=el('details');details.open=true;details.append(el('summary','本文・メモ'),richText(r.content,seek));d.append(details);}
    const replay=r.snapshot||(()=>{try{return stateFromUrl(r.simulator?.combined||r.url);}catch{return null;}})();
    const tools=el('section');d.append(tools);
    if(replay&&r.status!=='failed')renderReplay(r,replay,tools,seek);
    renderBookmarks(r,d,seek);
    const related=state.items.filter(x=>x.parentId===r.id||x.id===r.parentId);
    if(related.length){d.append(el('h2','関連する資料'));for(const item of related)d.append(button(item.title,()=>select(item.id),true));}
}
function renderReplay(record,replay,container,seek){
    const actions=el('div',undefined,'actions');
    actions.append(button('シミュレーターで開く',()=>openTool('sim',replay,container)),button('エディタで開く',()=>openTool('editor',replay,container),true));container.append(actions);
    let collection=replay;
    if(window.TetrisEventCodec?.isEventReplay(replay))collection=window.TetrisEventCodec.decodeCollection(replay,{compactBoards:true});
    const cases=collection?.v===3?collection.cases:[];if(!cases?.length)return;
    const caseSelect=el('select');caseSelect.setAttribute('aria-label','テト譜のケース');
    cases.forEach((c,i)=>{const o=el('option',c.name||`ケース ${i+1}`);o.value=i;caseSelect.append(o);});
    const position=el('input');position.type='range';position.min=0;position.value=0;position.setAttribute('aria-label','局面');
    const caption=el('p',undefined,'meta'),boards=el('div',undefined,'boards'),controls=el('div',undefined,'actions');
    const page=()=>cases[Number(caseSelect.value)||0].pages?.[Number(position.value)]||{};
    const update=()=>{const pages=cases[Number(caseSelect.value)||0].pages||[];position.max=Math.max(0,pages.length-1);const current=page();caption.textContent=`局面 ${Number(position.value)+1} / ${pages.length} · 試合開始から ${timeText(current.time||0)}`;boards.replaceChildren(boardView(current.p1?.board,'P1'));if(current.p2)boards.append(boardView(current.p2.board,'P2'));};
    caseSelect.onchange=()=>{position.value=0;update();};position.oninput=update;
    const reference=()=>({...record,startSeconds:(record.startSeconds||0)+(page().time||0)});
    controls.append(button('動画のこの時刻へ',()=>seek(reference().startSeconds),true),button('この局面から練習',()=>openTool('sim',pageState(page()),container,reference())));
    if(state.token)controls.append(button('この局面を資料に保存',()=>saveSnapshot(pageState(page()),reference(),`${record.title} · ${timeText(page().time||0)}`),true));
    container.append(el('h2','試合の局面'),caseSelect,caption,position,boards,controls);update();
}
function openTool(kind,data,container,reference=null){
    container.querySelector('.tool-area')?.remove();const area=el('section',undefined,'tool-area');
    const frame=el('iframe');frame.className='tool';frame.title=kind==='sim'?'シミュレーター':'エディタ';
    // Isolate simulator custom rules from the private administration origin.
    frame.setAttribute('sandbox','allow-scripts allow-same-origin allow-downloads');
    const base=state.token?state.toolOrigin+'/':state.toolOrigin+'/Tetris_Simulator/';
    frame.src=base+(kind==='editor'?'F/':'')+'#'+encodeState(data);state.toolFrame=frame;
    const actions=el('div',undefined,'actions');
    const request=action=>{const pending={frame,action,parent:reference||state.items.find(r=>r.id===state.selected)};state.pending=pending;frame.contentWindow.postMessage({type:state.token?'requestLabState':'requestState'},state.toolOrigin);setTimeout(()=>{if(state.pending===pending){state.pending=null;message('画面の準備が終わってから、もう一度押してください。',true);}},5000);};
    if(state.token)actions.append(button('今の内容を資料に保存',()=>request('save')));
    actions.append(button(kind==='sim'?'エディタへ渡す':'シミュレーターへ渡す',()=>request(kind==='sim'?'editor':'sim'),true),button('閉じる',()=>{area.remove();state.toolFrame=null;state.pending=null;},true));
    area.append(actions,frame);container.append(area);
}
window.addEventListener('message',event=>{
    if(state.toolFrame&&event.origin===state.toolOrigin&&event.source===state.toolFrame.contentWindow&&event.data?.target==='editor'&&event.data?.type==='loadFumen'){
        const data=event.data.data;if(data&&[2,3,4].includes(Number(data.v)))openTool('editor',data,state.toolFrame.closest('.tool-area').parentElement);return;
    }
    const pending=state.pending;
    if(!pending||event.origin!==state.toolOrigin||event.source!==pending.frame.contentWindow||event.data?.type!=='saveSnapshotResponse'||event.data?.target!=='hub')return;
    state.pending=null;const data=event.data.data;
    if(!data||![2,3,4].includes(Number(data.v))){message('対応する盤面データを取得できませんでした。',true);return;}
    if(pending.action==='save')saveSnapshot(data,pending.parent,`${pending.parent.title} · 編集した局面`).catch(e=>message(e.message,true));
    else openTool(pending.action,data,pending.frame.closest('.tool-area').parentElement,pending.parent);
});
async function saveSnapshot(snapshot,parent,title){
    const saved=await post('/api/records',{kind:'tetofu',title:title.slice(0,250),tags:parent.tags||[],snapshot,parentId:parent.id,visibility:'private',youtubeId:parent.youtubeId||'',startSeconds:parent.startSeconds||0});
    state.selected=saved.id;location.hash='record/'+saved.id;await reload();message('元の解析結果を残して、新しい資料として保存しました。');
}
function renderBookmarks(record,container,seek){
    container.append(el('h2','時刻付きメモ'));
    for(const [index,mark] of (record.bookmarks||[]).entries()){
        const row=el('div',undefined,'bookmark');row.append(button(timeText(mark.seconds),()=>seek(mark.seconds),true),el('div',mark.note));
        if(state.token){row.append(el('small',mark.visibility==='public'?'公開':'このPCだけ'));row.append(button('削除',async()=>{const bookmarks=record.bookmarks.filter((_,i)=>i!==index);await post('/api/records',{id:record.id,revision:record.revision,bookmarks});await reload();},true));}container.append(row);
    }
    if(!state.token)return;
    const form=el('form');form.className='bookmark-form';const time=el('input');time.type='number';time.min=0;time.step=.01;time.value=record.startSeconds||0;time.required=true;time.setAttribute('aria-label','元動画の時刻（秒）');
    const note=el('textarea');note.placeholder='この場面で気付いたこと、次に試したいこと';note.setAttribute('aria-label','時刻付きメモ');note.required=true;note.rows=3;
    const visibility=el('select');visibility.setAttribute('aria-label','メモの公開範囲');for(const [v,t] of [['private','このPCだけ'],['public','公開する']]){const o=el('option',t);o.value=v;visibility.append(o);}
    const submit=el('button','メモを保存');submit.type='submit';form.append(el('label','元動画の時刻（秒）'),time);
    form.append(note,visibility,submit);form.onsubmit=async event=>{event.preventDefault();submit.disabled=true;try{await post('/api/records',{id:record.id,revision:record.revision,bookmarks:[...(record.bookmarks||[]),{seconds:Number(time.value),note:note.value,visibility:visibility.value}]});await reload();message('時刻付きメモを保存しました。');}catch(e){message(e.message,true);}finally{submit.disabled=false;}};container.append(form);
}
function openForm(record={}){
    $('edit').reset();for(const key of ['id','revision','title','kind','description','content','url','visibility'])if(record[key]!==undefined)$('edit').elements[key].value=record[key];
    $('edit').elements.tags.value=(record.tags||[]).join(', ');$('edit').elements.youtubeUrl.value=record.youtubeId?`https://www.youtube.com/watch?v=${record.youtubeId}`:'';$('delete').hidden=!record.id;$('form').showModal();
}
async function reload(){
    const data=state.token?await api('/api/records'+(state.trash?'?trash=1':'')):await(await fetch('./data/library.json')).json();state.items=data.records||[];renderList();
    const selected=location.hash.startsWith('#record/')?decodeURIComponent(location.hash.slice(8)):state.selected;
    if(selected&&state.items.some(r=>r.id===selected))select(selected);else $('detail').replaceChildren(el('p','一覧から資料を選択してください。','empty'));
}
for(const id of ['search','kind','status'])$(id).addEventListener(id==='search'?'input':'change',renderList);
for(const b of document.querySelectorAll('[data-close]'))b.onclick=()=>$(b.dataset.close).close();
$('add').onclick=()=>openForm();
$('bulk').onclick=()=>{state.bulk=state.trash?[]:state.filtered.filter(r=>r.kind==='match');if(!state.bulk.length){message('対象の試合がありません。');return;}$('bulk-form').reset();$('bulk-count').textContent=`次の ${state.bulk.length} 試合を設定します。`;$('bulk-list').replaceChildren(...state.bulk.map(r=>el('p',r.title)));$('bulk-dialog').showModal();};
$('bulk-form').onsubmit=async event=>{event.preventDefault();const values=Object.fromEntries(new FormData(event.target)),patch={};try{if(values.youtube)patch.youtubeId=youtubeId(values.youtube);if(values.visibility)patch.visibility=values.visibility;if(values.tags)patch.tags=values.tags.split(',').map(t=>t.trim()).filter(Boolean);const result=await post('/api/bulk-update',{records:state.bulk.map(r=>({id:r.id,revision:r.revision})),patch});$('bulk-dialog').close();await reload();message(`${result.updated}試合を設定しました。`);}catch(e){message(e.message,true);}};
$('edit').onsubmit=async event=>{event.preventDefault();try{const r=Object.fromEntries(new FormData(event.target));r.revision=Number(r.revision)||0;r.youtubeId=youtubeId(r.youtubeUrl);delete r.youtubeUrl;r.tags=r.tags.split(',').map(t=>t.trim()).filter(Boolean);const saved=await post('/api/records',r);$('form').close();state.selected=saved.id;location.hash='record/'+saved.id;await reload();message('保存しました。');}catch(e){message(e.message,true);}};
$('delete').onclick=async()=>{try{await post('/api/trash',{id:$('edit').elements.id.value,revision:Number($('edit').elements.revision.value)});$('form').close();await reload();message('ごみ箱に移しました。後から戻せます。');}catch(e){message(e.message,true);}};
$('trash').onclick=async()=>{state.trash=!state.trash;$('trash').textContent=state.trash?'資料一覧へ戻る':'ごみ箱';await reload();};
$('publish').onclick=async()=>{try{const data=await api('/api/public-preview');state.digest=data.digest;$('publication-count').textContent=`公開 ${data.records.length}件 / このPCだけ ${data.privateCount}件 / 動画ファイルの送信 0件`;$('publication-list').replaceChildren(...data.records.map(r=>el('p',`${types[r.kind]} · ${r.title}`)));$('publication-message').textContent='';$('publication').showModal();}catch(e){message(e.message,true);}};
async function publish(endpoint){$('export').disabled=$('publish-now').disabled=true;try{const result=await post(endpoint,{digest:state.digest});$('publication-message').textContent=result.message;if(result.url)link($('publication-message'),'公開した資料庫を開く',result.url);}catch(e){$('publication-message').textContent=e.message;}finally{$('export').disabled=$('publish-now').disabled=false;}}
$('export').onclick=()=>publish('/api/export-public');$('publish-now').onclick=()=>publish('/api/publish');
$('backup').onclick=async()=>{try{const result=await post('/api/backup',{});message('このPCにバックアップを作成しました。');const a=el('a','バックアップをダウンロード');a.href=result.url;a.download=result.file;$('message').append(' ',a);}catch(e){message(e.message,true);}};
let previousJobs='';async function pollJobs(){if(!state.token)return;try{const {jobs}=await api('/api/jobs');const signature=JSON.stringify(jobs);if(signature===previousJobs)return;const hadRunning=$('jobs').dataset.running==='1';previousJobs=signature;$('jobs').replaceChildren();let running=false;for(const job of jobs.filter(j=>j.status==='running'||Date.parse(j.created)>Date.now()-86400000)){const row=el('div',undefined,'job');row.append(el('strong',job.title),el('span',job.progress));if(job.status==='running'){running=true;row.append(button('中止',async()=>{await post('/api/cancel',{id:job.id});await pollJobs();},true));}$('jobs').append(row);}$('jobs').dataset.running=running?'1':'0';if(hadRunning&&!running)await reload();}catch{}}
try{const response=['127.0.0.1','localhost'].includes(location.hostname)?await fetch('/api/session'):null;if(response?.ok&&response.headers.get('Content-Type')?.includes('application/json')){const data=await response.json();state.token=data.token;state.toolOrigin=data.toolOrigin;}}catch{}
$('access').textContent=state.token?'このPCで編集できます':'公開資料';$('owner').hidden=!state.token;
try{await reload();await pollJobs();if(state.token)setInterval(pollJobs,3000);}catch(e){message('資料を読み込めませんでした。'+e.message,true);}
