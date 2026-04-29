const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

const app = express();
const port = 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Request logger middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  if (req.body && Object.keys(req.body).length > 0) {
    console.log('Request Body:', JSON.stringify(req.body, null, 2));
  }
  next();
});

// MySQL bağlantısı               //! Değiştir
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'aliosman123',
  database: 'Restaurant_ordering'
});

// Bağlantıyı test et
db.connect((err) => {
  if (err) {
    console.error('MySQL bağlantı hatası:', err);
    return;
  }
  console.log('MySQL veritabanına başarıyla bağlandı');
});

// 1. Menüdeki tüm ürünleri getir
app.get('/menu', (req, res) => {
  console.log('Menü ürünleri getiriliyor...');
  db.query('SELECT * FROM menu_items', (err, results) => {
    if (err) {
      console.error('Menü getirme hatası:', err);
      res.status(500).json({ error: err.message });
      return;
    }
    console.log(`${results.length} adet menü ürünü bulundu`);
    res.json(results);
  });
});

// 1b. Menüdeki tüm ürünleri (menu_items) getir
app.get('/menu_items', (req, res) => {
  console.log('Menü ürünleri getiriliyor...');
  db.query('SELECT * FROM menu_items', (err, results) => {
    if (err) {
      console.error('Veritabanı hatası:', err);
      return res.status(500).json({ error: 'Menü ürünleri alınırken bir hata oluştu.' });
    }
    console.log(`${results.length} adet menü ürünü bulundu`);
    res.json(results);
  });
});

// Menüye yeni ürün ekle
app.post('/menu_items', (req, res) => {
  const { name, description, price, image_url } = req.body;
  console.log('Yeni menü ürünü ekleniyor:', { name, description, price, image_url });

  // Temel validasyon
  if (!name || !description || !price) {
    console.log('Validasyon hatası: Eksik alanlar');
    return res.status(400).json({ error: 'Lütfen tüm zorunlu alanları doldurun.' });
  }

  db.query(
    'INSERT INTO menu_items (name, description, price, image_url) VALUES (?, ?, ?, ?)',
    [name, description, price, image_url || null],
    (err, result) => {
      if (err) {
        console.error('Ürün ekleme hatası:', err);
        return res.status(500).json({ error: 'Ürün eklenirken bir hata oluştu.' });
      }
      console.log('Yeni ürün başarıyla eklendi. ID:', result.insertId);
      res.status(201).json({ message: 'Ürün başarıyla eklendi', id: result.insertId });
    }
  );
});

// 2. Yeni sipariş oluştur
app.post('/order', (req, res) => {
  const { table_id, order_items, total_amount, status, payment_status, notes, payment_method } = req.body;

  db.query(
    'INSERT INTO orders (table_id, total_amount, status, payment_status, notes, payment_method, created_at) VALUES (?, ?, ?, ?, ?, ?, NOW())',
    [table_id, total_amount, status, payment_status, notes, payment_method],
    (err, result) => {
      if (err) {
        console.error('Sipariş oluşturma hatası:', err);
        res.status(500).json({ error: err.message });
        return;
      }

      const orderId = result.insertId;
      const values = order_items.map(item => [
        orderId,
        item.menu_item_id,
        item.quantity,
        item.unit_price
      ]);

      db.query(
        'INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price) VALUES ?',
        [values],
        (err) => {
          if (err) {
            console.error('Sipariş detayları oluşturma hatası:', err);
            res.status(500).json({ error: err.message });
            return;
          }
          res.json({ id: orderId, message: 'Sipariş başarıyla oluşturuldu' });
        }
      );
    }
  );
});

// 3. Mutfak için siparişleri listele (her siparişin altında ürünler dizi olarak, masa adı ile)
app.get('/orders', (req, res) => {
  db.query(
    `SELECT o.id as order_id, o.status, o.created_at, o.table_id, o.notes,
            t.name as table_name,
            oi.menu_item_id, oi.quantity,
            m.name as item_name
     FROM orders o
     JOIN tables t ON o.table_id = t.id
     JOIN order_items oi ON o.id = oi.order_id
     JOIN menu_items m ON oi.menu_item_id = m.id
     ORDER BY o.created_at DESC, o.id DESC`,
    (err, results) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      // Gruplama
      const orders = [];
      const map = {};
      for (const row of results) {
        if (!map[row.order_id]) {
          map[row.order_id] = {
            id: row.order_id,
            status: row.status,
            created_at: row.created_at,
            table_id: row.table_id,
            table_name: row.table_name,
            notes: row.notes,
            items: []
          };
          orders.push(map[row.order_id]);
        }
        map[row.order_id].items.push({
          menu_item_id: row.menu_item_id,
          name: row.item_name,
          quantity: row.quantity
        });
      }
      res.json(orders);
    }
  );
});

// 4. Sipariş durumunu güncelle
app.put('/order/:id/status', (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  // Status değerlerinin geçerliliğini kontrol et
  const validStatuses = ['Hazırlanıyor', 'Hazır', 'Teslim Edildi', 'İptal Edildi'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Geçersiz sipariş durumu.' });
  }

  db.query(
    'UPDATE orders SET status = ? WHERE id = ?',
    [status, id],
    (err, result) => {
      if (err) {
        console.error('Sipariş durumu güncelleme hatası:', err);
        res.status(500).json({ error: err.message });
        return;
      }
      if (result.affectedRows === 0) {
        res.status(404).json({ error: 'Sipariş bulunamadı' });
        return;
      }
      res.json({ message: 'Sipariş durumu güncellendi' });
    }
  );
});

// Menü ürününü sil
app.delete('/menu_items/:id', (req, res) => {
  const { id } = req.params;
  
  // Önce ilişkili kayıtları sil
  db.query('DELETE FROM order_items WHERE menu_item_id = ?', [id], (err) => {
    if (err) {
      console.error('Sipariş detayları silme hatası:', err);
      return res.status(500).json({ error: 'Ürün silinirken bir hata oluştu.' });
    }

    // Menü malzemelerini sil
    db.query('DELETE FROM menu_ingredients WHERE menu_item_id = ?', [id], (err) => {
      if (err) {
        console.error('Menü malzemeleri silme hatası:', err);
        return res.status(500).json({ error: 'Ürün silinirken bir hata oluştu.' });
      }

      // Son olarak menü ürününü sil
      db.query('DELETE FROM menu_items WHERE id = ?', [id], (err, result) => {
        if (err) {
          console.error('Menü ürünü silme hatası:', err);
          return res.status(500).json({ error: 'Ürün silinirken bir hata oluştu.' });
        }
        if (result.affectedRows === 0) {
          return res.status(404).json({ error: 'Ürün bulunamadı.' });
        }
        res.json({ message: 'Ürün başarıyla silindi' });
      });
    });
  });
});

// Menü ürününü güncelle
app.put('/menu_items/:id', (req, res) => {
  const { id } = req.params;
  const { name, description, price, image_url } = req.body;

  // Temel validasyon
  if (!name || !description || !price) {
    return res.status(400).json({ error: 'Lütfen tüm zorunlu alanları doldurun.' });
  }

  db.query(
    'UPDATE menu_items SET name = ?, description = ?, price = ?, image_url = ? WHERE id = ?',
    [name, description, price, image_url || null, id],
    (err, result) => {
      if (err) {
        console.error('Veritabanı hatası:', err);
        return res.status(500).json({ error: 'Ürün güncellenirken bir hata oluştu.' });
      }
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Ürün bulunamadı.' });
      }
      res.json({ message: 'Ürün başarıyla güncellendi' });
    }
  );
});

// Siparişi sil
app.delete('/orders/:id', (req, res) => {
  const { id } = req.params;
  
  // Önce order_items tablosundan ilgili siparişin detaylarını sil
  db.query('DELETE FROM order_items WHERE order_id = ?', [id], (err) => {
    if (err) {
      console.error('Veritabanı hatası:', err);
      return res.status(500).json({ error: 'Sipariş detayları silinirken bir hata oluştu.' });
    }

    // Sonra orders tablosundan siparişi sil
    db.query('DELETE FROM orders WHERE id = ?', [id], (err, result) => {
      if (err) {
        console.error('Veritabanı hatası:', err);
        return res.status(500).json({ error: 'Sipariş silinirken bir hata oluştu.' });
      }
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Sipariş bulunamadı.' });
      }
      res.json({ message: 'Sipariş başarıyla silindi' });
    });
  });
});

// Siparişi (masa numarası ve ürünler) güncelle
app.put('/orders/:id', (req, res) => {
  const { id } = req.params;
  const { table_id, items } = req.body; // items: [{menu_item_id, quantity}, ...]

  if (!table_id || !Array.isArray(items)) {
    return res.status(400).json({ error: 'Eksik veya hatalı veri.' });
  }

  // Önce masa id'sini güncelle
  db.query('UPDATE orders SET table_id = ? WHERE id = ?', [table_id, id], (err, result) => {
    if (err) {
      return res.status(500).json({ error: 'Masa güncellenemedi.' });
    }

    // Siparişin eski ürünlerini sil
    db.query('DELETE FROM order_items WHERE order_id = ?', [id], (err) => {
      if (err) {
        return res.status(500).json({ error: 'Sipariş ürünleri silinemedi.' });
      }

      // Yeni ürünleri ekle
      if (items.length === 0) {
        return res.json({ message: 'Sipariş güncellendi (ürünsüz).' });
      }
      const values = items.map(item => [id, item.menu_item_id, item.quantity]);
      db.query('INSERT INTO order_items (order_id, menu_item_id, quantity) VALUES ?', [values], (err) => {
        if (err) {
          return res.status(500).json({ error: 'Sipariş ürünleri eklenemedi.' });
        }
        res.json({ message: 'Sipariş başarıyla güncellendi.' });
      });
    });
  });
});

// Tüm masaları getir
app.get('/tables', (req, res) => {
  db.query('SELECT * FROM tables', (err, results) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(results);
  });
});

// Belirli bir masayı getir
app.get('/tables/:id', (req, res) => {
  const { id } = req.params;
  console.log('Masa bilgisi getiriliyor. Masa ID:', id);

  db.query('SELECT * FROM tables WHERE id = ?', [id], (err, results) => {
    if (err) {
      console.error('Masa bilgisi getirme hatası:', err);
      res.status(500).json({ error: err.message });
      return;
    }
    if (results.length === 0) {
      console.log('Masa bulunamadı. ID:', id);
      res.status(404).json({ error: 'Masa bulunamadı' });
      return;
    }
    console.log('Masa bilgisi başarıyla getirildi:', results[0]);
    res.json(results[0]);
  });
});

// Yeni masa ekle
app.post('/tables', (req, res) => {
  const { name, type, description } = req.body;
  
  if (!name || !type) {
    return res.status(400).json({ error: 'Masa adı ve tipi zorunludur' });
  }

  const sql = 'INSERT INTO tables (name, type, description) VALUES (?, ?, ?)';
  db.query(sql, [name, type, description], (err, result) => {
    if (err) {
      console.error('Masa eklenirken hata:', err);
      return res.status(500).json({ error: 'Masa eklenirken bir hata oluştu' });
    }
    res.status(201).json({ id: result.insertId, name, type, description });
  });
});

// Masa güncelle
app.put('/tables/:id', (req, res) => {
  const { id } = req.params;
  const { name, type, description } = req.body;

  if (!name || !type) {
    return res.status(400).json({ error: 'Masa adı ve tipi zorunludur.' });
  }

  db.query(
    'UPDATE tables SET name = ?, type = ?, description = ? WHERE id = ?',
    [name, type, description, id],
    (err, result) => {
      if (err) {
        return res.status(500).json({ error: 'Masa güncellenirken bir hata oluştu.' });
      }
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Masa bulunamadı.' });
      }
      res.json({ message: 'Masa başarıyla güncellendi.' });
    }
  );
});

// Masa sil
app.delete('/tables/:id', (req, res) => {
  const { id } = req.params;
  db.query('DELETE FROM tables WHERE id = ?', [id], (err, result) => {
    if (err) {
      return res.status(500).json({ error: 'Masa silinirken bir hata oluştu.' });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Masa bulunamadı.' });
    }
    res.json({ message: 'Masa başarıyla silindi.' });
  });
});

// Tüm çalışanları getir
app.get('/staff', (req, res) => {
  db.query('SELECT * FROM staff', (err, results) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(results);
  });
});

// Yeni çalışan ekle
app.post('/staff', (req, res) => {
  const { name, hire_date, type, phone, email, address, salary, username, password, is_active } = req.body;
  
  if (!name || !hire_date || !type) {
    return res.status(400).json({ error: 'İsim, işe başlama tarihi ve çalışan tipi zorunludur.' });
  }

  db.query(
    `INSERT INTO staff (
      name, 
      hire_date, 
      type, 
      phone, 
      email, 
      address, 
      salary, 
      username, 
      password, 
      is_active
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      name,
      hire_date,
      type,
      phone || null,
      email || null,
      address || null,
      salary || null,
      username || null,
      password || null,
      is_active !== undefined ? is_active : true
    ],
    (err, result) => {
      if (err) {
        console.error('Error adding staff:', err);
        return res.status(500).json({ error: 'Çalışan eklenirken bir hata oluştu.' });
      }
      res.status(201).json({ message: 'Çalışan başarıyla eklendi.', id: result.insertId });
    }
  );
});

// Çalışan sil
app.delete('/staff/:id', (req, res) => {
  const { id } = req.params;
  
  // First delete related records
  db.query('DELETE FROM staff_schedule WHERE staff_id = ?', [id], (err) => {
    if (err) {
      console.error('Error deleting staff schedule:', err);
      return res.status(500).json({ error: 'Çalışan programı silinirken bir hata oluştu.' });
    }
    
    // Then delete staff leave records
    db.query('DELETE FROM staff_leave WHERE staff_id = ?', [id], (err) => {
      if (err) {
        console.error('Error deleting staff leave:', err);
        return res.status(500).json({ error: 'Çalışan izinleri silinirken bir hata oluştu.' });
      }
      
      // Finally delete the staff member
      db.query('DELETE FROM staff WHERE id = ?', [id], (err, result) => {
        if (err) {
          console.error('Error deleting staff:', err);
          return res.status(500).json({ error: 'Çalışan silinirken bir hata oluştu.' });
        }
        if (result.affectedRows === 0) {
          return res.status(404).json({ error: 'Çalışan bulunamadı.' });
        }
        res.json({ message: 'Çalışan başarıyla silindi.' });
      });
    });
  });
});

// Çalışan güncelle
app.put('/staff/:id', (req, res) => {
  const { id } = req.params;
  const { name, hire_date, type, phone, email, address, salary, username, password, is_active } = req.body;

  if (!name || !hire_date || !type) {
    return res.status(400).json({ error: 'İsim, işe başlama tarihi ve çalışan tipi zorunludur.' });
  }

  db.query(
    `UPDATE staff 
     SET name = ?, 
         hire_date = ?, 
         type = ?,
         phone = ?,
         email = ?,
         address = ?,
         salary = ?,
         username = ?,
         password = ?,
         is_active = ?
     WHERE id = ?`,
    [name, hire_date, type, phone, email, address, salary, username, password, is_active, id],
    (err, result) => {
      if (err) {
        console.error('Update error:', err);
        return res.status(500).json({ error: 'Çalışan güncellenirken bir hata oluştu.' });
      }
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Çalışan bulunamadı.' });
      }
      res.json({ message: 'Çalışan başarıyla güncellendi.' });
    }
  );
});

// Personel girişi
app.post('/staff_login', (req, res) => {
  const { username, password } = req.body;
  db.query(
    'SELECT id, name, type, username FROM staff WHERE username = ? AND password = ? AND is_active = TRUE',
    [username, password],
    (err, results) => {
      if (err) {
        return res.status(500).json({ error: 'Veritabanı hatası.' });
      }
      if (results.length === 0) {
        return res.status(401).json({ error: 'Kullanıcı adı veya şifre hatalı.' });
      }
      res.json({ 
        message: 'Giriş başarılı', 
        staff: {
          id: results[0].id,
          name: results[0].name,
          type: results[0].type,
          username: results[0].username
        }
      });
    }
  );
});

// En popüler ürünleri getir
app.get('/popular_items', (req, res) => {
  db.query(
    `SELECT m.id, m.name, m.description, m.price, m.image_url, COALESCE(SUM(oi.quantity), 0) as total_ordered
     FROM menu_items m
     LEFT JOIN order_items oi ON m.id = oi.menu_item_id
     GROUP BY m.id, m.name, m.description, m.price, m.image_url
     ORDER BY total_ordered DESC, m.name ASC`,
    (err, results) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json(results);
    }
  );
});

// CUSTOMERS CRUD OPERATIONS
// Get all customers
app.get('/customers', (req, res) => {
  db.query('SELECT * FROM customers', (err, results) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(results);
  });
});

// Add new customer
app.post('/customers', (req, res) => {
  const { name, phone, email, address, notes } = req.body;
  
  if (!name || !phone) {
    return res.status(400).json({ error: 'Name and phone are required.' });
  }

  db.query(
    'INSERT INTO customers (name, phone, email, address, notes) VALUES (?, ?, ?, ?, ?)',
    [name, phone, email || null, address || null, notes || null],
    (err, result) => {
      if (err) {
        return res.status(500).json({ error: 'Error adding customer.' });
      }
      res.status(201).json({ message: 'Customer added successfully', id: result.insertId });
    }
  );
});

// Update customer
app.put('/customers/:id', (req, res) => {
  const { id } = req.params;
  const { name, phone, email, address, notes } = req.body;

  if (!name || !phone) {
    return res.status(400).json({ error: 'Name and phone are required.' });
  }

  db.query(
    'UPDATE customers SET name = ?, phone = ?, email = ?, address = ?, notes = ? WHERE id = ?',
    [name, phone, email || null, address || null, notes || null, id],
    (err, result) => {
      if (err) {
        return res.status(500).json({ error: 'Error updating customer.' });
      }
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Customer not found.' });
      }
      res.json({ message: 'Customer updated successfully' });
    }
  );
});

// Delete customer
app.delete('/customers/:id', (req, res) => {
  const { id } = req.params;
  db.query('DELETE FROM customers WHERE id = ?', [id], (err, result) => {
    if (err) {
      return res.status(500).json({ error: 'Error deleting customer.' });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Customer not found.' });
    }
    res.json({ message: 'Customer deleted successfully' });
  });
});

// STAFF SCHEDULE CRUD OPERATIONS
// Get all staff schedules
app.get('/staff_schedule', (req, res) => {
  db.query('SELECT * FROM staff_schedule', (err, results) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(results);
  });
});

// Add new staff schedule
app.post('/staff_schedule', (req, res) => {
  const { staff_id, start_datetime, end_datetime } = req.body;
  
  if (!staff_id || !start_datetime || !end_datetime) {
    return res.status(400).json({ error: 'Staff ID, start datetime, and end datetime are required.' });
  }

  db.query(
    'INSERT INTO staff_schedule (staff_id, start_datetime, end_datetime) VALUES (?, ?, ?)',
    [staff_id, start_datetime, end_datetime],
    (err, result) => {
      if (err) {
        return res.status(500).json({ error: 'Error adding staff schedule.' });
      }
      res.status(201).json({ message: 'Staff schedule added successfully', id: result.insertId });
    }
  );
});

// Update staff schedule
app.put('/staff_schedule/:id', (req, res) => {
  const { id } = req.params;
  const { staff_id, start_datetime, end_datetime } = req.body;

  if (!staff_id || !start_datetime || !end_datetime) {
    return res.status(400).json({ error: 'Staff ID, start datetime, and end datetime are required.' });
  }

  db.query(
    'UPDATE staff_schedule SET staff_id = ?, start_datetime = ?, end_datetime = ? WHERE id = ?',
    [staff_id, start_datetime, end_datetime, id],
    (err, result) => {
      if (err) {
        return res.status(500).json({ error: 'Error updating staff schedule.' });
      }
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Staff schedule not found.' });
      }
      res.json({ message: 'Staff schedule updated successfully' });
    }
  );
});

// Delete staff schedule
app.delete('/staff_schedule/:id', (req, res) => {
  const { id } = req.params;
  db.query('DELETE FROM staff_schedule WHERE id = ?', [id], (err, result) => {
    if (err) {
      return res.status(500).json({ error: 'Error deleting staff schedule.' });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Staff schedule not found.' });
    }
    res.json({ message: 'Staff schedule deleted successfully' });
  });
});

// STAFF LEAVE CRUD OPERATIONS
// Get all staff leaves
app.get('/staff_leave', (req, res) => {
  db.query('SELECT * FROM staff_leave', (err, results) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(results);
  });
});

// Add new staff leave
app.post('/staff_leave', (req, res) => {
  const { staff_id, leave_type, start_date, end_date, notes } = req.body;
  
  if (!staff_id || !leave_type || !start_date || !end_date) {
    return res.status(400).json({ error: 'Staff ID, leave type, start date, and end date are required.' });
  }

  db.query(
    'INSERT INTO staff_leave (staff_id, leave_type, start_date, end_date, notes) VALUES (?, ?, ?, ?, ?)',
    [staff_id, leave_type, start_date, end_date, notes || null],
    (err, result) => {
      if (err) {
        return res.status(500).json({ error: 'Error adding staff leave.' });
      }
      res.status(201).json({ message: 'Staff leave added successfully', id: result.insertId });
    }
  );
});

// Update staff leave
app.put('/staff_leave/:id', (req, res) => {
  const { id } = req.params;
  const { staff_id, leave_type, start_date, end_date, status, notes } = req.body;

  if (!staff_id || !leave_type || !start_date || !end_date) {
    return res.status(400).json({ error: 'Staff ID, leave type, start date, and end date are required.' });
  }

  db.query(
    'UPDATE staff_leave SET staff_id = ?, leave_type = ?, start_date = ?, end_date = ?, status = ?, notes = ? WHERE id = ?',
    [staff_id, leave_type, start_date, end_date, status || 'Beklemede', notes || null, id],
    (err, result) => {
      if (err) {
        return res.status(500).json({ error: 'Error updating staff leave.' });
      }
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Staff leave not found.' });
      }
      res.json({ message: 'Staff leave updated successfully' });
    }
  );
});

// Delete staff leave
app.delete('/staff_leave/:id', (req, res) => {
  const { id } = req.params;
  db.query('DELETE FROM staff_leave WHERE id = ?', [id], (err, result) => {
    if (err) {
      return res.status(500).json({ error: 'Error deleting staff leave.' });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Staff leave not found.' });
    }
    res.json({ message: 'Staff leave deleted successfully' });
  });
});

// INGREDIENTS CRUD OPERATIONS
// Get all ingredients
app.get('/ingredients', (req, res) => {
  db.query('SELECT * FROM ingredients', (err, results) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(results);
  });
});

// Add new ingredient
app.post('/ingredients', (req, res) => {
  const { name, unit, current_stock, minimum_stock, price_per_unit, supplier, last_purchase_date, expiry_date } = req.body;
  
  if (!name || !unit || !price_per_unit) {
    return res.status(400).json({ error: 'Name, unit, and price per unit are required.' });
  }

  db.query(
    'INSERT INTO ingredients (name, unit, current_stock, minimum_stock, price_per_unit, supplier, last_purchase_date, expiry_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [name, unit, current_stock || 0, minimum_stock || 0, price_per_unit, supplier || null, last_purchase_date || null, expiry_date || null],
    (err, result) => {
      if (err) {
        return res.status(500).json({ error: 'Error adding ingredient.' });
      }
      res.status(201).json({ message: 'Ingredient added successfully', id: result.insertId });
    }
  );
});

// Update ingredient
app.put('/ingredients/:id', (req, res) => {
  const { id } = req.params;
  const { name, unit, current_stock, minimum_stock, price_per_unit, supplier, last_purchase_date, expiry_date } = req.body;

  if (!name || !unit || !price_per_unit) {
    return res.status(400).json({ error: 'Name, unit, and price per unit are required.' });
  }

  db.query(
    'UPDATE ingredients SET name = ?, unit = ?, current_stock = ?, minimum_stock = ?, price_per_unit = ?, supplier = ?, last_purchase_date = ?, expiry_date = ? WHERE id = ?',
    [name, unit, current_stock || 0, minimum_stock || 0, price_per_unit, supplier || null, last_purchase_date || null, expiry_date || null, id],
    (err, result) => {
      if (err) {
        return res.status(500).json({ error: 'Error updating ingredient.' });
      }
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Ingredient not found.' });
      }
      res.json({ message: 'Ingredient updated successfully' });
    }
  );
});

// Delete ingredient
app.delete('/ingredients/:id', (req, res) => {
  const { id } = req.params;
  db.query('DELETE FROM ingredients WHERE id = ?', [id], (err, result) => {
    if (err) {
      return res.status(500).json({ error: 'Error deleting ingredient.' });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Ingredient not found.' });
    }
    res.json({ message: 'Ingredient deleted successfully' });
  });
});

// MENU INGREDIENTS CRUD OPERATIONS
// Get all menu ingredients
app.get('/menu_ingredients', (req, res) => {
  db.query('SELECT * FROM menu_ingredients', (err, results) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(results);
  });
});

// Add new menu ingredient
app.post('/menu_ingredients', (req, res) => {
  const { menu_item_id, ingredient_id, quantity } = req.body;
  
  if (!menu_item_id || !ingredient_id || !quantity) {
    return res.status(400).json({ error: 'Menu item ID, ingredient ID, and quantity are required.' });
  }

  db.query(
    'INSERT INTO menu_ingredients (menu_item_id, ingredient_id, quantity) VALUES (?, ?, ?)',
    [menu_item_id, ingredient_id, quantity],
    (err, result) => {
      if (err) {
        return res.status(500).json({ error: 'Error adding menu ingredient.' });
      }
      res.status(201).json({ message: 'Menu ingredient added successfully', id: result.insertId });
    }
  );
});

// Update menu ingredient
app.put('/menu_ingredients/:id', (req, res) => {
  const { id } = req.params;
  const { menu_item_id, ingredient_id, quantity } = req.body;

  if (!menu_item_id || !ingredient_id || !quantity) {
    return res.status(400).json({ error: 'Menu item ID, ingredient ID, and quantity are required.' });
  }

  db.query(
    'UPDATE menu_ingredients SET menu_item_id = ?, ingredient_id = ?, quantity = ? WHERE id = ?',
    [menu_item_id, ingredient_id, quantity, id],
    (err, result) => {
      if (err) {
        return res.status(500).json({ error: 'Error updating menu ingredient.' });
      }
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Menu ingredient not found.' });
      }
      res.json({ message: 'Menu ingredient updated successfully' });
    }
  );
});

// Delete menu ingredient
app.delete('/menu_ingredients/:id', (req, res) => {
  const { id } = req.params;
  db.query('DELETE FROM menu_ingredients WHERE id = ?', [id], (err, result) => {
    if (err) {
      return res.status(500).json({ error: 'Error deleting menu ingredient.' });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Menu ingredient not found.' });
    }
    res.json({ message: 'Menu ingredient deleted successfully' });
  });
});

// INVENTORY TRANSACTIONS CRUD OPERATIONS
// Get all inventory transactions
app.get('/inventory_transactions', (req, res) => {
  db.query('SELECT * FROM inventory_transactions', (err, results) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(results);
  });
});

// Add new inventory transaction
app.post('/inventory_transactions', (req, res) => {
  const { ingredient_id, transaction_type, quantity, notes } = req.body;
  
  if (!ingredient_id || !transaction_type || !quantity) {
    return res.status(400).json({ error: 'Ingredient ID, transaction type, and quantity are required.' });
  }

  db.query(
    'INSERT INTO inventory_transactions (ingredient_id, transaction_type, quantity, notes) VALUES (?, ?, ?, ?)',
    [ingredient_id, transaction_type, quantity, notes || null],
    (err, result) => {
      if (err) {
        return res.status(500).json({ error: 'Error adding inventory transaction.' });
      }
      res.status(201).json({ message: 'Inventory transaction added successfully', id: result.insertId });
    }
  );
});

// Update inventory transaction
app.put('/inventory_transactions/:id', (req, res) => {
  const { id } = req.params;
  const { ingredient_id, transaction_type, quantity, notes } = req.body;

  if (!ingredient_id || !transaction_type || !quantity) {
    return res.status(400).json({ error: 'Ingredient ID, transaction type, and quantity are required.' });
  }

  db.query(
    'UPDATE inventory_transactions SET ingredient_id = ?, transaction_type = ?, quantity = ?, notes = ? WHERE id = ?',
    [ingredient_id, transaction_type, quantity, notes || null, id],
    (err, result) => {
      if (err) {
        return res.status(500).json({ error: 'Error updating inventory transaction.' });
      }
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Inventory transaction not found.' });
      }
      res.json({ message: 'Inventory transaction updated successfully' });
    }
  );
});

// Delete inventory transaction
app.delete('/inventory_transactions/:id', (req, res) => {
  const { id } = req.params;
  db.query('DELETE FROM inventory_transactions WHERE id = ?', [id], (err, result) => {
    if (err) {
      return res.status(500).json({ error: 'Error deleting inventory transaction.' });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Inventory transaction not found.' });
    }
    res.json({ message: 'Inventory transaction deleted successfully' });
  });
});

// Sipariş detaylarını getir
app.get('/order/:id', (req, res) => {
  const orderId = req.params.id;
  
  db.query(
    `SELECT o.*, t.table_number 
     FROM orders o 
     LEFT JOIN tables t ON o.table_id = t.id 
     WHERE o.id = ?`,
    [orderId],
    (err, results) => {
      if (err) {
        console.error('Sipariş detayları getirme hatası:', err);
        res.status(500).json({ error: err.message });
        return;
      }

      if (results.length === 0) {
        res.status(404).json({ error: 'Sipariş bulunamadı' });
        return;
      }

      const order = results[0];

      // Sipariş detaylarını getir
      db.query(
        `SELECT oi.*, mi.name as item_name 
         FROM order_items oi 
         LEFT JOIN menu_items mi ON oi.menu_item_id = mi.id 
         WHERE oi.order_id = ?`,
        [orderId],
        (err, items) => {
          if (err) {
            console.error('Sipariş detayları getirme hatası:', err);
            res.status(500).json({ error: err.message });
            return;
          }

          order.items = items;
          res.json(order);
        }
      );
    }
  );
});

// Ödeme durumunu güncelle
app.put('/order/:id/payment', (req, res) => {
  const orderId = req.params.id;
  const { payment_method, payment_status } = req.body;

  db.query(
    'UPDATE orders SET payment_method = ?, payment_status = ? WHERE id = ?',
    [payment_method, payment_status, orderId],
    (err, result) => {
      if (err) {
        console.error('Ödeme güncelleme hatası:', err);
        res.status(500).json({ error: err.message });
        return;
      }

      if (result.affectedRows === 0) {
        res.status(404).json({ error: 'Sipariş bulunamadı' });
        return;
      }

      res.json({ message: 'Ödeme durumu başarıyla güncellendi' });
    }
  );
});

// Belirli bir masanın siparişlerini getir
app.get('/orders/table/:tableId', (req, res) => {
  const { tableId } = req.params;
  
  db.query(
    `SELECT o.*, 
            oi.id as order_item_id, oi.menu_item_id, oi.quantity, oi.unit_price,
            m.name as menu_item_name, m.price as menu_item_price
     FROM orders o
     JOIN order_items oi ON o.id = oi.order_id
     JOIN menu_items m ON oi.menu_item_id = m.id
     WHERE o.table_id = ?
     ORDER BY o.created_at DESC, o.id DESC`,
    [tableId],
    (err, results) => {
      if (err) {
        console.error('Siparişler getirme hatası:', err);
        res.status(500).json({ error: err.message });
        return;
      }

      // Gruplama
      const orders = [];
      const map = {};
      for (const row of results) {
        if (!map[row.id]) {
          map[row.id] = {
            id: row.id,
            status: row.status,
            created_at: row.created_at,
            table_id: row.table_id,
            payment_status: row.payment_status,
            total_amount: row.total_amount,
            order_items: []
          };
          orders.push(map[row.id]);
        }
        map[row.id].order_items.push({
          id: row.order_item_id,
          menu_item_id: row.menu_item_id,
          menu_item_name: row.menu_item_name,
          quantity: row.quantity,
          unit_price: row.unit_price || row.menu_item_price
        });
      }
      res.json(orders);
    }
  );
});

// Stok durumu raporu
app.get('/stock/status', (req, res) => {
  db.query(
    `SELECT 
      i.id,
      i.name,
      i.unit,
      i.current_stock,
      i.minimum_stock,
      i.price_per_unit,
      i.supplier,
      i.last_purchase_date,
      i.expiry_date,
      CASE 
        WHEN i.current_stock <= i.minimum_stock THEN 'Kritik Seviye'
        WHEN i.current_stock <= (i.minimum_stock * 1.5) THEN 'Düşük Seviye'
        ELSE 'Normal Seviye'
      END as stock_status
    FROM ingredients i
    ORDER BY 
      CASE 
        WHEN i.current_stock <= i.minimum_stock THEN 1
        WHEN i.current_stock <= (i.minimum_stock * 1.5) THEN 2
        ELSE 3
      END,
      i.name ASC`,
    (err, results) => {
      if (err) {
        console.error('Stok durumu getirme hatası:', err);
        res.status(500).json({ error: err.message });
        return;
      }
      res.json(results);
    }
  );
});

// Stok hareketleri raporu
app.get('/stock/movements', (req, res) => {
  const { start_date, end_date, ingredient_id } = req.query;
  
  let query = `
    SELECT 
      it.id,
      it.transaction_type,
      it.quantity,
      it.transaction_date,
      it.notes,
      i.name as ingredient_name,
      i.unit
    FROM inventory_transactions it
    JOIN ingredients i ON it.ingredient_id = i.id
    WHERE 1=1
  `;
  
  const params = [];
  
  if (start_date) {
    query += ' AND it.transaction_date >= ?';
    params.push(start_date);
  }
  
  if (end_date) {
    query += ' AND it.transaction_date <= ?';
    params.push(end_date);
  }
  
  if (ingredient_id) {
    query += ' AND it.ingredient_id = ?';
    params.push(ingredient_id);
  }
  
  query += ' ORDER BY it.transaction_date DESC';
  
  db.query(query, params, (err, results) => {
    if (err) {
      console.error('Stok hareketleri getirme hatası:', err);
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(results);
  });
});

// Stok maliyeti raporu
app.get('/stock/cost', (req, res) => {
  db.query(
    `SELECT 
      i.id,
      i.name,
      i.unit,
      i.current_stock,
      i.price_per_unit,
      (i.current_stock * i.price_per_unit) as total_cost
    FROM ingredients i
    ORDER BY total_cost DESC`,
    (err, results) => {
      if (err) {
        console.error('Stok maliyeti getirme hatası:', err);
        res.status(500).json({ error: err.message });
        return;
      }
      res.json(results);
    }
  );
});

// Stok güncelleme
app.put('/stock/update', (req, res) => {
  const { ingredient_id, quantity, transaction_type, notes } = req.body;
  
  if (!ingredient_id || !quantity || !transaction_type) {
    return res.status(400).json({ error: 'Malzeme ID, miktar ve işlem tipi zorunludur.' });
  }

  // Transaction başlat
  db.beginTransaction(err => {
    if (err) {
      return res.status(500).json({ error: 'Transaction başlatılamadı.' });
    }

    // Stok hareketi ekle
    db.query(
      'INSERT INTO inventory_transactions (ingredient_id, transaction_type, quantity, notes) VALUES (?, ?, ?, ?)',
      [ingredient_id, transaction_type, quantity, notes || null],
      (err, result) => {
        if (err) {
          return db.rollback(() => {
            res.status(500).json({ error: 'Stok hareketi eklenemedi.' });
          });
        }

        // Malzeme stok miktarını güncelle
        const stockUpdate = transaction_type === 'Alım' ? 
          'current_stock + ?' : 
          'current_stock - ?';

        db.query(
          `UPDATE ingredients SET current_stock = ${stockUpdate} WHERE id = ?`,
          [Math.abs(quantity), ingredient_id],
          (err, result) => {
            if (err) {
              return db.rollback(() => {
                res.status(500).json({ error: 'Stok miktarı güncellenemedi.' });
              });
            }

            // Transaction'ı tamamla
            db.commit(err => {
              if (err) {
                return db.rollback(() => {
                  res.status(500).json({ error: 'Transaction tamamlanamadı.' });
                });
              }
              res.json({ message: 'Stok başarıyla güncellendi.' });
            });
          }
        );
      }
    );
  });
});

// Stok uyarıları
app.get('/stock/alerts', (req, res) => {
  db.query(
    `SELECT 
      i.id,
      i.name,
      i.unit,
      i.current_stock,
      i.minimum_stock,
      i.expiry_date,
      CASE 
        WHEN i.current_stock <= i.minimum_stock THEN 'Kritik Stok Seviyesi'
        WHEN i.expiry_date <= DATE_ADD(CURRENT_DATE, INTERVAL 7 DAY) THEN 'Yaklaşan Son Kullanma Tarihi'
        ELSE NULL
      END as alert_type
    FROM ingredients i
    WHERE 
      i.current_stock <= i.minimum_stock OR
      i.expiry_date <= DATE_ADD(CURRENT_DATE, INTERVAL 7 DAY)
    ORDER BY 
      CASE 
        WHEN i.current_stock <= i.minimum_stock THEN 1
        ELSE 2
      END,
      i.name ASC`,
    (err, results) => {
      if (err) {
        console.error('Stok uyarıları getirme hatası:', err);
        res.status(500).json({ error: err.message });
        return;
      }
      res.json(results);
    }
  );
});

// İstatistik endpoint'i
app.get('/statistics', (req, res) => {
  // Son 30 günlük finansal istatistikler
  db.query(
    `SELECT 
      SUM(CASE WHEN payment_status = 'Ödendi' THEN total_amount ELSE 0 END) as total_revenue,
      COUNT(*) as total_orders,
      AVG(CASE WHEN payment_status = 'Ödendi' THEN total_amount ELSE 0 END) as average_order_value
    FROM orders 
    WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)`,
    (err, financialResults) => {
      if (err) {
        console.error('Finansal istatistik hatası:', err);
        return res.status(500).json({ error: 'İstatistikler alınırken bir hata oluştu.' });
      }

      // Sipariş durumu istatistikleri
      db.query(
        `SELECT 
          COUNT(*) as total_orders,
          SUM(CASE WHEN status = 'İptal Edildi' THEN 1 ELSE 0 END) as canceled_orders,
          SUM(CASE WHEN payment_status = 'Ödendi' THEN 1 ELSE 0 END) as completed_orders,
          SUM(CASE WHEN status = 'Hazırlanıyor' THEN 1 ELSE 0 END) as pending_orders
        FROM orders 
        WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)`,
        (err, orderResults) => {
          if (err) {
            console.error('Sipariş istatistik hatası:', err);
            return res.status(500).json({ error: 'İstatistikler alınırken bir hata oluştu.' });
          }

          // Ürün istatistikleri
          db.query(
            `SELECT 
              COUNT(*) as total_products,
              SUM(CASE WHEN is_available = 0 THEN 1 ELSE 0 END) as unavailable_items
            FROM menu_items`,
            (err, productResults) => {
              if (err) {
                console.error('Ürün istatistik hatası:', err);
                return res.status(500).json({ error: 'İstatistikler alınırken bir hata oluştu.' });
              }

              // En çok satan ürünler
              db.query(
                `SELECT 
                  m.id,
                  m.name,
                  m.price,
                  m.image_url,
                  COUNT(oi.id) as order_count,
                  SUM(oi.quantity) as total_quantity
                FROM menu_items m
                LEFT JOIN order_items oi ON m.id = oi.menu_item_id
                LEFT JOIN orders o ON oi.order_id = o.id
                WHERE o.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
                GROUP BY m.id, m.name, m.price, m.image_url
                ORDER BY total_quantity DESC
                LIMIT 5`,
                (err, topSellingResults) => {
                  if (err) {
                    console.error('En çok satan ürünler hatası:', err);
                    return res.status(500).json({ error: 'İstatistikler alınırken bir hata oluştu.' });
                  }

                  // Kategori bazlı satış istatistikleri
                  db.query(
                    `SELECT 
                      m.category,
                      COUNT(oi.id) as order_count,
                      SUM(oi.quantity) as total_quantity,
                      SUM(oi.quantity * oi.unit_price) as total_revenue
                    FROM menu_items m
                    LEFT JOIN order_items oi ON m.id = oi.menu_item_id
                    LEFT JOIN orders o ON oi.order_id = o.id
                    WHERE o.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
                    GROUP BY m.category`,
                    (err, categoryResults) => {
                      if (err) {
                        console.error('Kategori istatistik hatası:', err);
                        return res.status(500).json({ error: 'İstatistikler alınırken bir hata oluştu.' });
                      }

                      // Ödeme yöntemi istatistikleri
                      db.query(
                        `SELECT 
                          payment_method,
                          COUNT(*) as order_count,
                          SUM(total_amount) as total_amount
                        FROM orders
                        WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
                        AND payment_status = 'Ödendi'
                        GROUP BY payment_method`,
                        (err, paymentResults) => {
                          if (err) {
                            console.error('Ödeme yöntemi istatistik hatası:', err);
                            return res.status(500).json({ error: 'İstatistikler alınırken bir hata oluştu.' });
                          }

                          // Masa doluluk oranları
                          db.query(
                            `SELECT 
                              t.id,
                              t.name,
                              COUNT(o.id) as order_count,
                              SUM(CASE WHEN o.status = 'Hazırlanıyor' THEN 1 ELSE 0 END) as active_orders
                            FROM tables t
                            LEFT JOIN orders o ON t.id = o.table_id
                            WHERE o.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
                            GROUP BY t.id, t.name`,
                            (err, tableResults) => {
                              if (err) {
                                console.error('Masa istatistik hatası:', err);
                                return res.status(500).json({ error: 'İstatistikler alınırken bir hata oluştu.' });
                              }

                              // Günlük gelir verileri
                              db.query(
                                `SELECT 
                                  DATE(created_at) as date,
                                  SUM(CASE WHEN payment_status = 'Ödendi' THEN total_amount ELSE 0 END) as daily_revenue
                                FROM orders
                                WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
                                GROUP BY DATE(created_at)
                                ORDER BY date`,
                                (err, dailyResults) => {
                                  if (err) {
                                    console.error('Günlük gelir istatistik hatası:', err);
                                    return res.status(500).json({ error: 'İstatistikler alınırken bir hata oluştu.' });
                                  }

                                  // Tüm istatistikleri birleştir
                                  res.json({
                                    financial: financialResults[0],
                                    orders: orderResults[0],
                                    products: productResults[0],
                                    top_selling: topSellingResults,
                                    categories: categoryResults,
                                    payment_methods: paymentResults,
                                    tables: tableResults,
                                    daily_revenue: dailyResults
                                  });
                                }
                              );
                            }
                          );
                        }
                      );
                    }
                  );
                }
              );
            }
          );
        }
      );
    }
  );
});

app.listen(port, () => {
  console.log(`Server http://localhost:${port} adresinde çalışıyor`);
  console.log('Loglar aktif. Tüm istekler ve hatalar konsola yazdırılacak.');
}); 