/* Traducción del sitio (ES → EN / PT).
   Los textos traducidos están en assets/js/i18n-data.js: window.NOVIX_I18N = {en:{"texto en español":"traducción"}, pt:{...}}.
   - El idioma sale de ?lang=en|pt; si no está, del último idioma elegido (se recuerda en el navegador).
   - Se carga en el <head> de cada página, antes del contenido. */
(function () {
  var LANGS = ['es', 'en', 'pt'];
  var KEY = 'novix-lang';

  function stored() { try { return localStorage.getItem(KEY); } catch (e) { return null; } }
  function store(l) { try { localStorage.setItem(KEY, l); } catch (e) {} }

  // 1. Elegir idioma y dejarlo en la dirección, para que el resto de la página (formulario, blog, botones) lo vea.
  var qs = new URLSearchParams(location.search);
  var lang = qs.get('lang');
  if (LANGS.indexOf(lang) < 0) {
    lang = stored();
    if (LANGS.indexOf(lang) < 0) lang = 'es';
    if (lang !== 'es') {
      qs.set('lang', lang);
      try { history.replaceState(history.state, '', location.pathname + '?' + qs.toString() + location.hash); } catch (e) {}
    }
  }
  store(lang);
  document.documentElement.lang = lang;

  // Mientras se traduce, ocultar la página para que no se vea en español un instante.
  if (lang !== 'es') {
    var hide = document.createElement('style');
    hide.id = 'i18n-hide';
    hide.textContent = 'body{visibility:hidden}';
    document.head.appendChild(hide);
    setTimeout(reveal, 1500); // por las dudas, nunca dejar la página oculta
  }
  function reveal() { var h = document.getElementById('i18n-hide'); if (h) h.remove(); }

  var ATTRS = ['alt', 'aria-label', 'placeholder', 'title'];
  var SKIP = { SCRIPT: 1, STYLE: 1, NOSCRIPT: 1, TEXTAREA: 1 };
  var original = new WeakMap(); // nodo de texto → texto original en español

  function norm(s) { return s.replace(/\s+/g, ' ').trim(); }
  function dict() { return (window.NOVIX_I18N || {})[lang] || null; }

  function trText(node, d) {
    var src = original.has(node) ? original.get(node) : node.data;
    var key = norm(src);
    if (!key) return;
    var t = d ? d[key] : null;
    if (t == null) { if (original.has(node) && node.data !== src) node.data = src; return; }
    if (!original.has(node)) original.set(node, src);
    var lead = src.match(/^\s*/)[0], trail = src.match(/\s*$/)[0];
    var out = lead + t + trail;
    if (node.data !== out) node.data = out;
  }

  function trAttrs(el, d) {
    for (var i = 0; i < ATTRS.length; i++) {
      var a = ATTRS[i];
      if (!el.hasAttribute(a)) continue;
      var orig = el.getAttribute('data-es-' + a);
      if (orig == null) orig = el.getAttribute(a);
      var t = d ? d[norm(orig)] : null;
      if (t == null) {
        if (el.hasAttribute('data-es-' + a)) el.setAttribute(a, orig);
        continue;
      }
      if (!el.hasAttribute('data-es-' + a)) el.setAttribute('data-es-' + a, orig);
      el.setAttribute(a, t);
    }
  }

  function walk(root, d) {
    if (root.nodeType === 3) { if (!(root.parentNode && SKIP[root.parentNode.nodeName])) trText(root, d); return; }
    if (root.nodeType !== 1 && root.nodeType !== 11) return;
    if (root.nodeType === 1) {
      if (SKIP[root.nodeName]) return;
      trAttrs(root, d);
      if (root.nodeName === 'TEMPLATE') { walk(root.content, d); return; }
    }
    for (var c = root.firstChild; c; c = c.nextSibling) walk(c, d);
  }

  var titleOrig = null, descOrig = null;
  function apply() {
    var d = lang === 'es' ? null : dict();
    if (titleOrig == null) titleOrig = document.title;
    var tt = d ? d[norm(titleOrig)] : null;
    document.title = tt != null ? tt : titleOrig;
    var md = document.querySelector('meta[name="description"]');
    if (md) {
      if (descOrig == null) descOrig = md.getAttribute('content') || '';
      var dt = d ? d[norm(descOrig)] : null;
      md.setAttribute('content', dt != null ? dt : descOrig);
    }
    walk(document.body, d);
  }

  function setLang(l) {
    if (LANGS.indexOf(l) < 0) return;
    lang = l; store(l); document.documentElement.lang = l;
    apply();
  }

  // Recordar el idioma cuando se toca ES / EN / PT (la página después recarga o, en el blog, se redibuja).
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('.lang button');
    if (!b) return;
    var l = b.textContent.trim().toLowerCase();
    if (LANGS.indexOf(l) < 0) return;
    store(l);
    setTimeout(function () { setLang(l); }, 0);
  }, true);

  // Mantener el idioma en los enlaces internos (por si el navegador no recuerda la elección).
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href]');
    if (!a || lang === 'es') return;
    var href = a.getAttribute('href');
    if (!/^[a-z0-9-]+\.html(\?[^#]*)?(#.*)?$/i.test(href) || /[?&]lang=/.test(href)) return;
    var hash = '', i = href.indexOf('#');
    if (i >= 0) { hash = href.slice(i); href = href.slice(0, i); }
    a.setAttribute('href', href + (href.indexOf('?') >= 0 ? '&' : '?') + 'lang=' + lang + hash);
  }, true);

  function start() {
    apply();
    reveal();
    // Traducir también lo que la página agrega después (carrusel, historias, blog).
    new MutationObserver(function (ms) {
      if (lang === 'es') return;
      var d = dict();
      for (var i = 0; i < ms.length; i++)
        for (var j = 0; j < ms[i].addedNodes.length; j++) walk(ms[i].addedNodes[j], d);
    }).observe(document.body, { childList: true, subtree: true });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();

  window.novixSetLang = setLang;
})();
