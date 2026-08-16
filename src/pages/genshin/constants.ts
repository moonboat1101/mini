// cspell:disable

/** 池子枚举 */
export enum GachaTypeKey {
  ROLE = "ROLE",
  WEAPON = "WEAPON",
  NORMAL = "NORMAL",
  MIX = "MIX",
}
export const GachaType = {
  [GachaTypeKey.ROLE]: {
    label: "角色",
    code: "301",
  },
  [GachaTypeKey.WEAPON]: {
    label: "武器",
    code: "302",
  },
  [GachaTypeKey.MIX]: {
    label: "集录",
    code: "500",
  },
  [GachaTypeKey.NORMAL]: {
    label: "常驻",
    code: "200",
  },
};

/** 角色列表 */
export const roleList = [
  { name: "莫娜", englishName: "Mona", version: "1.0", isNormal: true },
  { name: "琴", englishName: "Jean", version: "1.0", isNormal: true },
  { name: "七七", englishName: "Qiqi", version: "1.0", isNormal: true },
  { name: "刻晴", englishName: "Keqing", version: "1.0", isNormal: true },
  { name: "迪卢克", englishName: "Diluc", version: "1.0", isNormal: true },

  { name: "温迪", englishName: "Venti", version: "1.0" },
  { name: "可莉", englishName: "Klee", version: "1.0" },
  { name: "达达利亚", englishName: "Tartaglia", version: "1.1" },
  { name: "钟离", englishName: "Zhongli", version: "1.1" },
  { name: "阿贝多", englishName: "Albedo", version: "1.2" },
  { name: "甘雨", englishName: "Ganyu", version: "1.2" },
  { name: "魈", englishName: "Xiao", version: "1.3" },
  { name: "胡桃", englishName: "Hu Tao", version: "1.3" },
  { name: "优菈", englishName: "Eula", version: "1.5" },
  { name: "万叶", englishName: "Kazuha", version: "1.6" },

  { name: "神里绫华", englishName: "Ayaka", version: "2.0" },
  { name: "宵宫", englishName: "Yoimiya", version: "2.0" },
  { name: "雷电将军", englishName: "Raiden Shogun", version: "2.1" },
  { name: "珊瑚宫心海", englishName: "Sangonomiya Kokomi", version: "2.1" },
  { name: "荒泷一斗", englishName: "Arataki Itto", version: "2.3" },
  { name: "申鹤", englishName: "Shenhe", version: "2.4" },
  { name: "八重神子", englishName: "Yae Miko", version: "2.5" },
  { name: "神里绫人", englishName: "Kamisato Ayato", version: "2.6" },
  { name: "夜兰", englishName: "Yelan", version: "2.7" },

  { name: "提纳里", englishName: "Tighnari", version: "3.0", isNormal: true },
  { name: "妮露", englishName: "Nilou", version: "3.1" },
  { name: "赛诺", englishName: "Cyno", version: "3.1" },
  { name: "纳西妲", englishName: "Nahida", version: "3.2" },
  { name: "流浪者", englishName: "Wanderer", version: "3.3" },
  { name: "艾尔海森", englishName: "Alhaitham", version: "3.4" },
  { name: "迪希雅", englishName: "Dehya", version: "3.5", isNormal: true },
  { name: "白术", englishName: "Baizhu", version: "3.6" },

  { name: "林尼", englishName: "Liney", version: "4.0" },
  { name: "莱欧斯利", englishName: "Wriothesley", version: "4.1" },
  { name: "那维莱特", englishName: "Neuvillette", version: "4.1" },
  { name: "芙宁娜", englishName: "Furina", version: "4.2" },
  { name: "娜维娅", englishName: "Navia", version: "4.3" },
  { name: "闲云", englishName: "Xianyun", version: "4.4" },
  { name: "千织", englishName: "Chiori", version: "4.5" },
  { name: "阿蕾奇诺", englishName: "Arlecchino", version: "4.6" },
  { name: "克洛琳德", englishName: "Clorinde", version: "4.7" },
  { name: "希格雯", englishName: "Sigewinne", version: "4.7" },
  { name: "艾梅莉埃", englishName: "Emilie", version: "4.8" },

  { name: "玛拉妮", englishName: "Mualani", version: "5.0" },
  { name: "基尼奇", englishName: "Kinich", version: "5.0" },
  { name: "希诺宁", englishName: "Xilonen", version: "5.1" },
  { name: "恰斯卡", englishName: "Chasca", version: "5.2" },
  { name: "茜特菈莉", englishName: "Citlali", version: "5.3" },
  { name: "玛薇卡", englishName: "Mavuika", version: "5.3" },
  { name: "梦见月瑞希", englishName: "Mizuki", version: "5.4", isNormal: true },
  { name: "瓦雷莎", englishName: "Varesa", version: "5.5" },
  { name: "爱可菲", englishName: "Escoffier", version: "5.6" },
  { name: "丝柯克", englishName: "SkirkNew", version: "5.7" },
  { name: "伊涅芙", englishName: "Ineffa", version: "5.8" },

  { name: "菈乌玛", englishName: "Lauma", version: "6.0" },
  { name: "菲林斯", englishName: "Flins", version: "6.0" },
  { name: "奈芙尔", englishName: "Nefer", version: "6.1" },
  {
    name: "杜林",
    englishName: "Durin",
    version: "6.2",
    imageUrl:
      "https://act-webstatic.hoyoverse.com/event-static-hoyowiki-admin/2025/11/28/e3e2b8fcbff2f2f3cdcec6bbf04efa84_3327367670955368711.png",
  },
  {
    name: "哥伦比娅",
    englishName: "Columbina",
    version: "6.3",
    imageUrl:
      "https://act-webstatic.hoyoverse.com/event-static-hoyowiki-admin/2026/01/13/80fa97679c8d1828fdd96c6aa9638632_4327573591148809640.png",
  },
  {
    name: "兹白",
    englishName: "Zibai",
    version: "6.4",
    imageUrl:
      "https://act-webstatic.hoyoverse.com/event-static-hoyowiki-admin/2026/01/29/72161f01ff431c9f099710f92c811454_1654176825175164246.png",
  },
  {
    name: "法尔伽",
    englishName: "Varka",
    version: "6.5",
    imageUrl:
      "https://act-webstatic.hoyoverse.com/event-static-hoyowiki-admin/2026/02/21/553feb81c3bbc5e3bc69a765e157c33f_8250978205515428490.png",
  },
  {
    name: "莉奈娅",
    englishName: "Linnea",
    version: "6.6",
    imageUrl:
      "https://act-webstatic.hoyoverse.com/event-static-hoyowiki-admin/2026/04/03/b73622caa3750012312c72437295ace3_6973976776946504804.png",
  },
  {
    name: "尼可",
    englishName: "Nick",
    version: "6.7",
    imageUrl:
      "https://act-webstatic.hoyoverse.com/event-static-hoyowiki-admin/2026/05/18/5e875ee63bca70ebeda64e6fa409d31b_5921156294699298125.png",
  },
  {
    name: "洛恩",
    englishName: "Lorne",
    version: "6.8",
    imageUrl:
      "https://act-webstatic.hoyoverse.com/event-static-hoyowiki-admin/2026/06/05/7fced903c930ab16fd333755c1aef7e9_9169127423158726160.png",
  },
  {
    name: "桑多涅",
    englishName: "Sandrone",
    version: "6.8",
    imageUrl:
      "https://act-webstatic.hoyoverse.com/event-static-hoyowiki-admin/2026/06/29/4ee285b198b7bb8dba2a0a63aa9ffc9f_7866102664638374858.png",
  },
  {
    name: "奥黛塔",
    englishName: "Odette",
    version: "7.0",
    imageUrl:
      "https://act-webstatic.hoyoverse.com/event-static-hoyowiki-admin/2026/08/07/963982ad49601f7de6a5ab1a364989f7_3689152522029267720.png",
  },
];
