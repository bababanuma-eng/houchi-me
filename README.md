# 放置Me（Houchi Me）

> あなたのクローンが、知らない自分を見つけてくる。
> 放置しておくほど、あなたが広がる。

ユーザーの志向を反映した AI クローンが 3D 仮想世界を自律的に探索し、まだ自分でも気づいていない興味や可能性を「持ち帰ってくる」Web アプリケーション。**Engineer Guild Hackathon 2026/05（presented by Mercari）にチームで参加し、優勝した作品**です。

- デモ: https://hochi-me.vercel.app/
- 本リポジトリはチーム開発リポジトリの fork です。本 README は、その中で私が担当した範囲を中心に記載しています。

## このプロジェクトでの私の役割・貢献（要約）

- **プロダクトの企画・アイデアを発案**し、それがチームの作品として採用されて **Engineer Guild Hackathon 2026/05（presented by Mercari）優勝**につながりました。
- 5 名のチームで **フロントエンド（FE）を担当**し、本作品の中核である **3D 仮想世界（React Three Fiber）の描画・操作・演出**と、画面全体の **UI** を実装しました。
- 「AI クローンが 3D 世界を自律的に探索して興味を持ち帰る」という体験を、3D 表現とインタラクションで形にすることに注力しました。

> 一言でいうと: **「放置している間に、もう一人の自分が新しい興味を見つけてくる」というアイデアを発案し、その世界観を 3D で動くプロダクトとして実装した** プロジェクトです。

---

## ① 作成物の説明

### 何を作ったか
ユーザーは自分の分身となる AI クローンを作成します。クローンは「叡智の図書館」と名付けた 3D 仮想世界を自律的に歩き回り、本を読み、メモを取り、他のクローンと出会いながら新しい興味を探索します。1 日ごとにクローンは 1 つの「Topic（発見した興味 + 理由 + 探索の経路）」を持ち帰り、ユーザーはチャットや「毎日の質問」を通じてクローンとの同期率を高めていきます。

### 目的・背景
「自分の興味を広げたいが、自分で探索する時間がない」というニーズに対し、探索する主体をユーザー本人ではなく AI クローンに置き換えることで、「放置している間に自分の世界が広がっている」体験を提供することを狙いとしています。

### 主な機能（実装済み）
- **クローン作成オンボーディング**: 名前 / MBTI / 好み / 自己説明 / 性格シフト / 探索タイプ を入力する多ステップフロー
- **3D 仮想世界**: React Three Fiber による図書館空間。複数のロケーションと趣味別の部屋を配置
- **放置 / 手動モードの切替**: 放置モードではクローンが自動巡回、手動モードでは WASD で操作
- **ロケーション HUD / ミニマップ / カメラ操作**: 現在地・バイタル・同期率の表示、三人称追従カメラ
- **クローン同士の遭遇**: 近接トリガーで会話シーンが発生し、カメラ演出付きで対話を表示
- **デイリー Topic**: 発見した興味を理由・関連概念とともに提示し、フィードバック（気になる/違う/もっと）を送信
- **毎日の質問**: 回答で同期率やバイタルが更新される
- **チャット / 趣味・フレンド・プロフィールのオーバーレイ**

---

## ② 担当した役割

### 企画（アイデア発案）
本プロダクト「放置Me」の**コンセプト・アイデアを発案**しました。「探索する主体をユーザー本人ではなく AI クローンに置き換え、放置している間に新しい興味を持ち帰ってくる」という体験の着想がチームに採用され、優勝作品の核となりました。

### フロントエンド実装（FE 担当）
チーム開発（5 名）のプロジェクトで、**フロントエンド（FE）を担当**しました。コミット履歴から確認できる主な実装箇所は以下の通りです。

- **3D 仮想世界のレンダリング**（React Three Fiber）: シーン構成、アバターの描画・移動、カメラ制御、遭遇演出
  - `frontend/src/components/world/`（`WorldScene.tsx`, `Avatar.tsx`, `CameraRig.tsx`, `palettes.ts`, `Library.tsx`, `RoomMarkers.tsx`, `Particles.tsx` ほか）
- **放置 / 手動モードの切替トグルとカメラモードの簡素化**
- **会話開始時の演出**（クローンが相手に歩み寄り、三人称 2 ショットで見せる）
- **UI シェル / オーバーレイ**: `components/layout/`（`AppShell.tsx`, `TopBar.tsx`）、`components/chat/ChatPanel.tsx`
- **状態管理・型定義**: `lib/store.ts`（Zustand）、`types/index.ts`、`lib/storage.ts`
- **初期フロントエンド基盤の構築**: プロジェクトセットアップ、モック実装からの立ち上げ

> 担当領域: 主に「3D ホーム / ライブ HUD」周りの FE 実装と UI リデザイン。バックエンド（Supabase / Edge Functions）や LLM（Gemini）接続は他メンバーが主担当で、私は FE 側からの接続・表示を担当しました。

---

## ③ 直面した課題と解決方法

### 課題 1: バックエンド未完成でも動くデモが必要（3 日間のハッカソン）
LLM・DB 接続が完成する前から、FE 側で UI とインタラクションを作り込む必要がありました。

**解決**: 永続化（`storage.ts`）と LLM（`clone-engine.ts`）を**インターフェースで抽象化**し、既定をモック実装（localStorage / モック Topic）、本番を Supabase 実装に差し替えられる構成にしました。これにより、バックエンド未接続でも FE 単独で開発・デモができ、接続後は実装を差し替えるだけで本番化できます。Supabase が不調な場合もモックへフォールバックするため、デモ中の堅牢性も確保しました。

### 課題 2: 3D 世界で「自律的に探索しているように見せる」表現
クローンが意思を持って動いているように見せる必要がありました。

**解決**: 放置モードでウェイポイント間を自動巡回させ、近接時に遭遇イベントを発火、クローンが相手に歩み寄って三人称 2 ショットのカメラに切り替える演出を実装しました。手動モードでは WASD 操作に切り替えられるようにし、「放置して観察する」体験と「自分で動かす」体験を両立しました。

### 課題 3: チーム 5 名での衝突回避
複数人が同一コードベースを並行して触るため、コンフリクトとデグレが起きやすい状況でした。

**解決**: 「1 タスク = 1 ブランチ」「`main` への直接 push 禁止」「PR は build 通過 + レビュー必須」というルールと、タスク管理体系（HO-xxx）に沿って開発を進めました。

---

## ④ 技術情報

### 使用 AI モデル
- **Google Gemini**（`models/gemini-2.5-flash`）— クローン生成、Topic 生成、チャット応答、遭遇時の対話生成に使用。API キーはサーバ専用（Supabase Edge Functions のシークレット）として保持し、クライアントには公開していません。

### アーキテクチャ
```
[ Next.js (App Router) on Vercel ]
   - 3D 世界: React Three Fiber + Three.js
   - 状態管理: Zustand
   - 永続化 / LLM はインターフェースで抽象化（Mock ↔ Supabase 切替）
        |
        v
[ Supabase ]
   - Auth / PostgreSQL（RLS 有効）
   - Edge Functions（Deno）:
       clone-chat / simulate-clone-day / encounter-dialogue
       apply-daily-answers / parse-clone-command
        |
        v
[ Google Gemini API ]（Edge Function 経由で呼び出し、キーはサーバ管理）
```

### 主な実装方法・技術スタック
- **フロントエンド**: Next.js 16（App Router）、React 19、TypeScript、Tailwind CSS v4
- **3D**: @react-three/fiber、Three.js、@react-three/drei、@react-three/postprocessing
- **状態管理**: Zustand
- **バックエンド**: Supabase（Auth / PostgreSQL / Edge Functions / Realtime）。Edge Functions は Deno で実装し、Gemini を JSON 出力モードで呼び出して Topic / 遭遇対話を構造化
- **セッション管理**: Upstash Redis（会話セッションの一時保持）
- **デプロイ**: Vercel（frontend をルートに自動検出）、CI/CD は GitHub Actions

### データベース（主なテーブル）
`profiles` / `clones` / `topics` / `messages` / `feedback` / `clone_activities` / `notes` / `encounter_logs` / `daily_question_answers`（全テーブルで Row-Level Security を有効化）

### リポジトリ構成
```
.
├── frontend/             # Next.js + React Three Fiber（FE 本体）
│   └── src/
│       ├── app/          # ルーティング（home, onboarding ...）
│       ├── components/   # world(3D) / layout / chat / overlay / main / encounter
│       ├── lib/          # store(Zustand) / storage / clone-engine / supabase
│       └── types/
├── backend/supabase/     # migrations / Edge Functions / seed
└── project-docs/         # plan.md（タスク HO-xxx）/ rule.md（開発ルール）ほか
```

---

## 補足
本プロジェクトはチーム開発の成果物です。本 README は技術構成と、その中で私が担当したフロントエンド領域を中心に記載しています。バックエンド・インフラ・LLM 接続については他メンバーが主担当です。
