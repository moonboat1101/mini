import Taro from "@tarojs/taro";
import { useEffect, useState } from "react";

export type MoonTheme = "dark" | "light";

const THEME_STORAGE_KEY = "moonboatTheme";
const LIGHT_THEME_CLASS = "moon-theme-light";
const DARK_THEME_CLASS = "moon-theme-dark";
const LIGHT_THEME_BACKGROUND = "#fffaf1";
const DARK_THEME_BACKGROUND = "#30231d";

const isMoonTheme = (value: unknown): value is MoonTheme =>
  value === "dark" || value === "light";

const getStoredTheme = (): MoonTheme => {
  const theme = Taro.getStorageSync(THEME_STORAGE_KEY);
  return isMoonTheme(theme) ? theme : "dark";
};

const applyNavigationTheme = (theme: MoonTheme) => {
  const backgroundColor = getThemeBackground(theme);

  Taro.setNavigationBarColor({
    frontColor: theme === "light" ? "#000000" : "#ffffff",
    backgroundColor,
  });

  Taro.setBackgroundColor?.({
    backgroundColor,
    backgroundColorTop: backgroundColor,
    backgroundColorBottom: backgroundColor,
  });
};

export const getThemeBackground = (theme: MoonTheme) =>
  theme === "light" ? LIGHT_THEME_BACKGROUND : DARK_THEME_BACKGROUND;

export const getThemeClassName = (theme: MoonTheme) =>
  theme === "light" ? LIGHT_THEME_CLASS : DARK_THEME_CLASS;

export function useTheme() {
  const [theme, setTheme] = useState<MoonTheme>(getStoredTheme);

  useEffect(() => {
    applyNavigationTheme(theme);
  }, [theme]);

  const setMoonTheme = (nextTheme: MoonTheme) => {
    Taro.setStorageSync(THEME_STORAGE_KEY, nextTheme);
    setTheme(nextTheme);
  };

  const toggleTheme = () => {
    setTheme((current) => {
      const nextTheme: MoonTheme = current === "dark" ? "light" : "dark";
      Taro.setStorageSync(THEME_STORAGE_KEY, nextTheme);
      return nextTheme;
    });
  };

  return {
    theme,
    themeClassName: getThemeClassName(theme),
    setTheme: setMoonTheme,
    toggleTheme,
  };
}
