import { Button, Input, Text, View } from "@tarojs/components";
import Taro from "@tarojs/taro";
import { useEffect, useMemo, useRef, useState } from "react";
import { usePageShare } from "../../hooks/usePageShare";
import { useTheme } from "../../hooks/useTheme";

import styles from "./index.module.less";

type Puzzle = {
  puzzle: number[];
  solution: number[];
  givens: boolean[];
};

type UnitStatus = "idle" | "conflict";

const SIZE = 9;
const CELL_COUNT = SIZE * SIZE;
const DEFAULT_EMPTY_COUNT = 45;
const MIN_EMPTY_COUNT = 1;
const MAX_EMPTY_COUNT = 50;
const NUMBERS = [1, 2, 3, 4, 5, 6, 7, 8, 9];

const shuffle = <T,>(items: T[]) => {
  const next = [...items];
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
};

const getBoxStart = (index: number) => {
  const row = Math.floor(index / SIZE);
  const col = index % SIZE;
  return {
    row: Math.floor(row / 3) * 3,
    col: Math.floor(col / 3) * 3,
  };
};

const canPlace = (grid: number[], index: number, value: number) => {
  const row = Math.floor(index / SIZE);
  const col = index % SIZE;

  for (let i = 0; i < SIZE; i += 1) {
    if (grid[row * SIZE + i] === value || grid[i * SIZE + col] === value) {
      return false;
    }
  }

  const box = getBoxStart(index);
  for (let r = 0; r < 3; r += 1) {
    for (let c = 0; c < 3; c += 1) {
      if (grid[(box.row + r) * SIZE + box.col + c] === value) {
        return false;
      }
    }
  }

  return true;
};

const fillGrid = (grid: number[]) => {
  const index = grid.findIndex((value) => value === 0);
  if (index === -1) return true;

  return shuffle(NUMBERS).some((value) => {
    if (!canPlace(grid, index, value)) return false;

    grid[index] = value;
    if (fillGrid(grid)) return true;
    grid[index] = 0;
    return false;
  });
};

const getCandidates = (grid: number[], index: number) =>
  NUMBERS.filter((value) => canPlace(grid, index, value));

const findBestEmptyCell = (grid: number[]) => {
  let bestIndex = -1;
  let bestCandidates: number[] = [];

  for (let index = 0; index < CELL_COUNT; index += 1) {
    if (grid[index] !== 0) continue;

    const candidates = getCandidates(grid, index);
    if (bestIndex === -1 || candidates.length < bestCandidates.length) {
      bestIndex = index;
      bestCandidates = candidates;
      if (candidates.length <= 1) break;
    }
  }

  return { index: bestIndex, candidates: bestCandidates };
};

const countSolutions = (source: number[], limit = 2) => {
  const grid = [...source];
  let count = 0;

  const solve = () => {
    if (count >= limit) return;

    const { index, candidates } = findBestEmptyCell(grid);
    if (index === -1) {
      count += 1;
      return;
    }

    for (const value of candidates) {
      grid[index] = value;
      solve();
      grid[index] = 0;
      if (count >= limit) return;
    }
  };

  solve();
  return count;
};

const createPuzzle = (emptyCount: number): Puzzle => {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const solution = Array(CELL_COUNT).fill(0);
    fillGrid(solution);

    const puzzle = [...solution];
    let removed = 0;

    for (const index of shuffle([...Array(CELL_COUNT).keys()])) {
      if (removed >= emptyCount) break;

      const current = puzzle[index];
      puzzle[index] = 0;

      if (countSolutions(puzzle) === 1) {
        removed += 1;
      } else {
        puzzle[index] = current;
      }
    }

    if (removed === emptyCount) {
      return {
        puzzle,
        solution,
        givens: puzzle.map((value) => value !== 0),
      };
    }
  }

  return createPuzzle(emptyCount);
};

const getUnitValues = (grid: number[], type: "row" | "col" | "box", index: number) => {
  if (type === "row") {
    return Array.from({ length: SIZE }, (_, col) => grid[index * SIZE + col]);
  }

  if (type === "col") {
    return Array.from({ length: SIZE }, (_, row) => grid[row * SIZE + index]);
  }

  const startRow = Math.floor(index / 3) * 3;
  const startCol = (index % 3) * 3;
  const values: number[] = [];

  for (let r = 0; r < 3; r += 1) {
    for (let c = 0; c < 3; c += 1) {
      values.push(grid[(startRow + r) * SIZE + startCol + c]);
    }
  }

  return values;
};

const getUnitStatus = (values: number[]): UnitStatus => {
  const filled = values.filter(Boolean);
  const hasConflict = new Set(filled).size !== filled.length;
  if (hasConflict) return "conflict";
  return "idle";
};

const createStatuses = (grid: number[]) => {
  const cellStatuses: UnitStatus[] = Array(CELL_COUNT).fill("idle");

  const applyUnit = (indexes: number[], status: UnitStatus) => {
    if (status === "idle") return;

    indexes.forEach((index) => {
      if (status === "conflict" || cellStatuses[index] !== "conflict") {
        cellStatuses[index] = status;
      }
    });
  };

  for (let row = 0; row < SIZE; row += 1) {
    const indexes = Array.from({ length: SIZE }, (_, col) => row * SIZE + col);
    applyUnit(indexes, getUnitStatus(getUnitValues(grid, "row", row)));
  }

  for (let col = 0; col < SIZE; col += 1) {
    const indexes = Array.from({ length: SIZE }, (_, row) => row * SIZE + col);
    applyUnit(indexes, getUnitStatus(getUnitValues(grid, "col", col)));
  }

  for (let box = 0; box < SIZE; box += 1) {
    const startRow = Math.floor(box / 3) * 3;
    const startCol = (box % 3) * 3;
    const indexes: number[] = [];

    for (let r = 0; r < 3; r += 1) {
      for (let c = 0; c < 3; c += 1) {
        indexes.push((startRow + r) * SIZE + startCol + c);
      }
    }

    applyUnit(indexes, getUnitStatus(getUnitValues(grid, "box", box)));
  }

  return cellStatuses;
};

const isSolved = (grid: number[], solution: number[]) =>
  grid.every((value, index) => value === solution[index]);

export default function Sudoku() {
  usePageShare({
    title: "数独",
    path: "/pages/Sudoku/index",
  });

  const [emptyCount, setEmptyCount] = useState(DEFAULT_EMPTY_COUNT);
  const [puzzle, setPuzzle] = useState(() => createPuzzle(DEFAULT_EMPTY_COUNT));
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [grid, setGrid] = useState(() => [...puzzle.puzzle]);
  const [isShowingAnswer, setIsShowingAnswer] = useState(false);
  const [isDifficultyModalVisible, setIsDifficultyModalVisible] = useState(false);
  const [difficultyInput, setDifficultyInput] = useState(String(DEFAULT_EMPTY_COUNT));
  const [completeFlashIndex, setCompleteFlashIndex] = useState(-1);
  const completeFlashTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { themeClassName } = useTheme();

  const statuses = useMemo(() => createStatuses(grid), [grid]);
  const availableNumbers = useMemo(() => {
    if (selectedIndex < 0 || puzzle.givens[selectedIndex]) {
      return new Set(NUMBERS);
    }

    if (grid[selectedIndex] !== 0) {
      return new Set<number>();
    }

    const nextGrid = [...grid];
    nextGrid[selectedIndex] = 0;
    return new Set(NUMBERS.filter((value) => canPlace(nextGrid, selectedIndex, value)));
  }, [grid, puzzle.givens, selectedIndex]);

  useEffect(
    () => () => {
      if (completeFlashTimerRef.current) {
        clearTimeout(completeFlashTimerRef.current);
      }
    },
    []
  );

  const playCompleteFlash = (index: number) => {
    if (completeFlashTimerRef.current) {
      clearTimeout(completeFlashTimerRef.current);
    }

    setCompleteFlashIndex(-1);
    setTimeout(() => {
      setCompleteFlashIndex(index);
      completeFlashTimerRef.current = setTimeout(() => {
        setCompleteFlashIndex(-1);
        completeFlashTimerRef.current = null;
      }, 1180);
    }, 16);
  };

  const startNewPuzzle = (nextEmptyCount = emptyCount) => {
    const nextPuzzle = createPuzzle(nextEmptyCount);
    setPuzzle(nextPuzzle);
    setGrid([...nextPuzzle.puzzle]);
    setSelectedIndex(-1);
    setIsShowingAnswer(false);
    setCompleteFlashIndex(-1);
  };

  const confirmReset = () => {
    Taro.showModal({
      title: "重置当前数独？",
      content: "会清空你填入的数字，题目保持不变。",
      confirmText: "重置",
      success: (res) => {
        if (!res.confirm) return;
        setGrid([...puzzle.puzzle]);
        setSelectedIndex(-1);
        setIsShowingAnswer(false);
        setCompleteFlashIndex(-1);
      },
    });
  };

  const confirmNewGame = () => {
    Taro.showModal({
      title: "开始新的游戏？",
      content: `会生成一盘新的唯一解数独。当前空格数：${emptyCount}`,
      confirmText: "开始",
      success: (res) => {
        if (res.confirm) startNewPuzzle();
      },
    });
  };

  const openDifficultyModal = () => {
    setDifficultyInput(String(emptyCount));
    setIsDifficultyModalVisible(true);
  };

  const applyDifficulty = () => {
    const nextEmptyCount = Number(difficultyInput.trim());
    if (
      !Number.isInteger(nextEmptyCount) ||
      nextEmptyCount < MIN_EMPTY_COUNT ||
      nextEmptyCount > MAX_EMPTY_COUNT
    ) {
      Taro.showToast({
        title: "请输入 1-50 的整数",
        icon: "none",
      });
      return;
    }

    setIsDifficultyModalVisible(false);
    setEmptyCount(nextEmptyCount);
    startNewPuzzle(nextEmptyCount);
  };

  const fillSelectedCell = (value: number) => {
    if (selectedIndex < 0 || puzzle.givens[selectedIndex]) {
      Taro.showToast({
        title: "请选择可填写的格子",
        icon: "none",
      });
      return;
    }

    const nextGrid = [...grid];
    nextGrid[selectedIndex] = value;
    setGrid(nextGrid);

    if (isSolved(nextGrid, puzzle.solution)) {
      playCompleteFlash(selectedIndex);
      return;
    }
  };

  const clearSelectedCell = () => {
    if (selectedIndex < 0 || puzzle.givens[selectedIndex]) {
      Taro.showToast({
        title: "请选择可填写的格子",
        icon: "none",
      });
      return;
    }

    const nextGrid = [...grid];
    nextGrid[selectedIndex] = 0;
    setGrid(nextGrid);
    setCompleteFlashIndex(-1);
  };

  return (
    <View className={`${styles.sudokuPage} ${themeClassName}`}>
      <View className={styles.actionRow}>
        <Button
          className={styles.actionButton}
          onTouchStart={() => setIsShowingAnswer(true)}
          onTouchEnd={() => setIsShowingAnswer(false)}
          onTouchCancel={() => setIsShowingAnswer(false)}
        >
          查看答案
        </Button>
        <Button className={styles.actionButton} onClick={openDifficultyModal}>
          难度设置
        </Button>
        <Button className={styles.actionButton} onClick={confirmReset}>
          重置
        </Button>
        <Button className={styles.actionButton} onClick={confirmNewGame}>
          新的游戏
        </Button>
      </View>

      <View className={styles.gameArea}>
        <View className={styles.board}>
          {(isShowingAnswer ? puzzle.solution : grid).map((value, index) => {
            const row = Math.floor(index / SIZE);
            const col = index % SIZE;
            const isGiven = puzzle.givens[index];
            const answerPreviewCell = isShowingAnswer && !isGiven;
            const isSelected = selectedIndex === index;
            const isRelated =
              selectedIndex >= 0 &&
              (Math.floor(selectedIndex / SIZE) === row ||
                selectedIndex % SIZE === col ||
                (Math.floor(selectedIndex / 27) === Math.floor(row / 3) &&
                  Math.floor((selectedIndex % SIZE) / 3) === Math.floor(col / 3)));

            return (
              <View
                key={index}
                className={`${styles.cell} ${isGiven ? styles.givenCell : ""} ${
                  value ? styles.filledCell : ""
                } ${answerPreviewCell ? styles.answerPreviewCell : ""} ${
                  isSelected ? styles.selectedCell : ""
                } ${
                  isRelated ? styles.relatedCell : ""
                } ${statuses[index] === "conflict" ? styles.conflictCell : ""} ${
                  completeFlashIndex === index ? styles.completeFlashCell : ""
                }`}
                onClick={() => {
                  if (!isGiven) {
                    setSelectedIndex((current) => (current === index ? -1 : index));
                  }
                }}
              >
                <Text className={isGiven ? styles.givenText : styles.inputText}>
                  {value || ""}
                </Text>
              </View>
            );
          })}
        </View>

        <View className={styles.numberPad}>
          {NUMBERS.map((value) => (
            <Button
              key={value}
              className={`${styles.numberButton} ${
                availableNumbers.has(value) ? "" : styles.unavailableNumberButton
              }`}
              onClick={() => fillSelectedCell(value)}
            >
              {value}
            </Button>
          ))}
          <Button
            className={`${styles.numberButton} ${styles.deleteButton}`}
            onClick={clearSelectedCell}
          >
            <Text className={styles.deleteIcon}>⌫</Text>
          </Button>
        </View>
      </View>

      {isDifficultyModalVisible ? (
        <View className={styles.modalMask}>
          <View className={styles.modalPanel}>
            <Text className={styles.modalTitle}>难度设置</Text>
            <Text className={styles.modalDesc}>
              请输入空格数，空格数越多，难度越高，可输入范围为 1-50。
            </Text>
            <Input
              className={styles.modalInput}
              type="number"
              value={difficultyInput}
              focus
              onInput={(event) => setDifficultyInput(event.detail.value)}
            />
            <View className={styles.modalActions}>
              <Button
                className={`${styles.modalButton} ${styles.modalCancelButton}`}
                onClick={() => setIsDifficultyModalVisible(false)}
              >
                取消
              </Button>
              <Button className={styles.modalButton} onClick={applyDifficulty}>
                生成
              </Button>
            </View>
          </View>
        </View>
      ) : null}
    </View>
  );
}
