import { View, Text, Image } from "@tarojs/components";
import Taro from "@tarojs/taro";
import { useState } from "react";
import { usePageShare } from "../../hooks/usePageShare";
import { getThemeClassName, MoonTheme, useTheme } from "../../hooks/useTheme";

import styles from "./index.module.less";

const REPO_URL = "https://github.com/moonboat1101/moonboat-mini";
const PROFILE_SMALL = "/assets/profile_small.jpg";
const GENSHIN_ICON =
  "https://s1.aigei.com/src/img/png/5d/5d23970a2f3f450eb3c8f6884c4e0e43.png?imageMogr2/auto-orient/thumbnail/!282x282r/gravity/Center/crop/282x282/quality/85/%7CimageView2/2/w/282&e=2051020800&token=P7S2Xpzfz11vAkASLTkfHN7Fw-oOZBecqeJaxypL:HGaSXiz-p67st8GrjLKsAJG8HLo=";
const POKEMON_ICON =
  "https://s1.aigei.com/src/img/png/e6/e6f2fee753dc43bf84b0e0434069e631.png?imageMogr2/auto-orient/thumbnail/!282x282r/gravity/Center/crop/282x282/quality/85/%7CimageView2/2/w/282&e=2051020800&token=P7S2Xpzfz11vAkASLTkfHN7Fw-oOZBecqeJaxypL:oVtd8ZV69R_JJ-v236tW0fDxFh4=";
const SCRIPT_RECORD_ICON =
  "https://ts1.tc.mm.bing.net/th/id/OIP-C.66t7nMF0i-oUPJ9qVhzmfwHaHa";
const SCRIPT_RECORD_HERO =
  "https://img.remit.ee/api/file/BQACAgUAAyEGAASHRsPbAAEaEnhqkZt-maeNLw-MbRC7GTcieiemvwACMSEAAmiKkVQEP-RhE-beCz0E.png";
const GACHA_RECORD_HERO =
  "https://img.remit.ee/api/file/BQACAgUAAyEGAASHRsPbAAEaEmFqkZpV5c5ADtl8g-JBoe4aMbFrngACGiEAAmiKkVQ_BF7-Q-m-FD0E.png";
const QRCODE_ICON =
  "https://gd-hbimg.huaban.com/07c6686e680086ee3c92eb48e10df3325832fac568d-uvzROb_fw658";
const HANDOU_ICON =
  "https://img95.699pic.com/element/40146/8048.png_300.png";
const CARD_EXCHANGE_ICON =
  "https://patchwiki.biligame.com/images/ys/8/8f/13zuc1pn9n7c42kniz2woqfxhivdtbu.png";
const CARD_EXCHANGE_HERO =
  "https://patchwiki.biligame.com/images/ys/8/89/jl5xwjp6en6umgfb4cikiobjn074b9l.png";
const THEME_SWITCH_ID = "moonboat-theme-switch";
const THEME_RIPPLE_GROW_DELAY = 16;
const THEME_REVEAL_DURATION = 560;
const THEME_RIPPLE_RELEASE_DELAY =
  THEME_RIPPLE_GROW_DELAY + THEME_REVEAL_DURATION + 120;
const THEME_RIPPLE_CLEAR_DELAY = THEME_RIPPLE_RELEASE_DELAY + 120;

type ThemeRippleState = {
  active: boolean;
  released: boolean;
  oldTheme: MoonTheme;
  oldThemeClassName: string;
  theme: MoonTheme;
  themeClassName: string;
  centerX: number;
  centerY: number;
  radius: number;
};

export default function Index() {
  usePageShare({
    title: "月舟",
    path: "/pages/index/index",
  });
  const { theme, themeClassName, setTheme } = useTheme();
  const [themeRipple, setThemeRipple] = useState<ThemeRippleState | null>(null);

  const cards = [
    {
      title: "月谕圣牌",
      subtitle: "· 交换市场\n· 我的圣牌\n· 稀有度排行",
      iconImage: CARD_EXCHANGE_ICON,
      heroImage: CARD_EXCHANGE_HERO,
      url: "/pages/CardExchangeMarket/index",
    },
    {
      title: "抽卡记录",
      subtitle: "· 统计\n· 分析\n· 本地缓存",
      iconImage: GENSHIN_ICON,
      heroImage: GACHA_RECORD_HERO,
      url: "/pages/genshin/index",
    },
    {
      title: "剧本杀",
      subtitle: "· 剧本简介\n· 评分\n· 简要复盘",
      iconImage: SCRIPT_RECORD_ICON,
      backgroundImage: SCRIPT_RECORD_HERO,
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
      title: "数独",
      iconKind: "sudoku",
      url: "/pages/Sudoku/index",
    },
    {
      title: "生成二维码",
      iconImage: QRCODE_ICON,
      url: "/pages/QrCode/index",
    },
    {
      title: "关于",
      iconKind: "about",
      url: "/pages/About/index",
    },
    {
      title: "投币",
      iconKind: "coin",
      url: "/pages/Membership/index",
    },
  ];
  const primaryCards = cards.slice(0, 2);
  const wideCards = cards.slice(2, 3);
  const funCards = cards.slice(3, 6);
  const aboutCards = cards.slice(7, 9);

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

  const runThemeTransition = () => {
    if (themeRipple?.active) return;

    const nextTheme: MoonTheme = theme === "dark" ? "light" : "dark";
    const systemInfo = Taro.getSystemInfoSync();
    const fallbackX = systemInfo.windowWidth - 72;
    const fallbackY = 92;

    const startTransition = (
      centerX: number,
      centerY: number,
      initialRadius: number,
    ) => {
      const maxX = Math.max(centerX, systemInfo.windowWidth - centerX);
      const maxY = Math.max(centerY, systemInfo.windowHeight - centerY);
      const radius = Math.sqrt(maxX * maxX + maxY * maxY) + 160;

      setThemeRipple({
        active: true,
        released: false,
        oldTheme: theme,
        oldThemeClassName: getThemeClassName(theme),
        theme: nextTheme,
        themeClassName: getThemeClassName(nextTheme),
        centerX,
        centerY,
        radius: initialRadius,
      });

      setTimeout(() => {
        setThemeRipple((current) =>
          current ? { ...current, radius } : current,
        );
      }, THEME_RIPPLE_GROW_DELAY);

      setTheme(nextTheme);

      setTimeout(() => {
        setThemeRipple((current) =>
          current ? { ...current, released: true } : current,
        );
      }, THEME_RIPPLE_RELEASE_DELAY);

      setTimeout(() => {
        setThemeRipple(null);
      }, THEME_RIPPLE_CLEAR_DELAY);
    };

    Taro.createSelectorQuery()
      .select(`#${THEME_SWITCH_ID}`)
      .boundingClientRect((rect) => {
        if (rect && !Array.isArray(rect)) {
          startTransition(
            rect.left + rect.width / 2,
            rect.top + rect.height / 2,
            Math.max(rect.width, rect.height) / 2 + 10,
          );
          return;
        }

        startTransition(fallbackX, fallbackY, 88);
      })
      .exec();
  };

  const renderCard = (
    i: (typeof cards)[number],
    variant: "primary" | "wide" | "compact",
    readonly = false,
  ) => {
    const imageSrc = "iconImage" in i ? i.iconImage : "";
    const backgroundImage = "backgroundImage" in i ? i.backgroundImage : "";
    const heroImage = "heroImage" in i ? i.heroImage : imageSrc;
    const isFeatureCard = variant === "primary" || variant === "wide";

    return <View
      key={i.title}
      className={`${styles.card} ${
        variant === "primary"
          ? styles.primaryCard
          : variant === "wide"
            ? styles.wideCard
            : styles.compactCard
      } ${backgroundImage ? styles.fixedBackgroundCard : ""}`}
      onClick={readonly ? undefined : () => handleCardClick(i)}
    >
      {isFeatureCard ? <>
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
      </> : <>
      <View className={styles.cardIconWrap}>
        {"iconKind" in i && i.iconKind === "sudoku" ? (
          <View className={styles.sudokuIcon}>
            {Array.from({ length: 9 }, (_, index) => (
              <View key={index} className={styles.sudokuIconCell}>
                {index % 2 === 0 ? index + 1 : ""}
              </View>
            ))}
          </View>
        ) : "iconKind" in i && i.iconKind === "mbti" ? (
          <View className={styles.mbtiIcon}>
            <Text>MB</Text>
            <Text>TI</Text>
          </View>
        ) : "iconKind" in i && i.iconKind === "about" ? (
          <View className={styles.aboutIcon}>
            <Text>i</Text>
          </View>
        ) : (
          <Image src={imageSrc} className={styles.cardIconImage} mode="aspectFill" />
        )}
      </View>
      <Text className={styles.cardTitle}>{i.title}</Text>
      <View className={styles.cardOrnament}>
        <View className={styles.ornamentLine} />
        <View className={styles.ornamentDot} />
        <View className={styles.ornamentLine} />
      </View>
      </>}
    </View>;
  };

  const renderFunCard = (i: (typeof cards)[number], readonly = false) => {
    const imageSrc = "iconImage" in i ? i.iconImage : "";

    return <View
      key={i.title}
      className={styles.funEntry}
      onClick={readonly ? undefined : () => handleCardClick(i)}
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

  const renderAboutCard = (i: (typeof cards)[number], readonly = false) => (
    <View
      className={styles.aboutBanner}
      onClick={readonly ? undefined : () => handleCardClick(i)}
    >
      <View className={styles.aboutBannerIcon}><Text>{i.title === "投币" ? "¥" : "i"}</Text></View>
      <Text className={styles.aboutBannerTitle}>{i.title === "投币" ? "投币" : "关于"}</Text>
    </View>
  );

  const renderHomeContent = (displayTheme: MoonTheme, readonly = false) => (
    <>
      <View className={styles.header}>
        <View
          className={styles.logoButton}
          onClick={readonly ? undefined : handleLogoClick}
        >
          <Image src={PROFILE_SMALL} className={styles.avatar} />
          <View className={styles.titleGroup}>
            <Text className={styles.brandCn}>月舟</Text>
            <Text className={styles.brandEn}>moonboat</Text>
          </View>
        </View>
        <View
          id={readonly ? undefined : THEME_SWITCH_ID}
          className={styles.themeSwitch}
          onClick={readonly ? undefined : runThemeTransition}
        >
          <View
            className={`${styles.themeSwitchThumb} ${
              displayTheme === "light" ? styles.themeSwitchThumbRight : ""
            }`}
          />
          <View
            className={`${styles.themeSwitchItem} ${
              displayTheme === "dark" ? styles.themeSwitchItemActive : ""
            }`}
          >
            <Text className={styles.themeSwitchIcon}>☾</Text>
            <Text className={styles.themeSwitchText}>深</Text>
          </View>
          <View
            className={`${styles.themeSwitchItem} ${
              displayTheme === "light" ? styles.themeSwitchItemActive : ""
            }`}
          >
            <Text className={styles.themeSwitchIcon}>☀</Text>
            <Text className={styles.themeSwitchText}>浅</Text>
          </View>
        </View>
      </View>

      <View className={styles.cardSections}>
        <View className={`${styles.cardList} ${styles.primaryCardList}`}>
          {primaryCards.map((card) => renderCard(card, "primary", readonly))}
        </View>

        <View className={`${styles.cardList} ${styles.wideCardList}`}>
          {wideCards.map((card) => renderCard(card, "wide", readonly))}
        </View>

        <View className={styles.funHub}>
          <Text className={styles.funHubTitle}>轻松一刻</Text>
          <View className={styles.funEntryList}>
            {funCards.map((card) => renderFunCard(card, readonly))}
          </View>
        </View>

        <View className={styles.aboutBannerList}>
          {aboutCards.map((card) => renderAboutCard(card, readonly))}
        </View>

      </View>
    </>
  );

  const baseTheme = themeRipple && !themeRipple.released ? themeRipple.oldTheme : theme;
  const baseThemeClassName =
    themeRipple && !themeRipple.released
      ? themeRipple.oldThemeClassName
      : themeClassName;

  return (
    <>
      <View
        className={`${styles.container} ${baseThemeClassName} ${
          themeRipple ? styles.themeTransitioning : ""
        }`}
      >
        {renderHomeContent(baseTheme)}
      </View>

      {themeRipple ? (
        <View
          className={`${styles.container} ${styles.themeRevealLayer} ${themeRipple.themeClassName}`}
          style={{
            clipPath: `circle(${themeRipple.radius}px at ${themeRipple.centerX}px ${themeRipple.centerY}px)`,
          }}
        >
          {renderHomeContent(themeRipple.theme, true)}
        </View>
      ) : null}
    </>
  );
}

