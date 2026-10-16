# moonboat

月舟是我自用的一个非营利性小程序，小程序素材取用自官方网站、大型 Wiki、AI 生成等渠道，如权利方提出要求，会第一时间配合下架相关素材。

## 功能概览

- 月谕圣牌：提供交换市场、我的圣牌、稀有排行和角色关联四个面板；支持微信身份认证、云端同步与发布换卡意愿。
- 抽卡记录：通过导出链接拉取祈愿记录，统计五星出货、限定角色和抽数情况。
- 剧本杀记录：按时间或评分浏览已玩剧本，查看评分、参与人员、封面、简介和备注。
- 汉兜：中文拼音猜词小游戏，支持键盘输入、状态反馈和答案判定。
- 猜宝可梦：获取宝可梦列表后进行猜测小游戏。
- 数独：数独棋盘练习与交互。
- 关于：展示项目简介、免责声明与作者联系邮箱。

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

## 圣牌市场云开发配置

圣牌市场与稀有度排行使用微信云开发；未配置云环境时，其云端数据功能不可用。配置步骤如下：

1. 在微信开发者工具中打开“云开发”，按引导开通环境，并设为当前小程序环境。
2. 在“数据库”创建集合 `users`。每条记录对应一名微信用户的圣牌资料，`isPublished: true` 的记录会出现在市场列表中。
3. 分别上传并部署下列云函数，选择“上传并部署：云端安装依赖”：
   - `cloudfunctions/cardExchangeUser`：登录、读取与保存个人资料；
   - `cloudfunctions/cardExchangeMembership`：完整观看激励视频后发放会员；
   - `cloudfunctions/cardExchangeMarket`：读取市场公开资料；
   - `cloudfunctions/cardRarityRanking`：统计圣牌稀有度。
4. 为 `users` 集合设置权限：

```json
{
  "read": "doc.isPublished == true",
  "write": false
}
```

云函数以服务端身份按 `_openid` 读取和写入用户资料；应用会调用 `wx.cloud.init()` 使用当前绑定环境，无需在代码中写死环境 ID。

### 圣牌会员

“我的圣牌”底部广告前提供会员体系模块。激励视频广告位为 `adunit-989a980427c13fce`，配置于 `src/pages/CardExchangeMine/index.tsx` 中的 `MEMBERSHIP_AD_UNIT_ID`。

`users` 集合新增 `membershipExpiresAt`（毫秒时间戳）和 `membershipAdCount`（累计完整观看次数），由独立的 `cardExchangeMembership` 云函数维护，普通资料保存不接受修改。已有记录缺少字段时视为未开通，首次领取时自动补齐，无需批量迁移。完整观看一次增加 30 天，未到期时顺延，过期时从领取时间重新计算；市场仅在有效期内显示等级标签（星级暖金、月级灰紫、日级赤陶色），1–2 次为 ✦ VIP，3–4 次为 ☾ VIP，5 次及以上为 ☀ VIP。

会员功能只需新增部署 `cardExchangeMembership` 云函数（云端安装依赖），原有 `cardExchangeUser` 和 `cardExchangeMarket` 保持原样。无需创建额外集合。上线前在微信真机验证完整观看、提前关闭和广告加载失败。当前以客户端激励视频 `onClose.isEnded` 作为完成依据，完整观看后自动调用会员云函数，无临时广告凭据；尚未接入广告平台的服务端观看验证。

## 目录结构

```text
.
├── assets/                 静态资源
├── config/                 Taro 构建配置
├── cloudfunctions/          圣牌市场云函数
├── src/
│   ├── hooks/              复用 hooks
│   ├── pages/              页面与页面组件
│   ├── styles/             全局样式
│   ├── utils/              海报绘制等通用工具
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
