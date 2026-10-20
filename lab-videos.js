// Metadata-only index: opening a result is the first time a replay is decoded.
export const normalize = value => String(value ?? '').normalize('NFKC').trim().replace(/\s+/g, ' ').toLocaleLowerCase('ja');
export function mergedTags(...groups){const unique=new Map();for(const tag of groups.flat()){const label=String(tag??'').trim(),key=normalize(label);if(key&&!unique.has(key))unique.set(key,label);}return [...unique.values()];}
export function matchTags(match){return mergedTags(match.tags||[],['動画解析'],match.players||[]);}
export function videoTags(video){return mergedTags(video.tags||[],...(video.labMatches||[]).flatMap(m=>[matchTags(m),...(m.bookmarks||[]).map(b=>b.tags||[])]));}
export function samePlayers(players = [], player = '', opponent = '') {
    const names = players.map(normalize), p = normalize(player), o = normalize(opponent);
    if (p && o) return names.some((name, i) => name === p && names.some((other, j) => i !== j && other === o));
    return (!p || names.includes(p)) && (!o || names.includes(o));
}
export function choices(values) {
    const labels = new Map();
    for (const value of values.flat().filter(Boolean)) if (normalize(value)) labels.set(normalize(value), String(value).trim());
    return [...labels].sort((a, b) => a[1].localeCompare(b[1], 'ja'));
}
export function videoIndex(videos) {
    return videos.map(video => {
        const ownTags = video.labOwnTags ?? video.tags ?? [];
        const common = [video.title, video.labVirtual ? '' : video.description, ...ownTags];
        const matches = (video.labMatches || []).map((match, index) => ({
            match, index,
            tags: new Set([...ownTags, ...matchTags(match), ...(match.bookmarks || []).flatMap(b => b.tags || [])].map(normalize)),
            text: normalize([...common, match.title, ...matchTags(match), ...(match.bookmarks || []).flatMap(b => [b.label, b.note, ...(b.tags || [])])].join(' '))
        }));
        return {video, matches, tags: new Set(ownTags.map(normalize)), text: normalize(common.join(' '))};
    });
}
export function filterVideoIndex(index, filters = {}) {
    const words = normalize(filters.query).split(' ').filter(Boolean), tag = normalize(filters.tag);
    const player = normalize(filters.player);
    // 勝敗フィルタ: プレイヤーが指定されているときだけ「その人が勝った/負けた」で絞る
    const resultOk = match => {
        const want = filters.result;
        if (!want || !player) return true;
        if (want === 'review') return !match.winner || match.winnerStatus !== 'ok';
        const names = (match.players || []).map(normalize);
        const side = names.findIndex(name => name === player);
        if (side < 0) return true;
        const won = match.winner === (side === 0 ? 'p1' : 'p2');
        return want === 'win' ? won : !won;
    };
    return index.flatMap(entry => {
        if (filters.analysis === 'yes' && !entry.matches.length || filters.analysis === 'no' && entry.matches.length) return [];
        const matches = entry.matches.filter(row => samePlayers(row.match.players, filters.player, filters.opponent)
            && resultOk(row.match) && (!tag || row.tags.has(tag)) && words.every(word => row.text.includes(word)));
        const standalone = !entry.matches.length && !filters.player && !filters.opponent && !filters.result
            && (!tag || entry.tags.has(tag)) && words.every(word => entry.text.includes(word));
        return matches.length || standalone ? [{...entry, matches}] : [];
    });
}

export function createVideoLibrary({state, node, button, openMatch}) {
    const filters = {query:'', player:'', tag:'', analysis:'', sort:'newest'};
    let mode = 'videos', page = 0;
    const time = value => {const seconds = Math.max(0, Math.floor(Number(value) || 0));return Math.floor(seconds / 60) + ':' + String(seconds % 60).padStart(2, '0');};
    function render(options = {}) {
        if (options.mode && mode !== options.mode) {mode = options.mode;page = 0;}
        const index = videoIndex(state.videos), main = document.getElementById('main-view');
        const root = node('section', undefined, 'lab-video-library');
        main.replaceChildren(root);
        const header = node('div', undefined, 'lab-video-library-heading');
        header.append(node('h2', '動画研究', 'section-title'));
        if (state.token) {const back = node('a', '動画の管理', 'btn-outline');back.href = '#manage/research';header.append(back);}
        root.append(header);
        const tabs = node('div', undefined, 'lab-video-tabs');tabs.setAttribute('aria-label', '動画の表示');
        const modes = [['videos','動画一覧'],['matches','試合一覧']].map(([value, label]) => {
            const control = button(label, () => {mode = value;page = 0;draw();});
            control.dataset.view = value;tabs.append(control);return control;
        });
        root.append(tabs);
        const controls = node('div', undefined, 'lab-video-filters'), inputs = [];
        const searchWrap = node('label', '検索'), search = node('input');
        search.type = 'search';search.placeholder = '動画名・プレイヤー・タグ';search.value = filters.query;
        search.setAttribute('aria-label', '動画・試合を検索');searchWrap.append(search);controls.append(searchWrap);inputs.push(['query', search]);
        const select = (label, key, values) => {
            const wrap = node('label', label), input = node('select');input.setAttribute('aria-label', label);
            for (const [value, text] of values) {const option = node('option', text);option.value = value;input.append(option);}
            input.value = filters[key];if (input.selectedIndex < 0) input.value = filters[key] = '';
            wrap.append(input);controls.append(wrap);inputs.push([key, input]);return input;
        };
        const players = choices(index.flatMap(e => e.matches.flatMap(r => r.match.players || [])));
        select('プレイヤー', 'player', [['','すべて'], ...players]);
        select('相手', 'opponent', [['','すべて'], ...players]);
        // タグ欄には解析系の合成タグ（動画解析）とプレイヤー名を出さない
        const playerKeys = new Set(players.map(p => normalize(p[0])));
        const tagChoices = choices(state.videos.flatMap(v => [...(v.tags || []), ...(v.labMatches || []).flatMap(m => m.tags || [])]))
            .filter(([value]) => normalize(value) !== normalize('動画解析') && !playerKeys.has(normalize(value)));
        select('タグ', 'tag', [['','すべて'], ...tagChoices]);
        select('勝敗', 'result', [['','すべて'], ['win','勝ち'], ['lost','負け'], ['review','未確定']]);
        select('並び順', 'sort', [['newest','新しい順'], ['oldest','古い順'], ['title','タイトル順']]);
        const clear = button('絞り込みを解除', () => {
            for (const [key, input] of inputs) input.value = filters[key] = key === 'sort' ? 'newest' : '';
            page = 0;draw();
        });
        // 絞り込み結果を1本の仮想動画（#feature/<id>）として開く
        const feature = button('特集として開く', () => {
            if (!filterVideoIndex(index, filters).some(entry => entry.matches.length)) return;
            location.hash = 'feature/' + encodeURIComponent(featureId(filters));
        });
        controls.append(clear, feature);root.append(controls);
        const count = node('p', undefined, 'lab-video-count');count.setAttribute('aria-live', 'polite');
        const list = node('div', undefined, 'list-container'), pager = node('nav', undefined, 'lab-video-pagination');pager.setAttribute('aria-label', '一覧のページ');
        root.append(count, list, pager);
        for (const [key, input] of inputs) input.addEventListener(key === 'query' ? 'input' : 'change', () => {filters[key] = input.value;page = 0;draw();});
        function draw() {
            const entries = filterVideoIndex(index, filters), dated = video => Date.parse(video.date || video.updatedAt) || 0;
            entries.sort((a, b) => filters.sort === 'title' ? a.video.title.localeCompare(b.video.title, 'ja') : filters.sort === 'oldest' ? dated(a.video) - dated(b.video) : dated(b.video) - dated(a.video));
            const rows = mode === 'videos' ? entries : entries.flatMap(entry => entry.matches.map(row => ({...row, video:entry.video})));
            // 試合一覧では、どの動画から来た試合かを「動画①」のように番号で示す
            const sourceOrder = new Map();
            if (mode === 'matches') for (const row of rows) if (!sourceOrder.has(row.video.id)) sourceOrder.set(row.video.id, sourceOrder.size + 1);
            const matchCount = entries.reduce((n, e) => n + e.matches.length, 0), pageCount = Math.max(1, Math.ceil(rows.length / 40));
            page = Math.min(page, pageCount - 1);
            feature.disabled = matchCount === 0;
            feature.title = matchCount ? `絞り込み結果の${matchCount}試合を1本の特集として開く` : '該当する試合がありません';
            count.textContent = `${entries.length}動画 · ${matchCount}試合`;
            for (const tab of modes) {tab.setAttribute('aria-pressed', String(tab.dataset.view === mode));tab.classList.toggle('lab-primary', tab.dataset.view === mode);}
            list.replaceChildren();pager.replaceChildren();
            for (const row of rows.slice(page * 40, (page + 1) * 40)) {
                if (mode === 'videos') {
                    window.renderCard(list, {...row.video, type:'動画', action:() => window.router('videos', row.video.id)});
                    const summary = list.lastElementChild.querySelector('.lab-analysis-count');
                    if (summary) summary.textContent = row.matches.length === row.video.labMatches.length ? `解析 ${row.matches.length}試合` : `該当 ${row.matches.length} / ${row.video.labMatches.length}試合`;
                } else {
                    const {video, match} = row, card = node('article', undefined, 'card lab-video-match-card');
                    const meta = node('div', undefined, 'card-meta');
                    const badge = node('span', sourceBadge(sourceOrder.get(video.id)), 'lab-source-badge');
                    badge.title = '出典: ' + video.title;
                    meta.append(badge, node('span', video.title), node('span', video.date || ''));
                    const heading = node('h3', undefined, 'card-title'), title = node('a', '', 'card-title-action');
                    title.append(document.createTextNode(`試合 ${match.analysis?.index || row.index + 1} · `));
                    const names = (match.players || []).filter(Boolean);
                    if (!names.length) title.append(document.createTextNode('プレイヤー未登録'));
                    names.forEach((name, index) => {
                        if (index) title.append(document.createTextNode(' / '));
                        if (match.winner === (index === 0 ? 'p1' : 'p2')) {
                            const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
                            svg.setAttribute('viewBox', '0 0 24 24');
                            svg.setAttribute('class', 'lab-crown' + (match.winnerStatus !== 'ok' ? ' lab-crown-review' : ''));
                            svg.setAttribute('role', 'img');
                            svg.setAttribute('aria-label', '勝者');
                            const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                            path.setAttribute('d', 'M2.5 19.5v-12l5 3.6L12 4.6l4.5 6.5 5-3.6v12z');
                            svg.append(path);
                            title.append(svg);
                        }
                        title.append(document.createTextNode(name));
                    });
                    title.href = '#videos/' + encodeURIComponent(video.id);
                    title.onclick = event => {if (event.button || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;event.preventDefault();openMatch(video, match);};heading.append(title);
                    const offset = video.youtubeId ? Number(video.youtubeOffsetSeconds) || 0 : 0;
                    card.append(meta, heading, node('p', `${time((match.startSeconds || 0) + offset)}〜${time((match.endSeconds || 0) + offset)}${match.status === 'failed' ? ' · 解析失敗' : ''}`, 'lab-video-match-time'));
                    const tags = node('div', undefined, 'lab-video-match-tags');
                    for (const label of (match.tags || []).slice(0, 6)) {const tag = node('a', label, 'tag');tag.href = '#tags/' + encodeURIComponent(label);tags.append(tag);}card.append(tags);
                    card.onclick = event => {if (!event.target.closest('a,button') && !window.getSelection()?.toString()) openMatch(video, match);};
                    list.append(card);
                }
            }
            if (!rows.length) list.append(node('p', index.length ? '条件に合う' + (mode === 'videos' ? '動画' : '試合') + 'はありません。' : '動画はまだありません。', 'lab-help-text'));
            if (pageCount > 1) {
                const previous = button('前へ', () => {page--;draw();root.scrollIntoView({block:'start'});}), next = button('次へ', () => {page++;draw();root.scrollIntoView({block:'start'});});
                previous.disabled = page === 0;next.disabled = page + 1 === pageCount;pager.append(previous, node('span', `${page + 1} / ${pageCount}`), next);
            }
        }
        draw();
    }
    return {render};
}

// ---- 特集（仮想動画）: 絞り込み結果を1本の動画として扱う ----
const FEATURE_KEYS = {query: 'q', player: 'p', opponent: 'o', tag: 't', result: 'r'};
const EMPTY_FEATURE_FILTERS = {query: '', player: '', opponent: '', tag: '', result: ''};
const FEATURE_RESULTS = {win: 'WIN', lost: 'LOSE', review: 'REVIEW'};

// 出どころの動画番号（1 → ①、21以降はそのまま）
export function circledNumber(value) {
    const number = Math.max(1, Math.floor(Number(value) || 0));
    return number <= 20 ? String.fromCodePoint(0x245f + number) : String(number);
}
export function sourceBadge(ordinal) { return '動画' + circledNumber(ordinal); }

// 絞り込み条件をURLに載せられる短いIDにする（#feature/<id>）
export function featureId(filters = {}) {
    const value = {};
    for (const [key, short] of Object.entries(FEATURE_KEYS)) {
        const text = String(filters[key] ?? '').trim();
        if (text) value[short] = text;
    }
    if (!Object.keys(value).length) return 'all';
    let binary = '';
    for (const byte of new TextEncoder().encode(JSON.stringify(value))) binary += String.fromCharCode(byte);
    return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
export function featureFiltersFromId(id) {
    if (!id || id === 'all') return {...EMPTY_FEATURE_FILTERS};
    let value;
    try {
        const binary = atob(String(id).replace(/-/g, '+').replace(/_/g, '/'));
        value = JSON.parse(new TextDecoder().decode(Uint8Array.from(binary, character => character.charCodeAt(0))));
    } catch { return null; }
    if (!value || typeof value !== 'object') return null;
    const filters = {...EMPTY_FEATURE_FILTERS};
    for (const [key, short] of Object.entries(FEATURE_KEYS)) if (typeof value[short] === 'string') filters[key] = value[short];
    return filters;
}

// 絞り込み結果の試合を、出典動画の公開日→試合開始時刻の順に並べる
export function featureRows(index, filters = {}) {
    const rows = [];
    for (const entry of filterVideoIndex(index, filters)) {
        for (const row of entry.matches) rows.push({
            video: entry.video, match: row.match, sourceIndex: row.index,
            offset: entry.video.youtubeId ? Number(entry.video.youtubeOffsetSeconds) || 0 : 0
        });
    }
    const dated = row => Date.parse(row.video.date || row.video.updatedAt) || 0;
    rows.sort((a, b) => dated(a) - dated(b)
        || (Number(a.match.startSeconds) || 0) - (Number(b.match.startSeconds) || 0)
        || String(a.match.id).localeCompare(String(b.match.id)));
    const ordinals = new Map();
    for (const row of rows) {
        if (!ordinals.has(row.video.id)) ordinals.set(row.video.id, ordinals.size + 1);
        row.sourceOrdinal = ordinals.get(row.video.id);
    }
    return rows;
}

const featureQuote = value => /[\s"]/u.test(value) ? '"' + value.replace(/"/g, '') + '"' : value;

// 絞り込み条件から特集タイトルを機械的に作る
// 例: いんたい LOSE 42matches [2026-09-14 - 2026-10-19] / all 1101matches [...] / tag:名前 12matches
export function featureTitle(filters = {}, count = 0, range = null) {
    const player = String(filters.player || '').trim();
    const opponent = String(filters.opponent || '').trim();
    const tag = String(filters.tag || '').trim();
    const query = String(filters.query || '').trim();
    const result = FEATURE_RESULTS[filters.result] || '';
    const parts = [];
    if (query) parts.push('q:"' + query.replace(/"/g, '') + '"');
    if (player && opponent) parts.push(player + ' vs ' + opponent);
    else if (player) parts.push(player);
    else if (opponent) parts.push('vs ' + opponent);
    if ((player || opponent) && tag) parts.push('tag:' + featureQuote(tag));
    else if (!player && !opponent) parts.push(tag ? 'tag:' + featureQuote(tag) : 'all');
    // 勝敗はプレイヤーを指定したときだけ効く（絞り込み側の仕様に合わせる）
    if (result && player) parts.push(result);
    if (Number(count) > 0) parts.push(count + 'matches');
    if (range?.from) parts.push(range.to && range.to !== range.from ? '[' + range.from + ' - ' + range.to + ']' : '[' + range.from + ']');
    return parts.join(' ');
}

const featureDate = value => {
    const date = new Date(value);
    return date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0') + '-' + String(date.getDate()).padStart(2, '0');
};

// 仮想動画レコード（既存の動画詳細ページと同じ形）を作る
export function featureRecord(index, filters = {}, {now = new Date()} = {}) {
    const rows = featureRows(index, filters);
    const dates = rows.map(row => String(row.video.date || '')).filter(Boolean).sort();
    const range = dates.length ? {from: dates[0], to: dates[dates.length - 1]} : null;
    const sources = new Map();
    for (const row of rows) {
        const source = sources.get(row.video.id) || {video: row.video, ordinal: row.sourceOrdinal, count: 0};
        source.count += 1;
        sources.set(row.video.id, source);
    }
    const picks = [filters.player, filters.opponent].map(value => String(value || '').trim()).filter(Boolean);
    const tally = {win: 0, lose: 0, review: 0};
    const self = String(filters.player || '').trim();
    for (const row of rows) {
        const match = row.match;
        if (!self) break;
        if (!match.winner || match.winnerStatus !== 'ok') { tally.review += 1; continue; }
        const side = (match.players || []).map(normalize).indexOf(normalize(self));
        if (side < 0) continue;
        if (match.winner === (side === 0 ? 'p1' : 'p2')) tally.win += 1; else tally.lose += 1;
    }
    const tags = [filters.tag, ...picks, '特集'].map(value => String(value || '').trim()).filter(Boolean);
    const title = featureTitle(filters, rows.length, range);
    const summary = ['- 対象: ' + rows.length + '試合', '- 出典: ' + sources.size + '本の動画'];
    if (range) summary.push('- 期間: ' + range.from + (range.to && range.to !== range.from ? ' — ' + range.to : ''));
    if (self) summary.push('- 戦績: ' + tally.win + '勝 ' + tally.lose + '敗' + (tally.review ? '（未確定 ' + tally.review + '）' : ''));
    const content = [
        'この特集は動画研究の絞り込み結果を、古い順に1本の動画として続けて再生します。',
        '',
        ...summary,
        '',
        '条件を変えるときは「動画研究」の絞り込みから開き直してください。'
    ].join('\n');
    return {
        id: featureId(filters),
        labFeature: true,
        featureFilters: {...filters},
        title,
        date: featureDate(now),
        players: picks,
        tags,
        labOwnTags: tags,
        content,
        description: rows.length + '試合 · ' + sources.size + '本の動画' + (range ? ' · ' + range.from + ' — ' + range.to : ''),
        youtubeId: '',
        labMatches: rows.map(row => row.match),
        labFeatureRows: rows,
        labFeatureSources: [...sources.values()],
        publicPlayback: {enabled: true}
    };
}

// 次の出典動画を先読みしておく（表示はしない）
export function preloadVideo(video) {
    const youtubeId = video?.youtubeId;
    if (!youtubeId) return;
    const id = 'lab-preload-' + youtubeId;
    if (document.getElementById(id)) return;
    const frame = document.createElement('iframe');
    frame.id = id;
    frame.className = 'lab-preload-frame';
    frame.src = `https://www.youtube.com/embed/${youtubeId}?autoplay=0&mute=1&controls=0`;
    frame.setAttribute('aria-hidden', 'true');
    frame.tabIndex = -1;
    frame.style.cssText = 'position:fixed;width:1px;height:1px;opacity:0;pointer-events:none;left:-10px;top:-10px;border:0';
    document.body.append(frame);
}
export function dropPreload(youtubeId) {
    if (youtubeId) document.getElementById('lab-preload-' + youtubeId)?.remove();
}
export function clearPreloads() {
    for (const frame of document.querySelectorAll('iframe.lab-preload-frame')) frame.remove();
}
