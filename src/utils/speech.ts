export type SpeakOptions = {
  text: string;
  audioSrc?: string;
  rate?: number;
};

export type SpeakSequenceOptions = {
  rate?: number;
  gapMs?: number;
  onIndexChange?: (index: number | null) => void;
};

let playbackToken = 0;
let activeAudio: HTMLAudioElement | null = null;

function normalizeSpeechText(text: string) {
  return text.replace(/\(([^)]+)\)/g, "$1").replace(/\s+/g, " ").trim();
}

function cancelCurrentMedia() {
  if (activeAudio) {
    activeAudio.pause();
    activeAudio.currentTime = 0;
    activeAudio = null;
  }

  if ("speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
}

export function stopEnglishSpeech() {
  playbackToken += 1;
  cancelCurrentMedia();
}

function wait(ms: number) {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function playStaticAudio(audioSrc: string, token: number): Promise<void> {
  return new Promise((resolve, reject) => {
    if (token !== playbackToken) {
      resolve();
      return;
    }

    const audio = new Audio(audioSrc);
    activeAudio = audio;

    audio.onended = () => {
      if (activeAudio === audio) {
        activeAudio = null;
      }
      resolve();
    };

    audio.onerror = () => {
      if (activeAudio === audio) {
        activeAudio = null;
      }
      reject(new Error("Static audio failed to load."));
    };

    audio.play().catch((error) => {
      if (activeAudio === audio) {
        activeAudio = null;
      }
      reject(error);
    });
  });
}

function speakWithSystemVoice(text: string, rate: number, token: number): Promise<void> {
  return new Promise((resolve) => {
    if (token !== playbackToken || !("speechSynthesis" in window) || !("SpeechSynthesisUtterance" in window)) {
      resolve();
      return;
    }

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(normalizeSpeechText(text));
    utterance.lang = "en-US";
    utterance.rate = rate;
    utterance.pitch = 1;

    utterance.onend = () => resolve();
    utterance.onerror = () => resolve();

    window.speechSynthesis.speak(utterance);
  });
}

async function speakOne(options: SpeakOptions, token: number) {
  if (options.audioSrc) {
    try {
      await playStaticAudio(options.audioSrc, token);
      return;
    } catch {
      // Local static audio is optional; Web Speech is the zero-cost fallback.
    }
  }

  await speakWithSystemVoice(options.text, options.rate ?? 0.85, token);
}

export async function speakEnglish(options: SpeakOptions): Promise<void> {
  playbackToken += 1;
  const token = playbackToken;
  cancelCurrentMedia();
  await speakOne(options, token);
}

export async function speakEnglishSequence(items: SpeakOptions[], options: SpeakSequenceOptions = {}): Promise<void> {
  playbackToken += 1;
  const token = playbackToken;
  cancelCurrentMedia();

  for (let index = 0; index < items.length; index += 1) {
    if (token !== playbackToken) {
      break;
    }

    options.onIndexChange?.(index);
    await speakOne({ ...items[index], rate: options.rate ?? items[index].rate }, token);

    if (token !== playbackToken) {
      break;
    }

    await wait(options.gapMs ?? 320);
  }

  if (token === playbackToken) {
    options.onIndexChange?.(null);
  }
}
