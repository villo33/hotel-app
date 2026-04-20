const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const path = require('path');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ================= POSTGRES (SUPABASE) =================
const db = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// ================= RUTA PRINCIPAL =================
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/index.html'));
});

// ================= INVENTARIO =================
app.get('/inventario', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM inventario');
    res.json(result.rows);
  } catch (err) {
    res.status(500).send(err);
  }
});

app.post('/inventario', async (req, res) => {
  const { nombre, cantidad, encargado, fecha } = req.body;

  try {
    await db.query(
      'INSERT INTO inventario(nombre,cantidad,encargado,fecha) VALUES ($1,$2,$3,$4)',
      [nombre, cantidad, encargado, fecha]
    );
    res.send('Guardado');
  } catch (err) {
    res.status(500).send(err);
  }
});

app.put('/inventario', async (req, res) => {
  const { id, nombre, cantidad, encargado, fecha } = req.body;

  try {
    await db.query(
      'UPDATE inventario SET nombre=$1, cantidad=$2, encargado=$3, fecha=$4 WHERE id=$5',
      [nombre, cantidad, encargado, fecha, id]
    );
    res.send('Actualizado');
  } catch (err) {
    res.status(500).send(err);
  }
});

app.delete('/inventario/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM inventario WHERE id=$1', [req.params.id]);
    res.send('Eliminado');
  } catch (err) {
    res.status(500).send(err);
  }
});

// ================= MANTENIMIENTO =================
app.get('/mantenimiento', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM mantenimiento');
    res.json(result.rows);
  } catch (err) {
    res.status(500).send(err);
  }
});

app.post('/mantenimiento', async (req, res) => {
  const { habitacion, descripcion, encargado, fecha } = req.body;

  try {
    await db.query(
      'INSERT INTO mantenimiento(habitacion,descripcion,encargado,fecha) VALUES ($1,$2,$3,$4)',
      [habitacion, descripcion, encargado, fecha]
    );
    res.send('Guardado');
  } catch (err) {
    res.status(500).send(err);
  }
});

app.put('/mantenimiento', async (req, res) => {
  const { id, habitacion, descripcion, encargado, fecha } = req.body;

  try {
    await db.query(
      'UPDATE mantenimiento SET habitacion=$1, descripcion=$2, encargado=$3, fecha=$4 WHERE id=$5',
      [habitacion, descripcion, encargado, fecha, id]
    );
    res.send('Actualizado');
  } catch (err) {
    res.status(500).send(err);
  }
});

app.delete('/mantenimiento/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM mantenimiento WHERE id=$1', [req.params.id]);
    res.send('Eliminado');
  } catch (err) {
    res.status(500).send(err);
  }
});

// ================= HABITACIONES =================
app.get('/habitaciones', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM habitaciones');
    res.json(result.rows);
  } catch (err) {
    res.status(500).send(err);
  }
});

app.post('/habitaciones', async (req, res) => {
  try {
    let { habitacion, fecha, encargado, color, inicio, fin } = req.body;

    // 🔥 LIMPIEZA DE DATOS
    inicio = inicio || null;
    fin = fin || null;
    color = color || null;

    if (!habitacion || !fecha || !encargado) {
      return res.status(400).send('Datos incompletos');
    }

    await db.query(
      `INSERT INTO habitaciones 
      (habitacion, fecha, encargado, color, inicio, fin)
      VALUES ($1,$2,$3,$4,$5,$6)`,
      [habitacion, fecha, encargado, color, inicio, fin]
    );

    res.send('Guardado');

  } catch (err) {
    console.log("ERROR REAL HABITACIONES:", err); // 🔥 IMPORTANTE
    res.status(500).send(err.message);
  }
});

app.delete('/habitaciones/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM habitaciones WHERE id=$1', [req.params.id]);
    res.send('Eliminado');
  } catch (err) {
    res.status(500).send(err);
  }
});

// ================= LIMPIEZA =================
app.get('/limpieza', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM control_limpieza ORDER BY id DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).send(err);
  }
});

app.post('/limpieza', async (req, res) => {
  const { habitacion, tipo_accion, fecha, empleado, observacion } = req.body;

  try {
    await db.query(
      `INSERT INTO control_limpieza 
      (habitacion, tipo_accion, fecha, empleado, observacion, estado)
      VALUES ($1,$2,$3,$4,$5,'hecho')`,
      [habitacion, tipo_accion, fecha, empleado, observacion]
    );
    res.send('Guardado');
  } catch (err) {
    res.status(500).send(err);
  }
});

app.put('/limpieza', async (req, res) => {
  const { id, habitacion, tipo_accion, fecha, empleado, observacion } = req.body;

  try {
    await db.query(
      `UPDATE control_limpieza 
       SET habitacion=$1, tipo_accion=$2, fecha=$3, empleado=$4, observacion=$5 
       WHERE id=$6`,
      [habitacion, tipo_accion, fecha, empleado, observacion, id]
    );
    res.send('Actualizado');
  } catch (err) {
    res.status(500).send(err);
  }
});

app.delete('/limpieza/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM control_limpieza WHERE id=$1', [req.params.id]);
    res.send('Eliminado');
  } catch (err) {
    res.status(500).send(err);
  }
});

// ================= TAREAS =================
app.get('/tareas', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM tareas ORDER BY id DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).send(err);
  }
});

app.post('/tareas', async (req, res) => {
  const { descripcion, encargado, fecha } = req.body;

  try {
    await db.query(
      'INSERT INTO tareas (descripcion, encargado, fecha, estado) VALUES ($1,$2,$3,$4)',
      [descripcion, encargado, fecha, 'pendiente']
    );
    res.send('Tarea creada');
  } catch (err) {
    res.status(500).send(err);
  }
});

app.put('/tareas/:id', async (req, res) => {
  try {
    await db.query(
      'UPDATE tareas SET estado=$1 WHERE id=$2',
      ['hecho', req.params.id]
    );
    res.send('Actualizado');
  } catch (err) {
    res.status(500).send(err);
  }
});

app.delete('/tareas/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM tareas WHERE id=$1', [req.params.id]);
    res.send('Eliminado');
  } catch (err) {
    res.status(500).send(err);
  }
});

// ================= SERVER =================
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});