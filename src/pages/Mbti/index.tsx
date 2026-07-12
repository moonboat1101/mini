import { Button, Text, View } from "@tarojs/components";
import { useMemo, useState } from "react";

import { usePageShare } from "../../hooks/usePageShare";
import { useTheme } from "../../hooks/useTheme";
import { mbtiQuestions, typeDescriptions } from "./constants";
import styles from "./index.module.less";

type Answer = "left" | "right";
type Scores = Record<string, number>;

const dimensionLabels = ["能量来源", "信息获取", "决策偏好", "生活方式"];

export default function Mbti() {
  usePageShare({ title: "MBTI 性格偏好测试", path: "/pages/Mbti/index" });
  const { themeClassName } = useTheme();
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<number, Answer>>({});
  const [submitted, setSubmitted] = useState(false);
  const [incoming, setIncoming] = useState<number | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const question = mbtiQuestions[current];
  const isFinished = Object.keys(answers).length === mbtiQuestions.length;
  const canGoNext =
    !isTransitioning &&
    current < mbtiQuestions.length - 1 &&
    Boolean(answers[current]);
  const scores = useMemo(() => {
    const result: Scores = { E: 0, I: 0, S: 0, N: 0, T: 0, F: 0, J: 0, P: 0 };
    Object.entries(answers).forEach(([index, answer]) => {
      const item = mbtiQuestions[Number(index)];
      result[answer === "left" ? item.left.score : item.right.score] += 1;
    });
    return result;
  }, [answers]);
  const type = `${scores.E >= scores.I ? "E" : "I"}${scores.S >= scores.N ? "S" : "N"}${scores.T >= scores.F ? "T" : "F"}${scores.J >= scores.P ? "J" : "P"}`;
  const result = typeDescriptions[type];

  const moveToNext = () => {
    if (isTransitioning || current >= mbtiQuestions.length - 1) return;
    const next = current + 1;
    setIsTransitioning(true);
    setIncoming(next);
    setTimeout(() => {
      setCurrent(next);
      setIncoming(null);
      setIsTransitioning(false);
    }, 340);
  };

  const selectAnswer = (answer: Answer) => {
    setAnswers((previous) => ({ ...previous, [current]: answer }));
    if (current < mbtiQuestions.length - 1) {
      moveToNext();
    }
  };

  const restart = () => {
    setCurrent(0);
    setAnswers({});
    setSubmitted(false);
  };

  if (submitted) {
    const axis = [
      ["E", "I", "外向 E", "内向 I"],
      ["S", "N", "实感 S", "直觉 N"],
      ["T", "F", "思考 T", "情感 F"],
      ["J", "P", "判断 J", "感知 P"],
    ] as const;
    return (
      <View className={`${styles.page} ${themeClassName}`}>
        <View className={styles.resultCard}>
          <Text className={styles.eyebrow}>你的性格偏好类型</Text>
          <Text className={styles.type}>{type}</Text>
          <Text className={styles.resultTitle}>{result.title}</Text>
          <Text className={styles.summary}>{result.summary}</Text>
          <View className={styles.strengthBox}>
            <Text className={styles.strengthLabel}>可能的优势</Text>
            <Text className={styles.strengths}>{result.strengths}</Text>
          </View>
          <View className={styles.axisList}>
            {axis.map(([left, right, leftLabel, rightLabel]) => {
              const total = scores[left] + scores[right];
              const leftPercent = total ? Math.round((scores[left] / total) * 100) : 50;
              const favored = scores[left] >= scores[right];
              return (
                <View className={styles.axisItem} key={left}>
                  <View className={styles.axisHeader}>
                    <Text className={favored ? styles.axisActive : ""}>{leftLabel} {scores[left]}</Text>
                    <Text className={!favored ? styles.axisActive : ""}>{rightLabel} {scores[right]}</Text>
                  </View>
                  <View className={styles.axisBar}><View className={styles.axisFill} style={{ width: `${leftPercent}%` }} /></View>
                </View>
              );
            })}
          </View>
          <Text className={styles.note}>结果反映当前偏好，不代表能力、限制或专业心理评估。</Text>
        </View>
        <Button className={styles.restartButton} onClick={restart}>再测一次</Button>
      </View>
    );
  }

  return (
    <View className={`${styles.page} ${themeClassName}`}>
      <View className={styles.topBar}>
        <Text className={styles.progressText}>第 {current + 1} / {mbtiQuestions.length} 题</Text>
        <Text className={styles.dimension}>{dimensionLabels[Math.floor(current / 8)]}</Text>
      </View>
      <View className={styles.progressTrack}><View className={styles.progressFill} style={{ width: `${((current + 1) / mbtiQuestions.length) * 100}%` }} /></View>
      <View className={styles.questionStage}>
        <View className={`${styles.questionCard} ${isTransitioning ? styles.questionLeaving : ""}`}>
          <Text className={styles.hint}>请选择更符合你平时状态的一项</Text>
          <Text className={styles.question}>{question.prompt}</Text>
          {(["left", "right"] as Answer[]).map((answer) => (
            <View
              key={answer}
              className={`${styles.option} ${answers[current] === answer ? styles.optionSelected : ""}`}
              onClick={() => !isTransitioning && selectAnswer(answer)}
            >
              <View className={styles.optionMark}><Text>{answer === "left" ? "A" : "B"}</Text></View>
              <Text className={styles.optionText}>{question[answer].text}</Text>
            </View>
          ))}
        </View>
        {incoming !== null ? (
          <View className={`${styles.questionCard} ${styles.questionEntering}`}>
            <Text className={styles.hint}>请选择更符合你平时状态的一项</Text>
            <Text className={styles.question}>{mbtiQuestions[incoming].prompt}</Text>
            {(["left", "right"] as Answer[]).map((answer) => (
              <View className={styles.option} key={answer}>
                <View className={styles.optionMark}><Text>{answer === "left" ? "A" : "B"}</Text></View>
                <Text className={styles.optionText}>{mbtiQuestions[incoming][answer].text}</Text>
              </View>
            ))}
          </View>
        ) : null}
      </View>
      <View className={`${styles.footer} ${!canGoNext && current < mbtiQuestions.length - 1 ? styles.footerSingle : ""}`}>
        <Button className={styles.previousButton} disabled={current === 0 || isTransitioning} onClick={() => setCurrent((value) => value - 1)}>上一题</Button>
        {canGoNext ? (
          <Button className={styles.nextButton} disabled={isTransitioning} onClick={moveToNext}>下一题</Button>
        ) : null}
        {current === mbtiQuestions.length - 1 ? (
          <Button className={styles.submitButton} disabled={!isFinished} onClick={() => setSubmitted(true)}>提交</Button>
        ) : null}
      </View>
    </View>
  );
}
