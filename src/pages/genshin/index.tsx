import { View, Input, Button, Text } from "@tarojs/components";
import { useState, useEffect } from "react";
import Taro from "@tarojs/taro";

import GoldTotal from "./components/GoldTotal";
import { usePageShare } from "../../hooks/usePageShare";
import { useKeyboardFloating } from "../../hooks/useKeyboardFloating";
import { useTheme } from "../../hooks/useTheme";
import { GachaType, GachaTypeKey } from "./constants";

import styles from "./index.module.less";

const GENSHIN_GOLD_DATA_CACHE_KEY = "genshinGoldDisplayData";
const GENSHIN_GOLD_DATA_CACHE_TIME_KEY = "genshinGoldDisplayDataTime";
const PITY_NAME = "已垫";

const formatCacheDate = (date: Date) =>
  `${date.getFullYear()}.${date.getMonth() + 1}.${date.getDate()}`;

const isSameGoldItem = (left: ObjectType, right: ObjectType) =>
  left?.name === right?.name &&
  left?.count === right?.count &&
  left?.gacha_type === right?.gacha_type;

const findOverlapCount = (newData: ObjectType[], oldData: ObjectType[]) => {
  const maxLength = Math.min(newData.length, oldData.length);

  for (let length = maxLength; length > 0; length -= 1) {
    const newTail = newData.slice(newData.length - length);
    const oldHead = oldData.slice(0, length);

    if (newTail.every((item, index) => isSameGoldItem(item, oldHead[index]))) {
      return length;
    }
  }

  return 0;
};

const mergeGoldDisplayData = (
  newData: ObjectType[],
  oldData: ObjectType[],
) => {
  const mergedData: ObjectType[] = [];
  const getGachaGroupData = (data: ObjectType[], type: GachaTypeKey) =>
    data.filter((item) => {
      if (type === GachaTypeKey.ROLE) {
        return ["301", "400"].includes(item.gacha_type);
      }

      return item.gacha_type === GachaType[type].code;
    });

  Object.keys(GachaType).forEach((key) => {
    const type = key as GachaTypeKey;
    const newGroup = getGachaGroupData(newData, type);
    const oldGroup = getGachaGroupData(oldData, type).filter(
      (item) => item.name !== PITY_NAME,
    );
    const overlapCount = findOverlapCount(newGroup, oldGroup);

    mergedData.push(...newGroup, ...oldGroup.slice(overlapCount));
  });

  return mergedData;
};

export default function Genshin() {
  usePageShare({
    title: "原神抽卡记录",
    path: "/pages/genshin/index",
  });

  const [gachaParams, setGachaParams] = useState<ObjectType | undefined>();
  const [tempData, setTempData] = useState<ObjectType[]>([]);
  const [fetchGoldData, setFetchGoldData] = useState<ObjectType[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [allGoldData, setAllGoldData] = useState<ObjectType[]>([]);
  const [cacheTime, setCacheTime] = useState("");
  const exportCommand = `iex(irm 'https://img.lelaer.com/cn.ps1')`;
  const keyboardFloating = useKeyboardFloating("genshin-input-keyboard");
  const { themeClassName } = useTheme();

  const copyExportCommand = () => {
    Taro.setClipboardData({
      data: exportCommand,
      success: () => {
        Taro.showToast({
          title: "命令已复制",
          icon: "success",
        });
      },
    });
  };

  const startFetch = () => {
    setFetchGoldData([]);
    setTempData([]);
    setGachaParams({
      endId: "0",
      currentPage: 1,
      gachaType: GachaTypeKey.ROLE,
    });
  };

  const removeCache = () => {
    setAllGoldData([]);
    setCacheTime("");
    setFetchGoldData([]);
    setTempData([]);
    setGachaParams(undefined);
    Taro.removeStorageSync(GENSHIN_GOLD_DATA_CACHE_KEY);
    Taro.removeStorageSync(GENSHIN_GOLD_DATA_CACHE_TIME_KEY);
    Taro.showToast({
      title: "缓存已清除",
      icon: "success",
    });
  };

  const clearCache = () => {
    Taro.showModal({
      title: "确认清除缓存？",
      content: "清除后将无法恢复",
      confirmText: "清除",
      confirmColor: "#ed8b76",
      success: (res) => {
        if (res.confirm) {
          removeCache();
        }
      },
    });
  };

  /** 接口请求操作 */
  const fetchData = async () => {
    if (!gachaParams) return;

    const token = inputValue?.split("?")?.[1]?.split("#")?.[0];
    if (!token) {
      Taro.showToast({
        title: "请输入正确的导出链接",
        icon: "error",
      });
      return;
    }

    Taro.showToast({
      title: `获取${GachaType[gachaParams.gachaType].label}池第${
        gachaParams.currentPage
      }页中...`,
      icon: "loading",
      mask: true,
    });

    const params = {
      gacha_type: GachaType[gachaParams.gachaType].code,
      page: gachaParams.currentPage,
      size: 20,
      end_id: gachaParams.endId,
    };
    const queryString = Object.keys(params)
      .map((i) => `&${i}=${params[i]}`)
      .join("");
    const fetchUrl = `https://public-operation-hk4e.mihoyo.com/gacha_info/api/getGachaLog?${token}${queryString}`;

    try {
      const res = await Taro.request({
        url: fetchUrl,
        method: "GET",
      });

      if (!res?.data?.data) {
        Taro.showToast({
          title: res?.data?.message || "请求失败",
          icon: "error",
        });
        return;
      }

      if (res.data.data.list.length) {
        setGachaParams({
          ...gachaParams,
          endId: res?.data?.data?.list[res.data.data.list.length - 1]?.id || "",
          currentPage: gachaParams.currentPage + 1,
        });
        setTempData((prev) => [...prev, ...res?.data?.data?.list]);
        return;
      }

      const gachaList = Object.keys(GachaType);
      const curIndex = gachaList.findIndex((i) => i === gachaParams.gachaType);
      const nextGacha = gachaList[curIndex + 1] || gachaList[0];

      const handleRawData = (rawData) => {
        return rawData?.reduce((acc, current) => {
          if (current.rank_type === "5") {
            acc.push({
              name: current.name,
              count: 1,
              gacha_type: current.gacha_type,
            });
          } else {
            if (acc.length === 0) {
              acc.push({
                name: PITY_NAME,
                count: 0,
                gacha_type: rawData[0]?.gacha_type,
              });
            }
            acc[acc.length - 1].count += 1;
          }
          return acc;
        }, []);
      };

      const nextFetchGoldData = [...fetchGoldData, ...handleRawData(tempData)];
      setFetchGoldData(nextFetchGoldData);
      setTempData([]);

      if (curIndex === gachaList?.length - 1) {
        const mergedGoldData = mergeGoldDisplayData(
          nextFetchGoldData,
          allGoldData,
        );

        setAllGoldData(mergedGoldData);
        Taro.setStorageSync(GENSHIN_GOLD_DATA_CACHE_KEY, mergedGoldData);
        const nextCacheTime = formatCacheDate(new Date());
        setCacheTime(nextCacheTime);
        Taro.setStorageSync(GENSHIN_GOLD_DATA_CACHE_TIME_KEY, nextCacheTime);
        setGachaParams(undefined);
        Taro.showToast({
          title: "获取成功！",
          icon: "success",
        });
      } else {
        setGachaParams({
          gachaType: nextGacha as GachaTypeKey,
          endId: "0",
          currentPage: 1,
        });
      }
    } catch (error) {
      Taro.showToast({
        title: "请求失败",
        icon: "error",
      });
    }
  };

  useEffect(() => {
    const cachedGoldData = Taro.getStorageSync(GENSHIN_GOLD_DATA_CACHE_KEY);
    const cachedCacheTime = Taro.getStorageSync(
      GENSHIN_GOLD_DATA_CACHE_TIME_KEY,
    );

    if (Array.isArray(cachedGoldData) && cachedGoldData.length) {
      setAllGoldData(cachedGoldData);
    }

    if (typeof cachedCacheTime === "string") {
      setCacheTime(cachedCacheTime);
    }
  }, []);

  useEffect(() => {
    if (gachaParams) {
      const timer = setTimeout(fetchData, 500);
      return () => clearTimeout(timer);
    }
  }, [gachaParams]);

  return (
    <View className={`${styles.genshin} ${themeClassName}`}>
      {/** 数据展示 */}
      {allGoldData.length ? (
        <View className={styles.genshinBody}>
          {Object.keys(GachaType).map((i) => {
            const getFilteredData = (type: GachaTypeKey) => {
              return allGoldData?.filter((j) => {
                if (GachaType[type].label === "角色") {
                  return ["301", "400"].includes(j.gacha_type);
                }
                return j.gacha_type === GachaType[type].code;
              });
            };
            const data = getFilteredData(i as GachaTypeKey);
            return data?.length ? (
              <GoldTotal key={i} type={i as GachaTypeKey} data={data} />
            ) : null;
          })}
          <View className={styles.cacheFooter}>
            <Text className={styles.cacheTime}>截止 {cacheTime || "--"}</Text>
            <Button className={styles.clearCacheButton} onClick={clearCache}>
              清除缓存
            </Button>
          </View>
        </View>
      ) : null}

      {/** 输入区 */}
      <View
        className={styles.entryPanel}
        style={{
          bottom: allGoldData.length ? "1.2rem" : "50%",
        }}
      >
        {!allGoldData.length ? (
          <View className={styles.guideCard}>
            <View className={styles.guideHeader}>
              <Text className={styles.guideTitle}>如何获得导出链接</Text>
              <Button className={styles.copyButton} onClick={copyExportCommand}>
                复制命令
              </Button>
            </View>
            <Text className={styles.guideText}>
              打开原神游戏内抽卡记录页面并翻几页，然后打开电脑终端 Windows
              PowerShell，运行复制的命令。命令结束后，导出链接会自动复制到剪贴板。
            </Text>
          </View>
        ) : null}

        <View
          id={keyboardFloating.targetId}
          className={styles.inputContainer}
          style={keyboardFloating.floatingStyle}
        >
          <Input
            className={styles.genshinInput}
            value={inputValue}
            {...keyboardFloating.inputKeyboardProps}
            onInput={(e) => setInputValue(e.detail.value)}
            placeholder="请输入导出链接"
            maxlength={-1}
          />

          <Button className={styles.genshinButton} onClick={startFetch}>
            开始获取
          </Button>
        </View>

      </View>
    </View>
  );
}
