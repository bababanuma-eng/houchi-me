# Curio Meet 実装計画（plan.md）

> 作成日: 2026-05-24  
> 対象: `team-05/` ディレクトリ  
> 参照: プロダクト設計書（Curio Meet）、現行コードベース

---

## 1. サマリー

| 観点 | 現状 | 設計書の想定 |
|------|------|--------------|
| フロント | **React + Vite + Tailwind**（`curio-meet-mock`） | React Native / Expo Web |
| バックエンド | **Supabase Auth / Postgres 接続済み** | Supabase（Auth / Postgres / Edge Functions） |
| メディア | **未設定** | Cloudflare R2（画像）/ Cloudflare Stream（動画）/ Cloudflare CDN |
| デプロイ | **Vercel 公開済み** | Vercel（main 連携・QR デモ URL） |
| UI 完成度 | **MVP 画面 + DB 連携（フィード・予約・投稿）まで進行中** | 審査員が触れる「動く MVP」 |

**結論**: 画面フロー・TikTok 風 UX に加え、**匿名 Auth・体験会 CRUD・予約 Edge Function・メディアアップロード基盤**まで実装済み。MVP 完走の中心ギャップは **参加後ログ／ポイント／好奇心マップの DB 連動** と **README・デモ品質の仕上げ**。  
→ **担当別の残タスク一覧は [§4.1](#41-担当別未完了タスク早見表)**、**FE/BE/Design の進め方は [§6.0](#60-全体の進め方fe--be--design-の順序)** を参照。

### 1.1 ギャップ解消チェックリスト

- [x] フロントを Vercel にデプロイしデモ URL を公開
- [x] Supabase（DB / Auth）を接続
- [x] Cloudflare R2 / Stream / CDN を接続（`upload-media` Edge Function 実装済み。本番 Secrets・デプロイ要確認）
- [ ] 予約・ログ・ポイントを Edge Functions 経由に移行（予約のみ完了、ログ・pt は未着手）
- [ ] 好奇心マップをユーザー操作で更新可能にする

---

## 2. 現状実装マップ

### 2.1 ディレクトリ構成

```
team-05/
├── frontend/
│   ├── src/
│   │   ├── App.jsx                 # タブ遷移・予約/ログ/投稿の状態管理
│   │   ├── data/dummyData.js       # 体験会・ユーザー・好奇心マップ等の静的データ
│   │   ├── screens/
│   │   │   ├── HomeScreen.jsx      # 縦スナップフィード + モーダル
│   │   │   ├── ProfileScreen.jsx   # プロフィール・マップ・予約・ログ・交換タブ
│   │   │   ├── PostScreen.jsx      # 体験会投稿フォーム
│   │   │   └── LogScreen.jsx       # 参加後ログ（オーバーレイ）
│   │   └── components/
│   │       ├── ExperienceCard.jsx  # フィードカード
│   │       ├── ExperienceModal.jsx # 詳細 + 予約完了
│   │       ├── BottomTabBar.jsx    # Home / 投稿 / プロフィール
│   │       └── …（Button, Badge, StarRating, PointBurst）
│   └── package.json
├── backend/
│   └── supabase/
└── README.md
```

### 2.2 画面別：設計書 vs 実装

- [x] **Home フィード**（縦型ショート動画風 UI）— 画像/動画ではなくジャンル別グラデ＋絵文字、`feed-snap` で縦スクロール
- [x] 体験会情報オーバーレイ（タイトル・場所・費用・pt 等）— `ExperienceCard` 左下キャプション + CTA
- [x] 詳細モーダル（Home 上で完結）— `ExperienceModal` ボトムシート
- [x] モーダル内予約（確認画面なしで完了）— ローカル `reservations` に追加
- [x] 予約完了表示（文言・+30pt 案内）— モーダル内 `completed` 状態
- [x] **プロフィール** UI（pt・称号・マップ・予約・ログ）
- [ ] プロフィール：好奇心マップの動的更新（現状は `dummyData.curiosityMap` 固定）
- [x] 称号・次の称号まで（表示のみ）
- [ ] 称号のログ連動による自動更新
- [x] 予約中一覧（プロフィール「予約中」タブ — DB `status=reserved` 連携済み）
- [ ] 参加済みログ一覧（「ログ」タブ — 現状 `dummyData.initialLogs` + ローカル state）
- [x] 商品券交換イメージ（「近日公開」表示、実交換なし）
- [x] **体験会投稿** フォーム → Home 反映（`userPosts` マージ、画像はプレースホルダ）
- [x] **参加後ログ** UI（感想・星・次ジャンル・pt）
- [ ] 参加後ログ：保存後の好奇心マップ連動（ハードコード表示のみ）
- [ ] 保存ボタン（フィード）の永続化（カード内ブックマークはローカル UI のみ）
- [ ] フォロー中タブの実装（MVP 外・UI シェルのみ）
- [ ] 検索機能（ボタンのみ）

### 2.3 コアユーザーフロー（最短体験）

```
Home 閲覧 → 詳細モーダル → 予約 →（参加想定）→ プロフィールからログ → pt 表示
```

- [x] 1–4 閲覧・モーダル
- [x] 5 予約（`reserve-experience` Edge Function 経由、リロード後も DB から復元）
- [x] 5 定員超過チェック（Edge Function で 409 返却）
- [ ] 5 予約後のフィード定員表示同期（`reserved_count` 再取得未実装）
- [ ] 6–7 参加ステータス遷移（予約 → joined。現状はログで `completed` のみ）
- [x] 8 ログ投稿（同一セッション内）
- [ ] 8 好奇心マップ・ニッチ pt の連動
- [ ] 9 pt・マップ更新（pt は +30 固定、マップは画面文言のみ）

### 2.4 技術スタックの差分

- [x] フロント UI 実装（Vite React）
- [x] フロント Vercel デプロイ（MVP-005 完了。Preview Deploy は POST-103）
- [x] DB: Supabase Postgres + スキーマ + CRUD（experiences / reservations / users）
- [x] 認証: Supabase Auth（匿名ログイン）
- [ ] 重要処理: Edge Functions（予約完了、ログ・pt は未移行）
- [ ] Storage: メディアアップロード（Function 実装済み、本番デプロイ・エラー UX 要確認）
- [x] デプロイ: Vercel main 連携

### 2.5 データモデル（設計書 §13）の充足度

- [x] `users` — Auth 連携・作成・取得（`avatar` / `nextTitlePoints` / `joinedCount` は UI のみ、DB 未整備）
- [x] `experiences` — CRUD 接続済み（`niche_score` / `point_reward` は投稿時未設定、シードのみ）
- [x] `reservations` — Edge Function 経由 insert、`status` 管理
- [ ] `experience_logs` — スキーマあり、フロント未連携
- [ ] `curiosity_map_items` — シードあり、ユーザー操作での更新未実装
- [ ] `point_transactions` — スキーマのみ、書き込み未実装

---

## 3. MVP の定義（本 plan での境界）

設計書 **§7 MVP スコープ** と **§18 Must / Should** に沿い、ハッカソン 3 日間で「審査員が端末（ブラウザ）で一連の体験を完走できる」状態を MVP とする。

### 3.1 MVP に含める（Must + 審査デモに必要な Should）

- [ ] Home フィード → モーダル → **予約が DB に残る**
- [ ] 体験会投稿 → **Home に表示され他ユーザーからも見える**（同一 DB）
- [ ] 予約済み → プロフィール表示 → **参加後ログ** → **pt 加算**
- [ ] **好奇心マップがログ／参加に応じて更新される**（最低：該当ジャンルの Lv +1）
- [ ] **ポイント履歴**（簡易で可）と表示上の総 pt 一致
- [ ] **Vercel デプロイ** + README にデモ URL
- [ ] ダミーデータのシード（体験会供給リスク対策）

### 3.2 MVP に含めない（設計書 §7 MVP 外 / §18 Won't）

> スコープ外の確認用。実装したらチェックではなく、意図的に見送った印。

- [x] AI 翻訳 — 見送り
- [x] ランキング — 見送り
- [x] 実決済 — 見送り
- [x] 本人確認 — 見送り
- [x] チャット — 見送り
- [x] レビュー — 見送り
- [x] 通知 — 見送り
- [x] 高度なレコメンド — 見送り
- [x] 独立した体験会詳細ページ — 見送り
- [x] 予約確認専用画面 — 見送り
- [x] Random Box — 見送り（UI シェルは残して可）
- [x] Following タブの実装 — 見送り（UI シェルは残して可）
- [x] 商品券の実交換 — 見送り
- [ ] 動画必須 — MVP に追加（Cloudflare Stream で対応）（画像で可）
- [x] Expo への全面移行 — 見送り（Post-MVP）

### 3.3 Should の MVP 内扱い

- [ ] 称号表示 + 閾値で自動更新（簡易ルール）
- [ ] ニッチ度ポイント（`nicheScore` に基づく加算、Edge Function）
- [ ] 予約中・参加済みログ表示の DB 連携
- [x] 商品券交換イメージ（現状 UI のまま、実交換なし）

### 3.4 Could は Post-MVP

- [ ] 保存機能の永続化
- [ ] 友達参加の pt ボーナス
- [ ] クリエイター詳細ページ
- [ ] フォロー中フィードの実装

---

## 4. タスク一覧

タスク ID は `MVP-xxx`（MVP 機能）、`DES-xxx`（デザイン）、`POST-xxx`（MVP 以降）で付与。  
**優先度**: P0（ブロッカー） / P1（MVP 必須） / P2（MVP 余力） / P3（Post-MVP）

### 4.0 担当ロールと作業場所

| ロール | 略称 | 主な作業場所 | 例 |
|--------|------|--------------|-----|
| フロント | **FE** | `frontend/src/` | 画面・コンポーネント・Supabase クライアント呼び出し |
| バックエンド | **BE** | `backend/supabase/` | マイグレーション、RLS、Edge Functions、シード |
| デザイン | **Design** | Figma（任意）+ `frontend/src/styles/tokens.js` + Tailwind | トークン、レイアウト、ビジュアル polish |
| インフラ | **Infra** | Vercel / Supabase Dashboard / Cloudflare / `.github/` | デプロイ、Secrets、CI |
| PM | **PM** | `README.md` / `project-docs/` | デモ URL、提出物、進捗管理 |

> **FE / BE** と書いてあるタスクは、**API（BE）→ 画面接続（FE）** の順で進める。  
> **Design / FE** は、Design が方針・トークンを決めてから FE が実装するのが理想。

### 4.1 担当別：未完了タスク早見表

#### BE（`backend/supabase/`）

| 順 | ID | タスク | 優先度 |
|----|-----|--------|--------|
| 1 | MVP-009 | Edge Functions 本番デプロイ & Secrets | P0 |
| 2 | MVP-401 | `submit-experience-log` Edge Function | P0 |
| 3 | MVP-404 | `curiosity_map_items` upsert | P0 |
| 4 | MVP-402 | ポイントルール実装 | P1 |
| 5 | MVP-403 | `point_transactions` 記録 | P1 |
| 6 | MVP-104 | プロフィール用 DB フィールド追加（`joined_count` 等） | P1 |
| 7 | MVP-202 | 投稿時 `niche_score` 付与 | P1 |
| 8 | MVP-407 | 称号閾値 + `users.title` 更新 | P2 |
| 9 | MVP-206 | 投稿時 `point_reward` 算出 | P2 |
| 10 | MVP-207 | 投稿フォーム項目のスキーマ整理 | P3 |

#### FE（`frontend/src/`）

| 順 | ID | タスク | 優先度 | 依存 |
|----|-----|--------|--------|------|
| 1 | MVP-410 | `handleSaveLog` → Edge Function 呼び出し | P0 | MVP-401 |
| 2 | MVP-406 | 好奇心マップ DB 連携 | P0 | MVP-404 |
| 3 | MVP-405 | ログ完了画面の動的表示 | P1 | MVP-401 |
| 4 | MVP-501 | 参加済みログ一覧 DB 取得 | P1 | MVP-401 |
| 5 | MVP-104 | プロフィール表示フィールド整合 | P1 | MVP-104 BE |
| 6 | MVP-602 | ローディング・エラー UI | P1 | — |
| 7 | MVP-601 | モバイル Web / safe-area 調整 | P1 | — |
| 8 | MVP-204 | メディア本番確認・フィード表示 | P1 | MVP-009 |
| 9 | MVP-209 | アップロード失敗通知 | P2 | — |
| 10 | MVP-305 | 予約後 `reserved_count` 再同期 | P2 | — |
| 11 | MVP-502 | ログカード `againRating` 表示 | P2 | MVP-501 |
| 12 | MVP-408 | 参加数・初体験ジャンル数表示 | P2 | MVP-403 |
| 13 | MVP-411 | `dummyData.js` 整理 | P2 | MVP-410, MVP-406 |

#### Design（UI/UX 仕上げ）

| 順 | ID | タスク | 優先度 | いつやるか |
|----|-----|--------|--------|------------|
| 1 | DES-001 | デザイントークン整備 | P1 | **今すぐ**（他画面の前提） |
| 2 | DES-002 | Home / ExperienceCard polish | P1 | BE 作業と並行可 |
| 3 | DES-003 | ExperienceModal polish | P1 | BE 作業と並行可 |
| 4 | DES-007 | PostScreen polish | P2 | BE 作業と並行可 |
| 5 | DES-005 | 好奇心マップ可視化 | P1 | **MVP-406 後** |
| 6 | DES-006 | LogScreen 完了画面 | P1 | **MVP-405/410 後** |
| 7 | DES-004 | プロフィール polish | P2 | MVP-104 後が理想 |
| 8 | DES-008 | エラー・空状態 UI | P1 | MVP-602 と同時 |
| 9 | DES-009 | 実機 Safari 調整 | P1 | MVP-601 と同時 |
| 10 | DES-010 | デモ用スクショ・README 素材 | P1 | **Day 3 提出前** |

---

### Phase 0: インフラ・基盤（MVP の前提）

- [x] **MVP-001** — Supabase プロジェクト作成、環境変数（`.env` / Vercel）設定 `P0` `Infra`
- [x] **MVP-002** — DB スキーマ作成（§13: users, experiences, reservations, experience_logs, curiosity_map_items, point_transactions） `P0` `BE`
- [x] **MVP-003** — RLS ポリシー草案（読み取り公開、書き込みは本人 or Edge Function 経由） `P0` `BE`
- [x] **MVP-004** — シードデータ投入（体験会 5 件以上、デモユーザー） `P1` `BE`
- [x] **MVP-005** — Vercel プロジェクト連携、`npm run build`、main 自動デプロイ `P0` `Infra`
- [x] **MVP-007** — Cloudflare アカウント設定・R2 バケット作成・CDN 有効化 `P0` `Infra`
- [x] **MVP-008** — Cloudflare Stream 有効化・アップロード用 API トークン発行 `P0` `Infra`
- [ ] **MVP-006** — README 更新（デモ URL・技術スタック・既知の問題）※ plan 外ファイルだが提出必須 `P1` `PM`
- [ ] **MVP-009** — Edge Functions 本番デプロイ & Secrets 設定（`reserve-experience` / `upload-media` の `SUPABASE_SERVICE_ROLE_KEY`、Cloudflare 各種トークン） `P0` `Infra / BE`
- [x] **MVP-606** — GitHub Actions CI（PR / main で `frontend` の `npm run build`） `P2` `Infra`

---

### Phase 1: 認証・ユーザー（MVP）

- [x] **MVP-101** — Supabase Auth 導入（匿名ログイン or メールなしデモ用 1 アカウント） `P1` `BE`
- [x] **MVP-102** — `users` 行の作成・取得（プロフィール: name, avatar, points, title） `P1` `BE / FE`
- [x] **MVP-103** — フロント: `dummyData.initialUser` を API 取得に置き換え `P1` `FE`
- [ ] **MVP-104** — プロフィール表示フィールドの DB 整合（`avatar` / `nextTitlePoints` / `joinedCount` — 現状 UI が `dummyData` 前提のフィールドを参照） `P1` `FE / BE`

---

### Phase 2: 体験会・フィード（MVP Must）

- [x] **MVP-201** — `experiences` CRUD API（一覧・詳細。作成は認証ユーザー） `P0` `BE`
- [ ] **MVP-202** — 体験に `category`（好奇心クラスタ）と `nicheScore` を付与（シードは設定済み、投稿時は未設定） `P1` `BE`
- [x] **MVP-203** — Home: `experiences` を Supabase から取得してフィード表示 `P0` `FE`
- [ ] **MVP-204** — メディアアップロード: 画像 R2 / 動画 Stream + `mediaUrl` フィード表示（Function・PostScreen・ExperienceCard 実装済み。本番デプロイ・シード `media_url`・エラー UX 要確認） `P1` `FE / Infra`
- [x] **MVP-205** — 投稿画面: フォーム送信 → DB insert → Home 先頭表示 `P0` `FE`
- [ ] **MVP-206** — 投稿時 `pointReward` 算出（ニッチ度 or デフォルト 100） `P2` `BE`
- [ ] **MVP-207** — 投稿フォームの DB 未保存項目整理（`duration` / 初心者歓迎 / 友達 OK — スキーマ追加 or UI 限定の明示） `P3` `BE / FE`
- [ ] **MVP-209** — PostScreen: メディアアップロード失敗時の通知（現状 `null` のまま投稿続行） `P2` `FE`

**現状ですでにできていること（追加実装不要）**

- [x] 縦スナップ UI、`ExperienceCard` / `ExperienceModal` のインタラクション
- [x] モーダル内予約完了 UI

---

### Phase 3: 予約（MVP Must）

- [x] **MVP-301** — Edge Function `reserve-experience`（定員チェック、`reserved_count` 更新、reservation insert） `P0` `BE`
- [x] **MVP-302** — フロント: `handleReserve` を Function 呼び出しに変更 `P0` `FE`
- [x] **MVP-303** — 二重予約防止（同一 user + experience） `P1` `BE`
- [x] **MVP-304** — プロフィール「予約中」タブを DB の `status=reserved` で表示 `P1` `FE`

**現状ギャップ**

- [x] 予約の DB 永続化（`fetchReservations` + Edge Function）
- [ ] 参加後ログのローカル state 残存（`initialLogs` / `handleSaveLog`）
- [ ] 予約成功後の `experiences.reserved_count` フロント再同期

- [ ] **MVP-305** — 予約成功後に `fetchExperiences` で定員表示を更新 `P2` `FE`

---

### Phase 4: 参加後ログ・ポイント・好奇心マップ（MVP Must / Should）

- [ ] **MVP-401** — Edge Function `submit-experience-log`（ログ保存、pt 加算、マップ更新、reservation→joined） `P0` `BE`
- [ ] **MVP-402** — ポイントルール実装（最低限: ログ +30、体験 `pointReward`、新ジャンル +150 は簡易判定） `P1` `BE`
- [ ] **MVP-403** — `point_transactions` 記録とプロフィール総 pt 同期 `P1` `BE`
- [ ] **MVP-404** — `curiosity_map_items` の upsert（genre + category、level / experience_count） `P0` `BE`
- [ ] **MVP-405** — フロント: ログ保存後の完了画面を**実際の更新結果**で表示（ハードコード削除） `P1` `FE`
- [ ] **MVP-406** — プロフィール好奇心マップタブを DB 連携 `P0` `FE`
- [ ] **MVP-410** — フロント: `handleSaveLog` を `submit-experience-log` 呼び出しに変更（ローカル `initialLogs` 廃止） `P0` `FE`
- [ ] **MVP-407** — 称号: pt 閾値テーブル + `users.title` 更新 `P2` `BE / FE`
- [ ] **MVP-408** — 参加数・初体験ジャンル数の集計表示 `P2` `FE`
- [ ] **MVP-411** — `dummyData.js` 整理（未使用 `experiences` 削除、DB 移行済み定数の分離） `P2` `FE`

**現状ギャップ**

- [ ] `LogScreen` 完了メッセージの動的化（現状常に「陶芸 Lv.1」）
- [ ] `curiosityMap` の `dummyData` 固定解除

---

### Phase 5: プロフィール・交換 UI（MVP Should）

- [ ] **MVP-501** — 参加済みログ一覧を `experience_logs` から取得 `P1` `FE`
- [ ] **MVP-502** — ログカードに `againRating` 表示（現状 `funRating` のみ Stars） `P2` `FE`
- [ ] **MVP-503** — 交換タブ: 「実交換不可」の注記を設計書通り明確化（500pt 等はイメージ） `P2` `FE / Design`

**現状ですでにできていること**

- [x] タブ UI、pt・称号・進捗バー、交換リストの見た目

---

### Phase 6: デモ品質・審査向け（MVP）

- [ ] **MVP-601** — モバイル Web 表示調整（`device-frame`、safe-area、実機 Safari 確認） `P1` `FE` ← DES-009 と連携
- [ ] **MVP-602** — ローディング・エラー UI（予約失敗、定員満了 — 現状 `alert` のみ） `P1` `FE` ← DES-008 と連携
- [ ] **MVP-603** — QR コード用デモ URL 固定・スクリーンショット撮影 `P1` `PM` ← DES-010 と連携
- [ ] **MVP-604** — 既知の問題 / 未実装を README に記載 `P1` `PM`
- [ ] **MVP-605** — AI_USAGE_LOG 追記（開発節目ごと） `P1` `全員`

---

### Phase 7: デザイン（UI/UX 仕上げ）

> **原則**: 機能が動く画面は先に BE/FE で配線し、見た目は DES タスクで後から polish する。  
> ただし **DES-001（トークン）は最初**にやると、以降の修正コストが下がる。

- [ ] **DES-001** — デザイントークン整備（`tokens.js` ↔ `tailwind.config.js` 統一、カラー・フォント・spacing） `P1` `Design`
- [ ] **DES-002** — Home / `ExperienceCard` polish（CTA・右レール・グラデ fallback・タップフィードバック） `P1` `Design / FE`
- [ ] **DES-003** — `ExperienceModal` polish（ボトムシート・予約完了状態・定員表示） `P1` `Design / FE`
- [ ] **DES-004** — プロフィール polish（pt バー・称号・タブ・空状態） `P2` `Design / FE` ※ MVP-104 後
- [ ] **DES-005** — 好奇心マップ可視化（Lv ドット・カテゴリ一覧・アニメーション） `P1` `Design / FE` ※ MVP-406 後
- [ ] **DES-006** — `LogScreen` polish（入力フォーム・+pt 演出・完了画面の動的レイアウト） `P1` `Design / FE` ※ MVP-405/410 後
- [ ] **DES-007** — `PostScreen` polish（カバーアップロード UI・フォーム余白・完了画面） `P2` `Design / FE`
- [ ] **DES-008** — ローディング・エラー・空状態コンポーネント（`alert` 置き換え） `P1` `Design / FE` ※ MVP-602 と同時
- [ ] **DES-009** — モバイル実機調整（safe-area、`100dvh`、タップ領域 44px 以上） `P1` `Design / FE` ※ MVP-601 と同時
- [ ] **DES-010** — デモ用スクリーンショット・README 素材（Home / ログ完了 / マップ） `P1` `Design / PM` ※ Day 3 提出前

**対象ファイル早見**

| 画面 | 主ファイル |
|------|-----------|
| トークン | `frontend/src/styles/tokens.js`, `frontend/tailwind.config.js`, `frontend/src/index.css` |
| Home | `HomeScreen.jsx`, `ExperienceCard.jsx`, `ExperienceModal.jsx` |
| プロフィール | `ProfileScreen.jsx` |
| ログ | `LogScreen.jsx`, `PointBurst.jsx` |
| 投稿 | `PostScreen.jsx` |
| 共通 | `Button.jsx`, `Badge.jsx`, `BottomTabBar.jsx` |

---

## 5. MVP 以降（Post-MVP）

### 5.1 プロダクト機能拡張

- [ ] **POST-001** — 体験会動画アップロード・再生 `P3` — MVP-204 で基盤実装済み。本番検証・UX 磨きが残タスク
- [ ] **POST-002** — 保存（ブックマーク）の永続化 `P3` — saved_experiences テーブル
- [ ] **POST-003** — Following フィード `P3` — フォロー関係 + フィルタ
- [ ] **POST-004** — Random Box `P3` — 設計書 Could
- [ ] **POST-005** — 予約キャンセル `P3` — status `cancelled`
- [ ] **POST-006** — 参加ステータス手動／QR チェックイン `P3` — 運用フロー次第
- [ ] **POST-007** — レビュー・通報・本人確認 `P3` — §17 リスク4 対策
- [ ] **POST-008** — 通知（予約リマインド） `P3` — Push / メール
- [ ] **POST-009** — ランキング・レコメンド `P3` — MVP 外
- [ ] **POST-010** — 実決済（Stripe 等） `P3` — 手数料モデル §16
- [ ] **POST-011** — 商品券実交換 `P3` — ポイント消費
- [ ] **POST-012** — AI 翻訳説明文 `P3` — MVP 外
- [ ] **POST-013** — クリエイター向け分析ダッシュボード `P3` — サブスク構想 §16

### 5.2 技術・インフラ

- [ ] **POST-101** — React Native / Expo への移行 or 共有ロジック化 `P3` — 設計書準拠のネイティブ体験
- [ ] **POST-102** — 分析イベント送信（§15 KPI） `P2` — Modal Open / Reserve / Log 等
- [x] **POST-103** — Preview Deploy（PR ごと） `P2` — Vercel
- [ ] **POST-104** — AWS / Cloudflare 検討 `P3` — 大規模配信時

---

## 6. 実装優先順位（推奨スプリント）

### 6.0 全体の進め方（FE / BE / Design の順序）

```
【今すぐ ─ 並行 OK】
  BE:  MVP-009（Functions デプロイ）
  BE:  MVP-401 → 402 → 403 → 404（ログ・pt・マップの核）
  Design: DES-001（トークン）→ DES-002, DES-003, DES-007（配線済み画面の polish）

【BE 401 完了後 ─ FE が着手】
  FE:  MVP-410 → MVP-406 → MVP-405 → MVP-501（ログ〜マップ接続）

【FE 406/405 完了後 ─ Design が着手】
  Design: DES-005（マップ）→ DES-006（ログ完了画面）
  Design: DES-004（プロフィール）※ MVP-104 後

【Day 3 前 ─ 全員】
  FE + Design: MVP-601/602 + DES-008/009（実機・エラー UI）
  PM + Design: MVP-603 + DES-010（スクショ・README）
  PM: MVP-006, MVP-604, MVP-605
```

| フェーズ | BE | FE | Design |
|----------|----|----|--------|
| **Phase A**（今） | MVP-009 → MVP-401〜404 | 待機 or MVP-305, MVP-209 | DES-001 → DES-002, 003, 007 |
| **Phase B**（ログ核完成後） | MVP-402〜404 仕上げ、MVP-104 BE | MVP-410 → 406 → 405 → 501 | DES-005, DES-006 着手 |
| **Phase C**（デモ前日） | MVP-407, 206（余力） | MVP-601, 602, 411 | DES-008, 009, 010 |
| **Phase D**（提出直前） | — | バグ修正のみ | 最終 polish + スクショ |

> **デザインを先にやりすぎない理由**: LogScreen 完了画面（DES-006）や好奇心マップ（DES-005）は、BE/FE で**実データが入ってから**調整しないと手戻りが大きい。  
> **DES-001 だけは例外** — トークンを先に固めると DES-002 以降が楽になる。

### Day 1（基盤 + デモ導線）

- [x] MVP-001〜005（Supabase + Vercel）
- [x] MVP-002, MVP-004（スキーマ + シード）
- [x] MVP-201, MVP-203（フィード DB 化）
- [x] MVP-301, MVP-302（予約 Function）
- [ ] MVP-009（Edge Functions 本番デプロイ & Secrets）

**ゴール**: デプロイ URL で「他人の体験を見て予約まで」→ **概ね達成。ログ・マップが次のブロッカー**

### Day 2（価値の核）

**BE**: MVP-401〜404  
**FE**: MVP-410 → MVP-406 → MVP-405 → MVP-501  
**Design**: DES-001（午前中）→ DES-002, DES-003（BE 待ち時間に）

- [ ] MVP-401〜406, MVP-410（ログ + pt + 好奇心マップ）
- [x] MVP-205（投稿 → フィード）
- [x] MVP-101〜103（最低限のユーザー）
- [ ] MVP-104（プロフィールフィールド整合）
- [ ] MVP-601, MVP-602
- [ ] MVP-204, MVP-209（メディア本番確認）
- [ ] DES-005, DES-006（FE 406/405 完了後）

**ゴール**: 「投稿 → 予約 → ログ → マップ成長」が審査員に説明できる

### Day 3（仕上げ + 提出）

**BE**: 余力で MVP-407, MVP-206  
**FE**: MVP-502, MVP-408, MVP-411  
**Design**: DES-008〜010 + 最終 polish  
**PM**: MVP-603〜605, MVP-006

- [ ] MVP-407, MVP-501〜503（Should 消化）
- [ ] MVP-603〜605（README、スクショ、AI ログ）
- [ ] DES-008, DES-009, DES-010（エラー UI・実機・スクショ）
- [ ] 余力: MVP-204（画像）、MVP-206、DES-004, DES-007

**ゴール**: プレゼン用デモシナリオが 3 分で回る

---

## 7. デモシナリオ（審査用チェックリスト）

審査員に見せる最短シナリオ。MVP 完了の受け入れ条件とする。

- [ ] QR / URL からスマホブラウザで起動
- [ ] Home で未知の体験をスワイプ閲覧
- [ ] 「予約する」→ モーダルで詳細確認 → 予約完了
- [ ] プロフィールで予約中が表示される
- [ ] 「参加後ログを書く」→ 感想・星評価 → 保存
- [ ] +pt 表示、好奇心マップの該当ジャンルが更新
- [ ] 投稿タブから新規体験会を作成 → Home に出現
- [ ] リロード後も予約・ログ・pt が維持される

---

## 8. リスクと現状の対策状況

- [ ] **体験会供給不足** — ダミー + C2C 投稿で対策（シード 5 件 + DB 投稿対応済み）
- [x] **参加ハードル** — 初回無料・モーダル予約（UI 実装済み）
- [ ] **ポイント目当て参加** — マップ・ログで内発化（マップ更新が未連動）
- [x] **C2C 安全性** — 本人確認等は MVP 外（想定通り未着手）

---

## 9. 付録：コンポーネント ↔ 設計書画面

| 設計書 | ファイル |
|--------|----------|
| §9.1 Home | `HomeScreen.jsx`, `ExperienceCard.jsx` |
| §9.2 詳細モーダル | `ExperienceModal.jsx` |
| §9.3 プロフィール | `ProfileScreen.jsx` |
| §9.4 体験会投稿 | `PostScreen.jsx` |
| §9.5 参加後ログ | `LogScreen.jsx` |
| ナビゲーション | `BottomTabBar.jsx`, `App.jsx` |

---

## 10. 変更履歴

| 日付 | 内容 |
|------|------|
| 2026-05-24 | 初版作成（現行コードベース調査 + 設計書照合） |
| 2026-05-24 | タスク・追跡項目をチェックボックス形式に統一 |
| 2026-05-24 | コードベース再調査: 予約 DB 化・Auth・メディア基盤を反映。MVP-009/104/209/305/410/411/606 を追加 |
| 2026-05-24 | 担当別早見表（§4.0〜4.1）、Phase 7 デザインタスク（DES-001〜010）、FE/BE/Design 並行順序（§6.0）を追加 |
