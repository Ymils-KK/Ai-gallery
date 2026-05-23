import Gallery from "@/components/Gallery";
import works from "@/content/works";

export default function HomePage() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-16 sm:py-24">
      {/* Hero */}
      <section className="mb-16 text-center sm:text-left">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
          探索 <span className="text-gradient">AI 创作</span>
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-muted leading-relaxed">
          这里展示我用 AI 工具生成的图片、视频和创意作品。每一件作品都是想象力与算法的碰撞。
        </p>
      </section>

      {/* Gallery */}
      <section>
        <Gallery works={works} />
      </section>
    </div>
  );
}
