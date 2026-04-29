import { View, Input, Button, Text } from "@tarojs/components";
import { useState, useEffect } from "react";
import Taro from "@tarojs/taro";

import GoldTotal from "./components/GoldTotal";
import { GachaType, GachaTypeKey } from "./constants";

import styles from "./index.module.less";

export default function Genshin() {
  const [gachaParams, setGachaParams] = useState<ObjectType | undefined>();
  const [tempData, setTempData] = useState<ObjectType[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [allGoldData, setAllGoldData] = useState<ObjectType[]>([]);
  const exportCommand = `iex(irm 'https://img.lelaer.com/cn.ps1')`;

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
    setAllGoldData([]);
    setGachaParams({
      endId: "0",
      currentPage: 1,
      gachaType: GachaTypeKey.ROLE,
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
        setTempData([...tempData, ...res?.data?.data?.list]);
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
                name: "已垫",
                count: 0,
                gacha_type: rawData[0]?.gacha_type,
              });
            }
            acc[acc.length - 1].count += 1;
          }
          return acc;
        }, []);
      };

      setAllGoldData((prev) => [...prev, ...handleRawData(tempData)]);
      setTempData([]);

      if (curIndex === gachaList?.length - 1) {
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
    if (gachaParams) {
      const timer = setTimeout(fetchData, 500);
      return () => clearTimeout(timer);
    }
  }, [gachaParams]);

  return (
    <View className={styles.genshin}>
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

        <View className={styles.inputContainer}>
          <Input
            className={styles.genshinInput}
            value={inputValue}
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
