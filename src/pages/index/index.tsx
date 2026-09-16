import { View, Text, Image } from "@tarojs/components";
import Taro from "@tarojs/taro";
import { usePageShare } from "../../hooks/usePageShare";
import pokeballIcon from "../../assets/icons/pokeball.svg";

import styles from "./index.module.less";

const REPO_URL = "https://github.com/moonboat1101/moonboat-mini";
const PROFILE_SMALL = "/assets/profile_small.jpg";
const SCRIPT_RECORD_HERO =
  "https://img.remit.ee/api/file/BQACAgUAAyEGAASHRsPbAAEaEnhqkZt-maeNLw-MbRC7GTcieiemvwACMSEAAmiKkVQEP-RhE-beCz0E.png";
const GACHA_RECORD_HERO = "https://img.remit.ee/i/VLKwKe6kgCCD";
const CARD_EXCHANGE_HERO = "https://img.remit.ee/i/Nwt54gYGpSao";
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
      icon: "\ue604",
      url: "/pages/HanDou/index",
    },
    {
      title: "宝可梦",
      iconImage: pokeballIcon,
      url: "/pages/Pokemon/index",
    },
    {
      title: "数独",
      icon: "\ue648",
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
    const icon = "icon" in i ? i.icon : "";
    const iconImage = "iconImage" in i ? i.iconImage : "";

    return <View
      key={i.title}
      className={styles.funEntry}
      onClick={() => handleCardClick(i)}
    >
      <View className={styles.funIconWrap}>
        {iconImage ? <Image className={styles.funIconImage} src={iconImage} mode="aspectFit" /> : <Text className={`iconfont ${styles.funIcon} ${i.title === "汉兜" ? styles.funHandouIcon : ""}`}>{icon}</Text>}
      </View>
      <View className={styles.funEntryCopy}>
        <Text className={styles.funEntryTitle}>{i.title}</Text>
        <View className={styles.funEntryArrow} />
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
