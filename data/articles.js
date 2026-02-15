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
# この場所の目的

## ここは何？
自身の上達のために開発したツール群、考察記事、動画のタイムスタンプ情報などを体系的にまとめるための **情報の保管庫**

TwitterやDiscordでは流れて消えてしまう情報、或いはYoutubeのタイムスタンプのような管理しずらい情報をストックし、整理しやすくする

## なぜ作ったのか？

大体[このnoteの記事](https://note.com/noted_intai2110/n/na57cebd775ad)を見れば分かるはず

過去の自分は、成長するためにがむしゃらでやってもダメだという経験をした
そこで、効率的に成長できるようにするための環境を設計して、一から構築したかった

効率的な成長には、以下のサイクルの循環が不可欠だと考えた

<img src="data/img/Cycle.jpeg" alt="学習サイクル" width="50%">

1. **座学**
   敗因を特定し、次はどう動くべきかという改善案を考察する
2. **実技**
   実際にプレイして、改善案を実行する
3. **フィードバック**
   できたこと・できなかったことをデータとして収集し、次の座学へ反映・改善させる

このサイクルを**最速・最低コスト**で回す環境をゼロから設計・構築するため

## ツール群と役割

### 1. テトリスシミュレータ
**役割：実技と座学の中間**
ブラウザ上で動作する軽量なシミュレータ。PCスペックに依存せず、どこでもAIとの対戦や検証が可能
* **AI対戦:** Cold Clearのパラメータ
* **カスタムルール:** 「特定の地形を組まないと警告」「ネクストの距離表示」など、矯正したい癖に合わせてルールを反映
* **エディタ連携:** 読み込んだ盤面から即座にプレイを開始、或いはリプレイの閲覧用

### 2. 譜面エディタ
**役割：座学情報の保管**
2画面のテト譜がないから仕方がなく作った。シミュレータと相互に連携

### 3. 高精度画像認識(拡張機能)
**役割：座学と実技の距離を縮める**
YouTube動画や画像から盤面を読み取りシミュレータに転送
pythonでlightGBMでモデルを学習させた
別のことに使おうと思ってたデータを流用しただけの適当実装の割には、かなーり精度が良く便利
シミュレータに付けた他、Youtube用拡張機能も作った

### 4. ここ
**役割：情報の整理・体系化**
TwitterやDiscordは情報が流れたりして、テト譜や知見の蓄積に絶望的に向かない
Youtubeの動画に密接した情報の保管をする方法がない(タイムスタンプは迷惑かもしれないし管理が面倒すぎる)
noteとかでは他人の反応を気にしてしまう

これらを改善する為に作った情報保管庫

検索機能やタグでの管理、Youtubeと同時に見れる記事の形式が役に立ちそう

## 動画解析（実験中）
動画を丸ごと解析してデータ化するツールも試作中
将来的にAI学習に活用するなどの構想があるけど、ぷよテトのエフェクトのノイズがデカすぎて苦戦中

## 今後の展望
単なるプレイ日記だけではなく、以下のような運用を目指す
* **テト譜のタグ管理:** 局面ごとにタグ付けし、類似パターンを検索可能にする
* **動画データの蓄積:** 特定の敗北パターンを検索可能にする。タイムスタンプ毎にもタグ付けや検索が出来るようにする
* **ゆるい知見の共有:** 将来の自分のために、思考プロセスをありのままに残す(他人の反応を気にしなくて済む)

###おまけ

iframeのおかげでnoteより圧倒的に自由度が高い
これを使って色々面白いことができそう

<iframe src="https://selmtoe.github.io/Tetris_Simulator/#eyJ2IjoyLCJtIjoiMVAiLCJwMSI6eyJiIjoiX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fR19fX19fX19fX0dHR19HX19HX19HR0dHR0dfR0dHR0dHR0dfR0dHRyIsIm4iOiJaIiwiaCI6IiJ9LCJzcyI6MSwiaGIiOjEsInJjIjoiZnVuY3Rpb24gb25Jbml0KGFwaSkge1xuICBjb25zdCBuZXh0U2VxdWVuY2UgPSBbXTtcbiAgZm9yIChsZXQgaSA9IDE7IGkgPCA4OyBpKyspIHtcbiAgICBjb25zdCBwaWVjZSA9IGFwaS5nZXRQaWVjZShhcGkucDEsICduZXh0JywgaSk7XG4gICAgaWYgKHBpZWNlKSB7XG4gICAgICBuZXh0U2VxdWVuY2UucHVzaChwaWVjZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGJyZWFrO1xuICAgIH1cbiAgfVxuICBjb25zdCBqSW5kZXggPSBuZXh0U2VxdWVuY2UuaW5kZXhPZignSicpO1xuICBjb25zdCBvSW5kZXggPSBuZXh0U2VxdWVuY2UuaW5kZXhPZignTycpO1xuICBjb25zdCBzSW5kZXggPSBuZXh0U2VxdWVuY2UuaW5kZXhPZignUycpO1xuICBpZiAoakluZGV4ICE9PSAtMSAmJiBvSW5kZXggIT09IC0xICYmIGpJbmRleCA8IG9JbmRleCkge1xuICAgIGFwaS5jbGVhckFsbEdob3N0QmxvY2tzKGFwaS5wMSk7XG5hcGkuZGlzcGxheUdob3N0QmxvY2soYXBpLnAxLCA2LCAzMywgJ08nKTtcbmFwaS5kaXNwbGF5R2hvc3RCbG9jayhhcGkucDEsIDcsIDMzLCAnTycpO1xuYXBpLmRpc3BsYXlHaG9zdEJsb2NrKGFwaS5wMSwgOCwgMzMsICdKJyk7XG5hcGkuZGlzcGxheUdob3N0QmxvY2soYXBpLnAxLCA5LCAzMywgJ0knKTtcbmFwaS5kaXNwbGF5R2hvc3RCbG9jayhhcGkucDEsIDAsIDM0LCAnUycpO1xuYXBpLmRpc3BsYXlHaG9zdEJsb2NrKGFwaS5wMSwgMywgMzQsICdaJyk7XG5hcGkuZGlzcGxheUdob3N0QmxvY2soYXBpLnAxLCA2LCAzNCwgJ08nKTtcbmFwaS5kaXNwbGF5R2hvc3RCbG9jayhhcGkucDEsIDcsIDM0LCAnTycpO1xuYXBpLmRpc3BsYXlHaG9zdEJsb2NrKGFwaS5wMSwgOCwgMzQsICdKJyk7XG5hcGkuZGlzcGxheUdob3N0QmxvY2soYXBpLnAxLCA5LCAzNCwgJ0knKTtcbmFwaS5kaXNwbGF5R2hvc3RCbG9jayhhcGkucDEsIDAsIDM1LCAnUycpO1xuYXBpLmRpc3BsYXlHaG9zdEJsb2NrKGFwaS5wMSwgMSwgMzUsICdTJyk7XG5hcGkuZGlzcGxheUdob3N0QmxvY2soYXBpLnAxLCAyLCAzNSwgJ1onKTtcbmFwaS5kaXNwbGF5R2hvc3RCbG9jayhhcGkucDEsIDMsIDM1LCAnWicpO1xuYXBpLmRpc3BsYXlHaG9zdEJsb2NrKGFwaS5wMSwgNywgMzUsICdKJyk7XG5hcGkuZGlzcGxheUdob3N0QmxvY2soYXBpLnAxLCA4LCAzNSwgJ0onKTtcbmFwaS5kaXNwbGF5R2hvc3RCbG9jayhhcGkucDEsIDksIDM1LCAnSScpO1xuYXBpLmRpc3BsYXlHaG9zdEJsb2NrKGFwaS5wMSwgMSwgMzYsICdTJyk7XG5hcGkuZGlzcGxheUdob3N0QmxvY2soYXBpLnAxLCAyLCAzNiwgJ1onKTtcbmFwaS5kaXNwbGF5R2hvc3RCbG9jayhhcGkucDEsIDMsIDM2LCAnTCcpO1xuYXBpLmRpc3BsYXlHaG9zdEJsb2NrKGFwaS5wMSwgNCwgMzYsICdMJyk7XG5hcGkuZGlzcGxheUdob3N0QmxvY2soYXBpLnAxLCA1LCAzNiwgJ0wnKTtcbmFwaS5kaXNwbGF5R2hvc3RCbG9jayhhcGkucDEsIDcsIDM2LCAnWicpO1xuYXBpLmRpc3BsYXlHaG9zdEJsb2NrKGFwaS5wMSwgOCwgMzYsICdaJyk7XG5hcGkuZGlzcGxheUdob3N0QmxvY2soYXBpLnAxLCA5LCAzNiwgJ0knKTtcbmFwaS5kaXNwbGF5R2hvc3RCbG9jayhhcGkucDEsIDMsIDM3LCAnTCcpO1xuYXBpLmRpc3BsYXlHaG9zdEJsb2NrKGFwaS5wMSwgOCwgMzcsICdaJyk7XG5hcGkuZGlzcGxheUdob3N0QmxvY2soYXBpLnAxLCA5LCAzNywgJ1onKTtcbiAgICBhcGkuc2V0Q3VzdG9tVUlUZXh0KGFwaS5wMSwgXCLnkIbmg7NcIik7XG4gIH1cbiAgZWxzZSB7XG4gICAgaWYgKHNJbmRleCAhPT0gLTEgJiYgakluZGV4ICE9PSAtMSAmJiBzSW5kZXggPCBqSW5kZXgpIHtcbiAgICAgYXBpLmNsZWFyQWxsR2hvc3RCbG9ja3MoYXBpLnAxKTtcbmFwaS5kaXNwbGF5R2hvc3RCbG9jayhhcGkucDEsIDIsIDMyLCAnWicpO1xuYXBpLmRpc3BsYXlHaG9zdEJsb2NrKGFwaS5wMSwgMSwgMzMsICdaJyk7XG5hcGkuZGlzcGxheUdob3N0QmxvY2soYXBpLnAxLCAyLCAzMywgJ1onKTtcbmFwaS5kaXNwbGF5R2hvc3RCbG9jayhhcGkucDEsIDEsIDM0LCAnWicpO1xuYXBpLmRpc3BsYXlHaG9zdEJsb2NrKGFwaS5wMSwgMiwgMzQsICdPJyk7XG5hcGkuZGlzcGxheUdob3N0QmxvY2soYXBpLnAxLCAzLCAzNCwgJ08nKTtcbmFwaS5kaXNwbGF5R2hvc3RCbG9jayhhcGkucDEsIDYsIDM0LCAnSicpO1xuYXBpLmRpc3BsYXlHaG9zdEJsb2NrKGFwaS5wMSwgNywgMzQsICdKJyk7XG5hcGkuZGlzcGxheUdob3N0QmxvY2soYXBpLnAxLCA4LCAzNCwgJ0onKTtcbmFwaS5kaXNwbGF5R2hvc3RCbG9jayhhcGkucDEsIDksIDM0LCAnSScpO1xuYXBpLmRpc3BsYXlHaG9zdEJsb2NrKGFwaS5wMSwgMCwgMzUsICdaJyk7XG5hcGkuZGlzcGxheUdob3N0QmxvY2soYXBpLnAxLCAxLCAzNSwgJ1onKTtcbmFwaS5kaXNwbGF5R2hvc3RCbG9jayhhcGkucDEsIDIsIDM1LCAnTycpO1xuYXBpLmRpc3BsYXlHaG9zdEJsb2NrKGFwaS5wMSwgMywgMzUsICdPJyk7XG5hcGkuZGlzcGxheUdob3N0QmxvY2soYXBpLnAxLCA3LCAzNSwgJ1MnKTtcbmFwaS5kaXNwbGF5R2hvc3RCbG9jayhhcGkucDEsIDgsIDM1LCAnSicpO1xuYXBpLmRpc3BsYXlHaG9zdEJsb2NrKGFwaS5wMSwgOSwgMzUsICdJJyk7XG5hcGkuZGlzcGxheUdob3N0QmxvY2soYXBpLnAxLCAxLCAzNiwgJ1onKTtcbmFwaS5kaXNwbGF5R2hvc3RCbG9jayhhcGkucDEsIDIsIDM2LCAnWicpO1xuYXBpLmRpc3BsYXlHaG9zdEJsb2NrKGFwaS5wMSwgMywgMzYsICdMJyk7XG5hcGkuZGlzcGxheUdob3N0QmxvY2soYXBpLnAxLCA0LCAzNiwgJ0wnKTtcbmFwaS5kaXNwbGF5R2hvc3RCbG9jayhhcGkucDEsIDUsIDM2LCAnTCcpO1xuYXBpLmRpc3BsYXlHaG9zdEJsb2NrKGFwaS5wMSwgNywgMzYsICdTJyk7XG5hcGkuZGlzcGxheUdob3N0QmxvY2soYXBpLnAxLCA4LCAzNiwgJ1MnKTtcbmFwaS5kaXNwbGF5R2hvc3RCbG9jayhhcGkucDEsIDksIDM2LCAnSScpO1xuYXBpLmRpc3BsYXlHaG9zdEJsb2NrKGFwaS5wMSwgMywgMzcsICdMJyk7XG5hcGkuZGlzcGxheUdob3N0QmxvY2soYXBpLnAxLCA4LCAzNywgJ1MnKTtcbmFwaS5kaXNwbGF5R2hvc3RCbG9jayhhcGkucDEsIDksIDM3LCAnSScpO1xuICAgICAgYXBpLnNldEN1c3RvbVVJVGV4dChhcGkucDEsIFwi5rqW55CG5oOzXCIpO1xuICAgIH1cbiAgICBlbHNlIHtcbmFwaS5jbGVhckFsbEdob3N0QmxvY2tzKGFwaS5wMSk7XG5hcGkuZGlzcGxheUdob3N0QmxvY2soYXBpLnAxLCAxLCAzMiwgJ0onKTtcbmFwaS5kaXNwbGF5R2hvc3RCbG9jayhhcGkucDEsIDIsIDMyLCAnSicpO1xuYXBpLmRpc3BsYXlHaG9zdEJsb2NrKGFwaS5wMSwgMSwgMzMsICdKJyk7XG5hcGkuZGlzcGxheUdob3N0QmxvY2soYXBpLnAxLCAyLCAzMywgJ1MnKTtcbmFwaS5kaXNwbGF5R2hvc3RCbG9jayhhcGkucDEsIDksIDMzLCAnSScpO1xuYXBpLmRpc3BsYXlHaG9zdEJsb2NrKGFwaS5wMSwgMSwgMzQsICdKJyk7XG5hcGkuZGlzcGxheUdob3N0QmxvY2soYXBpLnAxLCAyLCAzNCwgJ1MnKTtcbmFwaS5kaXNwbGF5R2hvc3RCbG9jayhhcGkucDEsIDMsIDM0LCAnUycpO1xuYXBpLmRpc3BsYXlHaG9zdEJsb2NrKGFwaS5wMSwgNiwgMzQsICdaJyk7XG5hcGkuZGlzcGxheUdob3N0QmxvY2soYXBpLnAxLCA3LCAzNCwgJ1onKTtcbmFwaS5kaXNwbGF5R2hvc3RCbG9jayhhcGkucDEsIDksIDM0LCAnSScpO1xuYXBpLmRpc3BsYXlHaG9zdEJsb2NrKGFwaS5wMSwgMSwgMzUsICdPJyk7XG5hcGkuZGlzcGxheUdob3N0QmxvY2soYXBpLnAxLCAyLCAzNSwgJ08nKTtcbmFwaS5kaXNwbGF5R2hvc3RCbG9jayhhcGkucDEsIDMsIDM1LCAnUycpO1xuYXBpLmRpc3BsYXlHaG9zdEJsb2NrKGFwaS5wMSwgNywgMzUsICdaJyk7XG5hcGkuZGlzcGxheUdob3N0QmxvY2soYXBpLnAxLCA4LCAzNSwgJ1onKTtcbmFwaS5kaXNwbGF5R2hvc3RCbG9jayhhcGkucDEsIDksIDM1LCAnSScpO1xuYXBpLmRpc3BsYXlHaG9zdEJsb2NrKGFwaS5wMSwgMSwgMzYsICdPJyk7XG5hcGkuZGlzcGxheUdob3N0QmxvY2soYXBpLnAxLCAyLCAzNiwgJ08nKTtcbmFwaS5kaXNwbGF5R2hvc3RCbG9jayhhcGkucDEsIDMsIDM2LCAnTCcpO1xuYXBpLmRpc3BsYXlHaG9zdEJsb2NrKGFwaS5wMSwgNCwgMzYsICdMJyk7XG5hcGkuZGlzcGxheUdob3N0QmxvY2soYXBpLnAxLCA1LCAzNiwgJ0wnKTtcbmFwaS5kaXNwbGF5R2hvc3RCbG9jayhhcGkucDEsIDcsIDM2LCAnWicpO1xuYXBpLmRpc3BsYXlHaG9zdEJsb2NrKGFwaS5wMSwgOCwgMzYsICdaJyk7XG5hcGkuZGlzcGxheUdob3N0QmxvY2soYXBpLnAxLCA5LCAzNiwgJ0knKTtcbmFwaS5kaXNwbGF5R2hvc3RCbG9jayhhcGkucDEsIDMsIDM3LCAnTCcpO1xuYXBpLmRpc3BsYXlHaG9zdEJsb2NrKGFwaS5wMSwgOCwgMzcsICdaJyk7XG5hcGkuZGlzcGxheUdob3N0QmxvY2soYXBpLnAxLCA5LCAzNywgJ1onKTtcbiAgICAgIGFwaS5zZXRDdXN0b21VSVRleHQoYXBpLnAxLCBcIuWmpeWNlFwiKTtcbiAgICB9XG4gIH1cbn1cbiJ9" width="80%" height="400"></iframe>
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








