const cloud = require("wx-server-sdk");

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();
const users = db.collection("users");

const getServerType = (uid) => {
  const value = String(uid || "").trim();
  if (/^[1-4]\d{8}$/.test(value)) return "official";
  if (/^5\d{8}$/.test(value)) return "bilibili";
  return "overseas";
};

/** 返回已发布资料；服务器仅在查询时由 UID 计算，不写入数据库。 */
exports.main = async (event) => {
  const page = Math.max(0, Number(event.page) || 0);
  const pageSize = Math.min(20, Math.max(1, Number(event.pageSize) || 10));
  const ownedFilterIds = Array.isArray(event.ownedFilterIds) ? event.ownedFilterIds.filter(Boolean) : [];
  const wantedFilterIds = Array.isArray(event.wantedFilterIds) ? event.wantedFilterIds.filter(Boolean) : [];
  const serverFilter = ["official", "bilibili", "overseas"].includes(event.serverFilter) ? event.serverFilter : "all";
  const query = { isPublished: true };
  const _ = db.command;

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
