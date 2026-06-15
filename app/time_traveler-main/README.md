# 🕰️ Zaman Gezgini: Antik Kod Çözücü

Fiziksel-dijital hibrit tarih oyunu (8-14 yaş). Çocuklar 4 rotary encoder'ı
döndürerek ekrandaki sembolleri hizalar; doğru kombinasyonda solenoid kilit
açılır ve dönemin hikâyesi ekranda canlanır. STM32 + Electron.js.

## Çalıştırma

```bash
npm install
npm start
```

| Komut | Ne açar |
|---|---|
| `npm start` | Oyun (mock modda — klavye simülasyonu) |
| `npm start -- --kiosk` | Tam ekran kiosk modu |
| `npm start -- --port=COM5` | STM32'yi belirtilen porttan bağla |
| `npm start -- --page=tests/demo.html` | Animasyon demo/test sayfası |
| `npm start -- --page=tests/ses-demo.html` | Ses stüdyosu (karakter sesleri, müzik, efekt paneli) |

## Klavye simülasyonu (STM32 olmadan test)

`1–4` encoder seç (karakter ipucunu anlatır) · `←/→` pozisyon değiştir ·
`SPACE` şifreyi dene · `ENTER` diyaloğu hızlandır/ilerle · `R` bölümü sıfırla ·
`N` sonraki bölüm (test) · `M` ses · `H` yardım

## STM32 entegrasyonu (USB CDC / Virtual COM Port)

Firmware: [firmware/main.c](firmware/main.c) — protokol PC tarafıyla birebir uyumludur:

1. **STM32 → PC:** ~60 Hz sürekli akış, satır başına 4 ham sayaç:
   `"12,3,19,0\n"` (0–19 dairesel; 20 adım/tur, **5 adım = 1 sembol**).
   PC tarafı sayaçları pozisyona (0–3) çevirir ve yalnız *değişimleri* oyuna iletir
   ([src/serial-parser.js](src/serial-parser.js), birim testli).
2. **PC → STM32:** `OPEN\n` (solenoid aç — şifre çözülünce otomatik),
   `CLOSE\n` (yeni bölümde otomatik), `RESET\n` (sayaçları sıfırla).
3. Uygulama ST VID'li (0483) portu otomatik bulur ya da `--port=COMx` ile verilir.
4. Donanım modunda Space gerekmez: pozisyonlar doğru dizilime oturunca oyun
   otomatik kontrol eder. Güvence: bölüm başından beri en az bir fiziksel hamle
   yapılmadan kilit açılmaz (fiziksel reset = hepsi 0 = Göktürk şifresi durumuna karşı).
5. Port yoksa uygulama kendiliğinden mock moda düşer (sağ altta durum göstergesi).

**Donanım test konsolu:** `npm start -- --page=tests/encoder-test.html`
— ham sayaçlar, pozisyonlar, dönüş yönü, akış hızı, olay günlüğü ve
OPEN/CLOSE/RESET test butonları. Kablolamayı oyuna girmeden burada doğrulayın.

Doğru şifreler ve encoder-sembol eşleşmesi: [config/symbols.json](config/symbols.json)
(Bölüm 1 → hepsi 0, Bölüm 2 → hepsi 1, Bölüm 3 → hepsi 2, Bölüm 4 → hepsi 3).

## Dosya yapısı

```
├── main.js              Electron ana süreç + seri port köprüsü (IPC)
├── preload.js           contextBridge: encoderAPI (onData/onStatus/send/getConfig)
├── index.html           Oyun sayfası (semboller inline SVG)
├── src/
│   ├── game.js          Oyun mantığı ve akış (durum makinesi, diyalog motoru)
│   ├── encoder.js       EncoderInput — donanım/mock tek arayüz
│   ├── story.js         Hikâye, diyaloglar, ipuçları (bkz. hikaye-rehberi.md)
│   ├── audio.js         AudioManager — sentez müzik/efekt + Web Speech seslendirme
│   └── animations.js    Partikül motoru, sembol yağmuru, geçiş efektleri
├── assets/
│   ├── symbols/         16 sembol + 4 hatıra ikonu (SVG)
│   ├── characters/      10 karakter portresi (SVG)
│   ├── backgrounds/     4 dönem arka planı (SVG)
│   └── sounds/          (sesler çalışma anında sentezlenir — bkz. içindeki README)
├── styles/
│   ├── main.css         Düzen, encoder paneli, diyalog, overlay'ler
│   └── gokturk/selcuklu/osmanli/cumhuriyet.css   Dönem paletleri + atmosfer
├── config/symbols.json  Encoder-sembol eşleşmesi ve şifreler
└── tools/generate-assets.mjs   assets/ klasörünü yeniden üretir
```

## Testler

```bash
node tests/test-game.mjs    # oyun akışı uçtan uca (ekran görüntüleri shots/ altına)
node tests/test-demo.mjs    # animasyon demo sayfası
node tests/test-ses.mjs     # ses sistemi: TTS, müzik seviyeleri
```

İçerik kararlarının referansı: [docs/hikaye-rehberi.md](docs/hikaye-rehberi.md)
(karakter ses profilleri, ipucu kuralları, tarihsel düzeltmeler).
