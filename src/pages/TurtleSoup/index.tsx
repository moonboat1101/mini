import { View, Text, Button } from "@tarojs/components";
import { useEffect, useState } from "react";
import Taro from "@tarojs/taro";

import { turtleSoups } from "./constants";
import styles from "./index.module.less";

export default function TurtleSoup() {
  const [curTurtleSoup, setCurTurtleSoup] = useState<Record<string, any>>({});
  const [history, setHistory] = useState<string[]>([]);
  const [showSolution, setShowSolution] = useState(false);

  const getRandomTurtleSoup = () => {
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
    setHistory([...history, newTurtleSoup?.title]);
    setCurTurtleSoup(newTurtleSoup);
    setShowSolution(false);
  };

  useEffect(() => {
    getRandomTurtleSoup();
  }, []);

  return (
    <View className={styles.turtleSoupContainer}>
      <View className={styles.contentArea}>
        <View className={styles.scenarioBox}>
          <Text className={styles.title}>{curTurtleSoup?.title}</Text>
          <Text>{curTurtleSoup?.scenario}</Text>
        </View>

        <View className={styles.solutionBox}>
          {showSolution ? (
            <Text>{curTurtleSoup?.solution}</Text>
          ) : (
            <View
              className={styles.solutionToggle}
              onClick={() => setShowSolution(true)}
            >
              <Text className={styles.solutionToggleText}>
                {"\u70b9\u51fb\u67e5\u770b\u6c64\u5e95"}
              </Text>
            </View>
          )}
        </View>
      </View>

      <View className={styles.footerButtonBar}>
        <Button className={styles.btnChange} onClick={getRandomTurtleSoup}>
          {"\u6362\u4e00\u6362"}
        </Button>
      </View>
    </View>
  );
}
