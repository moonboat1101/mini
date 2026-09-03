export default defineAppConfig({
  lazyCodeLoading: "requiredComponents",
  pages: [
    "pages/index/index",
    "pages/genshin/index",
    "pages/HanDou/index",
    "pages/Sudoku/index",
    "pages/Pokemon/index",
    "pages/ScriptRecord/index",
    "pages/QrCode/index",
    "pages/CardExchangeMarket/index",
    "pages/About/index",
    "pages/Membership/index",
  ],
  window: {
    backgroundTextStyle: "light",
    backgroundColor: "#30231d",
    backgroundColorTop: "#30231d",
    backgroundColorBottom: "#30231d",
    navigationBarBackgroundColor: "#30231d",
    navigationBarTextStyle: "white",
  },
});
