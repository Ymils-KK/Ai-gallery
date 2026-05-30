export default function VideoBg() {
  return (
    <div className="fixed inset-0 z-0 pointer-events-none">
      <video
        autoPlay
        muted
        loop
        playsInline
        className="absolute inset-0 h-full w-full object-cover"
      >
        <source src="/bg.mp4" type="video/mp4" />
      </video>
      {/* 暗色叠加层 */}
      <div className="absolute inset-0 bg-black/30" />
    </div>
  );
}
