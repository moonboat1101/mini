import { Button, Image, Picker, Text, View } from "@tarojs/components";
import Taro, { useReachBottom } from "@tarojs/taro";
import { useEffect, useState } from "react";
import { usePageShare } from "../../hooks/usePageShare";
import { useTheme } from "../../hooks/useTheme";
import CardExchangeMine from "../CardExchangeMine";
import CardRarityRanking from "../CardRarityRanking";
import CardTile from "./components/CardTile";
import { cardCatalog, getCardById } from "./mockData";
import { getCardExchangeProfile } from "./profileStore";
import { CardExchangeServerFilter, CloudCardExchangeProfile, getPublishedCardExchangeProfilesPage } from "../../services/cardExchangeCloud";
import styles from "./index.module.less";

const WECHAT_ICON_URL = "https://img.remit.ee/api/file/CAACAgUAAyEGAASHRsPbAAEaWnJqmAq0bXTMWIsJU6g1fbFOBw3sVAAChzAAAm9BwFQjKLbCwgeSQD0E.webp";
const QQ_ICON_URL = "https://img.remit.ee/api/file/BQACAgUAAyEGAASHRsPbAAEaWmZqmAi8McGR2sPkkPzIVvPHM-B80QACdzAAAm9BwFQh4jVNv_EOUD0E.jpg";

type FilterTarget = "owned" | "wanted" | null;
type MarketTab = "market" | "ranking" | "mine";
type ServerType = "official" | "bilibili" | "overseas";
type ServerFilter = CardExchangeServerFilter;
// 云函数每页最多返回 20 条展示数据；比原先 10 条少一半翻页与云函数调用。
const PAGE_SIZE = 20;
const getServerType = (uid: string): ServerType => {
  if (/^[1-4]\d{8}$/.test(uid)) return "official";
  if (/^5\d{8}$/.test(uid)) return "bilibili";
  return "overseas";
};
const getDefaultServerFilter = (uid: string): ServerFilter => /^\d{9,10}$/.test(uid) ? getServerType(uid) : "all";
const SERVER_LABEL: Record<ServerFilter, string> = { all: "全部", official: "官服", bilibili: "B服", overseas: "外服" };
const formatUpdatedAt = (updatedAt: string) => {
  const date = new Date(updatedAt);
  const timestamp = date.getTime();
  if (Number.isNaN(timestamp)) return "";

  const elapsed = Math.max(0, Date.now() - timestamp);
  const minutes = Math.floor(elapsed / 60_000);
  if (minutes < 1) return "刚刚";
  if (minutes < 60) return `${minutes} 分钟前`;

  const hours = Math.floor(elapsed / 3_600_000);
  if (hours < 24) return `${hours} 小时前`;

  const monthDay = `${date.getMonth() + 1}.${date.getDate()}`;
  return date.getFullYear() === new Date().getFullYear()
    ? monthDay
    : `${date.getFullYear()}.${monthDay}`;
};
const MARKET_NOTICES = [
  {
    icon: "✦",
    text: "友好换卡，双方加游戏好友自行协商，完成后及时下架。",
    variant: "friendly",
  },
  {
    icon: "!",
    text: "谨防诈骗！换牌不需要提供任何账密或验证码！",
    variant: "safety",
  },
  {
    icon: "✦",
    text: "配置我的圣牌后，市场筛选会自动回填。",
    variant: "friendly",
  },
] as const;

export default function CardExchangeMarket() {
  const [activeTab, setActiveTab] = useState<MarketTab>("market");
  const { themeClassName } = useTheme();
  const switchTab = (tab: MarketTab) => {
    if (tab === activeTab) return;

    // 三个面板共用页面滚动容器，切换前归位以免沿用市场列表的触底位置。
    Taro.pageScrollTo({
      scrollTop: 0,
      duration: 0,
    });
    setActiveTab(tab);
  };

  return (
    <View className={`${styles.exchangeHub} ${themeClassName}`}>
      <View className={styles.panelStage} key={activeTab}>
        {activeTab === "market" ? <MarketPanel /> : null}
        {activeTab === "ranking" ? <CardRarityRanking /> : null}
        {activeTab === "mine" ? <CardExchangeMine /> : null}
      </View>
      <View className={styles.marketActions}>
        <View className={styles.islandIndicator} style={{ transform: `translateX(${activeTab === "market" ? "0" : activeTab === "mine" ? "100%" : "200%"})` }} />
        <Button className={`${styles.islandTab} ${activeTab === "market" ? styles.islandTabActive : ""}`} onClick={() => switchTab("market")}>交换市场</Button>
        <Button className={`${styles.islandTab} ${activeTab === "mine" ? styles.islandTabActive : ""}`} onClick={() => switchTab("mine")}>我的圣牌</Button>
        <Button className={`${styles.islandTab} ${activeTab === "ranking" ? styles.islandTabActive : ""}`} onClick={() => switchTab("ranking")}>稀有排行</Button>
      </View>
    </View>
  );
}

function MarketPanel() {
  const [posts, setPosts] = useState<CloudCardExchangeProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [nextPage, setNextPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [ownedFilterIds, setOwnedFilterIds] = useState<string[]>(() => getCardExchangeProfile().ownedIds);
  const [wantedFilterIds, setWantedFilterIds] = useState<string[]>(() => getCardExchangeProfile().wantedIds);
  const [serverFilter, setServerFilter] = useState<ServerFilter>(() => getDefaultServerFilter(getCardExchangeProfile().uid));
  const [hasConfiguredCards, setHasConfiguredCards] = useState(() => {
    const profile = getCardExchangeProfile();
    return profile.ownedIds.length > 0 && profile.wantedIds.length > 0;
  });
  const [filterTarget, setFilterTarget] = useState<FilterTarget>(null);
  const [filterPickerIds, setFilterPickerIds] = useState<string[]>([]);
  const [noticeIndex, setNoticeIndex] = useState(0);
  const [noticeAnimating, setNoticeAnimating] = useState(false);
  const { themeClassName } = useTheme();
  const selectedFilterIds = filterPickerIds;
  const copyExchangeRequest = (post: CloudCardExchangeProfile) => {
    const profile = getCardExchangeProfile();
    const myCards = profile.ownedIds.filter((id) => post.wantedIds.includes(id)).map((id) => getCardById(id).name).join("/");
    const theirCards = profile.wantedIds.filter((id) => post.ownedIds.includes(id)).map((id) => getCardById(id).name).join("/");
    Taro.setClipboardData({
      data: `请问可以用我的月谕圣牌【${myCards}】交换你的【${theirCards}】吗？-- by 月舟`,
      success: () => Taro.showToast({ title: "已复制请求文案", icon: "success" }),
    });
  };
  const copyUid = (post: CloudCardExchangeProfile) => {
    Taro.setClipboardData({
      data: post.uid,
      success: () => Taro.showToast({ title: "已复制 UID", icon: "success" }),
    });
  };
  const canCopyExchangeRequest = (post: CloudCardExchangeProfile) => {
    const profile = getCardExchangeProfile();
    return profile.ownedIds.some((id) => post.wantedIds.includes(id))
      && profile.wantedIds.some((id) => post.ownedIds.includes(id));
  };
  const toggleFilterCard = (id: string) => {
    const update = (ids: string[]) => ids.includes(id) ? ids.filter((item) => item !== id) : [...ids, id];
    setFilterPickerIds(update);
  };
  const openFilterPicker = (target: Exclude<FilterTarget, null>) => {
    setFilterPickerIds([...(target === "owned" ? ownedFilterIds : wantedFilterIds)]);
    setFilterTarget(target);
  };
  const loadPage = async (page: number, replace = false, ownedFilters = ownedFilterIds, wantedFilters = wantedFilterIds, server = serverFilter) => {
    if (replace) setLoading(true);
    else setLoadingMore(true);
    try {
      const result = await getPublishedCardExchangeProfilesPage(page, PAGE_SIZE, ownedFilters, wantedFilters, server);
      setPosts((current) => replace ? result.profiles : [...current, ...result.profiles]);
      setNextPage(page + 1);
      setHasMore(result.hasMore);
    } catch {
      Taro.showToast({ title: "市场数据加载失败", icon: "none" });
    } finally {
      if (replace) setLoading(false);
      else setLoadingMore(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => setNoticeAnimating(true), 3000);
    return () => clearTimeout(timer);
  }, [noticeIndex]);

  const completeNoticeTransition = () => {
    if (!noticeAnimating) return;
    setNoticeIndex((index) => (index + 1) % MARKET_NOTICES.length);
    setNoticeAnimating(false);
  };

  useEffect(() => {
    const profile = getCardExchangeProfile();
    setOwnedFilterIds(profile.ownedIds);
    setWantedFilterIds(profile.wantedIds);
    setServerFilter(getDefaultServerFilter(profile.uid));
    setHasConfiguredCards(profile.ownedIds.length > 0 && profile.wantedIds.length > 0);
    setPosts([]);
    setNextPage(0);
    setHasMore(true);
    loadPage(0, true, profile.ownedIds, profile.wantedIds, getDefaultServerFilter(profile.uid));
  // 面板每次切换时重新挂载，确保市场筛选与资料保持同步。
  }, []);

  useReachBottom(() => {
    if (!loading && !loadingMore && hasMore) loadPage(nextPage);
  });

  usePageShare({ title: "圣牌市场", path: "/pages/CardExchangeMarket/index" });

  return (
    <View className={`${styles.marketRoot} ${themeClassName}`}>
      <View className={styles.noticeViewport}>
        <View
          className={`${styles.noticeTrack} ${noticeAnimating ? styles.noticeTrackAnimating : ""}`}
          onTransitionEnd={completeNoticeTransition}
        >
          {[noticeIndex, (noticeIndex + 1) % MARKET_NOTICES.length].map((index) => {
            const notice = MARKET_NOTICES[index];
            return (
              <View key={`${notice.variant}-${index}`} className={`${styles.notice} ${styles[notice.variant]}`}>
                <Text className={styles.noticeIcon}>{notice.icon}</Text>
                <Text className={styles.noticeText}>{notice.text}</Text>
              </View>
            );
          })}
        </View>
      </View>

      <View className={styles.filterBar}>
        <Text className={styles.filterIntro}>筛选：</Text>
        <Button className={styles.filterButton} onClick={() => openFilterPicker("owned")}>我多余 / 他想要{ownedFilterIds.length ? <Text className={styles.filterCount}>{ownedFilterIds.length}</Text> : null}</Button>
        <Button className={styles.filterButton} onClick={() => openFilterPicker("wanted")}>我想要 / 他多余{wantedFilterIds.length ? <Text className={styles.filterCount}>{wantedFilterIds.length}</Text> : null}</Button>
        <Picker mode="selector" range={["全部", "官服", "B服", "外服"]} value={["all", "official", "bilibili", "overseas"].indexOf(serverFilter)} onChange={(event) => { const next = (["all", "official", "bilibili", "overseas"] as ServerFilter[])[Number(event.detail.value)]; setServerFilter(next); loadPage(0, true, ownedFilterIds, wantedFilterIds, next); }}><Button className={styles.serverFilterButton}>{SERVER_LABEL[serverFilter]}</Button></Picker>
        <Button className={styles.resetButton} onClick={() => { setOwnedFilterIds([]); setWantedFilterIds([]); setServerFilter("all"); loadPage(0, true, [], [], "all"); }}>重置</Button>
      </View>

      <View className={styles.postList}>
        {posts.map((post) => (
          <View className={styles.postCard} key={post._id || post.uid}>
              <View className={styles.postMeta}>
                <View className={styles.userInfo}>
                  <View className={styles.nameRow}>
                    <Text className={styles.uid}>{post.uid}</Text>
                    <Text className={`${styles.serverTag} ${styles[`server${getServerType(post.uid)}`]}`}>{SERVER_LABEL[getServerType(post.uid)]}</Text>
                  </View>
                </View>
                {formatUpdatedAt(post.updatedAt) ? <Text className={styles.updatedTime}>更新于 {formatUpdatedAt(post.updatedAt)}</Text> : null}
              </View>

            {post.qq || post.wechat || post.activeTime ? <View className={styles.contactBox}>
              {post.qq ? <View className={styles.contactItem}><Image className={styles.qqIcon} src={QQ_ICON_URL} mode="aspectFit" /><Text>{post.qq}</Text></View> : null}
              {post.wechat ? <View className={styles.contactItem}><Image className={styles.wechatIcon} src={WECHAT_ICON_URL} mode="aspectFit" /><Text>{post.wechat}</Text></View> : null}
              {post.activeTime ? <View className={styles.contactItem}><Text className={`${styles.contactIcon} ${styles.clockIcon}`}>⏰</Text><Text>{post.activeTime}</Text></View> : null}
            </View> : null}
            <View className={styles.exchangeBox}>
              <Text className={styles.exchangeLabel}>我多余</Text>
              <View className={styles.cardGrid}>
                {post.ownedIds.map((cardId) => <CardTile key={cardId} card={getCardById(cardId)} />)}
              </View>
            </View>
            <View className={`${styles.exchangeBox} ${styles.wantBox}`}>
              <Text className={styles.exchangeLabel}>我想要</Text>
              <View className={styles.cardGrid}>
                {post.wantedIds.map((cardId) => <CardTile key={cardId} card={getCardById(cardId)} />)}
              </View>
            </View>
            <View className={styles.postFooter}>
              <View className={styles.footerSpacer} />
              <View className={styles.postActions}>
                {hasConfiguredCards && canCopyExchangeRequest(post) ? <Text className={styles.copyRequest} onClick={() => copyExchangeRequest(post)}>复制请求文案</Text> : null}
                <Text className={styles.copyUid} onClick={() => copyUid(post)}>复制 UID</Text>
              </View>
            </View>

          </View>
        ))}
        {!loading && !posts.length ? <View className={styles.emptyState}><Text>暂时还没有符合条件的交换意愿</Text><Text className={styles.emptyStateHint}>完善并发布你的圣牌资料后，会出现在这里</Text></View> : null}
        {loading ? <View className={styles.emptyState}><Text>正在加载市场资料…</Text></View> : null}
      </View>
      {!loading && (loadingMore ? <Text className={styles.loadHint}>正在加载更多市场资料…</Text> : hasMore ? <Text className={styles.loadHint}>继续下滑加载更多</Text> : <Text className={styles.loadHint}>已加载全部</Text>)}
      {filterTarget ? <View className={styles.mask} catchMove onClick={() => setFilterTarget(null)}><View className={styles.sheet} onClick={(event) => event.stopPropagation()}><View className={styles.sheetHead}><View><Text className={styles.sheetTitle}>选择{filterTarget === "owned" ? "我多余的卡" : "我想要的卡"}</Text><Text className={styles.sheetHint}>可多选，列表将匹配任意一张所选卡牌。</Text></View></View><View className={styles.pickerList}>{cardCatalog.map((card) => <CardTile key={card.id} card={card} selected={selectedFilterIds.includes(card.id)} onClick={() => toggleFilterCard(card.id)} />)}</View><Button className={styles.confirmButton} onClick={() => { const nextOwned = filterTarget === "owned" ? filterPickerIds : ownedFilterIds; const nextWanted = filterTarget === "wanted" ? filterPickerIds : wantedFilterIds; setOwnedFilterIds(nextOwned); setWantedFilterIds(nextWanted); setFilterTarget(null); loadPage(0, true, nextOwned, nextWanted); }}>完成选择</Button></View></View> : null}

    </View>
  );
}
