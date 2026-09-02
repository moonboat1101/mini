const cloud = require("wx-server-sdk");

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();
const users = db.collection("users");
const EXCHANGE_NOTICE_TEMPLATE_ID = "oY82V5jBgWojqtCi07YJF_Hp_ED_6Z6wwUelaz8xKKA";
const getChinaDateLabel = () => {
  const date = new Date(Date.now() + 8 * 60 * 60 * 1000);
  return `${date.getUTCFullYear()}年${date.getUTCMonth() + 1}月${date.getUTCDate()}日`;
};

exports.main = async (event) => {
  const { OPENID } = cloud.getWXContext();
  const senderResult = await users.where({ _openid: OPENID }).limit(1).get();
  const sender = senderResult.data[0] || null;
  if (event.action === "recordSubscription") {
    if (!sender) return { recorded: false, message: "请先登录并保存圣牌资料" };
    await users.doc(sender._id).update({
      data: { exchangeSubscriptionSubscribedAt: new Date().toISOString(), exchangeSubscriptionConsumedAt: "" },
    });
    return { recorded: true };
  }
  if (!sender) return { sent: false, message: "该功能需先登录并配置" };

  const senderOwnedIds = Array.isArray(sender.ownedIds) ? sender.ownedIds : [];
  const senderWantedIds = Array.isArray(sender.wantedIds) ? sender.wantedIds : [];
  if (!/^\d{9,10}$/.test(String(sender.uid || "")) || !senderOwnedIds.length || !senderWantedIds.length) {
    return { sent: false, message: "该功能需先登录并配置" };
  }

  const targetProfileId = String(event.targetProfileId || "");
  if (!targetProfileId) return { sent: false, message: "未找到通知对象" };
  const targetResult = await users.doc(targetProfileId).get();
  const target = targetResult.data;
  if (!target || !target.isPublished || !target._openid) return { sent: false, message: "对方已取消发布，暂时无法通知" };
  if (target._openid === OPENID) return { sent: false, message: "不能向自己发送通知" };

  const targetOwnedIds = Array.isArray(target.ownedIds) ? target.ownedIds : [];
  const targetWantedIds = Array.isArray(target.wantedIds) ? target.wantedIds : [];
  const canExchange = senderOwnedIds.some((id) => targetWantedIds.includes(id))
    && senderWantedIds.some((id) => targetOwnedIds.includes(id));
  if (!canExchange) return { sent: false, message: "双方无可交换卡牌" };

  const requestContent = String(event.requestContent || "").trim().replace(/\s*--\s*by\s*月舟\s*$/i, "");
  if (!requestContent) return { sent: false, message: "请求内容不能为空" };
  let result;
  try {
    result = await cloud.openapi.subscribeMessage.send({
      touser: target._openid,
      templateId: EXCHANGE_NOTICE_TEMPLATE_ID,
      page: "pages/CardExchangeMarket/index",
      data: {
        thing1: { value: requestContent.slice(0, 20) },
        thing2: { value: "月谕圣牌" },
        thing3: { value: String(sender.uid || "旅行者") },
        date4: { value: getChinaDateLabel() },
      },
    });
  } catch (error) {
    if (Number(error.errCode || error.errcode) === 43101) {
      return { sent: false, message: "对方暂未订阅换牌通知" };
    }
    if (Number(error.errCode || error.errcode) === 47003) {
      console.error("订阅消息模板参数校验失败：", {
        errCode: error.errCode || error.errcode,
        errMsg: error.errMsg || error.errmsg || error.message,
        stack: error.stack,
      });
      return { sent: false, message: "通知内容格式不符合模板要求" };
    }
    throw error;
  }
  if (Number(result.errCode || result.errcode) === 43101) {
    return { sent: false, message: "对方暂未订阅换牌通知" };
  }
  if (Number(result.errCode || result.errcode)) {
    return { sent: false, message: "发送通知失败" };
  }
  await users.doc(target._id).update({ data: { exchangeSubscriptionConsumedAt: new Date().toISOString() } });
  return { sent: true, result };
};
