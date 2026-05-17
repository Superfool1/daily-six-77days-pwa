from __future__ import annotations

import json
import re
from pathlib import Path
from typing import Any

from docx import Document
from pypdf import PdfReader


PROJECT_DIR = Path(__file__).resolve().parents[1]
ROOT_DIR = PROJECT_DIR.parent
SOURCE_DIR = ROOT_DIR / "单词和每天6句话"
SENTENCE_DOCX = SOURCE_DIR / "每天六句话 Day 1-77.docx"
WORD_PDF = SOURCE_DIR / "0.中考1540词汇 内页.pdf"
OUTPUT_JSON = PROJECT_DIR / "public" / "data" / "lessons.json"


POS_PATTERN = re.compile(
    r"\s("
    r"(?:vt\.&vi\.|vt\.|vi\.|v\.|n\.|adj\.|adv\.|prep\.|pron\.|conj\.|num\.|"
    r"interj\.|aux\.|art\.|modal v\.|n\. & v\.|v\. & n\.|adj\. & n\.|"
    r"adv\. & prep\.|be v\.|link-v\.).*"
    r")"
)


def normalize_spaces(value: str) -> str:
    return re.sub(r"\s+", " ", value).strip()


def normalize_english(value: str) -> str:
    normalized = (
        value.replace("ﬁ", "fi")
        .replace("ﬂ", "fl")
        .replace("ﬀ", "ff")
        .replace("ﬃ", "ffi")
        .replace("ﬄ", "ffl")
    )
    normalized = normalize_spaces(normalized)
    previous = None
    while previous != normalized:
        previous = normalized
        normalized = re.sub(r"\b(f[il][a-z]*)\s+([a-z])", r"\1\2", normalized)
    return normalized


def comparable_word(value: str) -> str:
    return normalize_english(value).replace("\u00a0", " ").strip()


def compact_word(value: str) -> str:
    return re.sub(r"\s+", "", comparable_word(value)).lower()


def strip_prefix(value: str, prefix: str) -> str:
    if not value.startswith(prefix):
        raise ValueError(f"Expected prefix {prefix!r} in {value!r}")
    return value[len(prefix) :].strip()


def parse_word_line(line: str) -> dict[str, Any]:
    match = re.match(r"^(\d{1,2})\s+(.+)$", normalize_spaces(line))
    if not match:
        raise ValueError(f"Not a numbered word line: {line!r}")

    index = int(match.group(1))
    rest = match.group(2)

    if rest.startswith("P.E."):
        return {
            "index": index,
            "english": "P.E.",
            "chinese": normalize_spaces(rest[len("P.E.") :]),
        }

    if "[" in rest and "]" in rest and rest.index("[") < rest.index("]"):
        start = rest.index("[")
        end = rest.index("]")
        english = rest[:start].strip()
        phonetic = rest[start : end + 1].strip()
        chinese = rest[end + 1 :].strip()
        return {
            "index": index,
            "english": normalize_english(english),
            "phonetic": phonetic,
            "chinese": chinese,
        }

    pos_match = POS_PATTERN.search(rest)
    if not pos_match:
        raise ValueError(f"Could not split word line: {line!r}")

    return {
        "index": index,
        "english": normalize_english(rest[: pos_match.start()].strip()),
        "chinese": rest[pos_match.start() + 1 :].strip(),
    }


def current_word_is_parseable(line: str) -> bool:
    try:
        parse_word_line(line)
        return True
    except ValueError:
        return False


def collect_word_lines(page_text: str) -> list[str]:
    lines = [line.strip() for line in page_text.splitlines() if line.strip()]
    word_lines: list[str] = []
    current: str | None = None

    for line in lines:
        if re.match(r"^\d{1,2}\s+", line):
            if current is not None:
                word_lines.append(current)
            current = line
            continue

        if current is None:
            continue

        if line.startswith("(") or not current_word_is_parseable(current):
            current = f"{current} {line}"

    if current is not None:
        word_lines.append(current)

    return word_lines


def extract_words() -> list[list[dict[str, Any]]]:
    reader = PdfReader(str(WORD_PDF))
    day_words: list[list[dict[str, Any]]] = []

    for page in reader.pages:
        page_text = page.extract_text() or ""
        word_lines = collect_word_lines(page_text)
        if not word_lines:
            continue

        if len(word_lines) != 20:
            raise ValueError(f"Expected 20 word lines, got {len(word_lines)}: {word_lines[:3]}")

        words = [parse_word_line(line) for line in word_lines]
        expected_indexes = list(range(1, 21))
        actual_indexes = [word["index"] for word in words]
        if actual_indexes != expected_indexes:
            raise ValueError(f"Unexpected word indexes: {actual_indexes}")

        day_words.append(words)

    if len(day_words) != 77:
        raise ValueError(f"Expected 77 word days, got {len(day_words)}")

    return day_words


def parse_word_check(line: str) -> list[str]:
    content = strip_prefix(line, "本课20词核对：")
    words: list[str] = []
    for part in content.split("；"):
        match = re.match(r"^\d+\s+(.+)$", part.strip())
        if match:
            words.append(match.group(1).strip())
    return words


def parse_mark_line(line: str) -> dict[str, str]:
    mark = strip_prefix(line, "标：")
    annotations: dict[str, str] = {}
    time_match = re.search(r"时间状语\s*=\s*([^；;]+)", mark)
    place_match = re.search(r"地点状语\s*=\s*(.+)$", mark)
    if time_match:
        annotations["time"] = time_match.group(1).strip()
    if place_match:
        annotations["place"] = place_match.group(1).strip()
    return annotations


def parse_sentence_block(item_lines: list[str]) -> dict[str, Any]:
    header_match = re.match(r"^([1-6])\.\s+(.+)$", item_lines[0])
    if not header_match:
        raise ValueError(f"Invalid sentence item header: {item_lines[0]!r}")

    sentence: dict[str, Any] = {
        "index": int(header_match.group(1)),
        "type": header_match.group(2).strip(),
    }
    annotations: dict[str, str] = {}

    for line in item_lines[1:]:
        if line.startswith("英："):
            sentence["english"] = strip_prefix(line, "英：")
        elif line.startswith("中："):
            sentence["chinese"] = strip_prefix(line, "中：")
        elif line.startswith("标："):
            annotations.update(parse_mark_line(line))
        elif line.startswith("动词："):
            annotations["verbChange"] = strip_prefix(line, "动词：")

    if "english" not in sentence or "chinese" not in sentence:
        raise ValueError(f"Missing English or Chinese in sentence block: {item_lines}")

    if annotations:
        sentence["annotations"] = annotations

    return sentence


def extract_sentence_lessons() -> list[dict[str, Any]]:
    document = Document(str(SENTENCE_DOCX))
    lines = [paragraph.text.strip() for paragraph in document.paragraphs if paragraph.text.strip()]
    day_starts = [index for index, line in enumerate(lines) if re.match(r"^第\d+天：", line)]

    if len(day_starts) != 77:
        raise ValueError(f"Expected 77 sentence days, got {len(day_starts)}")

    lessons: list[dict[str, Any]] = []

    for day_index, start in enumerate(day_starts):
        end = day_starts[day_index + 1] if day_index + 1 < len(day_starts) else len(lines)
        block = lines[start:end]
        title = block[0]
        day_match = re.match(r"^第(\d+)天：", title)
        if not day_match:
            raise ValueError(f"Invalid day title: {title!r}")

        day = int(day_match.group(1))
        word_check_line = next((line for line in block if line.startswith("本课20词核对：")), "")
        sentence_headers = [index for index, line in enumerate(block) if re.match(r"^[1-6]\.\s+", line)]
        if len(sentence_headers) != 6:
            raise ValueError(f"Expected 6 sentence headers for Day {day}, got {len(sentence_headers)}")

        sentences: list[dict[str, Any]] = []
        for item_pos, header_index in enumerate(sentence_headers):
            next_header = sentence_headers[item_pos + 1] if item_pos + 1 < len(sentence_headers) else len(block)
            item_lines: list[str] = []
            for line in block[header_index:next_header]:
                if line == "纯中文复述区":
                    break
                item_lines.append(line)
            sentences.append(parse_sentence_block(item_lines))

        lessons.append(
            {
                "day": day,
                "title": title,
                "summary": "6 句 · 20 词 · 系统英文朗读兜底",
                "wordCheck": parse_word_check(word_check_line),
                "sentences": sentences,
            }
        )

    return lessons


def validate_word_alignment(lessons: list[dict[str, Any]], day_words: list[list[dict[str, Any]]]) -> None:
    mismatches: list[str] = []
    for lesson, words in zip(lessons, day_words, strict=True):
        checked = lesson.pop("wordCheck")
        extracted = [word["english"] for word in words]
        if [compact_word(word) for word in checked] != [compact_word(word) for word in extracted]:
            mismatches.append(
                f"Day {lesson['day']}: docx={checked[:3]}...{checked[-3:]} pdf={extracted[:3]}...{extracted[-3:]}"
            )
        else:
            for word, checked_english in zip(words, checked, strict=True):
                word["english"] = checked_english

    if mismatches:
        raise ValueError("Word check mismatch:\n" + "\n".join(mismatches[:10]))


def build_lessons() -> dict[str, Any]:
    lessons = extract_sentence_lessons()
    day_words = extract_words()
    validate_word_alignment(lessons, day_words)

    for lesson, words in zip(lessons, day_words, strict=True):
        lesson["words"] = words

    return {
        "version": "2026.05.17-77days-v1",
        "source": {
            "sentences": SENTENCE_DOCX.name,
            "words": WORD_PDF.name,
        },
        "lessons": lessons,
    }


def main() -> None:
    data = build_lessons()
    OUTPUT_JSON.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT_JSON.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    sentence_count = sum(len(lesson["sentences"]) for lesson in data["lessons"])
    word_count = sum(len(lesson["words"]) for lesson in data["lessons"])
    print(f"Wrote {OUTPUT_JSON}")
    print(f"Lessons: {len(data['lessons'])}")
    print(f"Sentences: {sentence_count}")
    print(f"Words: {word_count}")
    print(f"First word: {data['lessons'][0]['words'][0]['english']}")
    print(f"Last word: {data['lessons'][-1]['words'][-1]['english']}")


if __name__ == "__main__":
    main()
