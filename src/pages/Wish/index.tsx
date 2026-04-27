import { View, Button } from "@tarojs/components";

import styles from "./index.module.less";
import { useState } from "react";
import { roleList } from "../Genshin/constants";

export default function Wish() {
  const [history, setHistory] = useState<ObjectType[]>([]);
  const [level, setLevel] = useState(0);

  const sum = history.reduce((pre, cur) => pre + cur?.pulls, 0);
  const goldCount = history.length || 0;
  const upCount = history?.filter((i) => !i?.isNormal).length || 0;
  const goldPulls = goldCount ? Number((sum / goldCount).toFixed(2)) : 0;
  const upPulls = upCount ? Number((sum / upCount).toFixed(2)) : 0;

  const handleWish = (ps: number) => {
    const res: ObjectType[] = [];
    // 1.获取当前水位(之前抽数+1)
    let tempLevel = level + 1;

    for (let i = 0; i < ps; i++) {
      // 2.当前抽概率：基础概率0.6，73抽之后每抽增加6，89抽时为6*(89-73)+0.6=96.6，90抽时102.6>100，即为保底
      const percent = tempLevel > 73 ? 6 * (tempLevel - 73) + 0.6 : 0.6;
      // 3.概率跟随机数比，确认当前抽是否获得五星
      const isGetGold = Math.random() * 100 < percent;
      const tempHistory = [...history, ...res];
      const isNormal = tempHistory[tempHistory.length - 1]?.isNormal
        ? false
        : Math.random() > 0.5;

      // 4.根据是否出金给数组塞入合适内容：如果有定轨，则有50%概率为定轨角色，反之直接随机
      if (isGetGold) {
        const filteredList = roleList?.filter((i) =>
          isNormal ? i?.isNormal : !i?.isNormal,
        );
        const randomRole =
          filteredList[Math.floor(Math.random() * filteredList?.length)];
        console.log("randomRole", randomRole);
        res.push({
          pulls: tempLevel,
          isNormal,
          role: randomRole?.name,
        });
      }

      // 5.水位更新
      tempLevel = isGetGold ? 1 : tempLevel + 1;
    }

    // 将本次抽卡数据更新本地
    setHistory([...history, ...res]);
    setLevel(tempLevel - 1);
  };

  return (
    <View className={styles.wish}>
      <View className={styles.wishData}>
        <View className={styles.wishDataCard}>
          <View className={styles.cardLabel}>当前水位</View>
          <View className={styles.cardValue}>{level ?? "-"}</View>
        </View>
        <View className={styles.wishDataCard}>
          <View className={styles.cardLabel}>每限定抽数</View>
          <View
            className={styles.cardValue}
            style={{
              color:
                upPulls > 93.75 ? "var(--color-error)" : "var(--color-success)",
            }}
          >
            {upPulls}
          </View>
        </View>
        <View className={styles.wishDataCard}>
          <View className={styles.cardLabel}>每金抽数</View>
          <View
            className={styles.cardValue}
            style={{
              color:
                goldPulls > 62.5
                  ? "var(--color-error)"
                  : "var(--color-success)",
            }}
          >
            {goldPulls}
          </View>
        </View>
      </View>

      <View className={styles.wishHistoryTitle}>抽卡历史</View>

      <View className={styles.wishHistory}>
        {history?.map((i) => (
          <View className={styles.historyRow}>
            <View>花费</View>
            <View
              className={styles.historyPulls}
              style={{
                color:
                  i?.pulls > 62.5
                    ? "var(--color-error)"
                    : "var(--color-success)",
              }}
            >
              {i?.pulls || 0}
            </View>
            <View style={{ marginRight: 8 }}>抽到了</View>
            {i?.isNormal ? (
              <View
                className={styles.historyRole}
                style={{ color: "var(--color-error)" }}
              >
                {i?.role}
              </View>
            ) : (
              <View
                className={styles.historyRole}
                style={{ color: "var(--color-success)" }}
              >
                {i?.role}
              </View>
            )}
          </View>
        ))}

        {!history?.length && (
          <View className={styles.wishHistoryTip}>暂无抽卡记录~</View>
        )}
      </View>

      <View className={styles.wishFooter}>
        <Button className={styles.footerButton} onClick={() => handleWish(1)}>
          抽一次
        </Button>
        <Button className={styles.footerButton} onClick={() => handleWish(10)}>
          十连抽
        </Button>
        <Button className={styles.footerButton} onClick={() => handleWish(100)}>
          一百连!
        </Button>
      </View>
    </View>
  );
}
