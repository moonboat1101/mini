export default defineAppConfig({
  lazyCodeLoading: "requiredComponents",
  pages: [
    "pages/index/index",
    "pages/Shizhi/index",
    "pages/Genshin/index",
    "pages/HanDou/index",
    "pages/Sudoku/index",
    "pages/Pokemon/index",
    "pages/ScriptRecord/index",
    "pages/CardExchangeMarket/index",
    "pages/About/index",
  ],
  window: {
    backgroundTextStyle: "dark",
    backgroundColor: "#FFFFFF",
    backgroundColorTop: "#FFFFFF",
    backgroundColorBottom: "#FFFFFF",
    navigationBarBackgroundColor: "#FFFFFF",
    navigationBarTextStyle: "black",
  },
});
