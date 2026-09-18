import { Button, Canvas, Input, Switch, Text, View } from "@tarojs/components";
import Taro from "@tarojs/taro";
import { useState } from "react";
import { cardCatalog } from "../CardExchangeMarket/mockData";
import CardTile from "../CardExchangeMarket/components/CardTile";
import { getCardExchangeProfile, saveCardExchangeProfile } from "../CardExchangeMarket/profileStore";
import { cacheCardExchangeLogin, CloudCardExchangeProfile, getCachedCardExchangeProfile, getCardExchangeLoginCache, loginCardExchangeUser, saveMyCardExchangeProfile } from "../../services/cardExchangeCloud";
import { drawCardExchangePoster } from "../../utils/drawCardExchangePoster";
import styles from "./index.module.less";

type PickerTarget = "owned" | "wanted" | null;
const POSTER_CANVAS_ID = "moonboat-card-exchange-poster";

export default function CardExchangeMine() {
  const [savedProfile] = useState(getCardExchangeProfile);
  const [cloudProfile, setCloudProfile] = useState<CloudCardExchangeProfile | null>(getCachedCardExchangeProfile);
  const [uid, setUid] = useState(savedProfile.uid);
  const [contactA, setContactA] = useState(savedProfile.contactA);
  const [contactB, setContactB] = useState(savedProfile.contactB);
  const [avatarUrl, setAvatarUrl] = useState("");
  const [activeTime, setActiveTime] = useState(savedProfile.activeTime);
  const [isPublished, setIsPublished] = useState(savedProfile.isPublished);
  const [ownedIds, setOwnedIds] = useState<string[]>(savedProfile.ownedIds);
  const [wantedIds, setWantedIds] = useState<string[]>(savedProfile.wantedIds);
  const [pickerTarget, setPickerTarget] = useState<PickerTarget>(null);
  const [pickerIds, setPickerIds] = useState<string[]>([]);
  const [, setUpdatedAt] = useState(() => new Date().toISOString());
  const [loggedIn, setLoggedIn] = useState(getCardExchangeLoginCache);
  const [isPosterCanvasMounted, setIsPosterCanvasMounted] = useState(false);

  const applyCloudProfile = (profile: CloudCardExchangeProfile | null) => {
      if (!profile) return;
      setCloudProfile(profile);
      setUid(profile.uid);
      setContactA(profile.contactA || "");
      setContactB(profile.contactB || "");
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
    return cards.length ? <View className={styles.cardList}>{cards.map((card) => <CardTile key={card.id} card={card} light />)}</View> : <Text className={styles.emptyHint}>{emptyText}</Text>;
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
    if (isPublished && !/^\d{9,10}$/.test(uid)) {
      Taro.showToast({ title: "发布需填写 9 或 10 位 UID", icon: "none" });
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
      const profile = await saveMyCardExchangeProfile({ _id: cloudProfile?._id, uid, contactA, contactB, avatarUrl, activeTime, ownedIds, wantedIds, isPublished, updatedAt });
      setCloudProfile(profile);
      saveCardExchangeProfile(profile);
      Taro.hideLoading();
      Taro.showToast({ title: "保存成功", icon: "success" });
    } catch {
      Taro.hideLoading();
      Taro.showToast({ title: "保存失败，请检查云开发配置", icon: "none" });
    }
  };
  const baseline = {
    ...(cloudProfile || savedProfile),
    contactA: cloudProfile?.contactA || "",
    contactB: cloudProfile?.contactB || "",
  };
  const hasValidUid = /^\d{9,10}$/.test(uid);
  const createPoster = async () => {
    if (!hasValidUid) return;
    if (!ownedIds.length || !wantedIds.length) {
      Taro.showToast({ title: "请先选择我多余和我想要的卡牌", icon: "none" });
      return;
    }
    setIsPosterCanvasMounted(true);
    Taro.showLoading({ title: "正在生成海报", mask: true });
    try {
      await new Promise((resolve) => setTimeout(resolve, 60));
      const path = await drawCardExchangePoster(POSTER_CANVAS_ID, { uid, contactA, contactB, activeTime, ownedCards: cardsFor(ownedIds), wantedCards: cardsFor(wantedIds) });
      const wxApi = (globalThis as typeof globalThis & {
        wx?: { showShareImageMenu?: (options: { path: string }) => void };
      }).wx;
      if (!wxApi?.showShareImageMenu) {
        Taro.showToast({ title: "当前微信版本不支持图片分享", icon: "none" });
        return;
      }
      wxApi.showShareImageMenu({ path });
    } catch {
      Taro.showToast({ title: "海报生成失败，请重试", icon: "none" });
    } finally {
      Taro.hideLoading();
      setIsPosterCanvasMounted(false);
    }
  };
  const hasChanges = uid !== baseline.uid
    || contactA !== baseline.contactA
    || contactB !== baseline.contactB
    || activeTime !== baseline.activeTime
    || isPublished !== baseline.isPublished
    || ownedIds.join(",") !== baseline.ownedIds.join(",")
    || wantedIds.join(",") !== baseline.wantedIds.join(",");
  return <View className={`${styles.mineRoot} ${!loggedIn ? styles.loginOnly : ""}`}>
    {!loggedIn ? <View className={styles.loginBar}><View><Text className={styles.loginTitle}>登录后可同步资料</Text><Text className={styles.loginHint}>仅使用微信身份进行认证，不获取任何资料</Text></View><Button className={styles.loginButton} onClick={login}>微信登录</Button></View> : <>
      <View className={styles.field}><View className={styles.publishCopy}><Text>发布到市场</Text><Text className={styles.switchHint}>关闭后不会在市场展示</Text></View><Switch className={styles.publishSwitch} checked={isPublished} color="#806943" onChange={(event) => { setIsPublished(event.detail.value); setUpdatedAt(new Date().toISOString()); }} /></View>
      <View className={styles.profilePanel}>
      <View className={styles.field}><Text>UID</Text><Input value={uid} type="number" maxlength={10} className={styles.input} placeholder="请输入 9 或 10 位 UID" placeholderStyle="color: #e8e8e8;" onInput={(event) => setUid(event.detail.value)} /></View>
      <View className={styles.field}><Text>企鹅</Text><Input value={contactA} type="number" maxlength={16} className={styles.input} placeholder="注意隐私安全" placeholderStyle="color: #e8e8e8;" onInput={(event) => setContactA(event.detail.value.replace(/\D/g, ""))} /></View>
      <View className={styles.field}><Text>绿泡泡</Text><Input value={contactB} maxlength={32} className={styles.input} placeholder="注意隐私安全" placeholderStyle="color: #e8e8e8;" onInput={(event) => setContactB(event.detail.value.replace(/[\u3400-\u9fff]/g, ""))} /></View>
      <View className={styles.field}><Text>备注</Text><Input value={activeTime} placeholder="活跃时间等其他备注" maxlength={24} className={styles.input} placeholderStyle="color: #e8e8e8;" onInput={(event) => setActiveTime(event.detail.value)} /></View>
      </View>
      <View className={styles.cardBox}><View className={styles.cardBoxHead}><Text className={styles.sectionTitle}>我多余</Text><Button className={styles.chooseButton} onClick={() => openPicker("owned")}>选择</Button></View>{renderCards(ownedIds, "还没有选择可交换的卡牌")}</View>
      <View className={`${styles.cardBox} ${styles.wantBox}`}><View className={styles.cardBoxHead}><Text className={styles.sectionTitle}>我想要</Text><Button className={styles.chooseButton} onClick={() => openPicker("wanted")}>选择</Button></View>{renderCards(wantedIds, "还没有选择我想要的卡牌")}</View>
      {hasChanges ? <Button className={styles.saveButton} onClick={saveProfile}>保存资料</Button> : null}
      {hasValidUid ? <Button className={styles.posterButton} onClick={createPoster}><Text className={`iconfont ${styles.posterButtonIcon}`}>{"\ue627"}</Text><Text>生成图片</Text></Button> : null}
      {pickerTarget ? <View className={styles.mask} catchMove onClick={() => setPickerTarget(null)}><View className={styles.sheet} onClick={(event) => event.stopPropagation()}><View className={styles.sheetHead}><View><Text className={styles.sheetTitle}>选择{pickerTarget === "owned" ? "我多余的卡" : "我想要的卡"}</Text></View></View><View className={styles.pickerList}>{cardCatalog.map((card) => <CardTile key={card.id} card={card} selected={selectedIds.includes(card.id)} dimmed={!selectedIds.includes(card.id)} onClick={() => toggleCard(card.id)} />)}</View><Button className={styles.confirmButton} onClick={confirmPicker}>完成选择</Button></View></View> : null}
    </>}
    {isPosterCanvasMounted ? <Canvas className={styles.posterCanvas} id={POSTER_CANVAS_ID} type="2d" style="width: 360px; height: 720px;" /> : null}
  </View>;
}
