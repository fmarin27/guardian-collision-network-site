"use client";

import { useEffect, useRef, useState } from "react";

type IntroVideoProps = {
  src: string;
  poster?: string;
  className?: string;

  /** If true, video fills parent (no 16:9 box). */
  fill?: boolean;

  /** Set true if you always want native controls visible. */
  showControls?: boolean;

  /** Optional .vtt captions file */
  captionsSrc?: string;
};

export default function IntroVideo({
  src,
  poster,
  className = "",
  fill = false,
  showControls = false,
  captionsSrc,
}: IntroVideoProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [canAutoPlay, setCanAutoPlay] = useState(true);
  const [muted, setMuted] = useState(true);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;

    const tryPlay = async () => {
      try {
        v.muted = true;
        setMuted(true);
        const p = v.play();
        if (p) await p;
        setStarted(true);
        setCanAutoPlay(true);
      } catch {
        setCanAutoPlay(false);
      }
    };

    tryPlay();
  }, []);

  const handleClick = async () => {
    const v = videoRef.current;
    if (!v) return;

    try {
      if (v.paused) {
        await v.play();
        setStarted(true);
      } else {
        v.pause();
      }
    } catch {
      setCanAutoPlay(false);
    }
  };

  const toggleMute = () => {
    const v = videoRef.current;
    if (!v) return;
    const next = !muted;
    v.muted = next;
    setMuted(next);
  };

  return (
    <div className={["relative w-full", fill ? "h-full" : "", className].join(" ")}>
      {/* If fill=true, we do NOT force aspect ratio. */}
      <div className={fill ? "relative h-full w-full" : "relative w-full aspect-video"}>
        <video
          ref={videoRef}
          className="absolute inset-0 h-full w-full object-cover"
          src={src}
          poster={poster}
          playsInline
          muted={muted}
          controls={showControls}
          preload="metadata"
          onClick={handleClick}
        >
          {captionsSrc ? (
            <track kind="captions" src={captionsSrc} srcLang="en" label="English" default />
          ) : null}
        </video>

        {/* Click-to-play overlay (only if autoplay was blocked and not started) */}
        {!canAutoPlay && !started && (
          <button
            onClick={handleClick}
            className="absolute inset-0 grid place-items-center bg-black/40"
            aria-label="Play intro video"
            type="button"
          >
            <div className="rounded-full border border-white/20 bg-black/60 px-5 py-3 text-sm text-white">
              ▶ Play Intro
            </div>
          </button>
        )}

        {/* Bottom controls (mute toggle) */}
        <div className="absolute bottom-3 right-3">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              toggleMute();
            }}
            className="rounded-full border border-white/15 bg-black/55 px-3 py-1 text-xs text-white hover:bg-black/70"
            aria-label={muted ? "Unmute video" : "Mute video"}
            title={muted ? "Unmute" : "Mute"}
          >
            {muted ? "🔇 Muted" : "🔊 Sound"}
          </button>
        </div>

        {/* Small hint if it’s playing muted */}
        {started && muted && (
          <div className="absolute left-3 bottom-3 rounded-full border border-white/15 bg-black/45 px-3 py-1 text-xs text-white/90">
            Tap 🔊 for sound
          </div>
        )}
      </div>
    </div>
  );
}
