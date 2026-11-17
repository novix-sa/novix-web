/* Medición del sitio: Google Analytics 4, Pixel de Meta y seguimiento de Clientify, con consentimiento de cookies.
   Se carga en el <head> de cada página, antes que el formulario de Clientify.

   - GA4 y el Pixel solo se cargan si la persona acepta las cookies (Google Consent Mode v2).
   - El seguimiento de Clientify (CRM) se carga siempre.
   - Al enviarse el formulario de Clientify se manda "generate_lead" a GA4 y "Lead" al Pixel.
   - En la vista previa local (localhost) no se envía nada a ningún servicio. */
(function () {
  var GA4_ID = 'G-7DR2VVSBJP';
  var META_PIXEL_ID = '';            // ← completar con el ID del Pixel de Meta (solo números) para activarlo
  var CLIENTIFY_CODE = 'CF-17491-17491-369HY';
  var FORMS = { es: '296635', en: '296644', pt: '296642' };
  var KEY = 'novix-cookies';         // 'aceptadas' | 'rechazadas'

  var w = window, d = document;
  var live = !/^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname) && location.protocol !== 'file:';
  // Modo prueba (solo vista previa): corre toda la lógica pero sin cargar ni enviar nada a Google, Meta ni Clientify.
  var prueba = false;
  try { prueba = !live && localStorage.getItem('novix-medicion-prueba') === '1'; } catch (e) {}
  if (prueba) live = true;
  w.NOVIX_TRACK = live;

  function lang() {
    var l = (new URLSearchParams(location.search).get('lang')) || d.documentElement.lang || 'es';
    return FORMS[l] ? l : 'es';
  }
  function stored() { try { return localStorage.getItem(KEY); } catch (e) { return null; } }
  function store(v) { try { localStorage.setItem(KEY, v); } catch (e) {} }

  /* ---------- Google Analytics 4 con Consent Mode v2 ---------- */
  w.dataLayer = w.dataLayer || [];
  function gtag() { w.dataLayer.push(arguments); }
  w.gtag = gtag;
  gtag('consent', 'default', {
    ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied',
    analytics_storage: 'denied', functionality_storage: 'granted', security_storage: 'granted',
    wait_for_update: 500
  });

  var gaLoaded = false, pixelLoaded = false, granted = false;
  var realAppend = Node.prototype.appendChild, realInsert = Node.prototype.insertBefore;

  function loadScript(src) {
    if (prueba) { (w.NOVIX_PRUEBA = w.NOVIX_PRUEBA || []).push(src); return; }
    var s = d.createElement('script'); s.async = true; s.src = src; s.setAttribute('data-novix', '1');
    realAppend.call(d.head, s);
  }

  function loadGA() {
    if (gaLoaded || !live) return;
    gaLoaded = true;
    gtag('js', new Date());
    gtag('config', GA4_ID);            // una sola page_view por visita
    loadScript('https://www.googletagmanager.com/gtag/js?id=' + GA4_ID);
  }

  /* ---------- Pixel de Meta ---------- */
  // Función propia: Clientify ve que fbq ya existe y no carga su copia del Pixel.
  var fbqQueue = [];
  function realFbq() { if (w._novixFbq) w._novixFbq.apply(w, arguments); else fbqQueue.push(arguments); }
  w.fbq = function (cmd, name) {
    // Clientify llama fbq('track','Form submitted') cuando el formulario se envía bien.
    if (cmd === 'track' && name === 'Form submitted') { onLead(); return; }
    if (cmd === 'init' || name === 'PageView' || name === 'Form appear') return; // ignorar el Pixel que configure Clientify
    if (granted && META_PIXEL_ID) realFbq.apply(null, arguments);
  };
  w.fbq.loaded = true; w.fbq.queue = []; w.fbq.push = w.fbq; w.fbq.version = '2.0';

  function loadPixel() {
    if (pixelLoaded || !live || !META_PIXEL_ID) return;
    pixelLoaded = true;
    // código base de Meta, con nombre propio para no chocar con la función de arriba
    var n = w._novixFbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments); };
    n.push = n; n.loaded = true; n.version = '2.0'; n.queue = [];
    if (!w._fbq) w._fbq = n;
    loadScript('https://connect.facebook.net/en_US/fbevents.js');
    n('init', META_PIXEL_ID);
    n('track', 'PageView');
    while (fbqQueue.length) n.apply(w, fbqQueue.shift());
  }

  /* ---------- Conversión: formulario enviado ---------- */
  var leadSent = false;
  function onLead() {
    if (leadSent) return; leadSent = true; setTimeout(function () { leadSent = false; }, 3000);
    var l = lang();
    gtag('event', 'generate_lead', { language: l, form_id: FORMS[l], page_location: location.href });
    if (granted && META_PIXEL_ID) realFbq('track', 'Lead', { language: l, form_id: FORMS[l] });
  }

  /* ---------- Evitar la segunda carga de gtag.js que agrega el formulario de Clientify ---------- */
  function blocked(node) {
    if (!node || node.nodeName !== 'SCRIPT' || node.getAttribute('data-novix')) return false;
    var src = node.getAttribute('src') || '';
    return /googletagmanager\.com\/gtag\/js(\?|$)/.test(src) || /connect\.facebook\.net\/.*\/fbevents\.js/.test(src);
  }
  Node.prototype.appendChild = function (node) { return blocked(node) ? node : realAppend.call(this, node); };
  Node.prototype.insertBefore = function (node, ref) { return blocked(node) ? node : realInsert.call(this, node, ref); };

  /* ---------- Consentimiento ---------- */
  function grant() {
    granted = true;
    gtag('consent', 'update', { ad_storage: 'granted', ad_user_data: 'granted', ad_personalization: 'granted', analytics_storage: 'granted' });
    loadGA();
    loadPixel();
  }
  if (stored() === 'aceptadas') grant();

  /* ---------- Seguimiento de Clientify (CRM) ---------- */
  if (live && typeof w.trackerCode === 'undefined') {
    (function (u, o) {
      w[o] = w[o] || function () { (w[o].q = w[o].q || []).push(arguments); };
      loadScript(u);
    })('https://analytics.clientify.net/tracker.js', 'ana');
    w.ana('setTrackerUrl', 'https://analytics.clientify.net');
    w.ana('setTrackingCode', CLIENTIFY_CODE);
    w.ana('trackPageview');
  }

  /* ---------- Banner de cookies ---------- */
  var TXT = {
    es: { msg: 'Usamos cookies propias y de terceros (Google Analytics y Meta) para medir las visitas y mejorar el sitio. Solo las activamos si nos das tu permiso.',
          ok: 'Aceptar', no: 'Rechazar', pol: 'Política de privacidad', label: 'Aviso de cookies', pref: 'Configurar cookies' },
    en: { msg: 'We use our own and third-party cookies (Google Analytics and Meta) to measure visits and improve the site. We only turn them on with your permission.',
          ok: 'Accept', no: 'Decline', pol: 'Privacy policy', label: 'Cookie notice', pref: 'Cookie settings' },
    pt: { msg: 'Usamos cookies próprios e de terceiros (Google Analytics e Meta) para medir as visitas e melhorar o site. Só os ativamos com a sua permissão.',
          ok: 'Aceitar', no: 'Recusar', pol: 'Política de privacidade', label: 'Aviso de cookies', pref: 'Configurar cookies' }
  };

  function banner() {
    var old = d.getElementById('cookie-banner'); if (old) old.remove();
    var t = TXT[lang()];
    var b = d.createElement('div');
    b.id = 'cookie-banner'; b.setAttribute('role', 'dialog'); b.setAttribute('aria-live', 'polite'); b.setAttribute('aria-label', t.label);
    b.innerHTML = '<div class="cb-in"><p class="cb-txt"></p><div class="cb-btns">' +
      '<button type="button" class="btn btn-line cb-no"></button><button type="button" class="btn btn-navy cb-ok"></button></div></div>';
    b.querySelector('.cb-txt').textContent = t.msg;
    // enlace a la política de privacidad, solo si el pie apunta a una página real (hoy es un "#" provisorio)
    var pol = d.querySelector('footer a[data-privacidad]');
    if (pol && !/#$/.test(pol.getAttribute('href'))) {
      var a = d.createElement('a'); a.href = pol.getAttribute('href'); a.className = 'cb-pol'; a.textContent = t.pol;
      b.querySelector('.cb-txt').appendChild(d.createTextNode(' '));
      b.querySelector('.cb-txt').appendChild(a);
    }
    b.querySelector('.cb-ok').textContent = t.ok;
    b.querySelector('.cb-no').textContent = t.no;
    b.querySelector('.cb-ok').onclick = function () { store('aceptadas'); b.remove(); grant(); };
    b.querySelector('.cb-no').onclick = function () { store('rechazadas'); b.remove(); if (granted) location.reload(); };
    d.body.appendChild(b);
  }

  function prefsLink() {
    // enlace en el pie para volver a elegir
    var legal = d.querySelector('footer a[data-privacidad]');
    if (!legal || d.getElementById('cookie-prefs')) return;
    var a = d.createElement('a'); a.href = '#'; a.id = 'cookie-prefs'; a.textContent = TXT[lang()].pref;
    a.onclick = function (e) { e.preventDefault(); banner(); };
    legal.parentNode.insertBefore(d.createTextNode(' · '), legal.nextSibling);
    legal.parentNode.insertBefore(a, legal.nextSibling.nextSibling);
  }

  var css = '#cookie-banner{position:fixed;left:16px;right:16px;bottom:16px;z-index:90;background:var(--white,#fff);color:var(--ink,#1D1D1B);' +
    'border:1px solid var(--line,#DCDDDF);border-top:2px solid var(--navy,#005B9D);box-shadow:0 24px 50px -24px rgba(29,29,27,.35);max-width:1100px;margin:0 auto;}' +
    '#cookie-banner .cb-in{display:flex;align-items:center;gap:28px;padding:20px 24px;}' +
    '#cookie-banner .cb-txt{flex:1;margin:0;font-size:14.5px;line-height:1.55;color:var(--gray,#5F6062);}' +
    '#cookie-banner .cb-pol{color:var(--navy,#005B9D);text-decoration:underline;text-underline-offset:3px;white-space:nowrap;}' +
    '#cookie-banner .cb-btns{display:flex;gap:10px;flex-shrink:0;}' +
    '#cookie-banner .btn{margin:0;}' +
    '@media (max-width:720px){#cookie-banner .cb-in{flex-direction:column;align-items:stretch;gap:16px;padding:18px;}#cookie-banner .cb-btns .btn{flex:1;justify-content:center;}}';

  function start() {
    var st = d.createElement('style'); st.textContent = css; d.head.appendChild(st);
    prefsLink();
    var v = stored();
    if (v !== 'aceptadas' && v !== 'rechazadas') banner();
  }
  if (d.readyState === 'loading') d.addEventListener('DOMContentLoaded', start); else start();

  w.novixCookies = { banner: banner, aceptadas: function () { return granted; } };
})();
