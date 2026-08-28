import { Image, Text, View } from "@tarojs/components";
import { useEffect, useState } from "react";
import { getCardRarityRanking } from "../../services/cardExchangeCloud";
import { useTheme } from "../../hooks/useTheme";
import { cardCatalog } from "../CardExchangeMarket/mockData";
import { getCardExchangeProfile } from "../CardExchangeMarket/profileStore";
import styles from "./index.module.less";

type RankedCard = (typeof cardCatalog)[number] & { score: number };

export default function CardRarityRanking() {
  const [cards, setCards] = useState<RankedCard[]>([]);
  const [totalProfiles, setTotalProfiles] = useState(0);
  const [loading, setLoading] = useState(true);
  const [wantedCardIds, setWantedCardIds] = useState<string[]>(() => getCardExchangeProfile().wantedIds);
  const [noticeIndex, setNoticeIndex] = useState(0);
  const [noticeAnimating, setNoticeAnimating] = useState(false);
  const { themeClassName } = useTheme();

  useEffect(() => {
    const timer = setTimeout(() => setNoticeAnimating(true), 3000);
    return () => clearTimeout(timer);
  }, [noticeIndex]);

  const completeNoticeTransition = () => {
    if (!noticeAnimating) return;
    setNoticeIndex((index) => (index + 1) % 2);
    setNoticeAnimating(false);
  };

  useEffect(() => {
    let cancelled = false;
    setWantedCardIds(getCardExchangeProfile().wantedIds);
    setLoading(true);
    getCardRarityRanking()
      .then(({ totalProfiles: total, scores }) => {
        if (cancelled) return;
        setTotalProfiles(total);
        setCards(cardCatalog
          .map((card) => ({ ...card, score: scores[card.id] || 0 }))
          .sort((a, b) => a.score - b.score || a.name.localeCompare(b.name, "zh-CN")));
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  return (
    <View className={`${styles.rankingRoot} ${themeClassName}`}>
      <View className={styles.noticeViewport}>
        <View className={`${styles.noticeTrack} ${noticeAnimating ? styles.noticeTrackAnimating : ""}`} onTransitionEnd={completeNoticeTransition}>
          {[noticeIndex, (noticeIndex + 1) % 2].map((index) => (
            <View className={styles.notice} key={index}>
              <Text className={styles.noticeIcon}>{index === 0 ? "✦" : "◌"}</Text>
              <Text className={styles.noticeText}>{index === 0 ? "数字越小越稀有：有人想要 -1；有人多余 +1。" : `统计样本：${totalProfiles} 位市场发布者，实时更新`}</Text>
            </View>
          ))}
        </View>
      </View>

      {loading ? <View className={styles.state}>正在统计市场数据…</View> : <View className={styles.rankingList}>
        {cards.map((card, index) => (
          <View className={styles.rankCard} key={card.id}>
            <View className={`${styles.rank} ${index < 3 ? styles[`top${index + 1}`] : ""}`}>{index + 1}</View>
            <Image className={styles.cardArtwork} src={card.image} mode="aspectFill" />
            <View className={styles.cardInfo}>
              <Text className={styles.cardName}>{card.name}</Text>
            </View>
            {wantedCardIds.length > 0 && !wantedCardIds.includes(card.id) ? <Text className={styles.ownedMark}>✓</Text> : null}
            <View className={styles.rarityValue}>
              <Text className={styles.rarityNumber}>{card.score > 0 ? `+${card.score}` : card.score}</Text>
            </View>
          </View>
        ))}
      </View>}
    </View>
  );
}
