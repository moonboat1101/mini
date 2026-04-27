import { View, Text, Image, Icon } from "@tarojs/components";
import Taro from "@tarojs/taro";
import profileSmall from "../../../assets/profile_small.jpg";

import styles from "./index.module.less";

const CONTACT_EMAIL = "1025196468@qq.com";
const GENSHIN_ICON =
  "https://ts1.tc.mm.bing.net/th/id/ODF.9_NtgMCMkLHY0oSbrk3suQ?w=32&h=32&qlt=90&pcl=fffffc&o=6&pid=1.2";
const WISH_ICON =
  "https://www.sj51.net/wp-content/uploads/2024/01/2024011209004216.png";
const POKEMON_ICON =
  "https://www.sj51.net/wp-content/uploads/2023/09/2023090316465875.png";
const SCRIPT_RECORD_ICON =
  "https://bpic.588ku.com/element_pic/21/12/04/5abdb4cd5f5ba19679a3e393881eef60.jpg!/fh/350/unsharp/true/format/png";
const CONTACT_ICON =
  "https://bpic.588ku.com/element_origin_min_pic/19/06/18/5ada39c959c27ed3b5fee2d177c30648.jpg";
const TURTLE_SOUP_ICON =
  "https://bpic.588ku.com/element_pic/24/01/23/ebfb1bca94914b0793dc15de0b9ab1c3.png!/fh/350/unsharp/true/format/png";

export default function Index() {
  const cards = [
    {
      title: "原神抽卡记录",
      iconImage: GENSHIN_ICON,
      url: "/pages/Genshin/index",
    },
    {
      title: "米池模拟器",
      iconImage: WISH_ICON,
      url: "/pages/Wish/index",
    },
    {
      title: "剧本杀记录",
      iconImage: SCRIPT_RECORD_ICON,
      url: "/pages/ScriptRecord/index",
    },
    {
      title: "猜宝可梦",
      iconImage: POKEMON_ICON,
      url: "/pages/Pokemon/index",
    },
    {
      title: "海龟汤",
      iconImage: TURTLE_SOUP_ICON,
      url: "/pages/TurtleSoup/index",
    },
    {
      title: "联系作者",
      iconImage: CONTACT_ICON,
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
            key={i.title}
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
              {"iconImage" in i ? (
                <Image src={i.iconImage} className={styles.cardIconImage} />
              ) : (
                <Icon type={i.icon} size={30} color="#231a14" />
              )}
            </View>
            <Text className={styles.cardTitle}>{i.title}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}
