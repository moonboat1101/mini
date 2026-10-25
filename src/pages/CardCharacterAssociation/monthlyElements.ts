import type { ElementId } from "./data";
import { elements } from "./data";

// 按 YYYY-MM 维护幻想真境剧诗限定元素；未配置的月份默认全选。
export const MONTHLY_THEATER_ELEMENTS: Readonly<Record<string, readonly ElementId[]>> = {
  "2026-10": ["hydro", "cryo", "anemo"],
  "2026-11": ["hydro", "electro", "geo"],
};

export function getDefaultMonthlyElements(date = new Date()): ElementId[] {
  const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
  const configured = MONTHLY_THEATER_ELEMENTS[month];
  return configured ? [...configured] : elements.map((element) => element.id);
}
