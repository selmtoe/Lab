// Shared by the article site and the detailed library. No data API is involved.
export function mountAppearanceControl() {
    if (document.querySelector('.lab-appearance-toggle')) return;
    const key = 'lab-appearance-mode', root = document.documentElement;
    const control = document.createElement('button');
    control.type = 'button';
    control.className = 'lab-appearance-toggle';
    control.setAttribute('aria-label', 'ダークモード');
    const moon = '<path d="M17.5 13.4A7 7 0 0 1 10.6 4.5a7 7 0 1 0 6.9 8.9Z" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>';
    const sun = '<circle cx="10" cy="10" r="3.3" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M10 1.8v1.4m0 13.6v1.4M1.8 10h1.4m13.6 0h1.4M4.2 4.2l1 1m9.6 9.6 1 1m0-11.6-1 1m-9.6 9.6-1 1" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>';
    function apply(value, save = false) {
        const dark = value === 'dark';
        root.dataset.labTheme = dark ? 'dark' : 'light';
        control.setAttribute('aria-pressed', String(dark));
        control.title = (dark ? 'ライト' : 'ダーク') + 'モードに切り替える';
        control.innerHTML = '<svg viewBox="0 0 20 20" aria-hidden="true">' + (dark ? sun : moon) + '</svg>';
        if (save) { try { localStorage.setItem(key, root.dataset.labTheme); } catch {} }
    }
    let initial = root.dataset.labTheme;
    try { initial = localStorage.getItem(key); } catch {}
    apply(initial);
    control.addEventListener('click', () => apply(root.dataset.labTheme === 'dark' ? 'light' : 'dark', true));
    window.addEventListener('storage', event => { if (event.key === key || event.key === null) apply(event.newValue); });
    document.body.append(control);
}

export function youtubeId(value) {
    if (!value) return '';
    const url = new URL(value); let id = '';
    if (url.hostname === 'youtu.be') id = url.pathname.split('/')[1];
    if (['youtube.com','www.youtube.com','m.youtube.com','www.youtube-nocookie.com'].includes(url.hostname))
        id = url.searchParams.get('v') || url.pathname.match(/^\/(?:embed|shorts|live)\/([\w-]{11})/)?.[1] || '';
    if (!/^[\w-]{11}$/.test(id)) throw Error('YouTubeの動画URLを確認してください。');
    return id;
}
export function timeText(seconds) {
    seconds = Math.max(0, Number(seconds) || 0);
    const hours = Math.floor(seconds/3600), minutes = Math.floor(seconds%3600/60), rest = Math.floor(seconds%60);
    return (hours ? `${hours}:` : '') + (hours ? String(minutes).padStart(2,'0') : minutes) + ':' + String(rest).padStart(2,'0');
}
export function encodeState(value) {
    const bytes = new TextEncoder().encode(JSON.stringify(value));let binary = '';
    for (let i=0;i<bytes.length;i+=32768) binary += String.fromCharCode(...bytes.subarray(i,i+32768));
    return btoa(binary);
}
export function stateFromUrl(value) {
    const hash = new URL(value).hash.slice(1);
    if (!hash || hash.length>8*1024*1024) throw Error('このリンクには対応する盤面データがありません。');
    return JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(decodeURIComponent(hash)),c=>c.charCodeAt(0))));
}
export function pageState(page, player='both') {
    const convert = p => ({b:typeof p?.board==='string'?p.board:(p?.board||[]).flat().map(c=>c||'_').join('').padEnd(400,'_'),
        n:((p?.active ?? p?.operation?.type ?? '') + (p?.next||'')).replace(/[^IOTLSJZ]/g,''),h:p?.hold||''});
    if (player==='p2') return {v:2,m:'1P',p1:convert(page.p2)};
    return {v:2,m:player==='p1'||!page.p2?'1P':'2P',p1:convert(page.p1),...(player==='both'&&page.p2?{p2:convert(page.p2)}:{})};
}
export function unpackLabelBoard(value) {
    if (!value) return '_'.repeat(400);
    const match = String(value).match(/^([0-9a-z]+)\.(.*)$/);
    const board = match ? '_'.repeat(parseInt(match[1],36)*10)+match[2] : value;
    return board.length===400 ? board : '_'.repeat(400);
}

// Explicitly selected simultaneous positions remain selected until playback moves on.
export function playbackPosition(matches, seconds, pagesFor, preferred=null) {
    if (!Number.isFinite(seconds)) return {match:null,index:-1,pinned:false};
    const explicit=preferred&&matches.find(match=>match.id===preferred.recordId);
    if (explicit&&Number.isInteger(preferred.index)&&preferred.index>=0&&
        Math.abs(seconds-preferred.seconds)<0.05&&pagesFor(explicit)[preferred.index])
        return {match:explicit,index:preferred.index,pinned:true};
    let match=null;
    for (const candidate of matches) {
        if (candidate.startSeconds<=seconds&&candidate.endSeconds>=seconds&&
            (!match||candidate.startSeconds>match.startSeconds)) match=candidate;
    }
    if (!match) return {match:null,index:-1,pinned:false};
    const pages=pagesFor(match),relative=seconds-match.startSeconds;
    let low=0,high=pages.length;
    while(low<high){const middle=(low+high)>>1;if((pages[middle].time||0)<=relative)low=middle+1;else high=middle;}
    return {match,index:pages.length?Math.max(0,low-1):-1,pinned:false};
}

export function videoSettingsSave(post,storage,key) {
    let pending=null;
    try {const value=JSON.parse(storage.getItem(key)||'null');if(value?.operationId&&value.video?.kind==='video'&&Array.isArray(value.records)&&value.patch)pending=value;}catch{}
    const clear=()=>{try{storage.removeItem(key);}catch{}pending=null;};
    return {
        get pending(){return pending;},
        prepare(value,viewedSeconds){
            if(pending)return pending;
            const operation={...structuredClone(value),operationId:crypto.randomUUID(),viewedSeconds:Number.isFinite(viewedSeconds)?viewedSeconds:null};
            try{storage.setItem(key,JSON.stringify(operation));}catch{throw Error('保存の確認情報をブラウザーに残せませんでした。入力内容は保持しています。もう一度保存してください。');}
            return pending=operation;
        },
        async submit(){
            if(!pending)throw Error('保存する動画設定がありません。');
            const {viewedSeconds,...request}=pending;
            try{return await post('/api/video-settings',request);}catch(error){if([400,409,413].includes(error.status))clear();throw error;}
        },
        clear,
    };
}

export function videoSettingsFields(values) {
    const reject=(field,message)=>{throw Object.assign(Error(message),{field});};
    const title=values.title||'',length=Array.from(title).length;
    if(!title.trim())reject('title','動画のタイトルを入力してください。');
    if(length>250)reject('title',`動画のタイトルは${length}文字あります。250文字以内にしてください。`);
    let id;try{id=youtubeId((values.youtube||'').trim());}catch{reject('youtube','YouTubeの動画URLを確認してください。動画を開いたときのURLを貼り付けてください。');}
    const raw=(values.offset||'').trim(),offset=Number(raw);
    if(!raw)reject('offset','時刻補正を秒数で入力してください。補正をなくす場合は「0」を入力してください。');
    if(!Number.isFinite(offset)||offset<=-1e7||offset>=1e7)reject('offset','時刻補正は−10,000,000秒より大きく、10,000,000秒より小さい数値で入力してください。小数も使えます。');
    const tags=[...new Set((values.tags||'').split(',').map(tag=>tag.trim()).filter(Boolean))];
    for(const tag of tags){const letters=Array.from(tag);if(letters.length>100)reject('tags',`タグ「${letters.slice(0,20).join('')}…」は${letters.length}文字あります。1つのタグは100文字以内にしてください。`);}
    if(tags.length>100)reject('tags',`タグが${tags.length}個あります。1つの資料に付けられるタグは100個までです。`);
    return {title,youtubeId:id,youtubeOffsetSeconds:offset,tags,...(values.visibility?{visibility:values.visibility}:{})};
}
