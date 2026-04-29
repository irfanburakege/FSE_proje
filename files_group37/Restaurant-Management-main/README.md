# Restaurant Management System

Modern ve kullanıcı dostu bir restoran yönetim sistemi. Bu sistem, restoranların masa yönetimi, menü yönetimi, sipariş takibi ve personel yönetimi gibi temel işlevlerini dijital ortamda gerçekleştirmelerini sağlar.

## 🚀 Özellikler

- **Masa Yönetimi**

  - Farklı bölgelerde (İçerisi, Balkon, Bahçe, VIP) masa tanımlama
  - Masa durumu takibi
  - Masa bazlı sipariş yönetimi

- **Menü Yönetimi**

  - Ürün ekleme, düzenleme ve silme
  - Ürün görselleri ve açıklamaları
  - Fiyat güncelleme

- **Sipariş Yönetimi**

  - Anlık sipariş takibi
  - Sipariş durumu güncelleme (Hazırlanıyor, Hazır)
  - Geçmiş siparişleri görüntüleme

- **Personel Yönetimi**

  - Personel bilgileri
  - Çalışma saatleri takibi
  - İşe başlama tarihi kaydı

- **Modern Arayüz**
  - Responsive tasarım
  - Animasyonlu geçişler
  - Kullanıcı dostu arayüz
  - Gradient ve blur efektleri

## 🛠️ Teknolojiler

- **Frontend**

  - React.js
  - Tailwind CSS
  - Framer Motion (Animasyonlar)
  - Axios (HTTP İstekleri)

- **Backend**
  - Node.js
  - Express.js
  - MySQL

## 📋 Kurulum

1. **Veritabanı Kurulumu**

   ```bash
   # MySQL veritabanını oluşturun
   mysql -u root -p < database.sql
   ```

2. **Backend Kurulumu**
   ```bash
   
   ### index.js dosyasında gerekli veritabanı değişikliklerinizi yapın.
   
   # Backend klasörüne gidin
   cd backend

   # Bağımlılıkları yükleyin
   npm install

   # Sunucuyu başlatın
   npm start
   ```

4. **Frontend Kurulumu**

   ```bash
   # Frontend klasörüne gidin
   cd frontend

   # Bağımlılıkları yükleyin
   npm install

   # Geliştirme sunucusunu başlatın
   npm run dev
   ```

## 🔧 Gereksinimler

- Node.js (v14 veya üzeri)
- MySQL (v8.0 veya üzeri)
- npm veya yarn

## 🌐 Kullanım

1. Tarayıcınızda `http://localhost:5173` adresine gidin
2. Database'den seçtiğiniz herhangi bir Staff ile giriş yapabilirsiniz.

## 🌐 Müşteri Kullanım

1. Tarayıcınızda `http://localhost:5173/table/:tableNo` (ex:`http://localhost:5173/table/1`) adresine gidin.
2. Kasaya gitmeden siparişinizi verebilirsiniz.

## 📄 Lisans

Bu proje MIT lisansı altında lisanslanmıştır. Daha fazla bilgi için `LICENSE` dosyasına bakın.

Proje Linki: [https://github.com/uzeyirtalhakilic/Restaurant-Management](https://github.com/uzeyirtalhakilic/Restaurant-Management)
