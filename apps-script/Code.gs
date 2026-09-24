/**
 * חוזה + שאלון אפיון | בקאנד (Google Apps Script)
 * מדביקים את כל הקובץ ב-Extensions > Apps Script של גוגל שיט. הוראות מלאות ב-SETUP.md.
 *
 * הנוסחים של החוזה ושל רובריקת הפרטיות נמצאים כאן בלבד. העמוד של הלקוח מקבל
 * אותם מכאן, כך שמה שהלקוח רואה ומה שנכנס ל-PDF הם תמיד אותו טקסט.
 */

const OWNER_NAME = 'חי אליאסי';
const BRAND = 'חי אליאסי | יועץ פיננסי לזוגות צעירים ולמשפחות';
const CONTACT_EMAIL = 'Eliasichai@gmail.com';
const FOLDER_NAME = 'חוזים ושאלונים';
const SHEET_NAME = 'clients';
const TZ = 'Asia/Jerusalem';
const FONT = 'Rubik';

// נוסח שתלוי במגדר: G(זוג, זכר, נקבה). מחרוזת רגילה = אותו נוסח לכולם.
function G(c, m, f) { return { c: c, m: m, f: f }; }

const CONTRACT_TITLE = 'כמה הסכמות לפני שיוצאים לדרך';
const CLAUSES = [
  G('הליווי כולל ארבע פגישות שיתקיימו לאורך כארבעה חודשים. יחד נכיר את המצב הכלכלי שלכם, נבנה תוכנית, נבדוק איך היא עובדת בפועל ונתכנן את הצעדים הבאים.',
    'הליווי כולל ארבע פגישות שיתקיימו לאורך כארבעה חודשים. יחד נכיר את המצב הכלכלי שלך, נבנה תוכנית, נבדוק איך היא עובדת בפועל ונתכנן את הצעדים הבאים.',
    'הליווי כולל ארבע פגישות שיתקיימו לאורך כארבעה חודשים. יחד נכיר את המצב הכלכלי שלך, נבנה תוכנית, נבדוק איך היא עובדת בפועל ונתכנן את הצעדים הבאים.'),
  G('כדי שאוכל להתאים לכם תוכנית מדויקת, חשוב שתשתפו אותי במידע מלא ונכון ככל האפשר. שקיפות היא חלק משמעותי מהתהליך.',
    'כדי שאוכל להתאים לך תוכנית מדויקת, חשוב שתשתף אותי במידע מלא ונכון ככל האפשר. שקיפות היא חלק משמעותי מהתהליך.',
    'כדי שאוכל להתאים לך תוכנית מדויקת, חשוב שתשתפי אותי במידע מלא ונכון ככל האפשר. שקיפות היא חלק משמעותי מהתהליך.'),
  G('אני אביא לתהליך ידע, כלים וליווי אישי. ההתקדמות תלויה גם בשיתוף הפעולה שלכם וביישום הצעדים שנסכם יחד בין הפגישות.',
    'אני אביא לתהליך ידע, כלים וליווי אישי. ההתקדמות תלויה גם בשיתוף הפעולה שלך וביישום הצעדים שנסכם יחד בין הפגישות.',
    'אני אביא לתהליך ידע, כלים וליווי אישי. ההתקדמות תלויה גם בשיתוף הפעולה שלך וביישום הצעדים שנסכם יחד בין הפגישות.'),
  G('במהלך הליווי תקבלו כלים לניהול ולתכנון הכסף שלכם. חלק מהשינויים מורגשים מהר, ואחרים דורשים זמן והתמדה. אין הבטחה לתוצאה מסוימת או לפתרון מיידי.',
    'במהלך הליווי תקבל כלים לניהול ולתכנון הכסף שלך. חלק מהשינויים מורגשים מהר, ואחרים דורשים זמן והתמדה. אין הבטחה לתוצאה מסוימת או לפתרון מיידי.',
    'במהלך הליווי תקבלי כלים לניהול ולתכנון הכסף שלך. חלק מהשינויים מורגשים מהר, ואחרים דורשים זמן והתמדה. אין הבטחה לתוצאה מסוימת או לפתרון מיידי.'),
  G('אני מתחייב ללוות אתכם בגובה העיניים, ללא שיפוטיות, ולשמור על פרטיות המידע שתשתפו איתי. ההחלטות הכלכליות והביצוע שלהן נשארים בידיכם.',
    'אני מתחייב ללוות אותך בגובה העיניים, ללא שיפוטיות, ולשמור על פרטיות המידע שתשתף איתי. ההחלטות הכלכליות והביצוע שלהן נשארים בידיך.',
    'אני מתחייב ללוות אותך בגובה העיניים, ללא שיפוטיות, ולשמור על פרטיות המידע שתשתפי איתי. ההחלטות הכלכליות והביצוע שלהן נשארים בידייך.'),
  'אם נצטרך לשנות מועד של פגישה, נעדכן זה את זה מוקדם ככל האפשר ונתאם מועד חדש.',
  'אם אחד הצדדים ירצה לסיים את הליווי לפני תום התהליך, נחשב את התמורה עבור הפגישות והעבודה שבוצעו בפועל, והיתרה תוחזר בהתאם לדין.',
  'הליווי מתמקד בניהול כלכלת הבית ובתזרים המשפחתי. בנושאים שדורשים ייעוץ השקעות, ייעוץ פנסיוני, ייעוץ מס או ייעוץ משפטי, נפנה במידת הצורך לאיש מקצוע מתאים.',
  'פניות, שאלות והבהרות בין הפגישות יתקיימו בוואטסאפ בימים א׳–ה׳, בין השעות 10:00–18:00. אפשר לתאם מראש גם שיחת טלפון.'
];
const CONTRACT_AGREE = G('קראתי את ההסכמות ואני מאשר/ת אותן.',
  'קראתי את ההסכמות ואני מאשר אותן.',
  'קראתי את ההסכמות ואני מאשרת אותן.');

const PRIVACY_TITLE = 'פרטיות ושמירת המידע';
const PRIVACY_POINTS = [
  'המידע בשאלון נמסר אך ורק לטובת תהליך הליווי הכלכלי של חי אליאסי.',
  'רק חי אליאסי נחשף למידע. הוא לא מועבר לאף גורם אחר.',
  'השאלון וההסכם החתום נשמרים בחשבון הגוגל של חי (Google Drive ו-Google Sheets) ונשלחים דרך Gmail. השרתים של גוגל עשויים להיות ממוקמים מחוץ לישראל.',
  'המידע נשמר עד חצי שנה אחרי סיום תהליך הליווי, ואז נמחק.',
  'אפשר לבקש לעיין במידע, לתקן אותו או למחוק אותו בכל שלב, במייל ' + CONTACT_EMAIL + '.'
];
const PRIVACY_AGREE = G('קראתי ואני מאשר/ת את מסירת המידע לחי אליאסי לטובת תהליך הליווי הכלכלי, בהתאם לאמור למעלה.',
  'קראתי ואני מאשר את מסירת המידע לחי אליאסי לטובת תהליך הליווי הכלכלי, בהתאם לאמור למעלה.',
  'קראתי ואני מאשרת את מסירת המידע לחי אליאסי לטובת תהליך הליווי הכלכלי, בהתאם לאמור למעלה.');

// the client's copy email
const CLIENT_MAIL = {
  subject: G('העתק ההסכם שלכם עם ', 'העתק ההסכם שלך עם ', 'העתק ההסכם שלך עם '),
  thanks: G('תודה שחתמתם ומילאתם את השאלון.', 'תודה שחתמת ומילאת את השאלון.', 'תודה שחתמת ומילאת את השאלון.'),
  attached: G('מצורף העתק של ההסכמות שחתמתם עליהן.', 'מצורף העתק של ההסכמות שחתמת עליהן.', 'מצורף העתק של ההסכמות שחתמת עליהן.')
};

const GENDERS = { c: 'זוג', m: 'זכר', f: 'נקבה' };

// new columns go at the end, so existing sheets keep working
const COLS = ['token', 'name', 'amount', 'created', 'status', 'email', 'phone', 'signedAt',
  'signatureId', 'contractPdfId', 'questionnairePdfId', 'consentAt', 'completedAt', 'answers', 'gender'];

function gender_(g) {
  return GENDERS[g] ? g : 'c';
}

function pick_(v, g) {
  return typeof v === 'string' ? v : v[gender_(g)];
}

function texts_(g) {
  return {
    contract: { title: CONTRACT_TITLE, clauses: CLAUSES.map(t => pick_(t, g)), agree: pick_(CONTRACT_AGREE, g) },
    privacy: { title: PRIVACY_TITLE, points: PRIVACY_POINTS, agree: pick_(PRIVACY_AGREE, g) }
  };
}

/* ---------- HTTP ---------- */

function doGet() {
  return json_({ ok: true, service: 'onboarding' });
}

function doPost(e) {
  try {
    const req = JSON.parse(e.postData.contents);
    return json_(Object.assign({ ok: true }, route_(req)));
  } catch (err) {
    const code = String(err && err.message || err);
    if (!/^(auth|locked|no_password|bad_link|already_done|not_signed|invalid)$/.test(code)) console.error(err);
    return json_({ ok: false, error: code });
  }
}

function route_(req) {
  switch (req.action) {
    case 'list': auth_(req.password); return { clients: list_() };
    case 'create': auth_(req.password); return create_(req);
    case 'get': return get_(req.token);
    case 'sign': return withLock_(() => sign_(req));
    case 'submit': return withLock_(() => submit_(req));
    default: throw new Error('invalid');
  }
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function withLock_(fn) {
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try { return fn(); } finally { lock.releaseLock(); }
}

/* ---------- admin ---------- */

function auth_(pw) {
  const cache = CacheService.getScriptCache();
  const fails = Number(cache.get('fails') || 0);
  if (fails >= 10) throw new Error('locked');
  const real = PropertiesService.getScriptProperties().getProperty('ADMIN_PASSWORD');
  if (!real) throw new Error('no_password');
  if (String(pw || '') !== real) {
    cache.put('fails', String(fails + 1), 900);
    throw new Error('auth');
  }
}

function create_(req) {
  const name = clean_(req.name, 80);
  const amount = Math.round(Number(req.amount));
  if (!name || !(amount > 0) || amount > 1000000 || !GENDERS[req.gender]) throw new Error('invalid');
  const token = (Utilities.getUuid() + Utilities.getUuid()).replace(/-/g, '');
  withLock_(() => {
    const row = COLS.map(() => '');
    row[COLS.indexOf('token')] = "'" + token;
    row[COLS.indexOf('name')] = "'" + name;
    row[COLS.indexOf('amount')] = amount;
    row[COLS.indexOf('created')] = new Date();
    row[COLS.indexOf('status')] = 'sent';
    row[COLS.indexOf('gender')] = req.gender;
    sheet_().appendRow(row);
  });
  return { token: token };
}

function list_() {
  const sh = sheet_();
  const n = sh.getLastRow() - 1;
  if (n < 1) return [];
  return sh.getRange(2, 1, n, COLS.length).getValues().map(v => {
    const r = rec_(v);
    return {
      token: r.status === 'done' ? '' : String(r.token),
      name: String(r.name),
      amount: Number(r.amount),
      created: iso_(r.created),
      status: r.status,
      gender: gender_(r.gender),
      contractUrl: fileUrl_(r.contractPdfId),
      questionnaireUrl: fileUrl_(r.questionnairePdfId)
    };
  }).reverse();
}

/* ---------- client ---------- */

function get_(token) {
  const r = find_(token).rec;
  if (r.status === 'done') return { status: 'done', name: String(r.name) };
  return Object.assign({
    status: r.status,
    name: String(r.name),
    amount: Number(r.amount),
    email: String(r.email || ''),
    phone: String(r.phone || ''),
    gender: gender_(r.gender)
  }, texts_(r.gender));
}

function sign_(req) {
  const f = find_(req.token);
  const r = f.rec;
  if (r.status === 'done') throw new Error('already_done');
  if (r.status === 'signed') return { status: 'signed' };

  const email = clean_(req.email, 120);
  const phone = clean_(req.phone, 30);
  const sig = String(req.signature || '');
  if (req.agree !== true ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
      (phone.match(/\d/g) || []).length < 9 ||
      sig.indexOf('data:image/png;base64,') !== 0 || sig.length > 700000) {
    throw new Error('invalid');
  }

  const signedAt = new Date();
  const sigBlob = Utilities.newBlob(Utilities.base64Decode(sig.split(',')[1]), 'image/png', 'חתימה - ' + r.name + '.png');
  const sigFile = folder_().createFile(sigBlob);
  const pdf = contractPdf_({ name: r.name, amount: r.amount, email: email, phone: phone, signedAt: signedAt, gender: r.gender }, sigBlob);

  set_(f.sh, f.row, {
    status: 'signed', email: email, phone: phone, signedAt: signedAt,
    signatureId: sigFile.getId(), contractPdfId: pdf.getId()
  });
  return { status: 'signed' };
}

function submit_(req) {
  const f = find_(req.token);
  const r = f.rec;
  if (r.status === 'done') throw new Error('already_done');
  if (r.status !== 'signed') throw new Error('not_signed');
  if (req.consent !== true) throw new Error('invalid');

  const sections = (Array.isArray(req.sections) ? req.sections : []).slice(0, 20).map(s => ({
    title: clean_(s && s.title, 120),
    items: (Array.isArray(s && s.items) ? s.items : []).slice(0, 40).map(it => ({
      q: clean_(it && it.q, 300),
      a: clean_(it && it.a, 3000, true)
    }))
  }));
  if (!sections.length) throw new Error('invalid');

  const consentAt = new Date();
  const qPdf = questionnairePdf_(r, sections, consentAt);
  const contract = DriveApp.getFileById(r.contractPdfId);

  // client first, so a bad address can be flagged in Hai's email
  let clientError = '';
  const mail = { thanks: pick_(CLIENT_MAIL.thanks, r.gender), attached: pick_(CLIENT_MAIL.attached, r.gender) };
  try {
    GmailApp.sendEmail(String(r.email), pick_(CLIENT_MAIL.subject, r.gender) + OWNER_NAME,
      'היי ' + r.name + ',\n\n' + mail.thanks + ' ' + mail.attached + '\nנתראה בפגישה הראשונה.\n\n' + OWNER_NAME,
      {
        name: OWNER_NAME,
        htmlBody: mailHtml_('היי ' + esc_(r.name) + ',',
          [mail.thanks, mail.attached, 'נתראה בפגישה הראשונה.'], OWNER_NAME),
        attachments: [contract.getBlob()]
      });
  } catch (err) {
    clientError = String(err && err.message || err);
  }

  const lines = [
    'שם: ' + esc_(r.name) + ' (' + GENDERS[gender_(r.gender)] + ')',
    'סכום: ' + money_(r.amount),
    'מייל: ' + esc_(r.email),
    'טלפון: ' + esc_(r.phone),
    'חתם: ' + fmt_(r.signedAt)
  ];
  if (clientError) lines.push('<b style="color:#BE123C">שים לב: המייל ללקוח לא נשלח (' + esc_(clientError) + '). כדאי לשלוח לו את החוזה ידנית.</b>');
  GmailApp.sendEmail(notifyEmail_(), 'לקוח סיים חוזה ושאלון: ' + r.name,
    'מצורפים החוזה החתום והשאלון של ' + r.name + '.',
    {
      name: 'מערכת הלקוחות',
      htmlBody: mailHtml_('לקוח סיים חוזה ושאלון', lines, 'הקבצים מצורפים ונשמרו גם בתיקייה "' + FOLDER_NAME + '" בדרייב.'),
      attachments: [contract.getBlob(), qPdf.getBlob()]
    });

  set_(f.sh, f.row, {
    status: 'done', questionnairePdfId: qPdf.getId(), consentAt: consentAt,
    completedAt: new Date(), answers: JSON.stringify(sections).slice(0, 45000)
  });
  return { status: 'done' };
}

/* ---------- PDFs ---------- */

function contractPdf_(c, sigBlob) {
  const t = texts_(c.gender).contract;
  return makePdf_('חוזה - ' + c.name, body => {
    title_(body, CONTRACT_TITLE);
    para_(body, BRAND, { size: 10, color: '#5A5D69', after: 14 });
    para_(body, 'שם הלקוח: ' + c.name, { bold: true });
    para_(body, 'התמורה עבור תהליך הליווי: ' + money_(c.amount), { bold: true, after: 12 });
    t.clauses.forEach((x, i) => para_(body, (i + 1) + '. ' + x, { after: 8 }));
    para_(body, t.agree, { bold: true, before: 10, after: 8 });

    const img = body.appendImage(sigBlob);
    const w = 200;
    img.setHeight(Math.round(img.getHeight() * w / img.getWidth())).setWidth(w);
    img.getParent().asParagraph().setLeftToRight(false).setAlignment(DocumentApp.HorizontalAlignment.RIGHT);

    para_(body, 'חתימה: ' + c.name, { size: 10 });
    para_(body, 'מייל: ' + c.email + '   |   טלפון: ' + c.phone, { size: 10 });
    para_(body, 'נחתם דיגיטלית בתאריך ' + fmt_(c.signedAt), { size: 10, color: '#5A5D69' });
  });
}

function questionnairePdf_(r, sections, consentAt) {
  return makePdf_('שאלון אפיון - ' + r.name, body => {
    title_(body, 'שאלון אפיון לפני פגישה ראשונה');
    para_(body, r.name + '   |   מולא בתאריך ' + fmt_(consentAt), { size: 10, color: '#5A5D69', after: 10 });
    sections.forEach(s => {
      para_(body, s.title, { bold: true, size: 13, color: '#C2410C', before: 14, after: 4 });
      s.items.forEach(it => {
        para_(body, it.q, { bold: true, size: 10.5, before: 6 });
        para_(body, it.a || 'לא מולא', { color: it.a ? '#20222A' : '#9A9CA6', after: 2 });
      });
    });
    para_(body, PRIVACY_TITLE, { bold: true, size: 13, color: '#C2410C', before: 16, after: 4 });
    PRIVACY_POINTS.forEach(t => para_(body, '• ' + t, { size: 10 }));
    para_(body, '☑ ' + pick_(PRIVACY_AGREE, r.gender), { bold: true, size: 10, before: 6 });
    para_(body, 'אושר על ידי ' + r.name + ' בתאריך ' + fmt_(consentAt), { size: 10, color: '#5A5D69' });
  });
}

function makePdf_(name, build) {
  const doc = DocumentApp.create(name);
  const body = doc.getBody();
  body.setMarginTop(48).setMarginBottom(48).setMarginLeft(56).setMarginRight(56);
  build(body);
  const first = body.getChild(0);
  if (body.getNumChildren() > 1 && first.getType() === DocumentApp.ElementType.PARAGRAPH && !first.asParagraph().getText()) {
    first.removeFromParent();
  }
  para_(body, BRAND, { size: 9, color: '#9A9CA6', before: 18 });
  doc.saveAndClose();

  const docFile = DriveApp.getFileById(doc.getId());
  const pdf = folder_().createFile(docFile.getAs('application/pdf').setName(name + '.pdf'));
  docFile.setTrashed(true);
  return pdf;
}

function title_(body, text) {
  para_(body, text, { bold: true, size: 20, after: 2 });
}

function para_(body, text, o) {
  o = o || {};
  const p = body.appendParagraph(text);
  p.setLeftToRight(false)
    .setAlignment(DocumentApp.HorizontalAlignment.RIGHT)
    .setSpacingBefore(o.before || 0)
    .setSpacingAfter(o.after || 0)
    .setLineSpacing(1.3);
  const a = {};
  a[DocumentApp.Attribute.FONT_FAMILY] = FONT;
  a[DocumentApp.Attribute.FONT_SIZE] = o.size || 11;
  a[DocumentApp.Attribute.BOLD] = !!o.bold;
  a[DocumentApp.Attribute.FOREGROUND_COLOR] = o.color || '#20222A';
  p.editAsText().setAttributes(a);
  return p;
}

/* ---------- storage ---------- */

function sheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) {
    sh = ss.insertSheet(SHEET_NAME);
    sh.appendRow(COLS);
    sh.setFrozenRows(1);
    sh.setRightToLeft(true);
  } else if (sh.getRange(1, COLS.length).getValue() !== COLS[COLS.length - 1]) {
    sh.getRange(1, 1, 1, COLS.length).setValues([COLS]);
  }
  return sh;
}

function find_(token) {
  if (!/^[a-f0-9]{64}$/.test(String(token || ''))) throw new Error('bad_link');
  const sh = sheet_();
  const cell = sh.getRange('A:A').createTextFinder(token).matchEntireCell(true).findNext();
  if (!cell) throw new Error('bad_link');
  const row = cell.getRow();
  return { sh: sh, row: row, rec: rec_(sh.getRange(row, 1, 1, COLS.length).getValues()[0]) };
}

function rec_(values) {
  const r = {};
  COLS.forEach((c, i) => { r[c] = values[i]; });
  return r;
}

// Strings get a leading ' so Sheets keeps phones' leading 0 and never runs a formula.
function set_(sh, row, patch) {
  Object.keys(patch).forEach(k => {
    const v = patch[k];
    sh.getRange(row, COLS.indexOf(k) + 1).setValue(typeof v === 'string' ? "'" + v : v);
  });
}

function folder_() {
  const props = PropertiesService.getScriptProperties();
  const id = props.getProperty('FOLDER_ID');
  if (id) {
    try { return DriveApp.getFolderById(id); } catch (e) { /* deleted, recreate */ }
  }
  const folder = DriveApp.createFolder(FOLDER_NAME);
  props.setProperty('FOLDER_ID', folder.getId());
  return folder;
}

function notifyEmail_() {
  return PropertiesService.getScriptProperties().getProperty('NOTIFY_EMAIL') || Session.getEffectiveUser().getEmail();
}

/* ---------- helpers ---------- */

function clean_(v, max, multiline) {
  let s = String(v == null ? '' : v);
  s = multiline ? s.replace(/\r/g, '') : s.replace(/\s+/g, ' ');
  return s.trim().slice(0, max);
}

function fileUrl_(id) {
  return id ? 'https://drive.google.com/file/d/' + id + '/view' : '';
}

function iso_(d) {
  return d instanceof Date ? d.toISOString() : '';
}

function fmt_(d) {
  return d instanceof Date ? Utilities.formatDate(d, TZ, 'dd/MM/yyyy HH:mm') : String(d || '');
}

function money_(n) {
  return String(Math.round(Number(n))).replace(/\B(?=(\d{3})+(?!\d))/g, ',') + ' ₪';
}

function esc_(s) {
  return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

// lines are trusted HTML, callers escape user input with esc_()
function mailHtml_(head, lines, foot) {
  return '<div dir="rtl" style="font-family:Arial,sans-serif;font-size:15px;line-height:1.7;color:#20222A">' +
    '<p style="font-weight:bold;font-size:17px">' + head + '</p>' +
    lines.map(l => '<p style="margin:0">' + l + '</p>').join('') +
    '<p style="margin-top:18px">' + foot + '</p></div>';
}

/** מריצים פעם אחת מהעורך כדי ליצור את הגיליון והתיקייה ולאשר הרשאות. */
function setup() {
  sheet_();
  folder_();
  const pw = PropertiesService.getScriptProperties().getProperty('ADMIN_PASSWORD');
  console.log(pw ? 'מוכן. הסיסמה מוגדרת.' : 'חסר: להגדיר ADMIN_PASSWORD ב-Project Settings > Script Properties');
}
