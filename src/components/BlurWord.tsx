"use client";

import { useEffect, useState } from "react";
import BlurLetters, { type LetterPhase } from "./BlurLetters";

// A finished word holds this long before it leaves (as TypingWord's pause).
const HOLD_MS = 1500;

/**
 * The hero's changing word on the "blur" entrance profile (the home): the
 * Blur Text counterpart of TypingWord. Instead of typing and deleting, the
 * words flow downward through their place: each one leaves letter by letter,
 * last letter first, dropping out of focus below, and the next arrives letter
 * by letter, dropping into focus from just above (BlurLetters).
 *
 * It shows `words[0]` until `active` turns on (the hero switches it on once
 * the word has finished its own entrance with the heading), so the server,
 * reduced motion and no-JS just show the first word. The letters are always
 * their own boxes, so the word doesn't shift when the cycle starts.
 */
export default function BlurWord({ words, active }: { words: string[]; active: boolean }) {
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<LetterPhase>("rest");

  // Hold the word that's up, then send it off.
  useEffect(() => {
    if (!active || phase !== "rest") return;
    const timer = window.setTimeout(() => setPhase("out"), HOLD_MS);
    return () => window.clearTimeout(timer);
  }, [active, phase]);

  const onDone = (done: "in" | "out") => {
    if (done === "out") {
      setIndex((i) => (i + 1) % words.length);
      setPhase("in");
    } else {
      setPhase("rest");
    }
  };

  return (
    <span className="text-muted">
      <em className="italic">
        <BlurLetters text={words[index]} phase={phase} onDone={onDone} />
      </em>
    </span>
  );
}
