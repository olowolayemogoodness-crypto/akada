# Contributing to Edulink Prep

Thank you for helping students learn. You don't need to be a programmer: most of what Edulink Prep needs is good teaching content.

## Ways to help

| You are | You can |
|---|---|
| A teacher or subject expert | Write questions, check answers and explanations, write notes, review a topic |
| A student | Test the app, report confusing questions, suggest what would help you |
| A translator | Translate explanations and notes into Yoruba, Hausa or Igbo |
| A developer or designer | Fix bugs, build explainers and video lessons, improve accessibility and performance on old computers |

## The one content rule

**All content must be your own original work, or come from a source whose licence allows reuse (for example OpenStax, under CC BY).** Do not copy questions or text from past-question books, textbooks, websites or other apps. Writing a *new* question that tests the same idea as a past JAMB question is fine; copying the wording is not. Content you contribute is shared under [CC BY 4.0](CONTENT-LICENSE.md).

## Adding questions

Questions live in `app/data/questions.json`. Each one looks like this:

```json
{
  "id": "phy-51",
  "subject": "physics",
  "topic": "projectiles",
  "difficulty": 2,
  "question": "A ball is thrown horizontally at 20 m/s from a cliff 45 m high. How far from the foot of the cliff does it land? (g = 10 m/s²)",
  "options": ["30 m", "45 m", "60 m", "90 m"],
  "answer": 2,
  "explanation": "Vertical: 45 = ½ × 10 × t², so t = 3 s. Horizontal: 20 × 3 = 60 m.",
  "source": "Original (JAMB syllabus)"
}
```

- `answer` is the position of the correct option, starting at 0 (A = 0, B = 1, C = 2, D = 3).
- `difficulty` is 1 (easy), 2 (medium) or 3 (hard).
- Write the explanation so a student who got it wrong understands *why*: show the working.
- Wrong options should be mistakes students really make (for example, forgetting to double the distance for an echo), not random numbers.
- Spread correct answers across A, B, C and D.

Before you send it, have someone else check the answer. Every question needs a second pair of eyes.

## Adding a note, explainer or video lesson

- Notes: `app/data/notes.js` (intro, key points, formulas, worked example, common trap).
- Interactive explainers: a module in `app/visuals/` that exports `mount(element)` and returns a cleanup function. Look at `projectiles.js` for an example.
- Video lessons: a module in `app/videos/` with scenes and captions, drawn by `app/anim/videoplayer.js`. Look at `induction.js`.
- Everything must work **offline**: no fonts, images or scripts loaded from the internet.
- Test on a slow computer if you can. Many schools use 4 GB laptops.

## Code

```
npm install
npm start
```

- Plain JavaScript ES modules, no build step. Keep it that way.
- Keep pull requests small and focused, and describe what you tested.
- Write comments and on-screen text in plain, simple English. Many users are 15 to 18 and speak English as a second language.

## Reporting a wrong answer or a bug

Open an [issue](../../issues/new/choose). For a wrong answer, include the question ID (shown in Review) and what you think the right answer is, with working.

By taking part you agree to our [Code of Conduct](CODE_OF_CONDUCT.md).
