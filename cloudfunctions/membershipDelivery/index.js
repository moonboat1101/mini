const cloud = require("wx-server-sdk");
const crypto = require("crypto");

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const secureEquals = (left, right) => {
  const leftBuffer = Buffer.from(String(left));
  const rightBuffer = Buffer.from(String(right));
  return leftBuffer.length === rightBuffer.length && crypto.timingSafeEqual(leftBuffer, rightBuffer);
};
const response = (ErrCode, ErrMsg) => ({ ErrCode, ErrMsg });
const payloadFrom = (event) => {
  if (event.body && typeof event.body === "object") return event.body;
  if (typeof event.body === "string") {
    try { return JSON.parse(event.body); } catch (_) { return {}; }
  }
  return event;
};

// HTTP 云函数：微信虚拟支付在道具支付完成后调用它。它只转发精确的发货事件，
// 实际的订单幂等、会员编号事务仍集中在 membershipPayment 内。
exports.main = async (event) => {
  const secret = String(process.env.PAYMENT_CALLBACK_SECRET || "");
  const query = event.queryStringParameters || event.query || {};
  if (!secret || !secureEquals(query.token, secret)) return response(1, "unauthorized");

  const payload = payloadFrom(event);
  if (payload.Event !== "xpay_goods_deliver_notify") return response(0, "ignored");
  if (!payload.OutTradeNo) return response(1, "missing order number");

  try {
    await cloud.callFunction({
      name: "membershipPayment",
      data: {
        action: "fulfillPaidOrder",
        orderNo: String(payload.OutTradeNo),
        callbackSecret: secret,
      },
    });
    return response(0, "success");
  } catch (error) {
    console.error("membership delivery failed", error);
    // 非 0 会让微信重试发货推送；订单写入仍是幂等的。
    return response(1, "retry");
  }
};
