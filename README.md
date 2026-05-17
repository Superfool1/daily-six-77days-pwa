# 每天六句话 / 中考1540词汇 77天正式版

Vite + React + TypeScript PWA，使用静态 `public/data/lessons.json` 数据。

```powershell
npm install
npm run dev
npm run build
npm run preview
```

数据抽取脚本：

```powershell
python scripts/extract-lessons.py
```

应用不依赖 OpenAI API，不读取 `OPENAI_API_KEY`，不调用付费 TTS API。英文朗读优先播放数据里的 `audioSrc` 静态文件；没有音频时使用浏览器 Web Speech API。
