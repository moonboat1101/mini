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
const additionalArtwork: Record<string, string> = {
  "埃洛伊": "https://bbs.hoyolab.com/hoyowiki/picture/character/%E5%9F%83%E6%B4%9B%E4%BC%8A/avatar.png",
};

export function getCharacterAvatar(name: string): string {
  if (name === "空/荧") return protagonistImage;
  const normalizedName = avatarNames[name] || name;
  const role = roleList.find((item) => item.name === normalizedName)
    || fourStarRoleList.find((item) => item.name === normalizedName);
  const id = role?.englishName || (normalizedName === "埃洛伊" ? "Aloy" : "");
  return id && !id.includes("NO-PIC-") ? `https://ys.appfeng.com/ui/avatar/UI_AvatarIcon_${id}.webp` : "";
}

export function getCharacterArtwork(name: string): string {
  const normalizedName = avatarNames[name] || name;
  const role = roleList.find((item) => item.name === normalizedName)
    || fourStarRoleList.find((item) => item.name === normalizedName);
  const artwork = (role && "artwork" in role ? role.artwork : undefined) || additionalArtwork[normalizedName] || "";
  // 老角色的图鉴原图体积过大，暂时使用头像，保留立绘地址供后续压缩使用。
  return artwork.startsWith("https://bbs.hoyolab.com/hoyowiki/picture/character/") ? "" : artwork;
}

export function getCharacterCardImage(name: string): string {
  return getCharacterArtwork(name) || getCharacterAvatar(name);
}
