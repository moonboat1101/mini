import { View, Input, Button } from "@tarojs/components";
import Taro from "@tarojs/taro";
import { useEffect, useState } from "react";
import PokemonCard from "./components/PokemonCard";
import { usePageShare } from "../../hooks/usePageShare";

import styles from "./index.module.less";

export default function Pokemon() {
  usePageShare({
    title: "猜宝可梦",
    path: "/pages/Pokemon/index",
  });

  const [fullList, setFullList] = useState<ObjectType[]>([]);
  const [ans, setAns] = useState<ObjectType>();
  const [userAns, setUserAns] = useState<ObjectType>({});
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<ObjectType[]>([]);

  useEffect(() => {
    Taro.request({
      url: "https://xiaoce.fun/api/v0/quiz/daily/pokemon/getList",
    }).then((res) => {
      const list = res?.data?.data;
      setFullList(list);
      setAns(list[Math.floor(Math.random() * list?.length)]);
    });
  }, []);

  return (
    <View className={styles.pokemon}>
      <PokemonCard data={userAns} ans={ans} isQuestion />

      <View className={styles.pokemonHistory}>
        {history?.map((i) => (
          <PokemonCard data={i} ans={ans} />
        ))}
      </View>

      <View className={styles.footer}>
        {ans?.id !== userAns?.id && (
          <Input
            className={styles.footerInput}
            value={input}
            onInput={(e) => setInput(e.detail.value)}
            placeholder="请输入宝可梦名称"
          />
        )}

        {ans?.id !== userAns?.id && (
          <Button
            className={styles.footerButton}
            onClick={() => {
              const targetPokemon = fullList?.find((i) => i?.name === input);
              if (!targetPokemon) {
                Taro.showToast({
                  title: "找不到对应的宝可梦",
                  icon: "error",
                });
                return;
              }
              setInput("");
              setHistory([...history, targetPokemon]);
              let tempAns: ObjectType = {};
              Object.keys(targetPokemon).map((k) => {
                if (ans?.[k] === targetPokemon[k]) {
                  tempAns[k] = ans?.[k];
                }
              });
              setUserAns({ ...userAns, ...tempAns });
              if (tempAns?.id === ans?.id) {
                Taro.showToast({
                  title: "恭喜你！",
                  icon: "success",
                });
              }
            }}
          >
            提交
          </Button>
        )}

        {ans?.id === userAns?.id && (
          <Button
            className={styles.footerButton}
            style={{ width: "100%" }}
            onClick={() => {
              setUserAns({});
              setAns(fullList[Math.floor(Math.random() * fullList?.length)]);
              setHistory([]);
            }}
          >
            再玩一个
          </Button>
        )}
      </View>
    </View>
  );
}
