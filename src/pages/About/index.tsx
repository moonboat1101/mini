import { Image, Text, View } from "@tarojs/components";
import { usePageShare } from "../../hooks/usePageShare";
import douyinIcon from "../../assets/icons/douyin.svg";

import styles from "./index.module.less";

const ABOUT_CONTENT =
  "　　月舟是我自用的一个非营利性小程序，小程序素材取用自官方网站、大型 Wiki、AI 生成等渠道，如权利方提出要求，会第一时间配合下架相关素材。\n　　平台仅提供信息展示，不参与、不担保、不介入任何实际行为。";
const CONTACTS = [
  { label: "邮箱", icon: "\ue633", value: "1025196468@qq.com", variant: "email" },
  { label: "小红书", icon: "\ue600", value: "5075116612", variant: "xiaohongshu" },
  { label: "抖音", image: douyinIcon, value: "moonboat1101", variant: "douyin" },
] as const;

export default function About() {
  usePageShare({
    title: "关于月舟",
    path: "/pages/About/index",
  });
  return (
    <View className={styles.aboutPage}>
      <View className={styles.contentCard}>
        <Text className={styles.aboutContent}>{ABOUT_CONTENT}</Text>
      </View>
      <View className={styles.contactList}>
        {CONTACTS.map((contact) => <View key={contact.label} className={styles.contactItem} aria-label={contact.label}>
          {"image" in contact ? <Image className={styles.contactIcon} src={contact.image} mode="aspectFit" /> : <Text className={`iconfont ${styles.contactIcon} ${styles[contact.variant]}`}>{contact.icon}</Text>}
          <Text>{contact.value}</Text>
        </View>)}
      </View>
    </View>
  );
}
