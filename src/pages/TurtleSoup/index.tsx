import { View, Text, Button } from "@tarojs/components";
import { useEffect, useState } from "react";
import Taro from "@tarojs/taro";

import { turtleSoups } from "./constants";
import { usePageShare } from "../../hooks/usePageShare";
import { useTheme } from "../../hooks/useTheme";
import styles from "./index.module.less";

export default function TurtleSoup() {
  usePageShare({
    title: "海龟汤",
    path: "/pages/TurtleSoup/index",
  });

  const [curTurtleSoup, setCurTurtleSoup] = useState<Record<string, any>>({});
  const [history, setHistory] = useState<string[]>([]);
  const [showSolution, setShowSolution] = useState(false);
  const [incomingSoup, setIncomingSoup] = useState<Record<string, any> | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const { themeClassName } = useTheme();

  const getRandomTurtleSoup = () => {
    if (isTransitioning) return;

    const filteredList = turtleSoups?.filter((i) => !history.includes(i.title));
    if (filteredList.length <= 1) {
      Taro.showToast({
        title: "\u4f60\u5c45\u7136\u5168\u90fd\u770b\u5b8c\u4e86\uff0c\u795e\u4eba\u554a\uff1f",
        icon: "error",
      });
      return;
    }

    const randomIndex = Math.floor(Math.random() * filteredList.length);
    const newTurtleSoup = filteredList[randomIndex];
    if (!Object.keys(curTurtleSoup).length) {
      setHistory([...history, newTurtleSoup?.title]);
      setCurTurtleSoup(newTurtleSoup);
      return;
    }

    setIsTransitioning(true);
    setIncomingSoup(newTurtleSoup);
    setTimeout(() => {
      setHistory((previous) => [...previous, newTurtleSoup?.title]);
      setCurTurtleSoup(newTurtleSoup);
      setShowSolution(false);
      setIncomingSoup(null);
      setIsTransitioning(false);
    }, 340);
  };

  useEffect(() => {
    getRandomTurtleSoup();
  }, []);

  return (
    <View className={`${styles.turtleSoupContainer} ${themeClassName}`}>
      <View className={styles.contentArea}>
        <View className={styles.contentStage}>
          <View className={`${styles.soupContent} ${isTransitioning ? styles.soupLeaving : ""}`}>
            <View className={styles.scenarioBox}>
              <Text className={styles.title}>{curTurtleSoup?.title}</Text>
              <Text className={styles.soupText}>{curTurtleSoup?.scenario}</Text>
            </View>

            <View
              className={styles.solutionBox}
              onClick={() => !isTransitioning && setShowSolution((visible) => !visible)}
            >
              {showSolution ? (
                <Text className={styles.soupText}>{curTurtleSoup?.solution}</Text>
              ) : (
                <View className={styles.solutionToggle}>
                  <Text className={styles.solutionToggleText}>
                    {"\u70b9\u51fb\u67e5\u770b\u6c64\u5e95"}
                  </Text>
                </View>
              )}
            </View>
          </View>
          {incomingSoup ? (
            <View className={`${styles.soupContent} ${styles.soupEntering}`}>
              <View className={styles.scenarioBox}>
                <Text className={styles.title}>{incomingSoup.title}</Text>
                <Text className={styles.soupText}>{incomingSoup.scenario}</Text>
              </View>
              <View className={styles.solutionBox}>
                <View className={styles.solutionToggle}>
                  <Text className={styles.solutionToggleText}>{"\u70b9\u51fb\u67e5\u770b\u6c64\u5e95"}</Text>
                </View>
              </View>
            </View>
          ) : null}
        </View>
      </View>

      <View className={styles.footerButtonBar}>
        <Button className={styles.btnChange} disabled={isTransitioning} onClick={getRandomTurtleSoup}>
          {"\u6362\u4e00\u6362"}
        </Button>
      </View>
    </View>
  );
}
