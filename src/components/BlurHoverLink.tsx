"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import type { CSSProperties } from "react";
import BlurLetters, { type LetterPhase } from "./BlurLetters";
import { prefersReducedMotion } from "./parallaxTicker";

type Tone = "ink" | "muted";

// A hover has to answer quickly, but still read as the hero word's move: the
// same swap on the interface's curve, about half the word's timing, with a
// smaller travel that stays inside the link's mask.
const HOVER_MOVE = {
  "--letter-in": "0.8s",
  "--letter-out": "0.32s",
  "--letter-ease": "var(--ease-ui)",
  "--letter-travel": "0.1em",
  "--letter-blur": "6px",
} as CSSProperties;
const HOVER_STAGGER = { in: 0.03, out: 0.018 };

/**
 * A menu link's hover on the "blur" entrance profile (the home), in the
 * hero's changing-word move (BlurLetters): hovering (or focusing) it sends the
 * label out letter by letter, dropping below, and brings it back from above
 * in the heading's grey; leaving swaps it back to blue the same way. It
 * answers at once: if the pointer changes its mind while the label is coming
 * back in, it turns around and leaves again straight away (while it's leaving,
 * it just comes back in the new colour).
 */
export default function BlurHoverLink({
  href,
  label,
  className,
  onClick,
}: {
  href: string;
  label: string;
  className?: string;
  onClick?: () => void;
}) {
  const [tone, setTone] = useState<Tone>("ink");
  const [phase, setPhase] = useState<LetterPhase>("rest");
  const target = useRef<Tone>("ink");

  const aim = (next: Tone) => {
    target.current = next;
    // No moves under reduced motion: just the colour.
    if (prefersReducedMotion()) return setTone(next);
    if (phase === "rest" && tone !== next) setPhase("out");
    else if (phase === "in" && tone !== next) setPhase("out");
  };

  const onDone = (done: "in" | "out") => {
    if (done === "out") {
      // Hidden now: take the colour it's heading for, then come back in.
      setTone(target.current);
      setPhase("in");
    } else {
      setPhase(target.current !== tone ? "out" : "rest");
    }
  };

  return (
    <Link
      href={href}
      onClick={onClick}
      className={className}
      onPointerEnter={() => aim("muted")}
      onPointerLeave={() => aim("ink")}
      onFocus={() => aim("muted")}
      onBlur={() => aim("ink")}
    >
      <span className={`whitespace-nowrap ${tone === "muted" ? "text-muted" : "text-ink"}`} style={HOVER_MOVE}>
        <BlurLetters text={label} phase={phase} onDone={onDone} italicizeI stagger={HOVER_STAGGER} />
      </span>
    </Link>
  );
}
