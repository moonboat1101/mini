import { Button, Input, Switch, Text, View } from "@tarojs/components";
import Taro from "@tarojs/taro";
import { useState } from "react";
import { useTheme } from "../../hooks/useTheme";
import { cardCatalog } from "../CardExchangeMarket/mockData";
import CardTile from "../CardExchangeMarket/components/CardTile";
import { getCardExchangeProfile, saveCardExchangeProfile } from "../CardExchangeMarket/profileStore";
import { cacheCardExchangeLogin, CloudCardExchangeProfile, getCachedCardExchangeProfile, getCardExchangeLoginCache, loginCardExchangeUser, saveMyCardExchangeProfile } from "../../services/cardExchangeCloud";
import styles from "./index.module.less";

type PickerTarget = "owned" | "wanted" | null;

export default function CardExchangeMine() {
  const [savedProfile] = useState(getCardExchangeProfile);
  const [cloudProfile, setCloudProfile] = useState<CloudCardExchangeProfile | null>(getCachedCardExchangeProfile);
  const [uid, setUid] = useState(savedProfile.uid);
  const [name, setName] = useState(savedProfile.name);
  const [avatarUrl, setAvatarUrl] = useState("");
  const [activeTime, setActiveTime] = useState(savedProfile.activeTime);
  const [isPublished, setIsPublished] = useState(savedProfile.isPublished);
  const [ownedIds, setOwnedIds] = useState<string[]>(savedProfile.ownedIds);
  const [wantedIds, setWantedIds] = useState<string[]>(savedProfile.wantedIds);
  const [pickerTarget, setPickerTarget] = useState<PickerTarget>(null);
  const [pickerIds, setPickerIds] = useState<string[]>([]);
  const [, setUpdatedAt] = useState(() => new Date().toISOString());
  const [loggedIn, setLoggedIn] = useState(getCardExchangeLoginCache);
  const { themeClassName } = useTheme();

  const applyCloudProfile = (profile: CloudCardExchangeProfile | null) => {
      if (!profile) return;
      setCloudProfile(profile);
      setUid(profile.uid);
      setName(profile.name);
      setAvatarUrl(profile.avatarUrl || "");
      setActiveTime(profile.activeTime);
      setIsPublished(profile.isPublished);
      setOwnedIds(profile.ownedIds);
      setWantedIds(profile.wantedIds);
  };
  const selectedIds = pickerIds;
  const cardsFor = (ids: string[]) => cardCatalog.filter((card) => ids.includes(card.id));
  const toggleCard = (id: string) => {
    const update = (ids: string[]) => ids.includes(id) ? ids.filter((item) => item !== id) : [...ids, id];
    setPickerIds(update);
  };
  const openPicker = (target: Exclude<PickerTarget, null>) => {
    setPickerIds([...(target === "owned" ? ownedIds : wantedIds)]);
    setPickerTarget(target);
  };
  const confirmPicker = () => {
    if (pickerTarget === "owned") setOwnedIds(pickerIds);
    if (pickerTarget === "wanted") setWantedIds(pickerIds);
    setUpdatedAt(new Date().toISOString());
    setPickerTarget(null);
  };
  const renderCards = (ids: string[], emptyText: string) => {
    const cards = cardsFor(ids);
    return cards.length ? <View className={styles.cardList}>{cards.map((card) => <CardTile key={card.id} card={card} />)}</View> : <Text className={styles.emptyHint}>{emptyText}</Text>;
  };
  const login = async () => {
    Taro.showLoading({ title: "正在登录", mask: true });
    try {
      const profile = await loginCardExchangeUser();
      applyCloudProfile(profile);
      cacheCardExchangeLogin();
      setLoggedIn(true);
      Taro.hideLoading();
      Taro.showToast({ title: "登录成功", icon: "success" });
    } catch {
      Taro.hideLoading();
      Taro.showToast({ title: "微信身份验证失败，请稍后重试", icon: "none" });
    }
  };
  const saveProfile = async () => {
    if (!loggedIn) {
      Taro.showToast({ title: "请先点击微信登录验证身份", icon: "none" });
      return;
    }
    if (isPublished && !/^\d{9}$/.test(uid)) {
      Taro.showToast({ title: "发布需填写 9 位 UID", icon: "none" });
      return;
    }
    if (isPublished && (!ownedIds.length || !wantedIds.length)) {
      Taro.showToast({ title: "发布需选择我多余和我想要的卡牌", icon: "none" });
      return;
    }
    if (ownedIds.some((id) => wantedIds.includes(id))) {
      Taro.showToast({ title: "我多余和我想要不能选择同一张牌", icon: "none" });
      return;
    }
    try {
      Taro.showLoading({ title: "正在保存", mask: true });
      const updatedAt = new Date().toISOString();
      setUpdatedAt(updatedAt);
      const profile = await saveMyCardExchangeProfile({ _id: cloudProfile?._id, uid, name, avatarUrl, activeTime, ownedIds, wantedIds, isPublished, updatedAt });
      setCloudProfile(profile);
      saveCardExchangeProfile(profile);
      Taro.hideLoading();
      Taro.showToast({ title: "保存成功", icon: "success" });
    } catch {
      Taro.hideLoading();
      Taro.showToast({ title: "保存失败，请检查云开发配置", icon: "none" });
    }
  };
  return <View className={`${styles.mineRoot} ${themeClassName} ${!loggedIn ? styles.loginOnly : ""}`}>
    {!loggedIn ? <View className={styles.loginBar}><View><Text className={styles.loginTitle}>登录后可同步资料</Text><Text className={styles.loginHint}>仅使用微信身份进行认证，不获取任何资料</Text></View><Button className={styles.loginButton} onClick={login}>微信登录</Button></View> : <>
      <View className={styles.profilePanel}>
      <View className={styles.field}><Text>UID</Text><Input value={uid} type="number" maxlength={9} className={styles.input} placeholder="请输入 9 位 UID" onInput={(event) => setUid(event.detail.value)} /></View>
      <View className={styles.field}><Text>昵称</Text><Input value={name} maxlength={16} className={styles.input} onInput={(event) => setName(event.detail.value)} /></View>
      <View className={styles.field}><Text>活跃时间</Text><Input value={activeTime} placeholder="例如：晚上 8–12 点" maxlength={24} className={styles.input} onInput={(event) => setActiveTime(event.detail.value)} /></View>
      <View className={styles.field}><View className={styles.publishCopy}><Text>发布到市场</Text><Text className={styles.switchHint}>关闭后不会在市场展示</Text></View><Switch className={styles.publishSwitch} checked={isPublished} color="#c8853e" onChange={(event) => { setIsPublished(event.detail.value); setUpdatedAt(new Date().toISOString()); }} /></View>
      </View>
      <View className={styles.cardBox}><View className={styles.cardBoxHead}><Text className={styles.sectionTitle}>我多余</Text><Button className={styles.chooseButton} onClick={() => openPicker("owned")}>选择</Button></View>{renderCards(ownedIds, "还没有选择可交换的卡牌")}</View>
      <View className={`${styles.cardBox} ${styles.wantBox}`}><View className={styles.cardBoxHead}><Text className={styles.sectionTitle}>我想要</Text><Button className={styles.chooseButton} onClick={() => openPicker("wanted")}>选择</Button></View>{renderCards(wantedIds, "还没有选择我想要的卡牌")}</View>
      <Button className={styles.saveButton} onClick={saveProfile}>保存资料</Button>
      {pickerTarget ? <View className={styles.mask} catchMove onClick={() => setPickerTarget(null)}><View className={styles.sheet} onClick={(event) => event.stopPropagation()}><View className={styles.sheetHead}><View><Text className={styles.sheetTitle}>选择{pickerTarget === "owned" ? "我多余的卡" : "我想要的卡"}</Text><Text className={styles.sheetHint}>可多选，新增卡牌会自动出现在这里。</Text></View></View><View className={styles.pickerList}>{cardCatalog.map((card) => <CardTile key={card.id} card={card} selected={selectedIds.includes(card.id)} onClick={() => toggleCard(card.id)} />)}</View><Button className={styles.confirmButton} onClick={confirmPicker}>完成选择</Button></View></View> : null}
    </>}
  </View>;
}
