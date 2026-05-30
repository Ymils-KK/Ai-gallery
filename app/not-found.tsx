import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "页面未找到",
};

export default function NotFound() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center py-32 text-center px-6">
      <h1 className="text-7xl font-bold text-gradient">404</h1>
      <p className="mt-4 text-lg text-muted">抱歉，页面不存在</p>
      <Link
        href="/"
        className="mt-8 inline-flex items-center gap-2 rounded-lg bg-white/10 px-6 py-3 text-sm font-medium text-white shadow-lg  transition-all hover:bg-white/20"
      >
        返回首页
      </Link>
    </div>
  );
}
