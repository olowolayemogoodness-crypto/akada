# Edulink Prep

**Free, open-source exam practice that works without internet, on the computers schools already have.**

Edulink Prep is a CBT (computer-based test) practice app for Nigeria's JAMB UTME. A student takes a timed mock exam that looks and works like the real one. Edulink Prep then works out *why* they lost marks (a concept they don't understand yet, rushing, second-guessing, or tiring at the end), shows them exactly what to fix, and teaches it with notes, interactive 3D explainers and narrated video lessons. All of it works offline.

> Made in Nigeria by students at the Federal University of Technology, Akure (FUTA), as part of [Edulink](https://joinedulink.com).

## Why

Most Nigerian candidates sit the UTME on a computer, but many have never practised on one, and many schools have only a few old laptops and little or no internet. Practice apps usually need data, give a score but no diagnosis, and cost money. Edulink Prep is free, runs offline, and focuses on what each learner should do next.

## What it does

- **Real CBT experience.** Timed full mocks across English, Physics, Chemistry and Mathematics, with a question palette, flagging, keyboard shortcuts and an on-screen calculator.
- **Diagnosis, not just a score.** Every answer is timed. The engine tracks mastery per topic and explains each lost mark: *concept gap*, *rushed*, *changed a right answer*, *skipped* or *ran out of steam*.
- **Learning-pattern detection.** Edu, the study buddy, spots patterns across all your practice (for example, "answers under 8 seconds are right 24% of the time, compared with 75% when you slow down") and gives a personalised study plan.
- **Learn it properly.** A note bank for every topic with worked examples, interactive Three.js explainers (projectiles, waves, induction, density, equilibrium and more), animated maths scenes, kinetic typography for English, and narrated motion-graphics video lessons.
- **Oral English with sound.** Phonetic transcriptions (IPA) next to every word, with tap-to-hear pronunciation.
- **Offline AI tutor (optional).** On computers with 8 GB of memory or more, a local AI model (through [Ollama](https://ollama.com)) explains any question step by step. Nothing is sent to the internet.
- **Private by design.** Progress stays on the device. No account, no tracking.

## Download

Ready-made installers are on the [Releases](../../releases) page:

| Computer | File |
|---|---|
| Windows 10 or 11 (64-bit or 32-bit) | `Edulink-Prep-Setup-x.y.z.exe` (installer) or `Edulink-Prep-Portable-x.y.z.exe` (no install, runs from a USB stick) |
| Mac (Apple Silicon or Intel) | `Edulink Prep-x.y.z-universal.dmg` |
| Linux | `Edulink Prep-x.y.z.AppImage` |

**Minimum:** 4 GB of memory, about 300 MB of disk space, no internet. The AI tutor needs 8 GB of memory or more.

The installers aren't code-signed yet, so Windows may show "Windows protected your PC" (click **More info → Run anyway**), and a Mac may ask you to approve the app in **System Settings → Privacy & Security**.

## Run from source

You need [Node.js](https://nodejs.org) 20 or newer.

```
git clone https://github.com/olowolayemogoodness-crypto/edulink-prep.git
cd edulink-prep
npm install
npm start
```

Build installers with `npm run dist:win`, `npm run dist:mac` or `npm run dist:linux`. GitHub Actions also builds all three automatically (see `.github/workflows/build.yml`).

## How it's built

| Path | What it is |
|---|---|
| `app/data/questions.json` | The question bank: original JAMB-syllabus questions, each with topic, difficulty, answer and a worked explanation |
| `app/data/notes.js` | The note bank, one note per topic |
| `app/engine.js` | Builds and marks exams, tracks mastery, explains lost marks, detects learning patterns and makes study plans |
| `app/tutor.js`, `app/ai.js` | Edu's study room and the offline AI tutor (teach, question-help and coach modes) |
| `app/visuals/` | Interactive explainers (Three.js and canvas) |
| `app/anim/` | GSAP animations, and the video-lesson player (motion graphics drawn as a function of time, so lessons are tiny and work offline) |
| `app/videos/` | Video lessons |
| `main.js`, `preload.js` | The Electron shell |

Plain JavaScript modules, no build step, no frameworks. It's easy to read and easy to contribute to.

## Roadmap

- [ ] **Edu Library:** full written lessons and step-by-step explanations for every question, so the tutor works on 4 GB school laptops without an AI model
- [ ] **Lite mode** for older computers (2D animations instead of 3D)
- [ ] **Teacher dashboard:** combine a class's results (offline, by USB or local Wi-Fi) to show which topics the whole class needs
- [ ] All JAMB subjects, then WAEC and NECO
- [ ] Yoruba, Hausa and Igbo explanations
- [ ] Screen-reader and keyboard-only support
- [ ] "Lab brain" mode: one stronger computer runs the AI for a whole computer lab over local Wi-Fi

## Contributing

Teachers, students and developers are all welcome: write questions, check answers, translate, add explainers or fix bugs. Start with [CONTRIBUTING.md](CONTRIBUTING.md). Found a wrong answer? [Report it here](../../issues/new?template=question-error.md).

## Licence

- Code: [MIT](LICENSE)
- Learning content (questions, notes, lessons): [CC BY 4.0](CONTENT-LICENSE.md)
- Third-party components: [NOTICE.md](NOTICE.md)

Edulink Prep is not affiliated with or endorsed by JAMB.
