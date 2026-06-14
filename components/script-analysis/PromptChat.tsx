"use client";

import { useState } from "react";
import { MessageCircle, Send, X, Loader2 } from "lucide-react";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface PromptChatProps {
  projectId: string;
  assetName: string;
  assetType: string;
  currentPrompt: string;
  onPromptUpdate: (newPrompt: string) => void;
}

export default function PromptChat({
  projectId,
  assetName,
  assetType,
  currentPrompt,
  onPromptUpdate,
}: PromptChatProps) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSend() {
    if (!input.trim() || loading) return;

    const userMsg: ChatMessage = { role: "user", content: input.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch(`/api/projects/${projectId}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assetName,
          assetType,
          currentPrompt,
          userMessage: userMsg.content,
          history: messages.slice(-6),
        }),
      });

      const result = await res.json();
      if (result.success) {
        const aiMsg: ChatMessage = {
          role: "assistant",
          content: result.prompt,
        };
        setMessages([...newMessages, aiMsg]);
        onPromptUpdate(result.prompt);
      } else {
        setMessages([
          ...newMessages,
          { role: "assistant", content: `修改失败：${result.error}` },
        ]);
      }
    } catch {
      setMessages([
        ...newMessages,
        { role: "assistant", content: "网络错误，请重试" },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* 触发按钮 */}
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-1 rounded-md px-2 py-0.5 text-xs transition-all ${
          open
            ? "bg-white/[0.10] text-white"
            : "text-white/30 hover:text-white hover:bg-white/[0.06]"
        }`}
        title="对话修改提示词"
      >
        <MessageCircle className="h-3 w-3" />
        <span>对话修改</span>
      </button>

      {/* 对话面板 */}
      {open && (
        <div className="mt-2 rounded-lg bg-black/60 border border-white/[0.08] overflow-hidden">
          {/* 标题栏 */}
          <div className="flex items-center justify-between px-3 py-2 border-b border-white/[0.06]">
            <span className="text-xs font-medium text-white/60">
              💬 修改「{assetName}」提示词
            </span>
            <button
              onClick={() => setOpen(false)}
              className="rounded p-0.5 text-white/30 hover:text-white"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* 消息列表 */}
          <div className="max-h-48 overflow-y-auto px-3 py-2 flex flex-col gap-2">
            {messages.length === 0 && (
              <p className="text-xs text-white/25 text-center py-3">
                告诉 AI 你想怎么修改这条提示词
              </p>
            )}
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`text-xs leading-relaxed rounded-lg px-2.5 py-1.5 max-w-[90%] ${
                  msg.role === "user"
                    ? "bg-white/[0.08] text-white/70 self-end"
                    : "bg-white/[0.03] text-white/50 self-start font-mono"
                }`}
              >
                {msg.content.length > 300
                  ? msg.content.slice(0, 300) + "..."
                  : msg.content}
              </div>
            ))}
            {loading && (
              <div className="flex items-center gap-2 text-xs text-white/30 px-2">
                <Loader2 className="h-3 w-3 animate-spin" />
                AI 修改中...
              </div>
            )}
          </div>

          {/* 输入框 */}
          <div className="flex gap-1.5 px-3 py-2 border-t border-white/[0.06]">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="例如：把发色改成银白色..."
              className="flex-1 rounded-md bg-white/[0.04] border border-white/[0.06] px-2.5 py-1.5 text-xs text-white placeholder:text-white/15 focus:outline-none focus:border-white/15"
            />
            <button
              onClick={handleSend}
              disabled={loading || !input.trim()}
              className="rounded-md bg-white/[0.08] p-1.5 text-white/50 hover:text-white hover:bg-white/[0.12] transition-all disabled:opacity-30"
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
