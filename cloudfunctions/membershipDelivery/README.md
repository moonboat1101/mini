# 虚拟支付发货推送

将此函数部署为 HTTP 云函数，并把与 `membershipPayment` 完全相同的 `PAYMENT_CALLBACK_SECRET` 配到它的环境变量。

在小程序后台「支付与交易 → 虚拟支付 → 基础配置 → 发货推送配置」中：

- 沙箱测试 URL：`<membershipDelivery 的 HTTPS 地址>?token=<PAYMENT_CALLBACK_SECRET>`
- 正式 URL：上线时填写同一地址。

然后在 `lifetime_membership` 道具设置中开启“道具发货推送”。该函数只接受 `xpay_goods_deliver_notify`，成功时转交 `membershipPayment` 事务性发会员编号；推送重试不会重复发号。
