import Taro from "@tarojs/taro";
import type { CardExchangeProfile } from "../pages/CardExchangeMarket/profileStore";

const COLLECTION = "users";
const LOCAL_PROFILE_KEY = "moonboat-card-exchange-profile-v3";
const LOGIN_CACHE_KEY = "moonboat-card-exchange-authenticated-v1";

export type CloudCardExchangeProfile = CardExchangeProfile & {
  _id?: string;
  avatarUrl: string;
  createdAt?: number;
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
  name: profile.name.trim(),
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

export const getPublishedCardExchangeProfiles = async (): Promise<CloudCardExchangeProfile[]> => {
  if (!initCardExchangeCloud()) return [];
  const result = await cloud().database().collection(COLLECTION).where({ isPublished: true }).orderBy("updatedAt", "desc").limit(999).get();
  return (result.data || []) as CloudCardExchangeProfile[];
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
