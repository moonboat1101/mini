const cloud = require("wx-server-sdk");

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();
const users = db.collection("users");
const MEMBERSHIP_DURATION_MS = 30 * 24 * 60 * 60 * 1000;

// 客户端仅在微信激励视频 isEnded 为 true 时调用。
exports.main = async () => {
  const { OPENID } = cloud.getWXContext();
  if (!OPENID) throw new Error("请先登录");
  const { data: profiles } = await users.where({ _openid: OPENID }).limit(1).get();
  const existing = profiles[0];

  if (!existing) {
    const now = Date.now();
    const profile = {
      _openid: OPENID,
      uid: "",
      contactA: "",
      contactB: "",
      avatarUrl: "",
      activeTime: "",
      ownedIds: [],
      wantedIds: [],
      isPublished: false,
      updatedAt: new Date(now).toISOString(),
      createdAt: now,
      membershipExpiresAt: now + MEMBERSHIP_DURATION_MS,
      membershipAdCount: 1,
    };
    const created = await users.add({ data: profile });
    return { profile: { ...profile, _id: created._id } };
  }

  // 只更新会员字段；事务避免并发更新覆盖已有天数或次数。
  return db.runTransaction(async (transaction) => {
    const ref = transaction.collection("users").doc(existing._id);
    const { data: current } = await ref.get();
    const data = {
      membershipExpiresAt: Math.max(Date.now(), Number(current.membershipExpiresAt) || 0) + MEMBERSHIP_DURATION_MS,
      membershipAdCount: (Number(current.membershipAdCount) || 0) + 1,
    };
    await ref.update({ data });
    return { profile: { ...current, ...data } };
  });
};
