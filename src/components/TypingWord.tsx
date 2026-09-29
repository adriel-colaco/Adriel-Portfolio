"use client";

import { useEffect, useState } from "react";

// Typing rhythm, after React Bits' TextType demo: letters go in at a random,
// human-feeling pace, come out faster, and a finished word holds a beat.
const TYPING_SPEED = { min: 60, max: 120 }; // ms per letter typed
const DELETING_SPEED = 50; // ms per letter deleted
const PAUSE_DURATION = 1500; // a finished word stays up this long

/**
 * A word that types itself through `words` in a loop: holds, deletes letter by
 * letter, types the next. It renders `words[0]` until `active` turns on, so the
 * server (and reduced motion, and no JS) just shows the first word — the hero
 * switches it on once the word has finished its entrance. The "_" cursor only
 * shows while it's active: solid while typing, blinking while a word holds.
 */
export default function TypingWord({ words, active }: { words: string[]; active: boolean }) {
  const [text, setText] = useState(words[0]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!active) return;
    let timer = 0;
    let index = 0;
    let shown = words[0];
    const wait = (ms: number, next: () => void) => {
      timer = window.setTimeout(next, ms);
    };
    const typingDelay = () => TYPING_SPEED.min + Math.random() * (TYPING_SPEED.max - TYPING_SPEED.min);

    const type = () => {
      const word = words[index];
      if (shown === word) return hold();
      shown = word.slice(0, shown.length + 1);
      setText(shown);
      wait(typingDelay(), type);
    };
    const erase = () => {
      setBusy(true);
      if (!shown) {
        index = (index + 1) % words.length;
        return wait(typingDelay(), type);
      }
      shown = shown.slice(0, -1);
      setText(shown);
      wait(DELETING_SPEED, erase);
    };
    const hold = () => {
      setBusy(false);
      wait(PAUSE_DURATION, erase);
    };

    hold(); // the first word is already up — it rose in with the heading
    return () => window.clearTimeout(timer);
  }, [active, words]);

  // Set in the muted grey, cursor included, so the changing word reads apart
  // from the rest of the heading.
  return (
    <span className="text-muted">
      <em className="italic">{text}</em>
      <span aria-hidden className="typing-cursor" data-active={active} data-busy={busy}>
        _
      </span>
    </span>
  );
}
