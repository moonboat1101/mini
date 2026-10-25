import { roleList, fourStarRoleList } from "../genshin/constants";

// 仅用于查找头像，页面仍显示 Sheet1 中的原始角色名。
const avatarNames: Record<string, string> = { "干织": "千织", "少女": "哥伦比娅", "枫原万叶": "万叶" };

// 复用角色表的星级与登场顺序，仅排序副本，保留关联表中的原始名称和全部条目。
const characterOrder = new Map<string, { rarity: number; order: number }>([
  ["空/荧", { rarity: 5, order: -1 }],
  ...roleList.map((role, order): [string, { rarity: number; order: number }] => [role.name, { rarity: 5, order }]),
  ...fourStarRoleList.map((role, order): [string, { rarity: number; order: number }] => [role.name, { rarity: 4, order }]),
]);

export function sortCharactersByRarityAndRecency(names: string[]): string[] {
  return [...names].sort((left, right) => {
    if (left === "空/荧" || right === "空/荧") return left === right ? 0 : left === "空/荧" ? -1 : 1;
    const a = characterOrder.get(avatarNames[left] || left);
    const b = characterOrder.get(avatarNames[right] || right);
    // 未收录角色仍保留，稳定地排在已知角色之后。
    if (!a || !b) return a ? -1 : b ? 1 : 0;
    return b.rarity - a.rarity || b.order - a.order;
  });
}

const protagonistImage = "https://act-upload.hoyoverse.com/event-ugc-hoyowiki/2025/01/05/157749474/75bb898fe1c3b4ed29a2931829ddb845_998097527747088629.png";

export function getCharacterAvatar(name: string): string {
  if (name === "空/荧") return protagonistImage;
  const normalizedName = avatarNames[name] || name;
  const role = roleList.find((item) => item.name === normalizedName)
    || fourStarRoleList.find((item) => item.name === normalizedName);
  const id = role?.englishName;
  return id && !id.includes("NO-PIC-") ? `https://ys.appfeng.com/ui/avatar/UI_AvatarIcon_${id}.webp` : "";
}
