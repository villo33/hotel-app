const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const path = require('path');

const app = express();

// ================= CONFIG =================
app.use(cors());
app.use(express.json());

// 🔥 SOLO ESTA LÍNEA (IMPORTANTE)
app.use(express.static(path.join(__dirname, 'public')));

// ================= MYSQL =================
let db;

if (process.env.MYSQL_URL) {
  console.log("🌐 Usando MySQL ONLINE");
  db = mysql.createConnection(process.env.MYSQL_URL);
} else {
  console.log("💻 Usando MySQL LOCAL");
  db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Angel13#',
    database: 'hotel'
  });
}

db.connect(err => {
  if (err) {
    console.log('❌ Error MySQL:', err);
  } else {
    console.log('✅ MySQL conectado');
  }
});

// ================= VISTAS =================

// 🔥 PANEL PRINCIPAL (SIN LOGIN)
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/index.html'));
});

app.get('/inventario-vista', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/inventario.html'));
});

app.get('/mantenimiento-vista', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/mantenimiento.html'));
});

app.get('/habitaciones-vista', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/habitaciones.html'));
});

app.get('/limpieza-vista', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/limpieza.html'));
});

// ================= INVENTARIO =================

app.get('/inventario', (req, res) => {
  db.query('SELECT * FROM inventario', (err, r) => {
    if (err) return res.status(500).send(err);
    res.json(r);
  });
});

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

app.get('/mantenimiento', (req, res) => {
  db.query('SELECT * FROM mantenimiento', (err, r) => {
    if (err) return res.status(500).send(err);
    res.json(r);
  });
});

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

app.get('/habitaciones', (req, res) => {
  db.query('SELECT * FROM habitaciones', (err, r) => {
    if (err) return res.status(500).send(err);
    res.json(r);
  });
});

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
      if (err) return res.status(500).send(err);
      res.send('Guardado');
    }
  );
});

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

// ================= LIMPIEZA =================

app.get('/limpieza', (req, res) => {
  db.query('SELECT * FROM control_limpieza ORDER BY id DESC', (err, r) => {
    if (err) return res.status(500).send(err);
    res.json(r);
  });
});

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

// ================= SERVER =================
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
});