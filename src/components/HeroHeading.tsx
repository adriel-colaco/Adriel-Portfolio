"use client";

import { Fragment, useState } from "react";
import type { CSSProperties } from "react";
import ItalicI from "./ItalicI";
import { SplitWord } from "./SplitText";
import TypingWord from "./TypingWord";
import BlurWord from "./BlurWord";
import { useEntrance } from "./Entrance";
import {
  HEADING_START,
  HEADING_STAGGER,
  HERO_LABEL,
  HERO_LEAD,
  HERO_TAIL_LINES,
  HERO_WORDS,
  INTRO_EASE,
} from "./intro";

/**
 * The hero heading (Figma 31:66): "I design <word>" on the first line — the
 * italic <word> typing itself through HERO_WORDS — and the tail below it, on
 * its fixed lines (HERO_TAIL_LINES). No line ever wraps.
 * Every word rises in on the intro timeline; the typing starts once the typed
 * word's own rise has finished (so it never runs under reduced motion, where
 * there is no rise). Screen readers get the whole sentence instead of the
 * animation.
 */
export default function HeroHeading({ className, style }: { className?: string; style?: CSSProperties }) {
  const [typing, setTyping] = useState(false);
  // On the "blur" entrance profile (the home) the word changes letter by letter in
  // Blur Text's move instead of typing itself.
  const ChangingWord = useEntrance() === "blur" ? BlurWord : TypingWord;
  const lead = HERO_LEAD.split(" ");
  const tail = HERO_TAIL_LINES.map((line) => line.split(" "));
  // Index of each tail line's first word in the whole heading, for the stagger.
  const tailStarts = tail.map((_, l) => lead.length + 1 + tail.slice(0, l).flat().length);
  const delay = (i: number) => HEADING_START + i * HEADING_STAGGER;
  const word = (text: string, i: number) => (
    <Fragment key={i}>
      <SplitWord delay={delay(i)} ease={INTRO_EASE}>
        <ItalicI>{text}</ItalicI>
      </SplitWord>{" "}
    </Fragment>
  );

  return (
    <h1 className={className} style={style}>
      <span className="sr-only">{HERO_LABEL}</span>
      {/* The first line never wraps, so the typed word can't reflow the rest. */}
      <span aria-hidden className="block whitespace-nowrap">
        {lead.map(word)}
        <SplitWord
          delay={delay(lead.length)}
          ease={INTRO_EASE}
          onAnimationEnd={(e) => e.target === e.currentTarget && setTyping(true)}
        >
          <ChangingWord words={HERO_WORDS} active={typing} />
        </SplitWord>
      </span>
      {tail.map((words, l) => (
        <span key={l} aria-hidden className="block whitespace-nowrap">
          {words.map((text, i) => word(text, tailStarts[l] + i))}
        </span>
      ))}
    </h1>
  );
}
