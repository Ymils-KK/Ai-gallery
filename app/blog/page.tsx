import { getAllPosts } from "@/lib/posts";
import BlogCard from "@/components/BlogCard";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "博客",
  description: "关于 AI 创作的心得、教程和思考",
};

export default function BlogPage() {
  const posts = getAllPosts();

  return (
    <div className="relative z-10 mx-auto max-w-3xl px-6 py-16 sm:py-24">
      <div className="rounded-2xl bg-black/40 backdrop-blur-xl border border-white/[0.06] p-8 sm:p-10">
      <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
        <span className="text-gradient">博客</span>
      </h1>
      <p className="mt-4 text-lg text-white/60 leading-relaxed">
        AI 创作心得、教程和思考。
      </p>

      {posts.length === 0 ? (
        <div className="mt-16 flex flex-col items-center justify-center py-20 text-muted">
          <p className="text-lg">还没有文章</p>
          <p className="mt-1 text-sm">在 content/blog/ 文件夹中添加 .md 文件即可</p>
        </div>
      ) : (
        <div className="mt-12 grid gap-6">
          {posts.map((post) => (
            <BlogCard key={post.slug} post={post} />
          ))}
        </div>
      )}
      </div>
    </div>
  );
}
