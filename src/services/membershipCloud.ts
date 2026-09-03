import Taro from "@tarojs/taro";
import { initCardExchangeCloud } from "./cardExchangeCloud";

export type MembershipStatus = { memberId: number | null };
type VirtualOrder = { orderNo: string; signData: string; paySig: string; signature: string };
const call = async (action: string, data: Record<string, unknown> = {}) => {
  if (!initCardExchangeCloud()) throw new Error("当前环境不支持云支付");
  return (await (globalThis as any).wx.cloud.callFunction({ name: "membershipPayment", data: { action, ...data } })).result || {};
};
export const getMembershipStatus = async (): Promise<MembershipStatus> => {
  const result = await call("status");
  return { memberId: Number(result.memberId) || null };
};
export const createMembershipOrder = async (): Promise<VirtualOrder> => {
  const login = await new Promise<{ code: string }>((resolve, reject) => (globalThis as any).wx.login({ success: resolve, fail: reject }));
  if (!login.code) throw new Error("获取微信登录态失败");
  const result = await call("createOrder", { code: login.code });
  if (!result.signData || !result.paySig || !result.signature) throw new Error(result.message || "订单创建失败");
  return result;
};
