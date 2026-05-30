export default function Footer({
  copyright,
  tagline,
}: {
  copyright?: string;
  tagline?: string;
}) {
  return (
    <footer className="border-t border-white/[0.06] bg-black/20 backdrop-blur-sm">
      <div className="mx-auto max-w-6xl px-6 py-6 flex flex-col items-center gap-1.5 sm:flex-row sm:justify-between">
        <p className="text-xs text-white/40">
          &copy; {new Date().getFullYear()} {copyright || "KK🐱"}
        </p>
        {tagline && (
          <p className="text-xs text-white/40">{tagline}</p>
        )}
      </div>
    </footer>
  );
}
