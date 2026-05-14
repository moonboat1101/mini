import Taro from "@tarojs/taro";
import { CSSProperties, useCallback, useEffect, useRef, useState } from "react";

type KeyboardHeightResult = {
  height?: number;
};

type InputFocusEvent = {
  detail?: {
    height?: number;
  };
};

type KeyboardFloatingOptions = {
  gap?: number;
};

const DEFAULT_GAP = 8;

const getRectBottom = (rect: unknown) => {
  const targetRect = Array.isArray(rect) ? rect[0] : rect;

  if (
    targetRect &&
    typeof targetRect === "object" &&
    "bottom" in targetRect &&
    typeof targetRect.bottom === "number"
  ) {
    return targetRect.bottom;
  }

  return undefined;
};

export function useKeyboardFloating(
  targetId: string,
  options: KeyboardFloatingOptions = {},
) {
  const gap = options.gap ?? DEFAULT_GAP;
  const [lift, setLiftState] = useState(0);
  const liftRef = useRef(0);
  const baseBottomRef = useRef<number>();
  const focusedRef = useRef(false);
  const keyboardHeightRef = useRef(0);

  const setLift = useCallback((nextLift: number) => {
    liftRef.current = nextLift;
    setLiftState(nextLift);
  }, []);

  const updateLift = useCallback(
    (keyboardHeight = keyboardHeightRef.current) => {
      if (!focusedRef.current || keyboardHeight <= 0) {
        setLift(0);
        return;
      }

      Taro.createSelectorQuery()
        .select(`#${targetId}`)
        .boundingClientRect((rect) => {
          const measuredBottom = getRectBottom(rect);
          const windowHeight = Taro.getSystemInfoSync().windowHeight;

          if (!measuredBottom || !windowHeight) return;

          const baseBottom = baseBottomRef.current ?? measuredBottom + liftRef.current;
          baseBottomRef.current = baseBottom;

          const keyboardTop = windowHeight - keyboardHeight;
          const nextLift = Math.max(0, Math.ceil(baseBottom - keyboardTop + gap));
          setLift(nextLift);
        })
        .exec();
    },
    [gap, setLift, targetId],
  );

  const scheduleUpdate = useCallback(
    (keyboardHeight?: number) => {
      if (typeof keyboardHeight === "number") {
        keyboardHeightRef.current = keyboardHeight;
      }

      updateLift();
      setTimeout(() => updateLift(), 12);
      setTimeout(() => updateLift(), 48);
    },
    [updateLift],
  );

  useEffect(() => {
    const handleKeyboardHeightChange = (result: KeyboardHeightResult) => {
      const keyboardHeight = result.height || 0;
      keyboardHeightRef.current = keyboardHeight;

      if (!focusedRef.current) return;

      if (keyboardHeight <= 0) {
        setLift(0);
        return;
      }

      scheduleUpdate(keyboardHeight);
    };

    Taro.onKeyboardHeightChange?.(handleKeyboardHeightChange);

    return () => {
      Taro.offKeyboardHeightChange?.(handleKeyboardHeightChange);
    };
  }, [scheduleUpdate, setLift]);

  const onFocus = useCallback(
    (event?: InputFocusEvent) => {
      focusedRef.current = true;
      baseBottomRef.current = undefined;
      setLift(0);

      const keyboardHeight = event?.detail?.height || keyboardHeightRef.current;
      scheduleUpdate(keyboardHeight);
    },
    [scheduleUpdate, setLift],
  );

  const onBlur = useCallback(() => {
    focusedRef.current = false;
    keyboardHeightRef.current = 0;
    baseBottomRef.current = undefined;
    setLift(0);
  }, [setLift]);

  const floatingStyle: CSSProperties = lift
    ? {
        transform: `translateY(-${lift}px)`,
      }
    : {};

  return {
    targetId,
    floatingStyle,
    inputKeyboardProps: {
      adjustPosition: false,
      cursorSpacing: 0,
      onFocus,
      onBlur,
    },
  };
}
