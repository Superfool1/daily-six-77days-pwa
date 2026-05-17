export type DisplayMode = "both" | "hideChinese" | "hideEnglish";

export type WordQuizMode = "en-to-zh" | "zh-to-en";

export type SentenceItem = {
  index: number;
  type: string;
  english: string;
  chinese: string;
  audioSrc?: string;
  annotations?: {
    time?: string;
    place?: string;
    verbChange?: string;
  };
};

export type WordItem = {
  index: number;
  english: string;
  phonetic?: string;
  chinese: string;
  audioSrc?: string;
};

export type DayLesson = {
  day: number;
  title: string;
  summary: string;
  sentences: SentenceItem[];
  words: WordItem[];
};

export type LessonsData = {
  version: string;
  source?: {
    sentences?: string;
    words?: string;
  };
  lessons: DayLesson[];
};
