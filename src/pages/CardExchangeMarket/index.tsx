import { Button, Text, View } from "@tarojs/components";
import Taro, { useDidShow, useReachBottom } from "@tarojs/taro";
import { useState } from "react";
import { usePageShare } from "../../hooks/usePageShare";
import CardTile from "./components/CardTile";
import { cardCatalog, exchangePosts, getCardById } from "./mockData";
import { getCardExchangeProfile } from "./profileStore";
import styles from "./index.module.less";

type FilterTarget = "owned" | "wanted" | null;
const PAGE_SIZE = 10;

export default function CardExchangeMarket() {
  const [ownedFilterIds, setOwnedFilterIds] = useState<string[]>(() => getCardExchangeProfile().ownedIds);
  const [wantedFilterIds, setWantedFilterIds] = useState<string[]>(() => getCardExchangeProfile().wantedIds);
  const [filterTarget, setFilterTarget] = useState<FilterTarget>(null);
  const [filterPickerIds, setFilterPickerIds] = useState<string[]>([]);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
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
  const filteredPosts = exchangePosts.filter((post) =>
    (!ownedFilterIds.length || post.wantCardIds.some((id) => ownedFilterIds.includes(id)))
    && (!wantedFilterIds.length || post.offerCardIds.some((id) => wantedFilterIds.includes(id))),
  );
  const visiblePosts = filteredPosts.slice(0, visibleCount);

  useDidShow(() => {
    const profile = getCardExchangeProfile();
    setOwnedFilterIds(profile.ownedIds);
    setWantedFilterIds(profile.wantedIds);
    setVisibleCount(PAGE_SIZE);
  });

  useReachBottom(() => {
    setVisibleCount((count) => Math.min(count + PAGE_SIZE, filteredPosts.length));
  });

  usePageShare({ title: "圣牌市场", path: "/pages/CardExchangeMarket/index" });

  return (
    <View className={styles.marketRoot}>
      <View className={styles.notice}>
        <Text className={styles.noticeIcon}>✦</Text>
        <Text>友好换卡，双方加游戏好友自行协商，完成后及时下架。</Text>
      </View>
      <View className={styles.safetyNotice}>
        <Text className={styles.safetyIcon}>!</Text>
        <Text>谨防诈骗！换牌不需要提供账密！</Text>
      </View>

      <Text className={styles.filterIntro}>填写信息自动匹配：</Text>
      <View className={styles.filterBar}>
        <Button className={styles.filterButton} onClick={() => openFilterPicker("owned")}>我多余{ownedFilterIds.length ? <Text className={styles.filterCount}>{ownedFilterIds.length}</Text> : null}</Button>
        <Button className={styles.filterButton} onClick={() => openFilterPicker("wanted")}>我想要{wantedFilterIds.length ? <Text className={styles.filterCount}>{wantedFilterIds.length}</Text> : null}</Button>
        <Button className={styles.resetButton} onClick={() => { setOwnedFilterIds([]); setWantedFilterIds([]); setVisibleCount(PAGE_SIZE); }}>重置</Button>
      </View>

      <View className={styles.postList}>
        {visiblePosts.map((post) => (
          <View className={styles.postCard} key={post.id}>
            <View className={styles.postMeta}>
              <View className={styles.userInfo}>
                <View className={styles.nameRow}>
                  <Text className={styles.nickname}>{post.nickname}</Text>
                  <Text className={styles.uid}>{post.uid}</Text>
                  <Text className={styles.activeTime}>{post.activeTime}</Text>
                </View>
              </View>
            </View>

            <View className={styles.exchangeBox}>
              <Text className={styles.exchangeLabel}>我多余</Text>
              <View className={styles.cardGrid}>
                {post.offerCardIds.map((cardId) => <CardTile key={cardId} card={getCardById(cardId)} />)}
              </View>
            </View>
            <View className={`${styles.exchangeBox} ${styles.wantBox}`}>
              <Text className={styles.exchangeLabel}>我想要</Text>
              <View className={styles.cardGrid}>
                {post.wantCardIds.map((cardId) => <CardTile key={cardId} card={getCardById(cardId)} />)}
              </View>
            </View>

          </View>
        ))}
        {!filteredPosts.length ? <View className={styles.emptyState}><Text>暂时还没有圣牌交换意愿</Text><Text className={styles.emptyStateHint}>完善并发布你的圣牌资料后，会出现在这里。</Text></View> : null}
      </View>
      {filteredPosts.length > PAGE_SIZE ? <Text className={styles.loadHint}>{visiblePosts.length < filteredPosts.length ? "继续下滑加载更多" : "已加载全部"}</Text> : null}
      <Button className={styles.myButton} onClick={() => Taro.navigateTo({ url: "/pages/CardExchangeMine/index" })}>我的圣牌</Button>

      {filterTarget ? <View className={styles.mask} catchMove onClick={() => setFilterTarget(null)}><View className={styles.sheet} onClick={(event) => event.stopPropagation()}><View className={styles.sheetHead}><View><Text className={styles.sheetTitle}>选择{filterTarget === "owned" ? "我多余的卡" : "我想要的卡"}</Text><Text className={styles.sheetHint}>可多选，列表将匹配任意一张所选卡牌。</Text></View></View><View className={styles.pickerList}>{cardCatalog.map((card) => <CardTile key={card.id} card={card} selected={selectedFilterIds.includes(card.id)} onClick={() => toggleFilterCard(card.id)} />)}</View><Button className={styles.confirmButton} onClick={() => { confirmFilterPicker(); setVisibleCount(PAGE_SIZE); }}>完成选择</Button></View></View> : null}

    </View>
  );
}
