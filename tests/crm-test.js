// Runs Code.gs + Crm.gs against fake Google services and walks the whole CRM flow.
// node tests/crm-test.js (from finance/onboarding)
const fs = require('fs');
const vm = require('vm');
const crypto = require('crypto');
const assert = require('assert');
const DIR = require('path').join(__dirname, '..', 'apps-script') + '/';

const sheets = {};
function makeSheet(name) {
  const data = [];
  const sh = {
    name, data,
    appendRow(r) { data.push(r.slice()); },
    setFrozenRows() {}, setRightToLeft() {},
    getLastRow() { return data.length; },
    getMaxRows() { return Math.max(data.length, 1000); },
    deleteRow(i) { data.splice(i - 1, 1); },
    getRange(a, b, c, d) {
      if (typeof a === 'string') { a = 1; b = 1; c = Math.max(data.length, 1); d = 1; }
      const row = a, col = b, nr = c || 1, nc = d || 1;
      const get = (r, k) => { const x = data[r - 1]; return x && x[k - 1] !== undefined ? x[k - 1] : ''; };
      return {
        getValue: () => get(row, col),
        getValues: () => Array.from({ length: nr }, (_, i) => Array.from({ length: nc }, (_, j) => get(row + i, col + j))),
        setValue(v) { while (data.length < row) data.push([]); data[row - 1][col - 1] = typeof v === 'string' && v[0] === "'" ? v.slice(1) : v; return this; },
        setValues(vs) { vs.forEach((r, i) => r.forEach((v, j) => { while (data.length < row + i) data.push([]); data[row + i - 1][col + j - 1] = v; })); },
        createTextFinder(text) {
          return { matchEntireCell() { return this; }, findNext() {
            for (let i = 0; i < nr; i++) if (String(get(row + i, col)) === text) return { getRow: () => row + i };
            return null;
          } };
        }
      };
    }
  };
  return sh;
}
// appendRow keeps "'" prefixes like a real sheet would strip them
const strip = r => r.map(v => (typeof v === 'string' && v[0] === "'" ? v.slice(1) : v));

const mails = [];
const calEvents = {};
let evSeq = 0;
function calEvent(title, start, end, opt) {
  const id = 'ev' + (++evSeq);
  const e = { id, title, start, end, desc: opt && opt.description,
    getId: () => id, getTitle: () => e.title, getStartTime: () => e.start, getEndTime: () => e.end, isAllDayEvent: () => false,
    setTime(s, en) { e.start = s; e.end = en; return e; }, setTitle(t) { e.title = t; return e; }, setDescription(d) { e.desc = d; return e; },
    removeAllReminders() {}, addPopupReminder() {} };
  calEvents[id] = e;
  return e;
}
const trashed = [];
const cache = {};

const ctx = {
  console,
  SpreadsheetApp: { getActiveSpreadsheet: () => ({
    getSheetByName: n => sheets[n] || null,
    insertSheet: n => { const s = makeSheet(n); const ap = s.appendRow; s.appendRow = r => ap.call(s, strip(r)); return (sheets[n] = s); }
  }) },
  CacheService: { getScriptCache: () => ({ get: k => cache[k] || null, put: (k, v) => { cache[k] = v; } }) },
  LockService: { getScriptLock: () => ({ waitLock() {}, releaseLock() {} }) },
  PropertiesService: { getScriptProperties: () => ({ getProperty: k => ({ ADMIN_PASSWORD: 'pw', NOTIFY_EMAIL: 'hai@x' })[k] || null, setProperty() {} }) },
  GmailApp: { sendEmail: (to, subject, body, opt) => mails.push({ to, subject, body, opt }) },
  CalendarApp: { getDefaultCalendar: () => ({
    getName: () => 'hai', createEvent: calEvent, getEventById: id => calEvents[id] || null,
    getEvents: (a, b) => Object.values(calEvents).filter(e => e.start >= a && e.start < b)
  }) },
  Utilities: {
    getUuid: () => crypto.randomUUID(),
    base64Decode: s => Buffer.from(s, 'base64'),
    newBlob: () => ({ setName() { return this; } }),
    formatDate: d => d.toISOString()
  },
  DriveApp: { getFileById: id => ({ setTrashed: () => trashed.push(id), getBlob: () => ({}) }), createFolder: () => ({ getId: () => 'f' }), getFolderById: () => ({ createFile: () => ({ getId: () => 'file' + (++evSeq) }) }) },
  ContentService: { createTextOutput: s => ({ setMimeType() { return s; } }), MimeType: { JSON: 1 } },
  DocumentApp: { HorizontalAlignment: { LEFT: 'L' }, ElementType: {}, Attribute: {} },
  Session: { getEffectiveUser: () => ({ getEmail: () => 'hai@x' }) }
};
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(DIR + 'Code.gs', 'utf8') + '\n' + fs.readFileSync(DIR + 'Crm.gs', 'utf8') +
  '\n;this.__post = doPost; this.__find = find_; this.__set = set_;', ctx);

function call(req) {
  const out = JSON.parse(ctx.__post({ postData: { contents: JSON.stringify(req) } }));
  return out;
}
function ok(req) { const r = call(req); assert.ok(r.ok, JSON.stringify(r)); return r; }
const pw = 'pw';

// 1. lead from the calculator
ok({ action: 'lead', name: 'נועה כהן', phone: '052-123-4567', tool: 'cashflow', toolTitle: 'מחשבון תזרים', src: 'ig', pain: 'מינוס', data: { 'פער חודשי': '-500 ₪' } });
assert.equal(mails.length, 1);
assert.match(mails[0].subject, /ליד חדש: נועה כהן/);
// honeypot, bad input
assert.ok(call({ action: 'lead', hp: 1 }).ok);
assert.equal(call({ action: 'lead', name: 'x', phone: '1', tool: 'cashflow' }).error, 'invalid');
// same phone again, other format: no duplicate
ok({ action: 'lead', name: 'נועה', phone: '+972521234567', tool: 'cashflow' });
let list = ok({ action: 'crm_list', password: pw });
assert.equal(list.people.length, 1);
const p = list.people[0];
assert.equal(p.stage, 'new');
assert.equal(p.source, 'instagram');
assert.equal(p.phone, '052-123-4567');
assert.equal(call({ action: 'crm_list', password: 'bad' }).error, 'auth');

// 2. note moves a new lead to "contact"
let g = ok({ action: 'crm_note', password: pw, id: p.id, text: 'דיברנו' });
assert.equal(g.person.stage, 'contact');
assert.ok(g.person.contactedAt);
assert.equal(g.events.length, 3);
assert.equal(g.events[2].data.values['פער חודשי'], '-500 ₪');

// 3. intro meeting in the calendar
const t1 = new Date(Date.now() + 86400000).toISOString();
g = ok({ action: 'crm_meeting', password: pw, id: p.id, at: t1 });
assert.equal(g.person.stage, 'intro');
assert.equal(Object.keys(calEvents).length, 1);
assert.match(Object.values(calEvents)[0].title, /שיחת היכרות: נועה כהן/);
// moving it updates the same event
g = ok({ action: 'crm_meeting', password: pw, id: p.id, at: new Date(Date.now() + 2 * 86400000).toISOString() });
assert.equal(Object.keys(calEvents).length, 1);
list = ok({ action: 'crm_list', password: pw });
assert.equal(list.agenda.length, 1);
g = ok({ action: 'crm_meeting_done', password: pw, id: p.id, summary: 'סגרנו' });
assert.equal(g.person.nextMeetingAt, '');
assert.equal(g.person.meetingsDone, 0);

// 4. onboarding link from the card, then the client signs + submits
const ob = ok({ action: 'crm_onboard', password: pw, id: p.id, amount: 2400, gender: 'c' });
assert.match(ob.url, /onboarding\/c\.html\?t=[a-f0-9]{64}$/);
assert.equal(ob.person.stage, 'sent');
assert.equal(ob.person.amount, 2400);
const token = ob.url.split('t=')[1];
// simulate sign_ (needs a real PNG pipeline) by writing the row directly
const f = ctx.__find(token);
ctx.__set(f.sh, f.row, { status: 'signed', email: 'n@x.com', phone: '0521234567', contractPdfId: 'pdf1', signatureId: 'sig1' });
ctx.questionnairePdf_ = () => ({ getId: () => 'q1', getBlob: () => ({}) });
vm.runInContext('questionnairePdf_ = this.questionnairePdf_;', ctx);
ok({ action: 'submit', token, consent: true, sections: [{ title: 'א', items: [{ q: 'ש', a: 'ת' }] }] });
g = ok({ action: 'crm_get', password: pw, id: p.id });
assert.equal(g.person.stage, 'signed');
assert.equal(g.person.email, 'n@x.com');
assert.match(g.person.questionnaireUrl, /q1/);

// 5. payments + 4 meetings -> ended with followup and deletion dates
g = ok({ action: 'crm_payment', password: pw, id: p.id, amount: 1200, method: 'bit' });
assert.equal(g.person.paid, 1200);
for (let i = 1; i <= 4; i++) {
  ok({ action: 'crm_meeting', password: pw, id: p.id, at: new Date(Date.now() + i * 86400000).toISOString() });
  g = ok({ action: 'crm_meeting_done', password: pw, id: p.id });
  assert.equal(g.person.meetingsDone, i);
  assert.equal(g.person.stage, i < 4 ? 'active' : 'ended');
}
assert.match(Object.values(calEvents).pop().title, /פגישה 4 מתוך 4/);
const ended = new Date(g.person.endedAt);
assert.equal(new Date(g.person.followupAt).getMonth(), (ended.getMonth() + 3) % 12);
assert.equal(new Date(g.person.deleteAfter).getMonth(), (ended.getMonth() + 6) % 12);
g = ok({ action: 'crm_followup_done', password: pw, id: p.id, summary: 'שומרים' });
assert.equal(new Date(g.person.followupAt).getMonth(), (ended.getMonth() + 6) % 12);
g = ok({ action: 'crm_followup_done', password: pw, id: p.id });
assert.equal(g.person.followupAt, '');

// 6. manual add + update + duplicates
const m = ok({ action: 'crm_create', password: pw, name: 'דנה', phone: '0549999999', source: 'referral', referredBy: 'נועה כהן' });
assert.equal(call({ action: 'crm_create', password: pw, name: 'דנה2', phone: '054-999-9999' }).error, 'exists');
g = ok({ action: 'crm_update', password: pw, id: m.id, patch: { stage: 'lost', lostReason: 'יקר' } });
assert.equal(g.person.stage, 'lost');
assert.match(g.events[0].text, /לא רלוונטי: יקר/);
// a lost lead that comes back is "new" again
ok({ action: 'lead', name: 'דנה', phone: '0549999999', tool: 'cashflow' });
assert.equal(ok({ action: 'crm_get', password: pw, id: m.id }).person.stage, 'new');

// 6b. intro set before signing, marked done after signing: still an intro, not meeting 1
const z = ok({ action: 'crm_create', password: pw, name: 'זיו', phone: '0527777777', source: 'instagram' });
ok({ action: 'crm_meeting', password: pw, id: z.id, at: new Date(Date.now() + 86400000).toISOString() });
const zob = ok({ action: 'crm_onboard', password: pw, id: z.id, amount: 2000, gender: 'm' });
const zt = zob.url.split('t=')[1];
const zf = ctx.__find(zt);
ctx.__set(zf.sh, zf.row, { status: 'signed', email: 'z@x.com', phone: '0527777777', contractPdfId: 'pdfz' });
ok({ action: 'submit', token: zt, consent: true, sections: [{ title: 'א', items: [] }] });
g = ok({ action: 'crm_get', password: pw, id: z.id });
assert.equal(g.person.stage, 'signed');
assert.equal(g.person.nextMeetingKind, 'intro');
// moving it keeps it an intro
const before = evSeq;
g = ok({ action: 'crm_meeting', password: pw, id: z.id, at: new Date(Date.now() + 3 * 86400000).toISOString() });
assert.equal(g.person.nextMeetingKind, 'intro');
assert.match(calEvents[Object.keys(calEvents).pop()].title, /שיחת היכרות: זיו/);
g = ok({ action: 'crm_meeting_done', password: pw, id: z.id });
assert.equal(g.person.meetingsDone, 0);
assert.equal(g.person.stage, 'signed');
assert.match(g.events[0].text, /התקיימה שיחת היכרות/);
// the next one is meeting 1 of 4
g = ok({ action: 'crm_meeting', password: pw, id: z.id, at: new Date(Date.now() + 5 * 86400000).toISOString() });
assert.equal(g.person.nextMeetingKind, 'process');
assert.ok(evSeq > before);
g = ok({ action: 'crm_meeting_done', password: pw, id: z.id });
assert.equal(g.person.meetingsDone, 1);
assert.equal(g.person.stage, 'active');
list = ok({ action: 'crm_list', password: pw });
assert.deepEqual(list.payments.map(x => x.amount), [1200]);

// 6c. meeting 1 booked and held while the contract is still unsigned, then they sign
const y = ok({ action: 'crm_create', password: pw, name: 'יובל', phone: '0528888888' });
const yob = ok({ action: 'crm_onboard', password: pw, id: y.id, amount: 1800, gender: 'm' });
g = ok({ action: 'crm_meeting', password: pw, id: y.id, at: new Date(Date.now() + 86400000).toISOString() });
assert.equal(g.person.nextMeetingKind, 'process');
assert.equal(g.person.stage, 'sent');
g = ok({ action: 'crm_meeting_done', password: pw, id: y.id });
assert.equal(g.person.meetingsDone, 1);
assert.equal(g.person.stage, 'active');
const yt = yob.url.split('t=')[1];
const yf = ctx.__find(yt);
ctx.__set(yf.sh, yf.row, { status: 'signed', email: 'y@x.com', phone: '0528888888', contractPdfId: 'pdfy' });
ok({ action: 'submit', token: yt, consent: true, sections: [{ title: 'א', items: [] }] });
g = ok({ action: 'crm_get', password: pw, id: y.id });
assert.equal(g.person.stage, 'active');
assert.equal(g.person.email, 'y@x.com');

// 7. old admin.html link (no card) still lands in the CRM
const old = ok({ action: 'create', password: pw, name: 'ישן', amount: 1000, gender: 'm' });
const f2 = ctx.__find(old.token);
ctx.__set(f2.sh, f2.row, { status: 'signed', email: 'o@x.com', phone: '0501111111', contractPdfId: 'pdf2' });
ok({ action: 'submit', token: old.token, consent: true, sections: [{ title: 'א', items: [] }] });
list = ok({ action: 'crm_list', password: pw });
const oldCard = list.people.find(x => x.name === 'ישן');
assert.equal(oldCard.stage, 'signed');
assert.equal(oldCard.amount, 1000);

// 8. delete removes card, timeline, onboarding row, Drive files
const evBefore = sheets.events.data.length;
ok({ action: 'crm_delete', password: pw, id: p.id, confirm: true });
assert.equal(call({ action: 'crm_get', password: pw, id: p.id }).error, 'not_found');
assert.ok(sheets.events.data.length < evBefore);
assert.ok(!sheets.events.data.some(r => r[0] === p.id));
assert.equal(call({ action: 'get', token }).error, 'bad_link');
assert.deepEqual(trashed.sort(), ['pdf1', 'q1', 'sig1']);
assert.equal(call({ action: 'nope', password: pw }).error, 'invalid');

console.log('ALL PASSED. mails:', mails.length, 'calendar events:', evSeq);
