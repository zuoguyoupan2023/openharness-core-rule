# openharness-core-rule

一个 DeepSeek Harness（dsh）插件：往**系统提示词**注入「核心底层要求 · 五条铁律」的高优先级规则
（分阶段完成、有问题先问、UI 优先、可见即验收、用户确认才算完成），并在 dsh **设置页侧边栏**显示「核心铁律」一项。

- 纯 dsh plugin（bundle），装在 web profile 即可生效；
- host 半：`ctx.systemPrompt.section({ name, order: 44, text })` 注入规范（真实逻辑）；
- client 半：注册 `settings.section` 槽，显示侧边栏项（写法与已发布的公开插件 `openharness-reply-in-cn` / `openharness-rule-for-dsh-plugin` 完全同构，仅 `id`/`label` 不同）。

> **对使用者**：注入的规则正文是**自包含、环境无关**的——就是本仓库 `000-core-rule.md` 的完整内容，不依赖任何本地目录或私有资料。任何安装此插件的人都能读到同样明确、可执行的铁律。

---

## 注入逻辑（host half，`src/host/index.ts`）

```ts
export const inject = ['systemPrompt']              // 申报依赖，否则 boot 崩
export const name = 'openharness-core-rule'
export function apply(ctx, config) {
  if (config?.enabled === false) return             // 可通过 patch 关闭
  const disposer = ctx.systemPrompt.section({
    name: 'openharness:core-rule',
    order: 44,                                      // persona(0) 之后、工具引导(100+)之前
    text: (context) => (context.agent === undefined ? '' : <五条铁律正文>),
  })
  return () => disposer?.()   // apply 返回 disposer，卸载时清理
}
```

- 取 `order:44`，落在 persona（0）之后、工具引导 section（100+）之前，与同层级的其它已安装 section（如 `openharness-reply-in-cn` 的 45、`openharness-rule-for-dsh-plugin` 的 46）互不影响。
- 规则正文本体是一个字符串数组 `ruleText`，完整对应仓库 `000-core-rule.md` 的五条铁律。
- 只有真实 agent 装配（`context.agent` 存在）才渲染，不污染非 agent 的 assemble 调用。
- 遵循程度为**软约束**：注入**一定发生**，但「模型是否严格遵守」无法 100% 保证——靠 order 靠前 + 措辞「最高优先级」尽量稳住。

**验证注入是否生效**：在对话框直接问「系统提示里有没有『核心底层要求』『UI 优先』这条」——模型能复述即注入成功。

---

## 侧边栏项（client half，`src/client/index.ts`）

```ts
slots.inject('settings.section', () => slots.register(
  { name: 'settings.section', id: 'openharness-core-rule', order: 20, label: () => '核心铁律' },
  Section,
))
```

- `settings.section` 是 **list 槽**：多个插件同时注册不冲突、都会显示（与「中文回复」/「插件开发规范」并列）。
- client 结构与 `openharness-reply-in-cn` 同样式（同构写法，该插件已发布为公开 npm 包），只是 `id`/`label` 不同。

---

## ⚠️ 必读：为什么代码对了却不显示（缓存/进程坑，2026-08 真实教训）

这是调试中最隐蔽的坑之一（安装任何 DSH client 插件后漏看新项的最常见原因）。现象：**client bundle 结构完全一致、进了 boot 图、rev 也更新了，但新加的侧边栏项就是看不到。**

**根因**：
- Tauri 壳（OpenHarness）的「重启 DSH」按钮只杀**后端 node 进程**并重新 spawn，**不会重建前端 webview、不让页面重新加载**。
- dsh 的 client bundle 按 `rev`（内容哈希）缓存在 **webview 内存**里；后端重启、`rev` 变后，webview 仍用旧的，拿不到新插件/新 bundle。
- 所以反复按「重启DSH」看不到新插件项——**不是代码问题，是 webview 没刷新**。

**正确做法**：
1. 改 client / 加新 client 插件后，不要只按「重启DSH」。
2. **彻底退出 OpenHarness（⌘Q）再重开**，或手动刷新/重载 dsh 页面——让 webview 重新请求 `client.js?rev=<新>`。
3. 判断「代码问题 vs 缓存问题」：`lib/client.js` 结构是否与已验证的一致 + boot 图是否引用它 + `rev` 是否更新 → 三者都对却看不到 → **先彻底重启 webview 再看**。

---

## 安装

```sh
# 当前依赖目录（开发）：
dsh plugin --profile web add ./openharness-core-rule
# 或发布后按名装：
dsh plugin --profile web add openharness-core-rule
```

装完**彻底退出 app 重开**（见上文缓存坑）。

---

## 依赖与构建

```sh
pnpm install   # 生成 node_modules（含 esbuild / typescript）
pnpm build     # 产出 lib/index.js（host）+ lib/client.js（client）
```

`package.json`：
- `dsh.bundle.patch: ./cordis.patch.yml`（插入插件行）
- `dsh.client.platform: "web"`（声明 client 半）
- `exports["./client"] → lib/client.js`（浏览器 bundle）
- `main → lib/index.js`（host）

---

## 文件结构

```
openharness-core-rule/
├── 000-core-rule.md        # 规则正文源（五条铁律）
├── src/host/index.ts       # 注入「核心底层要求」system-prompt section（order 44）
├── src/client/index.ts     # 注册 settings.section 侧边栏项「核心铁律」
├── build.mjs               # esbuild 双半打包
├── package.json            # dsh bundle + client 声明 + exports
├── cordis.patch.yml        # 插入插件行
└── tsconfig.json
```
