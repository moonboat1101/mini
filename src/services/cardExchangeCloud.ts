import Taro from "@tarojs/taro";
import type { CardExchangeProfile } from "../pages/CardExchangeMarket/profileStore";
import { saveCardExchangeProfile } from "../pages/CardExchangeMarket/profileStore";

const LOCAL_PROFILE_KEY = "moonboat-card-exchange-profile-v3";
const LOGIN_CACHE_KEY = "moonboat-card-exchange-authenticated-v1";
const RARITY_RANKING_CACHE_KEY = "moonboat-card-rarity-ranking-v1";
const RARITY_RANKING_CACHE_TTL_MS = 30 * 60 * 1000;
const SUBSCRIPTION_STATUS_CACHE_KEY = "moonboat-card-exchange-subscription-status-v1";
const SUBSCRIPTION_STATUS_CACHE_TTL_MS = 30 * 60 * 1000;

export type CloudCardExchangeProfile = CardExchangeProfile & {
  isAdmin?: boolean;
  _id?: string;
  avatarUrl: string;
  createdAt?: number;
  exchangeSubscriptionSubscribedAt?: string;
  exchangeSubscriptionConsumedAt?: string;
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

type CardExchangeSubscriptionStatus = {
  subscribedAt: string;
  consumedAt: string;
};

type CachedCardExchangeSubscriptionStatus = {
  status: CardExchangeSubscriptionStatus;
  expiresAt: number;
};

let initialized = false;
let profileLoaded = false;
let sharedProfile: CloudCardExchangeProfile | null = null;
let profileRequest: Promise<CloudCardExchangeProfile | null> | null = null;

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
  sharedProfile = profile;
  profileLoaded = true;
  Taro.setStorageSync(LOCAL_PROFILE_KEY, profile);
  saveCardExchangeProfile(profile);
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
  contactA: String(profile.contactA || "").trim().slice(0, 16),
  contactB: String(profile.contactB || "").trim().slice(0, 32),
  avatarUrl: profile.avatarUrl || "",
  activeTime: profile.activeTime.trim(),
  ownedIds: profile.ownedIds,
  wantedIds: profile.wantedIds,
  isPublished: profile.isPublished,
  updatedAt: profile.updatedAt,
});

/** 读取当前登录用户的唯一资料；云数据库会按 _openid 自动隔离私有查询。 */
export const getMyCardExchangeProfile = async (): Promise<CloudCardExchangeProfile | null> => {
  if (profileLoaded) return sharedProfile;
  if (profileRequest) return profileRequest;
  if (!initCardExchangeCloud()) return getCachedCardExchangeProfile();
  profileRequest = (async () => {
    const result = await cloud().callFunction({ name: "cardExchangeUser", data: { action: "get" } });
    const profile = (result.result?.profile as CloudCardExchangeProfile | undefined) || null;
    if (profile) cacheCardExchangeProfile(profile);
    else {
      sharedProfile = null;
      profileLoaded = true;
      Taro.removeStorageSync(LOCAL_PROFILE_KEY);
    }
    return profile;
  })();
  try { return await profileRequest; }
  finally { profileRequest = null; }
};

/** 订阅页状态允许短暂缓存，避免每次切换页签都读取云端资料。 */
export const getCardExchangeSubscriptionStatus = async (): Promise<CardExchangeSubscriptionStatus> => {
  const now = Date.now();
  try {
    const cached = Taro.getStorageSync(SUBSCRIPTION_STATUS_CACHE_KEY) as CachedCardExchangeSubscriptionStatus | null;
    if (cached?.status && Number(cached.expiresAt) > now) return cached.status;
  } catch {
    // 缓存不可用时直接读取云端。
  }
  const profile = await getMyCardExchangeProfile();
  const status = {
    subscribedAt: profile?.exchangeSubscriptionSubscribedAt || "",
    consumedAt: profile?.exchangeSubscriptionConsumedAt || "",
  };
  try {
    Taro.setStorageSync(SUBSCRIPTION_STATUS_CACHE_KEY, { status, expiresAt: now + SUBSCRIPTION_STATUS_CACHE_TTL_MS } satisfies CachedCardExchangeSubscriptionStatus);
  } catch {
    // 缓存写入失败不影响状态展示。
  }
  return status;
};

export const invalidateCardExchangeSubscriptionStatusCache = () => {
  try {
    Taro.removeStorageSync(SUBSCRIPTION_STATUS_CACHE_KEY);
  } catch {
    // 缓存不可用时无需处理。
  }
};

export const saveMyCardExchangeProfile = async (profile: CloudCardExchangeProfile) => {
  const next = { ...profile, ...cleanProfile(profile), isAdmin: getCachedCardExchangeProfile()?.isAdmin === true, updatedAt: new Date().toISOString() };
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

export const hideCardExchangeProfile = async (targetProfileId: string) => {
  if (!initCardExchangeCloud()) throw new Error("当前环境不支持隐藏资料");
  const result = await cloud().callFunction({
    name: "cardExchangeMarket",
    data: { action: "hide", targetProfileId },
  });
  if (!result.result?.hidden) throw new Error(result.result?.message || "隐藏失败");
  const mine = getCachedCardExchangeProfile();
  if (mine?._id === targetProfileId) cacheCardExchangeProfile({ ...mine, isPublished: false });
  try { Taro.removeStorageSync(RARITY_RANKING_CACHE_KEY); } catch {}
};

export const sendCardExchangeNotification = async (targetProfileId: string, requestContent: string) => {
  if (!initCardExchangeCloud()) throw new Error("当前环境不支持发送通知");
  const result = await cloud().callFunction({
    name: "cardExchangeNotification",
    data: { targetProfileId, requestContent },
  });
  if (!result.result?.sent) throw new Error(result.result?.message || "发送通知失败");
};

export const recordCardExchangeSubscription = async () => {
  if (!initCardExchangeCloud()) throw new Error("当前环境不支持订阅通知");
  const result = await cloud().callFunction({ name: "cardExchangeNotification", data: { action: "recordSubscription" } });
  if (!result.result?.recorded) throw new Error(result.result?.message || "订阅状态保存失败");
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
