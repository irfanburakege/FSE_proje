-- Veritabanı oluşturuluyor
CREATE DATABASE IF NOT EXISTS restaurant_ordering;
USE restaurant_ordering;

-- 1. tables tablosu
CREATE TABLE tables (
    id INT PRIMARY KEY AUTO_INCREMENT,
    type VARCHAR(50),
    name VARCHAR(50),
    description TEXT,
    status ENUM('Boş', 'Dolu', 'Rezerve', 'Temizleniyor') DEFAULT 'Boş'
);

INSERT INTO tables (type, name, description, status) VALUES
('İçerisi', 'Masa 1', 'Pencere kenarında 2 kişilik masa', 'Boş'),
('İçerisi', 'Masa 2', 'Mutfağa yakın 4 kişilik masa', 'Dolu'),
('Balkon', 'Masa 3', 'Açık alanda sigara içilebilir masa', 'Rezerve'),
('Bahçe', 'Masa 4', 'Gölgelik altında geniş masa', 'Boş'),
('VIP', 'Masa 5', 'Özel oda içinde, sunucu çağırma düğmesi var', 'Dolu'),
('Balkon', 'Masa 6', 'Yukarıdaki masa', 'Temizleniyor'),
('İçerisi', 'Masa 7', 'Bar yakınında 2 kişilik masa', 'Boş'),
('Bahçe', 'Masa 8', 'Çocuk parkı yakınında 6 kişilik masa', 'Rezerve'),
('VIP', 'Masa 9', 'Özel oda içinde, 8 kişilik masa', 'Boş'),
('İçerisi', 'Masa 10', 'Mutfak yakınında 4 kişilik masa', 'Dolu');

-- 2. menu_items tablosu
CREATE TABLE menu_items (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100),
    description TEXT,
    price DECIMAL(10,2),
    image_url TEXT,
    category ENUM('Başlangıç', 'Ana Yemek', 'Tatlı', 'İçecek', 'Salata', 'Çorba') NOT NULL,
    is_available BOOLEAN DEFAULT TRUE
);

INSERT INTO menu_items (name, description, price, image_url, category, is_available) VALUES
('Margherita Pizza', 'Klasik domates soslu, mozzarella ve fesleğenli pizza', 125.00, 'https://cdn.shopify.com/s/files/1/0274/9503/9079/files/20220211142754-margherita-9920_5a73220e-4a1a-4d33-b38f-26e98e3cd986.jpg?v=1723650067', 'Ana Yemek', TRUE),
('Tavuk Burger', 'Özel soslu çıtır tavuk burger', 75.00, 'https://www.arbys.com.tr/cmsfiles/products/tavukburger-sandvic.png?v=166', 'Ana Yemek', TRUE),
('Patates Kızartması', 'Krokan çıtır patates', 35.00, 'https://cdn.ye-mek.net/App_UI/Img/out/650/2024/02/unlu-patates-kizartmasi-resimli-yemek-tarifi(11).jpg', 'Başlangıç', TRUE),
('Ayran', 'Soğuk ayran 300 ml', 15.00, 'https://static.ticimax.cloud/9247/uploads/urunresimleri/buyuk/ayran-032b56e5-6.jpg', 'İçecek', TRUE),
('Tost', 'Karışık tost', 50.00, 'https://www.diyetkolik.com/site_media/media/foodrecipe_images/kasarlisucuklutost.jpg', 'Ana Yemek', TRUE),
('Mercimek Çorbası', 'Geleneksel Türk mercimek çorbası', 45.00, 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQil0Ggd2wfUUCgK6u2W7MqMfwYxu-k3wWz9Q&s', 'Çorba', TRUE),
('Caesar Salata', 'Marul, parmesan, kruton ve özel sos', 65.00, 'https://d17wu0fn6x6rgz.cloudfront.net/img/w/tarif/mgt/tavuklu-sezar-salata.webp', 'Salata', TRUE),
('Künefe', 'Antep fıstıklı künefe', 85.00, 'https://cdn.kisikatesakademi.com.tr/image-cache/cache/recipe_main_image_large/https---cdn.kisikatesakademi.com.tr/recipe-media/5a81cbde14fc537b2f4f8134a937f82168914642.jpeg', 'Tatlı', TRUE),
('Limonata', 'Taze sıkılmış limonata', 35.00, 'https://i.lezzet.com.tr/images-xxlarge-recipe/ev-yapimi-konsantre-limonata-01e50b99-5890-411f-a4c2-997a71e8a5cc.jpg', 'İçecek', TRUE),
('Humus', 'Zeytinyağlı humus', 45.00, 'https://assets.tmecosys.com/image/upload/t_web_rdp_recipe_584x480/img/recipe/ras/Assets/e9964c08-1177-4cb9-880a-185e1eeee576/Derivates/22085e12-5a3b-4b0b-bf0e-5ad1c9a05017.jpg', 'Başlangıç', TRUE);

-- 3. orders tablosu
CREATE TABLE orders (
    id INT PRIMARY KEY AUTO_INCREMENT,
    status ENUM('Hazırlanıyor', 'Hazır', 'Teslim Edildi', 'İptal Edildi') DEFAULT 'Hazırlanıyor',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    table_id INT,
    payment_method ENUM('Nakit', 'Kredi Kartı', 'Banka Kartı', 'Mobil Ödeme'),
    payment_status ENUM('Ödenmedi', 'Ödendi', 'İptal Edildi') DEFAULT 'Ödenmedi',
    total_amount DECIMAL(10,2),
    notes TEXT,
    FOREIGN KEY (table_id) REFERENCES tables(id)
);

INSERT INTO orders (status, created_at, table_id, payment_method, payment_status, total_amount, notes) VALUES
('Hazır', '2024-05-13 12:30:00', 1, 'Kredi Kartı', 'Ödendi', 185.00, 'Ekstra sos istendi'),
('Hazır', '2024-05-13 13:15:00', 2, 'Nakit', 'Ödendi', 110.00, 'Vejetaryen menü'),
('Hazırlanıyor', '2024-05-13 14:00:00', 3, 'Kredi Kartı', 'Ödenmedi', 250.00, 'VIP müşteri'),
('Hazır ', '2024-05-13 15:30:00', 4, 'Banka Kartı', 'Ödendi', 160.00, NULL),
('Hazırlanıyor', '2024-05-13 16:45:00', 5, 'Mobil Ödeme', 'Ödenmedi', 95.00, 'Öğle menüsü'),
('İptal Edildi', '2024-05-13 17:30:00', 6, 'Kredi Kartı', 'İptal Edildi', 0.00, 'Müşteri iptal etti'),
('Hazır', '2024-05-13 18:15:00', 7, 'Nakit', 'Ödendi', 320.00, 'İş yemeği'),
('Hazırlanıyor', '2024-05-13 19:00:00', 8, 'Kredi Kartı', 'Ödenmedi', 180.00, 'Akşam yemeği'),
('Hazır', '2024-05-13 20:30:00', 9, 'Banka Kartı', 'Ödendi', 75.00, 'Öğrenci menüsü'),
('Hazır', '2024-05-13 21:15:00', 10, 'Mobil Ödeme', 'Ödendi', 450.00, 'Özel gün');

-- 4. order_items tablosu
CREATE TABLE order_items (
    id INT PRIMARY KEY AUTO_INCREMENT,
    order_id INT,
    menu_item_id INT,
    quantity INT,
    unit_price DECIMAL(10,2),
    notes TEXT,
    FOREIGN KEY (order_id) REFERENCES orders(id),
    FOREIGN KEY (menu_item_id) REFERENCES menu_items(id)
);

INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, notes) VALUES
(1, 1, 1, 125.00, 'Ekstra peynirli'),
(1, 3, 1, 35.00, 'Soslu'),
(1, 4, 1, 15.00, NULL),
(2, 7, 1, 65.00, 'Vejetaryen'),
(2, 9, 1, 35.00, NULL),
(3, 1, 1, 125.00, 'VIP servis'),
(3, 6, 1, 45.00, NULL),
(3, 8, 1, 85.00, 'Antep fıstıklı'),
(4, 2, 2, 75.00, 'Ekstra soslu'),
(4, 4, 1, 15.00, NULL);

-- 5. staff tablosu
CREATE TABLE staff (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    hire_date DATE NOT NULL,
    type ENUM('Admin', 'Mutfak', 'Garson', 'Kasiyer', 'Yönetici') NOT NULL,
    phone VARCHAR(20),
    email VARCHAR(100),
    address TEXT,
    salary DECIMAL(10,2),
    username VARCHAR(50) UNIQUE,
    password VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE
);

INSERT INTO staff (name, hire_date, type, phone, email, address, salary, username, password, is_active) VALUES
('Ali Kaya', '2024-03-28', 'Mutfak', '5551112233', 'ali@restaurant.com', 'Kadıköy, İstanbul', 8500.00, 'ali.kaya', 'mutfak123', TRUE),
('Zeynep Yılmaz', '2024-05-11', 'Garson', '5552223344', 'zeynep@restaurant.com', 'Beşiktaş, İstanbul', 7500.00, 'zeynep.yilmaz', 'garson123', TRUE),
('Mehmet Demir', '2023-11-29', 'Mutfak', '5553334455', 'mehmet@restaurant.com', 'Üsküdar, İstanbul', 9000.00, 'mehmet.demir', 'mutfak456', TRUE),
('Üzeyir Talha Kılıç', '2022-08-19', 'Yönetici', '5554445566', 'uzeyir@restaurant.com', 'Şişli, İstanbul', 12000.00, 'uzeyir.talha', 'yonetici123', TRUE),
('Can Öztürk', '2024-01-15', 'Kasiyer', '5555556677', 'can@restaurant.com', 'Bakırköy, İstanbul', 7000.00, 'can.ozturk', 'kasiyer123', TRUE),
('Ali Osman Taş', '2024-05-13', 'Admin', '5556667788', 'ali.osman@restaurant.com', 'Ataşehir, İstanbul', 15000.00, 'ali.osman', 'admin123', TRUE),
('Fatma Şahin', '2023-06-01', 'Garson', '5557778899', 'fatma@restaurant.com', 'Maltepe, İstanbul', 7500.00, 'fatma.sahin', 'garson456', TRUE),
('Mustafa Yıldız', '2023-09-15', 'Mutfak', '5558889900', 'mustafa@restaurant.com', 'Kartal, İstanbul', 8500.00, 'mustafa.yildiz', 'mutfak789', TRUE),
('Elif Arslan', '2024-02-01', 'Garson', '5559990011', 'elif@restaurant.com', 'Pendik, İstanbul', 7500.00, 'elif.arslan', 'garson789', TRUE),
('Selin Koç', '2023-12-01', 'Kasiyer', '5550001122', 'selin@restaurant.com', 'Tuzla, İstanbul', 7000.00, 'selin.koc', 'kasiyer456', TRUE);

-- 6. staff_schedule tablosu
CREATE TABLE staff_schedule (
    id INT PRIMARY KEY AUTO_INCREMENT,
    staff_id INT,
    start_datetime DATETIME NOT NULL,
    end_datetime DATETIME NOT NULL,
    FOREIGN KEY (staff_id) REFERENCES staff(id)
);

INSERT INTO staff_schedule (staff_id, start_datetime, end_datetime) VALUES
-- Ali Kaya'nın vardiyaları
(1, '2024-05-13 09:00:00', '2024-05-13 17:00:00'),
(1, '2024-05-14 09:00:00', '2024-05-14 17:00:00'),
(1, '2024-05-15 09:00:00', '2024-05-15 17:00:00'),
(1, '2024-05-16 09:00:00', '2024-05-16 17:00:00'),
(1, '2024-05-17 09:00:00', '2024-05-17 17:00:00'),
-- Gelecek hafta vardiyaları
(1, '2024-05-20 09:00:00', '2024-05-20 17:00:00'),
(1, '2024-05-21 09:00:00', '2024-05-21 17:00:00'),
(1, '2024-05-22 09:00:00', '2024-05-22 17:00:00'),
(1, '2024-05-23 09:00:00', '2024-05-23 17:00:00'),
(1, '2024-05-24 09:00:00', '2024-05-24 17:00:00'),

-- Zeynep Yılmaz'ın vardiyaları
(2, '2024-05-13 12:00:00', '2024-05-13 20:00:00'),
(2, '2024-05-14 12:00:00', '2024-05-14 20:00:00'),
(2, '2024-05-15 12:00:00', '2024-05-15 20:00:00'),
(2, '2024-05-16 12:00:00', '2024-05-16 20:00:00'),
(2, '2024-05-17 12:00:00', '2024-05-17 20:00:00'),
-- Gelecek hafta vardiyaları
(2, '2024-05-20 12:00:00', '2024-05-20 20:00:00'),
(2, '2024-05-21 12:00:00', '2024-05-21 20:00:00'),
(2, '2024-05-22 12:00:00', '2024-05-22 20:00:00'),
(2, '2024-05-23 12:00:00', '2024-05-23 20:00:00'),
(2, '2024-05-24 12:00:00', '2024-05-24 20:00:00'),

-- Diğer personel vardiyaları
(3, '2024-05-13 11:00:00', '2024-05-13 19:00:00'),
(4, '2024-05-13 10:00:00', '2024-05-13 18:00:00'),
(5, '2024-05-13 09:00:00', '2024-05-13 17:00:00'),
(6, '2024-05-13 08:00:00', '2024-05-13 16:00:00'),
(7, '2024-05-13 13:00:00', '2024-05-13 21:00:00');

-- 7. staff_leave tablosu
CREATE TABLE staff_leave (
    id INT PRIMARY KEY AUTO_INCREMENT,
    staff_id INT,
    leave_type ENUM('Yıllık İzin', 'Hastalık İzni', 'Mazeret İzni', 'Ücretsiz İzin') NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status ENUM('Beklemede', 'Onaylandı', 'Reddedildi') DEFAULT 'Beklemede',
    notes TEXT,
    FOREIGN KEY (staff_id) REFERENCES staff(id)
);

INSERT INTO staff_leave (staff_id, leave_type, start_date, end_date, status, notes) VALUES
(1, 'Yıllık İzin', '2024-06-01', '2024-06-07', 'Onaylandı', 'Yaz tatili'),
(2, 'Hastalık İzni', '2024-05-15', '2024-05-16', 'Onaylandı', 'Grip'),
(3, 'Mazeret İzni', '2024-05-20', '2024-05-20', 'Beklemede', 'Aile ziyareti'),
(4, 'Yıllık İzin', '2024-07-15', '2024-07-30', 'Onaylandı', 'Yaz tatili'),
(5, 'Ücretsiz İzin', '2024-06-10', '2024-06-12', 'Reddedildi', 'Kişisel nedenler');

-- 8. ingredients tablosu
CREATE TABLE ingredients (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    unit VARCHAR(20) NOT NULL,
    current_stock DECIMAL(10,2) DEFAULT 0,
    minimum_stock DECIMAL(10,2) DEFAULT 0,
    price_per_unit DECIMAL(10,2) NOT NULL,
    supplier VARCHAR(100),
    last_purchase_date DATE,
    expiry_date DATE
);

INSERT INTO ingredients (name, unit, current_stock, minimum_stock, price_per_unit, supplier, last_purchase_date, expiry_date) VALUES
('Un', 'kg', 50.00, 10.00, 15.00, 'ABC Gıda', '2024-05-01', '2024-12-31'),
('Peynir', 'kg', 20.00, 5.00, 120.00, 'XYZ Süt', '2024-05-05', '2024-06-15'),
('Domates Sosu', 'litre', 30.00, 5.00, 25.00, 'DEF Konserve', '2024-05-10', '2024-12-31'),
('Tavuk Göğsü', 'kg', 25.00, 8.00, 85.00, 'GHI Et', '2024-05-12', '2024-05-19'),
('Patates', 'kg', 40.00, 10.00, 12.00, 'JKL Sebze', '2024-05-11', '2024-06-01'),
('Ekmek', 'adet', 100.00, 20.00, 5.00, 'MNO Fırın', '2024-05-13', '2024-05-14'),
('Sucuk', 'kg', 15.00, 3.00, 180.00, 'PQR Et', '2024-05-10', '2024-06-10'),
('Kaşar Peyniri', 'kg', 18.00, 4.00, 140.00, 'STU Süt', '2024-05-08', '2024-06-08'),
('Tereyağı', 'kg', 10.00, 2.00, 160.00, 'VWX Süt', '2024-05-09', '2024-06-09'),
('Ayran', 'litre', 50.00, 10.00, 8.00, 'YZA Süt', '2024-05-12', '2024-05-19');

-- 9. menu_ingredients tablosu
CREATE TABLE menu_ingredients (
    id INT PRIMARY KEY AUTO_INCREMENT,
    menu_item_id INT,
    ingredient_id INT,
    quantity DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (menu_item_id) REFERENCES menu_items(id),
    FOREIGN KEY (ingredient_id) REFERENCES ingredients(id)
);

INSERT INTO menu_ingredients (menu_item_id, ingredient_id, quantity) VALUES
(1, 1, 0.3),  -- Margherita Pizza - Un
(1, 2, 0.2),  -- Margherita Pizza - Peynir
(1, 3, 0.1),  -- Margherita Pizza - Domates Sosu
(2, 4, 0.2),  -- Tavuk Burger - Tavuk Göğsü
(2, 6, 1.0),  -- Tavuk Burger - Ekmek
(3, 5, 0.3),  -- Patates Kızartması - Patates
(4, 10, 0.3), -- Ayran - Ayran
(5, 6, 2.0),  -- Tost - Ekmek
(5, 7, 0.1),  -- Tost - Sucuk
(5, 8, 0.1); -- Tost - Kaşar Peyniri

-- 10. inventory_transactions tablosu
CREATE TABLE inventory_transactions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    ingredient_id INT,
    transaction_type ENUM('Alım', 'Kullanım', 'Düzeltme', 'Fire') NOT NULL,
    quantity DECIMAL(10,2) NOT NULL,
    transaction_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    notes TEXT,
    FOREIGN KEY (ingredient_id) REFERENCES ingredients(id)
);

INSERT INTO inventory_transactions (ingredient_id, transaction_type, quantity, transaction_date, notes) VALUES
(1, 'Alım', 50.00, '2024-05-01 09:00:00', 'Aylık un alımı'),
(2, 'Alım', 20.00, '2024-05-01 09:30:00', 'Aylık peynir alımı'),
(1, 'Kullanım', -0.3, '2024-05-13 15:08:44', 'Margherita Pizza için kullanıldı'),
(2, 'Kullanım', -0.2, '2024-05-13 15:08:44', 'Margherita Pizza için kullanıldı'),
(4, 'Alım', 25.00, '2024-05-14 08:00:00', 'Haftalık tavuk alımı'),
(5, 'Alım', 40.00, '2024-05-14 08:30:00', 'Haftalık patates alımı'),
(4, 'Kullanım', -0.2, '2024-05-14 15:51:41', 'Tavuk Burger için kullanıldı'),
(5, 'Kullanım', -0.3, '2024-05-14 15:51:41', 'Patates Kızartması için kullanıldı'),
(3, 'Fire', -0.5, '2024-05-14 16:00:00', 'Kazara döküldü'),
(6, 'Düzeltme', 10.00, '2024-05-14 17:00:00', 'Stok sayımı düzeltmesi');
