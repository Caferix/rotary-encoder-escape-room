# assets/sounds

Bu prototipte tüm müzik ve efektler **çalışma anında Web Audio API ile sentezlenir**
(`src/audio.js` → AudioManager); ses dosyası gerekmez. Seslendirme Web Speech API
(Windows: Microsoft Tolga tr-TR) ile yapılır.

Bu klasör üretim aşaması için ayrılmıştır: kayıtlı replikler buraya
`<karakter-id>/<replik-no>.mp3` düzeninde konduğunda AudioManager.speak()
önce dosyayı arayacak şekilde genişletilebilir (bkz. hikaye-rehberi.md, ölçekleme).
