import Taro from "@tarojs/taro";

export type CardExchangeProfile = {
  uid: string;
  name: string;
  activeTime: string;
  ownedIds: string[];
  wantedIds: string[];
  isPublished: boolean;
  updatedAt: string;
};

const STORAGE_KEY = "moonboat-card-exchange-profile-v2";

export const defaultCardExchangeProfile: CardExchangeProfile = {
  uid: "",
  name: "",
  activeTime: "",
  ownedIds: [],
  wantedIds: [],
  isPublished: false,
  updatedAt: "",
};

export const getCardExchangeProfile = (): CardExchangeProfile => {
  try {
    const saved = Taro.getStorageSync(STORAGE_KEY) as Partial<CardExchangeProfile>;
    return { ...defaultCardExchangeProfile, ...saved };
  } catch {
    return defaultCardExchangeProfile;
  }
};

export const saveCardExchangeProfile = (profile: CardExchangeProfile) => {
  Taro.setStorageSync(STORAGE_KEY, profile);
};
