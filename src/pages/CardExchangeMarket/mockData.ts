export type ExchangePost = {
  id: string;
  nickname: string;
  uid: string;
  avatarText: string;
  activeTime: string;
  offerCardIds: string[];
  wantCardIds: string[];
  createdAt: string;
  status: "active" | "closed";
};

export const cardCatalog = [
  {
    id: "magician",
    name: "魔法师",
    // 卡图原始比例为 150:217，后续可替换为 CloudBase 云存储 fileID。
    image: "https://patchwiki.biligame.com/images/ys/8/8f/13zuc1pn9n7c42kniz2woqfxhivdtbu.png",
  },
  {
    id: "priestess",
    name: "女祭司",
    image: "https://patchwiki.biligame.com/images/ys/8/8a/0fleosuldjbz2bqgrsmi53salnzg6da.png",
  },
  {
    id: "empress",
    name: "女皇",
    image: "https://patchwiki.biligame.com/images/ys/3/31/kmhsse6d0gyciz3890res46ajenkvbt.png",
  },
  {
    id: "emperor",
    name: "皇帝",
    image: "https://patchwiki.biligame.com/images/ys/2/2b/gt5562dyp63ep0p1yursgpeih1zqnx1.png",
  },
  {
    id: "hierophant",
    name: "圣职者",
    image: "https://patchwiki.biligame.com/images/ys/f/f2/3ryl7lobz6ew2ov3eht8fkhblnjgtia.png",
  },
  {
    id: "lovers",
    name: "恋人",
    image: "https://patchwiki.biligame.com/images/ys/c/cc/mu2d7a34ehgeoqxcq3u1tvskmh6skup.png",
  },
  {
    id: "chariot",
    name: "战车",
    image: "https://patchwiki.biligame.com/images/ys/2/2b/37u1ixmqplrcha0xv2994ab7xrp744s.png",
  },
  {
    id: "strength",
    name: "力量",
    image: "https://patchwiki.biligame.com/images/ys/8/89/jl5xwjp6en6umgfb4cikiobjn074b9l.png",
  },
  {
    id: "hermit",
    name: "隐者",
    image: "https://patchwiki.biligame.com/images/ys/e/e1/f3xjpqr2ip40rckk09dvin30p9g2cji.png",
  },
  {
    id: "wheel-of-fortune",
    name: "命运之轮",
    image: "https://patchwiki.biligame.com/images/ys/f/f7/htweat0luikgoeq4fzgdwks6mnw3cb0.png",
  },
  {
    id: "justice",
    name: "正义",
    image: "https://patchwiki.biligame.com/images/ys/e/ed/s6a6rtsuz8espbvfykbuf9f80srea13.png",
  },
  {
    id: "hanged-man",
    name: "倒吊人",
    image: "https://patchwiki.biligame.com/images/ys/9/9c/s9wbsoopukkpfdcrsmrvik3rnzw929b.png",
  },
  {
    id: "death",
    name: "死神",
    image: "https://patchwiki.biligame.com/images/ys/e/ea/slesdme0ehewgzk4xi8annqv9xnutjc.png",
  },
  {
    id: "temperance",
    name: "节制",
    image: "https://patchwiki.biligame.com/images/ys/4/43/i43wofne7kv0vj649u0kw4rznt7l5r1.png",
  },
  {
    id: "devil",
    name: "魔鬼",
    image: "https://patchwiki.biligame.com/images/ys/2/20/oqn8x4qurscb00hpkr215yaqvy95x0d.png",
  },
  {
    id: "tower",
    name: "塔",
    image: "https://patchwiki.biligame.com/images/ys/c/cc/lent5q2ayhjvst6yaf59d3voqhykomr.png",
  },
  {
    id: "star",
    name: "星",
    image: "https://patchwiki.biligame.com/images/ys/1/18/0rtfuz7a1l7gjbe7ne7jcnd4dp4prkb.png",
  },
  {
    id: "moon",
    name: "月亮",
    image: "https://patchwiki.biligame.com/images/ys/e/e7/6zcv9h5hmjxrlyj8f2soyk9hwsp10pr.png",
  },
  {
    id: "sun",
    name: "太阳",
    image: "https://patchwiki.biligame.com/images/ys/4/4b/kn3wuvfsb7jsv6oph1hgiqq1o4xy1xd.png",
  },
  {
    id: "judgement",
    name: "审判",
    image: "https://patchwiki.biligame.com/images/ys/3/36/lqryyy0dvp19yguof6lbiufjuienj9f.png",
  },
  {
    id: "world",
    name: "世界",
    image: "https://patchwiki.biligame.com/images/ys/1/10/8oq5n7hinvwhohjwmsjs40mcemmcgeo.png",
  },
  {
    id: "fool",
    name: "愚者",
    image: "https://patchwiki.biligame.com/images/ys/8/88/9szo5fszbzt93mmnnm0dcfvkppowraa.png",
  },
] as const;

export type CardCatalogItem = (typeof cardCatalog)[number];
export const getCardById = (id: string): CardCatalogItem =>
  cardCatalog.find((card) => card.id === id) ?? cardCatalog[0];

// 后续接 CloudBase 时，这组数据会替换为 exchange_posts 集合查询结果。
export const exchangePosts: ExchangePost[] = [];
