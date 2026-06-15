/* ============================================================
   STORY — hikâye, diyaloglar ve ipuçları
   İçerik hikaye-rehberi.md (Story Agent) ile uyumludur:
   - Işık'ın "söyleyemem" kuralı, enerji maliyeti
   - Tonyukuk → "Yazıt Bekçisi" (tarihsel düzeltme)
   - Selçuklu 1221 (1071 değil), Güneş Kursu = Hitit (16 devlet değil)
   - Her bölümde erdem dersi: sabır → dikkat → sükûnet → umut
   - Hatıra koleksiyonu, O.D. 1957 kapanışı
   Karakter kimlikleri src/audio.js'teki ses profilleriyle eşleşir.
   ============================================================ */
(function () {
'use strict';

window.STORY = {

  /* Karakter portreleri: assets/characters/ klasöründeki tasarımlar.
     Sahne düzeni: Alp HEP solda, diğer herkes sağda —
     konuşma Alp ile karşısındaki karakter arasında akar. */
  cast: {
    alp:      { ad: 'ALP',             img: 'assets/characters/Alp Demir.png',           side: 'L' },
    isik:     { ad: 'IŞIK',            img: 'assets/characters/Işık.png',                side: 'R' },
    kur:      { ad: 'KÜR',             img: 'assets/characters/Kür.png',                 side: 'R' },
    bekci:    { ad: 'BİLGE KAĞAN',   img: 'assets/characters/Tonyukuk.png',            side: 'R' },
    omer:     { ad: 'ÖMER',            img: 'assets/characters/Ömer.png',                side: 'R' },
    mahmud:   { ad: 'SULTAN ALPARSLAN',     img: 'assets/characters/Usta Mahmud.png',         side: 'R' },
    murat:    { ad: 'MURAT',           img: 'assets/characters/Murat.png',               side: 'R' },
    suleyman: { ad: 'FATİH SULTAN MEHMED',  img: 'assets/characters/Katip Süleyman.png',      side: 'R' },
    efe:      { ad: 'EFE',             img: 'assets/characters/Efe.png',                 side: 'R' },
    yusufbey: { ad: 'İSMET İNÖNÜ',       img: 'assets/characters/Telgrafçı Yusuf Bey.png', side: 'R' },
    dede:     { ad: 'OSMAN DEDE',      img: 'assets/characters/Osman Dede.png',          side: 'R' },
  },

  /* Açılış: ödev + pusula + Işık'ın çıkışı */
  intro: [
    { who: 'alp',  text: 'Yine o sıkıcı tarih ödevi... Yarın teslim etmem gerek ama saat gece yarısını geçti. Odaklanamıyorum.' },
    { who: 'alp',  text: 'Ne yapsam? Belki dedemin eski sandığına baksam işime yarar bir şeyler bulurum... Dur, şu garip kutu da ne?' },
    { who: 'alp',  text: 'Üstünde kilitli bir mekanizma ve tuhaf bir pusula var... Dedem bunu hiç göstermemişti.' },
    { who: 'alp',  text: 'Pusulanın kadranında harfler yerine dört farklı sembol işlenmiş... Bir, iki... İkisine aynı anda dokununca... Neler oluyor, pusula parlıyor mu?!' },
    { who: 'isik', text: 'Taaaa-daaa! Korkma korkma, odan patlamıyor. Ben Işık! Zamanın akıntılarında kaybolanların rehberi!' },
    { who: 'alp',  text: 'N-ne? Sen de kimsin? Odanın içinde konuşan bir hologram mısın?' },
    { who: 'isik', text: 'Ben pusulanın hafızasıyım! Dedenden sonra yeni gezginimiz sensin demek... Ufak tefek görünüyorsun ama umarım deden kadar zekisindir.' },
    { who: 'alp',  text: 'Gezgin mi? Dedem mi? Neler saçmalıyorsun sen?' },
    { who: 'isik', text: 'Anlatacak uzun vaktimiz yok. Elindeki o antik kutunun üzerindeki 4 sembol, 4 büyük zaman kilidi demek. Onları çözmeden o kutuyu asla açamazsın.' },
    { who: 'alp',  text: 'Şaka yapıyorsun... O kilitleri nasıl çözeceğim ki?' },
    { who: 'isik', text: 'Tabii ki oraya gidip bizzat o zamanın insanlarını dinleyerek! Hazır mısın? Kemerini bağla, ilk durağımız 735 yılı... Orhun Vadisi\'ne gidiyoruz!' },
  ],

  chapters: [
    /* ------------------- BÖLÜM 1: GÖKTÜRK ------------------- */
    {
      key: 'gokturk', title: 'GÖKTÜRK', year: '735', place: 'Orhun Vadisi',
      lesson: 'Sabır',
      arrival: [
        { who: 'kur',   text: 'Hey! Sen de kimsin, kardeş? Kıyafetin pek bir tuhaf. Üstelik atın da yok!' },
        { who: 'alp',   text: 'Ben Alp! Şey… uzaklardan geliyorum. Çok uzaklardan.' },
        { who: 'bekci', text: 'Gök yeni bir konuk gönderdi demek… Hoş geldin, evlat. Ben Bilge Kağan. Sözlerimi asırlar sonrasına ulaştırmak için bu devasa taşlara, Orhun Yazıtları\'na kazıtıyorum.' },
        { who: 'alp',   text: 'Yani ilk Türkçe yazılı eserler! Ama neden kağıda değil de taşa kazıyorsunuz?' },
        { who: 'bekci', text: 'Çünkü kağıt rüzgarda savrulur, taş ise bozkırın fırtınasında bile dimdik ayakta kalır. Gelecek nesiller, yani sizler, milletin nasıl birlik olduğunu unutmayın diye Gök Tengri\'nin şahitliğinde taşlara işliyoruz.' },
        { who: 'kur',   text: 'Fakat tören taşının tamgaları karıştı! Eğer çözemezsek toy (kurultay) toplanamayacak.' },
        { who: 'isik',  text: 'Kilidi duyuyorum Alp! Ama cevabı ben söyleyemem — zaman kilidi yalnız bu çağın insanını dinler. Onlara sor!' },
        { who: 'bekci', text: 'Ve acele etme evlat. Bozkırda aceleyle yürüyen… izleri ezer. Dinle ve öğren.' },
      ],
      clues: [
        /* Görseller: at, kurt, otağ, yay — ipuçları Göktürk sembollerini tarif eder */
        { who: 'kur',   text: 'Bozkırın rüzgarıyla yarışan sadık dostumuz… Yelesi dalgalanan asil bir at ara!' },
        { who: 'bekci', text: 'Ergenekon\'da bize yol gösteren ulu önderimiz… Gök yeleli bozkurdu bul.' },
        { who: 'kur',   text: 'Kağanımızın yurdu, devletin kalbi… Tepesinde tuğ dalgalanan ulu otağ!' },
        { who: 'bekci', text: 'Tarih boyunca düşmanları titreten silahımız… Gerilmiş, hedefe kilitlenmiş bir yay!' },
      ],
      help: "Çok yaklaştın! Atı, kurdu, otağı ve yayı bul…",
      success: [
        { who: 'kur',  text: 'Yıldız kaydı! Tören kurtuldu! Sen küçücük bedenine sığmayan bir yüreksin, kardeş!' },
        { who: 'kur',  text: 'Al şunu — kartal tüyü. Bozkır seni unutmasın.' },
        { who: 'isik', text: 'Bir kilit açıldı, üç kaldı! Ve ben birazcık… söndüm sanki? Neyse! Sonraki durak: 1221, Konya!' },
      ],
      keepsake: { id: 'tuy', ad: 'Kartal Tüyü', img: 'assets/symbols/keepsake-tuy.svg' },
      fact: 'Orhun Yazıtları, Türkçenin bilinen ilk yazılı anıtlarıdır. Bugün hâlâ dikildikleri yerde, Moğolistan’da duruyorlar.',
      reveal: { hero: 'at', sub: 'Orhun Yazıtları’nın sırrı çözüldü! · 735' },
    },

    /* ------------------- BÖLÜM 2: SELÇUKLU ------------------- */
    {
      key: 'selcuklu', title: 'SELÇUKLU', year: '1221', place: 'Konya',
      lesson: 'Dikkat',
      arrival: [
        { who: 'omer',   text: 'Aman! Y-yavaş ol! Az daha çinileri deviriyordun!' },
        { who: 'alp',    text: 'Pardon! Ben Alp. Vay be… bu mavi taşlar şahane! Her yer bunlarla kaplı.' },
        { who: 'mahmud', text: 'Turkuaz, evladım. Yani "Türk Taşı". Hoş geldin. Burası Karatay Medresesi, sadece taşların değil, bilimin de parladığı yer.' },
        { who: 'alp',   text: 'Medrese mi? Yani okul mu burası?' },
        { who: 'mahmud', text: 'Okuldan çok daha fazlası. Gökyüzündeki yıldızların hareketlerini hesaplıyor, hastaları iyileştiriyor ve felsefe tartışıyoruz. Bu çinilerdeki her geometrik desen, evrenin ve matematiğin kusursuz bir yansımasıdır.' },
        { who: 'omer',   text: 'A-ama sultanım... Medresenin kütüphane kapısındaki desenler karıştı; akşam büyük bir astronomi dersi var ve kapı açılmıyor!' },
        { who: 'mahmud', text: 'Üzülme. Hızlı kazınan taş çabuk kırılır. Sabırla bak — her desenin içinde bir hesap gizlidir. Misafirimiz bize yardım edecektir.' },
      ],
      /* Konuşmacı düzeni: Ömer 1&3, Usta Mahmud 2&4 */
      clues: [
        { who: 'omer',   text: 'Sultanımız der ki: kökleri yerin derinliğinde, dalları gökte! Çinicilerin en sevdiği desen — Hayat Ağacı!' },
        { who: 'mahmud', text: 'Gökyüzünün hakimi, devletimizin ulu sembolü kartal... Asaletin ve gücün timsali.' },
        { who: 'omer',   text: 'Zalime karşı her zaman keskin bir kılıç olduk. Üstünde dualar yazılı o kılıcı bul!' },
        { who: 'mahmud', text: 'Evreni anlatan sekiz köşeli bir yıldız, evladım... Sekiz yön, sekiz erdem demektir.' },
      ],
      help: "Az kaldı! Hayat ağacını, kartalı, kılıcı ve yıldızı düşün — Ömer'le ustası ne anlattı?",
      success: [
        { who: 'omer', text: 'Kapı açıldı! Yaptın! Sen bir dahisin!' },
        { who: 'alp',  text: 'Dinledim sadece.' },
        { who: 'omer', text: 'Bu çini dün elimden düşüp kırılmıştı… Sultanım “kusur da desene dahildir” dedi. Senin olsun!' },
        { who: 'isik', text: 'İki kilit! Sıkı dur gezgin… 1453, İstanbul. Biraz… gürültülü olacak.' },
      ],
      keepsake: { id: 'cini', ad: 'Çini Parçası', img: 'assets/symbols/keepsake-cini.svg' },
      fact: 'Çinideki turkuaz rengin sırrı bakır! “Turkuaz” kelimesi Avrupa dillerine “Türk taşı” olarak geçti.',
      reveal: { hero: 'kartal', sub: 'Medresenin kapısı açıldı! · 1221' },
    },

    /* ------------------- BÖLÜM 3: OSMANLI ------------------- */
    {
      key: 'osmanli', title: 'OSMANLI', year: '1453', place: 'İstanbul — Fetih Gecesi',
      lesson: 'Sükûnet',
      arrival: [
        { who: 'murat',    text: 'Kim o?! Ah… affedersiniz efendim. Bu gece herkes diken üstünde.' },
        { who: 'alp',      text: 'Ben Alp. Korkma — yardıma geldim. Dışarıdaki o devasa gürültü de ne?' },
        { who: 'suleyman', text: 'Sesini alçak tut, evlat. O duyduğun, Şahi toplarının surları döven kükremesidir. Konstantiniyye, yani İstanbul önlerindeyiz. Surları aşmaya yeminliyim.' },
        { who: 'murat',    text: 'Elim titriyor… Top sesleri hiç susmuyor! Hünkarım, gemileri karadan kızaklarla yürüttüğünüzü söylüyorlar!' },
        { who: 'suleyman', text: 'Doğrudur. Haliç\'e çekilen o dev zinciri aşmak için aldığım eşsiz bir karar bu. Ancak şu elimdeki şifreli ferman sabaha dek çözülmeli. Birliklerin nereye konuşlanacağı buna bağlı.' },
        { who: 'suleyman', text: 'Dört nişanı doğru dizmeden bu mühür açılmaz. Ve unutma Murat; korku acele ettirir. Hükümdar önce nefes alır… sonra yönetir. Sükûnet her kalkanı deler.' },
      ],
      /* Konuşmacı düzeni: Kâtip Süleyman 1&3, Murat 2&4 */
      clues: [
        { who: 'suleyman', text: 'Mimar Sinan\'ın taşa vurduğu mühür... Minareleri göğe yükselen ulu bir cami ara.' },
        { who: 'murat',    text: 'Sancaklarımızda dalgalanan, zaferin ve inancın şanlı nişanı... Ulu hilali bul!' },
        { who: 'suleyman', text: 'Çinilerimizi süsleyen, zarafetin sembolü... Kırmızısıyla, mavisiyle bir lale.' },
        { who: 'murat',    text: 'Hünkarımızın fermanlarındaki o muazzam imza... Kıvrıla kıvrıla yazılan tuğra!' },
      ],
      help: "Korkma, yaklaştın! Camiyi, hilali, laleyi ve tuğrayı düşün…",
      success: [
        { who: 'suleyman', text: 'Belge tamamdır. Acelesiz ve kusursuz. Tebrik ederim.' },
        { who: 'murat',    text: 'Bizde “alp” kahraman demek, biliyor muydun? Tesadüf olmasa gerek… Al, bu lale yaprağını sakla.' },
        { who: 'isik',     text: 'Üç kilit! Işığım azalıyor ama son durak güzel: 1923, Ankara! Sabah oluyor, Alp!' },
      ],
      keepsake: { id: 'lale', ad: 'Lale Yaprağı', img: 'assets/symbols/keepsake-lale.svg' },
      fact: '1453’te gemiler bir gecede kızaklarla karadan yürütülüp Haliç’e indirildi — tarihin en cesur mühendislik oyunlarından biri!',
      reveal: { hero: 'tugra', sub: 'Surların şifresi kırıldı! · 1453' },
    },

    /* ------------------- BÖLÜM 4: CUMHURİYET ------------------- */
    {
      key: 'cumhuriyet', title: 'CUMHURİYET', year: '1923', place: 'Ankara — Telgraf Odası',
      lesson: 'Umut',
      arrival: [
        { who: 'efe',      text: 'Tıkır tıkır tıkır! Duyuyon mu gardaş? Ankara’nın kalbi bu makinede atıyor!' },
        { who: 'alp',      text: 'Bu... Gerçek bir telgraf makinesi! Hangi yıldayız?' },
        { who: 'yusufbey', text: '1923, evlat. Hoş geldin. Savaşın barut kokusu dağıldı, şimdi yepyeni bir devletin, Türkiye Cumhuriyeti\'nin kuruluş günleri.' },
        { who: 'efe',      text: 'Bütün Kurtuluş Savaşı\'nı bu teller üzerinden yönettik biz! Paşamızın emirleri, cephedeki zaferler hep bu odadan Anadolu\'ya yayıldı.' },
        { who: 'yusufbey', text: 'Evet Efe, kanla ve irfanla kurduğumuz bu cumhuriyet, telgraf tellerinde dokundu adeta. Ancak elimizde çok acil, şifreli bir mesaj var. Dört işaret çözülmeden Meclis\'e iletemeyiz.' },
        { who: 'efe',      text: 'Hadi gardaşım, hadi! Yeni bir ülke doğuyor, bütün Anadolu bu haberi bekliyor, bekletmek olmaz!' },
        { who: 'yusufbey', text: 'Sakin ol, Efe. İlk satırı çekmeden hiçbir telgraf bitmez. Tıpkı devleti kurmak gibi; sabırla, adım adım. Ama doğru çekilen o ilk satır… her şeyi başlatır.' },
      ],
      /* Konuşmacı düzeni: Yusuf Bey 1&3, Efe 2&4 */
      clues: [
        { who: 'yusufbey', text: 'Cumhuriyetimizin temelini oluşturan altı büyük ilke... Yan yana sıralanmış altı ok!' },
        { who: 'efe',      text: 'Karanlıkları aydınlatan, ülkemizin üzerine doğan hürriyet güneşi gardaş!' },
        { who: 'yusufbey', text: 'Fabrikaların dişlileri dönüyor evlat! Genç Cumhuriyet üretiyor, sanayi çarkları dönüyor.' },
        { who: 'efe',      text: 'İstikbal göklerdedir! Vecihi\'nin, Nuri\'nin hayali olan tayyare... Kanatlarını göğe açmış uçağı bul!' },
      ],
      help: "Harikasın, az kaldı! Altı oku, güneşi, dişliyi ve uçağı düşün…",
      success: [
        { who: 'yusufbey', text: 'Mesaj yola çıktı. Türkiye’nin geleceği sizin gibi zeki çocuklara emanet.' },
        { who: 'efe',      text: 'Al gardaş — telgraf şeridinin ilk parçası! İlk mesajın anısı!' },
        { who: 'isik',     text: 'Dört kilit… tamam. Eve dönüyoruz, gezgin.' },
      ],
      keepsake: { id: 'serit', ad: 'Telgraf Şeridi', img: 'assets/symbols/keepsake-serit.svg' },
      fact: 'Kurtuluş Savaşı telgrafla yönetildi: Ankara’dan cepheye emirler tıkırtılarla ulaştı. (Bu kadrandaki anıt, Anıtkabir, 1953’te tamamlandı — geleceğe küçük bir göz kırpma!)',
      reveal: { hero: 'alti-ok', sub: 'Telgraf şifresi çözüldü! · 1923' },
    },
  ],

  /* Kapanış sekansı (game.js sahneler; satırlar sırayla) */
  finale: {
    farewell: { who: 'isik', text: 'Görüşürüz, gezgin…' },
    lines: [
      { who: 'alp',  text: 'Tüy… çini… lale… şerit… Bunların hepsi gerçek! Gerçekten zamanda yolculuk yaptım!' },
      { who: 'dede', text: 'Pusulayı buldun demek… Söyle bakalım evlat, benim yaramaz Işık hâlâ o kadar geveze mi?' },
      { who: 'alp',  text: 'Dede?! “O.D. 1957”… Kutudaki o baş harfler! O ilk gezgin sendin!' },
      { who: 'dede', text: 'Evet Alp... Tarih sadece kitaplarda yazan sıkıcı satırlardan ibaret değildir. Gidip o havayı solumanı, o insanları tanımanı istedim. Neler gördün anlat bakalım.' },
      { who: 'alp',  text: 'Göktürklerde yazıtların sırrını, Selçuklu\'da o harika çinilerin hesabını, İstanbul\'un fethindeki sultan sükunetini ve Cumhuriyet\'in ilk günlerindeki telgraf başındaki o heyecanı gördüm! Hepsi inanılmazdı!' },
      { who: 'dede', text: 'Geçmişin sadece geçmiş değil, senin köklerin olduğunu öğrenmişsin. O hatıralara çok iyi bak evlat. Kutunun sırrı artık sensin.' },
      { who: 'alp',  text: 'Tarih ödevim için de bolca malzemem oldu galiba! Teşekkürler dede.' },
    ],
    title: 'Tarih: Dinlediklerim',
    engraving: 'O.D. 1957',
  },
};
})();
