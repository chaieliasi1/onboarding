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
// הסמל של הלוגו (PNG 240x159, רקע שקוף). המקור: logo/mark.svg
const LOGO_PNG = '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';

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
  G('אני מתחייב ללוות אתכם בגובה העיניים, ללא שיפוטיות, ולשמור על פרטיות המידע שתשתפו איתי. לאורך כל התהליך אייעץ, אכוון ואהיה זמין לשאלות, ויחד נבנה את הצעדים הנכונים לכם. היישום בבית ייעשה על ידכם וההחלטות הסופיות בידיכם, ואני אהיה לצידכם כדי לעזור לכם להתמיד.',
    'אני מתחייב ללוות אותך בגובה העיניים, ללא שיפוטיות, ולשמור על פרטיות המידע שתשתף איתי. לאורך כל התהליך אייעץ, אכוון ואהיה זמין לשאלות, ויחד נבנה את הצעדים הנכונים לך. היישום בבית ייעשה על ידך וההחלטות הסופיות בידיך, ואני אהיה לצידך כדי לעזור לך להתמיד.',
    'אני מתחייב ללוות אותך בגובה העיניים, ללא שיפוטיות, ולשמור על פרטיות המידע שתשתפי איתי. לאורך כל התהליך אייעץ, אכוון ואהיה זמין לשאלות, ויחד נבנה את הצעדים הנכונים לך. היישום בבית ייעשה על ידך וההחלטות הסופיות בידייך, ואני אהיה לצידך כדי לעזור לך להתמיד.'),
  'אם נצטרך לשנות מועד של פגישה, נעדכן זה את זה מוקדם ככל האפשר ונתאם מועד חדש.',
  'אם אחד הצדדים ירצה לסיים את הליווי טרם סיום התהליך, נחשב את התמורה עבור הפגישות והעבודה שבוצעו בפועל, והיתרה תוחזר בהתאם לדין.',
  'הליווי מתמקד בניהול כלכלת הבית ובתזרים המשפחתי. בנושאים שדורשים ייעוץ השקעות, ייעוץ פנסיוני, ייעוץ מס או ייעוץ משפטי, נפנה במידת הצורך לאיש מקצוע מתאים.',
  'פניות, שאלות והבהרות בין הפגישות יתקיימו בוואטסאפ בימים א׳–ה׳, בין השעות 10:00–18:00. אפשר לתאם מראש גם שיחת טלפון.'
];
const CONTRACT_AGREE = G('קראתי את ההסכמות ואני מאשר/ת אותן.',
  'קראתי את ההסכמות ואני מאשר אותן.',
  'קראתי את ההסכמות ואני מאשרת אותן.');

const PRIVACY_TITLE = 'פרטיות ושמירת המידע';
// shown up front; PRIVACY_POINTS sit behind a "read more" button (layered notice)
const PRIVACY_SUMMARY = 'המידע הכלכלי שבשאלון נמסר רק לחי אליאסי, לטובת תהליך הליווי בלבד, ונשמר עד חצי שנה אחרי סיום הליווי. אפשר לבקש לעיין בו, לתקן או למחוק אותו בכל שלב.';
const PRIVACY_POINTS = [
  'המידע בשאלון נמסר אך ורק לטובת תהליך הליווי הכלכלי של חי אליאסי.',
  G('מסירת המידע נעשית מרצונכם. בלי אישור לא ניתן לשלוח את השאלון.',
    'מסירת המידע נעשית מרצונך. בלי אישור לא ניתן לשלוח את השאלון.',
    'מסירת המידע נעשית מרצונך. בלי אישור לא ניתן לשלוח את השאלון.'),
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
    privacy: { title: PRIVACY_TITLE, summary: PRIVACY_SUMMARY, points: PRIVACY_POINTS.map(t => pick_(t, g)), agree: pick_(PRIVACY_AGREE, g) }
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
    if (!/^(auth|locked|no_password|bad_link|already_done|not_signed|invalid|busy|exists|not_found)$/.test(code)) console.error(err);
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
    default: return crmRoute_(req); // lead + crm_* in Crm.gs
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
        attachments: [contract.getBlob()],
        inlineImages: { logo: logoBlob_() }
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
      attachments: [contract.getBlob(), qPdf.getBlob()],
      inlineImages: { logo: logoBlob_() }
    });

  set_(f.sh, f.row, {
    status: 'done', questionnairePdfId: qPdf.getId(), consentAt: consentAt,
    completedAt: new Date(), answers: JSON.stringify(sections).slice(0, 45000)
  });
  crmOnboardDone_(String(req.token), {
    name: String(r.name), gender: gender_(r.gender), amount: Number(r.amount),
    email: String(r.email), phone: String(r.phone),
    contractUrl: fileUrl_(r.contractPdfId), questionnaireUrl: fileUrl_(qPdf.getId())
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
    img.getParent().asParagraph().setLeftToRight(false).setAlignment(ALIGN_RIGHT_);

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
    texts_(r.gender).privacy.points.forEach(t => para_(body, '• ' + t, { size: 10 }));
    para_(body, '☑ ' + pick_(PRIVACY_AGREE, r.gender), { bold: true, size: 10, before: 6 });
    para_(body, 'אושר על ידי ' + r.name + ' בתאריך ' + fmt_(consentAt), { size: 10, color: '#5A5D69' });
  });
}

function makePdf_(name, build) {
  const doc = DocumentApp.create(name);
  const body = doc.getBody();
  body.setMarginTop(48).setMarginBottom(48).setMarginLeft(56).setMarginRight(56);
  const logo = body.appendImage(logoBlob_()).setWidth(72).setHeight(48);
  logo.getParent().asParagraph().setLeftToRight(false).setAlignment(ALIGN_RIGHT_).setSpacingAfter(12);
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

// בפסקה מימין לשמאל, גוגל דוקס הופך את ההגדרה: LEFT = תחילת השורה = ימין. RIGHT יוצא שמאל.
const ALIGN_RIGHT_ = DocumentApp.HorizontalAlignment.LEFT;

function title_(body, text) {
  para_(body, text, { bold: true, size: 20, after: 2 });
}

function para_(body, text, o) {
  o = o || {};
  const p = body.appendParagraph(text);
  p.setLeftToRight(false)
    .setAlignment(ALIGN_RIGHT_)
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

function logoBlob_() {
  return Utilities.newBlob(Utilities.base64Decode(LOGO_PNG), 'image/png', 'logo.png');
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

// lines are trusted HTML, callers escape user input with esc_(). Callers pass inlineImages: { logo: logoBlob_() }
function mailHtml_(head, lines, foot) {
  return '<div dir="rtl" style="font-family:Arial,sans-serif;font-size:15px;line-height:1.7;color:#20222A">' +
    '<img src="cid:logo" width="72" height="48" alt="' + OWNER_NAME + '" style="display:block;margin-bottom:12px">' +
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
