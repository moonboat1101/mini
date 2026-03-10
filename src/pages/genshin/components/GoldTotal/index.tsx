import { View, Image } from "@tarojs/components";
import { GachaType, GachaTypeKey, roleList } from "../../constants";

import styles from "./index.module.less";

interface GoldTotalProps {
  type: GachaTypeKey;
  data: ObjectType[];
}

const GoldTotal = (props: GoldTotalProps) => {
  const { type, data } = props;

  const goldCount =
    data?.[0]?.name === "已垫" ? data?.length - 1 : data?.length;
  const limitCount = data?.reduce((pre, cur) => {
    const isNormal =
      cur.name === "已垫" ||
      roleList.find((i) => cur.name === i.name)?.isNormal;
    return isNormal ? pre : pre + 1;
  }, 0);
  const goldPull = data?.reduce(
    (pre, cur) => (cur.name !== "已垫" ? pre + cur.count : pre),
    0,
  );
  const avgGold = goldCount ? (goldPull / goldCount).toFixed(1) : "-";
  const avgLimit = limitCount ? (goldPull / limitCount).toFixed(1) : "-";
  const waiPercent = goldCount
    ? (((goldCount - limitCount) / goldCount) * 100).toFixed(1)
    : "-";

  return (
    <View className={styles.goldTotal}>
      <View className={styles.title}>{GachaType[type].label}</View>

      {type === GachaTypeKey.ROLE && (
        <View className={styles.statsContainer}>
          <View className={styles.statCard}>
            <View className={styles.statLabel}>每金抽数</View>
            <View
              className={styles.statValue}
              style={{ color: Number(avgGold) > 62 ? "#ff4d4f" : "#52c41a" }}
            >
              {avgGold}
            </View>
          </View>
          <View className={styles.statCard}>
            <View className={styles.statLabel}>每限定抽数</View>
            <View
              className={styles.statValue}
              style={{ color: Number(avgLimit) > 93 ? "#ff4d4f" : "#52c41a" }}
            >
              {avgLimit}
            </View>
          </View>
          <View className={styles.statCard}>
            <View className={styles.statLabel}>歪概率</View>
            <View
              className={styles.statValue}
              style={{ color: Number(waiPercent) > 45 ? "#ff4d4f" : "#52c41a" }}
            >
              {waiPercent}%
            </View>
          </View>
        </View>
      )}

      <View className={styles.listContainer}>
        {data.map((item, index) => {
          const role = roleList.find((r) => r.name === item.name);
          return (
            <View
              key={index}
              className={styles.listItem}
              style={{
                background: "linear-gradient(135deg, #f3b47a 0%, #db924b 100%)",
              }}
            >
              {role && !role?.englishName?.includes("NO-PIC-") ? (
                <Image
                  className={styles.roleImage}
                  src={`https://ys.appfeng.com/ui/avatar/UI_AvatarIcon_${role.englishName}.png`}
                  mode="aspectFit"
                />
              ) : null}
              <View className={styles.itemName}>{item.name}</View>
              <View className={styles.itemCount}>{item.count}</View>
            </View>
          );
        })}
      </View>
    </View>
  );
};

export default GoldTotal;
