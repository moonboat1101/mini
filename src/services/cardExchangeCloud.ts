import Taro from "@tarojs/taro";
import type { CardExchangeProfile } from "../pages/CardExchangeMarket/profileStore";

const LOCAL_PROFILE_KEY = "moonboat-card-exchange-profile-v3";
const LOGIN_CACHE_KEY = "moonboat-card-exchange-authenticated-v1";
const RARITY_RANKING_CACHE_KEY = "moonboat-card-rarity-ranking-v1";
const RARITY_RANKING_CACHE_TTL_MS = 30 * 60 * 1000;

export type CloudCardExchangeProfile = CardExchangeProfile & {
  _id?: string;
  avatarUrl: string;
  createdAt?: number;
};

export type CardExchangeProfilePage = {
  profiles: CloudCardExchangeProfile[];
  hasMore: boolean;
};

export type CardExchangeServerFilter = "all" | "official" | "bilibili" | "overseas";

export type CardRarityRanking = {
  totalProfiles: number;
  scores: Record<string, number>;
};

type CachedCardRarityRanking = {
  ranking: CardRarityRanking;
  expiresAt: number;
};

let initialized = false;

const cloud = () => (globalThis as any).wx?.cloud;

export const initCardExchangeCloud = () => {
  const wxCloud = cloud();
  if (!wxCloud || initialized) return Boolean(wxCloud);
  wxCloud.init({ traceUser: true });
  initialized = true;
  return true;
};

export const getCachedCardExchangeProfile = (): CloudCardExchangeProfile | null => {
  try {
    return Taro.getStorageSync(LOCAL_PROFILE_KEY) || null;
  } catch {
    return null;
  }
};

export const cacheCardExchangeProfile = (profile: CloudCardExchangeProfile) => {
  Taro.setStorageSync(LOCAL_PROFILE_KEY, profile);
};

/** 本地只缓存“已验证过微信身份”的状态，不会自动读取云端资料。 */
export const getCardExchangeLoginCache = () => {
  try {
    return Boolean(Taro.getStorageSync(LOGIN_CACHE_KEY));
  } catch {
    return false;
  }
};

export const cacheCardExchangeLogin = () => {
  Taro.setStorageSync(LOGIN_CACHE_KEY, true);
};

const cleanProfile = (profile: CloudCardExchangeProfile) => ({
  _id: profile._id,
  uid: profile.uid.trim(),
  qq: profile.qq.trim(),
  wechat: profile.wechat.trim(),
  avatarUrl: profile.avatarUrl || "",
  activeTime: profile.activeTime.trim(),
  ownedIds: profile.ownedIds,
  wantedIds: profile.wantedIds,
  isPublished: profile.isPublished,
  updatedAt: profile.updatedAt,
});

/** 读取当前登录用户的唯一资料；云数据库会按 _openid 自动隔离私有查询。 */
export const getMyCardExchangeProfile = async (): Promise<CloudCardExchangeProfile | null> => {
  if (!initCardExchangeCloud()) return getCachedCardExchangeProfile();
  const result = await cloud().callFunction({ name: "cardExchangeUser", data: { action: "get" } });
  const profile = (result.result?.profile as CloudCardExchangeProfile | undefined) || null;
  if (profile) cacheCardExchangeProfile(profile);
  return profile;
};

export const saveMyCardExchangeProfile = async (profile: CloudCardExchangeProfile) => {
  const next = { ...profile, ...cleanProfile(profile), updatedAt: new Date().toISOString() };
  if (!initCardExchangeCloud()) {
    cacheCardExchangeProfile(next);
    return next;
  }
  const result = await cloud().callFunction({ name: "cardExchangeUser", data: { action: "save", profile: cleanProfile(next) } });
  next._id = result.result?._id || next._id;
  cacheCardExchangeProfile(next);
  return next;
};

export const getPublishedCardExchangeProfilesPage = async (page = 0, pageSize = 10, ownedFilterIds: string[] = [], wantedFilterIds: string[] = [], serverFilter: CardExchangeServerFilter = "all"): Promise<CardExchangeProfilePage> => {
  if (!initCardExchangeCloud()) return { profiles: [], hasMore: false };
  const result = await cloud().callFunction({
    name: "cardExchangeMarket",
    data: { action: "market", page, pageSize, ownedFilterIds, wantedFilterIds, serverFilter },
  });
  return {
    profiles: (result.result?.profiles || []) as CloudCardExchangeProfile[],
    hasMore: Boolean(result.result?.hasMore),
  };
};

export const getCardRarityRanking = async (): Promise<CardRarityRanking> => {
  const now = Date.now();
  try {
    const cached = Taro.getStorageSync(RARITY_RANKING_CACHE_KEY) as CachedCardRarityRanking | null;
    if (cached?.ranking && Number(cached.expiresAt) > now) return cached.ranking;
  } catch {
    // 本地缓存不可用时继续走云函数。
  }

  if (!initCardExchangeCloud()) return { totalProfiles: 0, scores: {} };
  const result = await cloud().callFunction({ name: "cardRarityRanking" });
  const ranking = {
    totalProfiles: Number(result.result?.totalProfiles) || 0,
    scores: result.result?.scores || {},
  };
  try {
    // 同一用户 30 分钟内重复打开排行时，直接复用本地统计结果。
    Taro.setStorageSync(RARITY_RANKING_CACHE_KEY, {
      ranking,
      expiresAt: Date.now() + RARITY_RANKING_CACHE_TTL_MS,
    } satisfies CachedCardRarityRanking);
  } catch {
    // 写本地缓存失败不影响正常展示。
  }
  return ranking;
};

/** 仅验证当前微信身份；不申请昵称、头像或其他个人资料。 */
export const loginCardExchangeUser = async (): Promise<CloudCardExchangeProfile | null> => {
  if (!initCardExchangeCloud()) throw new Error("当前环境不支持云登录");
  const result = await cloud().callFunction({ name: "cardExchangeUser", data: { action: "login" } });
  if (!result.result?.authenticated) throw new Error("微信身份验证失败");
  const profile = (result.result?.profile as CloudCardExchangeProfile | undefined) || null;
  if (profile) cacheCardExchangeProfile(profile);
  return profile;
};
