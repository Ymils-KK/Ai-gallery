"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { LockKeyhole, LogIn } from "lucide-react";

const STORAGE_KEY = "kk_private_mode_unlocked";
const PASSPHRASE = "114514";
const privateRoutes = ["/script-analysis", "/asset-library"];

type PrivateModeContextValue = {
  unlocked: boolean;
  ready: boolean;
  unlock: (passphrase: string) => boolean;
  lock: () => void;
};

const PrivateModeContext = createContext<PrivateModeContextValue | null>(null);

export function PrivateModeProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [unlocked, setUnlocked] = useState(false);

  useEffect(() => {
    setUnlocked(localStorage.getItem(STORAGE_KEY) === "true");
    setReady(true);
  }, []);

  const value = useMemo<PrivateModeContextValue>(
    () => ({
      unlocked,
      ready,
      unlock(passphrase: string) {
        const ok = passphrase.trim() === PASSPHRASE;
        if (ok) {
          localStorage.setItem(STORAGE_KEY, "true");
          setUnlocked(true);
        }
        return ok;
      },
      lock() {
        localStorage.removeItem(STORAGE_KEY);
        setUnlocked(false);
      },
    }),
    [unlocked, ready]
  );

  return <PrivateModeContext.Provider value={value}>{children}</PrivateModeContext.Provider>;
}

export function usePrivateMode() {
  const context = useContext(PrivateModeContext);
  if (!context) throw new Error("usePrivateMode must be used inside PrivateModeProvider");
  return context;
}

export function PrivateRouteGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { ready, unlocked, unlock } = usePrivateMode();
  const [passphrase, setPassphrase] = useState("");
  const [error, setError] = useState("");

  const isPrivateRoute = privateRoutes.some((route) => pathname.startsWith(route));

  if (!isPrivateRoute || unlocked) return <>{children}</>;

  return (
    <section className="relative z-10 flex min-h-[calc(100vh-3.5rem)] items-center justify-center px-6 py-16">
      <form
        className="w-full max-w-sm rounded-lg border border-white/12 bg-black/70 p-6 text-white shadow-2xl backdrop-blur-xl"
        onSubmit={(event) => {
          event.preventDefault();
          if (unlock(passphrase)) {
            setError("");
            return;
          }
          setError("暗号不对，再试一次。");
        }}
      >
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/12 bg-white/8">
            <LockKeyhole className="h-5 w-5 text-white/80" />
          </div>
          <div>
            <h1 className="text-lg font-semibold">私人入口</h1>
            <p className="text-sm text-white/45">输入暗号后继续访问。</p>
          </div>
        </div>

        <input
          value={passphrase}
          onChange={(event) => {
            setPassphrase(event.target.value);
            setError("");
          }}
          type="password"
          autoFocus={ready}
          placeholder="输入暗号"
          className="w-full rounded-md border border-white/12 bg-white/8 px-3 py-2.5 text-sm text-white outline-none placeholder:text-white/30 focus:border-white/35"
        />
        {error && <p className="mt-2 text-sm text-red-200">{error}</p>}
        <button
          type="submit"
          className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-md bg-white px-4 py-2.5 text-sm font-medium text-black transition hover:bg-white/90"
        >
          <LogIn className="h-4 w-4" />
          进入
        </button>
      </form>
    </section>
  );
}
