import { roleList, fourStarRoleList } from "../genshin/constants";

// 仅用于查找头像，页面仍显示 Sheet1 中的原始角色名。
const avatarNames: Record<string, string> = { "干织": "千织", "少女": "哥伦比娅", "枫原万叶": "万叶" };

const protagonistImage = "https://act-upload.hoyoverse.com/event-ugc-hoyowiki/2025/01/05/157749474/75bb898fe1c3b4ed29a2931829ddb845_998097527747088629.png";

export function getCharacterAvatar(name: string): string {
  if (name === "空/荧") return protagonistImage;
  const normalizedName = avatarNames[name] || name;
  const role = roleList.find((item) => item.name === normalizedName)
    || fourStarRoleList.find((item) => item.name === normalizedName);
  const id = role?.englishName;
  return id && !id.includes("NO-PIC-") ? `https://ys.appfeng.com/ui/avatar/UI_AvatarIcon_${id}.webp` : "";
}
