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

以下の図を見てください。この空洞にTミノをねじ込みます。

\`\`\`tetris
HOLD: T
NEXT: ZJ
HEIGHT: 6
__________
___S______
__SSZZ____
__ZXZZ____
__ZXX_____
_XXXXXX___
\`\`\`

### 2. 意識すべきポイント
* **平らな地形を維持する**: 屋根を作った後に地形が凸凹にならないよう注意。
* **ドネイト（寄付）の活用**: 地形を削りながら無理やりTSDの形を作る技術。
* **NEXTを見る**: Tミノがいつ来るかを把握してセットアップを始める。

\`\`\`tetris
HEIGHT: 4
NEXT: I
__________
XX__X_____
XX_XX_____
XX_XXXXXXX
\`\`\`

> **Tips:** 最初は「L字」や「J字」のミノを使って屋根を作る練習から始めるのがおすすめです。
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
