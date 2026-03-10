import { View, Text, Image } from "@tarojs/components";
import Taro from "@tarojs/taro";
import profileSmall from "../../../assets/profile_small.jpg";

import styles from "./index.module.less";

export default function Index() {
  const cards = [
    {
      title: "原神抽卡记录",
      url: "/pages/Genshin/index",
    },
    {
      title: "米池模拟器",
      url: "/pages/Wish/index",
    },
    {
      title: "剧本杀记录",
      url: "/pages/ScriptRecord/index",
    },
    {
      title: "猜宝可梦",
      url: "/pages/Pokemon/index",
    },
    {
      title: "海龟汤",
      url: "/pages/TurtleSoup/index",
    },
  ];

  return (
    <View className={styles.container}>
      <View className={styles.header}>
        <Image src={profileSmall} className={styles.avatar} />
        <View className={styles.titleGroup}>
          <Text className={styles.brandCn}>月舟</Text>
          <Text className={styles.brandEn}>moonboat</Text>
        </View>
      </View>

      <View className={styles.cardList}>
        {cards.map((i) => (
          <View
            key={i.url}
            className={styles.card}
            onClick={() => {
              Taro.navigateTo({
                url: i.url,
              });
            }}
          >
            <Text className={styles.cardTitle}>{i.title}</Text>
            <Text className={styles.cardArrow}>›</Text>
          </View>
        ))}
      </View>

      <View className={styles.footer}>
        <View className={styles.divider} />
        <Text className={styles.contactText}>联系作者： 1025196468@qq.com</Text>
      </View>
    </View>
  );
}
