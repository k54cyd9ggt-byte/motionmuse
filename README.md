# MotionMuse — Kling 3.0 Motion Control

人物写真と参照ダンス動画から1080pのモーション転写動画を生成するNode.jsアプリです。

## ローカル
1. `npm install`
2. `.env.example` を `.env` にコピーし、`REPLICATE_API_TOKEN` を設定
3. `npm start`
4. http://localhost:3000 を開く

## RenderでURL限定公開
1. GitHubに `motionmuse` フォルダ内のファイルをリポジトリのルートとしてアップロード
2. Render > New > Web Service > GitHubリポジトリを選択
3. Runtime: Node、Build Command: `npm install`、Start Command: `npm start`
4. Environment に `REPLICATE_API_TOKEN` を追加（GitHubには絶対に登録しない）
5. Deploy完了後にRenderの公開URLを開き、URLを共有した相手だけに知らせる
6. robots.txt、HTMLのnoindex、全HTTPレスポンスのX-Robots-Tagで検索エンジンへの掲載を抑制します。これはアクセス制限ではありません。リンクを知る人は誰でも利用できます。検索エンジンへの非掲載は保証できません。
7. Renderの公開URLは外部からアクセス可能です。秘密のURLとして扱わず、必要に応じて後から認証を追加してください。

## 仕様と注意
- Replicate `kwaivgi/kling-v3-motion-control` を使用。1080p pro。
- 参照動画3〜30秒（orientation=image時は最大10秒）、100MB以下。画像10MB以下。
- 利用料金はReplicateで確認してください。APIキーなしでは生成できません。
- 生成履歴はメモリ内管理のためサーバー再起動で消えます。複数インスタンスには未対応。
- 公開時は認証、課金上限、ストレージ、コンテンツ管理、アップロード検証（ffprobeなど）を追加することを推奨します。
- 本アプリは実APIとの通信コードを含みますが、APIキーを使用した実生成テストは未実施です。
