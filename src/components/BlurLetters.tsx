import type { ReactNode } from "react";

/**
 * Where a run of letters is in its Blur Text swap: at rest, leaving (each
 * letter dropping out of focus below, last letter first) or arriving (each
 * dropping into focus from just above, first letter first). The moves live in
 * globals.css (`.blur-letter`); the hero's changing word (BlurWord) and the
 * menu links' hover (BlurHoverLink) both drive their swaps through this.
 */
export type LetterPhase = "rest" | "out" | "in";

// Letters arrive one after another, first to last, and leave quicker, last
// to first, like a typed word being deleted (seconds between letters).
export const WORD_STAGGER = { in: 0.04, out: 0.025 };

export default function BlurLetters({
  text,
  phase,
  onDone,
  italicizeI = false,
  stagger = WORD_STAGGER,
}: {
  text: string;
  phase: LetterPhase;
  /** Called once the whole run has finished leaving or arriving. */
  onDone: (phase: Exclude<LetterPhase, "rest">) => void;
  /** Set every "i" in italic (the site's Instrument Serif flourish). */
  italicizeI?: boolean;
  /** Seconds between letters, arriving and leaving. */
  stagger?: { in: number; out: number };
}) {
  const letters = Array.from(text);
  const last = letters.length - 1;
  // The letter that finishes last: the final one arriving, the first one leaving.
  const finishing = phase === "in" ? last : 0;

  return letters.map((letter, i) => {
    const glyph: ReactNode = italicizeI && (letter === "i" || letter === "í") ? <em className="italic">{letter}</em> : letter;
    return (
      <span
        // Keyed by the text, so a new word gets fresh letters while the same
        // one just swaps its move.
        key={`${text}-${i}`}
        className="blur-letter"
        data-phase={phase}
        style={{
          animationDelay:
            phase === "in" ? `${(i * stagger.in).toFixed(3)}s` : phase === "out" ? `${((last - i) * stagger.out).toFixed(3)}s` : undefined,
        }}
        onAnimationEnd={phase !== "rest" && i === finishing ? () => onDone(phase) : undefined}
      >
        {glyph}
      </span>
    );
  });
}
