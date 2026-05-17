import { ArrowLeft, Home } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { DayDetail } from "./components/DayDetail";
import { DayList } from "./components/DayList";
import { SentenceQuiz } from "./components/SentenceQuiz";
import { SentenceStudy } from "./components/SentenceStudy";
import { WordQuiz } from "./components/WordQuiz";
import { WordStudy } from "./components/WordStudy";
import type { DayLesson, LessonsData } from "./types";
import { stopEnglishSpeech } from "./utils/speech";

type RouteName = "home" | "detail" | "sentences" | "sentence-quiz" | "words" | "word-quiz" | "not-found";

type RouteState = {
  name: RouteName;
  day?: number;
};

function getRouteFromHash(): RouteState {
  const hashPath = window.location.hash.replace(/^#/, "") || "/";
  const normalized = hashPath.startsWith("/") ? hashPath : `/${hashPath}`;

  if (normalized === "/") {
    return { name: "home" };
  }

  const match = normalized.match(/^\/day\/(\d+)(?:\/(sentences|sentence-quiz|words|word-quiz))?$/);
  if (!match) {
    return { name: "not-found" };
  }

  const day = Number(match[1]);
  const page = match[2] as RouteName | undefined;
  return { name: page ?? "detail", day };
}

function navigate(path: string) {
  stopEnglishSpeech();
  window.location.hash = path;
  window.scrollTo({ top: 0, behavior: "auto" });
}

function useRoute() {
  const [route, setRoute] = useState<RouteState>(() => getRouteFromHash());

  useEffect(() => {
    const handleHashChange = () => {
      stopEnglishSpeech();
      setRoute(getRouteFromHash());
      window.scrollTo({ top: 0, behavior: "auto" });
    };
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  return route;
}

function getDataUrl() {
  return `${import.meta.env.BASE_URL}data/lessons.json`;
}

export default function App() {
  const route = useRoute();
  const [lessons, setLessons] = useState<DayLesson[]>([]);
  const [dataVersion, setDataVersion] = useState("");
  const [loadError, setLoadError] = useState<string | null>(null);
  const [offlineStatus, setOfflineStatus] = useState("本地开发预览");

  useEffect(() => {
    let cancelled = false;

    fetch(getDataUrl())
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Lessons data request failed: ${response.status}`);
        }
        return response.json() as Promise<LessonsData>;
      })
      .then((data) => {
        if (!cancelled) {
          setLessons(data.lessons);
          setDataVersion(data.version);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setLoadError("77 天数据加载失败，请刷新或重新打开应用。");
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!import.meta.env.PROD) {
      return;
    }

    if (!("serviceWorker" in navigator) || !("caches" in window)) {
      setOfflineStatus("当前浏览器不支持离线缓存");
      return;
    }

    setOfflineStatus("离线包准备中");

    const checkOfflineCache = async () => {
      try {
        await navigator.serviceWorker.ready;

        const baseUrl = new URL(import.meta.env.BASE_URL, window.location.href);
        const dataUrl = new URL("data/lessons.json", baseUrl).toString();
        const shellUrl = new URL("index.html", baseUrl).toString();
        const dataCached = Boolean(await caches.match(dataUrl));
        const shellCached = Boolean(await caches.match(shellUrl));

        setOfflineStatus(dataCached && shellCached ? "离线包已准备" : "离线包准备中");
      } catch {
        setOfflineStatus("离线包准备中");
      }
    };

    checkOfflineCache();
    const timer = window.setInterval(checkOfflineCache, 2000);
    return () => window.clearInterval(timer);
  }, []);

  const lesson = useMemo(() => lessons.find((item) => item.day === route.day), [lessons, route.day]);

  const pageTitle = useMemo(() => {
    if (route.name === "home" || !lesson) {
      return "每天六句话";
    }
    return lesson.title;
  }, [lesson, route.name]);

  if (loadError) {
    return (
      <main className="app-shell">
        <section className="status-panel" role="alert">
          <p>{loadError}</p>
        </section>
      </main>
    );
  }

  if (!lessons.length) {
    return (
      <main className="app-shell">
        <section className="status-panel">
          <p>正在加载 77 天内容…</p>
        </section>
      </main>
    );
  }

  const showBackToHome = route.name !== "home";

  return (
    <main className="app-shell">
      <header className="topbar">
        {showBackToHome ? (
          <button className="icon-text-button quiet" type="button" onClick={() => navigate("/")}>
            <ArrowLeft aria-hidden="true" size={22} />
            课程
          </button>
        ) : (
          <div className="brand-mark">77</div>
        )}
        <div className="title-block">
          <p className="eyebrow">中考1540词汇 · {dataVersion}</p>
          <h1>{pageTitle}</h1>
        </div>
        <span className="offline-badge">{offlineStatus}</span>
      </header>

      {route.name === "home" && <DayList lessons={lessons} onOpen={(day) => navigate(`/day/${day}`)} />}

      {(route.name === "not-found" || (route.day && !lesson)) && (
        <section className="status-panel">
          <Home aria-hidden="true" size={28} />
          <p>没有找到这个课程页面。</p>
          <button className="primary-action" type="button" onClick={() => navigate("/")}>
            回到课程列表
          </button>
        </section>
      )}

      {lesson && route.name === "detail" && (
        <DayDetail
          lesson={lesson}
          onSentences={() => navigate(`/day/${lesson.day}/sentences`)}
          onWords={() => navigate(`/day/${lesson.day}/words`)}
        />
      )}

      {lesson && route.name === "sentences" && (
        <SentenceStudy
          lesson={lesson}
          onQuiz={() => navigate(`/day/${lesson.day}/sentence-quiz`)}
          onBack={() => navigate(`/day/${lesson.day}`)}
        />
      )}

      {lesson && route.name === "sentence-quiz" && (
        <SentenceQuiz lesson={lesson} onExit={() => navigate(`/day/${lesson.day}/sentences`)} />
      )}

      {lesson && route.name === "words" && (
        <WordStudy lesson={lesson} onQuiz={() => navigate(`/day/${lesson.day}/word-quiz`)} onBack={() => navigate(`/day/${lesson.day}`)} />
      )}

      {lesson && route.name === "word-quiz" && <WordQuiz lesson={lesson} onExit={() => navigate(`/day/${lesson.day}/words`)} />}
    </main>
  );
}
