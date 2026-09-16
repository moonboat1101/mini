import { Button, Image, Picker, Text, View } from "@tarojs/components";
import Taro, { useReachBottom } from "@tarojs/taro";
import { useEffect, useRef, useState } from "react";
import { usePageShare } from "../../hooks/usePageShare";
import CardExchangeMine from "../CardExchangeMine";
import CardCharacterAssociation from "../CardCharacterAssociation";
import CardRarityRanking from "../CardRarityRanking";
import CardTile from "./components/CardTile";
import { cardCatalog, getCardById } from "./mockData";
import { getCardExchangeProfile } from "./profileStore";
import { CardExchangeServerFilter, CloudCardExchangeProfile, getPublishedCardExchangeProfilesPage } from "../../services/cardExchangeCloud";
import styles from "./index.module.less";
import { getMyCardExchangeProfile, hideCardExchangeProfile } from "../../services/cardExchangeCloud";

type FilterTarget = "owned" | "wanted" | null;
type MarketTab = "market" | "ranking" | "mine" | "association";
type ServerType = "official" | "bilibili" | "overseas";
type ServerFilter = CardExchangeServerFilter;
// 云函数每页最多返回 20 条展示数据；比原先 10 条少一半翻页与云函数调用。
const PAGE_SIZE = 20;
const QQ_ICON_URL = "https://img.remit.ee/i/OqgHgES9iu9a";
const WECHAT_ICON_URL = "https://img.remit.ee/api/file/CAACAgUAAyEGAASHRsPbAAEaWnJqmAq0bXTMWIsJU6g1fbFOBw3sVAAChzAAAm9BwFQjKLbCwgeSQD0E.webp";
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
  const switchTab = (tab: MarketTab) => {
    if (tab === activeTab) return;

    // 各个面板共用页面滚动容器，切换前归位以免沿用市场列表的触底位置。
    Taro.pageScrollTo({
      scrollTop: 0,
      duration: 0,
    });
    setActiveTab(tab);
  };

  return (
    <View className={styles.exchangeHub}>
      <View className={styles.panelStage} key={activeTab}>
        {activeTab === "market" ? <MarketPanel /> : null}
        {activeTab === "ranking" ? <CardRarityRanking /> : null}
        {activeTab === "mine" ? <CardExchangeMine /> : null}
        {activeTab === "association" ? <CardCharacterAssociation /> : null}
      </View>
      <View className={styles.marketActions}>
        <View className={styles.islandIndicator} style={{ transform: `translateX(${activeTab === "market" ? "0" : activeTab === "mine" ? "100%" : activeTab === "ranking" ? "200%" : "300%"})` }} />
        <Button className={`${styles.islandTab} ${activeTab === "market" ? styles.islandTabActive : ""}`} onClick={() => switchTab("market")}>交换市场</Button>
        <Button className={`${styles.islandTab} ${activeTab === "mine" ? styles.islandTabActive : ""}`} onClick={() => switchTab("mine")}>我的圣牌</Button>
        <Button className={`${styles.islandTab} ${activeTab === "ranking" ? styles.islandTabActive : ""}`} onClick={() => switchTab("ranking")}>稀有排行</Button>
        <Button className={`${styles.islandTab} ${activeTab === "association" ? styles.islandTabActive : ""}`} onClick={() => switchTab("association")}>角色关联</Button>
      </View>
    </View>
  );
}

function MarketPanel() {
  const [isAdmin, setIsAdmin] = useState(false);
  useEffect(() => {
    let cancelled = false;
    getMyCardExchangeProfile()
      .then((profile) => { if (!cancelled) setIsAdmin(profile?.isAdmin === true); })
      .catch(() => { if (!cancelled) setIsAdmin(false); });
    return () => { cancelled = true; };
  }, []);
  const hiding = useRef(false);
  const loadVersion = useRef(0);
  const [posts, setPosts] = useState<CloudCardExchangeProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [nextPage, setNextPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [ownedFilterIds, setOwnedFilterIds] = useState<string[]>(() => getCardExchangeProfile().ownedIds);
  const [wantedFilterIds, setWantedFilterIds] = useState<string[]>(() => getCardExchangeProfile().wantedIds);
  const [serverFilter, setServerFilter] = useState<ServerFilter>(() => getDefaultServerFilter(getCardExchangeProfile().uid));
  const [filterTarget, setFilterTarget] = useState<FilterTarget>(null);
  const [filterPickerIds, setFilterPickerIds] = useState<string[]>([]);
  const [noticeIndex, setNoticeIndex] = useState(0);
  const [noticeAnimating, setNoticeAnimating] = useState(false);
  const selectedFilterIds = filterPickerIds;
  const copyUid = (post: CloudCardExchangeProfile) => {
    Taro.setClipboardData({
      data: post.uid,
      success: () => Taro.showToast({ title: "已复制 UID", icon: "success" }),
    });
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
    const version = ++loadVersion.current;
    if (replace) {
      setLoading(true);
      Taro.showLoading({ title: "加载市场资料", mask: true });
    }
    else setLoadingMore(true);
    try {
      const result = await getPublishedCardExchangeProfilesPage(page, PAGE_SIZE, ownedFilters, wantedFilters, server);
      if (version !== loadVersion.current) return;
      setPosts((current) => replace ? result.profiles : [...current, ...result.profiles]);
      setNextPage(page + 1);
      setHasMore(result.hasMore);
    } catch {
      if (version !== loadVersion.current) return;
      Taro.showToast({ title: "市场数据加载失败", icon: "none" });
    } finally {
      if (version === loadVersion.current) {
        setLoading(false);
        setLoadingMore(false);
        if (replace) Taro.hideLoading();
      }
    }
  };

  const hidePost = async (post: CloudCardExchangeProfile) => {
    if (!isAdmin || !post._id || hiding.current) return;
    hiding.current = true;
    try {
      const result = await Taro.showModal({
        title: "确认隐藏",
        content: `确定隐藏 UID ${post.uid} 的交换资料吗？隐藏后将不再出现在市场中。`,
        confirmText: "确认隐藏",
      });
      if (!result.confirm) return;
      Taro.showLoading({ title: "正在隐藏", mask: true });
      await hideCardExchangeProfile(post._id);
      setPosts((current) => current.filter((item) => item._id !== post._id));
      // 隐藏会改变服务端分页偏移，从首页重载避免漏掉下一页记录。
      await loadPage(0, true);
      Taro.showToast({ title: "已隐藏", icon: "success" });
    } catch (error) {
      Taro.showToast({ title: error instanceof Error ? error.message : "隐藏失败，请重试", icon: "none" });
    } finally {
      Taro.hideLoading();
      hiding.current = false;
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
    <View className={styles.marketRoot}>
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
                    <Text className={styles.uid} onClick={() => copyUid(post)}>{post.uid}</Text>
                    <View className={styles.uidCopyButton} onClick={() => copyUid(post)} aria-label="复制 UID"><View className={styles.uidCopyIcon} /></View>
                    <Text className={`${styles.serverTag} ${styles[`server${getServerType(post.uid)}`]}`}>{SERVER_LABEL[getServerType(post.uid)]}</Text>
                    {isAdmin && post._id ? <View className={styles.hidePost} onClick={() => hidePost(post)} aria-label="隐藏"><View className={styles.hidePostIcon} /></View> : null}
                  </View>
                </View>
                {formatUpdatedAt(post.updatedAt) ? <Text className={styles.updatedTime}>更新于 {formatUpdatedAt(post.updatedAt)}</Text> : null}
              </View>

            {post.contactA || post.contactB || post.activeTime ? <View className={styles.contactBox}>
              <View className={styles.contactTitle}><View className={styles.sectionTitleStar} /><Text>基础信息</Text></View>
              {post.contactA ? <View className={styles.contactItem}><Image className={styles.qqIcon} src={QQ_ICON_URL} mode="aspectFit" /><Text>{post.contactA}</Text></View> : null}
              {post.contactB ? <View className={styles.contactItem}><Image className={styles.wechatIcon} src={WECHAT_ICON_URL} mode="aspectFit" /><Text>{post.contactB}</Text></View> : null}
              {post.activeTime ? <View className={styles.contactItem}><Text className={`${styles.contactIcon} ${styles.clockIcon}`}>⏰</Text><Text>{post.activeTime}</Text></View> : null}
            </View> : null}
            <View className={styles.exchangeBox}>
              <View className={styles.exchangeLabel}><View className={styles.sectionTitleStar} /><Text>我多余</Text></View>
              <View className={styles.cardGrid}>
                {post.ownedIds.map((cardId) => <CardTile key={cardId} card={getCardById(cardId)} />)}
              </View>
            </View>
            <View className={`${styles.exchangeBox} ${styles.wantBox}`}>
              <View className={styles.exchangeLabel}><View className={styles.sectionTitleStar} /><Text>我想要</Text></View>
              <View className={styles.cardGrid}>
                {post.wantedIds.map((cardId) => <CardTile key={cardId} card={getCardById(cardId)} />)}
              </View>
            </View>
          </View>
        ))}
        {!loading && !posts.length ? <View className={styles.emptyState}><Text>暂时还没有符合条件的交换意愿</Text><Text className={styles.emptyStateHint}>完善并发布你的圣牌资料后，会出现在这里</Text></View> : null}
        {loading ? <View className={styles.emptyState}><Text>正在加载市场资料…</Text></View> : null}
      </View>
      {!loading && (loadingMore ? <Text className={styles.loadHint}>正在加载更多市场资料…</Text> : hasMore ? <Text className={styles.loadHint}>继续下滑加载更多</Text> : <Text className={styles.loadHint}>已加载全部</Text>)}
      {filterTarget ? <View className={styles.mask} catchMove onClick={() => setFilterTarget(null)}><View className={styles.sheet} onClick={(event) => event.stopPropagation()}><View className={styles.sheetHead}><View><Text className={styles.sheetTitle}>选择{filterTarget === "owned" ? "我多余的卡" : "我想要的卡"}</Text></View></View><View className={styles.pickerList}>{cardCatalog.map((card) => <CardTile key={card.id} card={card} selected={selectedFilterIds.includes(card.id)} dimmed={!selectedFilterIds.includes(card.id)} onClick={() => toggleFilterCard(card.id)} />)}</View><Button className={styles.confirmButton} onClick={() => { const nextOwned = filterTarget === "owned" ? filterPickerIds : ownedFilterIds; const nextWanted = filterTarget === "wanted" ? filterPickerIds : wantedFilterIds; setOwnedFilterIds(nextOwned); setWantedFilterIds(nextWanted); setFilterTarget(null); loadPage(0, true, nextOwned, nextWanted); }}>完成选择</Button></View></View> : null}

    </View>
  );
}
