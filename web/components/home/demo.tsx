"use client";

// Timing for the self-playing demos: plays only while on screen and the tab is
// visible, always exposes Pause/Play and Replay, and under reduced motion opens
// paused on the final, most informative frame.
import { useCallback, useEffect, useRef, useState } from "react";

export interface Demo {
  step: number;
  playing: boolean;
  atEnd: boolean;
  toggle: () => void;
  replay: () => void;
  jump: (i: number, play?: boolean) => void;
}

/** Returns the element ref to attach (visibility is measured on it) and the demo state. */
export function useDemo(total: number, duration: number | ((step: number) => number)): [React.RefObject<HTMLDivElement | null>, Demo] {
  const ref = useRef<HTMLDivElement>(null);
  const [step, setStep] = useState(total - 1);
  const [playing, setPlaying] = useState(false);
  const [visible, setVisible] = useState(false);
  const [hidden, setHidden] = useState(false);
  const reduced = useRef(false);
  const started = useRef(false);

  useEffect(() => {
    reduced.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e) return;
        setVisible(e.isIntersecting);
        if (e.isIntersecting && !started.current) {
          started.current = true;
          if (!reduced.current) {
            setStep(0);
            setPlaying(true);
          }
        }
      },
      { threshold: 0.35 },
    );
    io.observe(el);
    const onVis = () => setHidden(document.hidden);
    document.addEventListener("visibilitychange", onVis);
    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  useEffect(() => {
    if (!playing || !visible || hidden) return;
    if (step >= total - 1) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPlaying(false);
      return;
    }
    const ms = typeof duration === "function" ? duration(step) : duration;
    const t = setTimeout(() => setStep((s) => Math.min(s + 1, total - 1)), ms);
    return () => clearTimeout(t);
  }, [playing, visible, hidden, step, total, duration]);

  const replay = useCallback(() => {
    started.current = true;
    setStep(0);
    setPlaying(true);
  }, []);

  const toggle = useCallback(() => {
    if (playing) setPlaying(false);
    else if (step >= total - 1) replay();
    else setPlaying(true);
  }, [playing, step, total, replay]);

  const jump = useCallback((i: number, play = false) => {
    started.current = true;
    setStep(i);
    setPlaying(play && !reduced.current);
  }, []);

  return [ref, { step, playing, atEnd: step >= total - 1, toggle, replay, jump }];
}

export function PlaybackControls({ demo, name }: { demo: Demo; name: string }) {
  return (
    <div className="playback" role="group" aria-label={`${name} playback`}>
      <button type="button" onClick={demo.toggle} aria-label={demo.playing ? `Pause the ${name}` : `Play the ${name}`}>
        {demo.playing ? (
          <>
            Pause <span aria-hidden>Ⅱ</span>
          </>
        ) : (
          <>
            Play <span aria-hidden>▷</span>
          </>
        )}
      </button>
      <button type="button" onClick={demo.replay} aria-label={`Replay the ${name}`}>
        Replay <span aria-hidden>↻</span>
      </button>
      <span className="sr-only" aria-live="polite">
        {demo.playing ? "Demonstration in progress" : "Demonstration paused"}
      </span>
    </div>
  );
}
