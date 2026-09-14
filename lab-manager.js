// The local editing workspace. Public article markup and routes stay untouched.
export function createManager(ui){
    const {state,node,button,dialog,api,post,refresh,notice,openEdit,openVideoSettings,openImports,openAnalysis,openPublication,research,recordId,videoKey}=ui;
    const tabs=[['articles','記事'],['research','研究'],['trash','ごみ箱'],['settings','設定']];
    const isArticle=r=>['article','video','tetofu'].includes(r.kind)&&(r.editorialFormat||r.kind!=='tetofu'||!r.research);
    const articleFormat=r=>r.editorialFormat||(r.kind==='video'?'video':r.url||r.kind==='tetofu'?'link':'text');
    const articleStates={draft:'下書き',published:'公開済み',modified:'公開済み・変更あり',error:'公開失敗'};
    const kindNames={article:'記事',video:'動画',match:'試合',tetofu:'局面・資料'};
    const stageNames={candidate:'研究候補',selected:'厳選した局面',problem:'問題',archived:'保管済み'};
    const filters=new Map();let generation=0,trash=[],drafts=[],selection=new Set(),current='articles',lastUndo=null;
    const operationKey='lab:trash-operation';let pending;
    try{pending=JSON.parse(sessionStorage.getItem(operationKey)||'null');}catch{}
    const link=(label,hash,cls='btn-outline')=>{const a=node('a',label,cls);a.href=hash;return a;};
    const unique=records=>[...new Map(records.map(r=>[r.id,r])).values()];
    const date=value=>value?new Date(value).toLocaleString('ja-JP',{year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'}):'—';
    const setting=(parent,label,values,value)=>{const wrap=node('label',label,'manager-filter'),select=node('select');select.setAttribute('aria-label',label);for(const [v,t] of values){const o=node('option',t);o.value=v;select.append(o);}select.value=value||'';wrap.append(select);parent.append(wrap);return select;};
    function groups(records){
        const videos=records.filter(r=>r.kind==='video').map(r=>({key:r.id,title:r.title,records:[r],video:state.videos.find(v=>v.labRecordId===r.id)}));
        for(const match of records.filter(r=>r.kind==='match')){
            let group=videos.find(g=>g.records.some(r=>(match.youtubeId&&match.youtubeId===r.youtubeId)||videoKey(match)===videoKey(r)));
            if(!group){group={key:'video:'+videoKey(match),title:match.videoTitle||match.title.replace(/ · 試合\d+$/,''),records:[],video:state.videos.find(v=>v.labMatches.some(r=>r.id===match.id))};videos.push(group);}group.records.push(match);
        }
        return videos;
    }
    function entries(section,records){
        if(section==='videos'||section==='research')return groups(records);
        if(section==='trash')return [...records.filter(r=>!['match','video'].includes(r.kind)).map(r=>({key:r.id,title:r.title,records:[r]})),...groups(records)];
        return records.filter(r=>section==='articles'?isArticle(r):r.kind==='tetofu').map(r=>({key:r.id,title:r.title,records:[r],...(section==='articles'&&r.kind==='video'?{articleVideo:state.videos.find(v=>v.labRecordId===r.id)}:{})}));
    }
    const targetRecords=entry=>entry.records.map(r=>({id:r.id,revision:r.revision}));
    function view(entry){
        const r=entry.records[0];
        if(entry.video||entry.articleVideo){window.router('videos',(entry.video||entry.articleVideo).id);return;}
        if(r.kind==='article'){if(r.url)window.open(r.url,'_blank','noopener');else window.router('articles',recordId(r));}
        else if(r.snapshot)research.openDetail(r);
        else if(r.url)window.open(r.url,'_blank','noopener');
    }
    function edit(entry){const r=entry.records[0];return entry.video?ui.editVideoArticle(entry.video):current!=='articles'&&r.kind==='tetofu'&&r.snapshot?research.editResearch(r):openEdit(r);}
    function info(entry){
        const matches=entry.records.filter(r=>r.kind==='match');
        if(matches.length)return `${matches.length}試合${entry.records.some(r=>r.kind==='video')?' ＋ 動画の設定':''}${matches.some(r=>r.status==='failed')?' · 要確認 '+matches.filter(r=>r.status==='failed').length+'試合':''}`;
        const r=entry.records[0];if(current==='articles')return ({text:'本文',link:'リンク',video:'動画'})[articleFormat(r)]||'記事';return r.kind==='article'?(r.url?'外部記事のリンク':'本文ありの投稿'):r.snapshot?(stageNames[r.research?.stage]||'保存した局面'):r.kind==='tetofu'?'テト譜のリンク':'動画のリンク';
    }
    function visibility(entry){if(current==='articles')return articleStates[entry.records[0].editorial?.status]||(entry.records[0].visibility==='public'?'公開済み':'下書き');const values=new Set(entry.records.map(r=>r.visibility));return values.size>1?'公開対象とPC限定が混在':values.has('public')?'公開対象':'このPCだけ';}
    async function trashArticles(records,onDone=()=>{}){
        const d=dialog('記事をごみ箱へ'),status=node('p',undefined,'lab-form-error');d.append(node('p',records.length===1?`「${records[0].title}」をごみ箱に移します。`:`選んだ${records.length}記事をごみ箱に移します。`));
        if(records.some(r=>r.editorial?.published))d.append(node('p','公開中の記事は、公開サイトから取り下げてから移動します。'));
        const cancel=button('キャンセル',()=>d.close()),submit=button('ごみ箱へ',async()=>{submit.disabled=cancel.disabled=true;try{for(const r of records){const pub=r.editorial?.published;const preview=pub?await post('/api/article-preview',{id:r.id,revision:r.revision,action:'unpublish'}):null;await post('/api/article-trash',{id:r.id,revision:r.revision,operationId:crypto.randomUUID(),...(preview?{digest:preview.digest}:{})});}d.close();await refresh();onDone();}catch(e){status.textContent=e.message;await refresh().catch(()=>{});}finally{submit.disabled=cancel.disabled=false;}},'btn-outline manager-danger');d.append(status,cancel,submit);d.showModal();
    }
    async function change(records,restore=false,label='',onDone=()=>{}){
        if(!restore&&current==='articles')return trashArticles(unique(records),onDone);
        if(pending)return resume();
        records=unique(records);if(!records.length)return;
        if(records.length>500)throw Error('一度に移動できるのは500資料までです。選択を減らしてください。');
        if(records.length===1){
            pending={operationId:crypto.randomUUID(),records:targetRecords({records}),restore,label:label||`「${records[0].title}」`};sessionStorage.setItem(operationKey,JSON.stringify(pending));
            try{await execute();onDone();}catch(error){showRecovery(error,onDone);}return;
        }
        const d=dialog(restore?'ごみ箱から戻す':'ごみ箱に移す'),summary=node('p',label||`${records.length}資料を選択しています。`);
        const counts=Object.entries(kindNames).map(([kind,name])=>{const count=records.filter(r=>r.kind===kind).length;return count?`${name} ${count}件`:'';}).filter(Boolean).join(' / ');
        d.append(summary,node('p',counts,'manager-dialog-count'),node('p',restore?'選んだ資料を元の一覧に戻します。本文・引用・公開範囲はそのまま戻ります。':'一覧から取り除きます。後から「ごみ箱」で戻せます。元の動画ファイル、引用済みの局面、他の記事は残ります。','lab-help-text'));
        if(!restore&&records.some(r=>r.visibility==='public'))d.append(node('p','公開対象の資料を含みます。公開サイトへの反映は、後で「管理・公開」から行います。','lab-help-text'));
        const list=node('details'),listTitle=node('summary',`対象を確認（${records.length}件）`),names=node('div',undefined,'manager-targets');list.open=records.length>1;for(const record of records)names.append(node('p',`${kindNames[record.kind]} · ${record.title}`));list.append(listTitle,names);d.append(list);
        const error=node('p',undefined,'lab-form-error');error.setAttribute('role','alert');
        let busy=false;const cancel=button('キャンセル',()=>d.close()),submit=button(restore?'元の一覧に戻す':'ごみ箱に移す',async()=>{
            if(busy)return;busy=true;submit.disabled=cancel.disabled=true;error.textContent='';
            try{
                pending={operationId:crypto.randomUUID(),records:records.map(r=>({id:r.id,revision:r.revision})),restore,label:label||`${records.length}件`};
                sessionStorage.setItem(operationKey,JSON.stringify(pending));await execute();d.close();onDone();
            }catch(e){error.textContent=e.message;submit.textContent=pending?'保存結果を確認':'一覧を更新';submit.onclick=()=>pending?resume(d,onDone):refresh().then(()=>d.close()).catch(e=>{error.textContent=e.message;});}
            finally{busy=false;submit.disabled=cancel.disabled=false;}
        },'btn-outline '+(restore?'lab-primary':'manager-danger'));
        const actions=node('div',undefined,'lab-inline-actions');actions.append(cancel,submit);d.append(error,actions);d.addEventListener('cancel',e=>{if(busy)e.preventDefault();});d.showModal();cancel.focus();
    }
    async function execute(){
        if(!pending)return;const operation=pending;
        try{
            const result=await post('/api/bulk-trash',operation);sessionStorage.removeItem(operationKey);pending=null;selection.clear();
            lastUndo={records:result.records,restore:!operation.restore,label:operation.label};
            try{await refresh();}catch{notice('移動は完了しました。一覧の読み込みに失敗したため、再読み込みしてください。',true);return;}
            showUndo(`${operation.label}を${operation.restore?'元の一覧に戻しました':'ごみ箱に移しました'}。`);
        }catch(error){
            if([400,404,409,413].includes(error.status)){pending=null;sessionStorage.removeItem(operationKey);}
            throw error;
        }
    }
    function showUndo(text){
        notice(text);const status=document.getElementById('lab-status'),operation=lastUndo;
        status.append(' ',button('取り消す',async()=>{
            if(pending)return resume();pending={operationId:crypto.randomUUID(),...operation};sessionStorage.setItem(operationKey,JSON.stringify(pending));try{await execute();}catch(error){showRecovery(error);}
        }), ' ',link('ごみ箱を開く','#manage/trash'));
    }
    function showRecovery(error,onDone=()=>{}){
        const open=document.querySelector('dialog[open]'),retry=pending?button('保存結果を確認',()=>resume(null,onDone)):button('一覧を更新',refresh);
        if(open){const recovery=node('div',undefined,'manager-notice');recovery.append(node('p',error.message,'lab-form-error'),retry);open.append(recovery);}
        else{notice(error.message,true);document.getElementById('lab-status').append(' ',retry);}
    }
    async function resume(existing,onDone=()=>{}){
        if(!pending){existing?.close();return;}
        const d=existing||dialog('前回の移動結果を確認');
        if(!existing){d.append(node('p','通信の返事を確認できなかった移動があります。同じ操作を確認するため、重複して移動しません。'));
            d.append(button('保存結果を確認',async()=>{await execute();d.close();onDone();}),button('閉じる',()=>d.close()));d.showModal();return;}
        try{await execute();d.close();onDone();}catch(error){d.querySelector('.lab-form-error').textContent=error.message;}
    }
    function render(section='articles'){
        current=[...tabs.map(t=>t[0]),'videos','materials'].includes(section)?section:'articles';section=current;const titleSection=['videos','materials'].includes(section)?'research':section;const ticket=++generation;selection.clear();
        const main=document.getElementById('main-view');main.replaceChildren();const root=node('section',undefined,'lab-manager');main.append(root);
        const head=node('div',undefined,'manager-heading'),title=node('div');title.append(node('p','このPCの編集室','manager-eyebrow'),node('h1',tabs.find(t=>t[0]===titleSection)[1]));
        const actions=node('div',undefined,'manager-actions');
        if(section==='articles')actions.append(button('本文から作成',()=>openEdit({kind:'article',editorialFormat:'text'}),'btn-outline lab-primary'),button('リンクから作成',()=>openEdit({kind:'article',editorialFormat:'link'})),button('動画から作成',()=>openEdit({kind:'video',editorialFormat:'video',publicPlayback:{enabled:false}})));
        if(section==='videos'||section==='research')actions.append(button('完成結果を取り込む',openImports,'btn-outline lab-primary'),button('動画から記事を作成',()=>openEdit({kind:'video',editorialFormat:'video',publicPlayback:{enabled:false}})));
        if(section==='materials')actions.append(button('テト譜リンクを追加',()=>openEdit({kind:'tetofu'})),link('動画から局面を集める','#manage/videos'));
        head.append(title,actions);root.append(head);if(titleSection==='research'){const nav=node('nav',undefined,'manager-research-tabs');nav.setAttribute('aria-label','研究の資料');nav.append(link('動画','#manage/research',section==='materials'?'btn-outline':'btn-outline lab-primary'),link('局面・メモ','#manage/materials',section==='materials'?'btn-outline lab-primary':'btn-outline'));root.append(nav);}
        const descriptions={articles:'本文、リンク、動画をまとめて管理します。編集中の内容は自動保存され、公開するまで読者には反映されません。',research:'動画と盤面を連動させて調べ、必要な局面や時刻を記事へ追加できます。',videos:'動画と解析済みの試合を一緒に管理します。各動画を開くと局面を研究できます。',materials:'動画から残した局面と、登録したテト譜のリンク。記事に使う資料もここで整理します。',trash:'削除した記事・動画・資料はここから戻せます。自動では消えません。'};
        if(descriptions[section])root.append(node('p',descriptions[section],'manager-description'));
        if(pending){const warning=node('div',undefined,'manager-notice');warning.append(node('span','前回の移動結果が未確認です。'),button('保存結果を確認',()=>resume()));root.append(warning);}
        if(section==='settings'){renderSettings(root);return;}
        const supplement=node('div');root.append(supplement);
        const controls=node('div',undefined,'manager-filters'),saved=filters.get(section)||{query:'',visibility:'',kind:'',sort:'updated',stage:''};filters.set(section,saved);
        const searchWrap=node('label','検索','manager-filter manager-search'),search=node('input');search.type='search';search.placeholder='タイトル・タグ・説明から探す';search.value=saved.query;search.setAttribute('aria-label','編集室の検索');searchWrap.append(search);controls.append(searchWrap);
        const scope=setting(controls,section==='articles'?'状態':'公開範囲',section==='articles'?[['','すべて'],['draft','下書き'],['published','公開済み'],['modified','公開済み・変更あり'],['error','公開失敗']]:[['','すべて'],['private','このPCだけ'],['public','公開対象']],saved.visibility);
        let typeFilter;if(section==='trash')typeFilter=setting(controls,'種類',[['','すべて'],['article','記事'],['video','動画・試合'],['tetofu','局面・資料']],saved.kind);
        else if(section==='articles')typeFilter=setting(controls,'種類',[['','すべての記事'],['text','本文'],['link','リンク'],['video','動画']],saved.kind);
        else if(section==='videos'||section==='research')typeFilter=setting(controls,'種類',[['','すべての動画'],['analysis','解析結果あり'],['link','リンクのみ']],saved.kind);
        else typeFilter=setting(controls,'分類',[['','すべての資料'],['candidate','研究候補'],['selected','厳選した局面'],['problem','問題'],['archived','保管済み'],['link','リンクのみ']],saved.kind);
        const sort=setting(controls,'並び順',[['updated','更新が新しい順'],['title','タイトル順'],['oldest','更新が古い順']],saved.sort);root.append(controls);
        const bulk=node('div',undefined,'manager-bulk'),allLabel=node('label'),all=node('input');all.type='checkbox';all.setAttribute('aria-label','表示中の資料をすべて選択');allLabel.append(all,node('span','表示中を選択'));const selectedText=node('span','0件選択','manager-selection'),count=node('span',undefined,'manager-count');
        const bulkAction=button(section==='trash'?'選択を元に戻す':'選択をごみ箱へ',()=>change(unique(shown.filter(e=>selection.has(e.key)).flatMap(e=>e.records)),section==='trash',`${selection.size}項目`));bulkAction.disabled=true;bulk.append(allLabel,selectedText,bulkAction,count);root.append(bulk);
        const list=node('div',undefined,'manager-list');root.append(list);const pager=node('div',undefined,'manager-pagination');root.append(pager);
        let allEntries=[],filtered=[],shown=[],page=0;const pageSize=40;
        if(section==='materials')research.folderPicker(controls,{value:saved.folder??'*',all:true,manage:true,onChange:value=>{saved.folder=value;page=0;draw();}});
        function sync(){const picked=shown.filter(e=>selection.has(e.key));selectedText.textContent=`${picked.length}項目選択`;bulkAction.disabled=!picked.length;all.checked=!!shown.length&&picked.length===shown.length;all.indeterminate=picked.length>0&&picked.length<shown.length;for(const check of list.querySelectorAll('input[type=checkbox]'))check.checked=selection.has(check.dataset.key);}
        function draw(){
            const words=saved.query.toLocaleLowerCase().split(/\s+/).filter(Boolean);
            filtered=allEntries.filter(entry=>{
                const r=entry.records[0];if(section==='materials'&&saved.folder&&saved.folder!=='*'&&(r.research?.folderId||'')!==saved.folder)return false;
                if(section==='materials'&&saved.folder===''&&r.research?.folderId)return false;
                if(saved.visibility&&(section==='articles'?(r.editorial?.status||(r.visibility==='public'?'published':'draft'))!==saved.visibility:!entry.records.some(r=>r.visibility===saved.visibility)))return false;
                if(!words.every(word=>entry.records.some(r=>JSON.stringify([r.title,r.tags,r.description,r.content,r.research,r.players]).toLocaleLowerCase().includes(word))))return false;
                if(!saved.kind)return true;
                if(section==='trash')return saved.kind==='video'?['video','match'].includes(r.kind):r.kind===saved.kind;
                if(section==='articles')return articleFormat(r)===saved.kind;
                if(section==='videos'||section==='research')return saved.kind==='analysis'?entry.records.some(r=>r.kind==='match'):entry.records.every(r=>r.kind!=='match');
                return saved.kind==='link'?!r.snapshot:!!r.snapshot&&(r.research?.stage||'candidate')===saved.kind;
            });
            const updated=e=>Math.max(...e.records.map(r=>Date.parse(r.updatedAt||r.date)||0));
            filtered.sort((a,b)=>saved.sort==='title'?a.title.localeCompare(b.title,'ja'):saved.sort==='oldest'?updated(a)-updated(b):updated(b)-updated(a));
            page=Math.min(page,Math.max(0,Math.ceil(filtered.length/pageSize)-1));shown=filtered.slice(page*pageSize,(page+1)*pageSize);list.replaceChildren();pager.replaceChildren();
            count.textContent=`${filtered.length}項目${section==='trash'?'（動画は試合ごとにまとまっています）':''}`;
            for(const entry of shown){
                const row=node('article',undefined,'manager-row');row.dataset.managerId=entry.key;
                const select=node('input');select.type='checkbox';select.dataset.key=entry.key;select.setAttribute('aria-label',entry.title+'を選択');select.onchange=()=>{select.checked?selection.add(entry.key):selection.delete(entry.key);sync();};
                const content=node('div',undefined,'manager-row-content'),heading=node('h2');
                if(section==='trash')heading.append(node('span',entry.title));else heading.append(button(entry.title,()=>section==='articles'&&!entry.articleVideo?edit(entry):view(entry),'manager-title-button'));
                content.append(heading,node('p',info(entry)+' · '+visibility(entry),'manager-row-meta'));
                if(section==='materials')content.append(node('p',research.folderName(entry.records[0]),'manager-row-meta'));
                const tags=[...new Set(entry.records.flatMap(r=>r.tags||[]))].slice(0,5);if(tags.length)content.append(node('p',tags.join(' / '),'manager-row-tags'));
                content.append(node('p',(section==='trash'?'移動・更新 ':'更新 ')+date(Math.max(...entry.records.map(r=>Date.parse(r.updatedAt||r.date)||0))),'manager-row-date'));
                const rowActions=node('div',undefined,'manager-row-actions');
                if(section==='trash')rowActions.append(button('元に戻す',()=>change(entry.records,true,`「${entry.title}」`),'btn-outline lab-primary'));
                else{
                    rowActions.append(button(entry.video?'動画を研究':section==='articles'?'プレビュー':'開く',()=>view(entry)));
                    rowActions.append(button(entry.video?'記事を編集':'編集する',()=>edit(entry),'btn-outline lab-primary'));
                    rowActions.append(button('ごみ箱へ',()=>change(entry.records,false,`「${entry.title}」`),'btn-outline manager-danger'));
                }
                row.append(select,content,rowActions);list.append(row);
            }
            if(!shown.length){const empty=node('div',undefined,'manager-empty');empty.append(node('h2',allEntries.length?'条件に合う項目がありません':section==='trash'?'ごみ箱は空です':section==='articles'?'最初の記事を書き始めましょう':section==='videos'?'研究する動画を追加しましょう':'局面とテト譜をここに集めます'),node('p',allEntries.length?'検索や絞り込みを解除すると、一覧に戻れます。':section==='materials'?'動画の「研究ノートに保存」で残した局面は、記事エディタの資料棚でも使えます。':'上のボタンから追加できます。'));list.append(empty);}
            if(filtered.length>pageSize){const prev=button('前の40項目',()=>{page--;selection.clear();draw();});prev.disabled=page===0;const next=button('次の40項目',()=>{page++;selection.clear();draw();});next.disabled=(page+1)*pageSize>=filtered.length;pager.append(prev,node('span',`${page+1} / ${Math.ceil(filtered.length/pageSize)}`),next);}sync();
        }
        const update=()=>{saved.query=search.value;saved.visibility=scope.value;saved.kind=typeFilter.value;saved.sort=sort.value;page=0;selection.clear();draw();};search.oninput=update;scope.onchange=typeFilter.onchange=sort.onchange=update;
        all.onchange=()=>{for(const entry of shown)all.checked?selection.add(entry.key):selection.delete(entry.key);sync();};
        if(section==='trash'){
            list.append(node('p','ごみ箱を読み込んでいます…','manager-empty'));
            api('/api/records?trash=1').then(data=>{if(ticket!==generation)return;trash=data.records||[];allEntries=entries(section,trash);draw();}).catch(e=>{if(ticket===generation)list.replaceChildren(node('p',e.message,'lab-form-error'));});
        }else if(section==='articles'){list.append(node('p','記事を読み込んでいます…','manager-empty'));api('/api/editorial').then(data=>{if(ticket!==generation)return;state.editorialArticles=data.articles||[];allEntries=entries(section,state.editorialArticles);draw();}).catch(e=>{if(ticket===generation)list.replaceChildren(node('p','記事を読み込めませんでした。'+e.message,'lab-form-error'));});}else{allEntries=entries(section,state.records);draw();}
        if(section==='articles')api('/api/drafts').then(data=>{if(ticket!==generation)return;drafts=data.drafts||[];const active=drafts.filter(d=>!state.records.some(r=>r.id===d.id));
            if(active.length){const box=node('div',undefined,'manager-drafts');box.append(node('strong','まだ記事になっていない下書き'));for(const draft of active){const row=node('div',undefined,'manager-draft-row');row.append(button((draft.title||'無題の記事')+' · 続きを書く',()=>openEdit({_draftId:draft.id})),button('下書きを削除',async()=>{const value=await api('/api/draft?id='+encodeURIComponent(draft.id));const d=dialog('下書きを削除');d.append(node('p',`「${draft.title||'無題の記事'}」の下書きを削除します。`),button('キャンセル',()=>d.close()),button('削除する',async()=>{await post('/api/draft',{id:draft.id,draft:null,expectedToken:value._token});d.close();render('articles');},'btn-outline manager-danger'));d.showModal();},'writer-tool'));box.append(row);}supplement.append(box);}
        }).catch(()=>{if(ticket===generation)supplement.append(node('p','下書き一覧を取得できませんでした。','lab-help-text'));});

    }
    function renderSettings(root){
        for(const [title,description,actions] of [
            ['公開とバックアップ','記事の公開は各記事の編集画面から行います。ここでは公開先と保管状態を確認できます。',[['公開先・履歴を確認',openPublication]]],
            ['配信の解析と取り込み','PCで解析と修正を済ませ、完成した結果を研究動画に取り込みます。',[['PCの配信解析を開く',openAnalysis],['完成結果を取り込む',openImports]]],
            ['保管と使い方','記事や資料をこのPCに保管します。消した資料は「ごみ箱」から戻せます。',[['バックアップを作成',async()=>{await post('/api/backup',{});notice('このPCにバックアップを保存しました。');}],['タグ一覧',()=>window.router('tags')],['使い方',()=>research.guide()]]]
        ]){const section=node('section',undefined,'manager-settings-card');section.append(node('h2',title),node('p',description));const row=node('div',undefined,'manager-actions');for(const [label,action]of actions)row.append(button(label,action));section.append(row);root.append(section);}
    }
    function route(page,id){
        if(!state.token)return false;
        if(page==='manage'){render(id);return true;}
        if(page==='dashboard'){render('articles');return true;}
        if(!id&&['articles','videos','analysis','tetofu','research'].includes(page)){render(page==='articles'?'articles':page==='tetofu'?'materials':'research');return true;}
        if(page==='manage-record'){
            const record=state.records.find(r=>r.id===id);if(!record){render('trash');return true;}
            if(['video','match'].includes(record.kind)){const video=state.videos.find(v=>v.labRecordId===id||v.labMatches.some(r=>r.id===id));if(video){if(record.kind==='match')state.pendingSource={recordId:id,seconds:record.startSeconds||0};window.router('videos',video.id);return true;}}
            render(record.kind==='article'?'articles':'materials');view({records:[record]});return true;
        }return false;
    }
    function videoTrash(video){return button('この動画をごみ箱に移す',()=>change(unique([...(video.labRecordId?state.records.filter(r=>r.id===video.labRecordId):[]),...video.labMatches]),false,`「${video.title}」と関連する${video.labMatches.length}試合`),'btn-outline manager-danger');}
    return {render,route,change,videoTrash};
}
