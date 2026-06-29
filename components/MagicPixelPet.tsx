"use client";

import { useEffect, useRef, useState } from "react";

const petLines = [
  "Hi, wo zai zhe li pei ni.",
  "Ji de bao cun jin du.",
  "Bug lai le, xian shen hu xi.",
  "Ni de wang zhan you mo fa le.",
  "Dian wo hui shuo hua, tuo wo hui ban jia.",
  "Xiu xi yi xia, yan jing ye yao hui xue.",
];

const sleepLine = "Wo xian mi yi hui er, you shi dian wo.";
const idleAfterMs = 28000;

type Point = {
  x: number;
  y: number;
};

type DragState = {
  startX: number;
  startY: number;
  offsetX: number;
  offsetY: number;
  moved: boolean;
};

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export default function MagicPixelPet() {
  const [bubble, setBubble] = useState("Hello, wo ban jin ni de wang zhan la.");
  const [talking, setTalking] = useState(true);
  const [sleeping, setSleeping] = useState(false);
  const [excited, setExcited] = useState(false);
  const [position, setPosition] = useState<Point | null>(null);
  const [dragging, setDragging] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { role: "assistant", content: "Ni hao, wo shi ni de wang zhan xiao mo fa shi." },
  ]);
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState("");

  const petRef = useRef<HTMLDivElement>(null);
  const sleepTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const talkTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dragState = useRef<DragState | null>(null);

  const resetSleepTimer = () => {
    if (sleepTimer.current) clearTimeout(sleepTimer.current);
    sleepTimer.current = setTimeout(() => {
      setBubble(sleepLine);
      setTalking(false);
      setExcited(false);
      setSleeping(true);
    }, idleAfterMs);
  };

  const showBubble = (text: string, timeout = 3600) => {
    if (talkTimer.current) clearTimeout(talkTimer.current);

    setBubble(text);
    setSleeping(false);
    setTalking(true);
    setExcited(true);

    window.setTimeout(() => setExcited(false), 560);
    talkTimer.current = setTimeout(() => setTalking(false), timeout);
    resetSleepTimer();
  };

  const randomLine = () => petLines[Math.floor(Math.random() * petLines.length)];

  const clamp = (value: number, min: number, max: number) => {
    return Math.max(min, Math.min(max, value));
  };

  const movePet = (clientX: number, clientY: number) => {
    const pet = petRef.current;
    const drag = dragState.current;
    if (!pet || !drag) return;

    const width = pet.offsetWidth;
    const height = pet.offsetHeight;
    const x = clamp(clientX - drag.offsetX, 8, window.innerWidth - width - 8);
    const y = clamp(clientY - drag.offsetY, 8, window.innerHeight - height - 8);
    setPosition({ x, y });
  };

  const sendChatMessage = async () => {
    const message = chatInput.trim();
    if (!message || chatLoading) return;

    const nextMessages: ChatMessage[] = [...chatMessages, { role: "user", content: message }];
    setChatMessages(nextMessages);
    setChatInput("");
    setChatError("");
    setChatLoading(true);
    showBubble("Thinking...");

    try {
      const response = await fetch("/api/pet-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message,
          history: chatMessages,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Pet chat failed.");
      }

      const reply = typeof data.reply === "string" ? data.reply : "Wo gang gang zou shen le, zai shuo yi ci?";
      setChatMessages([...nextMessages, { role: "assistant", content: reply }]);
      showBubble(reply.slice(0, 42));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Pet chat failed.";
      setChatError(message);
      setChatMessages([
        ...nextMessages,
        {
          role: "assistant",
          content: "API hai mei jie hao. Qing xian jian cha .env.local li de DEEPSEEK_API_KEY.",
        },
      ]);
      showBubble("API key needs setup.");
    } finally {
      setChatLoading(false);
    }
  };

  useEffect(() => {
    const introTimer = setTimeout(() => setTalking(false), 4200);
    resetSleepTimer();

    const wake = () => {
      if (sleeping) setSleeping(false);
      resetSleepTimer();
    };

    window.addEventListener("mousemove", wake, { passive: true });
    window.addEventListener("keydown", wake);
    window.addEventListener("scroll", wake, { passive: true });
    window.addEventListener("touchstart", wake, { passive: true });

    return () => {
      clearTimeout(introTimer);
      if (sleepTimer.current) clearTimeout(sleepTimer.current);
      if (talkTimer.current) clearTimeout(talkTimer.current);
      window.removeEventListener("mousemove", wake);
      window.removeEventListener("keydown", wake);
      window.removeEventListener("scroll", wake);
      window.removeEventListener("touchstart", wake);
    };
  }, [sleeping]);

  return (
    <div
      ref={petRef}
      className={[
        "fixed z-[90] w-[132px] select-none sm:w-[184px] lg:w-[214px]",
        dragging ? "cursor-grabbing" : "",
      ].join(" ")}
      style={
        position
          ? { left: position.x, top: position.y, touchAction: "none" }
          : { right: 18, bottom: 18, touchAction: "none" }
      }
      aria-label="pixel pet"
    >
      {chatOpen && (
        <section className="absolute right-0 bottom-[calc(100%+12px)] flex h-[360px] w-[min(330px,calc(100vw-28px))] flex-col overflow-hidden rounded-lg border border-white/15 bg-black/85 text-white shadow-2xl backdrop-blur-md">
          <div className="flex items-center justify-between border-b border-white/10 px-3 py-2">
            <div>
              <h2 className="text-sm font-semibold">Magic Pet Chat</h2>
              <p className="text-xs text-white/55">Ask your website pet anything.</p>
            </div>
            <button
              type="button"
              className="rounded px-2 py-1 text-sm text-white/70 hover:bg-white/10 hover:text-white"
              onClick={() => setChatOpen(false)}
              aria-label="close pet chat"
            >
              X
            </button>
          </div>

          <div className="flex-1 space-y-2 overflow-y-auto px-3 py-3 text-sm">
            {chatMessages.map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                className={[
                  "max-w-[86%] rounded-lg px-3 py-2 leading-relaxed",
                  message.role === "user"
                    ? "ml-auto bg-white text-black"
                    : "mr-auto border border-white/10 bg-white/10 text-white",
                ].join(" ")}
              >
                {message.content}
              </div>
            ))}
            {chatLoading && <div className="mr-auto rounded-lg bg-white/10 px-3 py-2 text-sm">Thinking...</div>}
            {chatError && <div className="rounded border border-red-400/30 bg-red-500/15 px-3 py-2 text-xs text-red-100">{chatError}</div>}
          </div>

          <form
            className="flex gap-2 border-t border-white/10 p-2"
            onSubmit={(event) => {
              event.preventDefault();
              void sendChatMessage();
            }}
          >
            <input
              value={chatInput}
              onChange={(event) => setChatInput(event.target.value)}
              className="min-w-0 flex-1 rounded border border-white/10 bg-white/10 px-3 py-2 text-sm text-white outline-none placeholder:text-white/35 focus:border-white/35"
              placeholder="Type here..."
              disabled={chatLoading}
            />
            <button
              type="submit"
              className="rounded bg-white px-3 py-2 text-sm font-medium text-black disabled:cursor-not-allowed disabled:opacity-50"
              disabled={chatLoading || !chatInput.trim()}
            >
              Send
            </button>
          </form>
        </section>
      )}

      <div
        className={[
          "absolute right-0 bottom-[calc(100%-8px)] max-w-[min(260px,calc(100vw-40px))] origin-bottom-right rounded-lg border-2 border-white/85 bg-[#201713] px-3 py-2 text-left text-[13px] leading-snug text-[#fff9ee] shadow-2xl transition duration-200 sm:text-sm",
          talking || sleeping ? "translate-y-0 scale-100 opacity-100" : "translate-y-2 scale-95 opacity-0",
        ].join(" ")}
        role="status"
      >
        {bubble}
        <span className="absolute right-6 bottom-[-10px] h-4 w-4 rotate-45 border-r-2 border-b-2 border-white/85 bg-[#201713]" />
      </div>

      <button
        type="button"
        aria-label="interact with pet"
        className={[
          "relative block aspect-square w-full cursor-grab border-0 bg-transparent p-0 [image-rendering:pixelated] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white",
          excited ? "animate-[magic-pet-hop_520ms_ease]" : "animate-[magic-pet-float_3.6s_ease-in-out_infinite]",
        ].join(" ")}
        onClick={() => {
          if (dragState.current?.moved) return;
          setChatOpen((open) => !open);
          showBubble(chatOpen ? randomLine() : "Chat with me!");
        }}
        onPointerDown={(event) => {
          const rect = petRef.current?.getBoundingClientRect();
          if (!rect) return;

          dragState.current = {
            startX: event.clientX,
            startY: event.clientY,
            offsetX: event.clientX - rect.left,
            offsetY: event.clientY - rect.top,
            moved: false,
          };
          event.currentTarget.setPointerCapture(event.pointerId);
          setDragging(true);
          resetSleepTimer();
        }}
        onPointerMove={(event) => {
          const drag = dragState.current;
          if (!drag) return;

          const distance = Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY);
          if (distance > 4) drag.moved = true;
          if (drag.moved) movePet(event.clientX, event.clientY);
        }}
        onPointerUp={(event) => {
          event.currentTarget.releasePointerCapture(event.pointerId);
          setDragging(false);
          dragState.current = null;
          resetSleepTimer();
        }}
        onPointerCancel={() => {
          setDragging(false);
          dragState.current = null;
          resetSleepTimer();
        }}
      >
        <span className="absolute right-[18%] bottom-[5%] left-[23%] h-[10%] rounded-full bg-black/25 blur-md animate-[magic-pet-shadow_3.6s_ease-in-out_infinite]" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          className={[
            "relative z-10 block h-full w-full object-contain drop-shadow-[0_18px_18px_rgba(0,0,0,0.32)] transition duration-200",
            talking ? "-translate-y-1 scale-[1.03]" : "",
            sleeping ? "rotate-[-3deg] scale-95 grayscale-[0.2]" : "",
          ].join(" ")}
          src="/images/magic-pixel-pet.png"
          alt="blue-haired wizard pixel pet"
          draggable={false}
        />
      </button>

      <style jsx global>{`
        @keyframes magic-pet-float {
          0%,
          100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-8px);
          }
        }

        @keyframes magic-pet-shadow {
          0%,
          100% {
            opacity: 0.2;
            transform: scale(0.96);
          }
          50% {
            opacity: 0.12;
            transform: scale(0.84);
          }
        }

        @keyframes magic-pet-hop {
          0%,
          100% {
            transform: translateY(0) rotate(0);
          }
          35% {
            transform: translateY(-18px) rotate(-2deg);
          }
          65% {
            transform: translateY(-6px) rotate(2deg);
          }
        }
      `}</style>
    </div>
  );
}
