import { ArrowLeft, Eye, RefreshCw } from "lucide-react";
import { useMemo, useState } from "react";
import type { DayLesson } from "../types";
import { shuffleArray } from "../utils/shuffle";

type SentenceQuizProps = {
  lesson: DayLesson;
  onExit: () => void;
};

export function SentenceQuiz({ lesson, onExit }: SentenceQuizProps) {
  const [round, setRound] = useState(0);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [finished, setFinished] = useState(false);

  const quizItems = useMemo(() => shuffleArray(lesson.sentences), [lesson.sentences, round]);
  const current = quizItems[currentIndex];

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
        <p className="section-kicker">句子随机自测</p>
        <h2>已完成 6 句</h2>
        <p className="quiz-prompt">这一轮已经结束，可以重新打乱再练一遍。</p>
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
      <h2>看中文，说英文</h2>
      <p className="quiz-prompt">{current.chinese}</p>

      {showAnswer && (
        <div className="answer-block">
          <span>英文答案</span>
          <strong>{current.english}</strong>
        </div>
      )}

      <div className="action-strip">
        <button className="primary-action" type="button" onClick={() => setShowAnswer(true)}>
          <Eye aria-hidden="true" size={21} />
          显示答案
        </button>
        <button className="secondary-action" type="button" onClick={handleNext}>
          下一句
        </button>
      </div>
    </section>
  );
}
