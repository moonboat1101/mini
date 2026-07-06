import { View, Text, Image, ScrollView } from "@tarojs/components";
import Taro from "@tarojs/taro";
import { useEffect, useLayoutEffect, useState } from "react";
import { PLAYER_PIC, scriptGames, wishlist } from "./constants";
import { usePageShare } from "../../hooks/usePageShare";
import { useTheme } from "../../hooks/useTheme";

import styles from "./index.module.less";

const MODAL_PANEL_ID = "script-record-modal-panel";
const MODAL_HEADER_ID = "script-record-modal-header";

function splitPlayersByAvatar(
  players: string[],
  picMap: Record<string, string>,
): { withPic: string[]; withoutPic: string[] } {
  const withPic: string[] = [];
  const withoutPic: string[] = [];
  for (const id of players) {
    if (picMap[id]) withPic.push(id);
    else withoutPic.push(id);
  }
  return { withPic, withoutPic };
}

function ModalPlayersRow({ players }: { players: string[] }) {
  const { withPic, withoutPic } = splitPlayersByAvatar(players, PLAYER_PIC);
  return (
    <View className={styles.modalPlayersRow}>
      {withPic.length ? (
        <View className={styles.modalPlayersAvatars}>
          {withPic.map((pid, i) => (
            <View
              key={pid}
              className={styles.modalPlayerAvatarWrap}
              style={{ zIndex: withPic.length - i }}
            >
              <Image
                className={styles.modalPlayerAvatarImg}
                src={PLAYER_PIC[pid]}
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
          {withPic.map((pid, i) => (
            <View
              key={pid}
              className={styles.cardPlayerAvatarWrap}
              style={{ zIndex: withPic.length - i }}
            >
              <Image
                className={styles.cardPlayerAvatarImg}
                src={PLAYER_PIC[pid]}
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

type ScriptRecordItem = {
  type: "played";
  id: string;
  name: string;
  time: string;
  desc: string;
  score: number;
  img: string;
  comment?: string;
  role?: string;
  players?: string[];
};

type WishlistItem = {
  type: "wishlist";
  id: string;
  name: string;
  desc: string;
  people: number;
  img: string;
};

type ScriptListItem = ScriptRecordItem | WishlistItem;

const DEFAULT_COVER = "https://via.placeholder.com/160x220.png?text=Script";

const scriptList: ScriptRecordItem[] = scriptGames.map((game, index) => ({
  type: "played",
  id: String(index + 1),
  ...game,
}));

const wishlistItems: WishlistItem[] = wishlist.map((item, index) => ({
  type: "wishlist",
  id: `wishlist-${index + 1}`,
  ...item,
}));

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
  const [activeItem, setActiveItem] = useState<ScriptListItem | null>(null);
  const [modalScrollBodyPx, setModalScrollBodyPx] = useState<
    number | undefined
  >(undefined);
  const { themeClassName } = useTheme();

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

  const renderCardMeta = (item: ScriptListItem) => {
    if (item.type === "wishlist") {
      return <Text className={styles.playTime}>{item.people}人</Text>;
    }

    return (
      <>
        <Text className={styles.playTime}>{item.time}</Text>
        <Text className={styles.metaDivider}>|</Text>
        <Text className={styles.playTime}>{item.score}</Text>
      </>
    );
  };

  const renderModalMeta = (item: ScriptListItem) => {
    if (item.type === "wishlist") {
      return <Text className={styles.modalPlayTime}>{item.people}人</Text>;
    }

    return (
      <>
        <Text className={styles.modalPlayTime}>{item.time}</Text>
        <Text className={styles.modalMetaDivider}>|</Text>
        <Text className={styles.modalPlayTime}>{item.score}</Text>
        {item.role?.trim() ? (
          <>
            <Text className={styles.modalMetaDivider}>|</Text>
            <Text className={styles.modalPlayTime}>{item.role.trim()}</Text>
          </>
        ) : null}
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
          <Text className={styles.cardTitle}>{item.name}</Text>
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
          {item.desc}
        </Text>
      </View>
    </View>
  );

  return (
    <View className={`${styles.scriptRecord} ${themeClassName}`}>
      <View className={styles.sortBar}>
        <View className={styles.sortSwitch}>
          <View
            className={`${styles.sortSwitchThumb} ${
              filterType === "rating"
                ? styles.sortSwitchThumbMiddle
                : filterType === "wishlist"
                  ? styles.sortSwitchThumbRight
                  : ""
            }`}
          />
          <View
            className={`${styles.sortSwitchItem} ${
              filterType === "time" ? styles.sortSwitchItemActive : ""
            }`}
            onClick={() => setFilterType("time")}
          >
            按时间
          </View>
          <View
            className={`${styles.sortSwitchItem} ${
              filterType === "rating" ? styles.sortSwitchItemActive : ""
            }`}
            onClick={() => setFilterType("rating")}
          >
            按评分
          </View>
          <View
            className={`${styles.sortSwitchItem} ${
              filterType === "wishlist" ? styles.sortSwitchItemActive : ""
            }`}
            onClick={() => setFilterType("wishlist")}
          >
            想玩
          </View>
        </View>
      </View>

      <View className={styles.cardList}>
        {visibleList.map((item) => renderScriptCard(item))}
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
                  <Text className={styles.modalTitle}>{activeItem.name}</Text>
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
              <Text className={styles.modalSynopsis}>{activeItem.desc}</Text>

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
