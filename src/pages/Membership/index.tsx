import { Button, Text, View } from "@tarojs/components";
import Taro from "@tarojs/taro";
import { useEffect, useState } from "react";
import { usePageShare } from "../../hooks/usePageShare";
import { useTheme } from "../../hooks/useTheme";
import { createMembershipOrder, getMembershipStatus, type MembershipStatus } from "../../services/membershipCloud";
import styles from "./index.module.less";

export default function Membership() {
  const { themeClassName } = useTheme();
  const [status, setStatus] = useState<MembershipStatus | null>(null);
  const [paying, setPaying] = useState(false);
  usePageShare({ title: "月舟终身会员", path: "/pages/Membership/index" });

  const refresh = async () => {
    try {
      setStatus(await getMembershipStatus());
    } catch {
      Taro.showToast({ title: "会员信息加载失败", icon: "none" });
    }
  };
  useEffect(() => { refresh(); }, []);

  const pay = async () => {
    if (paying || status?.memberId) return;
    setPaying(true);
    try {
      Taro.showLoading({ title: "正在创建订单", mask: true });
      const order = await createMembershipOrder();
      Taro.hideLoading();
      const requestVirtualPayment = (globalThis as any).wx?.requestVirtualPayment;
      if (!requestVirtualPayment) throw new Error("当前微信版本暂不支持虚拟支付");
      await new Promise<void>((resolve, reject) => requestVirtualPayment({
        signData: order.signData,
        paySig: order.paySig,
        signature: order.signature,
        mode: "short_series_goods",
        success: resolve,
        fail: reject,
      }));
      Taro.showLoading({ title: "正在确认支付", mask: true });
      // 会员仅由支付回调发放；客户端回调成功后短暂轮询，兼容回调稍后到达的情况。
      for (let attempt = 0; attempt < 6; attempt += 1) {
        await new Promise((resolve) => setTimeout(resolve, 900));
        const next = await getMembershipStatus();
        if (next.memberId) {
          setStatus(next);
          Taro.hideLoading();
          Taro.showToast({ title: "欢迎成为永久会员", icon: "success" });
          return;
        }
      }
      Taro.hideLoading();
      Taro.showToast({ title: "支付已完成，会员信息将在稍后生效", icon: "none" });
    } catch (error) {
      const message = (error as any)?.errMsg || (error instanceof Error ? error.message : "支付未完成");
      if (!/cancel/i.test(message)) Taro.showToast({ title: message, icon: "none" });
    } finally {
      Taro.hideLoading();
      setPaying(false);
    }
  };

  return <View className={`${styles.page} ${themeClassName}`}>
    {status?.memberId ? <View className={styles.memberCard}>
      <Text className={styles.memberCrown}>♛</Text>
      <View><Text className={styles.memberTitle}>月舟终身会员</Text><Text className={styles.memberId}>会员编号 #{String(status.memberId).padStart(4, "0")}</Text></View>
    </View> : null}
    <View className={styles.content}>
      {status?.memberId ? <Text className={styles.title}>感谢您对月舟的支持，祝您永远不死～</Text> : <View className={styles.description}>
        <Text>投币需要花费 1 元，投币后会成为月舟的永久会员，并获得唯一的 ID，不过这个只是娱乐玩法，所以在实际功能上不会有任何区别，只会有一些会员信息的展示。</Text>
        <Text className={styles.descriptionItem}>✦ 月谕圣牌市场列表里，您的交换信息旁</Text>
        <Text className={styles.descriptionItem}>✦ 没了哈哈..</Text>
      </View>}
      {!status?.memberId ? <Button className={styles.coinButton} disabled={paying} onClick={pay}>投币</Button> : null}
    </View>
  </View>;
}
