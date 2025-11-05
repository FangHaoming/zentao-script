# ZenTao Monthly Consumed Report Userscript

Floating React panel to aggregate each user's consumed hours for finished tasks in a selected month. Built as a Tampermonkey/Greasemonkey userscript.

## Build

```bash
pnpm i # or npm i / yarn
pnpm build
```

The bundled userscript will be at `dist/zentao-userscript.user.js`.

## Install

- Open your userscript manager (Tampermonkey).
- Create a new script, paste the built file contents, or drag-drop the file.

## Configure

- Click the floating "Report" button on any `www.zentao.rayvision.com` page.
- Paste your API `Token` and Save. Requests use header `Token: <your token>`.
- Base URL is fixed to `http://www.zentao.rayvision.com/zentao/api.php/v1`.

## Features

- Filters: Projects (multi), Executions (multi), Month (single), Users (multi)
- Rolling updates while fetching tasks
- Concurrency-limited requests to avoid browser max concurrent connections
- Table columns: 用户名称(realname), 小时(consumed), 天(consumed/8)

## Referenced API docs

- Users: [获取用户列表](https://www.zentao.net/book/api/666.html)
- Projects: [获取项目列表](https://www.zentao.net/book/api/699.html)
- Project Executions: [获取项目的执行列表](https://www.zentao.net/book/api/710.html)
- Execution Tasks: [获取执行任务列表](https://www.zentao.net/book/api/715.html)
