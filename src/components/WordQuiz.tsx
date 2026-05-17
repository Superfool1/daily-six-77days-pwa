import { ArrowLeft, Eye, RefreshCw, Repeat2 } from "lucide-react";
import { useMemo, useState } from "react";
import type { DayLesson, WordQuizMode } from "../types";
import { shuffleArray } from "../utils/shuffle";

type WordQuizProps = {
  lesson: DayLesson;
  onExit: () => void;
};

export function WordQuiz({ lesson, onExit }: WordQuizProps) {
  const [mode, setMode] = useState<WordQuizMode>("en-to-zh");
  const [round, setRound] = useState(0);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [finished, setFinished] = useState(false);

  const quizItems = useMemo(() => shuffleArray(lesson.words), [lesson.words, round]);
  const current = quizItems[currentIndex];
  const isEnglishToChinese = mode === "en-to-zh";

  const switchMode = () => {
    setMode((value) => (value === "en-to-zh" ? "zh-to-en" : "en-to-zh"));
    setRound((value) => value + 1);
    setCurrentIndex(0);
    setShowAnswer(false);
    setFinished(false);
  };

  const handleNext = () => {
    setShowAnswer(false);
    if (currentIndex + 1 >= quizItems.length) {
      setFinished(true);
      return;
    }
    setCurrentIndex((value) => value + 1);
  };

  const restart = () => {
    setRound((value) => value + 1);
    setCurrentIndex(0);
    setShowAnswer(false);
    setFinished(false);
  };

  if (finished) {
    return (
      <section className="quiz-panel" data-quiz-order={quizItems.map((item) => item.index).join(",")}>
        <p className="section-kicker">单词随机自测</p>
        <h2>已完成 20 题</h2>
        <p className="quiz-prompt">这一轮已经结束，可以重新打乱再练。</p>
        <div className="action-strip">
          <button className="primary-action" type="button" onClick={restart}>
            <RefreshCw aria-hidden="true" size={21} />
            重新开始
          </button>
          <button className="secondary-action" type="button" onClick={onExit}>
            <ArrowLeft aria-hidden="true" size={21} />
            退出自测
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="quiz-panel" data-quiz-order={quizItems.map((item) => item.index).join(",")}>
      <div className="quiz-topline">
        <button className="icon-text-button quiet" type="button" onClick={onExit}>
          <ArrowLeft aria-hidden="true" size={22} />
          退出自测
        </button>
        <span className="progress-pill">
          {currentIndex + 1} / {quizItems.length}
        </span>
      </div>

      <p className="section-kicker">{lesson.title}</p>
      <h2>{isEnglishToChinese ? "英译中" : "中译英"}</h2>
      <p className={isEnglishToChinese ? "quiz-prompt english-question" : "quiz-prompt"}>
        {isEnglishToChinese ? current.english : current.chinese}
      </p>

      {showAnswer && (
        <div className="answer-block">
          <span>{isEnglishToChinese ? "中文答案" : "英文答案"}</span>
          <strong>{isEnglishToChinese ? current.chinese : current.english}</strong>
          {!isEnglishToChinese && current.phonetic && <em>{current.phonetic}</em>}
        </div>
      )}

      <div className="action-strip">
        <button className="primary-action" type="button" onClick={() => setShowAnswer(true)}>
          <Eye aria-hidden="true" size={21} />
          显示答案
        </button>
        <button className="secondary-action" type="button" onClick={handleNext}>
          下一题
        </button>
        <button className="secondary-action" type="button" onClick={switchMode}>
          <Repeat2 aria-hidden="true" size={21} />
          {isEnglishToChinese ? "切到中译英" : "切到英译中"}
        </button>
      </div>
    </section>
  );
}
