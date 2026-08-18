import { Text, View } from "@tarojs/components";
import { usePageShare } from "../../hooks/usePageShare";
import { useTheme } from "../../hooks/useTheme";

import styles from "./index.module.less";

// 后续可直接在这里补充或替换免责声明、使用说明等纯文案。
const ABOUT_SECTIONS = [
  {
    title: "简介",
    content:
      "月舟是我自用的一个非营利性小程序，小程序素材取用自官方网站、大型 Wiki、AI 生成等渠道，如权利方提出要求，会第一时间配合下架相关素材。",
  },
  {
    title: "联系作者",
    content: "邮箱：1025196468@qq.com",
  },
  {
    title: "免责声明",
    content: "平台仅提供信息展示，不参与、不担保、不介入任何实际行为。",
  },
];

export default function About() {
  usePageShare({
    title: "关于月舟",
    path: "/pages/About/index",
  });
  const { themeClassName } = useTheme();

  return (
    <View className={`${styles.aboutPage} ${themeClassName}`}>
      <View className={styles.contentCard}>
        {ABOUT_SECTIONS.map((section) => (
          <View key={section.title} className={styles.section}>
            <Text className={styles.sectionTitle}>{section.title}</Text>
            <Text className={styles.sectionContent}>{section.content}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}
