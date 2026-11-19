const cloud = require('wx-server-sdk');
const crypto = require('crypto');
const catalog = require('./catalog.json');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();
const collection = 'shizhi_users';
const today = () => new Date(Date.now() + 8 * 3600000).toISOString().slice(0, 10);
const pick = items => items[crypto.randomInt(items.length)];
const chance = (numerator, denominator) => crypto.randomInt(denominator) < numerator;
const cardLimit = card => card.id.startsWith('2') ? 1 : card.rarity === 'rainbow' ? 7 : 6;
exports.main = async event => {
  if (!['get', 'claim', 'draw', 'exchange'].includes(event.action)) throw new Error('操作无效');
  if (event.action === 'claim' && event.source !== 'daily' && event.source !== 'ad' && event.source !== 'share') throw new Error('领取来源无效');
  if (event.action === 'exchange' && !catalog.some(c => c.id === event.cardId)) throw new Error('卡牌不存在或已经拥有');
  const { OPENID } = cloud.getWXContext();
  if (!OPENID) throw new Error('无法获取用户身份');
  const id = crypto.createHash('sha256').update(OPENID).digest('hex');
  return db.runTransaction(async tx => {
    const ref = tx.collection(collection).doc(id);
    let state;
    try { state = (await ref.get()).data; } catch (e) {
      if (e.errCode !== -1 && e.errCode !== -502001 && !/not exist|不存在/i.test(e.errMsg || e.message || '')) throw e;
    }
    const exists = Boolean(state);
    if (!state) state = { _openid: OPENID, chances: 0, lastDaily: '', lastAd: '', lastShare: '', ownedIds: [], wildcards: 0, drawCount: 0, introWildcard: false };
    let result = null;
    if (event.action === 'claim') {
      const field = { daily: 'lastDaily', ad: 'lastAd', share: 'lastShare' }[event.source];
      if (state[field] === today()) throw new Error('今天已经领取过了');
      state.chances++; state[field] = today();
    } else if (event.action === 'draw') {
      if (state.chances < 1) throw new Error('抽卡次数不足');
      const count = state.drawCount || 0;
      const introHit = !state.introWildcard && count < 3 && (count === 2 || chance(count === 0 ? 33 : 66, 100));
      const copiesOf = card => state.ownedIds.filter(ownedId => ownedId === card.id).length;
      const eligible = rarity => catalog.filter(card => card.rarity === rarity && copiesOf(card) < 6);
      let rarity = introHit || ((count >= 3 || state.introWildcard) && chance(1, 15)) ? 'rainbow' : (chance(1, 4) ? 'gold' : 'purple');
      if (rarity !== 'rainbow' && eligible(rarity).length === 0) {
        // 排除满额等级后，按原有等级权重重新选择；彩色池始终有万能卡。
        const options = [
          { rarity: 'rainbow', weight: 2 },
          { rarity: 'gold', weight: 7 },
          { rarity: 'purple', weight: 21 },
        ].filter(option => option.rarity === 'rainbow' || eligible(option.rarity).length > 0);
        let choice = crypto.randomInt(options.reduce((total, option) => total + option.weight, 0));
        rarity = options.find(option => { choice -= option.weight; return choice < 0; }).rarity;
      }
      const pool = catalog.filter(c => c.rarity === rarity);
      const owned = pool.filter(c => state.ownedIds.includes(c.id) && (rarity === 'rainbow' || copiesOf(c) < 6));
      const missing = pool.filter(c => !state.ownedIds.includes(c.id));
      const availableRainbow = rarity === 'rainbow' ? pool.filter(card => copiesOf(card) < cardLimit(card)) : [];
      const duplicate = rarity !== 'rainbow' && owned.length > 0 && (!missing.length || chance(1, 5));
      // 万能卡始终作为一个独立选项，与每张未满额的彩卡等概率。
      const card = introHit ? null : rarity === 'rainbow' ? pick([...availableRainbow, null]) : pick(duplicate ? owned : missing);
      state.chances--; state.drawCount = count + 1;
      if (introHit) state.introWildcard = true;
      if (!card) { state.wildcards++; result = { wildcard: true }; }
      else {
        const copies = copiesOf(card);
        const limit = cardLimit(card);
        if (copies >= limit) throw new Error('卡池配置异常');
        state.ownedIds.push(card.id);
        result = { card, duplicate: copies > 0 };
      }
    } else if (event.action === 'exchange') {
      const card = catalog.find(c => c.id === event.cardId);
      if (!card || state.ownedIds.includes(card.id)) throw new Error('卡牌不存在或已经拥有');
      if (state.wildcards < 1) throw new Error('万能卡不足');
      state.wildcards--; state.ownedIds.push(card.id); result = { card };
    } else if (event.action !== 'get') throw new Error('操作无效');
    const data = { _openid: OPENID, chances: state.chances, lastDaily: state.lastDaily, lastAd: state.lastAd, lastShare: state.lastShare || '', ownedIds: state.ownedIds, wildcards: state.wildcards, drawCount: state.drawCount, introWildcard: Boolean(state.introWildcard) };
    if (!exists) await ref.set({ data });
    else if (event.action !== 'get') await ref.update({ data });
    return { state: data, result, today: today() };
  });
};
