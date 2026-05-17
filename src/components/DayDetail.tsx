import { BookOpenText, ChevronRight, Languages } from "lucide-react";
import type { DayLesson } from "../types";

type DayDetailProps = {
  lesson: DayLesson;
  onSentences: () => void;
  onWords: () => void;
};

export function DayDetail({ lesson, onSentences, onWords }: DayDetailProps) {
  return (
    <section className="page-section">
      <div className="detail-hero">
        <p className="section-kicker">当前课程</p>
        <h2>{lesson.title}</h2>
        <p>
          {lesson.sentences.length} 个句子，{lesson.words.length} 个单词。英文朗读只在点击按钮后触发。
        </p>
      </div>

      <div className="choice-list">
        <button className="choice-row" type="button" onClick={onSentences}>
          <span className="choice-icon">
            <Languages aria-hidden="true" size={28} />
          </span>
          <span>
            <strong>六句话学习</strong>
            <small>中英显示切换、朗读全部、随机自测</small>
          </span>
          <ChevronRight aria-hidden="true" size={24} />
        </button>

        <button className="choice-row" type="button" onClick={onWords}>
          <span className="choice-icon">
            <BookOpenText aria-hidden="true" size={28} />
          </span>
          <span>
            <strong>20 个单词学习</strong>
            <small>音标、释义、朗读全部、英中互测</small>
          </span>
          <ChevronRight aria-hidden="true" size={24} />
        </button>
      </div>
    </section>
  );
}
