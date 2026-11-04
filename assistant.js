(function (root, factory) {
  var KB = typeof module === "object" && module.exports ? require("./knowledge.js") : root.ZunexKB;
  var api = factory(KB);
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.ZunexAssistant = api;
})(typeof self !== "undefined" ? self : this, function (KB) {
  "use strict";

  function norm(s) {
    return String(s).replace(/İ/g, "i").replace(/I/g, "ı").toLowerCase()
      .replace(/ı/g, "i").replace(/ş/g, "s").replace(/ğ/g, "g").replace(/ü/g, "u")
      .replace(/ö/g, "o").replace(/ç/g, "c").replace(/â/g, "a").replace(/î/g, "i").replace(/û/g, "u");
  }
  function toks(s) { var n = norm(s).replace(/[^a-z0-9]+/g, " ").trim(); return n ? n.split(" ") : []; }
  function joined(s) { return toks(s).join(" "); }
  function cap(w) { return w.charAt(0).toLocaleUpperCase("tr-TR") + w.slice(1).toLocaleLowerCase("tr-TR"); }
  function fmt(n) {
    var s = String(+n.toPrecision(12));
    if (/e/.test(s)) return s.replace(".", ",");
    var p = s.split("."), i = p[0].replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    return p[1] ? i + "," + p[1] : i;
  }
  function num(s) { return parseFloat(String(s).replace(",", ".")); }
  var DAYS = ["Pazar", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"];
  var MONTHS = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
  function pad(n) { return (n < 10 ? "0" : "") + n; }

  /* ---------- Matematik ---------- */
  var FN = {
    sqrt: function (x) { if (x < 0) throw { math: "Negatif bir sayının karekökü gerçek sayı değildir." }; return Math.sqrt(x); },
    abs: Math.abs,
    sin: function (x) { return Math.round(Math.sin(x * Math.PI / 180) * 1e12) / 1e12; },
    cos: function (x) { return Math.round(Math.cos(x * Math.PI / 180) * 1e12) / 1e12; },
    tan: function (x) { return Math.round(Math.tan(x * Math.PI / 180) * 1e12) / 1e12; },
    log: function (x) { if (x <= 0) throw { math: "Logaritma yalnızca pozitif sayılar için tanımlıdır." }; return Math.log10(x); },
    ln: function (x) { if (x <= 0) throw { math: "Logaritma yalnızca pozitif sayılar için tanımlıdır." }; return Math.log(x); }
  };
  function fact(n) {
    if (n < 0 || n !== Math.floor(n) || n > 170) throw { math: "Faktöriyel için 0–170 arası bir tam sayı gerekir." };
    var r = 1; for (var i = 2; i <= n; i++) r *= i; return r;
  }
  function mathText(t) {
    var s = norm(t).replace(/(\d),(\d)/g, "$1.$2").replace(/[=?]/g, " ").replace(/(\d)\s*x\s*(\d)/g, "$1*$2");
    s = s.replace(/\barti\b/g, "+").replace(/\beksi\b/g, "-").replace(/\b(carpi|kere)\b/g, "*").replace(/\bbolu\b/g, "/")
      .replace(/\buzeri\b/g, "^").replace(/\bmod\b/g, "%").replace(/\b(karekok|kok)\b/g, "sqrt");
    return s.replace(/\b(kac eder|kac yapar|kactir|kac|eder|yapar|hesapla|hesaplar misin|hesap|sonucu|sonuc|nedir|ne kadar|bul|islem|lutfen|bana)\b/g, " ").trim();
  }
  // null: matematik ifadesi değil. {text}: sonuç. Hesap hatası: {text: hata mesajı}
  function evalMath(src) {
    var s = mathText(src), tk = [], pos = 0, m, re = /\s*(\d+(?:\.\d+)?|[a-z]+|[-+*\/^%()!])/y;
    if (!s) return null;
    while (pos < s.length) {
      re.lastIndex = pos; m = re.exec(s);
      if (!m) { if (/^\s*$/.test(s.slice(pos))) break; return null; }
      tk.push(m[1]); pos = re.lastIndex;
    }
    var okId = { pi: 1, e: 1, sqrt: 1, abs: 1, sin: 1, cos: 1, tan: 1, log: 1, ln: 1 };
    for (var i = 0; i < tk.length; i++) if (/^[a-z]+$/.test(tk[i]) && !okId[tk[i]]) return null;
    var hasVal = tk.some(function (x) { return /^\d/.test(x) || x === "pi" || x === "e"; });
    var hasOp = tk.some(function (x) { return /^[-+*\/^%!]$/.test(x) || FN[x]; });
    if (!hasVal || !hasOp) return null;
    var p = 0, SYN = { syn: 1 };
    function peek() { return tk[p]; }
    function next() { return tk[p++]; }
    function expr() { var v = term(); while (peek() === "+" || peek() === "-") { var o = next(), r = term(); v = o === "+" ? v + r : v - r; } return v; }
    function term() {
      var v = unary();
      while (peek() === "*" || peek() === "/" || peek() === "%") {
        var o = next(), r = unary();
        if (o === "*") v *= r; else { if (r === 0) throw { math: "Sıfıra bölünemez." }; v = o === "/" ? v / r : v % r; }
      }
      return v;
    }
    function unary() { if (peek() === "-") { next(); return -unary(); } if (peek() === "+") { next(); return unary(); } return pow(); }
    function pow() { var b = post(); if (peek() === "^") { next(); return Math.pow(b, unary()); } return b; }
    function post() { var v = atom(); while (peek() === "!") { next(); v = fact(v); } return v; }
    function atom() {
      var t = next();
      if (t === undefined) throw SYN;
      if (/^\d/.test(t)) return parseFloat(t);
      if (t === "(") { var v = expr(); if (next() !== ")") throw SYN; return v; }
      if (t === "pi") return Math.PI;
      if (t === "e") return Math.E;
      if (FN[t]) {
        var a;
        if (peek() === "(") { next(); a = expr(); if (next() !== ")") throw SYN; } else a = unary();
        return FN[t](a);
      }
      throw SYN;
    }
    try {
      var v = expr();
      if (p < tk.length) return null;
      if (!isFinite(v)) return { text: "Sonuç çok büyük ya da tanımsız." };
      var hasTrig = /\b(sin|cos|tan)\b/.test(s);
      return { text: fmt(v) + (hasTrig ? "  (açılar derece cinsinden)" : "") };
    } catch (e) {
      if (e && e.math) return { text: e.math };
      return null;
    }
  }

  var UNITS = { celsius: "c", santigrat: "c", fahrenheit: "f", km: "km", kilometre: "km", mil: "mi", mile: "mi", kg: "kg", kilo: "kg", kilogram: "kg", lb: "lb", pound: "lb", libre: "lb", metre: "m", m: "m", ft: "ft", feet: "ft", ayak: "ft" };
  var CONV = {
    "c>f": function (v) { return v * 9 / 5 + 32; }, "f>c": function (v) { return (v - 32) * 5 / 9; },
    "km>mi": function (v) { return v * 0.621371; }, "mi>km": function (v) { return v * 1.609344; },
    "kg>lb": function (v) { return v * 2.2046226; }, "lb>kg": function (v) { return v * 0.45359237; },
    "m>ft": function (v) { return v * 3.280839895; }, "ft>m": function (v) { return v * 0.3048; }
  };
  var UNAME = { c: "°C", f: "°F", km: "km", mi: "mil", kg: "kg", lb: "lb", m: "m", ft: "ft" };
  function unitConvert(t) {
    var n = norm(t), nm = n.match(/-?\d+(?:[.,]\d+)?/);
    if (!nm) return null;
    var u = toks(t).filter(function (x) { return UNITS[x]; }).map(function (x) { return UNITS[x]; });
    if (u.length < 2 || u[0] === u[1] || !CONV[u[0] + ">" + u[1]]) return null;
    var v = num(nm[0]);
    return fmt(v) + " " + UNAME[u[0]] + " = " + fmt(CONV[u[0] + ">" + u[1]](v)) + " " + UNAME[u[1]];
  }
  function percent(t) {
    var m = norm(t).match(/(\d+(?:[.,]\d+)?)\W*[a-z]{0,4}\s+yuzde\s+(\d+(?:[.,]\d+)?)/);
    if (!m) return null;
    var a = num(m[1]), b = num(m[2]);
    return fmt(a) + " sayısının %" + fmt(b) + "’i = " + fmt(a * b / 100);
  }
  function primeCheck(t) {
    var m = norm(t).match(/(\d+)\s*(?:sayisi\s*)?asal\s*(?:mi|midir)/);
    if (!m) return null;
    var n = parseInt(m[1], 10);
    if (n > 1e12) return "Bu kadar büyük sayılara bakamıyorum (en fazla 1 trilyon).";
    if (n < 2) return n + " asal değildir (asal sayılar 2’den başlar).";
    for (var d = 2; d * d <= n; d++) if (n % d === 0) return n + " asal değildir; " + d + " ile bölünür.";
    return n + " asal bir sayıdır.";
  }

  /* ---------- Bilgi tabanı ---------- */
  function findCountry(t) {
    var tn = " " + joined(t) + " ", keys = Object.keys(KB.capitals).sort(function (a, b) { return b.length - a.length; });
    for (var i = 0; i < keys.length; i++) if (tn.indexOf(" " + keys[i]) >= 0) return KB.capitals[keys[i]];
    return null;
  }
  function matchFact(t) {
    var tk = toks(t), n = " " + tk.join(" ") + " ", best = null, bs = 0;
    KB.facts.forEach(function (f) {
      var s = 0;
      f.k.forEach(function (k) {
        var w = 1; if (k.charAt(0) === "!") { w = 2; k = k.slice(1); }
        var hit = k.indexOf(" ") >= 0 ? n.indexOf(" " + k) >= 0
          : tk.some(function (x) { return k.length <= 3 ? x === k : x.indexOf(k) === 0; });
        if (hit) s += w;
      });
      if (s > bs) { bs = s; best = f; }
    });
    return { f: best, s: bs };
  }

  /* ---------- Dosyalar ---------- */
  var STOP = "bir bu ve ile icin gibi daha cok olan olarak kadar sonra ancak fakat ama the and for that with this from have are".split(" ");
  function summarizeFile(f) {
    var kb = (f.size / 1024).toFixed(1).replace(".", ",") + " KB";
    if (f.kind === "image") return "📷 " + f.name + ": görüntü dosyası" + (f.width ? ", " + f.width + "×" + f.height + " piksel" : "") + ", " + kb + ". Fotoğrafın içeriğini yorumlayamam: görüntü tanıyan bir modelim yok, yalnızca boyut bilgisini verebilirim.";
    if (f.kind !== "text") return "📦 " + f.name + ": " + kb + ". Bu dosya türünün içeriğini okuyamıyorum.";
    var t = f.text || "", lines = t.split(/\r?\n/), ne = lines.filter(function (l) { return l.trim(); });
    var words = (t.match(/\S+/g) || []).length;
    var out = "📄 " + f.name + ": " + lines.length + " satır (" + ne.length + " dolu), " + words + " kelime, " + t.length + " karakter, " + kb + ".";
    if (f.truncated) out += " (Yalnızca ilk 30.000 karakter okundu.)";
    if (/\.json$/i.test(f.name)) {
      try { var j = JSON.parse(t); out += " Geçerli JSON (" + (Array.isArray(j) ? "dizi, " + j.length + " öğe" : typeof j === "object" && j ? "nesne, " + Object.keys(j).length + " anahtar" : "değer") + ")."; }
      catch (e) { out += " JSON olarak okunamadı."; }
    }
    if (/\.csv$/i.test(f.name)) out += " Tahmini tablo: " + ne.length + " satır × " + (ne[0] || "").split(/[;,\t]/).length + " sütun.";
    var freq = {}; toks(t).forEach(function (w) { if (w.length >= 4 && STOP.indexOf(w) < 0) freq[w] = (freq[w] || 0) + 1; });
    var top = Object.keys(freq).sort(function (a, b) { return freq[b] - freq[a] || (a < b ? -1 : 1); }).slice(0, 5);
    if (top.length) out += "\nEn sık geçen kelimeler: " + top.map(function (w) { return w + " (" + freq[w] + ")"; }).join(", ") + ".";
    if (ne.length) out += "\nİlk satırlar:\n" + ne.slice(0, 2).map(function (l) { return "› " + (l.length > 80 ? l.slice(0, 80) + "…" : l); }).join("\n");
    return out;
  }

  /* ---------- Yönlendirme ---------- */
  var UNKNOWN = "Bunu bilmiyorum. Ben internete bağlı olmayan, sınırlı bir yerel bilgi tabanıyla çalışan bir asistanım; tahmin yürütüp yanlış bilgi vermek istemem.\n\nŞunlarda yardımcı olabilirim: hesaplamalar, birim çevirme, saat ve tarih, ülke başkentleri, bilim–tarih–programlamadan temel bilgiler ve dosya istatistikleri. “Neler biliyorsun?” yazarak konu listesini görebilirsin.";
  var YES = /^(evet|olur|tamam|aynen|dogru|he|evet o)$/;

  function route(t, st, now) {
    var n = joined(t), r;
    function ok(x, last) { st.last = last || ""; st.pending = null; return { text: x, known: true }; }

    if (st.pending && YES.test(n)) { var f = st.pending; return ok(f.a); }
    st.pending = null;

    // Ad hafızası
    if (/\b(adim ne|adimi biliyor musun|ben kimim|adimi hatirl)/.test(n)) return ok(st.name ? "Adın " + st.name + "." : "Henüz adını bilmiyorum. “Adım …” yazarsan hatırlarım.");
    var nm = t.match(/(?:benim\s+)?(?:adım|adim|ismim)\s+([^\s.,!?;:]+)/i);
    if (nm && !/^(ne|neydi|nedir|ne\?)$/i.test(nm[1])) { st.name = cap(nm[1]); return ok("Memnun oldum " + st.name + "! Adını bu cihazda hatırlayacağım."); }

    // Sohbet
    if (/(sen kimsin|^kimsin|adin ne|ismin ne|nesin|kendini tanit|yapay zeka misin|gercek misin|insan misin)/.test(n))
      return ok("Ben Zunex AI’ım: tarayıcında yerel çalışan bir asistanım. Büyük bir yapay zekâ modeli değilim; yerleşik bilgi tabanı, hesap makinesi ve kurallarla cevap veririm. Bilmediğim şeyi bilmediğimi söylerim.");
    if (/internet/.test(n) && /(bagli|var mi|baglan|online|calis)/.test(n)) return ok("Hayır, internete bağlı değilim. Her şey senin tarayıcında, yerel olarak çalışır; yazdıkların hiçbir sunucuya gönderilmez.");
    if (/(neler yapabilirsin|ne yapabilirsin|yardim|neler biliyorsun|ne biliyorsun|konular|nasil kullan)/.test(n))
      return ok("Şunları yapabilirim:\n• Hesap: “(12+8)*3”, “karekök 144”, “200’ün yüzde 15’i”, “7!”\n• Birim: “100 celsius kaç fahrenheit”, “10 km kaç mil”\n• “29 asal mı?”, saat, tarih, zar, yazı-tura\n• Ülke başkentleri (“Fransa’nın başkenti?”)\n• Dosya: .txt/.csv/.json gönder, istatistiklerini çıkarayım\n\nBilgi tabanı konuları: " + KB.facts.map(function (x) { return x.t; }).join(", ") + ".");
    if (/(hatirliyor musun|hafiza|unutur musun|konustuklarimizi)/.test(n)) return ok("Evet, sohbet geçmişin bu tarayıcıda kayıtlı ve adını da hatırlarım. “Sohbeti temizle” ile hepsi silinir.");
    if (/^(tesekkur|tesekkurler|sag ol|eyvallah|saol|cok sag ol)/.test(n)) return ok("Rica ederim! Başka bir şey lazım olursa buradayım.");
    if (/^(gorusuruz|hosca kal|bye|bay bay|iyi gunler dilerim)/.test(n)) return ok("Görüşmek üzere!");
    if (/^(merhaba|selam|selamlar|hey|alo|gunaydin|iyi gunler|iyi aksamlar|iyi geceler|naber|ne haber|nasilsin|nasil gidiyor)/.test(n)) {
      var who = st.name ? " " + st.name : "";
      if (/nasil|naber|haber/.test(n)) return ok("İyiyim" + who + ", teşekkürler! (Bir programım ama sorduğun için sağ ol.) Sana nasıl yardımcı olabilirim?");
      return ok("Merhaba" + who + "! Ben Zunex AI. Hesaplama, bilgi soruları ve dosya istatistikleri konusunda yardımcı olabilirim.");
    }

    // Saat, tarih, rastgele
    if (/saat kac|saati soyle|su an saat/.test(n)) return ok("Şu an saat " + pad(now.getHours()) + ":" + pad(now.getMinutes()) + " (cihazının saatine göre).");
    if (/(bugun.*(gun|tarih)|tarih ne|gunlerden ne|hangi gun|bugunun tarihi|ayin kaci|hangi yil)/.test(n))
      return ok("Bugün " + now.getDate() + " " + MONTHS[now.getMonth()] + " " + now.getFullYear() + ", " + DAYS[now.getDay()] + " (cihazının tarihine göre).");
    if (/zar at/.test(n)) return ok("🎲 " + (Math.floor(Math.random() * 6) + 1));
    if (/yazi tura/.test(n)) return ok(Math.random() < 0.5 ? "Yazı" : "Tura");
    if (/rastgele sayi/.test(n)) {
      var ns = (n.match(/\d+/g) || []).map(Number), lo = 1, hi = 100;
      if (ns.length >= 2) { lo = Math.min(ns[0], ns[1]); hi = Math.max(ns[0], ns[1]); }
      return ok(String(lo + Math.floor(Math.random() * (hi - lo + 1))));
    }

    // Hesap
    if ((r = primeCheck(t))) return ok(r);
    if ((r = percent(t))) return ok(r);
    if ((r = unitConvert(t))) return ok(r);
    var mr = evalMath(t);
    if (mr) return ok(mr.text);

    // Başkent (+ “peki ya …?” takibi)
    var asksCap = /baskent/.test(n) || (st.last === "capital" && /^(peki|ya|bir de|peki ya)\b/.test(n));
    if (asksCap) {
      var c = findCountry(t);
      if (c) return ok(c[0] + " için başkent: " + c[1] + ".", "capital");
      return ok("Hangi ülkeyi sorduğunu anlayamadım ya da o ülke bilgi tabanımda yok.", "capital");
    }

    // Bilgi tabanı
    var m = matchFact(t);
    if (m.f && m.s >= 2) return ok(m.f.a);
    if (m.f && m.s === 1) { st.pending = m.f; st.last = ""; return { text: "Tam emin olamadım. Şunu mu kastettin: “" + m.f.t + "”? “Evet” dersen cevaplarım.", known: true }; }

    st.last = "";
    return { text: UNKNOWN, known: false };
  }

  function reply(text, opts) {
    opts = opts || {};
    var st = opts.state || (opts.state = {}), files = opts.files || [], t = String(text || "").trim(), parts = [];
    if (st.name === undefined) st.name = "";
    if (files.length) parts.push(files.map(summarizeFile).join("\n\n"));
    if (t) { var r = route(t, st, opts.now || new Date()); if (r.known || !files.length) parts.push(r.text); }
    else if (!files.length) parts.push("Bir şey yazar mısın?");
    return parts.join("\n\n");
  }

  return { reply: reply, evalMath: evalMath, norm: norm };
});
