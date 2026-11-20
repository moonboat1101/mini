import { Button, Image, Text, View } from "@tarojs/components";
import Taro, { useDidShow } from "@tarojs/taro";
import { useEffect, useRef, useState } from "react";
import SlidingNavigation from "../../components/SlidingNavigation";
import { usePageShare } from "../../hooks/usePageShare";
import { initCardExchangeCloud } from "../../services/cardExchangeCloud";
import { getCharacterArtwork, getCharacterCardImage } from "../CardCharacterAssociation/avatars";
import catalog from "./catalog.json";
import styles from "./index.module.less";

type State = { chances: number; lastDaily: string; lastAd: string; lastShare: string; ownedIds: string[]; wildcards: number; drawCount: number };
type Card = typeof catalog[number];
const rarityGroups = [
  { key: "rainbow", rarity: "rainbow", cards: catalog.filter((card) => card.rarity === "rainbow" && !card.id.startsWith("2")) },
  { key: "monsters", rarity: "rainbow", cards: catalog.filter((card) => card.id.startsWith("2")) },
  ...["gold", "purple"].map((rarity) => ({ key: rarity, rarity, cards: catalog.filter((card) => card.rarity === rarity) })),
];

const getCardImage = (card: Card) => ("artwork" in card && typeof card.artwork === "string" ? card.artwork : getCharacterCardImage(card.name));
const hasCardArtwork = (card: Card) => ("artwork" in card && Boolean(card.artwork)) || Boolean(getCharacterArtwork(card.name));
const cardLimit = (card: Card) => card.id.startsWith("2") ? 1 : card.rarity === "rainbow" ? 7 : 6;
const hasPaddedArtwork = (card: Card) => card.name === "雷电将军" || (!card.id.startsWith("2") && getCardImage(card).startsWith("https://patchwiki.biligame.com/images/ys/"));

function PreviewCardFace({ card, owned, className = "", onAnimationEnd }: { card: Card; owned: boolean; className?: string; onAnimationEnd?: () => void }) {
  const avatar = getCardImage(card);
  return <View className={`${styles.drawCard} ${styles.previewCard} ${styles[card.rarity]} ${!owned ? styles.unowned : ""} ${className}`} onAnimationEnd={onAnimationEnd}>

    {avatar ? <Image className={`${styles.resultImage} ${hasCardArtwork(card) ? styles.previewArtwork : ""} ${hasPaddedArtwork(card) ? styles.paddedArtwork : ""}`} src={avatar} mode="aspectFit" /> : <View className={styles.previewFallback}>{card.name.slice(0, 1)}</View>}
    <View className={styles.resultLabel}><Text className={styles.resultName}>{card.name}</Text></View>
  </View>;
}
export default function Shizhi() {
  usePageShare({ title: "拾枝 · 集原神卡", path: "/pages/Shizhi/index", imageUrl: "https://img.remit.ee/i/DYXXbX99ju7W" });
  const [tab, setTab] = useState("draw");
  const [nameOffsets, setNameOffsets] = useState<Record<string, number>>({});
  useEffect(() => {
    if (tab !== "mine") return;
    let active = true;
    const timer = setTimeout(() => {
      const query = Taro.createSelectorQuery();
      query.selectAll(".shizhi-name-window").fields({ dataset: true, size: true });
      query.selectAll(".shizhi-name-text").fields({ dataset: true, size: true });
      query.exec((results) => {
        const windows = results?.[0] || [];
        const texts = results?.[1] || [];
        const widths = new Map(windows.map((item: any) => [item.dataset.id, item.width]));
        const offsets: Record<string, number> = {};
        texts.forEach((item: any) => { const width = widths.get(item.dataset.id); if (typeof width === "number" && item.width > width) offsets[item.dataset.id] = item.width - width; });
        if (active && windows.length && texts.length) setNameOffsets(offsets);
      });
    }, 300);
    return () => { active = false; clearTimeout(timer); };
  }, [tab]);
  const [previewCard, setPreviewCard] = useState<Card | null>(null);
  const [exchangeAnimationId, setExchangeAnimationId] = useState<string | null>(null);
  const [exchangeRevealed, setExchangeRevealed] = useState(false);
  const [previewWildcard, setPreviewWildcard] = useState(false);
  const [state, setState] = useState<State | null>(null);
  const [today, setToday] = useState("");
  const displayedWildcards = state?.wildcards ?? 0;
  const isDisplayOwned = (card: Card) => Boolean(state?.ownedIds.includes(card.id));
  const [result, setResult] = useState<{ card: Card; duplicate?: boolean; wildcard?: boolean } | null>(null);
  const [busy, setBusy] = useState(false);
  const [adBusy, setAdBusy] = useState(false);
  const adLock = useRef(false);
  const requestLock = useRef(false);
  const videoRef = useRef<ReturnType<typeof Taro.createRewardedVideoAd> | null>(null);
  const claimAdRef = useRef<() => Promise<void>>(async () => {});
  useEffect(() => () => { videoRef.current?.destroy(); }, []);
  useEffect(() => {
    if (!exchangeAnimationId) return;
    setExchangeRevealed(false);
    const timer = setTimeout(() => setExchangeRevealed(true), 500);
    return () => clearTimeout(timer);
  }, [exchangeAnimationId]);
  const [error, setError] = useState("");
  const call = async (data: Record<string, string>) => {
    if (requestLock.current) return;
    requestLock.current = true;
    setBusy(true); setError("");
    const loadingTitle = data.action === "draw" ? "正在拾枝" : data.action === "claim" ? "正在领取" : data.action === "exchange" ? "正在兑换" : "正在加载";
    let feedback: { title: string; icon: "success" | "none" } | null = null;
    const isShareClaim = data.action === "claim" && data.source === "share";
    if (!isShareClaim) Taro.showLoading({ title: loadingTitle, mask: true });
    try {
      if (!initCardExchangeCloud()) throw new Error("云服务不可用");
      const response = await (globalThis as any).wx.cloud.callFunction({ name: "shizhi", data });
      const value = response.result;
      if (!value?.state || !value.today) throw new Error("用户信息返回异常");
      setState(value.state); setToday(value.today);
      if (value.result && data.action === "draw") {
        const drawnCard = catalog.find((card) => card.id === value.result.card?.id);
        setResult({ ...value.result, card: drawnCard || { id: String(value.result.card?.id || ""), name: value.result.wildcard ? "万能卡" : "未知角色", englishName: "", rarity: value.result.wildcard ? "rainbow" : value.result.card?.rarity || "purple" } });
      }
      if (data.action === "claim" && !isShareClaim) feedback = { title: "领取成功", icon: "success" };
      if (data.action === "exchange") { setExchangeRevealed(false); setExchangeAnimationId(data.cardId); }
    } catch (e) {
      const message = (e as Error)?.message || "操作失败，请稍后重试";
      if (data.action === "get") setError(message);
      else feedback = { title: message, icon: "none" };
    } finally {
      if (!isShareClaim) Taro.hideLoading();
      requestLock.current = false;
      setBusy(false);
      if (feedback) Taro.showToast(feedback);
    }
  };
  claimAdRef.current = async () => { await call({ action: "claim", source: "ad" }); };
  useDidShow(() => { if (!adLock.current) void call({ action: "get" }); });
  const watchAd = async () => {
    if (adLock.current || busy) return;
    if (process.env.TARO_ENV !== "weapp") { Taro.showToast({ title: "广告暂不可用", icon: "none" }); return; }
    adLock.current = true; setAdBusy(true);
    const finish = () => { adLock.current = false; setAdBusy(false); };
    Taro.showLoading({ title: "正在加载广告", mask: true });
    try {
      let video = videoRef.current;
      if (!video) {
        video = Taro.createRewardedVideoAd({ adUnitId: "adunit-d55d9de2626e2508" });
        videoRef.current = video;
        video.onError((reason) => { console.warn("拾枝激励广告错误", reason); });
        video.onClose(async (result) => {
          if (!adLock.current) return;
          Taro.hideLoading();
          if (!result?.isEnded) { Taro.showToast({ title: "完整观看后才能领取", icon: "none" }); finish(); return; }
          try { await claimAdRef.current(); } finally { finish(); }
        });
      }
      try { await video.show(); } catch { await video.load(); await video.show(); }
      Taro.hideLoading();
    } catch (reason) { console.warn("拾枝激励广告加载或展示失败", reason); Taro.hideLoading(); Taro.showToast({ title: "广告加载失败，请稍后重试", icon: "none" }); finish(); }
  };
  return <View className={styles.page}>
    {error ? <View className={styles.error}><Text>用户信息加载失败，请重试</Text><Button onClick={() => call({ action: "get" })}>重试</Button></View> : null}
    {tab === "draw" ? <>
      <View className={styles.drawPanel}>
        <View className={styles.cardStage}>{result ? <View key={state?.drawCount} className={styles.reveal}><View className={`${styles.drawCard} ${styles.cardBack}`}><Image className={styles.backArtwork} src="https://img.remit.ee/i/KKjwwt5ETIml" mode="aspectFill" /></View><View className={`${styles.drawCard} ${styles.cardFront} ${styles.floatingCard} ${result.wildcard ? styles.wildcardCard : styles[result.card.rarity]}`}>{result.wildcard ? <Image className={styles.wildcardArtwork} src="https://img.remit.ee/i/td1og5N6V6CU" mode="aspectFill" /> : <Image className={`${styles.resultImage} ${hasCardArtwork(result.card) ? styles.previewArtwork : ""} ${hasPaddedArtwork(result.card) ? styles.paddedArtwork : ""}`} src={getCardImage(result.card)} mode="aspectFit" />}<View className={styles.resultLabel}><Text className={styles.resultName}>{result.wildcard ? "万能卡" : result.card.name}</Text></View>{result.wildcard && <Text className={styles.hint}>可兑换未满额的卡牌</Text>}</View></View> : <View className={`${styles.drawCard} ${styles.floatingCard} ${styles.initialCard}`}><Image className={styles.backArtwork} src="https://img.remit.ee/i/KKjwwt5ETIml" mode="aspectFill" /></View>}</View>
        <Button className={`${styles.primary} ${!state || !!error || busy || adBusy || !state.chances ? styles.primaryDisabled : ""}`} hoverClass={styles.primaryPressed} onClick={() => { if (state && !error && !busy && !adBusy && state.chances) void call({ action: "draw" }); }}><Text className={styles.drawButtonTitle}>拾枝</Text><Text className={styles.drawButtonCount}>剩余 {state?.chances ?? 0} 次</Text></Button>
      </View>
      <View className={styles.tasks}><View className={styles.sectionHeading}><View className={styles.sectionMarker} /><Text className={styles.sectionTitle}>每日任务</Text></View><View className={styles.task}><View><Text className={styles.taskTitle}>每日签到 · 拾枝次数+1</Text></View><Button className={styles.taskButton} disabled={!state || !!error || busy || adBusy || state.lastDaily === today} onClick={() => call({ action: "claim", source: "daily" })}>{state?.lastDaily === today && today ? "已领取" : "领取"}</Button></View><View className={styles.task}><View><Text className={styles.taskTitle}>转发小程序 · 拾枝次数+1</Text></View><Button className={styles.taskButton} openType="share" disabled={!state || !!error || busy || adBusy || state.lastShare === today} onClick={() => { void call({ action: "claim", source: "share" }); }}>{state?.lastShare === today && today ? "已领取" : "转发"}</Button></View><View className={styles.task}><View><Text className={styles.taskTitle}>观看广告 · 拾枝次数+1</Text></View><Button className={styles.taskButton} disabled={!state || !!error || busy || adBusy || state.lastAd === today} onClick={watchAd}>{state?.lastAd === today && today ? "已领取" : adBusy ? "加载中" : "观看"}</Button></View></View>
    </> : <View className={styles.collection}><View className={styles.groups}>{rarityGroups.map(group => <View key={group.key} className={styles.grid}>{group.key === "rainbow" && <View className={`${styles.card} ${styles.wildcardTile} ${styles.rainbow} ${!displayedWildcards ? styles.unowned : ""}`} onClick={() => setPreviewWildcard(true)}>{displayedWildcards > 1 && <Text className={styles.cardCount}>{displayedWildcards - 1}</Text>}<Image className={styles.wildcardTileArtwork} src="https://img.remit.ee/i/td1og5N6V6CU" mode="aspectFill" /><View className={styles.cardLabel}><Text className={styles.cardName}>万能卡</Text></View></View>}{group.cards.map(card => { const copies = state?.ownedIds.filter((id) => id === card.id).length ?? 0; const owned = isDisplayOwned(card); const avatar = getCardImage(card); return <View key={card.id} className={`${styles.card} ${styles[card.rarity]} ${!owned ? styles.unowned : ""}`} onClick={() => { setExchangeAnimationId(null); setPreviewCard(card); }}>{copies > 1 && <Text className={styles.cardCount}>{copies - 1}</Text>}{avatar ? <Image className={`${styles.avatar} ${hasCardArtwork(card) ? styles.artwork : ""} ${hasPaddedArtwork(card) ? styles.paddedArtwork : ""}`} src={avatar} mode="aspectFit" lazyLoad /> : <View className={styles.avatarFallback}>{card.name.slice(0, 1)}</View>}<View className={`${styles.cardLabel} ${styles.nameWindow} ${nameOffsets[card.id] ? styles.nameWindowScrolling : ""} shizhi-name-window`} data-id={card.id}><View className={`${styles.cardName} shizhi-name-text ${nameOffsets[card.id] ? styles.nameScrolling : ""}`} data-id={card.id} style={nameOffsets[card.id] ? { "--name-offset": `-${nameOffsets[card.id]}px` } as React.CSSProperties : undefined}>{card.name}</View></View></View>; })}</View>)}</View></View>}
    {previewWildcard && <View className={styles.previewMask} catchMove onTouchMove={(event) => { event.stopPropagation(); event.preventDefault(); }} onClick={() => setPreviewWildcard(false)}><View className={styles.previewContent} onClick={(event) => event.stopPropagation()}><View className={`${styles.drawCard} ${styles.previewCard} ${styles.wildcardCard} ${!displayedWildcards ? styles.previewWildcardUnowned : ""}`}><Image className={styles.wildcardArtwork} src="https://img.remit.ee/i/td1og5N6V6CU" mode="aspectFill" /><View className={styles.resultLabel}><Text className={styles.resultName}>万能卡</Text></View><Text className={styles.hint}>可兑换未满额的卡牌</Text></View></View></View>}
    {previewCard && <View className={styles.previewMask} catchMove onTouchMove={(event) => { event.stopPropagation(); event.preventDefault(); }} onClick={() => { setPreviewCard(null); setExchangeAnimationId(null); }}>
      <View className={styles.previewContent} onClick={(event) => event.stopPropagation()}>
        <PreviewCardFace card={previewCard} owned={exchangeAnimationId === previewCard.id ? exchangeRevealed : isDisplayOwned(previewCard)} className={exchangeAnimationId === previewCard.id ? styles.exchangeTurning : ""} onAnimationEnd={exchangeAnimationId === previewCard.id ? () => setExchangeAnimationId(null) : undefined} />
        <Text className={styles.previewNumber}>#{previewCard.id}</Text>
        <View className={styles.previewAction}>{displayedWildcards > 0 && (state?.ownedIds.filter((id) => id === previewCard.id).length ?? 0) < cardLimit(previewCard) && <Button className={styles.exchange} disabled={busy || adBusy || !!error} onClick={() => call({ action: "exchange", cardId: previewCard.id })}>万能卡兑换</Button>}</View>
      </View>
    </View>}
    <SlidingNavigation className={styles.navigation} items={[{ value: "draw", label: "拾枝" }, { value: "mine", label: "我的" }]} value={tab} onChange={(value) => { Taro.pageScrollTo({ scrollTop: 0, duration: 0 }); setTab(value); }} />
  </View>;
}

// 分享回调通过自定义 Hook 注册，需要显式启用对应页面生命周期。
Shizhi.enableShareAppMessage = true;
Shizhi.enableShareTimeline = true;
