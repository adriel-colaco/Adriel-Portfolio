import { Fragment } from "react";
import type { AnimationEventHandler, ReactNode } from "react";
import { INTRO_DURATION } from "./intro";

type SplitTextProps = {
  text: string;
  /** Italicize every "i" (matches the hero's Instrument Serif flourish). */
  italicizeI?: boolean;
  /** Seconds of delay added per word (the stagger). */
  stagger?: number;
  /** Seconds each word takes to rise in (default: the entrance token, --dur-enter). */
  duration?: number;
  /** Seconds before the first word starts. */
  startDelay?: number;
};

function renderWord(word: string, italicizeI: boolean) {
  if (!italicizeI) return word;
  return Array.from(word).map((char, i) =>
    char === "i" ? (
      <em key={i} className="italic">
        i
      </em>
    ) : (
      <Fragment key={i}>{char}</Fragment>
    ),
  );
}

/**
 * One word of the rise reveal: it slides up from below its own clipping mask
 * (`.split-mask` / `.split-word` in globals.css). Exported so a heading can mix
 * plain words with custom ones (like the hero's typed word) on the same move.
 */
export function SplitWord({
  delay,
  duration,
  ease,
  onAnimationEnd,
  children,
}: {
  /** Seconds before this word starts rising. */
  delay: number;
  /** Seconds it takes to rise in (default: the entrance token, --dur-enter). */
  duration?: number;
  /** CSS timing function; defaults to `.split-word`'s curve (--ease-enter). */
  ease?: string;
  onAnimationEnd?: AnimationEventHandler<HTMLSpanElement>;
  children: ReactNode;
}) {
  return (
    <span aria-hidden className="split-mask">
      <span
        className="split-word"
        style={{
          animationDelay: `${delay.toFixed(3)}s`,
          animationDuration: duration === undefined ? INTRO_DURATION : `${duration}s`,
          animationTimingFunction: ease,
        }}
        onAnimationEnd={onAnimationEnd}
      >
        {children}
      </span>
    </span>
  );
}

/**
 * Word-by-word rise reveal: each word slides up from below a clipping mask, so
 * the text appears to expand upward with a stagger. Pure CSS — auto-plays on
 * load, no JS, no flash, and is disabled under prefers-reduced-motion. Words
 * stay whole so wrapping is kept.
 */
export default function SplitText({
  text,
  italicizeI = false,
  stagger = 0.07,
  duration,
  startDelay = 0.1,
}: SplitTextProps) {
  const words = text.split(" ");

  return (
    <span aria-label={text}>
      {words.map((word, wordIndex) => (
        <Fragment key={wordIndex}>
          <SplitWord delay={startDelay + wordIndex * stagger} duration={duration}>
            {renderWord(word, italicizeI)}
          </SplitWord>
          {wordIndex < words.length - 1 ? " " : null}
        </Fragment>
      ))}
    </span>
  );
}
