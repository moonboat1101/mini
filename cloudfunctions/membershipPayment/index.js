const cloud = require("wx-server-sdk");
const crypto = require("crypto");
const https = require("https");

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();
const users = db.collection("users");
const orders = db.collection("membership_orders");
const counters = db.collection("counters");
const MEMBERSHIP_COUNTER_ID = "moonboat_member_id";
const PRODUCT_ID = "lifetime_membership";
const PRICE_FEN = 100;

const requiredEnv = (name) => {
  const value = String(process.env[name] || "").trim();
  if (!value) throw new Error(`云函数未配置 ${name}`);
  return value;
};
const secureEquals = (left, right) => {
  const leftBuffer = Buffer.from(String(left));
  const rightBuffer = Buffer.from(String(right));
  return leftBuffer.length === rightBuffer.length && crypto.timingSafeEqual(leftBuffer, rightBuffer);
};
const requestJson = (url) => new Promise((resolve, reject) => {
  https.get(url, (response) => {
    let body = "";
    response.setEncoding("utf8");
    response.on("data", (chunk) => { body += chunk; });
    response.on("end", () => {
      try { resolve(JSON.parse(body)); } catch (_) { reject(new Error("微信登录态响应解析失败")); }
    });
  }).on("error", reject);
});
const getSessionKey = async (code, appId) => {
  const params = new URLSearchParams({
    appid: appId,
    secret: requiredEnv("MINIPROGRAM_APP_SECRET"),
    js_code: code,
    grant_type: "authorization_code",
  });
  const response = await requestJson(`https://api.weixin.qq.com/sns/jscode2session?${params}`);
  if (!response.session_key) throw new Error(response.errmsg || "获取微信登录态失败");
  return response.session_key;
};

const orderNo = () => `MBM${Date.now()}${crypto.randomBytes(5).toString("hex").toUpperCase()}`;
const virtualPayment = (outTradeNo, sessionKey) => {
  const appKey = requiredEnv("VIRTUAL_PAYMENT_APP_KEY");
  const signData = JSON.stringify({
    offerId: requiredEnv("VIRTUAL_PAYMENT_OFFER_ID"),
    buyQuantity: 1,
    // 先默认使用沙箱，正式上线时在云函数环境变量中明确改为 0。
    env: Number(process.env.VIRTUAL_PAYMENT_ENV || 1),
    currencyType: "CNY",
    productId: PRODUCT_ID,
    goodsPrice: PRICE_FEN,
    outTradeNo,
    attach: PRODUCT_ID,
  });
  return {
    signData,
    // XPay 要求以 appKey 对原文和固定 URI 计算 HMAC-SHA256；密钥始终只留在云函数环境变量中。
    paySig: crypto.createHmac("sha256", appKey).update(`requestVirtualPayment&${signData}`).digest("hex"),
    // 用户态签名与支付签名不同：它绑定本次 wx.login 登录态，绝不下发 sessionKey 本身。
    signature: crypto.createHmac("sha256", sessionKey).update(signData).digest("hex"),
  };
};

exports.main = async (event) => {
  const { OPENID, APPID } = cloud.getWXContext();

  if (event.action === "status") {
    if (!OPENID) throw new Error("微信身份验证失败");
    const result = await users.where({ _openid: OPENID }).limit(1).get();
    return { memberId: Number(result.data[0]?.memberId) || null };
  }

  if (event.action === "createOrder") {
    if (!OPENID) throw new Error("微信身份验证失败");
    const mine = await users.where({ _openid: OPENID }).limit(1).get();
    if (mine.data[0]?.memberId) return { message: "您已是终身会员" };
    if (!event.code) throw new Error("缺少微信登录凭证");
    const sessionKey = await getSessionKey(event.code, APPID || requiredEnv("MINIPROGRAM_APP_ID"));
    const no = orderNo();
    await orders.add({ data: { orderNo: no, _openid: OPENID, amount: PRICE_FEN, status: "PENDING", createdAt: Date.now() } });
    return { orderNo: no, ...virtualPayment(no, sessionKey) };
  }

  // 此入口只能由支付回调网关调用。前端不传 callbackSecret，也绝不以 requestVirtualPayment 的 success 回调直接发卡。
  if (event.action === "fulfillPaidOrder") {
    if (!secureEquals(event.callbackSecret, requiredEnv("PAYMENT_CALLBACK_SECRET"))) {
      throw new Error("非法支付回调");
    }
    const no = String(event.orderNo || "");
    if (!no) throw new Error("缺少订单号");
    return db.runTransaction(async (transaction) => {
      const found = await transaction.collection("membership_orders").where({ orderNo: no }).limit(1).get();
      const order = found.data[0];
      if (!order) throw new Error("订单不存在");
      if (order.status === "PAID") return { memberId: order.memberId, alreadyFulfilled: true };
      if (order.status !== "PENDING") throw new Error("订单状态异常");

      const owner = await transaction.collection("users").where({ _openid: order._openid }).limit(1).get();
      const existingMemberId = Number(owner.data[0]?.memberId) || null;
      let memberId = existingMemberId;
      if (!memberId) {
        let counter;
        try { counter = await transaction.collection("counters").doc(MEMBERSHIP_COUNTER_ID).get(); } catch (_) { counter = null; }
        memberId = Math.max(1, Number(counter?.data?.value) + 1 || 1);
        if (counter?.data) await transaction.collection("counters").doc(MEMBERSHIP_COUNTER_ID).update({ data: { value: memberId, updatedAt: Date.now() } });
        else await transaction.collection("counters").doc(MEMBERSHIP_COUNTER_ID).set({ data: { value: memberId, updatedAt: Date.now() } });
        if (owner.data[0]) await transaction.collection("users").doc(owner.data[0]._id).update({ data: { memberId, memberSince: Date.now() } });
        else await transaction.collection("users").add({ data: { _openid: order._openid, memberId, memberSince: Date.now(), createdAt: Date.now() } });
      }
      await transaction.collection("membership_orders").doc(order._id).update({ data: { status: "PAID", memberId, paidAt: Date.now() } });
      return { memberId, alreadyFulfilled: false };
    });
  }
  throw new Error("Unsupported action");
};
