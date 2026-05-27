# Team 05 — 放置Me

> **放置Me** は、ユーザーの志向を反映した AI クローンが 3D 仮想世界を自律的に探索し、まだ自分でも気づいていない興味や可能性を持ち帰ってくれる Web アプリケーションです。

**1行ピッチ**：放置している間に、もう一人の自分がまだ知らぬ熱狂を見つけ出す

## Demo

| 種別 | URL |
|---|---|
| デモ環境 | https://hochi-me.vercel.app/ |
| プレゼン資料 | https://canva.link/bt9sh07jfks3r7u |

## Product

自分探しをしたい大学生が、「好きなものはあるが本当に熱狂できるものかわからない」「まだ見ぬ自分に出会いたい」のに、忙しくて自分で探しに行く時間も気力もない、という課題に向けたサービスです。

ユーザーの志向から作成されたクローン AI が、3D 仮想世界「叡智の図書館（Sapientia）」で本を読み、ノートを書き、他のクローンと出会いながら探索します。ユーザーはアプリを開くだけで、クローンが見つけた Topic を確認し、チャットで深掘りできます。

## Features

- クローン作成オンボーディング
- 3D 仮想世界ビュー
- クローンの探索状態・同期率・バイタル表示
- Topic の生成・保存・深掘りチャット
- クローン同士のエンカウント会話
- Supabase / Gemini API 連携用の API・Edge Functions

## Tech Stack

- **Frontend**: Next.js 16 App Router, React 19, TypeScript
- **3D**: Three.js, @react-three/fiber, @react-three/drei, @react-three/postprocessing
- **State / Style**: Zustand, Tailwind CSS v4
- **Backend**: Supabase Auth, PostgreSQL, Edge Functions
- **AI**: Google Gemini API
- **Deploy / CI**: Vercel, GitHub Actions

## Setup

```bash
cd frontend
npm install
npm run dev
```

アプリは `http://localhost:3000` で起動します。初回は `/onboarding` に自動遷移し、6 ステップでクローンを作成するとメイン画面へ進みます。

## Environment Variables

`frontend/.env.example` を参考に `frontend/.env.local` を作成します。

```bash
cp frontend/.env.example frontend/.env.local
```

主な環境変数:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `GEMINI_API_KEY`
- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`

`GEMINI_API_KEY` と `SUPABASE_SERVICE_ROLE_KEY` はサーバー側専用です。クライアントに公開しないでください。

## Scripts

```bash
cd frontend
npm run dev
npm run lint
npm run build
```

## Folder Structure

```txt
.
├── frontend/        # Next.js app
├── backend/         # Supabase migrations / Edge Functions / DB docs
├── docs/            # README screenshots
├── project-docs/    # plan, rules, AI usage log, reference mock
├── .github/         # templates and CI/CD workflows
├── package.json     # frontend wrapper scripts
└── README.md
```

## References

- [開発計画](./project-docs/plan.md)
- [開発ルール](./project-docs/rule.md)
- [AI 活用ログ](./project-docs/AI_USAGE_LOG.md)
- [UI / 3D 参照モック](./project-docs/reference/clone-os-mock.html)
