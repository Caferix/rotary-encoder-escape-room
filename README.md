# 🕰️ Zaman Gezgini: Antik Kod Çözücü

[English Version](README_EN.md) | [Türkçe Versiyon](README.md)

---

**Fiziksel-Dijital Hibrit Eğitim Oyunu**

İlkokul öğrencileri için tasarlanan interaktif bir oyun. Oyuncular 4 rotary encoder'ı döndürerek ekrandaki sembolleri hizalar; doğru kombinasyonda solenoid kilit açılır ve türk tarihinin farklı dönemlerine ait hikâyeler ekranda canlanır.

> 💡 **Gömülü Sistemler Final Projesi** — Gray code tabanlı çoklu encoder okuması, interrupt kontrollü veri işleme ve seri haberleşme uygulaması.

---

## 📑 İçindekiler

- [🎯 Proje Özeti](#-proje-özeti)
- [🛠️ Teknoloji Stack](#️-teknoloji-stack)
- [📦 Proje Yapısı](#-proje-yapısı)
- [🚀 Hızlı Başlangıç](#-hızlı-başlangıç)
- [🔧 Donanım Yapısı](#-donanım-yapısı)
- [🎮 Oyun Mantığı](#-oyun-mantığı)
- [📋 Testler](#-testler)
- [📖 Dokümantasyon](#-dokümantasyon)
- [👥 Katkıda Bulunanlar](#-katkıda-bulunanlar)

---

## 🎯 Proje Özeti

### Mimari
- **Firmware (STM32F411CEU6)**: Gray code dekoderı ile 4 rotary encoder'ın senkron okunması, USB CDC üzerinden PC iletişimi
- **Uygulama (Electron.js + Node.js)**: Oyun mantığı, hikâye yönetimi, animasyonlar ve solenoid kontrol
- **Donanım**: 20-adımlı EC16 rotary encoder'lar, 12V solenoid kilit, 5V röle modülü

### Öğrenme Hedefleri (Gömülü Sistemler)
- ✅ **Gray Code Dekodlama**: Rotary encoder sinyallerinin hatasız yorumlanması
- ✅ **Interrupt Kontrollü I/O**: EXTI (External Interrupt) ile 4 encoder'ın eş zamanlı okunması  
- ✅ **USB CDC (Virtual COM Port)**: Mikrodenetleyici-PC seri haberleşmesi
- ✅ **Sistem Tasarımı**: Fiziksel ve dijital katmanların entegrasyonu, veri güvenliği

---

## 🛠️ Teknoloji Stack

| Katman | Teknoloji |
|--------|-----------|
| **Mikrodenetleyici** | STM32F411CEU6 |
| **Geliştirme Ortamı** | STM32CubeMX, VS Code, ARM GCC Toolchain |
| **Firmware** | C, STM32 HAL, USB Device Stack |
| **Uygulama** | Electron.js, Node.js, Web Audio API |
| **Haberleşme** | USB CDC (Virtual COM Port, 115200 baud) |
| **Donanım** | EC16 Rotary Encoder (20 adım/tur), 12V Solenoid, 5V Röle |

---

## 📦 Proje Yapısı

```
rotary-encoder-escape-room/
├── firmware/
│   └── exti-graycode-decoder/          # STM32 Firmware (Gray Code + Enkoder)
│       ├── Core/
│       │   ├── Inc/                     # Header dosyaları (GPIO, USB, interrupt config)
│       │   └── Src/
│       │       ├── main.c              # Firmware ana mantık, kilit kontrolü, USB komutları
│       │       ├── gpio.c              # GPIO iniziyalizasyonu
│       │       └── stm32f4xx_it.c      # Interrupt (EXTI) handler'ları
│       ├── USB_DEVICE/                 # USB CDC Device Stack
│       ├── Drivers/                    # STM32 HAL kütüphaneleri
│       └── Makefile                    # Build yapısı
│
├── app/
│   └── time_traveler-main/             # Electron.js Oyun Uygulaması
│       ├── main.js                     # Electron ana süreç, seri port köprüsü (IPC)
│       ├── preload.js                  # contextBridge (encoderAPI)
│       ├── index.html                  # Oyun sayfası (inline SVG sembolleri)
│       ├── src/
│       │   ├── game.js                 # Oyun mantığı, durum makinesi, diyalog motoru
│       │   ├── encoder.js              # EncoderInput — donanım/mock arayüzü
│       │   ├── story.js                # Hikâyeler, diyaloglar, ipuçları
│       │   ├── audio.js                # Web Audio API sentez müzik, TTS
│       │   └── animations.js           # Partikül motoru, sembol yağmuru, geçiş efektleri
│       ├── assets/
│       │   ├── symbols/                # 16 sembol + 4 hatıra ikonu (SVG)
│       │   ├── characters/             # 10 karakter portresi (SVG)
│       │   ├── backgrounds/            # 4 dönem arka planı (SVG)
│       │   └── sounds/                 # (sesler çalışma anında sentezlenir)
│       ├── styles/
│       │   └── main.css                # Düzen, encoder paneli, diyalog, overlay'ler
│       ├── config/
│       │   └── symbols.json            # Encoder-sembol eşleşmesi ve şifreler
│       ├── docs/
│       │   └── hikaye-rehberi.md       # İçerik kararları, sesler, tarihsel düzeltmeler
│       ├── tests/                      # Oyun akışı, animasyon, ses testleri
│       └── package.json
│
└── README.md (bu dosya)
```

---

## 🚀 Hızlı Başlangıç

### Gereksinimler
- **Node.js** 16+ ve **npm**
- **STM32CubeMX** (firmware modifikasyonu için)
- **ARM GCC Toolchain** (firmware derleme için)
- **ST-Link V2** (firmware yükleme için)
- **USB CDC Driver** (Windows: Oto kurulu; Linux/Mac: Oto tanıma)

### 1️⃣ Uygulamayı Çalıştır

```bash
cd app/time_traveler-main
npm install
npm start
```

**Komut Seçenekleri:**
```bash
npm start                           # Oyun (mock mode — klavye simülasyonu)
npm start -- --kiosk              # Tam ekran kiosk modu
npm start -- --port=COM5          # STM32'yi belirtilen porttan bağla
npm start -- --page=tests/demo.html              # Animasyon demo sayfası
npm start -- --page=tests/ses-demo.html          # Ses stüdyosu (TTS, müzik, efektler)
npm start -- --page=tests/encoder-test.html      # Donanım test konsolu (encoder hata ayıklaması)
```

**Klavye Simülasyonu (Mock Mode — STM32 olmadan test):**
```
1–4        → Encoder seç (karakter ipucunu anlatır)
←/→        → Pozisyon değiştir
SPACE      → Şifreyi dene
ENTER      → Diyaloğu hızlandır/ilerle
R          → Bölümü sıfırla
N          → Sonraki bölüm (test)
M          → Ses aç/kapat
H          → Yardım göster
```

### 2️⃣ Firmware'i Derle ve Yükle

```bash
cd firmware/exti-graycode-decoder

# Derleme
make clean
make

# Yükleme (ST-Link V2 ile)
make flash
```

**Donanım Bağlantı Kontrol Paneli:**
```bash
cd app/time_traveler-main
npm start -- --page=tests/encoder-test.html
```
Ham sayaçlar, pozisyon değişimleri, dönüş yönü, OPEN/CLOSE/RESET test butonları.

---

## 🔧 Donanım Yapısı

### Pin Konfigürasyonu (STM32F411CEU6)

| Cihaz | Pin | Port | Fonksiyon | Açıklama |
|-------|-----|------|-----------|----------|
| **Encoder 1** | PA0, PA1 | GPIO | EXTI0, EXTI1 | Gray Code |
| **Encoder 2** | PA2, PA3 | GPIO | EXTI2, EXTI3 | Gray Code |
| **Encoder 3** | PB6, PB7 | GPIO | EXTI9_5 | Gray Code |
| **Encoder 4** | PA8, PA9 | GPIO | EXTI9_5 | Gray Code |
| **Solenoid Röle** | PB0 | GPIO | Output | Kilit AÇMA/KAPAMA (HIGH=Açık) |
| **Reset Butonu** | PB1 | GPIO | Input | Enkoder sayaçlarını sıfırla |
| **USB** | PA11, PA12 | FS | OTG_FS | CDC Device (Virtual COM Port) |

### Gray Code Dekodlama

4 adımlı durum makinesi:
```
00 → 01 → 11 → 10 → 00  (Saat yönü)
00 → 10 → 11 → 01 → 00  (Ters yön)
```

Her encoder 0-19 arası döngüsel konum (20 adım/tur, **5 adım = 1 sembol**).

### USB İletişim Protokolü

**STM32 → PC:** (~60 Hz)
```
"12,3,19,0\n"  → Encoder 1-4 pozisyonları (0-19)
```

**PC → STM32:** Komutlar
```
OPEN\n    → Kilidi aç
CLOSE\n   → Kilidi kapat
RESET\n   → Enkoder sayaçlarını sıfırla
```

**Durum Göstergesi:** (Sağ altta)
- 🟢 Bağlı (STM32 aktif)
- 🔴 Bağlı değil (Mock mode)

---

## 🎮 Oyun Mantığı

### Bölüm Yapısı
4 dönem, her dönemde 4 enkoder şifresi (0-3 konum):

| Bölüm | Dönem | Şifre | Hikâye |
|-------|-------|-------|--------|
| 1 | **Göktürk** | [0,0,0,0] | İlk yazı sistemleri |
| 2 | **Selçuklu** | [1,1,1,1] | Medrese ve bilim |
| 3 | **Osmanlı** | [2,2,2,2] | Devlet örgütlenmesi |
| 4 | **Cumhuriyet** | [3,3,3,3] | Modern Türkiye |

### Kontrol Mantığı
1. Oyuncu enkoderları döndürür
2. Firmware Gray code'u 0-3 pozisyonuna çevirir
3. PC değişimleri algılar ve oyuna iletir
4. Doğru kombinasyon sağlanınca **otomatik** olarak kilit açılır
5. Hikâye canlanır, solenoid kilitlenir, sonraki bölüme geçilir

**Güvenlik:** En az 1 fiziksel hamle yapılmadan kilit açılmaz (reset koruması).

---

## 📋 Testler

```bash
cd app/time_traveler-main

# Oyun akışı uçtan uca (ekran görüntüleri shots/ klasörüne kaydedilir)
node tests/test-game.mjs

# Animasyon demo sayfası
node tests/test-demo.mjs

# Ses sistemi: TTS, müzik seviyeleri, efekt paneli
node tests/test-ses.mjs
```

---

## 📖 Dokümantasyon

- **Oyun İçeriği & Karakter Tasarımı:** [`app/time_traveler-main/docs/hikaye-rehberi.md`](app/time_traveler-main/docs/hikaye-rehberi.md)
- **Uygulama README:** [`app/time_traveler-main/README.md`](app/time_traveler-main/README.md)
- **Ses Sistemi (Web Audio API):** [`app/time_traveler-main/assets/sounds/README.md`](app/time_traveler-main/assets/sounds/README.md)

---

## 👥 Katkıda Bulunanlar

- **Firmware & Donanım:** [Caferix](https://github.com/Caferix)  
  Gray code enkoder dekoderı, USB CDC iletişimi, STM32F411CEU6 konfigürasyonu
  
- **Uygulama & Oyun Tasarımı:** [@yziyak](https://github.com/yziyak)  
  Electron.js uygulaması, oyun mantığı, hikâyeler, animasyonlar ve ses sistemi

---

## 📝 Lisans

MIT — Özgürce kullanabilir, değiştirebilir ve dağıtabilirsiniz.

---

## 🎓 Eğitim Bağlamı

**Ders:** Gömülü Sistemler  
**Proje Türü:** Final Öğrenci Projesi  
**Hedef Yaş:** İlkokul (8-14 yaş)  
**Tarih:** 2026

Bu proje, gömülü sistemlerin temel konseptlerini uygulamalı olarak göstermeyi amaçlamaktadır:
- **Interrupt-Driven I/O:** EXTI ile 4 encoder'ın eş zamanlı senkron okunması
- **Gray Code:** Mekanik sensörlerden dijital veriye kodlama
- **Seri Haberleşme:** USB CDC üzerinden gerçek zamanlı PC haberleşmesi
- **Sistem Tasarımı:** Fiziksel ve yazılım katmanlarının entegrasyonu

---

## 🐛 Sorun Bildirimi

Karşılaştığınız hata veya öneriniz varsa, lütfen [Issues](../../issues) sekmesinde açınız.

---

## ❓ SSS

**S: STM32 olmadan test edebilir miyim?**  
C: Evet! Mock mode'de kalibratör kullanarak (1-4 tuşları enkoder seç, ←/→ konumlandır) test edebilirsiniz.

**S: Farklı encoder modelleri kullanabilir miyim?**  
C: Kodda `firmware/.../main.c` dosyasında adım sayısı sabit kodlanmıştır. Başka encoder için Gray code ve 0-N aralığını güncelleyiniz.

**S: Oyunu teleprompter/LCD ekranında çalıştırabilir miyim?**  
C: Evet, `--kiosk` modu ile tam ekran başlayacaktır.

---

**Sorular veya katkılar için:** [GitHub Discussions](../../discussions)

Keyifli öğrenme ve geliştirme dilerim! 🚀
