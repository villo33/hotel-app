const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const path = require('path');

const app = express();

// CONFIG
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// 🔥 NUEVO (NO BORRA LO TUYO)
app.use(express.static(path.join(__dirname, 'public')));

// ================= 🔥 AÑADIDO (DEBUG VARIABLES) =================
console.log("📦 VARIABLES MYSQL:");
console.log("HOST:", process.env.MYSQLHOST);
console.log("USER:", process.env.MYSQLUSER);
console.log("DB:", process.env.MYSQLDATABASE);

// ================= MYSQL =================

// 🔥 AÑADIDO: conexión inteligente (local + web)
const db = mysql.createConnection({
  host: process.env.MYSQLHOST || 'localhost',
  user: process.env.MYSQLUSER || 'root',
  password: process.env.MYSQLPASSWORD || 'Angel13#',
  database: process.env.MYSQLDATABASE || 'hotel',
  port: process.env.MYSQLPORT || 3306
});

db.connect(err => {
  if (err) {
    console.log('❌ Error MySQL:', err);
  } else {
    console.log('✅ MySQL conectado');
  }
});

// ================= VISTAS =================
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/inventario-vista', (req, res) => {
  res.sendFile(path.join(__dirname, 'inventario.html'));
});

app.get('/mantenimiento-vista', (req, res) => {
  res.sendFile(path.join(__dirname, 'mantenimiento.html'));
});

app.get('/habitaciones-vista', (req, res) => {
  res.sendFile(path.join(__dirname, 'habitaciones.html'));
});

// 👉 NUEVA VISTA LIMPIEZA
app.get('/limpieza-vista', (req, res) => {
  res.sendFile(path.join(__dirname, 'limpieza.html'));
});


// ================= INVENTARIO =================

// GET
app.get('/inventario', (req, res) => {
  db.query('SELECT * FROM inventario', (err, r) => {
    if (err) return res.status(500).send(err);
    res.json(r);
  });
});

// POST
app.post('/inventario', (req, res) => {
  const { nombre, cantidad, encargado, fecha } = req.body;

  db.query(
    'INSERT INTO inventario(nombre,cantidad,encargado,fecha) VALUES (?,?,?,?)',
    [nombre, cantidad, encargado, fecha],
    err => {
      if (err) return res.status(500).send(err);
      res.send('✅ Guardado');
    }
  );
});

// PUT
app.put('/inventario', (req, res) => {
  const { id, nombre, cantidad, encargado, fecha } = req.body;

  db.query(
    'UPDATE inventario SET nombre=?, cantidad=?, encargado=?, fecha=? WHERE id=?',
    [nombre, cantidad, encargado, fecha, id],
    err => {
      if (err) return res.status(500).send(err);
      res.send('Actualizado');
    }
  );
});

// DELETE
app.delete('/inventario/:id', (req, res) => {
  db.query(
    'DELETE FROM inventario WHERE id=?',
    [req.params.id],
    err => {
      if (err) return res.status(500).send(err);
      res.send('Eliminado');
    }
  );
});


// ================= MANTENIMIENTO =================

// GET
app.get('/mantenimiento', (req, res) => {
  db.query('SELECT * FROM mantenimiento', (err, r) => {
    if (err) return res.status(500).send(err);
    res.json(r);
  });
});

// POST
app.post('/mantenimiento', (req, res) => {
  const { habitacion, descripcion, encargado, fecha } = req.body;

  db.query(
    'INSERT INTO mantenimiento(habitacion,descripcion,encargado,fecha) VALUES (?,?,?,?)',
    [habitacion, descripcion, encargado, fecha],
    err => {
      if (err) return res.status(500).send(err);
      res.send('✅ Guardado');
    }
  );
});

// PUT
app.put('/mantenimiento', (req, res) => {
  const { id, habitacion, descripcion, encargado, fecha } = req.body;

  db.query(
    'UPDATE mantenimiento SET habitacion=?, descripcion=?, encargado=?, fecha=? WHERE id=?',
    [habitacion, descripcion, encargado, fecha, id],
    err => {
      if (err) return res.status(500).send(err);
      res.send('Actualizado');
    }
  );
});

// DELETE
app.delete('/mantenimiento/:id', (req, res) => {
  db.query(
    'DELETE FROM mantenimiento WHERE id=?',
    [req.params.id],
    err => {
      if (err) return res.status(500).send(err);
      res.send('Eliminado');
    }
  );
});


// ================= HABITACIONES =================

// GET
app.get('/habitaciones', (req, res) => {
  db.query('SELECT * FROM habitaciones', (err, r) => {
    if (err) return res.status(500).send(err);
    res.json(r);
  });
});

// POST
app.post('/habitaciones', (req, res) => {

  const { habitacion, fecha, encargado, color, inicio, fin } = req.body;

  if (!habitacion || !fecha || !encargado) {
    return res.status(400).send('Datos incompletos');
  }

  db.query(
    `INSERT INTO habitaciones 
    (habitacion, fecha, encargado, color, inicio, fin) 
    VALUES (?, ?, ?, ?, ?, ?)`,
    [habitacion, fecha, encargado, color, inicio, fin],
    err => {
      if (err) {
        console.log(err);
        return res.status(500).send(err);
      }
      res.send('Guardado');
    }
  );
});

// DELETE
app.delete('/habitaciones/:id', (req, res) => {
  db.query(
    'DELETE FROM habitaciones WHERE id=?',
    [req.params.id],
    err => {
      if (err) return res.status(500).send(err);
      res.send('Eliminado');
    }
  );
});


// ================= 🧹 LIMPIEZA =================

// GET
app.get('/limpieza', (req, res) => {
  db.query('SELECT * FROM control_limpieza ORDER BY id DESC', (err, r) => {
    if (err) return res.status(500).send(err);
    res.json(r);
  });
});

// POST
app.post('/limpieza', (req, res) => {
  const { habitacion, tipo_accion, fecha, empleado, observacion } = req.body;

  if (!habitacion || !tipo_accion || !fecha || !empleado) {
    return res.status(400).send('Datos incompletos');
  }

  db.query(
    `INSERT INTO control_limpieza 
    (habitacion, tipo_accion, fecha, empleado, observacion, estado) 
    VALUES (?, ?, ?, ?, ?, 'hecho')`,
    [habitacion, tipo_accion, fecha, empleado, observacion],
    err => {
      if (err) return res.status(500).send(err);
      res.send('✅ Limpieza guardada');
    }
  );
});

// PUT
app.put('/limpieza', (req, res) => {
  const { id, habitacion, tipo_accion, fecha, empleado, observacion } = req.body;

  db.query(
    `UPDATE control_limpieza 
     SET habitacion=?, tipo_accion=?, fecha=?, empleado=?, observacion=? 
     WHERE id=?`,
    [habitacion, tipo_accion, fecha, empleado, observacion, id],
    err => {
      if (err) return res.status(500).send(err);
      res.send('Actualizado');
    }
  );
});

// DELETE
app.delete('/limpieza/:id', (req, res) => {
  db.query(
    'DELETE FROM control_limpieza WHERE id=?',
    [req.params.id],
    err => {
      if (err) return res.status(500).send(err);
      res.send('Eliminado');
    }
  );
});


// SERVER
app.listen(3000, () => {
  console.log('🚀 http://localhost:3000');
});