INSERT INTO departments (name, icon) VALUES ('Cardiology', 'heart-pulse'), ('Neurology', 'brain'), ('Emergency', 'truck-medical');


INSERT INTO users (name, email, password_hash, role) VALUES
('Admin Sefa', 'admin@central.com', 'hash123', 'Hospital Administrator'),
('Resepsiyonist Ayşe', 'recep@central.com', 'hash123', 'Reception Desk'),
('Dr. Mehmet', 'mehmet@central.com', 'hash123', 'Doctor Session'),
('Hemşire Canan', 'canan@central.com', 'hash123', 'Nurse Assistant');


INSERT INTO doctors (user_id, department_id, daily_patient_limit)
VALUES (3, 1, 15);

INSERT INTO nurses (user_id, department_id)
VALUES (4, 1);

INSERT INTO patients (name, national_id, phone_number)
VALUES ('Sefa Sahiner', '12345678901', '555-123-4567');

INSERT INTO appointments (patient_id, doctor_id, appointment_time, status, priority_level)
VALUES (1, 1, CURRENT_TIMESTAMP, 'Requested', 'Normal');


UPDATE appointments SET status = 'Confirmed' WHERE id = 1;
SELECT * FROM patient_flow;


UPDATE appointments SET status = 'Waiting' WHERE id = 1;
SELECT * FROM patient_flow;


UPDATE appointments SET status = 'In Consultation' WHERE id = 1;
SELECT * FROM patient_flow;


UPDATE appointments SET status = 'Assessment' WHERE id = 1;
INSERT INTO lab_tests (appointment_id, test_type, status) VALUES (1, 'Blood Count', 'Pending');


UPDATE appointments SET status = 'Completed' WHERE id = 1;
SELECT * FROM patient_flow;