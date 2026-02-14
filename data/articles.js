window.LAB_ARTICLES = [
    {
        id: 'fumen-embed-feature',
        date: '2025-12-15',
        title: '記事内への「譜面埋め込み機能」の実装と使い方',
        tags: ['開発', '機能紹介', 'テト譜'],
        description: 'ブログ内で盤面を直接描画する機能を実装しました。エディタのURLを貼るだけで展開されます。',
        content: `
## 譜面埋め込み機能について

記事の中にテトリスの盤面を綺麗に表示する機能を実装しました。
「譜面エディタ」のデザインと統一されており、高解像度ディスプレイでも滲みません。

### 1. エディタのURLを直接貼る
譜面エディタで「Share」して発行されたURL、またはデータをそのまま貼り付けるだけで、1ページ目の盤面が描画されます。

\`\`\`fumen
https://selmtoe.github.io/Tetris_Simulator/F/index.html#eyJ2IjoiZjIiLCJtIjoiMVAiLCJwIjpbeyJwMSI6eyJiIjpbWyJfIiwyNDBdLFsiXyIsMTBdLFsiXyIsMTBdLFsiXyIsMTBdLFsiXyIsMTBdLFsiXyIsMTBdLFsiXyIsMTBdLFsiXyIsMTBdLFsiXyIsMTBdLFsiXyIsMTBdLFsiUyIsMV0sWyJaIiwxXSxbIlMiLDFdLFsiWiIsMV0sWyJTIiwxXSxbIloiLDFdLFsiUyIsMV0sWyJaIiwxXSxbIlMiLDFdLFsiWiIsMV1dLCJoIjoiVCIsIm4iOiJJT0xKIn19XX0=
\`\`\`

### 2. 表示オプションの指定 (JSON)
JSON形式で記述することで、盤面のサイズ変更やNext/Holdの非表示など、細かい制御が可能です。
\`url\` プロパティにデータを入れ、その他のオプションを指定します。

**例: Next/Holdを隠して、盤面の下部10段だけを表示**

\`\`\`fumen
{
  "url": "https://selmtoe.github.io/Tetris_Simulator/F/index.html#eyJ2IjoiZjIiLCJtIjoiMVAiLCJwIjpbeyJwMSI6eyJiIjpbWyJfIiwyMzBdLFsiSSIsMV0sWyJXIiwxXSxbIkkiLDFdLFsiTyIsMV0sWyJXIiwxXSxbIk8iLDFdLFsiVCIsMV0sWyJXIiwxXSxbIlQiLDFdLFsiTCIsMV0sWyJXIiwxXSxbIkwiLDFdLFsiSiIsMV0sWyJXIiwxXSxbIkoiLDFdLFsiUyIsMV0sWyJXIiwxXSxbIlMiLDFdLFsiWiIsMV0sWyJXIiwxXSxbIloiLDFdXSwiaCI6IiIsIm4iOiIifX1dfQ==",
  "settings": {
    "viewHeight": 10,
    "showNext": false,
    "showHold": false
  }
}
\`\`\`

### 3. 自由な盤面定義
URLを使わずに、直接配列で指定することも可能です（開発者向け）。

\`\`\`fumen
{
  "board": [
    "__________",
    "__________",
    "__________",
    "I_________",
    "I_________",
    "I_________",
    "I______XXX"
  ],
  "activePart": { "type": "T", "x": 4, "y": 15, "r": 2 }
}
\`\`\`
        `
    },
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

\`\`\`fumen
{
  "url": "https://selmtoe.github.io/Tetris_Simulator/F/index.html#eyJ2IjoiZjIiLCJtIjoiMVAiLCJwIjpbeyJwMSI6eyJiIjpbWyJfIiwyMjddLFsiWiIsMV0sWyJXIiwxXSxbIlMiLDFdLFsiWiIsMV0sWyJXIiwxXSxbIlMiLDFdLFsiWiIsMl0sWyJXIiwxXSxbIlMiLDJdLFsiSSIsMV0sWyJXIiwxXSxbIlQiLDFdLFsiSSIsMV0sWyJXIiwxXSxbIlQiLDFdLFsiSSIsMV0sWyJXIiwxXSxbIlQiLDFdLFsiSSIsMV0sWyJXIiwxXSxbIkoiLDFdLFsiTCIsMV0sWyJXIiwxXSxbIkoiLDFdLFsiTCIsMV0sWyJXIiwxXSxbIkoiLDFdLFsiTCIsMV0sWyJXIiwxXSxbIkoiLDFdLFsiTCIsMV1dLCJoIjoiVCIsIm4iOiJLIn19XX0=",
  "settings": {
     "viewHeight": 8
  }
}
\`\`\`

### 2. 意識すべきポイント
* **平らな地形を維持する**: 屋根を作った後に地形が凸凹にならないよう注意。
* **ドネイト（寄付）の活用**: 地形を削りながら無理やりTSDの形を作る技術。
* **NEXTを見る**: Tミノがいつ来るかを把握してセットアップを始める。

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
