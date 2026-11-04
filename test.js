// Çalıştır: node test.js
const A = require("./assistant.js"), fs = require("fs");
let pass = 0, fail = 0;
const st = {name:"",last:"",pending:null};
function t(name, q, re, o) { const r = A.reply(q, Object.assign({state: st}, o||{})); if (re.test(r)) pass++; else { fail++; console.log("FAIL:", name, "\n  q:", q, "\n  got:", r); } }
const now = new Date(2026, 10, 4, 9, 5);
t("toplama","2+2 kaç eder?",/^4$/);
t("öncelik","2+3*4",/^14$/);
t("parantez","(12+8)*3 kaç eder",/^60$/);
t("üs","2^10",/^1\.024$/);
t("kök","karekök 144",/^12$/);
t("kelime op","10 bölü 4",/^2,5$/);
t("artı","5 artı 7",/^12$/);
t("x çarpma","6 x 7",/^42$/);
t("ondalık","3,5*2",/^7$/);
t("faktöriyel","5!",/^120$/);
t("sıfıra bölme","1/0",/Sıfıra bölünemez/);
t("negatif kök","sqrt(-4)",/gerçek sayı değildir/);
t("sin","sin(30)",/^0,5/);
t("yüzde","200’ün yüzde 15’i",/= 30$/);
t("birim C","100 celsius kaç fahrenheit",/212 °F/);
t("birim km","10 km kaç mil",/6,21371 mil/);
t("asal evet","29 asal mı?",/asal bir sayıdır/);
t("asal hayır","28 asal mı",/asal değildir/);
t("saat","saat kaç",/09:05/,{now});
t("tarih","bugün günlerden ne",/4 Kasım 2026, Çarşamba/,{now});
t("zar","zar at",/🎲 [1-6]/);
t("başkent","Almanya’nın başkenti neresi?",/Berlin/);
t("takip","peki ya Japonya?",/Tokyo/);
t("başkent yok","Atlantis’in başkenti neresi?",/anlayamadım|bilgi tabanımda yok/);
t("ad kaydet","Benim adım ayşe",/Ayşe/);
t("ad hatırla","adım ne?",/Adın Ayşe/);
t("selam adlı","merhaba",/Merhaba Ayşe/);
t("kb atatürk","Atatürk kimdir?",/1881/);
t("kb ışık","ışık hızı nedir",/299\.792/);
t("kb pi","pi sayısı nedir",/3,14159/);
t("kb gezegen","kaç gezegen var",/8 gezegen/);
t("kb tek kelime öneri","dünya",/Tam emin olamadım/);
t("kb evet","evet",/Güneş ile|Dünya ile Güneş/);
t("bilmiyor","Türkiye’nin nüfusu kaç?",/Bunu bilmiyorum/);
t("bilmiyor2","dün borsa ne oldu?",/Bunu bilmiyorum/);
t("internet","internete bağlı mısın?",/bağlı değilim/);
t("kimsin","sen kimsin",/yapay zekâ modeli değilim/);
t("neler","neler biliyorsun",/Bilgi tabanı konuları/);
t("boş","   ",/Bir şey yazar mısın/);
t("txt dosya","", /3 satır.*kelime|En sık geçen kelimeler: merhaba/, {files:[{name:"a.txt",kind:"text",size:40,text:"merhaba dünya merhaba\nikinci satır\nüçüncü"}]});
t("json dosya","",/Geçerli JSON \(nesne, 2 anahtar\)/,{files:[{name:"a.json",kind:"text",size:10,text:'{"a":1,"b":2}'}]});
t("csv dosya","",/3 satır × 3 sütun/,{files:[{name:"a.csv",kind:"text",size:10,text:"a,b,c\n1,2,3\n4,5,6"}]});
t("resim","",/800×600 piksel.*yorumlayamam/,{files:[{name:"x.png",kind:"image",size:2048,width:800,height:600}]});
t("dosya+soru","2+2",/4$/,{files:[{name:"x.png",kind:"image",size:1,width:1,height:1}]});
t("dosya+bilinmeyen","bunu özetle",/^📷[^]*verebilirim\.$/,{files:[{name:"x.png",kind:"image",size:1,width:1,height:1}]});
t("binary","",/içeriğini okuyamıyorum/,{files:[{name:"a.pdf",kind:"binary",size:1000}]});
// Yasaklı bağlantı kalıntıları
const banned = /PROXY_URL|API_KEY|anthropic|x-api-key|api\.anthropic|ANTHROPIC|worker\.js/i;
fs.readdirSync(".").filter(f=>/\.(js|html|json|md|svg)$/.test(f)&&f!=="test.js").forEach(f=>{
  const s = fs.readFileSync(f,"utf8");
  if (banned.test(s)) { fail++; console.log("FAIL: yasaklı ifade:", f, s.match(banned)[0]); } else pass++;
});
// Dışarı ağ çağrısı yok
["index.html","assistant.js","knowledge.js"].forEach(f=>{
  if (/fetch\(|XMLHttpRequest|WebSocket|https?:\/\/(?!www\.w3\.org)/.test(fs.readFileSync(f,"utf8"))) { fail++; console.log("FAIL: ağ çağrısı:", f); } else pass++;
});
console.log(`${pass} geçti, ${fail} kaldı`);
process.exit(fail ? 1 : 0);
