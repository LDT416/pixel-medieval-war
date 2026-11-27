# 拿破仑 1815 · 草原千军斗蛐蛐 (HD-2D)

运行 `npm run dev`，用支持 WebGL 2 的浏览器打开终端显示的网址。默认 600 名法军与 600 名英军在开阔草原上交战。右上角可切换总兵力、光照和播放速度。每次重新开战会清空地面的遗体、残片、弹坑和血迹。

左键或右键拖动、WASD 和方向键均可平移。滚轮缩放，Home 回到交战中心，空格暂停或继续，R 重新开战。

## 构建与复验

- `npm test` 校验三档编制、移动、炮击和完整对局，并复算 600 与 1200 人对局的确定性。
- `npm run build` 检查游戏入口及其依赖的 TypeScript 类型，并生成 `dist/`。
- `npm run preview` 提供生产预览。将整个 `dist/` 部署至静态站点即可游玩。图集使用相对 HTTP 路径，支持 GitHub Pages 的仓库子路径。
- `tests/preview.mjs` 可在生产预览与独立 Chromium 调试实例上检查 WebGL、七张素材、暂停、光照、永久残留物、胜利与重开。用 `ARENA_PREVIEW` 和 `ARENA_BROWSER` 指定两端的本机 HTTP 地址，默认端口分别为 4185 与 9527。

## 入口

`src/sim/world.ts` 按每秒 30 步推进模拟。连队展开、局部索敌、近战与炮弹结算位于 `src/sim/`。可用 `new SimWorld(scale, seed)` 重演给定规模和种子的对局。

`src/client/renderer3d/` 管理地形、图集、实时阴影、烟尘、永久贴花与后处理。`window.__arenaDebug.getState()` 可读取实时兵力和渲染计数。调试接口 `panTo(x,z)` 与 `zoomTo(d)` 使用以场地中心为原点的三维米制坐标。
