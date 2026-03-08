import { View, Text, Image } from "@tarojs/components";
import Taro from "@tarojs/taro";

import styles from "./index.module.less";

export default function Index() {
  const cards = [
    {
      title: "原神抽卡记录",
      url: "/pages/Genshin/index",
      iconUrl:
        "https://ts1.tc.mm.bing.net/th/id/ODF.9_NtgMCMkLHY0oSbrk3suQ?w=32&h=32&qlt=90&pcl=fffffa&o=6&pid=1.2",
    },
    {
      title: "米池模拟器",
      url: "/pages/Wish/index",
    },
    {
      title: "猜宝可梦",
      url: "/pages/Pokemon/index",
      iconUrl:
        "https://ts4.tc.mm.bing.net/th/id/ODF.F0DFeprkTu3W_IwphaBusw?w=32&h=32&qlt=90&pcl=fffffa&o=6&pid=1.2",
    },
    {
      title: "海龟汤",
      url: "/pages/TurtleSoup/index",
    },
    {
      title: "剧本杀记录",
      url: "/pages/ScriptRecord/index",
    },
  ];

  return (
    <View className={styles.container}>
      <View className={styles.cardList}>
        {cards.map((i) => (
          <View
            className={styles.card}
            onClick={() => {
              Taro.navigateTo({
                url: i.url,
              });
            }}
          >
            {i?.iconUrl && (
              <Image src={i?.iconUrl} className={styles.cardIcon} />
            )}
            <Text>{i.title}</Text>
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
