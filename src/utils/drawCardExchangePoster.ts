import Taro from "@tarojs/taro";
import type { CardCatalogItem } from "../pages/CardExchangeMarket/mockData";

const WIDTH = 360;
const PIXEL_RATIO = 3;
const CONTENT_X = 24;
const CONTENT_WIDTH = 312;
const QR_CODE = "/assets/mini-program-code.jpg";

type CanvasNode = {
  width: number;
  height: number;
  createImage: () => { src: string; onload: (() => void) | null; onerror: (() => void) | null };
  getContext: (type: "2d") => CanvasRenderingContext2D;
};

export type CardExchangePosterData = { uid: string; contactA: string; contactB: string; activeTime: string; ownedCards: CardCatalogItem[]; wantedCards: CardCatalogItem[] };

const getCanvas = (id: string) => new Promise<CanvasNode>((resolve, reject) => {
  Taro.createSelectorQuery().select(`#${id}`).fields({ node: true }, (result) => {
    const canvas = (result as { node?: CanvasNode })?.node;
    if (canvas) resolve(canvas); else reject(new Error("canvas unavailable"));
  }).exec();
});

const loadImage = (canvas: CanvasNode, src: string) => new Promise<ReturnType<CanvasNode["createImage"]>>((resolve, reject) => {
  const image = canvas.createImage();
  image.onload = () => resolve(image);
  image.onerror = () => reject(new Error(`image unavailable: ${src}`));
  image.src = src;
});

const roundedRect = (context: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) => {
  context.beginPath(); context.moveTo(x + radius, y); context.lineTo(x + width - radius, y); context.arc(x + width - radius, y + radius, radius, -Math.PI / 2, 0); context.lineTo(x + width, y + height - radius); context.arc(x + width - radius, y + height - radius, radius, 0, Math.PI / 2); context.lineTo(x + radius, y + height); context.arc(x + radius, y + height - radius, radius, Math.PI / 2, Math.PI); context.lineTo(x, y + radius); context.arc(x + radius, y + radius, radius, Math.PI, Math.PI * 1.5); context.closePath();
};
const drawText = (context: CanvasRenderingContext2D, text: string, x: number, y: number, size: number, color: string, weight = 400) => { context.font = `${weight} ${size}px sans-serif`; context.fillStyle = color; context.textAlign = "left"; context.fillText(text, x, y); };
const drawBoldText = (context: CanvasRenderingContext2D, text: string, x: number, y: number, size: number, color: string) => { context.font = `bold ${size}px sans-serif`; context.fillStyle = color; context.textAlign = "left"; context.fillText(text, x, y); context.strokeStyle = color; context.lineWidth = .35; context.strokeText(text, x, y); };
const serverInfo = (uid: string) => /^[1-4]\d{8}$/.test(uid) ? { label: "官服", color: "#966516", background: "#f8e8bd" } : /^5\d{8}$/.test(uid) ? { label: "B服", color: "#9b4a67", background: "#f8dce5" } : { label: "外服", color: "#70528e", background: "#e8def4" };
const section = (context: CanvasRenderingContext2D, text: string, y: number) => { context.fillStyle = "#806943"; roundedRect(context, CONTENT_X, y - 10, 4, 14, 2); context.fill(); drawText(context, text, CONTENT_X + 9, y + 2, 14, "#806943", 800); };

const drawGrid = (context: CanvasRenderingContext2D, cards: CardCatalogItem[], y: number, images: Map<string, ReturnType<CanvasNode["createImage"]>>) => {
  const gap = 8; const columns = 8; const width = (CONTENT_WIDTH - gap * (columns - 1)) / columns; const imageHeight = width * 217 / 150; const rowHeight = imageHeight + 23;
  cards.forEach((card, index) => {
    const x = CONTENT_X + (index % columns) * (width + gap); const cardY = y + Math.floor(index / columns) * (rowHeight + gap); const image = images.get(card.id);
    if (image) { context.save(); roundedRect(context, x, cardY, width, imageHeight, 8); context.clip(); context.drawImage(image as unknown as CanvasImageSource, x, cardY, width, imageHeight); context.restore(); }
    const nameSize = 10; context.font = `700 ${nameSize}px sans-serif`; const nameX = x + (width - context.measureText(card.name).width) / 2; drawText(context, card.name, nameX, cardY + imageHeight + 14, nameSize, "#222222", 700);
  });
  return y + Math.ceil(cards.length / columns) * rowHeight + Math.max(0, Math.ceil(cards.length / columns) - 1) * gap;
};

const gridHeight = (count: number) => {
  const gap = 8; const width = (CONTENT_WIDTH - gap * 7) / 8; const rowHeight = width * 217 / 150 + 23; const rows = Math.ceil(count / 8);
  return rows * rowHeight + Math.max(0, rows - 1) * gap;
};

const getPosterHeight = (data: CardExchangePosterData) => {
  const contactCount = Number(Boolean(data.contactA)) + Number(Boolean(data.contactB)) + Number(Boolean(data.activeTime.trim()));
  let y = 70 + (contactCount ? 36 + contactCount * 20 : 0);
  y += 14 + gridHeight(data.ownedCards.length);
  y += 22 + 14 + gridHeight(data.wantedCards.length);
  return y + 24 + 72;
};

export const drawCardExchangePoster = async (canvasId: string, data: CardExchangePosterData) => {
  const canvas = await getCanvas(canvasId);
  const outputHeight = getPosterHeight(data);
  canvas.width = WIDTH * PIXEL_RATIO;
  canvas.height = outputHeight * PIXEL_RATIO;
  const context = canvas.getContext("2d");
  context.scale(PIXEL_RATIO, PIXEL_RATIO);
  const cards = [...data.ownedCards, ...data.wantedCards];
  const loaded = await Promise.all(cards.map(async (card) => [card.id, await loadImage(canvas, card.image)] as const));
  const images = new Map(loaded);
  const qrImage = await loadImage(canvas, QR_CODE);

  context.fillStyle = "#ffffff"; context.fillRect(0, 0, WIDTH, outputHeight);
  context.font = "bold 20px sans-serif"; const uidWidth = context.measureText(data.uid).width; drawBoldText(context, data.uid, CONTENT_X, 45, 20, "#222222");
  const server = serverInfo(data.uid); const tagX = Math.min(298, CONTENT_X + uidWidth + 6); roundedRect(context, tagX, 29, 38, 18, 5); context.fillStyle = server.background; context.fill(); context.font = "700 10px sans-serif"; context.fillStyle = server.color; context.textAlign = "center"; context.fillText(server.label, tagX + 19, 42);

  let y = 70;
  const contacts = [data.contactA ? { label: "企鹅", value: data.contactA } : null, data.contactB ? { label: "绿泡泡", value: data.contactB } : null, data.activeTime.trim() ? { label: "备注", value: data.activeTime.trim() } : null].filter((item): item is { label: string; value: string } => Boolean(item));
  if (contacts.length) { section(context, "基础信息", y); contacts.forEach((item, index) => { const lineY = y + 25 + index * 20; drawText(context, item.label, CONTENT_X, lineY, 12, "#222222"); drawText(context, item.value.slice(0, 24), CONTENT_X + 44, lineY, 12, "#222222"); }); y += 36 + contacts.length * 20; }
  section(context, "我多余", y); y = drawGrid(context, data.ownedCards, y + 14, images); const wantedY = y + 22; section(context, "我想要", wantedY); const bottom = drawGrid(context, data.wantedCards, wantedY + 14, images);
  const dividerY = bottom + 12; context.strokeStyle = "#eeeeee"; context.lineWidth = 1; context.beginPath(); context.moveTo(CONTENT_X, dividerY); context.lineTo(CONTENT_X + CONTENT_WIDTH, dividerY); context.stroke();
  const footer = bottom + 24; drawText(context, "月舟 | 微信小程序", CONTENT_X, footer + 20, 14, "#222222", 700); drawText(context, "交换市场 · 稀有排行 · 角色关联", CONTENT_X, footer + 39, 10, "#777777"); context.drawImage(qrImage as unknown as CanvasImageSource, 288, footer, 48, 48);
  const result = await Taro.canvasToTempFilePath({ canvas: canvas as unknown as Canvas, destWidth: WIDTH * PIXEL_RATIO, destHeight: outputHeight * PIXEL_RATIO, fileType: "png", quality: 1 });
  return result.tempFilePath;
};
