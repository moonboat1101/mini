const cloud = require("wx-server-sdk");

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();
const users = db.collection("users");

/**
 * 统计公开交换资料的圣牌稀有值。
 * 每出现一次“想要”记 -1；每出现一次“多余”记 +1；数值越小越稀有。
 */
exports.main = async () => {
  const scores = {};
  const batchSize = 20;
  let offset = 0;
  let totalProfiles = 0;

  while (true) {
    const result = await users.where({ isPublished: true })
      .field({ ownedIds: true, wantedIds: true })
      .skip(offset)
      .limit(batchSize)
      .get();
    const profiles = result.data || [];
    totalProfiles += profiles.length;

    profiles.forEach((profile) => {
      (profile.wantedIds || []).forEach((id) => { scores[id] = (scores[id] || 0) - 1; });
      (profile.ownedIds || []).forEach((id) => { scores[id] = (scores[id] || 0) + 1; });
    });

    if (profiles.length < batchSize) break;
    offset += batchSize;
  }

  return { totalProfiles, scores };
};
