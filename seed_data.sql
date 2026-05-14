SET client_encoding = 'UTF8';

-- DEPARTMENTS (REQ-27: General Practice, Cardiology, Orthopedics, Pediatrics, Neurology)
-- slot_duration: 15 or 30 minutes per department (REQ-28)
INSERT INTO departments (name, icon, slot_duration) VALUES
('General Practice', 'stethoscope', 15),
('Cardiology',       'heart-pulse',  30),
('Orthopedics',      'bone',         30),
('Pediatrics',       'baby',         15),
('Neurology',        'brain',        30);

-- USERS
INSERT INTO users (name, email, password_hash, role) VALUES
('Admin Sefa',          'admin@central.com',      'admin123',  'Hospital Administrator'),
('Resepsiyonist Ayşe',  'recep@central.com',      'recep123',  'Reception Desk'),
('Dr. Mehmet Yılmaz',   'mehmet@central.com',     'doctor123', 'Doctor Session'),
('Dr. Ayşe Kaya',       'ayse.kaya@central.com',  'doctor123', 'Doctor Session'),
('Dr. Can Demir',       'can.demir@central.com',  'doctor123', 'Doctor Session'),
('Dr. Fatma Çelik',     'fatma@central.com',      'doctor123', 'Doctor Session'),
('Dr. Ali Arslan',      'ali@central.com',        'doctor123', 'Doctor Session'),
('Hemşire Canan',       'canan@central.com',      'nurse123',  'Nurse Assistant');

-- DOCTORS (one per department)
INSERT INTO doctors (user_id, department_id, daily_patient_limit) VALUES
(3, 1, 20),  -- Dr. Mehmet  → General Practice
(4, 2, 15),  -- Dr. Ayşe    → Cardiology
(5, 3, 12),  -- Dr. Can     → Orthopedics
(6, 4, 20),  -- Dr. Fatma   → Pediatrics
(7, 5, 15);  -- Dr. Ali     → Neurology

-- NURSES
INSERT INTO nurses (user_id, department_id) VALUES (8, 1);

-- PATIENTS
INSERT INTO patients (name, national_id, phone_number) VALUES
('Sefa Sahiner',    '12345678901', '555-123-4567'),
('Ali Yılmaz',      '23456789012', '555-234-5678'),
('Zeynep Kara',     '34567890123', '555-345-6789'),
('Murat Öztürk',    '45678901234', '555-456-7890'),
('Elif Demir',      '56789012345', '555-567-8901');

