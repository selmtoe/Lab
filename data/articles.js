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
        id: 'first',
        date: '2026-02-14',
        title: 'この場所の目的',
        tags: ['自分語り'],
        description: 'テスト記事',
        // 内部で読ませる記事の場合は content を書く。HTMLタグ(<h3>や<p>など)が使えます。
        content: `
## TSD（T-Spin Double）の基本
TSDは、テトリスにおいて最も効率よく火力を送るための必須テクニックです。

### 1. 基本の形
TSDを作るには、まず「Tの字」が入る窪みを作り、その上に**屋根（オーバーハング）**を設置する必要があります。

![TSDの理想的な形](data/img/tsd_pattern.png)

### 2. 意識すべきポイント
* **平らな地形を維持する**: 屋根を作った後に地形が凸凹にならないよう注意。
* **ドネイト（寄付）の活用**: 地形を削りながら無理やりTSDの形を作る技術。
* **NEXTを見る**: Tミノがいつ来るかを把握してセットアップを始める。

> **Tips:** 最初は「L字」や「J字」のミノを使って屋根を作る練習から始めるのがおすすめです。

<iframe src="https://selmtoe.github.io/Tetris_Simulator/#eyJ2IjoyLCJtIjoiMVAiLCJwMSI6eyJiIjoiX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19HR0dfX19fR0dHR0dHX19fX0dHR0dHR19fX19HR0dHR0dfX19fR0dHR0dHX19fX0dHR0dHR19fX19HR0dHR0dfX19fR0dHR0dHX19fX0dHR0dHR19fX19HR0dHR0dfX19fR0dHR0dHX19fX0dHR0dHR19fX19HR0dHR0dfX19fR0dHR0dHX19fX0dHR0dHR19fX19HR0dHR0dfX19fR0dHR0dHX19fX0dHR0dHR19fX19HR0dHR0dfX0dHR0dHR0dHX19fR0dHRyIsIm4iOiIiLCJoIjoiIn0sInNzIjoxLCJoYiI6MX0="></iframe>
<iframe src="https://selmtoe.github.io/Tetris_Simulator/F/index.html#eyJ2IjoiZjIiLCJtIjoiMVAiLCJwIjpbeyJwMSI6eyJiIjpbWyJfIiw0MDBdXSwiaCI6IiIsIm4iOiJPTFpJVFNKSiJ9fSx7InAxIjp7ImIiOltbIkUiLDM3MV0sWyJMIiwxXSxbIkUiLDldLFsiTCIsMV0sWyJFIiw5XSxbIkwiLDJdLFsiRSIsN11dLCJoIjoiTyIsIm4iOiJaSVRTSkpMVCJ9fSx7InAxIjp7ImIiOltbIkUiLDM4OF0sWyJPIiwyXSxbIkUiLDhdLFsiTyIsMl1dLCJoIjoiWiIsIm4iOiJJVFNKSkxUSSJ9fSx7InAxIjp7ImIiOltbIkUiLDM2MF0sWyJJIiwxXSxbIkUiLDldLFsiSSIsMV0sWyJFIiw5XSxbIkkiLDFdLFsiRSIsOV0sWyJJIiwxXSxbIkUiLDldXSwiaCI6IloiLCJuIjoiVFNKSkxUSVMifX0seyJwMSI6eyJiIjpbWyJFIiwzNzRdLFsiVCIsMV0sWyJFIiw5XSxbIlQiLDJdLFsiRSIsOF0sWyJUIiwxXSxbIkUiLDVdXSwiaCI6IloiLCJuIjoiU0pKTFRJU1oifX0seyJwMSI6eyJiIjpbWyJFIiwzNzJdLFsiUyIsMV0sWyJFIiw5XSxbIlMiLDJdLFsiRSIsOV0sWyJTIiwxXSxbIkUiLDZdXSwiaCI6IloiLCJuIjoiSkpMVElTWk8ifX0seyJwMSI6eyJiIjpbWyJFIiwzNzddLFsiSiIsMV0sWyJFIiw5XSxbIkoiLDFdLFsiRSIsOF0sWyJKIiwyXSxbIkUiLDJdXSwiaCI6IloiLCJuIjoiSkxUSVNaT08ifX0seyJwMSI6eyJiIjpbWyJFIiwzNjddLFsiWiIsMl0sWyJFIiw5XSxbIloiLDJdLFsiRSIsMjBdXSwiaCI6IkoiLCJuIjoiTFRJU1pPT0wifX0seyJwMSI6eyJiIjpbWyJFIiwzNjNdLFsiTCIsM10sWyJFIiw3XSxbIkwiLDFdLFsiRSIsMjZdXSwiaCI6IkoiLCJuIjoiVElTWk9PTFQifX0seyJwMSI6eyJiIjpbWyJFIiwzMzhdLFsiSiIsMV0sWyJFIiw5XSxbIkoiLDFdLFsiRSIsOF0sWyJKIiwyXSxbIkUiLDQxXV0sImgiOiJUIiwibiI6IklTWk9PTFRaIn19LHsicDEiOnsiYiI6W1siRSIsMzM5XSxbIkkiLDFdLFsiRSIsOV0sWyJJIiwxXSxbIkUiLDldLFsiSSIsMV0sWyJFIiw5XSxbIkkiLDFdLFsiRSIsMzBdXSwiaCI6IlQiLCJuIjoiU1pPT0xUWlMifX0seyJwMSI6eyJiIjpbWyJFIiwzNDBdLFsiUyIsMV0sWyJFIiw5XSxbIlMiLDJdLFsiRSIsOV0sWyJTIiwxXSxbIkUiLDM4XV0sImgiOiJUIiwibiI6IlpPT0xUWlNJIn19LHsicDEiOnsiYiI6W1siRSIsMzQzXSxbIloiLDFdLFsiRSIsOF0sWyJaIiwyXSxbIkUiLDhdLFsiWiIsMV0sWyJFIiwzN11dLCJoIjoiVCIsIm4iOiJPT0xUWlNJSiJ9fSx7InAxIjp7ImIiOltbIkUiLDMzNl0sWyJPIiwyXSxbIkUiLDhdLFsiTyIsMl0sWyJFIiw1Ml1dLCJoIjoiVCIsIm4iOiJPTFRaU0lKSSJ9fSx7InAxIjp7ImIiOltbIkUiLDM2Nl0sWyJUIiwxXSxbIkUiLDhdLFsiVCIsMl0sWyJFIiw5XSxbIlQiLDFdLFsiRSIsMTNdXSwiaCI6Ik8iLCJuIjoiTFRaU0lKSU8ifX0seyJwMSI6eyJiIjpbWyJFIiwzMzZdLFsiXyIsNV0sWyJFIiwyXSxbIl8iLDFdLFsiRSIsMl0sWyJfIiw4XSxbIkUiLDNdLFsiXyIsOV0sWyJPIiwyXSxbIkoiLDFdLFsiRSIsMV0sWyJTIiwxXSxbIl8iLDJdLFsiWiIsMV0sWyJfIiwyXSxbIk8iLDJdLFsiSiIsMV0sWyJJIiwxXSxbIlMiLDJdLFsiWiIsMl0sWyJfIiwzXSxbIkUiLDFdLFsiSiIsMV0sWyJJIiwxXSxbIkUiLDEwXV0sImgiOiJPIiwibiI6IkxUWlNJSklPIn19LHsicDEiOnsiYiI6W1siRSIsMzQ5XSxbIkwiLDFdLFsiRSIsN10sWyJMIiwzXSxbIkUiLDQwXV0sImgiOiJPIiwibiI6IlRaU0lKSU9UIn19LHsicDEiOnsiYiI6W1siRSIsMzYxXSxbIk8iLDJdLFsiRSIsOF0sWyJPIiwyXSxbIkUiLDI3XV0sImgiOiJUIiwibiI6IlpTSUpJT1RTIn19LHsicDEiOnsiYiI6W1siRSIsMzQxXSxbIloiLDFdLFsiRSIsOF0sWyJaIiwyXSxbIkUiLDhdLFsiWiIsMV0sWyJFIiwzOV1dLCJoIjoiVCIsIm4iOiJTSUpJT1RTTCJ9fSx7InAxIjp7ImIiOltbIkUiLDM0Ml0sWyJTIiwxXSxbIkUiLDldLFsiUyIsMl0sWyJFIiw5XSxbIlMiLDFdLFsiRSIsMzZdXSwiaCI6IlQiLCJuIjoiSUpJT1RTTEoifX0seyJwMSI6eyJiIjpbWyJFIiwzODRdLFsiVCIsM10sWyJFIiw4XSxbIlQiLDFdLFsiRSIsNF1dLCJoIjoiSSIsIm4iOiJKSU9UU0xKWiJ9fSx7InAxIjp7ImIiOltbIkUiLDM0MV0sWyJfIiwyXSxbIkUiLDZdLFsiXyIsNV0sWyJFIiwzXSxbIl8iLDRdLFsiWiIsMV0sWyJTIiwxXSxbIl8iLDFdLFsiRSIsMl0sWyJfIiwzXSxbIkwiLDFdLFsiWiIsMl0sWyJTIiwyXSxbIkUiLDJdLFsiXyIsMV0sWyJMIiwzXSxbIloiLDFdLFsiTyIsMl0sWyJTIiwxXSxbIl8iLDJdLFsiTyIsMl0sWyJFIiwyXSxbIlMiLDFdLFsiTyIsMl0sWyJaIiwxXSxbIl8iLDJdLFsiTyIsMl0sWyJKIiwxXSxbIkkiLDFdXSwiaCI6IkkiLCJuIjoiSklPVFNMSloifX0seyJwMSI6eyJiIjpbWyJFIiwzNzVdLFsiSiIsMl0sWyJFIiw4XSxbIkoiLDFdLFsiRSIsOV0sWyJKIiwxXSxbIkUiLDRdXSwiaCI6IkkiLCJuIjoiSU9UU0xKWlMifX0seyJwMSI6eyJiIjpbWyJFIiwzNjVdLFsiSSIsNF0sWyJFIiwzMV1dLCJoIjoiSSIsIm4iOiJPVFNMSlpTTyJ9fSx7InAxIjp7ImIiOltbIkUiLDM0OF0sWyJPIiwyXSxbIkUiLDhdLFsiTyIsMl0sWyJFIiw0MF1dLCJoIjoiSSIsIm4iOiJUU0xKWlNPSiJ9fSx7InAxIjp7ImIiOltbIkUiLDM0MF0sWyJUIiwxXSxbIkUiLDldLFsiVCIsMl0sWyJFIiw4XSxbIlQiLDFdLFsiRSIsMzldXSwiaCI6IkkiLCJuIjoiU0xKWlNPSlQifX0seyJwMSI6eyJiIjpbWyJFIiwzNDJdLFsiUyIsMV0sWyJFIiw5XSxbIlMiLDJdLFsiRSIsOV0sWyJTIiwxXSxbIkUiLDM2XV0sImgiOiJJIiwibiI6IkxKWlNPSlRJIn19LHsicDEiOnsiYiI6W1siRSIsMzQ3XSxbIkwiLDFdLFsiRSIsN10sWyJMIiwzXSxbIkUiLDQyXV0sImgiOiJJIiwibiI6IkpaU09KVElMIn19LHsicDEiOnsiYiI6W1siRSIsMzY0XSxbIkkiLDFdLFsiRSIsOV0sWyJJIiwxXSxbIkUiLDldLFsiSSIsMV0sWyJFIiw5XSxbIkkiLDFdLFsiRSIsNV1dLCJoIjoiSiIsIm4iOiJaU09KVElMWiJ9fSx7InAxIjp7ImIiOltbIkUiLDM0MF0sWyJfIiwxXSxbIkUiLDFdLFsiXyIsMV0sWyJFIiw0XSxbIl8iLDddLFsiRSIsMV0sWyJfIiwyNV0sWyJUIiwxXSxbIl8iLDFdLFsiUyIsMV0sWyJfIiw0XSxbIkwiLDFdLFsiTyIsMl0sWyJUIiwyXSxbIlMiLDJdLFsiXyIsMV0sWyJMIiwzXSxbIk8iLDJdXSwiaCI6IkoiLCJuIjoiWlNPSlRJTFoifX0seyJwMSI6eyJiIjpbWyJFIiwzNjddLFsiWiIsMV0sWyJFIiw4XSxbIloiLDJdLFsiRSIsOF0sWyJaIiwxXSxbIkUiLDEzXV0sImgiOiJKIiwibiI6IlNPSlRJTFpMIn19XX0="></iframe>

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





