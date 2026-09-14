// Metadata-only index: opening a result is the first time a replay is decoded.
export const normalize = value => String(value ?? '').normalize('NFKC').trim().replace(/\s+/g, ' ').toLocaleLowerCase('ja');
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
            tags: new Set([...ownTags, ...(match.tags || []), ...(match.bookmarks || []).flatMap(b => b.tags || [])].map(normalize)),
            text: normalize([...common, match.title, ...(match.players || []), ...(match.tags || []), ...(match.bookmarks || []).flatMap(b => [b.label, b.note, ...(b.tags || [])])].join(' '))
        }));
        return {video, matches, tags: new Set(ownTags.map(normalize)), text: normalize(common.join(' '))};
    });
}
export function filterVideoIndex(index, filters = {}) {
    const words = normalize(filters.query).split(' ').filter(Boolean), tag = normalize(filters.tag);
    return index.flatMap(entry => {
        if (filters.analysis === 'yes' && !entry.matches.length || filters.analysis === 'no' && entry.matches.length) return [];
        const matches = entry.matches.filter(row => samePlayers(row.match.players, filters.player, filters.opponent)
            && (!tag || row.tags.has(tag)) && words.every(word => row.text.includes(word)));
        const standalone = !entry.matches.length && !filters.player && !filters.opponent
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
        select('タグ', 'tag', [['','すべて'], ...choices(state.videos.flatMap(v => [...(v.tags || []), ...(v.labMatches || []).flatMap(m => m.tags || [])]))]);
        select('解析', 'analysis', [['','すべて'], ['yes','解析あり'], ['no','解析なし']]);
        select('並び順', 'sort', [['newest','新しい順'], ['oldest','古い順'], ['title','タイトル順']]);
        const clear = button('絞り込みを解除', () => {
            for (const [key, input] of inputs) input.value = filters[key] = key === 'sort' ? 'newest' : '';
            page = 0;draw();
        });controls.append(clear);root.append(controls);
        const count = node('p', undefined, 'lab-video-count');count.setAttribute('aria-live', 'polite');
        const list = node('div', undefined, 'list-container'), pager = node('nav', undefined, 'lab-video-pagination');pager.setAttribute('aria-label', '一覧のページ');
        root.append(count, list, pager);
        for (const [key, input] of inputs) input.addEventListener(key === 'query' ? 'input' : 'change', () => {filters[key] = input.value;page = 0;draw();});
        function draw() {
            const entries = filterVideoIndex(index, filters), dated = video => Date.parse(video.date || video.updatedAt) || 0;
            entries.sort((a, b) => filters.sort === 'title' ? a.video.title.localeCompare(b.video.title, 'ja') : filters.sort === 'oldest' ? dated(a.video) - dated(b.video) : dated(b.video) - dated(a.video));
            const rows = mode === 'videos' ? entries : entries.flatMap(entry => entry.matches.map(row => ({...row, video:entry.video})));
            const matchCount = entries.reduce((n, e) => n + e.matches.length, 0), pageCount = Math.max(1, Math.ceil(rows.length / 40));
            page = Math.min(page, pageCount - 1);
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
                    const meta = node('div', undefined, 'card-meta');meta.append(node('span', video.title), node('span', video.date || ''));
                    const heading = node('h3', undefined, 'card-title'), title = node('a', `試合 ${match.analysis?.index || row.index + 1} · ${(match.players || []).filter(Boolean).join(' / ') || 'プレイヤー未登録'}`, 'card-title-action');
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
