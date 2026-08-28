import { Button, Input, ScrollView, Text, Textarea, View } from "@tarojs/components";
import Taro from "@tarojs/taro";
import { useLayoutEffect, useState } from "react";

import {
  createRecordId,
  getEmptyScriptRecordData,
  loadCustomScriptRecordData,
  normalizeScriptRecordData,
  saveScriptRecordData,
  type PlayedScriptRecord,
  type ScriptRecordData,
  type WishlistRecord,
} from "../../data";
import { useTheme } from "../../../../hooks/useTheme";
import styles from "./index.module.less";

type ListType = "played" | "wishlist";
type Draft = Record<string, string>;
const EDITOR_CONTENT_ID = "script-record-config-editor-content";

const EMPTY_PLAYED_DRAFT: Draft = {
  name: "",
  time: "",
  score: "",
  img: "",
  desc: "",
  comment: "",
  role: "",
  players: "",
};

const EMPTY_WISHLIST_DRAFT: Draft = {
  name: "",
  people: "",
  img: "",
  desc: "",
};

const toPlayedDraft = (item?: PlayedScriptRecord): Draft =>
  item
    ? {
        name: item.name,
        time: item.time,
        score: String(item.score),
        img: item.img,
        desc: item.desc,
        comment: item.comment || "",
        role: item.role || "",
        players: item.players?.join(", ") || "",
      }
    : { ...EMPTY_PLAYED_DRAFT };

const toWishlistDraft = (item?: WishlistRecord): Draft =>
  item
    ? {
        name: item.name,
        people: String(item.people),
        img: item.img,
        desc: item.desc,
      }
    : { ...EMPTY_WISHLIST_DRAFT };

const numberOrZero = (value: string) => {
  const result = Number(value);
  return Number.isFinite(result) ? result : 0;
};

const IMPORT_EXAMPLE = JSON.stringify(
  {
    played: [
      {
        name: "",
        time: "",
        desc: "",
        score: "",
        img: "",
        comment: "",
        role: "",
        players: [],
      },
    ],
    wishlist: [
      {
        name: "",
        desc: "",
        people: "",
        img: "",
      },
    ],
  },
  null,
  2,
);

export default function ScriptRecordConfig({ embedded = false }: { embedded?: boolean }) {
  const { themeClassName } = useTheme();
  const [data, setData] = useState<ScriptRecordData>(
    () => loadCustomScriptRecordData() || getEmptyScriptRecordData(),
  );
  const [editingType, setEditingType] = useState<ListType>("played");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorScrollHeight, setEditorScrollHeight] = useState<number>();
  const [draft, setDraft] = useState<Draft>(EMPTY_PLAYED_DRAFT);
  const [bulkText, setBulkText] = useState("");

  const persist = (next: ScriptRecordData) => {
    setData(next);
    saveScriptRecordData(next);
  };

  const setField = (key: string, value: string) => {
    setDraft((previous) => ({ ...previous, [key]: value }));
  };

  const startNew = (type: ListType) => {
    setEditingId(null);
    setEditingType(type);
    setDraft(type === "played" ? { ...EMPTY_PLAYED_DRAFT } : { ...EMPTY_WISHLIST_DRAFT });
    setEditorOpen(true);
  };

  const startEdit = (type: ListType, item: PlayedScriptRecord | WishlistRecord) => {
    setEditingId(item.id);
    setEditingType(type);
    setDraft(type === "played" ? toPlayedDraft(item as PlayedScriptRecord) : toWishlistDraft(item as WishlistRecord));
    setEditorOpen(true);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setDraft(editingType === "played" ? { ...EMPTY_PLAYED_DRAFT } : { ...EMPTY_WISHLIST_DRAFT });
    setEditorOpen(false);
  };

  const saveDraft = () => {
    if (!draft.name.trim()) {
      Taro.showToast({ title: "请填写剧本名称", icon: "none" });
      return;
    }

    if (editingType === "played") {
      const item: PlayedScriptRecord = {
        id: editingId || createRecordId("played"),
        name: draft.name.trim(),
        time: draft.time.trim(),
        score: numberOrZero(draft.score),
        img: draft.img.trim(),
        desc: draft.desc.trim(),
        comment: draft.comment.trim(),
        role: draft.role.trim(),
        players: draft.players.split(/[,，\n]/).map((value) => value.trim()).filter(Boolean),
      };
      const exists = data.played.some((record) => record.id === item.id);
      persist({
        ...data,
        played: exists ? data.played.map((record) => record.id === item.id ? item : record) : [item, ...data.played],
      });
    } else {
      const item: WishlistRecord = {
        id: editingId || createRecordId("wishlist"),
        name: draft.name.trim(),
        people: numberOrZero(draft.people),
        img: draft.img.trim(),
        desc: draft.desc.trim(),
      };
      const exists = data.wishlist.some((record) => record.id === item.id);
      persist({
        ...data,
        wishlist: exists ? data.wishlist.map((record) => record.id === item.id ? item : record) : [item, ...data.wishlist],
      });
    }
    Taro.showToast({ title: "已保存", icon: "success" });
    cancelEdit();
  };

  const removeItem = (type: ListType, id: string) => {
    Taro.showModal({ title: "删除剧本", content: "删除后无法恢复，确定继续吗？" }).then(({ confirm }) => {
      if (!confirm) return;
      persist(type === "played"
        ? { ...data, played: data.played.filter((item) => item.id !== id) }
        : { ...data, wishlist: data.wishlist.filter((item) => item.id !== id) });
      if (editingId === id) cancelEdit();
    });
  };

  const exportData = () => {
    const text = JSON.stringify(data, null, 2);
    setBulkText(text);
    Taro.setClipboardData({ data: text, success: () => Taro.showToast({ title: "已复制到剪贴板", icon: "success" }) });
  };

  const copyImportExample = () => {
    Taro.setClipboardData({
      data: IMPORT_EXAMPLE,
      success: () => Taro.showToast({ title: "示例已复制", icon: "success" }),
    });
  };

  const importData = () => {
    try {
      const next = normalizeScriptRecordData(JSON.parse(bulkText));
      Taro.showModal({ title: "导入配置", content: `将覆盖当前 ${data.played.length} 条已玩和 ${data.wishlist.length} 条想玩记录，是否继续？` }).then(({ confirm }) => {
        if (!confirm) return;
        persist(next);
        cancelEdit();
        Taro.showToast({ title: "导入成功", icon: "success" });
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "导入内容格式不正确";
      Taro.showToast({ title: message, icon: "none" });
    }
  };

  const readClipboard = () => {
    Taro.getClipboardData().then(({ data: text }) => setBulkText(text || "")).catch(() => {
      Taro.showToast({ title: "读取剪贴板失败", icon: "none" });
    });
  };

  const clearConfig = () => {
    Taro.showModal({
      title: "清空配置",
      content: "将清空已玩和想玩列表，且无法恢复，确定继续吗？",
      confirmColor: "#b8574f",
    }).then(({ confirm }) => {
      if (!confirm) return;
      persist(getEmptyScriptRecordData());
      setBulkText("");
      Taro.showToast({ title: "配置已清空", icon: "success" });
    });
  };

  const isEditing = editorOpen;

  useLayoutEffect(() => {
    if (!editorOpen) {
      setEditorScrollHeight(undefined);
      return;
    }

    let cancelled = false;
    const timer = setTimeout(() => {
      const query = Taro.createSelectorQuery();
      query.select(`#${EDITOR_CONTENT_ID}`).boundingClientRect();
      query.exec((result) => {
        const content = result?.[0] as { height?: number } | undefined;
        const maxHeight = Taro.getSystemInfoSync().windowHeight * 0.9;
        if (!cancelled && typeof content?.height === "number") {
          setEditorScrollHeight(Math.min(Math.ceil(content.height), Math.floor(maxHeight)));
        }
      });
    }, 32);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [editorOpen, editingType, draft.desc, draft.comment]);

  return (
    <View className={`${styles.page} ${themeClassName} ${embedded ? styles.embedded : ""}`}>
      <View className={styles.intro}>
        <Text className={styles.topNotice}>本页修改会保存在本机，并同步到剧本杀列表。</Text>
      </View>

      {isEditing ? (
        <View className={styles.editorMask} catchMove onClick={cancelEdit}>
          <View className={styles.editor} onClick={(event) => event.stopPropagation()}>
            <ScrollView scrollY className={styles.editorScroll} style={editorScrollHeight ? { height: `${editorScrollHeight}px` } : undefined}>
              <View id={EDITOR_CONTENT_ID} className={styles.editorContent}>
                <Field label="名称" required value={draft.name} onChange={(value) => setField("name", value)} />
                {editingType === "played" ? (
                  <>
                    <Field label="游玩时间" placeholder="如 2026.7" value={draft.time} onChange={(value) => setField("time", value)} />
                    <Field label="评分" placeholder="10 分制" value={draft.score} type="digit" onChange={(value) => setField("score", value)} />
                    <Field label="角色" value={draft.role} onChange={(value) => setField("role", value)} />
                    <Field label="玩家" placeholder="用逗号分隔" value={draft.players} onChange={(value) => setField("players", value)} />
                  </>
                ) : (
                  <Field label="人数" value={draft.people} type="number" onChange={(value) => setField("people", value)} />
                )}
                <Field label="封面 URL" placeholder="https://xxxxxxxx" value={draft.img} onChange={(value) => setField("img", value)} />
                <TextAreaField label="简介" value={draft.desc} onChange={(value) => setField("desc", value)} />
                {editingType === "played" ? <TextAreaField label="备注" value={draft.comment} onChange={(value) => setField("comment", value)} /> : null}
                <View className={styles.editorActions}>
                  <Button className={styles.secondaryButton} onClick={cancelEdit}>取消</Button>
                  <Button className={styles.primaryButton} onClick={saveDraft}>保存</Button>
                </View>
              </View>
            </ScrollView>
          </View>
        </View>
      ) : null}

      <View className={styles.listSection}>
        <View className={styles.listSectionHeader}>
          <Text className={styles.sectionTitle}>已玩（{data.played.length}）</Text>
          <Text className={styles.addAction} onClick={() => startNew("played")}>新增</Text>
        </View>
        <View className={styles.list}>
        {data.played.map((item) => (
          <View className={styles.listRow} key={item.id}>
            <View className={styles.listItem}>
              <View className={styles.listItemText}>
                <Text className={styles.listItemTitle}>{item.name || "未命名剧本"}</Text>
                <Text className={styles.listItemMeta}>{[item.time || "", item.score ? String(item.score) : ""].filter(Boolean).join(" · ") || "信息待补充"}</Text>
              </View>
            </View>
            <View className={styles.listActions}>
              <Text className={`${styles.actionButton} ${styles.editAction}`} onClick={() => startEdit("played", item)}>✎</Text>
              <Text className={`${styles.actionButton} ${styles.deleteAction}`} onClick={() => removeItem("played", item.id)}>×</Text>
            </View>
          </View>
        ))}
        </View>
      </View>

      <View className={styles.listSection}>
        <View className={styles.listSectionHeader}>
          <Text className={styles.sectionTitle}>想玩（{data.wishlist.length}）</Text>
          <Text className={styles.addAction} onClick={() => startNew("wishlist")}>新增</Text>
        </View>
        <View className={styles.list}>
        {data.wishlist.map((item) => (
          <View className={styles.listRow} key={item.id}>
            <View className={styles.listItem}>
              <View className={styles.listItemText}>
                <Text className={styles.listItemTitle}>{item.name || "未命名剧本"}</Text>
                <Text className={styles.listItemMeta}>{item.people ? `${item.people} 人本` : "人数待补充"}</Text>
              </View>
            </View>
            <View className={styles.listActions}>
              <Text className={`${styles.actionButton} ${styles.editAction}`} onClick={() => startEdit("wishlist", item)}>✎</Text>
              <Text className={`${styles.actionButton} ${styles.deleteAction}`} onClick={() => removeItem("wishlist", item.id)}>×</Text>
            </View>
          </View>
        ))}
        </View>
      </View>

      <View className={styles.listSection}>
        <View className={styles.listSectionHeader}>
          <Text className={styles.sectionTitle}>数据管理</Text>
        </View>
        <View className={styles.bulkPanel}>
          <Text className={styles.bulkTitle}>批量导入 / 导出</Text>
          <Textarea className={styles.bulkTextarea} value={bulkText} placeholder="使用 JSON 备份或迁移全部已玩、想玩记录。导入会覆盖当前列表；不知道怎么填可以看下方示例。" maxlength={-1} onInput={(event) => setBulkText(event.detail.value)} />
          <View className={styles.bulkActions}>
            <Button className={styles.secondaryButton} onClick={readClipboard}>读取剪贴板</Button>
            <Button className={styles.secondaryButton} onClick={exportData}>批量导出</Button>
            <Button className={styles.primaryButton} onClick={importData}>批量导入</Button>
          </View>
        </View>
        <View className={styles.examplePanel}>
          <View className={styles.exampleHeader}>
            <Text className={styles.bulkTitle}>数据结构示例</Text>
            <View className={styles.copyExampleButton} onClick={copyImportExample}>
              <View className={styles.copyIconBack} />
              <View className={styles.copyIconFront} />
            </View>
          </View>
          <Text className={styles.exampleCode}>{IMPORT_EXAMPLE}</Text>
        </View>
        <Button className={styles.clearConfigButton} onClick={clearConfig}>清空配置</Button>
      </View>
    </View>
  );
}

function Field({ label, placeholder = "", value, type = "text", required = false, onChange }: { label: string; placeholder?: string; value: string; type?: "text" | "number" | "digit"; required?: boolean; onChange: (value: string) => void }) {
  return <View className={styles.field}><Text className={styles.label}>{label}{required ? <Text className={styles.requiredMark}>*</Text> : null}</Text><Input className={styles.input} value={value} placeholder={placeholder} type={type} onInput={(event) => onChange(event.detail.value)} /></View>;
}

function TextAreaField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <View className={`${styles.field} ${styles.textareaField}`}><Text className={styles.label}>{label}</Text><Textarea className={styles.textarea} value={value} maxlength={-1} autoHeight onInput={(event) => onChange(event.detail.value)} /></View>;
}
