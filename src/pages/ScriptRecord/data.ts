import Taro from "@tarojs/taro";

import {
  scriptGames,
  wishlist,
  type ScriptGame,
  type WishlistGame,
} from "./constants";

const STORAGE_KEY = "moonboat-script-record-data-v1";

export type PlayedScriptRecord = ScriptGame & { id: string };
export type WishlistRecord = WishlistGame & { id: string };

export type ScriptRecordData = {
  played: PlayedScriptRecord[];
  wishlist: WishlistRecord[];
};

const makeId = (prefix: string) =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const asString = (value: unknown) => (typeof value === "string" ? value : "");

const asPlayers = (value: unknown) =>
  Array.isArray(value)
    ? value.map((item) => asString(item).trim()).filter(Boolean)
    : [];

const asNumber = (value: unknown) => {
  const result = Number(value);
  return Number.isFinite(result) ? result : 0;
};

const normalizePlayed = (item: unknown, index: number): PlayedScriptRecord => {
  const value = (item || {}) as Record<string, unknown>;
  return {
    id: asString(value.id) || `played-import-${index + 1}`,
    name: asString(value.name),
    time: asString(value.time),
    desc: asString(value.desc),
    score: asNumber(value.score),
    img: asString(value.img),
    comment: asString(value.comment),
    role: asString(value.role),
    players: asPlayers(value.players),
  };
};

const normalizeWishlist = (item: unknown, index: number): WishlistRecord => {
  const value = (item || {}) as Record<string, unknown>;
  return {
    id: asString(value.id) || `wishlist-import-${index + 1}`,
    name: asString(value.name),
    desc: asString(value.desc),
    people: asNumber(value.people),
    img: asString(value.img),
  };
};

export const getDefaultScriptRecordData = (): ScriptRecordData => ({
  played: scriptGames.map((item, index) => ({
    ...item,
    id: `played-default-${index + 1}`,
    players: item.players ? [...item.players] : [],
  })),
  wishlist: wishlist.map((item, index) => ({
    ...item,
    id: `wishlist-default-${index + 1}`,
  })),
});

export const normalizeScriptRecordData = (value: unknown): ScriptRecordData => {
  const data = (value || {}) as Record<string, unknown>;
  if (!Array.isArray(data.played) || !Array.isArray(data.wishlist)) {
    throw new Error("导入内容需要包含 played 和 wishlist 两个列表");
  }

  return {
    played: data.played.map(normalizePlayed),
    wishlist: data.wishlist.map(normalizeWishlist),
  };
};

export const getEmptyScriptRecordData = (): ScriptRecordData => ({
  played: [],
  wishlist: [],
});

export const loadCustomScriptRecordData = (): ScriptRecordData | null => {
  try {
    const stored = Taro.getStorageSync(STORAGE_KEY);
    return stored ? normalizeScriptRecordData(stored) : null;
  } catch {
    return null;
  }
};

export const loadScriptRecordData = (): ScriptRecordData => {
  const customData = loadCustomScriptRecordData();
  const hasCustomRecords = Boolean(
    customData && (customData.played.length || customData.wishlist.length),
  );
  return hasCustomRecords ? customData! : getDefaultScriptRecordData();
};

export const saveScriptRecordData = (data: ScriptRecordData) => {
  Taro.setStorageSync(STORAGE_KEY, data);
};

export const createRecordId = makeId;
