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
