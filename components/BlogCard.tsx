import Link from "next/link";
import { Calendar } from "lucide-react";
import type { BlogPost } from "@/lib/posts";

export default function BlogCard({ post }: { post: BlogPost }) {
  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group block rounded-xl border border-border bg-card p-6 transition-all duration-300 card-glow"
    >
      <div className="flex items-center gap-3 text-sm text-muted">
        <Calendar className="h-4 w-4" />
        <time>{post.date}</time>
      </div>

      <h3 className="mt-3 text-xl font-semibold text-foreground group-hover:text-accent transition-colors duration-200">
        {post.title}
      </h3>

      <p className="mt-2 text-sm text-muted leading-relaxed line-clamp-2">
        {post.description}
      </p>

      <div className="mt-4 flex flex-wrap gap-1.5">
        {post.tags.map((tag) => (
          <span
            key={tag}
            className="rounded-full border border-border bg-white/[0.03] px-2.5 py-0.5 text-xs text-muted"
          >
            {tag}
          </span>
        ))}
      </div>
    </Link>
  );
}
