import { Button, Canvas, Text, Textarea, View } from "@tarojs/components";
import Taro from "@tarojs/taro";
import { useEffect, useMemo, useState } from "react";
import drawQrcode from "weapp-qrcode";
import { usePageShare } from "../../hooks/usePageShare";
import { useKeyboardFloating } from "../../hooks/useKeyboardFloating";

import styles from "./index.module.less";

const CANVAS_ID = "moonboat-qrcode-canvas";
const QR_SIZE = 220;
const MAX_BYTES = 1800;

function getUtf8ByteLength(text: string) {
  return encodeURIComponent(text).replace(/%[0-9A-F]{2}/g, "x").length;
}

export default function QrCode() {
  usePageShare({
    title: "生成二维码",
    path: "/pages/QrCode/index",
  });

  const [content, setContent] = useState("");
  const [generatedText, setGeneratedText] = useState("");
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasQrCode, setHasQrCode] = useState(false);
  const keyboardFloating = useKeyboardFloating("qrcode-textarea-keyboard");

  const byteLength = useMemo(() => getUtf8ByteLength(content), [content]);
  const isContentReady = content.trim().length > 0;
  const isContentTooLong = byteLength > MAX_BYTES;

  const drawCode = (text: string) => {
    setIsDrawing(true);
    setHasQrCode(false);

    try {
      drawQrcode({
        width: QR_SIZE,
        height: QR_SIZE,
        canvasId: CANVAS_ID,
        text,
        correctLevel: 0,
        background: "#ffffff",
        foreground: "#1b120e",
        callback: () => {
          setIsDrawing(false);
          setHasQrCode(true);
        },
      });
    } catch (error) {
      setIsDrawing(false);
      setHasQrCode(false);
      Taro.showToast({
        title: "二维码生成失败",
        icon: "none",
      });
    }
  };

  useEffect(() => {
    if (!generatedText) return;
    const timer = setTimeout(() => drawCode(generatedText), 80);
    return () => clearTimeout(timer);
  }, [generatedText]);

  const handleGenerate = () => {
    const nextText = content.trim();

    if (!nextText) {
      Taro.showToast({
        title: "请输入内容",
        icon: "none",
      });
      return;
    }

    if (isContentTooLong) {
      Taro.showToast({
        title: "内容过长，请精简后再生成",
        icon: "none",
      });
      return;
    }

    setGeneratedText(nextText);
    if (nextText === generatedText) {
      drawCode(nextText);
    }
  };

  const handleSave = () => {
    if (!hasQrCode || isDrawing) {
      Taro.showToast({
        title: "请先生成二维码",
        icon: "none",
      });
      return;
    }

    Taro.canvasToTempFilePath({
      canvasId: CANVAS_ID,
      x: 0,
      y: 0,
      width: QR_SIZE,
      height: QR_SIZE,
      destWidth: QR_SIZE * 3,
      destHeight: QR_SIZE * 3,
      fileType: "png",
      success: (res) => {
        Taro.saveImageToPhotosAlbum({
          filePath: res.tempFilePath,
          success: () => {
            Taro.showToast({
              title: "已保存至相册",
              icon: "success",
            });
          },
          fail: (saveError) => {
            const errMsg = saveError?.errMsg || "";
            if (errMsg.includes("auth") || errMsg.includes("authorize")) {
              Taro.showModal({
                title: "需要相册权限",
                content: "请允许保存图片到相册后重试",
                confirmText: "去设置",
                success: (modalRes) => {
                  if (modalRes.confirm) {
                    Taro.openSetting();
                  }
                },
              });
              return;
            }

            Taro.showToast({
              title: "保存失败，请重试",
              icon: "none",
            });
          },
        });
      },
      fail: () => {
        Taro.showToast({
          title: "导出二维码失败",
          icon: "none",
        });
      },
    });
  };

  return (
    <View className={styles.qrCodePage}>
      <View className={styles.panel}>
        <Text className={styles.panelTitle}>输入内容</Text>
        <Textarea
          id={keyboardFloating.targetId}
          className={styles.textarea}
          value={content}
          style={keyboardFloating.floatingStyle}
          {...keyboardFloating.inputKeyboardProps}
          maxlength={-1}
          placeholder="输入文字、链接或其他需要编码的内容"
          placeholderClass={styles.placeholder}
          autoHeight={false}
          onInput={(event) => {
            setContent(event.detail.value);
          }}
        />
        <View className={styles.counterRow}>
          <Text
            className={
              isContentTooLong
                ? `${styles.counter} ${styles.counterDanger}`
                : styles.counter
            }
          >
            {byteLength}/{MAX_BYTES} bytes
          </Text>
          <Text className={styles.counterTip}>
            内容越短，二维码越容易识别
          </Text>
        </View>
        <Button
          className={styles.primaryButton}
          disabled={!isContentReady || isContentTooLong || isDrawing}
          onClick={handleGenerate}
        >
          {isDrawing ? "生成中" : "生成二维码"}
        </Button>
      </View>

      {generatedText ? (
        <View className={styles.previewPanel}>
          <View className={styles.canvasShell}>
            {isDrawing ? (
              <View className={styles.emptyState}>
                <Text className={styles.emptyTitle}>正在绘制</Text>
                <Text className={styles.emptyText}>马上就好</Text>
              </View>
            ) : null}
            <Canvas
              className={styles.canvas}
              canvasId={CANVAS_ID}
              style={`width: ${QR_SIZE}px; height: ${QR_SIZE}px;`}
            />
          </View>
          <Button
            className={styles.saveButton}
            disabled={!hasQrCode || isDrawing}
            onClick={handleSave}
          >
            保存至相册
          </Button>
        </View>
      ) : null}
    </View>
  );
}
