# 🚌 Karanix Demo - Canlı Operasyon Takip Sistemi

Karanix Demo, turizm ve taşımacılık operasyonlarını gerçek zamanlı olarak izlemeyi sağlayan; **Node.js**, **React**, **MongoDB** ve **Socket.IO** teknolojileriyle geliştirilmiş tam kapsamlı bir yönetim panelidir.

Bu proje; operasyon planlama, araçların canlı harita üzerinde takibi, yolcu check-in süreçleri ve otomatik durum bildirimleri gibi temel lojistik ihtiyaçları karşılamak üzere tasarlanmıştır.

---

## 🚀 Özellikler

### 🖥️ Frontend (Ön Yüz)
* **Canlı Harita Entegrasyonu:** Google Maps üzerinde araçların anlık konumlarını, rotalarını ve yolcu duraklarını görüntüleme.
* **Gelişmiş Operasyon Yönetimi:**
  * Bugün/Yarın hızlı filtreleri.
  * Tarih seçici (Date Picker) ile geçmiş/gelecek operasyonları görüntüleme.
  * Yeni operasyon oluşturma ve araç atama.
* **Yolcu Manifestosu:** Yolcu listesi görüntüleme, anlık check-in yapma ve doluluk oranlarını takip etme.
* **Anlık Bildirimler (Toast):** İşlem başarı/hata durumları ve sistem alarmları için şık bildirimler.
* **Güvenli Oturum:** Token süresi dolduğunda otomatik çıkış yapma özelliği.
* **Modern Arayüz:** Tailwind CSS ve shadcn/ui bileşenleri ile geliştirilmiş responsive tasarım.

### ⚙️ Backend (Arka Yüz)
* **RESTful API:** Operasyon, araç, yolcu ve kullanıcı verileri için gelişmiş API uç noktaları.
* **Gerçek Zamanlı İletişim:** Socket.IO ile araç konumları ve check-in durumlarının anlık senkronizasyonu.
* **GPS Heartbeat Sistemi:** Araçlardan gelen konum verilerini işleme ve veritabanına kaydetme.
* **Otomatik Alarm Sistemi (Cron Job):** Operasyon sırasında düşük katılım (%70 altı) olması durumunda yöneticiye otomatik uyarı gönderme (Her 60 saniyede bir kontrol).
* **Idempotency (Veri Tutarlılığı):** Çift kayıtları önlemek için check-in işlemlerinde benzersiz işlem kimlikleri (UUID) kullanımı.
* **Güvenli Veritabanı Bağlantısı:** MongoDB bağlantı hatalarını ve URI format sorunlarını otomatik düzelten yapı.

---

## 🛠️ Teknoloji Yığını

* **Runtime:** Node.js (v18+)
* **Database:** MongoDB (Mongoose ODM)
* **Frontend Framework:** React 19
* **Backend Framework:** Express.js
* **Real-time:** Socket.IO
* **Styling:** Tailwind CSS
* **Map:** @react-google-maps/api
* **Utilities:** date-fns, uuid, axios

---

## ⚙️ Kurulum ve Çalıştırma

Projeyi yerel ortamınızda çalıştırmak için aşağıdaki adımları takip edin.

### 1. Ön Hazırlık
* Bilgisayarınızda **Node.js** (v18 veya üzeri) yüklü olmalıdır.
* Çalışan bir **MongoDB** bağlantınız (Yerel veya Atlas URL) olmalıdır.
* Geçerli bir **Google Maps API Anahtarı** gereklidir.

### 2. Paketlerin Yüklenmesi

Proje ana dizininde terminal açın ve sırasıyla arka yüz ve ön yüz bağımlılıklarını yükleyin:

```bash
# Backend paketlerini yükle
cd backend
npm install

# Ana dizine geri dön ve Frontend paketlerini yükle
cd ../frontend
npm install --legacy-peer-deps
```

### 3. Çevresel Değişkenlerin (.env) Ayarlanması

**Backend Ayarları:**
`backend/.env` dosyasını oluşturun ve içine şu bilgileri ekleyin:

```env
PORT=8002
# MongoDB Bağlantı Adresiniz
MONGO_URL=mongodb+srv://kullanici:sifre@cluster.mongodb.net
DB_NAME=karanix
CORS_ORIGINS=*
```

**Frontend Ayarları:**
`frontend/.env` dosyasını oluşturun ve içine şu bilgileri ekleyin:

```env
# Backend API adresi (Port backend ile aynı olmalı)
REACT_APP_BACKEND_URL=http://localhost:8001

# Google Maps JavaScript API Anahtarınız
REACT_APP_GOOGLE_MAPS_API_KEY=AIzaSy...SIZIN_ANAHTARINIZ
```

### 4. Veritabanını Hazırlama (Seed)

Sistemi test etmek için gerekli örnek verileri (1 haftalık dolu operasyon planı, araçlar, müşteriler ve yolcular) oluşturun:

```bash
cd backend
npm run seed
```
*(Terminalde "Seed işlemi başarıyla tamamlandı!" mesajını görmelisiniz.)*

### 5. Uygulamayı Başlatma

Sistemi çalıştırmak için iki ayrı terminal penceresi kullanın:

**Terminal 1 (Backend):**
```bash
cd backend
npm start
```

**Terminal 2 (Frontend):**
```bash
cd frontend
npm start
```


## 🔑 Demo Giriş Bilgileri

Panel erişimi için aşağıdaki test hesaplarını kullanabilirsiniz:

| Rol | Kullanıcı Adı | Şifre | Yetki |
| :--- | :--- | :--- | :--- |
| **Yönetici** | `admin` | `admin123` | Tam Erişim, Alarm Görüntüleme |
| **Rehber** | `guide1` | `guide123` | Check-in Yapma |
| **Sürücü** | `driver1` | `driver123` | Salt Okunur |

---

## 🧪 Test ve Simülasyon

Araçların harita üzerinde hareket ettiğini görmek için backend tarafındaki simülasyon scriptini çalıştırabilirsiniz:

```bash
# Backend klasöründe:
node test_heartbeat.js
```
*Bu script, veritabanındaki ilk aracı alır ve İstanbul içinde rastgele bir rota üzerinde hareket ettirerek sisteme GPS verisi gönderir. Frontend haritasında aracın hareketini canlı olarak izleyebilirsiniz.*

---

## 📂 Proje Yapısı

```
karanixapp/
├── backend/
│   ├── src/
│   │   ├── config/         # Veritabanı ve ortam ayarları
│   │   ├── models/         # Mongoose veritabanı şemaları
│   │   ├── routes/         # API yönlendirmeleri
│   │   ├── server.js       # Ana sunucu dosyası (Express + Socket.IO + Alarm Sistemi)
│   │   └── seed.js         # 1 Haftalık Detaylı Örnek Veri Oluşturucu
│   └── test_heartbeat.js   # GPS simülasyon scripti
│
├── frontend/
│   ├── src/
│   │   ├── components/     # UI bileşenleri (Harita, Tablo, Modal, Toast vb.)
│   │   ├── pages/          # Sayfa bileşenleri (Dashboard, Operasyonlar, Müşteriler vb.)
│   │   ├── services/       # API (Axios Interceptor) ve WebSocket servisleri
│   │   └── App.js          # Ana uygulama bileşeni (Error Boundary dahil)
│   └── .env                # Frontend ayar dosyası
└── README.md               # Proje dokümantasyonu
```
