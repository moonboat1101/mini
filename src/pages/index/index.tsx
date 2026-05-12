import { View, Text, Image } from "@tarojs/components";
import Taro from "@tarojs/taro";
import profileSmall from "../../../assets/profile_small.jpg";
import { usePageShare } from "../../hooks/usePageShare";

import styles from "./index.module.less";

const CONTACT_EMAIL = "1025196468@qq.com";
const GENSHIN_ICON =
  "https://s1.aigei.com/src/img/png/5d/5d23970a2f3f450eb3c8f6884c4e0e43.png?imageMogr2/auto-orient/thumbnail/!282x282r/gravity/Center/crop/282x282/quality/85/%7CimageView2/2/w/282&e=2051020800&token=P7S2Xpzfz11vAkASLTkfHN7Fw-oOZBecqeJaxypL:HGaSXiz-p67st8GrjLKsAJG8HLo=";
const WISH_ICON =
  "https://bkimg.cdn.bcebos.com/pic/6c224f4a20a4462309f708ab127a650e0cf3d6ca79fb?x-bce-process=image/format,f_auto/quality,Q_70/resize,m_lfit,limit_1,w_536";
const POKEMON_ICON =
  "https://s1.aigei.com/src/img/png/e6/e6f2fee753dc43bf84b0e0434069e631.png?imageMogr2/auto-orient/thumbnail/!282x282r/gravity/Center/crop/282x282/quality/85/%7CimageView2/2/w/282&e=2051020800&token=P7S2Xpzfz11vAkASLTkfHN7Fw-oOZBecqeJaxypL:oVtd8ZV69R_JJ-v236tW0fDxFh4=";
const SCRIPT_RECORD_ICON =
  "https://bpic.588ku.com/element_pic/21/12/04/5abdb4cd5f5ba19679a3e393881eef60.jpg!/fh/350/unsharp/true/format/png";
const CONTACT_ICON =
  "https://s1.aigei.com/src/img/png/e6/e6e99018e7f44779a836f29770468694.png?imageMogr2/auto-orient/thumbnail/!282x282r/gravity/Center/crop/282x282/quality/85/%7CimageView2/2/w/282&e=2051020800&token=P7S2Xpzfz11vAkASLTkfHN7Fw-oOZBecqeJaxypL:RXCYi5fMmGzJgIOWYPKpE3OcfTg=";
const TURTLE_SOUP_ICON =
  "https://bpic.588ku.com/element_pic/24/01/23/ebfb1bca94914b0793dc15de0b9ab1c3.png!/fh/350/unsharp/true/format/png";
const QRCODE_ICON =
  "https://gd-hbimg.huaban.com/07c6686e680086ee3c92eb48e10df3325832fac568d-uvzROb_fw658";
const HANDOU_ICON =
  "https://img95.699pic.com/element/40146/8048.png_300.png";

export default function Index() {
  usePageShare({
    title: "月舟",
    path: "/pages/index/index",
  });

  const cards = [
    {
      title: "原神抽卡记录",
      iconImage: GENSHIN_ICON,
      url: "/pages/genshin/index",
    },
    {
      title: "剧本杀记录",
      iconImage: SCRIPT_RECORD_ICON,
      url: "/pages/ScriptRecord/index",
    },
    {
      title: "汉兜",
      iconImage: HANDOU_ICON,
      url: "/pages/HanDou/index",
    },
    {
      title: "猜宝可梦",
      iconImage: POKEMON_ICON,
      url: "/pages/Pokemon/index",
    },
    {
      title: "生成二维码",
      iconImage: QRCODE_ICON,
      url: "/pages/QrCode/index",
    },
    {
      title: "海龟汤",
      iconImage: TURTLE_SOUP_ICON,
      url: "/pages/TurtleSoup/index",
    },
    {
      title: "米池模拟器",
      iconImage: WISH_ICON,
      url: "/pages/Wish/index",
    },
    {
      title: "联系作者",
      iconImage: CONTACT_ICON,
      email: CONTACT_EMAIL,
    },
  ];
  const primaryCards = cards.slice(0, 2);
  const secondaryCards = cards.slice(2);

  const handleCardClick = (i: (typeof cards)[number]) => {
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
  };

  const renderCard = (i: (typeof cards)[number]) => (
    <View key={i.title} className={styles.card} onClick={() => handleCardClick(i)}>
      <View className={styles.cardIconWrap}>
        <Image src={i.iconImage} className={styles.cardIconImage} />
      </View>
      <Text className={styles.cardTitle}>{i.title}</Text>
      <View className={styles.cardOrnament}>
        <View className={styles.ornamentLine} />
        <View className={styles.ornamentDot} />
        <View className={styles.ornamentLine} />
      </View>
    </View>
  );

  return (
    <View className={styles.container}>
      <View className={styles.header}>
        <Image src={profileSmall} className={styles.avatar} />
        <View className={styles.titleGroup}>
          <Text className={styles.brandCn}>月舟</Text>
          <Text className={styles.brandEn}>moonboat</Text>
        </View>
      </View>

      <View className={styles.cardSections}>
        <View className={`${styles.cardList} ${styles.primaryCardList}`}>
          {primaryCards.map(renderCard)}
        </View>

        <View className={`${styles.cardList} ${styles.secondaryCardList}`}>
          {secondaryCards.map(renderCard)}
        </View>
      </View>

      <View className={styles.footerSlogan}>
        <Text className={styles.footerMoon}>☾</Text>
        <Text className={styles.footerText}>月光所至 · 梦想起航</Text>
        <Text className={styles.footerMoon}>☽</Text>
      </View>
    </View>
  );
}

