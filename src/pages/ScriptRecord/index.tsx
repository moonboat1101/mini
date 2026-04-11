import { View, Text, Image, ScrollView } from "@tarojs/components";
import Taro from "@tarojs/taro";
import { useEffect, useLayoutEffect, useState } from "react";
import { PLAYER_PIC, scriptGames } from "./constants";

import styles from "./index.module.less";

const MODAL_PANEL_ID = "script-record-modal-panel";
const MODAL_HEADER_ID = "script-record-modal-header";

/** 保持 players 顺序：有头像在前，无头像在后 */
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

type SortType = "time" | "rating";

/** 与 scriptGames 单条字段一致；id 为列表用 */
type ScriptRecordItem = {
  id: string;
  name: string;
  time: string;
  desc: string;
  score: number;
  img: string;
  comment?: string;
  players?: string[];
};

const DEFAULT_COVER = "https://via.placeholder.com/160x220.png?text=Script";

const scriptList: ScriptRecordItem[] = scriptGames.map((game, index) => ({
  id: String(index + 1),
  ...game,
}));

const parsePlayTime = (time: string) => {
  const [yearStr, monthStr] = time.split(".");
  const year = Number(yearStr) || 0;
  const month = Number(monthStr) || 0;
  return year * 12 + month;
};

export default function ScriptRecord() {
  const [sortType, setSortType] = useState<SortType>("time");
  const [activeItem, setActiveItem] = useState<ScriptRecordItem | null>(null);
  const [modalScrollBodyPx, setModalScrollBodyPx] = useState<
    number | undefined
  >(undefined);

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
    if (sortType === "time") {
      return parsePlayTime(b.time) - parsePlayTime(a.time);
    }

    const ratingDiff = (b.score || 0) - (a.score || 0);
    if (ratingDiff !== 0) {
      return ratingDiff;
    }

    // 评分相同时，按时间倒序（最新在上）
    return parsePlayTime(b.time) - parsePlayTime(a.time);
  });

  return (
    <View className={styles.scriptRecord}>
      <View className={styles.sortBar}>
        <Text
          className={
            sortType === "time"
              ? `${styles.sortItem} ${styles.sortItemActive}`
              : styles.sortItem
          }
          onClick={() => setSortType("time")}
        >
          按游玩时间
        </Text>
        <Text
          className={
            sortType === "rating"
              ? `${styles.sortItem} ${styles.sortItemActive}`
              : styles.sortItem
          }
          onClick={() => setSortType("rating")}
        >
          按评分
        </Text>
      </View>

      <View className={styles.cardList}>
        {sortedList.map((item) => (
          <View
            key={item.id}
            className={styles.card}
            onClick={() => setActiveItem(item)}
          >
            <Image className={styles.cover} src={item.img || DEFAULT_COVER} />

            <View className={styles.cardRight}>
              <View className={styles.cardHeaderRow}>
                <Text className={styles.cardTitle}>{item.name}</Text>
                <View className={styles.cardHeaderRight}>
                  <Text className={styles.playTime}>{item.time}</Text>
                  <View className={styles.rating}>
                    <Text className={styles.starIcon}>★</Text>
                    <Text className={styles.ratingValue}>{item.score}</Text>
                  </View>
                </View>
              </View>

              {item.players?.length ? (
                <CardPlayersRow players={item.players} />
              ) : null}

              <Text
                className={`${styles.description} ${
                  item.players?.length
                    ? styles.descriptionPreview
                    : styles.descriptionPreviewFull
                }`}
              >
                {item.desc}
              </Text>
            </View>
          </View>
        ))}
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
                    <Text className={styles.modalPlayTime}>
                      {activeItem.time}
                    </Text>
                    <View className={styles.modalRating}>
                      <Text className={styles.starIcon}>★</Text>
                      <Text className={styles.ratingValue}>
                        {activeItem.score}
                      </Text>
                    </View>
                  </View>
                  {activeItem.players?.length ? (
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

              {activeItem.comment?.trim() ? (
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
