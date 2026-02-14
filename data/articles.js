window.LAB_ARTICLES = [
    {
        id: 'advent-2025',
        date: '2025-12-10',
        title: '上達のための「座学」の重要性と、シミュレータを自作してレート3600を達成した話',
        tags: ['座学', '自分語り', 'シミュレータ'],
        description: 'アドカレ2025の記事',
        externalUrl: 'https://note.com/noted_intai2110/n/na57cebd775ad'
    },
    {
        id: 'advent-2025-sub',
        date: '2025-12-01',
        title: '自作シミュレータの機能紹介',
        tags: ['シミュレータ'],
        description: 'アドカレ2025のおまけ記事',
        externalUrl: 'https://note.com/noted_intai2110/n/na8dfea1eb5e2'
    },
    {
        id: 'math-resource-theory',
        date: '2025-12-05',
        title: '対戦テトリスにおけるリソース理論：マクロ的動態分析',
        tags: ['数学', 'リソース', '理論'],
        description: '試合状況を「盤面の潜在的攻撃性(リソース)」としてモデル化する。',
        content: `
## TSD（T-Spin Double）の基本
TSDは、テトリスにおいて最も効率よく火力を送るための必須テクニックです。

### 1. 基本の形
TSDを作るには、まず「Tの字」が入る窪みを作り、その上に**屋根（オーバーハング）**を設置する必要があります。

従来の画像貼り付けではなく、**新実装の自動レンダラー**を使って表示します。

\`\`\`tetris
HOLD=I
NEXT=T,S,Z
__________
__________
...T......
..TTT.....
JJ........
L.........
GGGGGGGG_G
GGGGGGGGGG
\`\`\`

### 2. 応用：ドネイトとゴースト
地形が凸凹でも、SミノやZミノを寄付（ドネイト）して屋根を作ることができます。「X」でゴーストを表示して解説できます。

\`\`\`tetris
NEXT=T
..........
.......SS.
......SS..
.....XXXX.
.....X..X.
...JJX.XX.
..LLJGGGGG
.LLZZGGGGG
\`\`\`

> **Tips:** コードブロックに \`tetris\` と書くだけで、上記の盤面が自動生成されます。入力していない上の行は自動で埋められます。
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
