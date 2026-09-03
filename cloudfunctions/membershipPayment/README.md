# 月舟终身会员支付部署

在云函数的环境变量中设置 `VIRTUAL_PAYMENT_APP_KEY`、`VIRTUAL_PAYMENT_OFFER_ID`、`VIRTUAL_PAYMENT_ENV`（当前测试填 `1`；生产为 `0`）、小程序 `MINIPROGRAM_APP_SECRET` 和随机的 `PAYMENT_CALLBACK_SECRET`。代码未配置环境变量时会默认走沙箱。商品 ID 为 `lifetime_membership`，价格固定为 100 分；请先在微信虚拟支付后台上架同名商品。

函数会在每次创建订单时通过 `wx.login` + 微信 `jscode2session` 接口取得一次性的微信登录态，仅在云端用其计算 `signature`；`MINIPROGRAM_APP_SECRET` 不会传到小程序端。

将支付平台的“支付成功通知”配置到一个受鉴权的 HTTP 网关/工作流。该网关完成支付平台签名验签和订单金额、商品 ID 校验后，调用本函数 `fulfillPaidOrder`，并传入 `{ orderNo, callbackSecret }`。不要把 `callbackSecret` 放在小程序端。

`counters/moonboat_member_id` 由首次成功支付自动创建。会员 ID、计数器递增和订单置为 PAID 在同一数据库事务内完成，因此重试支付回调不会重复分配编号。
