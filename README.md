# 健身房 100 次

簡潔、手機友善的私人健身打卡網站。每一次去健身房，都能記下一次努力。

## 使用

正式私人網址：https://vic-gym-100.zhewei1010.chatgpt.site

使用擁有此網站的 ChatGPT 帳號登入，點「今天打卡 +1」。也可以補登日期、加入 120 字內備註、查看日期清單與本月紀錄，或刪除誤打卡。

- 累積次數、完成百分比、圓環與 100 格進度同步更新。
- 100 次以後仍可繼續記錄，完成度維持 100%。
- 日期以 Asia/Taipei 為準，不接受未來日期。
- 資料存於雲端 D1，以 Sites 提供的穩定使用者 ID 隔離；同一帳號可跨裝置讀取。
- 新增請求使用唯一 ID，重試與連點不會重複寫入同一請求。
- 網站維持 owner-only 私人存取，不啟用 GitHub Pages。

## 開發

需要 Node.js 22.13+，專案使用 `package.json` 指定的 pnpm 版本。

```sh
pnpm install --frozen-lockfile
pnpm run typecheck
pnpm run build
pnpm test
```

本機預覽前，依 `drizzle/` 順序套用本機 D1 遷移。發布時由 Sites 套用正式環境遷移。開發用資料庫與正式資料庫分開；不得將真實使用者紀錄放進原始碼或遷移。

`pnpm test` 使用已建置的 Worker、獨立 D1 和真實 React 元件，檢查新增、重試、資料隔離、日期驗證、刪除、按鈕互動、百分比與進度格更新、重載持久性，以及 100 / 101 次邊界。測試不會寫入正式網站。

## 主要程式

- `app/gym-tracker.tsx`：互動介面。
- `app/globals.css`：桌面與手機版面。
- `app/api/checkins/route.ts`：經身分驗證的新增、讀取、刪除 API。
- `db/schema.ts`、`drizzle/`：資料結構與版本化遷移。
- `scripts/verify-checkins.mjs`：整合驗證。
- `.openai/hosting.json`：Sites 身分與資料庫綁定。

憑證、個人打卡資料、建置輸出與本機資料庫不納入版本控制。
