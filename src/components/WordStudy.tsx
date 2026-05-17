import { ArrowLeft, Shuffle, Volume2, VolumeX } from "lucide-react";
import { useState } from "react";
import type { DayLesson, DisplayMode } from "../types";
import { speakEnglish, speakEnglishSequence, stopEnglishSpeech } from "../utils/speech";
import { DisplayModeToggle } from "./DisplayModeToggle";

type WordStudyProps = {
  lesson: DayLesson;
  onQuiz: () => void;
  onBack: () => void;
};

export function WordStudy({ lesson, onQuiz, onBack }: WordStudyProps) {
  const [displayMode, setDisplayMode] = useState<DisplayMode>("both");
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const showEnglish = displayMode !== "hideEnglish";
  const showChinese = displayMode !== "hideChinese";

  const handleStop = () => {
    stopEnglishSpeech();
    setActiveIndex(null);
  };

  const readAll = () => {
    speakEnglishSequence(
      lesson.words.map((word) => ({ text: word.english, audioSrc: word.audioSrc })),
      {
        gapMs: 260,
        onIndexChange: setActiveIndex,
      },
    );
  };

  const readOne = (index: number) => {
    const word = lesson.words[index];
    setActiveIndex(index);
    speakEnglish({ text: word.english, audioSrc: word.audioSrc }).finally(() => {
      setActiveIndex((value) => (value === index ? null : value));
    });
  };

  return (
    <section className="page-section">
      <div className="learning-toolbar">
        <button className="icon-text-button quiet" type="button" onClick={onBack}>
          <ArrowLeft aria-hidden="true" size={22} />
          返回
        </button>
        <DisplayModeToggle value={displayMode} onChange={setDisplayMode} />
      </div>

      <div className="section-heading">
        <div>
          <p className="section-kicker">{lesson.title}</p>
          <h2>20 个单词学习</h2>
        </div>
        <div className="action-strip compact">
          <button className="primary-action" type="button" onClick={readAll}>
            <Volume2 aria-hidden="true" size={21} />
            朗读全部
          </button>
          <button className="secondary-action" type="button" onClick={handleStop}>
            <VolumeX aria-hidden="true" size={21} />
            停止朗读
          </button>
          <button className="secondary-action" type="button" onClick={onQuiz}>
            <Shuffle aria-hidden="true" size={21} />
            随机自测
          </button>
        </div>
      </div>

      <div className="word-list">
        {lesson.words.map((word, index) => (
          <article className={`word-row ${activeIndex === index ? "speaking" : ""}`} key={`${word.index}-${word.english}`}>
            <div className="item-index">{word.index}</div>
            <div className="word-main">
              {showEnglish && (
                <p className="word-english">
                  {word.english}
                  {word.phonetic && <span>{word.phonetic}</span>}
                </p>
              )}
              {showChinese && <p className="word-chinese">{word.chinese}</p>}
            </div>
            <button className="icon-button" type="button" aria-label={`朗读 ${word.english}`} onClick={() => readOne(index)}>
              <Volume2 aria-hidden="true" size={21} />
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}
