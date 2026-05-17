import { ArrowLeft, Shuffle, Volume2, VolumeX } from "lucide-react";
import { useState } from "react";
import type { DayLesson, DisplayMode } from "../types";
import { speakEnglish, speakEnglishSequence, stopEnglishSpeech } from "../utils/speech";
import { DisplayModeToggle } from "./DisplayModeToggle";

type SentenceStudyProps = {
  lesson: DayLesson;
  onQuiz: () => void;
  onBack: () => void;
};

export function SentenceStudy({ lesson, onQuiz, onBack }: SentenceStudyProps) {
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
      lesson.sentences.map((sentence) => ({ text: sentence.english, audioSrc: sentence.audioSrc })),
      {
        gapMs: 420,
        onIndexChange: setActiveIndex,
      },
    );
  };

  const readOne = (index: number) => {
    const sentence = lesson.sentences[index];
    setActiveIndex(index);
    speakEnglish({ text: sentence.english, audioSrc: sentence.audioSrc }).finally(() => {
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
          <h2>六句话学习</h2>
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

      <div className="sentence-list">
        {lesson.sentences.map((sentence, index) => (
          <article className={`study-item ${activeIndex === index ? "speaking" : ""}`} key={sentence.index}>
            <div className="item-index">{sentence.index}</div>
            <div className="item-content">
              <span className="item-type">{sentence.type}</span>
              {showEnglish && <p className="english-text">{sentence.english}</p>}
              {showChinese && <p className="chinese-text">{sentence.chinese}</p>}
              {sentence.annotations && (
                <div className="annotation-line">
                  {sentence.annotations.time && <span>时间：{sentence.annotations.time}</span>}
                  {sentence.annotations.place && <span>地点：{sentence.annotations.place}</span>}
                  {sentence.annotations.verbChange && <span>动词：{sentence.annotations.verbChange}</span>}
                </div>
              )}
            </div>
            <button className="icon-button" type="button" aria-label={`朗读第 ${sentence.index} 句`} onClick={() => readOne(index)}>
              <Volume2 aria-hidden="true" size={21} />
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}
