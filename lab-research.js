import {timeText, pageState, stateFromUrl} from './library-tools.js';

export function createResearch(ui) {
    const {state,node,button,dialog,field,footer,post,refresh,notice,boardElement,openTool,openEdit,recordId,byId}=ui;
    const stages=[['candidate','研究候補'],['selected','厳選した難地形'],['problem','問題'],['archived','保留']];
    const clone=value=>JSON.parse(JSON.stringify(value));
    function firstPage(data){
        if(!data)return null;
        if(data.v===2)return {p1:{board:data.p1?.b,next:data.p1?.n,hold:data.p1?.h},...(data.p2?{p2:{board:data.p2.b,next:data.p2.n,hold:data.p2.h}}:{})};
        if(window.TetrisEventCodec.isEventReplay(data))data=window.TetrisEventCodec.decodeCollection(data,{compactBoards:true});
        const c=data.cases?.[data.currentCase||0],page=c?.pages?.[0];
        return page&&(c.gameMode||data.m)==='1P'?{...page,p2:undefined}:page;
    }
    function sourceRef(reference){return clone(reference.sourceRef||{recordId:reference.id||'',title:reference.title||'',seconds:reference.startSeconds||0,
        phase:reference.phase||0,player:reference.player||'both',youtubeId:reference.youtubeId||'',youtubeOffsetSeconds:reference.youtubeOffsetSeconds||0});}
    function sourceAtPage(reference,pageIndex,time){
        const ref=sourceRef(reference);
        // Only a full original replay has page numbers/times that identify source-video positions.
        if(reference._fullMatch){if(Number.isInteger(pageIndex)&&pageIndex>=0)ref.phase=pageIndex;
            if(Number.isFinite(time))ref.seconds=(reference._matchStart??reference.startSeconds??0)+time;}
        return ref;
    }
    function resolveSourceLink(ref){
        const exact=state.videos.find(v=>v.labMatches.some(m=>m.id===ref.recordId));
        const video=exact||state.videos.find(v=>ref.youtubeId&&v.youtubeId===ref.youtubeId);
        const current=exact?{...ref,youtubeId:exact.youtubeId||'',youtubeOffsetSeconds:exact.youtubeOffsetSeconds||0}:clone(ref);
        // A different analysis of the same upload can use a different local time origin.
        if(video&&!exact)current.youtubeSeconds=ref.seconds+(ref.youtubeId?(ref.youtubeOffsetSeconds||0):0);
        return {video,current};
    }
    function sourceLink(parent,ref){
        if(!ref)return;
        const {video,current}=resolveSourceLink(ref);
        parent.append(node('p',`出典：${ref.title||'元動画'} · ${timeText(ref.seconds+(current.youtubeId?(current.youtubeOffsetSeconds||0):0))}${ref.player&&ref.player!=='both'?' · '+ref.player.toUpperCase():''}`,'lab-source'));
        if(video)parent.append(button('元動画のこの時刻へ',()=>{parent.closest('dialog')?.close();state.pendingSource=current;window.router('videos',video.id);}));
        else if(ref.youtubeId){const a=node('a','YouTubeのこの時刻へ','btn-outline');a.href=`https://www.youtube.com/watch?v=${ref.youtubeId}&t=${Math.max(0,Math.floor(ref.seconds+(ref.youtubeOffsetSeconds||0)))}s`;a.target='_blank';a.rel='noopener';parent.append(a);}

    }
    function boardPreview(parent,data,player='p1'){const page=firstPage(data);if(!page)return;const boards=node('div',undefined,'lab-boards');boards.append(boardElement(page.p1?.board,!page.p2&&player==='p2'?'P2':'P1',page.p1));if(page.p2)boards.append(boardElement(page.p2.board,'P2',page.p2));parent.append(boards);}
    function capture(data,reference,initial={}){
        const d=dialog('局面を研究用に保存'),form=node('form'),ref=sourceRef(reference);d.append(form);
        form.append(node('p',initial.fromTool?'表示中の盤面を保存します。元動画へのリンクは、検討を始めた元の局面を保ちます。練習・編集した手順と元動画の進行は別です。':'元動画の時刻と盤面を一緒に保存します。後から記事への引用・問題化ができます。'));
        boardPreview(form,data,ref.player);
        field(form,'タイトル','title',initial.title||`${reference.title||'局面'} · ${timeText(ref.seconds)}`).required=true;
        field(form,'保存先','stage',initial.stage||'candidate','text',stages);
        field(form,'タグ（カンマ区切り）','tags',(reference.tags||[]).join(', '));
        field(form,'研究メモ（公開には含めません）','notes','','textarea');
        footer(d,form,'研究候補として保存',async()=>{const v=Object.fromEntries(new FormData(form));const saved=await post('/api/records',{
            kind:'tetofu',title:v.title,tags:v.tags.split(',').map(t=>t.trim()).filter(Boolean),snapshot:data,sourceRef:ref,
            parentId:ref.recordId,visibility:'private',research:{stage:v.stage,notes:v.notes,...(initial.ai?{ai:initial.ai}:{})}});
            d.close();await refresh(true);notice('研究用に保存しました。「研究ノート」で厳選・記事への引用・問題化を続けられます。');return saved;
        });d.showModal();
    }
    function editResearch(record){
        const d=dialog('研究メモ・問題を編集'),form=node('form');d.append(form);
        field(form,'タイトル','title',record.title).required=true;
        field(form,'整理する場所','stage',record.research?.stage||'candidate','text',stages);
        field(form,'タグ（カンマ区切り）','tags',(record.tags||[]).join(', '));
        field(form,'問題文（例：このNEXTで地形を崩さずに掘り進めてください）','prompt',record.research?.prompt||'','textarea');
        field(form,'解答・考え方（閲覧時は折りたたみ）','answer',record.research?.answer||'','textarea');
        field(form,'研究メモ（公開には含めません）','notes',record.research?.notes||'','textarea');
        field(form,'公開範囲','visibility',record.visibility||'private','text',[['private','このPCだけ'],['public','公開対象にする']]);
        form.append(node('p','「公開対象」にして保存した後、「公開管理」から送信するとサイトに反映されます。'));
        footer(d,form,'保存する',async()=>{const v=Object.fromEntries(new FormData(form));if(v.stage==='problem'&&!v.prompt.trim())throw Error('問題として保存するには問題文を入力してください。');
            await post('/api/records',{id:record.id,revision:record.revision,title:v.title,tags:v.tags.split(',').map(t=>t.trim()).filter(Boolean),visibility:v.visibility,
                research:{...record.research,stage:v.stage,prompt:v.prompt,answer:v.answer,notes:v.notes}});d.close();await refresh();notice('研究資料を更新しました。');});d.showModal();
    }
    function renderCitations(record){
        if(!record.citations?.length)return;
        const parent=document.querySelector('.article-body');if(!parent)return;
        const section=node('section',undefined,'lab-citations');section.append(node('h2','引用した局面'));
        record.citations.forEach((citation,index)=>{
            const item=node('article',undefined,'lab-research-card');item.append(node('h3',`${index+1}. ${citation.title}`));boardPreview(item,citation.snapshot,citation.sourceRef?.player);sourceLink(item,citation.sourceRef);
            const actions=node('div',undefined,'lab-inline-actions');actions.append(button('この局面から試す',()=>openTool('sim',citation.snapshot,{title:citation.title,sourceRef:citation.sourceRef})),
                button('テト譜で開く',()=>openTool('editor',citation.snapshot,{title:citation.title,sourceRef:citation.sourceRef})));
            item.append(actions);
            const marker=parent.querySelector(`[data-lab-citation="${index}"]`)||[...parent.querySelectorAll('p')].find(p=>p.textContent.trim()===`[[局面${index+1}]]`);
            if(marker){const inline=node('section',undefined,'lab-citations');inline.append(item);marker.replaceWith(inline);}else section.append(item);
        });if(section.children.length>1)parent.append(section);
    }
    function openDetail(record){
        for(const open of document.querySelectorAll('dialog[data-research-id]'))if(open.dataset.researchId===String(record.id))open.close();
        const d=dialog(record.title);d.dataset.researchId=record.id;boardPreview(d,record.snapshot,record.sourceRef?.player);sourceLink(d,record.sourceRef);
        if(record.research?.prompt)d.append(node('p',record.research.prompt,'lab-problem-text'));
        if(record.research?.answer){const answer=node('details');answer.append(node('summary','解答・考え方を見る'),node('p',record.research.answer,'lab-problem-text'));d.append(answer);}
        const ai=record.research?.ai;
        if(ai){const comparison=node('details');comparison.append(node('summary','AIの採点・置き場所を確認する'));
            comparison.append(node('p',`評価差 ${ai.gap}点 · ${ai.engine} · ${ai.player?.toUpperCase()||'P1'} · ${new Date(ai.completedAt).toLocaleString('ja-JP')}`));
            if(ai.settings)comparison.append(node('p',`考える量 ${ai.settings.nodeBudget} / 詳細 ${ai.settings.detailNodeBudget} · 候補にする差 ${ai.settings.thresholdScore}点`,'lab-help-text'));
            const boards=node('div',undefined,'lab-boards');
            for(const [label,move,score]of [['実際の手',ai.actualMove,ai.actualScore],['AIの候補',ai.bestMove,ai.bestScore]]){
                if(!move?.cells||!ai.sourceBoard)continue;
                const b=boardElement(ai.sourceBoard,`${label} · ${Math.round(score)}点`),cells=b.querySelectorAll('.lab-cell');
                for(const[x,y]of move.cells){const cell=cells[(y-20)*10+x];if(x>=0&&x<10&&y>=20&&y<40&&cell)cell.className=`lab-cell lab-${/^[IOTLSJZ]$/.test(move.piece)?move.piece:'G'} lab-move-highlight`;}
                b.append(node('p',move.hold?'HOLDを使う':'HOLDを使わない','lab-help-text'));boards.append(b);
            }
            comparison.append(node('p','枠の付いた4マスが置き場所です。ラインが消える前の盤面で比較します。','lab-help-text'),boards);d.append(comparison);
        }
        const actions=node('div',undefined,'lab-inline-actions');
        if(record.snapshot)actions.append(button('この局面から練習',()=>{d.close();openTool('sim',practiceState(record.snapshot),record);}),button('テト譜を編集',()=>{d.close();openTool('editor',record.snapshot,record);}));
        if(state.token)actions.append(button('研究メモ・問題を編集',()=>{d.close();editResearch(record);}),ui.trashButton(record,()=>d.close()));
        actions.append(button('閉じる',()=>d.close()));d.append(actions);d.showModal();
    }
    function practiceState(snapshot){const page=firstPage(snapshot);return snapshot.v===2?snapshot:pageState(page||{});}
    function renderWorkspace(id){
        const main=document.getElementById('main-view');main.replaceChildren(node('h2','研究ノート','section-title'));
        const sourceMatch=id&&byId(id)?.kind==='match'?byId(id):null;
        if(sourceMatch)main.append(node('p',sourceMatch.title+' の採点候補','lab-score-summary'),button('すべての研究資料を見る',()=>window.router('research')));
        main.append(node('p','自分で保存した局面を整理します。AI採点の指摘は動画ページの「AIの指摘を見る」から確認できます。記事を書くときは、編集画面の資料棚から選んで本文へ挿入できます。','lab-help-text'));
        if(state.token)main.append(button('記事を書く',()=>openEdit()));
        const filters=node('div',undefined,'lab-research-filters'),search=node('input');search.type='search';search.placeholder='タイトル・タグ・問題文・研究メモで探す';search.setAttribute('aria-label','研究資料を検索');
        const stage=field(filters,'整理する場所','stage','','text',[['','すべて'],...stages]);filters.append(search);main.append(filters);
        const list=node('div',undefined,'list-container');main.append(list);let visibleCount=48;
        const render=()=>{list.replaceChildren();const words=search.value.toLowerCase().split(/\s+/).filter(Boolean);
            const records=state.records.filter(r=>r.kind==='tetofu'&&r.snapshot&&(!sourceMatch||r.sourceRef?.recordId===sourceMatch.id&&r.research?.ai)&&(!stage.value||(r.research?.stage||'candidate')===stage.value)&&words.every(w=>JSON.stringify([r.title,r.tags,r.research]).toLowerCase().includes(w)));
            for(const record of records.slice(0,visibleCount)){const card=node('article',undefined,'card lab-research-card');card.dataset.recordId=record.id;
                card.append(node('span',stages.find(s=>s[0]===(record.research?.stage||'candidate'))?.[1],'lab-stage'),node('h3',record.title));
                const layout=node('div',undefined,'lab-research-layout'),preview=node('div'),body=node('div');boardPreview(preview,record.snapshot,record.sourceRef?.player);layout.append(preview,body);card.append(layout);
                ui.tags(body,record.tags);sourceLink(body,record.sourceRef);
                if(record.research?.ai)body.append(node('p',`AIの指摘から保存 · 評価差 ${record.research.ai.gap}点 · ${record.research.ai.player?.toUpperCase()||'P1'}`,'lab-help-text'));
                if(record.research?.notes&&state.token)body.append(node('p',record.research.notes,'lab-problem-text'));
                const actions=node('div',undefined,'lab-inline-actions');actions.append(button(record.research?.stage==='problem'?'問題を開く':'局面を開く',()=>openDetail(record)));
                if(state.token)actions.append(button('整理・問題化',()=>editResearch(record)),ui.trashButton(record));
                body.append(actions);list.append(card);
            }
            if(!records.length)list.append(node('p',sourceMatch?'この試合の採点候補はありません。評価差の基準を満たす手がなかった場合も、採点は完了しています。':'まだ局面がありません。動画の局面表示から、残したいものだけ「研究ノートに保存」を押してください。'));
            if(records.length>visibleCount)list.append(button(`さらに表示（${visibleCount} / ${records.length}件）`,()=>{visibleCount+=48;render();}));
        };search.oninput=stage.onchange=()=>{visibleCount=48;render();};render();
        if(id&&!sourceMatch&&!document.querySelector('dialog[open]')){const record=byId(id);if(record)openDetail(record);}
    }
    function scoreReport(report,reference){
        if(!report)throw Error('まだ採点結果がありません。エディタ内の「AI採点を実行」を押し、完了後に取り込んでください。');
        const d=dialog('AIが見つけた手を研究候補へ');d.append(node('p',`${report.scored} / ${report.attempted}手を採点 · 候補 ${report.candidates.length}件 · 未採点 ${report.ignored.length}手`));
        d.append(node('p','AIの評価差は検討のきっかけです。候補を動画と見比べ、研究したいものを選んで保存してください。'));
        if(!reference._fullMatch)d.append(node('p','局面番号は検討中の手順内の番号です。保存する元動画へのリンクは、検討を始めた局面を保ちます。','lab-help-text'));
        const sourcePlayer=sourceRef(reference).player;
        const list=node('div',undefined,'lab-scroll'),selected=new Set();d.append(list);
        for(const [index,candidate]of report.candidates.entries()){
            const item=node('article',undefined,'lab-list-row'),label=node('label'),check=node('input');check.type='checkbox';check.onchange=()=>check.checked?selected.add(index):selected.delete(index);
            label.append(check,` 局面 ${candidate.pageIndex+1} · 評価差 ${candidate.gap}点`);item.append(label);boardPreview(item,candidate.snapshot,sourcePlayer);list.append(item);
        }
        if(report.ignored.length){const detail=node('details');detail.append(node('summary','採点できなかった手'));for(const result of report.ignored)detail.append(node('p',`局面 ${result.pageIndex+1}: ${result.reason||'手を確定できませんでした'}`));d.append(detail);}
        const save=button('選んだ候補を保存',async()=>{if(!selected.size)throw Error('保存する候補にチェックを入れてください。');save.disabled=true;let count=0;
            try{for(const index of [...selected]){const candidate=report.candidates[index],ref=sourceAtPage(reference,candidate.pageIndex,candidate.time);
                const ai={engine:report.engine,searchEngine:candidate.searchEngine,completedAt:report.completedAt,settings:report.settings,gap:candidate.gap,actualScore:candidate.actualScore,bestScore:candidate.bestScore,
                    player:ref.player==='p2'?'p2':'p1',status:candidate.status,actualMove:candidate.actualMove,bestMove:candidate.bestMove,aiPlan:candidate.aiPlan,sourceBoard:candidate.sourceBoard};
                await post('/api/records',{kind:'tetofu',title:`${reference.title} · ${ai.player.toUpperCase()} ${reference._fullMatch?'局面':'検討手順'}${candidate.pageIndex+1}`.slice(0,250),tags:[...new Set([...(reference.tags||[]),'AI候補'])],
                    snapshot:candidate.snapshot,sourceRef:ref,parentId:ref.recordId,visibility:'private',research:{stage:'candidate',ai,notes:''}});selected.delete(index);list.querySelectorAll('input')[index].disabled=true;count++;
            }d.close();await refresh(true);notice(`${count}件を研究ノートに追加しました。`);}finally{save.disabled=false;}
        });d.append(save,button('閉じる',()=>d.close()));d.showModal();
    }
    function guide(section='workflow'){
        const d=dialog(section==='editor'?'局面エディタの使い方':'配信から記事・問題までの使い方');
        const groups=section==='editor'?[
            ['盤面の手直し','上の色を選んで盤面をクリック、またはドラッグして塗ります。同じ色のマスをもう一度押すと消せます。失敗したら左向き矢印で元に戻せます。'],
            ['NEXTとHOLD','NEXTのミノを押して順番を追加します。盤面だけでなく、次に来るミノとHOLDも動画と見比べてください。'],
            ['ページと再生','「前の局面」「次の局面」で移動します。「再生で確認」は再生表示、「盤面を編集」は編集表示、「ここから練習」はその状態で練習する画面です。'],
            ['研究用の局面を編集する','ここは問題や検討用のテト譜を作る画面です。保存した研究資料を更新できます。解析結果そのものの修正はPCの配信解析で済ませ、完成ファイルを取り込み直してください。'],
            ['元動画と検討手順の関係','練習や編集をした盤面は、元動画と違う手順になることがあります。保存する出典のリンクは、検討を始めた元の局面を保ちます。エディタ内やAI採点の局面番号は、検討中の手順内の番号です。'],
            ['問題を作る','局面を研究ノートに保存してから、「整理・問題化」で問題文と解答を書きます。局面の練習では解答の続きは読み込みません。'],
            ['AI採点','動画ページの「AI採点の設定」で対象プレイヤーと考える量を保存します。「この試合をAI採点」または「この動画をまとめてAI採点」で指摘した場所の一覧を作ります。「AIの指摘を見る」の時刻を押すと該当局面へ移動できます。研究ノートへの自動保存はしません。エディタ内の採点画面では、範囲を絞った追加調査もできます。']
        ]:[
            ['1. PCの配信解析で解析・修正する','「管理メニュー」→「PCの配信解析を開く」、または「ぷよテト配信を全自動解析.bat」を起動します。今までどおり動画を解析し、盤面・NEXT・HOLD・選手名を修正します。最後に「修正を再判定」を実行して保存してください。Labでは動画解析を実行しません。'],
            ['2. 完成した結果を取り込む','「完成結果を取り込む」でPCの batch-results.json を選びます。1試合だけなら simulator フォルダーの *_tetris_recovered.json も使えます。解析履歴から選ぶこともできます。完成した試合の一覧を確認して取り込みます。未完成の試合は取り込まれません。完成結果だけを1つの .tetris-lab.json に保存して、後から取り込むこともできます。'],
            ['3. YouTubeと局面をつなぐ','Videos / Analysis から動画を開きます。「動画・解析結果を編集」でYouTubeのURLを変更できます。時刻がずれる場合は同じ画面で補正します。試合時刻や局面のバーを押すと、埋め込み動画も同じ時刻へ移動します。'],
            ['4. 局面を集める・AIに探させる','気になった時刻でP1 / P2を選び、「研究ノートに保存」します。AI採点はあらかじめ設定を保存し、採点ボタンを押すと「AIの指摘を見る」から該当局面へ飛べます。AIの評価だけで悪手とは判断しません。保存したい局面だけ、自分で「研究ノートに保存」を押します。'],
            ['5. 難地形を厳選する','「研究ノート」に候補が集まります。タグや研究メモで比較し、「整理・問題化」で「厳選した難地形」に移します。保留にもできます。'],
            ['6. 記事を書く・問題にする','「記事を書く」から本文に直接入力します。見出しや太字は上の道具、局面は右の資料棚から挿入できます。引用の並べ替え・削除も本文の中で操作します。書きかけはこのPCに自動保存され、記事の保存は右上のボタンです。問題は研究ノートの「整理・問題化」で作ります。'],
            ['7. Labに公開する','動画設定にYouTubeのURLを貼り、公開したい資料を「公開対象」にします。「管理メニュー」→「公開管理」で内容を見て「Labに公開する」を押します。PCの動画や非公開の研究メモは送信しません。'],
            ['資料を削除する','研究ノートはカードの「ごみ箱に移す」で削除できます。記事は記事ページから、その他は「管理メニュー」→「詳細管理」→資料→「編集する」→「ごみ箱に移す」です。「管理メニュー」→「ごみ箱」から資料を選び、「資料を戻す」で復元できます。公開済みの資料は次の公開操作でサイトにも反映されます。'],
            ['編集できる範囲','管理画面はこのPCの中からだけ接続できます。公開サイトに編集用サーバーはありません。ただし、このPCを操作できる人やプログラムまで本人と区別するログイン機能ではありません。GitHub側の編集権限はGitHubアカウントの設定に従います。']
        ];
        for(const [title,text]of groups){d.append(node('h3',title),node('p',text));}d.append(button('閉じる',()=>d.close()));d.showModal();
    }
    return {capture,sourceRef,sourceAtPage,resolveSourceLink,sourceLink,practiceState,firstPage,boardPreview,editResearch,renderCitations,renderWorkspace,openDetail,scoreReport,guide};
}
