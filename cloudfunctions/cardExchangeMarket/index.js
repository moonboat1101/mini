const cloud = require("wx-server-sdk");

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();
const users = db.collection("users");

/** 返回已发布资料；筛选条件同时用于市场分页与“我的推荐”。 */
exports.main = async (event) => {
  const page = Math.max(0, Number(event.page) || 0);
  const pageSize = Math.min(20, Math.max(1, Number(event.pageSize) || 10));
  const ownedFilterIds = Array.isArray(event.ownedFilterIds) ? event.ownedFilterIds.filter(Boolean) : [];
  const wantedFilterIds = Array.isArray(event.wantedFilterIds) ? event.wantedFilterIds.filter(Boolean) : [];
  const query = { isPublished: true };
  const _ = db.command;

  // 对方“想要”包含我的多余牌，且对方“多余”包含我想要的牌。
  if (ownedFilterIds.length) query.wantedIds = _.in(ownedFilterIds);
  if (wantedFilterIds.length) query.ownedIds = _.in(wantedFilterIds);

  const result = await users.where(query)
    .orderBy("updatedAt", "desc")
    .skip(page * pageSize)
    .limit(pageSize)
    .get();
  const profiles = result.data || [];
  // 单次查询不超过 20 条。取满时保留“可能还有下一页”，由下一次触底请求确认是否到底。
  return { profiles, hasMore: profiles.length === pageSize };
};
