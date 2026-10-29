// Offline AI tutor. Uses a model running on this computer through Ollama (https://ollama.com).
// Nothing is sent to the internet. If Ollama isn't installed, the app simply hides AI features.
const HOST = 'http://127.0.0.1:11434';
const LETTERS = ['A', 'B', 'C', 'D'];
const OPTS = { temperature: 0.35, top_p: 0.9, repeat_penalty: 1.1, num_ctx: 6144 };

export async function aiStatus(model) {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 1200);
    const res = await fetch(`${HOST}/api/tags`, { signal: ctrl.signal });
    clearTimeout(t);
    const data = await res.json();
    const names = (data.models || []).map((m) => m.name);
    return { running: true, hasModel: names.some((n) => n === model || n.startsWith(model + ':') || n.split(':')[0] === model.split(':')[0]), models: names };
  } catch {
    return { running: false, hasModel: false, models: [] };
  }
}

// Load the model into memory ahead of time so the first answer starts quickly.
export function warmUp(model) {
  fetch(`${HOST}/api/generate`, { method: 'POST', body: JSON.stringify({ model, keep_alive: '30m' }) }).catch(() => {});
}

// Reads Ollama's line-by-line stream and calls onToken with the text so far.
async function stream(res, pick, onToken) {
  if (!res.ok) throw new Error(`The AI tutor returned an error (${res.status}).`);
  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let text = '', buf = '';
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    const lines = buf.split('\n');
    buf = lines.pop();
    for (const line of lines) {
      if (!line.trim()) continue;
      const j = JSON.parse(line);
      if (j.error) throw new Error(j.error);
      const piece = pick(j);
      if (piece) { text += piece; onToken?.(text); }
    }
  }
  return text.trim();
}

// Explain one exam question, using what we know about how this student learns.
export async function explain({ model, question, options, answer, choice, explanation, subject, topic, mastery, habit, ms, signal, onToken }) {
  const wrong = choice != null && choice !== answer;
  const prompt = `You are Edu, a patient and brilliant JAMB tutor for a Nigerian secondary school student. Your job is to make them truly understand this question, so they can answer any question like it. Use simple English and explain the why, not just the what.

Subject: ${subject} (topic: ${topic})
Question: ${question}
Options: ${options.map((o, i) => `${LETTERS[i]}. ${o}`).join('   ')}
Correct answer: ${LETTERS[answer]}. ${options[answer]}
Student chose: ${choice == null ? 'nothing (skipped)' : `${LETTERS[choice]}. ${options[choice]}`}${ms ? ` after ${Math.round(ms / 1000)} seconds` : ''}
Official explanation (trust this, never contradict it): ${explanation}
About this student: ${mastery}${habit ? ` ${habit}` : ''}

Write 200 to 350 words using these exact bold labels:
${wrong ? `**Where it went wrong:** kindly explain the likely thinking behind choosing ${LETTERS[choice]} and why it fails.\n` : ''}**Step by step:** solve it in numbered steps. Show every calculation with numbers and units, or every reason for English questions.
**The idea behind it:** explain the concept this question tests in 2 to 4 sentences, with a simple everyday example.
**Watch out:** the trap JAMB uses in questions like this.
**Remember:** one short rule or memory tip.${habit ? '\n**For you:** one sentence of advice about their habit.' : ''}
Do not change the correct answer. No tables, no # headings.`;
  const res = await fetch(`${HOST}/api/generate`, {
    method: 'POST', signal,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, prompt, stream: true, keep_alive: '30m', options: OPTS }),
  });
  return stream(res, (j) => j.response, onToken);
}

// Free conversation with Edu. `system` carries the student's profile and notes.
export async function chat({ model, system, messages, signal, onToken }) {
  const res = await fetch(`${HOST}/api/chat`, {
    method: 'POST', signal,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, stream: true, keep_alive: '30m', options: OPTS, messages: [{ role: 'system', content: system }, ...messages] }),
  });
  return stream(res, (j) => j.message?.content, onToken);
}

// Safe, light formatting for AI replies: **bold**, "- " bullets, "1." lists, paragraphs.
export function mdLite(text) {
  const esc = (s) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const inline = (s) => esc(s).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/(^|[^*])\*([^*\n]+)\*/g, '$1<i>$2</i>').replace(/`([^`]+)`/g, '<code>$1</code>');
  const out = [];
  let list = null;
  const close = () => { if (list) { out.push(`</${list}>`); list = null; } };
  for (const raw of String(text).replace(/^#+\s*/gm, '').split('\n')) {
    const line = raw.trim();
    const b = line.match(/^[-•*]\s+(.*)/), n = line.match(/^\d+[.)]\s+(.*)/);
    if (b || n) {
      const kind = b ? 'ul' : 'ol';
      if (list !== kind) { close(); out.push(`<${kind}>`); list = kind; }
      out.push(`<li>${inline((b || n)[1])}</li>`);
    } else if (!line) close();
    else { close(); out.push(`<p>${inline(line)}</p>`); }
  }
  close();
  return out.join('');
}
