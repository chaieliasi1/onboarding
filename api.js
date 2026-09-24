// כתובת ה-Web app של Apps Script (מסתיימת ב-/exec). ריק = מצב הדגמה מקומי.
window.ONBOARDING_API = 'https://script.google.com/macros/s/AKfycbylfirMmGbkhhPEhMBzkRdIOkWL8JPYSbm08Oij52B1HxBA0hFlm0Zry5kUpHQ-dVTlCA/exec';

(function () {
  const API = window.ONBOARDING_API;
  const MOCK = !API || new URLSearchParams(location.search).has('mock');

  const ERR = {
    auth: 'סיסמה שגויה.',
    locked: 'יותר מדי ניסיונות. אפשר לנסות שוב בעוד רבע שעה.',
    no_password: 'לא הוגדרה סיסמת ניהול (ראו SETUP.md).',
    bad_link: 'הקישור לא תקין. כדאי לבקש מחי קישור חדש.',
    already_done: 'הטופס כבר מולא. תודה!',
    not_signed: 'צריך לחתום קודם על ההסכמות.',
    invalid: 'חלק מהפרטים חסרים או לא תקינים.',
    network: 'בעיית תקשורת. בדקו את החיבור ונסו שוב.'
  };

  function fail(code) {
    const e = new Error(code);
    e.code = code;
    throw e;
  }

  async function call(action, data) {
    if (MOCK) return mock(action, data || {});
    let res;
    try {
      // text/plain keeps this a "simple" request, so Apps Script needs no CORS preflight
      const r = await fetch(API, { method: 'POST', body: JSON.stringify(Object.assign({ action }, data)) });
      res = await r.json();
    } catch (e) {
      fail('network');
    }
    if (!res.ok) fail(res.error);
    return res;
  }

  /* ---------- demo mode: fakes the backend in this browser ---------- */

  let mem = null;
  function db() {
    if (mem) return mem;
    try { mem = JSON.parse(localStorage.getItem('onb-mock') || '{}'); } catch (e) { mem = {}; }
    return mem;
  }
  function save() {
    try { localStorage.setItem('onb-mock', JSON.stringify(mem)); } catch (e) { /* memory only */ }
  }

  // reuse the real wording from Code.gs so the demo shows exactly what clients will see
  let texts;
  function loadTexts() {
    if (texts) return texts;
    texts = new Promise((ok, no) => {
      const s = document.createElement('script');
      s.src = 'apps-script/Code.gs';
      s.onload = () => ok(texts_); // texts_(gender) from Code.gs
      s.onerror = no;
      document.head.appendChild(s);
    });
    return texts;
  }

  async function mock(action, d) {
    await new Promise(r => setTimeout(r, 450));
    const all = db();
    const needPw = () => { if (d.password !== '1234') fail('auth'); };
    const rec = () => { const r = all[d.token]; if (!r) fail('bad_link'); return r; };
    switch (action) {
      case 'list':
        needPw();
        return {
          clients: Object.keys(all).map(t => Object.assign({}, all[t], {
            token: all[t].status === 'done' ? '' : t,
            contractUrl: all[t].status !== 'sent' ? '#demo' : '',
            questionnaireUrl: all[t].status === 'done' ? '#demo' : ''
          })).sort((a, b) => b.created.localeCompare(a.created))
        };
      case 'create': {
        needPw();
        const name = String(d.name || '').trim();
        const amount = Math.round(Number(d.amount));
        if (!name || !(amount > 0) || !['c', 'm', 'f'].includes(d.gender)) fail('invalid');
        const token = Array.from(crypto.getRandomValues(new Uint8Array(32)), b => b.toString(16).padStart(2, '0')).join('');
        all[token] = { name, amount, created: new Date().toISOString(), status: 'sent', email: '', phone: '', gender: d.gender };
        save();
        return { token };
      }
      case 'get': {
        const r = rec();
        if (r.status === 'done') return { status: 'done', name: r.name };
        const gender = r.gender || 'c';
        return Object.assign({ status: r.status, name: r.name, amount: r.amount, email: r.email, phone: r.phone, gender }, (await loadTexts())(gender));
      }
      case 'sign': {
        const r = rec();
        if (r.status === 'done') fail('already_done');
        if (!d.agree || !d.email || !d.signature) fail('invalid');
        Object.assign(r, { status: 'signed', email: d.email, phone: d.phone });
        save();
        console.log('[demo] signature PNG length', d.signature.length);
        return { status: 'signed' };
      }
      case 'submit': {
        const r = rec();
        if (r.status === 'done') fail('already_done');
        if (r.status !== 'signed') fail('not_signed');
        if (d.consent !== true) fail('invalid');
        r.status = 'done';
        save();
        console.log('[demo] questionnaire', d.sections);
        return { status: 'done' };
      }
    }
    fail('invalid');
  }

  function money(n) {
    return Math.round(Number(n)).toLocaleString('he-IL') + ' ₪';
  }

  window.Api = { call, MOCK, money, errText: c => ERR[c] || ERR.network };
})();
