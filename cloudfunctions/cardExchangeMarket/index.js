const cloud = require("wx-server-sdk");

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();
const users = db.collection("users");
const MARKET_WINDOW_DAYS = 32;

const getServerType = (uid) => {
  const value = String(uid || "").trim();
  if (/^[1-4]\d{8}$/.test(value)) return "official";
  if (/^5\d{8}$/.test(value)) return "bilibili";
  return "overseas";
};

/** 返回近 32 天更新过的已发布资料；服务器仅在查询时由 UID 计算，不写入数据库。 */
exports.main = async (event = {}) => {
  let isAdmin = false;
  if (event.action === "hide") {
    try {
      const { OPENID } = cloud.getWXContext();
      const caller = OPENID ? await users.where({ _openid: OPENID }).limit(1).get() : { data: [] };
      isAdmin = caller.data[0]?.isAdmin === true;
    } catch (_) {
      // 权限读取失败时隐藏入口关闭，但不影响正常浏览市场。
      isAdmin = false;
    }
  }

  if (event.action === "hide") {
    if (!isAdmin) return { hidden: false, message: "仅管理员可隐藏资料" };
    const targetProfileId = typeof event.targetProfileId === "string" ? event.targetProfileId.trim() : "";
    if (!targetProfileId) return { hidden: false, message: "缺少目标资料 ID" };
    const result = await users.doc(targetProfileId).update({ data: { isPublished: false } });
    return { hidden: result.stats.updated > 0, message: result.stats.updated > 0 ? "已隐藏" : "资料不存在或已隐藏" };
  }

  const page = Math.max(0, Number(event.page) || 0);
  const pageSize = Math.min(20, Math.max(1, Number(event.pageSize) || 10));
  const ownedFilterIds = Array.isArray(event.ownedFilterIds) ? event.ownedFilterIds.filter(Boolean) : [];
  const wantedFilterIds = Array.isArray(event.wantedFilterIds) ? event.wantedFilterIds.filter(Boolean) : [];
  const serverFilter = ["official", "bilibili", "overseas"].includes(event.serverFilter) ? event.serverFilter : "all";
  const _ = db.command;
  const cutoffAt = new Date(Date.now() - MARKET_WINDOW_DAYS * 24 * 60 * 60 * 1000).toISOString();
  const query = { isPublished: true, updatedAt: _.gte(cutoffAt) };

  // 对方“想要”包含我的多余牌，且对方“多余”包含我想要的牌。
  if (ownedFilterIds.length) query.wantedIds = _.in(ownedFilterIds);
  if (wantedFilterIds.length) query.ownedIds = _.in(wantedFilterIds);

  if (serverFilter === "all") {
    const result = await users.where(query)
      .orderBy("updatedAt", "desc")
      .skip(page * pageSize)
      .limit(pageSize)
      .get();
    const profiles = result.data || [];
    return { profiles, hasMore: profiles.length === pageSize };
  }

  // 数据库不保存服务器字段，因此在云函数内逐页按 UID 计算，并按“筛选后”的结果分页。
  const targetOffset = page * pageSize;
  const matched = [];
  let skipped = 0;
  let sourceOffset = 0;
  let sourceHasMore = true;
  while (sourceHasMore && matched.length < pageSize + 1) {
    const result = await users.where(query)
      .orderBy("updatedAt", "desc")
      .skip(sourceOffset)
      .limit(pageSize)
      .get();
    const sourceProfiles = result.data || [];
    sourceOffset += sourceProfiles.length;
    sourceHasMore = sourceProfiles.length === pageSize;
    for (const profile of sourceProfiles) {
      if (getServerType(profile.uid) !== serverFilter) continue;
      if (skipped < targetOffset) {
        skipped += 1;
        continue;
      }
      matched.push(profile);
      if (matched.length === pageSize + 1) break;
    }
  }
  return { profiles: matched.slice(0, pageSize), hasMore: matched.length > pageSize };
};
