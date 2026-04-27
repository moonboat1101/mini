import { View, Text, Image } from "@tarojs/components";
import Taro from "@tarojs/taro";
import profileSmall from "../../../assets/profile_small.jpg";

import styles from "./index.module.less";

const CONTACT_EMAIL = "1025196468@qq.com";

export default function Index() {
  const cards = [
    {
      title: "原神抽卡记录",
      icon: "祈",
      url: "/pages/Genshin/index",
    },
    {
      title: "米池模拟器",
      icon: "抽",
      url: "/pages/Wish/index",
    },
    {
      title: "剧本杀记录",
      icon: "剧",
      url: "/pages/ScriptRecord/index",
    },
    {
      title: "猜宝可梦",
      icon: "宝",
      url: "/pages/Pokemon/index",
    },
    {
      title: "海龟汤",
      icon: "汤",
      url: "/pages/TurtleSoup/index",
    },
    {
      title: "联系作者",
      icon: "邮",
      email: CONTACT_EMAIL,
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
              if ("email" in i) {
                Taro.setClipboardData({
                  data: i.email,
                  success: () => {
                    Taro.showToast({
                      title: "已复制邮箱",
                      icon: "success",
                    });
                  },
                });
                return;
              }

              Taro.navigateTo({
                url: i.url,
              });
            }}
          >
            <View className={styles.cardIconWrap}>
              <Text className={styles.cardIcon}>{i.icon}</Text>
            </View>
            <Text className={styles.cardTitle}>{i.title}</Text>
            <View className={styles.cardArrowWrap}>
              <Text className={styles.cardArrow}>›</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}
