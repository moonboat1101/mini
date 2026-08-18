const cloud = require("wx-server-sdk");

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();
const users = db.collection("users");

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext();
  const profile = event.profile || {};
  const byOpenId = await users.where({ _openid: OPENID }).limit(1).get();
  let existing = byOpenId.data[0] || null;

  // 兼容首次接入前已在本机缓存的旧资料：仅在该记录尚未绑定身份时认领一次。
  if (!existing && profile._id) {
    try {
      const legacy = await users.doc(String(profile._id)).get();
      if (legacy.data && !legacy.data._openid) existing = legacy.data;
    } catch (_) {}
  }

  if (event.action === "get" || event.action === "login") {
    return {
      authenticated: Boolean(OPENID),
      profile: existing || null,
    };
  }

  if (event.action === "save") {
    const data = {
      _openid: OPENID,
      uid: String(profile.uid || "").trim(),
      name: String(profile.name || "").trim(),
      avatarUrl: String(profile.avatarUrl || ""),
      activeTime: String(profile.activeTime || "").trim(),
      ownedIds: Array.isArray(profile.ownedIds) ? profile.ownedIds : [],
      wantedIds: Array.isArray(profile.wantedIds) ? profile.wantedIds : [],
      isPublished: Boolean(profile.isPublished),
      updatedAt: new Date().toISOString(),
    };
    if (existing) {
      await users.doc(existing._id).update({ data });
      return { _id: existing._id };
    }
    const created = await users.add({ data: { ...data, createdAt: Date.now() } });
    return { _id: created._id };
  }

  throw new Error("Unsupported action");
};
