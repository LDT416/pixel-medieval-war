# 新增素材来源

| 文件或效果 | 作者与来源 | 授权 | 用途 |
|---|---|---|---|
| public/models/battlefield.glb | 本项目原创，生成源码 tools/bake-scenery.mjs | CC0 1.0 | 石墙农庄、三种树冠、树干、灌木和岩石 |
| 新增制服、动画和粒子效果 | 本项目原创，见 spriteBaker.ts、spriteAtlas.ts 与渲染模块 | 随项目源代码分发 | 角色外观、逐帧动作、硝烟和泥土 |

## W5 离线角色图集

两军制服、马匹、炮组、旗鼓与动作均由本项目原创。几何与调色板来自 `tools/soldier-model.mjs`，用 `node tools/bake-soldiers.mjs` 生成 `public/art/soldiers/regiments.png` 和帧表。素材随项目代码分发。每个阵营使用 32 色调色板。
