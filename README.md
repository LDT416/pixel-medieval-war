# 血战千军 · 哥特文艺复兴 v4.0

双击 `dist/index.html` 离线游玩。选择英格兰或法兰西、战场和领主难度，再进入征战或沙盒。首次点击开始会启用 Web Audio。

## 战场指挥

- 在征兵坞选择兵种类别，点击立绘征召，长按立绘切换持续征召。后方重械在军事工坊完工后解锁。
- 农夫自动种麦、伐木和交付资源。点击顶部的分工按钮轮换偏好。农舍可升至 T4，四级人口上限依次为 8、14、22、32。
- 轻点己方部队选中附近军团，再点地面下达移动命令，点敌方建筑下达攻击命令。选团键依次筛选主力、火枪和重甲。
- 单指拖动、双指捏合。桌面支持左键框选、右键拖动、WASD 平移、滚轮缩放和小地图跳转。
- 菜单提供暂停、倍速、军歌、音效、工事、保存、恢复和返回封面。沙盒可切换布阵方，在地图上放置最近选择的兵种。
- 默认在演武场集结。达到集结阈值或手动冲锋后按层次推进，残兵回撤重组。重炮由真实炮组操作，炮组全灭后停火。

## 开发与验证

`npm run dev` 启动 Vite。`npx tsc --noEmit` 检查类型，`npm run build` 生成含内嵌脚本和样式的离线页面。`npm test` 运行确定性模拟回归。安装 Playwright 和 Chrome 后，可运行 `node tests/offline.cjs` 验证文件协议、封面、阵营模式、像素地表和移动手势。外部安装的 Playwright 可通过 `PLAYWRIGHT_MODULE` 指定。

军歌曲谱参考 [The British Grenadiers](https://de.wikipedia.org/wiki/The_British_Grenadiers#Melodie) 和 [Chanson de l’oignon](https://www.flutetunes.com/tunes.php?id=2010)。旋律、贝斯、军鼓和冲锋号均在浏览器内合成。
