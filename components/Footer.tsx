export default function Footer() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto max-w-6xl px-6 py-8 flex flex-col items-center gap-2 sm:flex-row sm:justify-between">
        <p className="text-sm text-muted">
          &copy; {new Date().getFullYear()} AI Gallery. All rights reserved.
        </p>
        <p className="text-sm text-muted">
          用 AI 创作 &middot; 用心分享
        </p>
      </div>
    </footer>
  );
}
