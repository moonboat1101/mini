# moonboat-mini

一个基于 Taro + React + TypeScript 开发的微信小程序项目，当前更像是一个个人兴趣工具箱，收纳了几类轻量娱乐和记录功能。

## 项目简介

项目首页提供多个功能入口，适合继续扩展成个人常用的小程序合集。目前仓库内已经实现的页面包括：

- 原神抽卡记录：通过导出链接拉取祈愿记录，并统计五星出货情况
- 米池模拟器：本地模拟抽卡过程，统计平均出金和限定出货次数
- 剧本杀记录：按时间或评分浏览已玩剧本，并查看详情备注
- 猜宝可梦：从接口获取宝可梦列表后进行猜测小游戏
- 海龟汤：随机展示题面并支持查看汤底

## 技术栈

- Taro 4
- React 18
- TypeScript
- Less
- Vite Compiler

## 环境要求

- Node.js 18 及以上版本更稳妥
- npm 或 pnpm
- 微信开发者工具

## 快速开始

安装依赖：

```bash
npm install
```

启动微信小程序开发构建：

```bash
npm run dev:weapp
```

生产构建：

```bash
npm run build:weapp
```

构建产物默认输出到 `dist/` 目录。

## 微信开发者工具调试

1. 先执行 `npm run dev:weapp`
2. 打开微信开发者工具
3. 导入项目根目录
4. 将小程序目录设置为 `dist/`
5. 等待 Taro 增量编译后即可预览页面

当前项目的 `project.config.json` 已包含小程序项目配置，可直接配合微信开发者工具使用。

## 目录结构

```text
.
├─assets/                 静态资源
├─config/                 Taro 构建配置
├─src/
│  ├─pages/               页面与页面组件
│  ├─styles/              全局样式
│  ├─app.ts               应用入口
│  └─app.config.ts        页面注册与全局窗口配置
├─types/                  类型声明
├─project.config.json     微信开发者工具配置
└─package.json            依赖与脚本
```

## 常用脚本

```bash
npm run dev:weapp      # 小程序开发模式
npm run build:weapp    # 小程序生产构建
```

## License

MIT
