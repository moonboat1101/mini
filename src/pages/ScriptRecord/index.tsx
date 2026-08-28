import { View, Text, Image, ScrollView } from "@tarojs/components";
import Taro, { useDidShow } from "@tarojs/taro";
import { useEffect, useLayoutEffect, useState } from "react";
import { PLAYER_PIC } from "./constants";
import {
  loadScriptRecordData,
  type PlayedScriptRecord,
  type WishlistRecord,
} from "./data";
import { usePageShare } from "../../hooks/usePageShare";
import { useTheme } from "../../hooks/useTheme";
import ScriptRecordConfig from "./components/Config";

import styles from "./index.module.less";

const MODAL_PANEL_ID = "script-record-modal-panel";
const MODAL_HEADER_ID = "script-record-modal-header";

type AvatarPlayer = {
  id: string;
  src: string;
};

function getPlayerAvatarSrc(player: string, picMap: Record<string, string>) {
  if (picMap[player]) return picMap[player];
  return /^https?:\/\//i.test(player) ? player : "";
}

function splitPlayersByAvatar(
  players: string[],
  picMap: Record<string, string>,
): { withPic: AvatarPlayer[]; withoutPic: string[] } {
  const withPic: AvatarPlayer[] = [];
  const withoutPic: string[] = [];
  for (const player of players) {
    const src = getPlayerAvatarSrc(player, picMap);
    if (src) withPic.push({ id: player, src });
    else withoutPic.push(player);
  }
  return { withPic, withoutPic };
}

function ModalPlayersRow({ players }: { players: string[] }) {
  const { withPic, withoutPic } = splitPlayersByAvatar(players, PLAYER_PIC);
  return (
    <View className={styles.modalPlayersRow}>
      {withPic.length ? (
        <View className={styles.modalPlayersAvatars}>
          {withPic.map((player, i) => (
            <View
              key={`${player.id}-${i}`}
              className={styles.modalPlayerAvatarWrap}
              style={{ zIndex: withPic.length - i }}
            >
              <Image
                className={styles.modalPlayerAvatarImg}
                src={player.src}
                mode="aspectFill"
              />
            </View>
          ))}
        </View>
      ) : null}
      {withoutPic.length ? (
        <Text className={styles.modalPlayersRest}>
          {withPic.length ? ", " : ""}
          {withoutPic.join(", ")}
        </Text>
      ) : null}
    </View>
  );
}

function CardPlayersRow({ players }: { players: string[] }) {
  const { withPic, withoutPic } = splitPlayersByAvatar(players, PLAYER_PIC);
  return (
    <View className={styles.cardPlayersRow}>
      {withPic.length ? (
        <View className={styles.cardPlayersAvatars}>
          {withPic.map((player, i) => (
            <View
              key={`${player.id}-${i}`}
              className={styles.cardPlayerAvatarWrap}
              style={{ zIndex: withPic.length - i }}
            >
              <Image
                className={styles.cardPlayerAvatarImg}
                src={player.src}
                mode="aspectFill"
              />
            </View>
          ))}
        </View>
      ) : null}
      {withoutPic.length ? (
        <Text className={styles.cardPlayersRest}>
          {withPic.length ? ", " : ""}
          {withoutPic.join(", ")}
        </Text>
      ) : null}
    </View>
  );
}

function measureModalScrollBodyPx(): Promise<number | undefined> {
  return new Promise((resolve) => {
    if (
      (process.env.TARO_ENV as string) === "h5" &&
      typeof document !== "undefined"
    ) {
      const panel = document.getElementById(MODAL_PANEL_ID);
      const header = document.getElementById(MODAL_HEADER_ID);
      if (panel && header) {
        resolve(
          Math.max(80, Math.floor(panel.clientHeight - header.clientHeight)),
        );
        return;
      }
      resolve(undefined);
      return;
    }

    const q = Taro.createSelectorQuery();
    q.select(`#${MODAL_PANEL_ID}`).boundingClientRect();
    q.select(`#${MODAL_HEADER_ID}`).boundingClientRect();
    q.exec((res) => {
      if (!Array.isArray(res) || res.length < 2) {
        resolve(undefined);
        return;
      }
      const panel = res[0] as { height?: number };
      const header = res[1] as { height?: number };
      if (
        typeof panel?.height === "number" &&
        typeof header?.height === "number"
      ) {
        resolve(Math.max(80, Math.floor(panel.height - header.height)));
        return;
      }
      resolve(undefined);
    });
  });
}

type FilterType = "time" | "rating" | "wishlist";
type ScriptRecordNav = FilterType | "config";

type ScriptRecordItem = PlayedScriptRecord & { type: "played" };
type WishlistItem = WishlistRecord & { type: "wishlist" };

type ScriptListItem = ScriptRecordItem | WishlistItem;

const DEFAULT_COVER = "https://ts1.tc.mm.bing.net/th/id/OIP-C.66t7nMF0i-oUPJ9qVhzmfwHaHa";

const parsePlayTime = (time: string) => {
  const [yearStr, monthStr] = time.split(".");
  const year = Number(yearStr) || 0;
  const month = Number(monthStr) || 0;
  return year * 12 + month;
};

export default function ScriptRecord() {
  usePageShare({
    title: "剧本杀",
    path: "/pages/ScriptRecord/index",
  });

  const [filterType, setFilterType] = useState<FilterType>("time");
  const [activeNav, setActiveNav] = useState<ScriptRecordNav>("time");
  const [activeItem, setActiveItem] = useState<ScriptListItem | null>(null);
  const [modalScrollBodyPx, setModalScrollBodyPx] = useState<
    number | undefined
  >(undefined);
  const [recordData, setRecordData] = useState(loadScriptRecordData);
  const { themeClassName } = useTheme();

  useDidShow(() => {
    setRecordData(loadScriptRecordData());
  });

  useLayoutEffect(() => {
    if (!activeItem) {
      setModalScrollBodyPx(undefined);
      return;
    }

    let cancelled = false;
    let hasSet = false;
    const run = () => {
      if (hasSet) return;
      measureModalScrollBodyPx().then((px) => {
        if (!cancelled && px != null && !hasSet) {
          hasSet = true;
          setModalScrollBodyPx(px);
        }
      });
    };

    run();
    const t1 = setTimeout(run, 32);

    return () => {
      cancelled = true;
      clearTimeout(t1);
    };
  }, [activeItem]);

  useEffect(() => {
    if (!activeItem) return;
    if ((process.env.TARO_ENV as string) !== "h5") return;
    if (typeof document === "undefined") return;
    const html = document.documentElement;
    const body = document.body;
    const prevHtml = html.style.overflow;
    const prevBody = body.style.overflow;
    html.style.overflow = "hidden";
    body.style.overflow = "hidden";
    return () => {
      html.style.overflow = prevHtml;
      body.style.overflow = prevBody;
    };
  }, [activeItem]);

  const scriptList: ScriptRecordItem[] = recordData.played.map((item) => ({
    ...item,
    type: "played",
  }));
  const wishlistItems: WishlistItem[] = recordData.wishlist.map((item) => ({
    ...item,
    type: "wishlist",
  }));
  const sortedList = [...scriptList].sort((a, b) => {
    if (filterType === "time") {
      return parsePlayTime(b.time) - parsePlayTime(a.time);
    }

    const ratingDiff = (b.score || 0) - (a.score || 0);
    if (ratingDiff !== 0) {
      return ratingDiff;
    }

    return parsePlayTime(b.time) - parsePlayTime(a.time);
  });

  const visibleList: ScriptListItem[] =
    filterType === "wishlist" ? wishlistItems : sortedList;

  const selectListTab = (nextTab: FilterType) => {
    setActiveNav(nextTab);
    setFilterType(nextTab);
    setRecordData(loadScriptRecordData());
  };

  const renderCardMeta = (item: ScriptListItem) => {
    if (item.type === "wishlist") {
      return <Text className={styles.playTime}>{item.people ? `${item.people}人` : "人数待补充"}</Text>;
    }

    const meta = [item.time?.trim(), item.score ? String(item.score) : ""].filter(Boolean);
    if (!meta.length) return <Text className={styles.playTime}>信息待补充</Text>;
    return (
      <>
        {meta.map((value, index) => (
          <View key={value} className={styles.cardHeaderRight}>
            {index ? <Text className={styles.metaDivider}>·</Text> : null}
            <Text className={styles.playTime}>{value}</Text>
          </View>
        ))}
      </>
    );
  };

  const renderModalMeta = (item: ScriptListItem) => {
    if (item.type === "wishlist") {
      return <Text className={styles.modalPlayTime}>{item.people ? `${item.people}人` : "人数待补充"}</Text>;
    }

    const meta = [item.time?.trim(), item.score ? String(item.score) : "", item.role?.trim()].filter(Boolean);
    if (!meta.length) return <Text className={styles.modalPlayTime}>信息待补充</Text>;
    return (
      <>
        {meta.map((value, index) => (
          <View key={value} className={styles.modalMetaRow}>
            {index ? <Text className={styles.modalMetaDivider}>·</Text> : null}
            <Text className={styles.modalPlayTime}>{value}</Text>
          </View>
        ))}
      </>
    );
  };

  const renderScriptCard = (item: ScriptListItem) => (
    <View
      key={item.id}
      className={styles.card}
      onClick={() => setActiveItem(item)}
    >
      <Image className={styles.cover} src={item.img || DEFAULT_COVER} />

      <View className={styles.cardRight}>
        <View className={styles.cardHeaderRow}>
          <Text className={styles.cardTitle}>{item.name?.trim() || "未命名剧本"}</Text>
          <View className={styles.cardHeaderRight}>{renderCardMeta(item)}</View>
        </View>

        {item.type === "played" && item.players?.length ? (
          <CardPlayersRow players={item.players} />
        ) : null}

        <Text
          className={`${styles.description} ${
            item.type === "played" && item.players?.length
              ? styles.descriptionPreview
              : styles.descriptionPreviewFull
          }`}
        >
          {item.desc?.trim() || "暂无简介"}
        </Text>
      </View>
    </View>
  );

  return (
    <View className={`${styles.scriptRecord} ${themeClassName}`}>
      {activeNav === "config" ? <ScriptRecordConfig embedded /> : <View className={styles.cardList}>
        {visibleList.map((item) => renderScriptCard(item))}
      </View>}

      <View className={styles.bottomNavigation}>
        <View className={styles.bottomNavigationIndicator} style={{ transform: `translateX(${activeNav === "time" ? "0" : activeNav === "rating" ? "100%" : activeNav === "wishlist" ? "200%" : "300%"})` }} />
        <View className={`${styles.bottomNavigationItem} ${activeNav === "time" ? styles.bottomNavigationItemActive : ""}`} onClick={() => selectListTab("time")}>按时间</View>
        <View className={`${styles.bottomNavigationItem} ${activeNav === "rating" ? styles.bottomNavigationItemActive : ""}`} onClick={() => selectListTab("rating")}>按评分</View>
        <View className={`${styles.bottomNavigationItem} ${activeNav === "wishlist" ? styles.bottomNavigationItemActive : ""}`} onClick={() => selectListTab("wishlist")}>想玩</View>
        <View className={`${styles.bottomNavigationItem} ${activeNav === "config" ? styles.bottomNavigationItemActive : ""}`} onClick={() => setActiveNav("config")}>我的配置</View>
      </View>

      {activeItem && (
        <View
          className={styles.modalMask}
          catchMove
          onClick={() => setActiveItem(null)}
        >
          <View
            id={MODAL_PANEL_ID}
            className={styles.modalPanel}
            onClick={(e) => e.stopPropagation()}
          >
            <View id={MODAL_HEADER_ID} className={styles.modalHeader} catchMove>
              <View className={styles.modalTop}>
                <Image
                  className={styles.modalCover}
                  src={activeItem.img || DEFAULT_COVER}
                />
                <View className={styles.modalTopMeta}>
                  <Text className={styles.modalTitle}>{activeItem.name?.trim() || "未命名剧本"}</Text>
                  <View className={styles.modalMetaRow}>
                    {renderModalMeta(activeItem)}
                  </View>
                  {activeItem.type === "played" && activeItem.players?.length ? (
                    <ModalPlayersRow players={activeItem.players} />
                  ) : null}
                </View>
              </View>
            </View>

            <ScrollView
              scrollY
              className={styles.modalBody}
              style={
                modalScrollBodyPx != null
                  ? { height: `${modalScrollBodyPx}px` }
                  : undefined
              }
            >
              <Text className={styles.modalSectionTitle}>简介</Text>
              <Text className={styles.modalSynopsis}>{activeItem.desc?.trim() || "暂无简介"}</Text>

              {activeItem.type === "played" && activeItem.comment?.trim() ? (
                <View className={styles.modalNoteBlock}>
                  <Text className={styles.modalSectionTitle}>备注</Text>
                  <Text className={styles.modalNoteText}>
                    {activeItem.comment.trim()}
                  </Text>
                </View>
              ) : null}
            </ScrollView>
          </View>
        </View>
      )}
    </View>
  );
}
