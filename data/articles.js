window.LAB_ARTICLES = [
    {
        id: 'advent-2025',
        date: '2025-12-10',
        title: 'テトリスにおける「座学」と「実技」の融合（アドカレ記事）',
        tags: ['思考', 'マインドセット', 'シミュレータ'],
        description: 'テトリスの上達法について、座学と実技の比率から考察したnote記事。',
        externalUrl: 'https://note.com/noted_intai2110/n/na8dfea1eb5e2' // 外部リンクの場合はこれを書く
    },
    {
        id: 'math-resource-theory',
        date: '2025-12-05',
        title: '対戦テトリスにおけるリソース理論：マクロ的動態分析',
        tags: ['数学', 'リソース', '理論'],
        description: '試合状況を「盤面の潜在的攻撃性(リソース)」としてモデル化する。',
        // 内部で読ませる記事の場合は content を書く。HTMLタグ(<h3>や<p>など)が使えます。
        content: `
            <h3>1. 基本概念の定義</h3>
            <p>本稿は、対戦テトリスにおけるゲーム進行を、二者間に存在する総リソース量の動態として把握するマクロ的枠組みを提示する。</p>
            <p>リソース (R): 盤面が持つ潜在的な攻撃力。盤面に存在する総ブロックの量に比例する...</p>
        `
    },
    {
        id: 'simulator-embed-test',
        date: '2025-12-01',
        title: 'Iミノ上部最適化の検証',
        tags: ['地形構築', 'Iミノ', 'シミュレータ'],
        description: 'シミュレータを使って実際に動かしてみるテスト。',
        content: `
            <p>以下のシミュレータで、Iミノを引くまで耐えるルートを実際に動かして確認してください。</p>
            <iframe src="https://selmtoe.github.io/Tetris_Simulator/"></iframe>
            <p>Sを引いた場合、右側の溝を埋めずに...</p>
        `
    }
];
