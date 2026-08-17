import { View, Text, Image } from "@tarojs/components";
import Taro from "@tarojs/taro";
import { useState } from "react";
import profileSmall from "../../../assets/profile_small.jpg";
import { usePageShare } from "../../hooks/usePageShare";
import { getThemeClassName, MoonTheme, useTheme } from "../../hooks/useTheme";

import styles from "./index.module.less";

const REPO_URL = "https://github.com/moonboat1101/moonboat-mini";
const GENSHIN_ICON =
  "https://s1.aigei.com/src/img/png/5d/5d23970a2f3f450eb3c8f6884c4e0e43.png?imageMogr2/auto-orient/thumbnail/!282x282r/gravity/Center/crop/282x282/quality/85/%7CimageView2/2/w/282&e=2051020800&token=P7S2Xpzfz11vAkASLTkfHN7Fw-oOZBecqeJaxypL:HGaSXiz-p67st8GrjLKsAJG8HLo=";
const WISH_ICON =
  "https://bkimg.cdn.bcebos.com/pic/6c224f4a20a4462309f708ab127a650e0cf3d6ca79fb?x-bce-process=image/format,f_auto/quality,Q_70/resize,m_lfit,limit_1,w_536";
const POKEMON_ICON =
  "https://s1.aigei.com/src/img/png/e6/e6f2fee753dc43bf84b0e0434069e631.png?imageMogr2/auto-orient/thumbnail/!282x282r/gravity/Center/crop/282x282/quality/85/%7CimageView2/2/w/282&e=2051020800&token=P7S2Xpzfz11vAkASLTkfHN7Fw-oOZBecqeJaxypL:oVtd8ZV69R_JJ-v236tW0fDxFh4=";
const SCRIPT_RECORD_ICON =
  "https://ts1.tc.mm.bing.net/th/id/OIP-C.66t7nMF0i-oUPJ9qVhzmfwHaHa";
const TURTLE_SOUP_ICON =
  "https://pp.myapp.com/ma_icon/0/icon_54113753_1722405739/256";
const QRCODE_ICON =
  "https://gd-hbimg.huaban.com/07c6686e680086ee3c92eb48e10df3325832fac568d-uvzROb_fw658";
const HANDOU_ICON =
  "https://img95.699pic.com/element/40146/8048.png_300.png";
const CARD_EXCHANGE_ICON =
  "https://patchwiki.biligame.com/images/ys/8/8f/13zuc1pn9n7c42kniz2woqfxhivdtbu.png";
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
      iconImage: CARD_EXCHANGE_ICON,
      url: "/pages/CardExchangeMarket/index",
    },
    {
      title: "原神抽卡记录",
      iconImage: GENSHIN_ICON,
      url: "/pages/genshin/index",
    },
    {
      title: "剧本杀",
      iconImage: SCRIPT_RECORD_ICON,
      url: "/pages/ScriptRecord/index",
    },
    {
      title: "汉兜",
      iconImage: HANDOU_ICON,
      url: "/pages/HanDou/index",
    },
    {
      title: "数独",
      iconKind: "sudoku",
      url: "/pages/Sudoku/index",
    },
    {
      title: "MBTI 测试",
      iconKind: "mbti",
      url: "/pages/Mbti/index",
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
  ];
  const primaryCards = cards.slice(0, 2);
  const secondaryCards = cards.slice(2);

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

  const renderCard = (i: (typeof cards)[number], readonly = false) => (
    <View
      key={i.title}
      className={styles.card}
      onClick={readonly ? undefined : () => handleCardClick(i)}
    >
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
        ) : (
          <Image src={i.iconImage} className={styles.cardIconImage} mode="aspectFill" />
        )}
      </View>
      <Text className={styles.cardTitle}>{i.title}</Text>
      <View className={styles.cardOrnament}>
        <View className={styles.ornamentLine} />
        <View className={styles.ornamentDot} />
        <View className={styles.ornamentLine} />
      </View>
    </View>
  );

  const renderHomeContent = (displayTheme: MoonTheme, readonly = false) => (
    <>
      <View className={styles.header}>
        <View
          className={styles.logoButton}
          onClick={readonly ? undefined : handleLogoClick}
        >
          <Image src={profileSmall} className={styles.avatar} />
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
          {primaryCards.map((card) => renderCard(card, readonly))}
        </View>

        <View className={`${styles.cardList} ${styles.secondaryCardList}`}>
          {secondaryCards.map((card) => renderCard(card, readonly))}
        </View>
      </View>

      <View className={styles.footerSlogan}>
        <Text className={styles.footerMoon}>☾</Text>
        <Text className={styles.footerText}>月光所至 · 梦想起航</Text>
        <Text className={styles.footerMoon}>☽</Text>
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

