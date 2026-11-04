# Zunex AI

Tarayıcıda **tamamen yerel** çalışan Türkçe asistan. API anahtarı, sunucu, abonelik veya internet bağlantısı gerekmez. Yazdıkların hiçbir yere gönderilmez.

## Dürüst bir not
Zunex AI büyük bir yapay zekâ modeli **değildir**. Kurallar, küçük bir bilgi tabanı ve bir hesap motoruyla çalışır. Bilmediği şeyi bilmediğini söyler; tahmin yürütmez. Fotoğrafların içeriğini göremez (yalnızca boyut bilgisini verir).

## Neler yapar
- Hesap: `(12+8)*3`, `karekök 144`, `2^10`, `7!`, `sin(30)`, `200’ün yüzde 15’i`, `10 bölü 4`
- Birim çevirme: °C↔°F, km↔mil, kg↔lb, m↔ft
- `29 asal mı?`, saat, tarih (cihaz saatine göre), zar, yazı-tura, rastgele sayı
- Ülke başkentleri ve “peki ya Japonya?” gibi takip soruları
- Bilgi tabanı: Atatürk, gezegenler, ışık hızı, DNA, HTML/CSS/JS/Python vb. (“Neler biliyorsun?” yaz)
- Hafıza: sohbet geçmişi ve adın tarayıcıda (localStorage) saklanır; “Sohbeti temizle” hepsini siler
- Dosya: .txt/.md/.csv/.json/kod dosyaları için satır, kelime, sık kelimeler, JSON/CSV yapısı; fotoğraf için boyut bilgisi

## GitHub Pages'te yayınlama
1. GitHub'da yeni bir depo aç (ör. `zunex-ai`).
2. Bu klasördeki **tüm dosyaları** deponun köküne yükle (`index.html`, `assistant.js`, `knowledge.js`, `manifest.json`, `sw.js`, `icon.svg`, `.nojekyll`).
3. Depoda **Settings → Pages → Build and deployment**: Source = *Deploy from a branch*, Branch = `main` ve `/ (root)` → Save.
4. Bir dakika sonra `https://KULLANICI.github.io/zunex-ai/` adresinde açılır. Tüm yollar göreli olduğu için alt klasör adresinde de çalışır.

Yerelde denemek: `index.html` dosyasını çift tıkla ya da `python3 -m http.server` çalıştır.

## Bilgi eklemek
`knowledge.js` içindeki `facts` listesine `{ t: "Başlık", k: ["!anahtar"], a: "Cevap" }` ekle. Anahtarlar küçük harf ve Türkçe karaktersiz yazılır (`ğ→g`, `ı→i`…). `!` önekli anahtar tek başına eşleşme sağlar.

## Test
`node test.js` (Node 16+) motoru ve dosyaları denetler: hesap, bilgi, dosya özeti, yasak ifade (API/proxy) ve ağ çağrısı kontrolleri.

## Android uygulaması (APK)
GitHub Pages'e yükledikten sonra https://www.pwabuilder.com adresine site adresini yaz ve Android paketini indir.
