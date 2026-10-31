# Edu

**Free, open-source learning for Nigerian students, one swipe at a time.** Short practical videos, a learning map, notes, quick quizzes and JAMB CBT practice. Works offline, on phones and on the computers schools already have.

> Made in Nigeria by students at the Federal University of Technology, Akure (FUTA), as part of [Edulink](https://joinedulink.com).

- **Website:** https://edu.joinedulink.com
- **Android app:** [download the APK](https://edu.joinedulink.com/downloads/edu.apk)
- **Computers:** installers on the [Releases](../../releases) page

## Why

Students already spend hours scrolling short videos. Edu turns that habit into learning: each short is under a minute, ends on a question that leads into the next one, and is followed by a quick check. The notes carry the full detail, and the learning map shows exactly what to learn next. It's free, needs no account, and works without data once installed. It doesn't replace school; it's for every student who can't afford extra lessons.

## What it does

- **Learning map.** Every subject laid out unit by unit, from the JAMB and WAEC syllabuses, like levels in a game. Lessons, checkpoints, a daily streak and XP.
- **Shorts.** Practical science in 15 to 40 seconds: narrated motion graphics with captions, stickers and a cliffhanger at the end. A question card follows each one.
- **Notes.** A clear, original note for every lesson, with equations, a worked example and the common trap.
- **Quick checks and practice.** Instant feedback with the reason, on every question.
- **Full JAMB CBT mock (computer).** A timed mock exam that looks and works like the real one, with a diagnosis of *why* each mark was lost, interactive 3D explainers and an optional offline AI tutor.
- **Private by design.** Progress stays on the device. No account, no tracking.

## Run it yourself

You need [Node.js](https://nodejs.org) 22 or newer.

```
git clone https://github.com/olowolayemogoodness-crypto/edu.git
cd edu
npm install
npm run serve:web      # the Edu website at http://localhost:8080
npm start              # the desktop app (full CBT)
```

| Build | Command |
|---|---|
| Website (`www/`) | `npm run build:web` |
| Android APK | `npm run apk` (needs Android Studio), or let GitHub Actions build it |
| Open in Android Studio | `npm run android:open` |
| Desktop installers | `npm run dist:win`, `npm run dist:mac`, `npm run dist:linux` |

GitHub Actions builds everything on each push: the website and APK (`.github/workflows/web-android.yml`), and the desktop installers (`.github/workflows/build.yml`).

## How it's built

| Path | What it is |
|---|---|
| `app/edu.html`, `app/learn/` | Edu, the phone-first app: learning map, lessons, practice, progress |
| `app/data/curriculum/` | The syllabus for each subject: units and lessons |
| `app/learn/content.js` | Which lessons are ready, and their note, shorts and questions |
| `app/shorts/` | Short videos, one file per subject; `app/anim/shorts.js` is the swipeable player |
| `app/anim/labkit.js` | Virtual lab glassware and effects for practical videos |
| `app/data/notes.js` | The note bank |
| `app/data/questions.json` | The question bank: original questions with worked explanations |
| `app/index.html`, `app/app.js`, `app/engine.js` | The full JAMB CBT (mock exams, diagnosis, study plans) |
| `app/visuals/`, `app/videos/` | Interactive 3D explainers and longer video lessons for the CBT notes |
| `android/` | The Android app (Capacitor), which wraps the same web code |
| `main.js`, `preload.js` | The desktop app (Electron) |

Plain JavaScript modules, no build step for the app itself, no frameworks. One codebase runs on the web, on Android and on desktop.

## Roadmap

- [ ] Notes, shorts and questions for every chemistry lesson, then physics, mathematics, English and biology
- [ ] Recorded Nigerian voices for the shorts (see `app/shorts/voice/RECORDING.md`)
- [ ] JSS and primary subjects
- [ ] Lite mode for older phones and computers
- [ ] Teacher dashboard: a class's results combined offline
- [ ] Yoruba, Hausa and Igbo explanations
- [ ] Screen-reader and keyboard-only support

## Contributing

Teachers, students and developers are all welcome: write notes and questions, check answers, record voices, make shorts, translate or fix bugs. Start with [CONTRIBUTING.md](CONTRIBUTING.md). Found a wrong answer? [Report it here](../../issues/new?template=question-error.md).

## Licence

- Code: [MIT](LICENSE)
- Learning content (notes, questions, shorts): [CC BY 4.0](CONTENT-LICENSE.md)
- Third-party components: [NOTICE.md](NOTICE.md)

Edu is not affiliated with or endorsed by JAMB or WAEC.
