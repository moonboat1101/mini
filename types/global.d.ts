/// <reference types="@tarojs/taro" />

declare module "*.png";
declare module "*.gif";
declare module "*.jpg";
declare module "*.jpeg";
declare module "*.svg";
declare module "*.css";
declare module "*.less";
declare module "*.scss";
declare module "*.sass";
declare module "*.styl";

declare module "weapp-qrcode" {
  type DrawQrcodeOptions = {
    width: number;
    height: number;
    canvasId?: string;
    ctx?: unknown;
    text: string;
    typeNumber?: number;
    correctLevel?: 0 | 1 | 2 | 3;
    background?: string;
    foreground?: string;
    callback?: () => void;
  };

  export default function drawQrcode(options: DrawQrcodeOptions): void;
}

declare namespace NodeJS {
  interface ProcessEnv {
    /** NODE 内置环境变量, 会影响到最终构建生成产物 */
    NODE_ENV: "development" | "production";
    /** 当前构建的平台 */
    TARO_ENV: "weapp";
  }
}

declare type ObjectType = Record<string, any>;
