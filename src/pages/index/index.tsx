import { View, Text, Image } from "@tarojs/components";
import Taro from "@tarojs/taro";
import { usePageShare } from "../../hooks/usePageShare";

import styles from "./index.module.less";

const REPO_URL = "https://github.com/moonboat1101/moonboat-mini";
const PROFILE_SMALL = "/assets/profile_small.jpg";
const POKEMON_ICON =
  "https://s1.aigei.com/src/img/png/e6/e6f2fee753dc43bf84b0e0434069e631.png?imageMogr2/auto-orient/thumbnail/!282x282r/gravity/Center/crop/282x282/quality/85/%7CimageView2/2/w/282&e=2051020800&token=P7S2Xpzfz11vAkASLTkfHN7Fw-oOZBecqeJaxypL:oVtd8ZV69R_JJ-v236tW0fDxFh4=";
const SCRIPT_RECORD_HERO =
  "https://img.remit.ee/api/file/BQACAgUAAyEGAASHRsPbAAEaEnhqkZt-maeNLw-MbRC7GTcieiemvwACMSEAAmiKkVQEP-RhE-beCz0E.png";
const GACHA_RECORD_HERO =
  "https://img.remit.ee/api/file/BQACAgUAAyEGAASHRsPbAAEaEmFqkZpV5c5ADtl8g-JBoe4aMbFrngACGiEAAmiKkVQ_BF7-Q-m-FD0E.png";
const HANDOU_ICON =
  "https://img95.699pic.com/element/40146/8048.png_300.png";
const CARD_EXCHANGE_HERO =
  "https://patchwiki.biligame.com/images/ys/8/89/jl5xwjp6en6umgfb4cikiobjn074b9l.png";
export default function Index() {
  usePageShare({
    title: "月舟",
    path: "/pages/index/index",
  });
  const cards = [
    {
      title: "月谕圣牌",
      subtitle: "· 交换市场\n· 稀有度排行\n· 角色关联",
      heroImage: CARD_EXCHANGE_HERO,
      url: "/pages/CardExchangeMarket/index",
    },
    {
      title: "抽卡记录",
      subtitle: "· 统计\n· 分析\n· 本地缓存",
      heroImage: GACHA_RECORD_HERO,
      url: "/pages/genshin/index",
    },
    {
      title: "剧本杀",
      subtitle: "· 剧本简介\n· 评分\n· 简要复盘",
      backgroundImage: SCRIPT_RECORD_HERO,
      url: "/pages/ScriptRecord/index",
    },
    {
      title: "汉兜",
      iconImage: HANDOU_ICON,
      url: "/pages/HanDou/index",
    },
    {
      title: "宝可梦",
      iconImage: POKEMON_ICON,
      url: "/pages/Pokemon/index",
    },
    {
      title: "数独",
      iconKind: "sudoku",
      url: "/pages/Sudoku/index",
    },
    {
      title: "生成二维码",
      url: "/pages/QrCode/index",
    },
    {
      title: "关于",
      url: "/pages/About/index",
    },
  ];
  const primaryCards = cards.slice(0, 2);
  const wideCards = cards.slice(2, 3);
  const funCards = cards.slice(3, 6);
  const aboutCard = cards[7];

  const handleCardClick = (i: (typeof cards)[number]) => {
    Taro.navigateTo({
      url: i.url,
    });
  };

  const handleLogoClick = () => {
    Taro.setClipboardData({
      data: REPO_URL,
      success: () => {
        Taro.showToast({
          title: "已复制 GitHub 链接",
          icon: "success",
        });
      },
    });
  };

  const renderCard = (
    i: (typeof cards)[number],
    variant: "primary" | "wide",
  ) => {
    const backgroundImage = "backgroundImage" in i ? i.backgroundImage : "";
    const heroImage = "heroImage" in i ? i.heroImage : "";
    return <View
      key={i.title}
      className={`${styles.card} ${
        variant === "primary"
          ? styles.primaryCard
          : styles.wideCard
      } ${backgroundImage ? styles.fixedBackgroundCard : ""}`}
      onClick={() => handleCardClick(i)}
    >
      <>
        {backgroundImage ? <>
          <Image className={styles.featureBackground} src={backgroundImage} mode="aspectFill" />
          <View className={styles.featureBackdrop} />
        </> : <Image
          className={`${styles.featureArtwork} ${i.title === "抽卡记录" ? styles.gachaFeatureArtwork : ""} ${i.title === "月谕圣牌" ? styles.cardExchangeFeatureArtwork : ""}`}
          src={heroImage}
          mode={variant === "primary" ? "aspectFit" : "aspectFill"}
        />}
        <View className={styles.featureCopy}>
          <Text className={styles.cardTitle}>{i.title}</Text>
          <Text className={styles.featureHint}>{"subtitle" in i ? i.subtitle : ""}</Text>
        </View>
      </>
    </View>;
  };

  const renderFunCard = (i: (typeof cards)[number]) => {
    const imageSrc = "iconImage" in i ? i.iconImage : "";

    return <View
      key={i.title}
      className={styles.funEntry}
      onClick={() => handleCardClick(i)}
    >
      <View className={styles.funIconWrap}>
        {"iconKind" in i && i.iconKind === "sudoku" ? (
          <View className={styles.funSudokuIcon}>
            {Array.from({ length: 9 }, (_, index) => (
              <View key={index} className={styles.funSudokuCell}>
                {index % 2 === 0 ? index + 1 : ""}
              </View>
            ))}
          </View>
        ) : <Image src={imageSrc} className={styles.funIconImage} mode="aspectFill" />}
      </View>
      <View className={styles.funEntryCopy}>
        <Text className={styles.funEntryTitle}>{i.title}</Text>
        <Text className={styles.funEntryArrow}>→</Text>
      </View>
    </View>;
  };

  const renderAboutCard = (i: (typeof cards)[number]) => (
    <View
      className={styles.aboutBanner}
      onClick={() => handleCardClick(i)}
    >
      <View className={styles.aboutBannerIcon}><Text>i</Text></View>
      <Text className={styles.aboutBannerTitle}>关于</Text>
    </View>
  );

  const renderHomeContent = () => (
    <>
      <View className={styles.header}>
        <View
          className={styles.logoButton}
          onClick={handleLogoClick}
        >
          <Image src={PROFILE_SMALL} className={styles.avatar} />
          <View className={styles.titleGroup}>
            <Text className={styles.brandCn}>月舟</Text>
            <Text className={styles.brandEn}>moonboat</Text>
          </View>
        </View>
      </View>

      <View className={styles.cardSections}>
        <View className={`${styles.cardList} ${styles.primaryCardList}`}>
          {primaryCards.map((card) => renderCard(card, "primary"))}
        </View>

        <View className={`${styles.cardList} ${styles.wideCardList}`}>
          {wideCards.map((card) => renderCard(card, "wide"))}
        </View>

        <View className={styles.funHub}>
          <Text className={styles.funHubTitle}>轻松一刻</Text>
          <View className={styles.funEntryList}>
            {funCards.map((card) => renderFunCard(card))}
          </View>
        </View>

        {renderAboutCard(aboutCard)}

      </View>
    </>
  );

  return (
    <View className={styles.container}>
      {renderHomeContent()}
    </View>
  );
}
