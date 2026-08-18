# moonboat

月舟是我自用的一个非营利性小程序，小程序素材取用自官方网站、大型 Wiki、AI 生成等渠道，如权利方提出要求，会第一时间配合下架相关素材。

## 功能概览

- 月谕圣牌：浏览圣牌市场、管理个人圣牌，并进行卡牌交换相关操作。
- 原神抽卡记录：通过导出链接拉取祈愿记录，统计五星出货、限定角色和抽数情况。
- 剧本杀记录：按时间或评分浏览已玩剧本，查看评分、参与人员、封面、简介和备注。
- 汉兜：中文拼音猜词小游戏，支持键盘输入、状态反馈和答案判定。
- 猜宝可梦：获取宝可梦列表后进行猜测小游戏。
- 数独：数独棋盘练习与交互。
- 生成二维码：输入文本后生成微信小程序内可用的二维码。
- 海龟汤：浏览题面，并支持展开查看汤底答案。
- MBTI 测试：回答题目并获得 MBTI 性格偏好测试结果。
- 米池模拟器：本地模拟抽卡过程，统计平均出金和限定出货次数。
- 关于：展示项目简介、免责声明与作者联系邮箱。
- 主题切换：首页支持深色/浅色主题切换，并带有圆形扩散过渡效果。

## 技术栈

- Taro 4.2
- React 18
- TypeScript
- Less
- Vite
- pnpm 11

## 环境要求

- Node.js 18 及以上版本
- pnpm 11 推荐
- 微信开发者工具

项目已提交 `pnpm-lock.yaml`，建议使用 pnpm 安装依赖，保证依赖树与锁文件一致。

## 快速开始

安装依赖：

```bash
pnpm install
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

1. 执行 `npm run dev:weapp`
2. 打开微信开发者工具
3. 导入项目根目录
4. 将小程序目录设置为 `dist/`
5. 等待 Taro 增量编译后预览页面

当前项目的 `project.config.json` 已包含微信小程序项目配置，可直接配合微信开发者工具使用。

## 目录结构

```text
.
├── assets/                 静态资源
├── config/                 Taro 构建配置
├── src/
│   ├── hooks/              复用 hooks
│   ├── pages/              页面与页面组件
│   ├── styles/             全局样式
│   ├── app.ts              应用入口
│   └── app.config.ts       页面注册与全局窗口配置
├── types/                  类型声明
├── pnpm-workspace.yaml     pnpm 11 配置
├── pnpm-lock.yaml          依赖锁文件
├── project.config.json     微信开发者工具配置
└── package.json            依赖与脚本
```

## 常用脚本

```bash
npm run dev:weapp      # 小程序开发模式
npm run build:weapp    # 小程序生产构建
```

## 依赖维护

本项目使用 `pnpm-lock.yaml` 锁定依赖版本。依赖更新后建议至少执行：

```bash
pnpm install
pnpm peers check
npm run build:weapp
```

## License

MIT
