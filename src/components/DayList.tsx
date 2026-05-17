import { BookOpen, Search } from "lucide-react";
import { useMemo, useState } from "react";
import type { DayLesson } from "../types";

type DayListProps = {
  lessons: DayLesson[];
  onOpen: (day: number) => void;
};

export function DayList({ lessons, onOpen }: DayListProps) {
  const [query, setQuery] = useState("");
  const normalizedQuery = query.trim().toLowerCase();

  const filteredLessons = useMemo(() => {
    if (!normalizedQuery) {
      return lessons;
    }

    return lessons.filter((lesson) => {
      const words = lesson.words.map((word) => word.english).join(" ").toLowerCase();
      return `${lesson.day} ${lesson.title} ${words}`.toLowerCase().includes(normalizedQuery);
    });
  }, [lessons, normalizedQuery]);

  return (
    <section className="page-section">
      <div className="section-heading">
        <div>
          <p className="section-kicker">课程列表</p>
          <h2>Day 1-77</h2>
        </div>
        <div className="search-box">
          <Search aria-hidden="true" size={19} />
          <input
            aria-label="搜索 Day 或单词"
            placeholder="搜索 Day / 单词"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
      </div>

      <div className="lesson-grid">
        {filteredLessons.map((lesson) => (
          <button className="lesson-tile" key={lesson.day} type="button" onClick={() => onOpen(lesson.day)}>
            <span className="day-number">Day {lesson.day}</span>
            <strong>{lesson.title.replace(/^第\d+天：/, "")}</strong>
            <span className="lesson-meta">
              <BookOpen aria-hidden="true" size={17} />
              6 句 · 20 词
            </span>
            <small>
              {lesson.words[0]?.english} - {lesson.words[lesson.words.length - 1]?.english}
            </small>
          </button>
        ))}
      </div>
    </section>
  );
}
