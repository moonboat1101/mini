import { Text, View } from "@tarojs/components";
import styles from "./index.module.less";

export default function MembershipTag({ count, compact = false }: { count: number; compact?: boolean }) {
  const isMoon = count >= 3 && count < 5;
  const icon = count >= 5 ? "\ue647" : isMoon ? "\ue6c0" : "✦";
  const tierStyle = count >= 5 ? styles.sunTag : isMoon ? styles.moonTag : count >= 1 ? styles.starTag : styles.inactiveTag;
  return <View className={`${styles.tag} ${tierStyle} ${compact ? styles.compact : ""}`}>
    {count >= 1 ? <><Text className={`${styles.icon} ${count >= 3 ? "iconfont" : ""}`}>{icon}</Text><Text className={styles.label}>VIP</Text></> : <Text className={styles.label}>暂无等级</Text>}
  </View>;
}
