import { notFound } from "next/navigation";
import { getPostBySlug, getAllPosts } from "@/lib/posts";
import { Calendar, ArrowLeft } from "lucide-react";
import Link from "next/link";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const posts = getAllPosts();
  return posts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return { title: "文章未找到" };

  return {
    title: post.title,
    description: post.description,
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  if (!post) notFound();

  return (
    <div className="relative z-10 mx-auto max-w-3xl px-6 py-16 sm:py-24">
      {/* 返回链接 */}
      <a
        href="/#blog"
        className="inline-flex items-center gap-2 text-sm text-white/60 hover:text-white transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        返回博客列表
      </a>

      {/* 文章卡片 */}
      <div className="mt-6 rounded-2xl bg-black/40 backdrop-blur-xl border border-white/[0.06] p-8 sm:p-10">

      {/* 文章头部 */}
      <header>
        <h1 className="text-3xl font-bold sm:text-4xl">{post.title}</h1>
        <div className="mt-4 flex items-center gap-6 text-sm text-muted">
          <span className="flex items-center gap-1.5">
            <Calendar className="h-4 w-4" />
            {post.date}
          </span>
        </div>
        <div className="mt-4 flex flex-wrap gap-1.5">
          {post.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-border bg-white/[0.03] px-3 py-1 text-xs text-muted"
            >
              {tag}
            </span>
          ))}
        </div>
      </header>

      {/* 文章内容 */}
      <article className="mt-12 prose prose-invert max-w-none">
        <Markdown
          remarkPlugins={[remarkGfm]}
          components={{
            h2: ({ children, ...props }) => (
              <h2
                className="mt-10 mb-4 text-2xl font-bold text-foreground"
                {...props}
              >
                {children}
              </h2>
            ),
            h3: ({ children, ...props }) => (
              <h3
                className="mt-8 mb-3 text-xl font-semibold text-foreground"
                {...props}
              >
                {children}
              </h3>
            ),
            p: ({ children, ...props }) => (
              <p
                className="my-4 leading-relaxed text-muted"
                {...props}
              >
                {children}
              </p>
            ),
            a: ({ children, href, ...props }) => (
              <a
                href={href}
                className="text-white/80 underline underline-offset-4 hover:text-white transition-colors"
                target="_blank"
                rel="noopener noreferrer"
                {...props}
              >
                {children}
              </a>
            ),
            ul: ({ children, ...props }) => (
              <ul
                className="my-4 list-disc pl-6 text-muted space-y-1"
                {...props}
              >
                {children}
              </ul>
            ),
            ol: ({ children, ...props }) => (
              <ol
                className="my-4 list-decimal pl-6 text-muted space-y-1"
                {...props}
              >
                {children}
              </ol>
            ),
            blockquote: ({ children, ...props }) => (
              <blockquote
                className="my-6 border-l-2 border-white/15 pl-4 italic text-muted"
                {...props}
              >
                {children}
              </blockquote>
            ),
            table: ({ children, ...props }) => (
              <div className="my-6 overflow-x-auto rounded-lg border border-border">
                <table
                  className="w-full text-sm text-muted"
                  {...props}
                >
                  {children}
                </table>
              </div>
            ),
            th: ({ children, ...props }) => (
              <th
                className="border-b border-border bg-white/[0.03] px-4 py-3 text-left font-semibold text-foreground"
                {...props}
              >
                {children}
              </th>
            ),
            td: ({ children, ...props }) => (
              <td
                className="border-b border-border px-4 py-3"
                {...props}
              >
                {children}
              </td>
            ),
            img: ({ src, alt, ...props }) => (
              <img
                src={src}
                alt={alt}
                className="my-6 rounded-xl w-full"
                {...props}
              />
            ),
            code: ({
              inline,
              className,
              children,
              ...props
            }: {
              inline?: boolean;
              className?: string;
              children?: React.ReactNode;
            }) => {
              if (inline) {
                return (
                  <code
                    className="rounded bg-white/[0.06] px-1.5 py-0.5 text-sm text-white/80"
                    {...props}
                  >
                    {children}
                  </code>
                );
              }
              return (
                <pre className="my-6 overflow-x-auto rounded-lg border border-border bg-white/[0.03] p-4 text-sm">
                  <code className={className} {...props}>
                    {children}
                  </code>
                </pre>
              );
            },
            strong: ({ children, ...props }) => (
              <strong
                className="font-semibold text-foreground"
                {...props}
              >
                {children}
              </strong>
            ),
            hr: (props) => (
              <hr className="my-8 border-border" {...props} />
            ),
          }}
        >
          {post.content}
        </Markdown>
      </article>
      </div>
    </div>
  );
}
