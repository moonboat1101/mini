import { Text, View } from "@tarojs/components";
import { usePageShare } from "../../hooks/usePageShare";
import { useTheme } from "../../hooks/useTheme";

import styles from "./index.module.less";

const ABOUT_CONTENT =
  "　　月舟是我自用的一个非营利性小程序，小程序素材取用自官方网站、大型 Wiki、AI 生成等渠道，如权利方提出要求，会第一时间配合下架相关素材。\n　　平台仅提供信息展示，不参与、不担保、不介入任何实际行为。";
const CONTACT_EMAIL =
  "　　邮箱：1025196468@qq.com\n　　小红书：5075116612\n　　抖音：moonboat1101";

export default function About() {
  usePageShare({
    title: "关于月舟",
    path: "/pages/About/index",
  });
  const { themeClassName } = useTheme();

  return (
    <View className={`${styles.aboutPage} ${themeClassName}`}>
      <View className={styles.contentCard}>
        <Text className={styles.aboutContent}>{ABOUT_CONTENT}</Text>
      </View>
      <Text className={styles.contactEmail}>{CONTACT_EMAIL}</Text>
    </View>
  );
}
