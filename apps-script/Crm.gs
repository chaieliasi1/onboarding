/**
 * CRM | לידים, לקוחות, פגישות ותשלומים. רץ באותו פרויקט Apps Script כמו Code.gs
 * (קובץ נוסף בעורך: + > Script, בשם Crm). משתמש באותה סיסמה ובאותו גוגל שיט.
 *
 * גיליון crm: שורה לכל אדם. גיליון events: ציר הזמן של כל אדם.
 * מערכת הניהול: https://chaieliasi1.github.io/admin/
 */

const ADMIN_URL = 'https://chaieliasi1.github.io/admin/';
const ONBOARDING_URL = 'https://chaieliasi1.github.io/onboarding/c.html?t=';
const MEETINGS_IN_PROCESS = 4;
const MEETING_MINUTES = 60;

// new columns go at the end, so existing sheets keep working
const CRM_COLS = ['id', 'name', 'phone', 'email', 'gender', 'stage', 'source', 'tool', 'referredBy',
  'amount', 'paid', 'meetingsDone', 'nextMeetingAt', 'calendarEventId', 'onboardingToken',
  'contractUrl', 'questionnaireUrl', 'created', 'updated', 'contactedAt', 'endedAt', 'followupAt',
  'deleteAfter', 'lostReason', 'pain', 'nextMeetingKind'];
const EVENT_COLS = ['personId', 'at', 'kind', 'text', 'data'];

const STAGES = ['new', 'contact', 'intro', 'sent', 'signed', 'active', 'ended', 'lost'];
const SOURCES = ['tool', 'instagram', 'referral', 'whatsapp', 'other'];
const PAY_METHODS = ['bit', 'transfer', 'cash', 'other'];
// ?src= in a tool link, so a link in the Instagram bio shows up as Instagram
const SRC_ALIASES = { ig: 'instagram', insta: 'instagram', instagram: 'instagram', wa: 'whatsapp', whatsapp: 'whatsapp', ref: 'referral' };

const STAGE_LABEL = { new: 'ליד חדש', contact: 'בקשר', intro: 'שיחת היכרות', sent: 'נשלח חוזה', signed: 'חתם', active: 'בליווי', ended: 'סיים', lost: 'לא רלוונטי' };

/* ---------- router (called from route_ in Code.gs) ---------- */

function crmRoute_(req) {
  if (req.action === 'lead') return withLock_(() => lead_(req));
  auth_(req.password);
  switch (req.action) {
    case 'crm_list': return crmList_();
    case 'crm_get': return crmGet_(req.id);
    case 'crm_create': return withLock_(() => crmCreate_(req));
    case 'crm_update': return withLock_(() => crmUpdate_(req));
    case 'crm_note': return withLock_(() => crmNote_(req));
    case 'crm_payment': return withLock_(() => crmPayment_(req));
    case 'crm_meeting': return withLock_(() => crmMeeting_(req));
    case 'crm_meeting_done': return withLock_(() => crmMeetingDone_(req));
    case 'crm_followup_done': return withLock_(() => crmFollowupDone_(req));
    case 'crm_onboard': return crmOnboard_(req); // create_ takes the lock itself
    case 'crm_delete': return withLock_(() => crmDelete_(req));
  }
  throw new Error('invalid');
}

/* ---------- public: a lead from any tool ---------- */

function lead_(req) {
  if (req.hp) return {}; // honeypot: bots get a quiet "ok"
  const cache = CacheService.getScriptCache();
  const recent = Number(cache.get('leads') || 0);
  if (recent >= 30) throw new Error('busy');
  cache.put('leads', String(recent + 1), 600);

  const name = clean_(req.name, 80);
  const phone = clean_(req.phone, 30);
  const tool = String(req.tool || '');
  if (name.length < 2 || (phone.match(/\d/g) || []).length < 9 || !/^[a-z0-9-]{1,40}$/.test(tool)) throw new Error('invalid');
  const toolTitle = clean_(req.toolTitle, 80) || tool;
  const pain = clean_(req.pain, 1000, true);
  const data = cleanData_(req.data);
  const src = SRC_ALIASES[String(req.src || '').toLowerCase()] || 'tool';
  const now = new Date();

  const t = crmTable_();
  const found = byPhone_(t, phone);
  let id;
  if (found) {
    // same person came back through another tool: one card, new event
    id = found.rec.id;
    const patch = { updated: now, deleteAfter: addMonths_(now, 24) };
    if (found.rec.stage === 'lost') patch.stage = 'new';
    if (pain) patch.pain = pain;
    patchRow_(t, found.row, patch);
  } else {
    id = newId_();
    appendRow_(t, {
      id: id, name: name, phone: phone, stage: 'new', source: src, tool: tool, pain: pain,
      amount: 0, paid: 0, meetingsDone: 0, created: now, updated: now, deleteAfter: addMonths_(now, 24)
    });
  }
  addEvent_(id, 'lead', 'השאיר פרטים ב' + toolTitle + (pain ? ': ' + pain : ''), { tool: tool, toolTitle: toolTitle, src: src, values: data });

  const lines = [
    'שם: ' + esc_(name),
    'טלפון: <a href="tel:' + esc_(phone) + '">' + esc_(phone) + '</a>',
    'מה הכי מעיק: ' + (pain ? esc_(pain) : 'לא צוין'),
    'הגיע מ: ' + esc_(toolTitle) + (src !== 'tool' ? ' (' + src + ')' : '')
  ];
  Object.keys(data).forEach(k => lines.push(esc_(k) + ': ' + esc_(data[k])));
  if (found) lines.push('<b>כבר יש כרטיס עם הטלפון הזה. הפנייה נוספה לציר הזמן שלו.</b>');
  try {
    GmailApp.sendEmail(notifyEmail_(), 'ליד חדש: ' + name + ' (' + toolTitle + ')',
      name + ' ' + phone + '\n' + ADMIN_URL + '#p=' + id,
      {
        name: 'מערכת הלקוחות',
        htmlBody: mailHtml_('ליד חדש מ' + esc_(toolTitle), lines, '<a href="' + ADMIN_URL + '#p=' + id + '">פתיחת הכרטיס במערכת</a>'),
        inlineImages: { logo: logoBlob_() }
      });
  } catch (err) {
    console.error(err); // the lead is saved either way
  }
  return {};
}

// a tool's own numbers, as { label: value } strings
function cleanData_(d) {
  const out = {};
  if (!d || typeof d !== 'object' || Array.isArray(d)) return out;
  Object.keys(d).slice(0, 20).forEach(k => {
    const key = clean_(k, 60);
    if (key) out[key] = clean_(d[k], 200);
  });
  return out;
}

/* ---------- admin ---------- */

function crmList_() {
  return { people: crmRows_(crmTable_()).map(r => summary_(r.rec)), payments: payments_(), agenda: agenda_() };
}

// every payment, for income per month
function payments_() {
  const t = eventTable_();
  const n = t.sh.getLastRow() - 1;
  if (n < 1) return [];
  return t.sh.getRange(2, 1, n, t.cols.length).getValues()
    .filter(v => v[2] === 'payment')
    .map(v => {
      let d = {};
      try { d = JSON.parse(v[4]); } catch (e) { /* keep 0 */ }
      return { personId: String(v[0]), at: iso_(v[1]), amount: Number(d.amount) || 0 };
    });
}

function summary_(r) {
  return {
    id: String(r.id), name: String(r.name), phone: String(r.phone), stage: String(r.stage),
    source: String(r.source), tool: String(r.tool), referredBy: String(r.referredBy || ''),
    amount: Number(r.amount) || 0, paid: Number(r.paid) || 0, meetingsDone: Number(r.meetingsDone) || 0,
    nextMeetingAt: iso_(r.nextMeetingAt), nextMeetingKind: String(r.nextMeetingKind || ''), created: iso_(r.created), updated: iso_(r.updated),
    contactedAt: iso_(r.contactedAt), endedAt: iso_(r.endedAt), followupAt: iso_(r.followupAt),
    deleteAfter: iso_(r.deleteAfter)
  };
}

function crmGet_(id) {
  const f = byId_(crmTable_(), id);
  const r = f.rec;
  const person = Object.assign(summary_(r), {
    email: String(r.email || ''), gender: String(r.gender || ''), pain: String(r.pain || ''),
    lostReason: String(r.lostReason || ''), contractUrl: String(r.contractUrl || ''),
    questionnaireUrl: String(r.questionnaireUrl || ''),
    onboardingUrl: r.onboardingToken && r.stage === 'sent' ? ONBOARDING_URL + r.onboardingToken : ''
  });
  return { person: person, events: eventsOf_(String(r.id)) };
}

function crmCreate_(req) {
  const name = clean_(req.name, 80);
  if (name.length < 2) throw new Error('invalid');
  const phone = clean_(req.phone, 30);
  const t = crmTable_();
  if (phone && byPhone_(t, phone)) throw new Error('exists');
  const source = SOURCES.indexOf(req.source) >= 0 ? req.source : 'other';
  const now = new Date();
  const id = newId_();
  appendRow_(t, {
    id: id, name: name, phone: phone, stage: 'new', source: source,
    referredBy: clean_(req.referredBy, 80), amount: 0, paid: 0, meetingsDone: 0,
    created: now, updated: now, deleteAfter: addMonths_(now, 24)
  });
  addEvent_(id, 'note', 'נוסף ידנית');
  return { id: id };
}

function crmUpdate_(req) {
  const t = crmTable_();
  const f = byId_(t, req.id);
  const p = req.patch || {};
  const patch = { updated: new Date() };
  ['name', 'email', 'referredBy', 'lostReason'].forEach(k => { if (k in p) patch[k] = clean_(p[k], 120); });
  if ('phone' in p) patch.phone = clean_(p.phone, 30);
  if ('gender' in p && GENDERS[p.gender]) patch.gender = p.gender;
  if ('source' in p && SOURCES.indexOf(p.source) >= 0) patch.source = p.source;
  if ('amount' in p) {
    const a = Math.round(Number(p.amount));
    if (!(a >= 0 && a <= 1000000)) throw new Error('invalid');
    patch.amount = a;
  }
  if (patch.name === '') throw new Error('invalid');
  if ('stage' in p && p.stage !== f.rec.stage) {
    if (STAGES.indexOf(p.stage) < 0) throw new Error('invalid');
    Object.assign(patch, stagePatch_(f.rec, p.stage));
    addEvent_(f.rec.id, 'stage', STAGE_LABEL[p.stage] + (p.stage === 'lost' && patch.lostReason ? ': ' + patch.lostReason : ''));
  }
  patchRow_(t, f.row, patch);
  return crmGet_(f.rec.id);
}

// side effects of moving to a stage
function stagePatch_(rec, stage) {
  const now = new Date();
  const patch = { stage: stage };
  if (stage === 'contact' && !rec.contactedAt) patch.contactedAt = now;
  if (stage === 'ended') {
    patch.endedAt = now;
    patch.followupAt = addMonths_(now, 3);
    patch.deleteAfter = addMonths_(now, 6); // as promised in the onboarding privacy notice
  }
  if (stage === 'lost') patch.followupAt = '';
  return patch;
}

function crmNote_(req) {
  const t = crmTable_();
  const f = byId_(t, req.id);
  const text = clean_(req.text, 3000, true);
  if (!text) throw new Error('invalid');
  addEvent_(f.rec.id, 'note', text);
  const patch = { updated: new Date() };
  if (f.rec.stage === 'new') Object.assign(patch, stagePatch_(f.rec, 'contact'));
  patchRow_(t, f.row, patch);
  return crmGet_(f.rec.id);
}

function crmPayment_(req) {
  const t = crmTable_();
  const f = byId_(t, req.id);
  const sum = Math.round(Number(req.amount));
  const method = PAY_METHODS.indexOf(req.method) >= 0 ? req.method : 'other';
  if (!(sum !== 0 && Math.abs(sum) <= 1000000)) throw new Error('invalid');
  const at = req.date ? new Date(req.date) : new Date();
  if (isNaN(at)) throw new Error('invalid');
  addEvent_(f.rec.id, 'payment', clean_(req.note, 300), { amount: sum, method: method }, at);
  patchRow_(t, f.row, { paid: (Number(f.rec.paid) || 0) + sum, updated: new Date() });
  return crmGet_(f.rec.id);
}

// from "contract sent" on, a meeting is one of the four; anything before is an intro call
function processStage_(stage) {
  return stage === 'sent' || stage === 'signed' || stage === 'active';
}

// sets (or moves) the next meeting, in Hai's Google Calendar
function crmMeeting_(req) {
  const t = crmTable_();
  const f = byId_(t, req.id);
  const r = f.rec;
  const start = new Date(req.at);
  if (isNaN(start)) throw new Error('invalid');
  const end = new Date(start.getTime() + (Number(req.minutes) || MEETING_MINUTES) * 60000);
  const cal = CalendarApp.getDefaultCalendar();
  let ev = null;
  if (r.calendarEventId) {
    try { ev = cal.getEventById(String(r.calendarEventId)); } catch (e) { ev = null; }
  }
  // moving a meeting keeps its kind: an intro set before signing stays an intro
  const moving = ev && r.nextMeetingAt instanceof Date;
  const kind = moving && r.nextMeetingKind ? String(r.nextMeetingKind) : processStage_(r.stage) ? 'process' : 'intro';
  const n = (Number(r.meetingsDone) || 0) + 1;
  const title = (kind === 'process' ? 'פגישה ' + n + ' מתוך ' + MEETINGS_IN_PROCESS : 'שיחת היכרות') + ': ' + r.name;
  const desc = 'טלפון: ' + r.phone + '\n' + ADMIN_URL + '#p=' + r.id + (req.note ? '\n\n' + clean_(req.note, 1000, true) : '');
  if (moving) {
    ev.setTime(start, end).setTitle(title).setDescription(desc);
  } else {
    ev = cal.createEvent(title, start, end, { description: desc });
  }
  ev.removeAllReminders();
  ev.addPopupReminder(60);

  const patch = { nextMeetingAt: start, nextMeetingKind: kind, calendarEventId: ev.getId(), updated: new Date() };
  if (['new', 'contact'].indexOf(r.stage) >= 0) Object.assign(patch, stagePatch_(r, 'intro'));
  patchRow_(t, f.row, patch);
  addEvent_(r.id, 'meeting', 'נקבעה ' + title.split(':')[0] + ' ל-' + fmt_(start));
  return crmGet_(r.id);
}

function crmMeetingDone_(req) {
  const t = crmTable_();
  const f = byId_(t, req.id);
  const r = f.rec;
  const summary = clean_(req.summary, 3000, true);
  const patch = { nextMeetingAt: '', nextMeetingKind: '', calendarEventId: '', updated: new Date() };
  const kind = r.nextMeetingKind ? String(r.nextMeetingKind) : processStage_(r.stage) ? 'process' : 'intro';
  let label;
  if (kind === 'process' && processStage_(r.stage)) {
    const n = (Number(r.meetingsDone) || 0) + 1;
    patch.meetingsDone = n;
    label = 'התקיימה פגישה ' + n + ' מתוך ' + MEETINGS_IN_PROCESS;
    Object.assign(patch, stagePatch_(r, n >= MEETINGS_IN_PROCESS ? 'ended' : 'active'));
  } else {
    label = 'התקיימה שיחת היכרות';
  }
  addEvent_(r.id, 'meeting', label + (summary ? '\n' + summary : ''));
  if (patch.stage === 'ended') addEvent_(r.id, 'stage', STAGE_LABEL.ended);
  patchRow_(t, f.row, patch);
  return crmGet_(r.id);
}

// first check-in 3 months after the end, the second at 6, then none
function crmFollowupDone_(req) {
  const t = crmTable_();
  const f = byId_(t, req.id);
  const r = f.rec;
  const summary = clean_(req.summary, 3000, true);
  const ended = r.endedAt instanceof Date ? r.endedAt : new Date();
  const second = addMonths_(ended, 6);
  const isFirst = r.followupAt instanceof Date && r.followupAt < addMonths_(ended, 4);
  patchRow_(t, f.row, { followupAt: isFirst ? second : '', updated: new Date() });
  addEvent_(r.id, 'note', 'מעקב ' + (isFirst ? '3' : '6') + ' חודשים אחרי סיום' + (summary ? '\n' + summary : ''));
  return crmGet_(r.id);
}

// creates the contract+questionnaire link (Code.gs create_) and ties it to the card
function crmOnboard_(req) {
  const t = crmTable_();
  const r = byId_(t, req.id).rec;
  const res = create_({ name: r.name, amount: req.amount, gender: req.gender });
  withLock_(() => {
    const f = byId_(t, r.id); // the row may have moved while unlocked
    patchRow_(t, f.row, Object.assign({
      onboardingToken: res.token, amount: Math.round(Number(req.amount)), gender: req.gender, updated: new Date()
    }, stagePatch_(f.rec, 'sent')));
    addEvent_(r.id, 'onboarding', 'נוצר קישור לחוזה ולשאלון, על סך ' + money_(req.amount));
  });
  return Object.assign({ url: ONBOARDING_URL + res.token }, crmGet_(r.id));
}

// privacy: removes the card, its timeline, the onboarding row and its Drive files
function crmDelete_(req) {
  if (req.confirm !== true) throw new Error('invalid');
  const t = crmTable_();
  const f = byId_(t, req.id);
  const r = f.rec;
  if (r.onboardingToken) {
    try {
      const o = find_(String(r.onboardingToken));
      ['signatureId', 'contractPdfId', 'questionnairePdfId'].forEach(k => {
        if (o.rec[k]) { try { DriveApp.getFileById(String(o.rec[k])).setTrashed(true); } catch (e) { /* already gone */ } }
      });
      o.sh.deleteRow(o.row);
    } catch (e) { /* no onboarding row */ }
  }
  const ev = eventTable_();
  const rows = ev.sh.getLastRow() > 1 ? ev.sh.getRange(2, 1, ev.sh.getLastRow() - 1, 1).getValues() : [];
  for (let i = rows.length - 1; i >= 0; i--) {
    if (String(rows[i][0]) === String(r.id)) ev.sh.deleteRow(i + 2);
  }
  t.sh.deleteRow(f.row);
  return {};
}

/* ---------- onboarding hooks (called from Code.gs) ---------- */

// the client finished contract + questionnaire
function crmOnboardDone_(token, info) {
  try {
    const t = crmTable_();
    const now = new Date();
    const cell = t.sh.getRange(1, CRM_COLS.indexOf('onboardingToken') + 1, t.sh.getMaxRows(), 1)
      .createTextFinder(token).matchEntireCell(true).findNext();
    const patch = {
      email: info.email, phone: info.phone, contractUrl: info.contractUrl,
      questionnaireUrl: info.questionnaireUrl, stage: 'signed', updated: now
    };
    let id;
    if (cell) {
      const row = cell.getRow();
      const rec = rowRec_(t, row);
      id = rec.id;
      if (rec.stage === 'active' || rec.stage === 'ended') delete patch.stage; // a meeting already happened: never move back
      patchRow_(t, row, patch);
    } else {
      // a link made in the old admin.html: open a card for it
      id = newId_();
      appendRow_(t, Object.assign({
        id: id, name: info.name, gender: info.gender, source: 'other', onboardingToken: token,
        amount: info.amount, paid: 0, meetingsDone: 0, created: now, deleteAfter: addMonths_(now, 24)
      }, patch));
    }
    addEvent_(id, 'onboarding', 'חתם על ההסכמות ומילא את השאלון');
  } catch (err) {
    console.error(err); // never fail the client's submit because of the CRM
  }
}

/* ---------- calendar ---------- */

function agenda_() {
  try {
    const now = new Date();
    const from = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const to = new Date(from.getTime() + 8 * 86400000);
    return CalendarApp.getDefaultCalendar().getEvents(from, to).slice(0, 40).map(e => ({
      title: e.getTitle(), start: iso_(e.getStartTime()), end: iso_(e.getEndTime()), allDay: e.isAllDayEvent()
    }));
  } catch (err) {
    console.error(err);
    return [];
  }
}

/* ---------- tables ---------- */

function crmTable_() { return table_('crm', CRM_COLS); }
function eventTable_() { return table_('events', EVENT_COLS); }

function table_(name, cols) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(name);
  if (!sh) {
    sh = ss.insertSheet(name);
    sh.appendRow(cols);
    sh.setFrozenRows(1);
    sh.setRightToLeft(true);
  } else if (sh.getRange(1, cols.length).getValue() !== cols[cols.length - 1]) {
    sh.getRange(1, 1, 1, cols.length).setValues([cols]);
  }
  return { sh: sh, cols: cols };
}

function crmRows_(t) {
  const n = t.sh.getLastRow() - 1;
  if (n < 1) return [];
  return t.sh.getRange(2, 1, n, t.cols.length).getValues().map((v, i) => ({ row: i + 2, rec: toRec_(t.cols, v) }));
}

function toRec_(cols, values) {
  const r = {};
  cols.forEach((c, i) => { r[c] = values[i]; });
  return r;
}

function rowRec_(t, row) {
  return toRec_(t.cols, t.sh.getRange(row, 1, 1, t.cols.length).getValues()[0]);
}

function byId_(t, id) {
  if (!/^[a-f0-9]{8,12}$/.test(String(id || ''))) throw new Error('not_found');
  const cell = t.sh.getRange('A:A').createTextFinder(String(id)).matchEntireCell(true).findNext();
  if (!cell) throw new Error('not_found');
  return { row: cell.getRow(), rec: rowRec_(t, cell.getRow()) };
}

function byPhone_(t, phone) {
  const key = phoneKey_(phone);
  if (key.length < 9) return null;
  return crmRows_(t).find(x => phoneKey_(x.rec.phone) === key) || null;
}

// 052-123-4567, +972521234567 and 0521234567 are the same phone
function phoneKey_(p) {
  const d = String(p || '').replace(/\D/g, '');
  return d.indexOf('972') === 0 ? '0' + d.slice(3) : d;
}

// Strings get a leading ' so Sheets keeps phones' leading 0 and never runs a formula.
function cell_(v) {
  return typeof v === 'string' && v !== '' ? "'" + v : v;
}

function appendRow_(t, obj) {
  t.sh.appendRow(t.cols.map(c => (c in obj ? cell_(obj[c]) : '')));
}

function patchRow_(t, row, patch) {
  Object.keys(patch).forEach(k => {
    t.sh.getRange(row, t.cols.indexOf(k) + 1).setValue(cell_(patch[k]));
  });
}

function addEvent_(personId, kind, text, data, at) {
  appendRow_(eventTable_(), {
    personId: String(personId), at: at || new Date(), kind: kind, text: text || '',
    data: data ? JSON.stringify(data).slice(0, 20000) : ''
  });
}

function eventsOf_(id) {
  const t = eventTable_();
  const n = t.sh.getLastRow() - 1;
  if (n < 1) return [];
  return t.sh.getRange(2, 1, n, t.cols.length).getValues()
    .filter(v => String(v[0]) === id)
    .map(v => {
      const e = toRec_(t.cols, v);
      let data = null;
      try { data = e.data ? JSON.parse(e.data) : null; } catch (err) { data = null; }
      return { at: iso_(e.at), kind: String(e.kind), text: String(e.text), data: data };
    })
    .reverse();
}

function newId_() {
  return Utilities.getUuid().replace(/-/g, '').slice(0, 10);
}

function addMonths_(d, n) {
  const x = new Date(d.getTime());
  x.setMonth(x.getMonth() + n);
  return x;
}

/** מריצים פעם אחת מהעורך אחרי הוספת הקובץ: יוצר את הגיליונות ומבקש הרשאת יומן. */
function setupCrm() {
  crmTable_();
  eventTable_();
  console.log('יומן: ' + CalendarApp.getDefaultCalendar().getName() + '. מוכן.');
}
