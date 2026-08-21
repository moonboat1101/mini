import { Button, Text, View } from "@tarojs/components";
import Taro, { useDidShow, useReachBottom } from "@tarojs/taro";
import { useEffect, useState } from "react";
import { usePageShare } from "../../hooks/usePageShare";
import { useTheme } from "../../hooks/useTheme";
import CardTile from "./components/CardTile";
import { cardCatalog, getCardById } from "./mockData";
import { getCardExchangeProfile } from "./profileStore";
import { CloudCardExchangeProfile, getPublishedCardExchangeProfiles } from "../../services/cardExchangeCloud";
import styles from "./index.module.less";

type FilterTarget = "owned" | "wanted" | null;
const PAGE_SIZE = 10;
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
    text: "建议配置我的圣牌，可以自动回填筛选，不用每次手动填。",
    variant: "friendly",
  },
] as const;

export default function CardExchangeMarket() {
  const [posts, setPosts] = useState<CloudCardExchangeProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [ownedFilterIds, setOwnedFilterIds] = useState<string[]>(() => getCardExchangeProfile().ownedIds);
  const [wantedFilterIds, setWantedFilterIds] = useState<string[]>(() => getCardExchangeProfile().wantedIds);
  const [filterTarget, setFilterTarget] = useState<FilterTarget>(null);
  const [filterPickerIds, setFilterPickerIds] = useState<string[]>([]);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [noticeIndex, setNoticeIndex] = useState(0);
  const [noticeAnimating, setNoticeAnimating] = useState(false);
  const { themeClassName } = useTheme();
  const selectedFilterIds = filterPickerIds;
  const toggleFilterCard = (id: string) => {
    const update = (ids: string[]) => ids.includes(id) ? ids.filter((item) => item !== id) : [...ids, id];
    setFilterPickerIds(update);
  };
  const openFilterPicker = (target: Exclude<FilterTarget, null>) => {
    setFilterPickerIds([...(target === "owned" ? ownedFilterIds : wantedFilterIds)]);
    setFilterTarget(target);
  };
  const confirmFilterPicker = () => {
    if (filterTarget === "owned") setOwnedFilterIds(filterPickerIds);
    if (filterTarget === "wanted") setWantedFilterIds(filterPickerIds);
    setFilterTarget(null);
  };
  const filteredPosts = posts.filter((post) =>
    (!ownedFilterIds.length || post.wantedIds.some((id) => ownedFilterIds.includes(id)))
    && (!wantedFilterIds.length || post.ownedIds.some((id) => wantedFilterIds.includes(id))),
  );
  const visiblePosts = filteredPosts.slice(0, visibleCount);

  useEffect(() => {
    const timer = setTimeout(() => setNoticeAnimating(true), 3000);
    return () => clearTimeout(timer);
  }, [noticeIndex]);

  const completeNoticeTransition = () => {
    if (!noticeAnimating) return;
    setNoticeIndex((index) => (index + 1) % MARKET_NOTICES.length);
    setNoticeAnimating(false);
  };

  useDidShow(() => {
    const profile = getCardExchangeProfile();
    setOwnedFilterIds(profile.ownedIds);
    setWantedFilterIds(profile.wantedIds);
    setVisibleCount(PAGE_SIZE);
    setLoading(true);
    getPublishedCardExchangeProfiles().then(setPosts).catch(() => {
      Taro.showToast({ title: "市场数据加载失败", icon: "none" });
    }).finally(() => setLoading(false));
  });

  useReachBottom(() => {
    setVisibleCount((count) => Math.min(count + PAGE_SIZE, filteredPosts.length));
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

      <Text className={styles.filterIntro}>填写信息自动匹配：</Text>
      <View className={styles.filterBar}>
        <Button className={styles.filterButton} onClick={() => openFilterPicker("owned")}>我多余 / 他想要{ownedFilterIds.length ? <Text className={styles.filterCount}>{ownedFilterIds.length}</Text> : null}</Button>
        <Button className={styles.filterButton} onClick={() => openFilterPicker("wanted")}>我想要 / 他多余{wantedFilterIds.length ? <Text className={styles.filterCount}>{wantedFilterIds.length}</Text> : null}</Button>
        <Button className={styles.resetButton} onClick={() => { setOwnedFilterIds([]); setWantedFilterIds([]); setVisibleCount(PAGE_SIZE); }}>重置</Button>
      </View>

      <View className={styles.postList}>
        {visiblePosts.map((post) => (
          <View className={styles.postCard} key={post.id}>
            <View className={styles.postMeta}>
              <View className={styles.userInfo}>
                <View className={styles.nameRow}>
                  <Text className={styles.nickname}>{post.name || "旅行者"}</Text>
                  <Text className={styles.uid}>{post.uid}</Text>
                  <Text className={styles.activeTime}>{post.activeTime}</Text>
                </View>
              </View>
            </View>

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

          </View>
        ))}
        {!loading && !filteredPosts.length ? <View className={styles.emptyState}><Text>暂时还没有符合条件的交换意愿</Text><Text className={styles.emptyStateHint}>完善并发布你的圣牌资料后，会出现在这里</Text></View> : null}
        {loading ? <View className={styles.emptyState}><Text>正在加载市场资料…</Text></View> : null}
      </View>
      {filteredPosts.length > PAGE_SIZE ? <Text className={styles.loadHint}>{visiblePosts.length < filteredPosts.length ? "继续下滑加载更多" : "已加载全部"}</Text> : null}
      <Button className={styles.myButton} onClick={() => Taro.navigateTo({ url: "/pages/CardExchangeMine/index" })}>我的圣牌</Button>

      {filterTarget ? <View className={styles.mask} catchMove onClick={() => setFilterTarget(null)}><View className={styles.sheet} onClick={(event) => event.stopPropagation()}><View className={styles.sheetHead}><View><Text className={styles.sheetTitle}>选择{filterTarget === "owned" ? "我多余的卡" : "我想要的卡"}</Text><Text className={styles.sheetHint}>可多选，列表将匹配任意一张所选卡牌。</Text></View></View><View className={styles.pickerList}>{cardCatalog.map((card) => <CardTile key={card.id} card={card} selected={selectedFilterIds.includes(card.id)} onClick={() => toggleFilterCard(card.id)} />)}</View><Button className={styles.confirmButton} onClick={() => { confirmFilterPicker(); setVisibleCount(PAGE_SIZE); }}>完成选择</Button></View></View> : null}

    </View>
  );
}
