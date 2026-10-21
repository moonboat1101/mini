import { View } from "@tarojs/components";
import Taro from "@tarojs/taro";
import { useEffect, useRef, useState } from "react";
import styles from "./index.module.less";

let nextNavigationId = 0;

type Props = {
  className: string;
  items: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
};

export default function SlidingNavigation({ className, items, value, onChange }: Props) {
  const [id] = useState(() => `sliding-navigation-${++nextNavigationId}`);
  const [position, setPosition] = useState<number | null>(null);
  const [pressed, setPressed] = useState(false);
  const gesture = useRef<{ startX: number; x: number; dragging: boolean; position: number | null } | null>(null);
  const bounds = useRef<{ left: number; width: number } | null>(null);
  const ignoreClickUntil = useRef(0);
  const activeIndex = Math.max(0, items.findIndex((item) => item.value === value));

  const updatePosition = (x: number) => {
    const rect = bounds.current;
    if (!rect || !gesture.current?.dragging || rect.width <= 0) return;
    const next = Math.max(0, Math.min(items.length - 1, (x - rect.left) / (rect.width / items.length) - 0.5));
    gesture.current.position = next;
    setPosition(next);
  };

  const measure = () => {
    Taro.createSelectorQuery().select(`#${id}`).boundingClientRect((rect) => {
      if (!rect || Array.isArray(rect)) return;
      bounds.current = { left: rect.left, width: rect.width };
      if (gesture.current) updatePosition(gesture.current.x);
    }).exec();
  };

  useEffect(() => {
    Taro.nextTick(measure);
  }, []);

  const finish = (cancelled: boolean) => {
    const current = gesture.current;
    gesture.current = null;
    setPressed(false);
    setPosition(null);
    if (!current) return;
    const rect = bounds.current;
    const target = current.dragging ? current.position : rect && rect.width > 0
      ? Math.max(0, Math.min(items.length - 1, Math.floor((current.x - rect.left) / (rect.width / items.length))))
      : null;
    // 触摸已处理时忽略后续合成点击，避免拖动松手后又跳回起始项。
    if (cancelled || target !== null) ignoreClickUntil.current = Date.now() + 500;
    if (!cancelled && target !== null) {
      const next = items[Math.round(target)];
      if (next.value !== value) onChange(next.value);
    }
  };

  const previewIndex = Math.round(position ?? activeIndex);
  return (
    <View className={className}>
      <View
        id={id}
        className={styles.track}
        catchMove
        onTouchStart={(event) => {
          const touch = event.touches[0];
          if (!touch) return;
          gesture.current = { startX: touch.clientX, x: touch.clientX, dragging: false, position: null };
          setPressed(true);
          measure();
        }}
        onTouchMove={(event) => {
          const touch = event.touches[0];
          if (!touch || !gesture.current) return;
          gesture.current.x = touch.clientX;
          if (Math.abs(touch.clientX - gesture.current.startX) > 6) gesture.current.dragging = true;
          updatePosition(touch.clientX);
        }}
        onTouchEnd={() => finish(false)}
        onTouchCancel={() => finish(true)}
      >
        <View
          className={`${styles.indicator} ${pressed ? styles.pressed : ""} ${position !== null ? styles.dragging : ""}`}
          style={{ width: `${100 / items.length}%`, transform: `translateX(${(position ?? activeIndex) * 100}%)` }}
        ><View className={styles.pill} /></View>
        {items.map((item, index) => (
          <View
            key={item.value}
            className={`${styles.item} ${index === previewIndex ? styles.active : ""}`}
            onClick={() => {
              if (Date.now() < ignoreClickUntil.current) return;
              if (item.value !== value) onChange(item.value);
            }}
          >{item.label}</View>
        ))}
      </View>
    </View>
  );
}
