import { View, Text, Input, Button } from "@tarojs/components";
import Taro from "@tarojs/taro";
import { pinyin } from "pinyin-pro";
import { useEffect, useState } from "react";

import { idioms } from "./constants";
import { usePageShare } from "../../hooks/usePageShare";
import { useKeyboardFloating } from "../../hooks/useKeyboardFloating";
import { useTheme } from "../../hooks/useTheme";
import styles from "./index.module.less";

type FeedbackStatus = "correct" | "present" | "absent" | "pending";
type FeedbackKey = "text" | "initial" | "final";

type IdiomChar = {
  text: string;
  initial: string;
  final: string;
  tone: string;
};

type IdiomItem = {
  word: string;
  chars: IdiomChar[];
};

type GuessCell = IdiomChar & {
  status: Record<FeedbackKey, FeedbackStatus>;
};

type GameState = "playing" | "won" | "lost";

type SavedGame = {
  answerIndex: number;
  input: string;
  guesses: GuessCell[][];
  gameState: GameState;
  isMasked: boolean;
};

const MAX_ATTEMPTS = 10;
const HANDOU_GAME_STORAGE_KEY = "handou-game";
const FOUR_HANZI_PATTERN = /^[\u3400-\u4DBF\u4E00-\u9FFF\uF900-\uFAFF]{4}$/;
const PINYIN_INITIALS = [
  "zh",
  "ch",
  "sh",
  "b",
  "p",
  "m",
  "f",
  "d",
  "t",
  "n",
  "l",
  "g",
  "k",
  "h",
  "j",
  "q",
  "x",
  "r",
  "z",
  "c",
  "s",
  "y",
  "w",
];
const PINYIN_FINALS = [
  "a",
  "o",
  "e",
  "ai",
  "ei",
  "ao",
  "ou",
  "an",
  "en",
  "ang",
  "eng",
  "er",
  "i",
  "ia",
  "ie",
  "iao",
  "iu",
  "ian",
  "in",
  "iang",
  "ing",
  "iong",
  "u",
  "ua",
  "uo",
  "uai",
  "ui",
  "uan",
  "un",
  "uang",
  "ong",
  "\u00fc",
  "\u00fce",
  "\u00fcan",
  "\u00fcn",
];

const getRandomAnswerIndex = () => Math.floor(Math.random() * idioms.length);

const getSavedGame = (): SavedGame | null => {
  try {
    const saved = Taro.getStorageSync(HANDOU_GAME_STORAGE_KEY) as Partial<SavedGame>;
    const hasValidAnswerIndex =
      typeof saved?.answerIndex === "number" &&
      Number.isInteger(saved.answerIndex) &&
      saved.answerIndex >= 0 &&
      saved.answerIndex < idioms.length;
    const hasValidGameState =
      saved?.gameState === "playing" || saved?.gameState === "won" || saved?.gameState === "lost";

    if (
      !hasValidAnswerIndex ||
      !hasValidGameState ||
      typeof saved.input !== "string" ||
      !Array.isArray(saved.guesses) ||
      typeof saved.isMasked !== "boolean"
    ) {
      return null;
    }

    return saved as SavedGame;
  } catch {
    return null;
  }
};

const saveGame = (game: SavedGame) => {
  if (game.input || game.guesses.length > 0) {
    Taro.setStorageSync(HANDOU_GAME_STORAGE_KEY, game);
    return;
  }

  Taro.removeStorageSync(HANDOU_GAME_STORAGE_KEY);
};

const createStatus = (): Record<FeedbackKey, FeedbackStatus> => ({
  text: "pending",
  initial: "pending",
  final: "pending",
});

const getStrongerStatus = (current: FeedbackStatus, next: FeedbackStatus) => {
  const weights: Record<FeedbackStatus, number> = {
    pending: 0,
    absent: 1,
    present: 2,
    correct: 3,
  };

  return weights[next] > weights[current] ? next : current;
};

const splitPinyin = (syllable: string) => {
  const normalized = syllable.toLowerCase();
  const initial = PINYIN_INITIALS.find((item) => normalized.startsWith(item)) || "";

  return {
    initial,
    final: normalized.slice(initial.length),
  };
};

const getCharInfo = (text: string, syllable: string): IdiomChar => {
  if (!/^[a-z\u00fc]+$/.test(syllable)) {
    return {
      text,
      initial: "",
      final: "",
      tone: "",
    };
  }

  return {
    text,
    ...splitPinyin(syllable),
    tone: "",
  };
};

const resolveFieldStatus = (
  guesses: IdiomChar[],
  answer: IdiomItem,
  field: FeedbackKey
) => {
  const result: FeedbackStatus[] = Array(4).fill("absent");
  const rest = new Map<string, number>();

  guesses.forEach((char, index) => {
    const guessValue = char[field];
    if (guessValue && guessValue === answer.chars[index][field]) {
      result[index] = "correct";
      return;
    }

    const answerValue = answer.chars[index][field];
    rest.set(answerValue, (rest.get(answerValue) || 0) + 1);
  });

  guesses.forEach((char, index) => {
    if (result[index] === "correct") {
      return;
    }

    const guessValue = char[field];
    if (!guessValue) {
      return;
    }

    const count = rest.get(guessValue) || 0;
    if (count > 0) {
      result[index] = "present";
      rest.set(guessValue, count - 1);
    }
  });

  return result;
};

const getFeedback = (guess: IdiomItem, answer: IdiomItem): GuessCell[] => {
  const statuses = guess.chars.map(() => createStatus());
  const keys: FeedbackKey[] = ["text", "initial", "final"];

  keys.forEach((key) => {
    const fieldStatus = resolveFieldStatus(guess.chars, answer, key);
    fieldStatus.forEach((status, index) => {
      statuses[index][key] = status;
    });
  });

  return guess.chars.map((char, index) => ({
    ...char,
    status: statuses[index],
  }));
};

const createGuess = (word: string): IdiomItem => {
  const syllables = pinyin(word, {
    toneType: "none",
    type: "array",
  });

  return {
    word,
    chars: Array.from(word).map((text, index) => getCharInfo(text, syllables[index] || "")),
  };
};

const getHintStatuses = (guesses: GuessCell[][], key: "initial" | "final") => {
  const map: Record<string, FeedbackStatus> = {};

  guesses.forEach((row) => {
    row.forEach((cell) => {
      const value = cell[key];
      if (!value) {
        return;
      }

      map[value] = getStrongerStatus(map[value] || "pending", cell.status[key]);
    });
  });

  return map;
};

export default function HanDou() {
  usePageShare({
    title: "汉兜",
    path: "/pages/HanDou/index",
  });

  const [savedGame] = useState(getSavedGame);
  const [answerIndex, setAnswerIndex] = useState(
    () => savedGame?.answerIndex ?? getRandomAnswerIndex()
  );
  const [input, setInput] = useState(() => savedGame?.input ?? "");
  const [guesses, setGuesses] = useState<GuessCell[][]>(() => savedGame?.guesses ?? []);
  const [gameState, setGameState] = useState<GameState>(() => savedGame?.gameState ?? "playing");
  const [isMasked, setIsMasked] = useState(() => savedGame?.isMasked ?? false);
  const [showHints, setShowHints] = useState(false);
  const keyboardFloating = useKeyboardFloating("handou-footer-keyboard");
  const { themeClassName } = useTheme();

  useEffect(() => {
    saveGame({
      answerIndex,
      input,
      guesses,
      gameState,
      isMasked,
    });
  }, [answerIndex, gameState, guesses, input, isMasked]);

  const answer = createGuess(idioms[answerIndex]);
  const initialHintStatuses = getHintStatuses(guesses, "initial");
  const finalHintStatuses = getHintStatuses(guesses, "final");
  const renderHintChip = (
    value: string,
    statusMap: Record<string, FeedbackStatus>,
    prefix: string
  ) => {
    const status = statusMap[value] || "pending";

    return (
      <View
        key={`${prefix}-${value}`}
        className={`${styles.hintChip} ${styles[status]} ${
          status === "absent" ? styles.hiddenHintChip : ""
        }`}
      >
        {value}
      </View>
    );
  };

  const resetGame = () => {
    let nextIndex = getRandomAnswerIndex();
    if (nextIndex === answerIndex) {
      nextIndex = (nextIndex + 1) % idioms.length;
    }

    setAnswerIndex(nextIndex);
    setGuesses([]);
    setInput("");
    setGameState("playing");
    setIsMasked(false);
  };

  const submitGuess = () => {
    const guessText = input.trim();

    if (gameState !== "playing") {
      resetGame();
      return;
    }

    if (!FOUR_HANZI_PATTERN.test(guessText)) {
      Taro.showToast({
        title: "请输入四个汉字",
        icon: "none",
      });
      return;
    }

    const guess = createGuess(guessText);

    if (guesses.some((row) => row.map((cell) => cell.text).join("") === guessText)) {
      Taro.showToast({
        title: "这个成语已经猜过了",
        icon: "none",
      });
      return;
    }

    const nextGuesses = [...guesses, getFeedback(guess, answer)];
    setGuesses(nextGuesses);
    setInput("");

    if (guess.word === answer.word) {
      setGameState("won");
      Taro.showToast({
        title: "猜中了",
        icon: "success",
      });
      return;
    }

    if (nextGuesses.length >= MAX_ATTEMPTS) {
      setGameState("lost");
      Taro.showToast({
        title: `答案是${answer.word}`,
        icon: "none",
      });
    }
  };

  const handleInput = (nextInput: string) => {
    setInput(nextInput);
    // 立即保存首次输入，避免用户刚开始玩就切后台时 React 状态尚未来得及落盘。
    saveGame({
      answerIndex,
      input: nextInput,
      guesses,
      gameState,
      isMasked,
    });
  };

  const refreshQuestion = () => {
    const hasStarted = input.trim().length > 0 || guesses.length > 0;

    if (!hasStarted) {
      resetGame();
      return;
    }

    Taro.showModal({
      title: "换一题？",
      content: "当前输入和猜测记录将被清空。",
      confirmText: "刷新",
      confirmColor: "#c8853e",
    }).then(({ confirm }) => {
      if (confirm) {
        resetGame();
      }
    });
  };

  const handlePrimaryAction = () => {
    if (input.trim()) {
      submitGuess();
      return;
    }

    refreshQuestion();
  };

  return (
    <View className={`${styles.hanDou} ${themeClassName}`}>
      <View className={styles.ruleBox}>
        <View className={styles.ruleHeader} onClick={() => setShowHints((visible) => !visible)}>
          <Text className={styles.ruleTitle}>提示</Text>
          <View className={styles.ruleList}>
            <View className={styles.ruleItem}>
              <View className={`${styles.ruleSwatch} ${styles.correct}`} />
              <Text className={styles.ruleText}>正确</Text>
            </View>
            <View className={styles.ruleItem}>
              <View className={`${styles.ruleSwatch} ${styles.present}`} />
              <Text className={styles.ruleText}>含有但位置错误</Text>
            </View>
          </View>
          <Text className={styles.foldText}>{showHints ? "收起" : "展开"}</Text>
        </View>
        {showHints && (
        <View className={styles.hintBox}>
          <View className={styles.hintGroup}>
            <Text className={styles.hintLabel}>声母</Text>
            <View className={styles.hintList}>
              {PINYIN_INITIALS.map((item) =>
                renderHintChip(item, initialHintStatuses, "initial")
              )}
            </View>
          </View>
          <View className={styles.hintGroup}>
            <Text className={styles.hintLabel}>韵母</Text>
            <View className={styles.hintList}>
              {PINYIN_FINALS.map((item) => renderHintChip(item, finalHintStatuses, "final"))}
            </View>
          </View>
        </View>
        )}
      </View>

      <View className={`${styles.board} ${isMasked ? styles.maskedBoard : ""}`}>
        {guesses.map((row, rowIndex) => (
          <View key={`row-${rowIndex}`} className={styles.row}>
            {row.map((cell, cellIndex) => (
              <View key={`${rowIndex}-${cellIndex}`} className={styles.cell}>
                <View className={styles.parts}>
                  <View className={`${styles.part} ${styles[cell.status.initial]}`}>
                    {cell.initial}
                  </View>
                  <View className={`${styles.part} ${styles[cell.status.final]}`}>
                    {cell.final}
                  </View>
                </View>
                <View className={`${styles.hanzi} ${styles[cell.status.text]}`}>
                  <Text>{cell.text}</Text>
                </View>
              </View>
            ))}
          </View>
        ))}
      </View>

      <View
        id={keyboardFloating.targetId}
        className={`${styles.footer} ${gameState !== "playing" ? styles.endFooter : ""}`}
        style={keyboardFloating.floatingStyle}
      >
        {gameState === "playing" ? (
          <>
            <Input
              className={styles.input}
              value={input}
              {...keyboardFloating.inputKeyboardProps}
              confirmType='done'
              placeholder='输入四字成语'
              onInput={(event) => handleInput(event.detail.value)}
              onConfirm={handlePrimaryAction}
            />
            <Button className={styles.submitButton} onClick={handlePrimaryAction}>
              {input.trim() ? "提交" : "刷新"}
            </Button>
          </>
        ) : (
          <>
            <Button
              className={`${styles.submitButton} ${styles.endButton}`}
              onClick={() => setIsMasked((masked) => !masked)}
            >
              {isMasked ? "取消分享" : "分享"}
            </Button>
            <Button
              className={`${styles.submitButton} ${styles.endButton} ${styles.resetButton}`}
              onClick={resetGame}
            >
              再来一局
            </Button>
          </>
        )}
      </View>
    </View>
  );
}
