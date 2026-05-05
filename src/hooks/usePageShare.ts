import Taro from "@tarojs/taro";

type PageShareOptions = {
  title: string;
  path: string;
  imageUrl?: string;
};

const getTimelineQuery = (path: string) => {
  const query = path.split("?")[1];
  return query || "";
};

export function usePageShare({ title, path, imageUrl }: PageShareOptions) {
  Taro.useDidShow(() => {
    if ((process.env.TARO_ENV as string) !== "weapp") return;

    Taro.showShareMenu({
      withShareTicket: true,
      showShareItems: ["shareAppMessage", "shareTimeline"],
    });
  });

  Taro.useShareAppMessage(() => ({
    title,
    path,
    imageUrl,
  }));

  Taro.useShareTimeline(() => ({
    title,
    query: getTimelineQuery(path),
    imageUrl,
  }));
}
