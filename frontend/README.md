# 放置me — Houchi me (Local MVP)

> あなたのクローンが、知らない自分を見つけてくる。
> 放置しておくほど、あなたが広がる。

クローンAI × 3D仮想世界「叡智の図書館（Sapientia）」の **ローカル限定MVP** です。
データ永続化は localStorage、LLM はモック実装です。後で Supabase / Gemini Edge Functions に切り替える前提で、Interface で抽象化されています。

## 起動

```bash
npm install   # 初回のみ
npm run dev
```

ブラウザで http://localhost:3000 を開きます。
初回は `/onboarding` に自動遷移し、6ステップでクローンを作成すると `/` のメイン画面（叡智の図書館）に戻ります。

## 動く機能（v0.1）

- **クローン作成オンボーディング**（6ステップ・名前 / MBTI / 好み / 自己紹介 / 性格シフト / 探索タイプ）
- **起動ローダー**（CLONE OS のブートシーケンス再現）
- **3D 仮想世界**（叡智の図書館 / Mira・Sage・Echo / 部屋住人 / 野良エージェントの自律歩行）
- **カメラ・操作 HUD**（フォロー復帰、手動操作、遭遇イベント）
- **趣味 / フレンド / プロフィール overlay**（TopBar から開閉）
- **Topic / activity 生成**（LocalStorage フォールバック、Supabase 設定時は Edge Functions 経由）
- **クローン / 部屋住人 / 野良エージェントチャット**（右下 ChatPanel）

## ディレクトリ構造

```
src/
├ app/
│  ├ layout.tsx          — ルートレイアウト（フォント・メタデータ）
│  ├ globals.css         — Tailwind v4 + neon カラー + アニメーション
│  ├ page.tsx            — トップ。ローダー → AppShell（クローン未作成なら /onboarding へ）
│  └ onboarding/page.tsx — 6ステップのクローン作成
├ components/
│  ├ Loader.tsx
│  ├ layout/             — AppShell / TopBar / TopBarNav
│  ├ main/               — WorldHudMenu / control / conversation / chat entry
│  ├ encounter/          — EncounterTrigger / EncounterOverlay
│  ├ overlay/            — 趣味 / フレンド / プロフィール overlay
│  ├ chat/               — ChatPanel
│  └ world/              — VirtualWorld / WorldScene / Library / Avatar / Particles / RoomMarkers / palettes
├ lib/
│  ├ buildContext.ts     — LLM 入力用の文脈生成
│  ├ storage.ts          — Storage インタフェース + LocalStorageImpl / SupabaseImpl
│  ├ clone-engine.ts     — CloneEngine インタフェース + LLMMockImpl / SupabaseEdgeFunctionImpl
│  ├ redis.ts / supabase.ts
│  ├ store.ts            — Zustand のグローバル状態
│  ├ util.ts
│  └ wildAvatarProfiles.ts
└ types/index.ts
```

## 抽象化の設計

```ts
// src/lib/storage.ts
export const storage: Storage = new LocalStorageImpl();
// ← この 1 行を SupabaseImpl に変えれば DB 永続化に切替

// src/lib/clone-engine.ts
export const engine: CloneEngine = new LLMMockImpl();
// ← Supabase 設定を入れると SupabaseEdgeFunctionImpl 経由で Gemini が返答
```

## 操作のヒント

- ヘッダー中央のナビで **ハマっている趣味 / フレンド / プロフィール** のオーバーレイを開閉
- 「ワールド」では HUD メニューからカメラ・操作モード・遭遇イベントを操作
- 右下のチャットパネルで自分のクローン / 部屋の住人 / 野良エージェントと会話
- リロードしても localStorage で永続化、`localStorage.clear()` でやり直し

## 次のステップ

本番化（Gemini / Supabase Edge Functions / Vercel）への移行手順は [NEXT_STEPS.md](./NEXT_STEPS.md) を参照してください。

## 技術スタック

- Next.js 16 (App Router) + React 19 + TypeScript (strict)
- Tailwind CSS v4（`@theme inline` でカラー & フォントトークン）
- Three.js + @react-three/fiber + @react-three/drei + @react-three/postprocessing
- Zustand（グローバル状態管理）
- Inter / JetBrains Mono / Noto Sans JP（next/font/google）
