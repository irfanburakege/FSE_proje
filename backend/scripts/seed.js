// backend/scripts/seed.js
const { faker } = require('@faker-js/faker/locale/tr'); // İsimlerin Türkçe olması için TR lokasyonunu ekledik
const db = require('../config/db');

async function seedDatabase() {
  try {
    console.log('Eski veriler temizleniyor...');
    
    await db.query(`
      TRUNCATE TABLE 
        audit_logs, lab_tests, imaging_exams, patient_flow, 
        appointments, doctors, nurses, departments, patients, users 
      RESTART IDENTITY CASCADE;
    `);
    console.log('Veritabanı başarıyla sıfırlandı! ✨\n');
    console.log('Şemaya uygun, Türkçe isimli yeni veriler üretiliyor...');

    const departments = [
      { name: 'Cardiology', icon: 'heart-pulse' },
      { name: 'Neurology', icon: 'brain' },
      { name: 'Internal Medicine', icon: 'stethoscope' },
      { name: 'Ophthalmology', icon: 'eye' },
      { name: 'Orthopedics', icon: 'bone' },
      { name: 'Emergency', icon: 'truck-medical' }
    ];
    
    const deptIds = [];
    for (const dept of departments) {
      const res = await db.query(
        'INSERT INTO departments (name, icon) VALUES ($1, $2) RETURNING id',
        [dept.name, dept.icon]
      );
      deptIds.push(res.rows[0].id);
    }
    console.log(`${departments.length} departman eklendi.`);

    const doctorIds = [];
    for (let i = 0; i < 20; i++) {
        const userRes = await db.query(
            `INSERT INTO users (name, email, password_hash, role) 
             VALUES ($1, $2, $3, $4) RETURNING id`,
            [
              `Dr. ${faker.person.firstName()} ${faker.person.lastName()}`, // İsimler Türkçe olacak
              `doctor${i}_${faker.internet.email()}`, 
              'hash123',
              'Doctor Session' 
            ]
        );
        const userId = userRes.rows[0].id;
        
        const randomDeptId = faker.helpers.arrayElement(deptIds);
        const docRes = await db.query(
            `INSERT INTO doctors (user_id, department_id, daily_patient_limit) 
             VALUES ($1, $2, $3) RETURNING id`,
            [userId, randomDeptId, faker.number.int({ min: 20, max: 25 })] 
        );
        doctorIds.push(docRes.rows[0].id);
    }
    console.log('20 doktor eklendi.');

    const nurseIds = [];
    for (let i = 0; i < 20; i++) {
        const userRes = await db.query(
            `INSERT INTO users (name, email, password_hash, role) 
             VALUES ($1, $2, $3, $4) RETURNING id`,
            [
              `Nurse ${faker.person.firstName()} ${faker.person.lastName()}`, // İsimler Türkçe olacak
              `nurse${i}_${faker.internet.email()}`, 
              'hash123',
              'Nurse Assistant' 
            ]
        );
        const userId = userRes.rows[0].id;
        
        const randomDeptId = faker.helpers.arrayElement(deptIds);
        const nurseRes = await db.query(
            `INSERT INTO nurses (user_id, department_id) 
             VALUES ($1, $2) RETURNING id`,
            [userId, randomDeptId]
        );
        nurseIds.push(nurseRes.rows[0].id);
    }
    console.log('20 hemşire eklendi.');

    const patientIds = [];
    for (let i = 0; i < 400; i++) { 
      const baseId = 10000000000 + i; 
      
      const res = await db.query(
        `INSERT INTO patients (name, national_id, phone_number) 
         VALUES ($1, $2, $3) RETURNING id`,
        [
          `${faker.person.firstName()} ${faker.person.lastName()}`,
          baseId.toString(), 
          '+90' + faker.string.numeric(10) // Türkiye formatında, VARCHAR(20) limitini aşmayan telefon numarası
        ]
      );
      patientIds.push(res.rows[0].id);
    }
    console.log('400 hasta eklendi.');

    // Hedeflenen tarihler: 04.05.2026 - 08.05.2026
    // JavaScript'te aylar 0'dan başlar (Ocak=0, ... Mayıs=4)
    const workDays = [
      new Date(2026, 4, 4),
      new Date(2026, 4, 5),
      new Date(2026, 4, 6),
      new Date(2026, 4, 7),
      new Date(2026, 4, 8)
    ];

    let totalAppointments = 0;
    
    // Her doktor için 5 iş gününü tek tek döngüye alıyoruz
    for (const doctorId of doctorIds) {
      for (const currentDay of workDays) {
        
        // Her doktora günde 6 ile 8 arası hasta atıyoruz. 
        // Toplamda: 20 Doktor * 5 Gün * ~7 Hasta = ~700 Randevu yapar (Eskisinin 2 katından biraz fazla)
        const dailyPatientCount = faker.number.int({ min: 6, max: 8 });
        
        for (let j = 0; j < dailyPatientCount; j++) {
          const finalStatus = faker.helpers.arrayElement([
            'Requested', 'Confirmed', 'Waiting', 'In Consultation', 
            'Assessment', 'Completed', 'Cancelled', 'No-Show'
          ]); 
          
          // O günün saat 09:00'ından başlayıp hastaları 30 dakikada bir yayıyoruz
          const appointmentDate = new Date(currentDay);
          appointmentDate.setHours(9, 0, 0, 0); 
          appointmentDate.setMinutes(j * 30); 

          const res = await db.query(
            `INSERT INTO appointments (patient_id, doctor_id, appointment_time, status, priority_level, triage_level) 
             VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
            [
              faker.helpers.arrayElement(patientIds),
              doctorId,
              appointmentDate,
              'Requested', 
              faker.helpers.arrayElement(['Normal', 'Emergency', 'Delayed']),
              faker.helpers.arrayElement([
                'Priority 1 - Resuscitation', 'Priority 2 - Emergency', 
                'Priority 3 - Urgent', 'Priority 4 - Less Urgent', 'Priority 5 - Non-Urgent'
              ])
            ]
          );
          
          const appointmentId = res.rows[0].id;
          totalAppointments++;

          if (finalStatus !== 'Requested') {
              await db.query(`UPDATE appointments SET status = $1 WHERE id = $2`, [finalStatus, appointmentId]);
          }

          if (['Assessment', 'Completed'].includes(finalStatus)) {
              if(faker.datatype.boolean()) {
                  await db.query(
                    `INSERT INTO lab_tests (appointment_id, test_type, status, assigned_nurse_id) 
                     VALUES ($1, $2, $3, $4)`,
                    [
                        appointmentId, 
                        faker.helpers.arrayElement(['Complete Blood Count', 'Urinalysis', 'Lipid Panel', 'Metabolic Panel']), 
                        faker.helpers.arrayElement(['Pending', 'In Progress', 'Completed']),
                        faker.helpers.arrayElement(nurseIds)
                    ]
                  );
              }
              if(faker.datatype.boolean()) {
                  await db.query(
                    `INSERT INTO imaging_exams (appointment_id, exam_type, status, assigned_nurse_id) 
                     VALUES ($1, $2, $3, $4)`,
                    [
                        appointmentId, 
                        faker.helpers.arrayElement(['X-Ray', 'MRI', 'CT Scan', 'Ultrasound']), 
                        faker.helpers.arrayElement(['Pending', 'In Progress', 'Completed']),
                        faker.helpers.arrayElement(nurseIds)
                    ]
                  );
              }
          }
        }
      }
    }
    console.log(`${totalAppointments} randevu, 04.05.2026 - 08.05.2026 haftasına özel olarak eklendi.`);
    console.log('Tüm işlemler başarıyla tamamlandı! 🚀');

  } catch (error) {
    console.error('Hata oluştu:', error);
  }
}

seedDatabase();