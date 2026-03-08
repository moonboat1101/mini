import { View, Text, Image } from "@tarojs/components";
import { useState } from "react";

import styles from "./index.module.less";

type SortType = "time" | "rating";

type ScriptRecordItem = {
  id: string;
  title: string;
  playTime: string; // 例如：2026.3
  rating: number; // 例如：3.5
  description: string;
  coverUrl?: string;
};

const DEFAULT_COVER = "https://via.placeholder.com/160x220.png?text=Script";

const scriptGames = [
  {
    name: "上路",
    time: "2023.9",
    desc: "夜里，一辆车行驶在国道上，不知驶往何方。车里坐着一家五口人，父母与孩子之间的关系异常紧张。妈妈嘴里一直念叨着什么数着车后面的人，爸爸失了神一般开着车，三个孩子不清楚发生了什么。这个家究竟怎么了，是从什么时候开始这个家就不再正常了？现代惊悚推理本，氛围紧张压抑，探索家庭的秘密与真相。",
    score: 4.0,
    img: "https://kimi-web-img.moonshot.cn/img/pic1.zhimg.com/ad527969f3b4de46dcd67f28ea027b61e559d58f.jpg",
  },
  {
    name: "搞钱",
    time: "2024.2",
    desc: "国家级医疗养生产业园即将落户平安市，本地大富豪们纷纷摩拳擦掌，准备大展拳脚，让资产腾飞。此时，神秘的散财童子老金突然出现，以产业园竞标胜负为准，邀请胜者加入世界级财团——金氏集团。大富豪们将亲历笑里藏刀、同伙背刺、坑蒙拐骗等尔虞我诈的商业竞争，最终谁能笑到最后，获得阶级跃迁，左右世界格局。",
    score: 3.0,
    img: "https://kimi-web-img.moonshot.cn/img/img1.gamersky.com/939f8e5bcdb7076896415360d2a8e9755bfbab00.jpg",
  },
  {
    name: "青楼",
    time: "2024.9",
    desc: '长安有一间名叫玉满楼的青楼，是无数大臣小相、富家公子、贤人雅士都流连忘返之地。玩家将化身不同身份的客人与花魁，展开一场爱恨交织、权谋交锋的精彩演绎。集古风、情感、阵营、机制与欢乐剧情于一体，采用"双面身份+阵营博弈"机制，剧情层层递进，结局常让人惊呼"原来我一直在演别人"。',
    score: 3.0,
    img: "https://kimi-web-img.moonshot.cn/img/img1.gamersky.com/29546da60c41c3550fa2dbe0f6706977bc4cc3ed.jpg",
  },
  {
    name: "年轮",
    time: "2024.12",
    desc: '故事发生在一个因大火而废弃的村庄——祖谷村。五位角色因神秘传单聚集于此，试图解开百年间缠绕村落的诅咒。以时间循环和宿命轮回为核心设定，融合变格世界观与本格推理手法，包含天文历法、时间差计算等硬核推理元素。每隔76年诞生的"天选者"须在30岁生日时死亡并轮回重生，唯有破解时间容器的秘密才能终结宿命。',
    score: 4.5,
    img: "https://kimi-web-img.moonshot.cn/img/pica.zhimg.com/1727b77562b630d8fbf1a3ed298cd41bd3629580.jpg",
  },
  {
    name: "死者在幻夜中醒来",
    time: "2024.12",
    desc: "河流上，漂浮着许多载着烛光的纸船，在一片波浪中，摇曳成一片星星点点。这条看不到尽头的河流，将会流向彼岸。人们相信，如果烛光与船只一起到达了河流的尽头，两个世界的人就可能在幻夜之中再次相见。日式惊悚推理本，阴阳师山背秋彦系列番外作品，通过记忆缺失的人们逐渐恢复意识，寻找自己的身份和相貌，理清每个人到底发生了什么事情。",
    score: 4.5,
    img: "https://kimi-web-img.moonshot.cn/img/www.dmyseo.com/f073d4b7ca0513832a8658af6ce1e8b7bfe1929e.jpg",
  },
  {
    name: "病娇少年的精分日记",
    time: "2025.1",
    desc: '我叫萧何。我一生的时间，是别人的七分之一，生命的厚度却是别人的七倍。因为这具身体里住着七个"我"，分别取名星期一至星期日，按照一周7天轮流出现，拥有自己独立的生活。我们之间从未打过照面，便签条上的文字是我们沟通的唯一途径。每个人都有日记记录着小秘密，我们彼此约定绝对不能偷看其他人的日记。现代惊悚推理本，七重人格分裂为核心设定。',
    score: 4.0,
    img: "https://kimi-web-img.moonshot.cn/img/80larpnew-1251545914.cos.ap-guangzhou.myqcloud.com/49614624ae474778eabe01946529558073261b2a.jpg",
  },
  {
    name: "雪乡连环杀人案件",
    time: "2025.1",
    desc: '年三十，北道河，村里出了个杀人魔。杀了一个又一个，最后一个杀老婆。七个小孩儿来串门，联起手来把案破。故事发生在中国东北一个有着特殊信仰和习俗的小村庄的除夕夜，将欢乐、机制、推理等多种元素进行综合。从"除夕夜饭棋盘游戏"到"致命赌博游戏"，破冰机制有趣，最终反转创新，整个过程让你觉得你在现实生活中经历过。',
    score: 3.0,
    img: "https://kimi-web-img.moonshot.cn/img/img.80larp.com.vb001.cn/5752f12645432e0068a42e613fa1efa1340d31ed.jpg",
  },
  {
    name: "病娇3:近乎正常的我们",
    time: "2025.3",
    desc: "我叫萧何，拥有七个孤独且热闹的分裂人格。我们的生活如架上落满灰尘的书本，平淡到毫无波澜，从未被血腥的手掌拾起，也并没有人喜欢。但我想，我们曾经失去的东西，也会很难过地想要找回我们吧。现代惊悚还原本，病娇系列第三部，剧情上包含第一部《精分日记》的彩蛋，在情感羁绊方面推荐先玩第一部再体验本作，宁浩与萧何的羁绊会更加丰满和深刻。",
    score: 3.5,
    img: "https://kimi-web-img.moonshot.cn/img/cdn.store-assets.com/39cc1d8a9d55c3e695aee80a40d9de1631a96170.jpeg",
  },
  {
    name: "猫岛谋杀循环",
    time: "2025.8",
    desc: '孤僻少年桃山优离奇自杀，为了追寻真相，心理教授将记载当年事件的六本日记启封，邀请了六位看似无关的客人来参加这场推理的饕餮晚宴。血缸中溺亡的人彘、铁架上残破的肢体、暴雨时离奇的断首、悬崖下模糊的头皮、熔炉里碳化的骨架、密室内蒸发的人影。无人生还的诅咒，是开启谋杀循环的源头。日式推理新本格，以"变态推理"与"逻辑循环"为核心。',
    score: 4.5,
    img: "https://kimi-web-img.moonshot.cn/img/80larpnew-1251545914.cos.ap-guangzhou.myqcloud.com/18f49981a6bd3047ffb3cedfb058c804c7800345.png",
  },
  {
    name: "安美纳斯DE死亡推想",
    time: "2026.1",
    desc: '记忆，像是从另一个世界倾倒而来的海水，等到风平浪静，"我们"便看到了水面中浮现着的"我们"的模样。这便是安美纳斯，这便是"我们"，一切的始源。被大雾包裹的季之馆，凶手和死者到底身在何处？布满探测装置的矩形馆，究竟如何打开别人已经关闭的房门？排布奇特的阴阳馆，是谁借由他人的城墙，铸造自己的壁垒？现代中式推理新本格，长逻辑链设定推理。',
    score: 5.0,
    img: "https://kimi-web-img.moonshot.cn/img/80larpnew-1251545914.cos.ap-guangzhou.myqcloud.com/87b1e33fc8498f57f5031a11712b65af8269721b.jpg",
  },
  {
    name: "弥留",
    time: "2026.2",
    desc: "都市的某个夜晚，一曲凄婉的旋律、一滩殷红的血迹将一群看似平凡的人引入一个充满未知与恐惧的世界。命运如同周而复始的迷宫，人心则是深不可测的汪洋。现代硬核推理本，新本格与中式恐怖风格，4男3女可反串，约5.5小时。在探索真相的过程中，既感受到推理的乐趣，又体验到中式恐怖独有的氛围，关于命运与人心的深刻探讨。",
    score: 4.0,
    img: "https://kimi-web-img.moonshot.cn/img/img1.gamersky.com/d67edf2b7fc8a10fa8d97f95c4afcc890dc27ebb.jpg",
  },
  {
    name: "须臾",
    time: "2026.3",
    desc: '我见到那载着麦草的马车，哥哥曾带我坐过。草堆软软的，我整个人都陷了进去。我听见哥哥慌乱地叫喊，黑暗中的我大笑。奇怪，他为何听不见我的笑声？我又听见了那奇怪的歌声：走马织草筐~筐里睡纸床~弥留间回望~须臾划阴阳~现代中式变格推理本，以道教理论为基础的世界观，融入佛教因果循环理论，充满"善恶阴阳、一念之差"的中式寓意，细思极恐的细节设计。',
    score: 4.5,
    img: "https://kimi-web-img.moonshot.cn/img/img1.gamersky.com/f505163a43de57535ae70b8b2b18c0eca4b310c0.jpg",
  },
];

const scriptList: ScriptRecordItem[] = scriptGames.map((game, index) => ({
  id: String(index + 1),
  title: game.name,
  playTime: game.time,
  rating: game.score,
  description: game.desc,
  coverUrl: game.img,
}));

const parsePlayTime = (time: string) => {
  const [yearStr, monthStr] = time.split(".");
  const year = Number(yearStr) || 0;
  const month = Number(monthStr) || 0;
  return year * 12 + month;
};

export default function ScriptRecord() {
  const [sortType, setSortType] = useState<SortType>("time");
  const [expandedMap, setExpandedMap] = useState<Record<string, boolean>>({});

  const sortedList = [...scriptList].sort((a, b) => {
    if (sortType === "time") {
      return parsePlayTime(b.playTime) - parsePlayTime(a.playTime);
    }

    const ratingDiff = (b.rating || 0) - (a.rating || 0);
    if (ratingDiff !== 0) {
      return ratingDiff;
    }

    // 评分相同时，按时间倒序（最新在上）
    return parsePlayTime(b.playTime) - parsePlayTime(a.playTime);
  });

  const toggleExpand = (id: string) => {
    setExpandedMap((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

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
        {sortedList.map((item) => {
          const isExpanded = !!expandedMap[item.id];
          const needCollapse = (item.description || "").length > 40;
          const descriptionClass =
            needCollapse && !isExpanded
              ? `${styles.description} ${styles.descriptionCollapsed}`
              : `${styles.description} ${styles.descriptionExpanded}`;
          return (
            <View key={item.id} className={styles.card}>
              <Image
                className={styles.cover}
                src={item.coverUrl || DEFAULT_COVER}
              />

              <View className={styles.cardRight}>
                <View className={styles.cardHeaderRow}>
                  <Text className={styles.cardTitle}>{item.title}</Text>
                  <View className={styles.cardHeaderRight}>
                    <Text className={styles.playTime}>{item.playTime}</Text>
                    <View className={styles.rating}>
                      <Text className={styles.starIcon}>★</Text>
                      <Text className={styles.ratingValue}>
                        {item.rating.toFixed(1)}
                      </Text>
                    </View>
                  </View>
                </View>

                <Text className={descriptionClass}>{item.description}</Text>

                {needCollapse && (
                  <View
                    className={styles.toggleArrow}
                    onClick={() => toggleExpand(item.id)}
                  >
                    <Text>{isExpanded ? "▲ 收起" : "▼ 展开"}</Text>
                  </View>
                )}
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}
