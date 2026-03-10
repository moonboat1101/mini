import { View, Image } from "@tarojs/components";

import styles from "./index.module.less";

interface Props {
  data?: ObjectType;
  ans?: ObjectType;
  isQuestion?: boolean;
}

const PokemonCard: React.FC<Props> = (props) => {
  const { data, ans, isQuestion } = props;

  const cardInfos = [
    {
      label: "属性",
      key: "type",
    },
    {
      label: "分类",
      key: "category",
    },
    {
      label: "世代",
      key: "generations",
    },
    {
      label: "超级进化",
      key: "canEvolution",
    },
    {
      label: "图鉴颜色",
      key: "color",
    },
    {
      label: "体型",
      key: "figure",
    },
  ];

  return (
    <View className={styles.card}>
      <View className={styles.cardHeader}>
        <View className={styles.cardHeaderLeft}>
          <Image
            src={
              data?.img
                ? `https://b68v.daai.fun/daily/quiz/pokemmo/${data?.img}`
                : ""
            }
            className={styles.cardIcon}
          />
          <View>{data?.id ? `${data?.name}#${data?.id}` : "???"}</View>
        </View>

        {isQuestion && <View className={styles.cardHeaderRight}>题目</View>}
      </View>

      <View className={styles.cardInfo}>
        {cardInfos.map((i) => (
          <View
            className={styles.cardInfoItem}
            style={{
              background:
                data?.[i?.key] === ans?.[i?.key] &&
                (data?.[i?.key] || data?.[i?.key] === false)
                  ? "linear-gradient(135deg, #f3b47a 0%, #db924b 100%)"
                  : "",
            }}
          >
            <View style={{ fontWeight: "bold" }}>{i?.label}</View>
            <View>
              {typeof data?.[i?.key] === "boolean"
                ? data?.[i?.key]
                  ? "能"
                  : "不能"
                : data?.[i?.key] || "?"}
            </View>
          </View>
        ))}
      </View>
    </View>
  );
};

export default PokemonCard;
