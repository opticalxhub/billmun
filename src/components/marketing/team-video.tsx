'use client';

export default function TeamVideo() {
  return (
    <div className="relative mx-auto w-full max-w-4xl overflow-hidden rounded-2xl bg-black shadow-2xl">
      <video
        key="team-video"
        src="/billeb.mp4"
        controls
        playsInline
        preload="metadata"
        className="h-auto max-h-[70vh] w-full"
        style={{ display: 'block' }}
      >
        Your browser does not support the video tag.
      </video>
    </div>
  );
}
