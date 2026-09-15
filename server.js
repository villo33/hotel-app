require('dotenv').config();

const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const path = require('path');
const webpush = require('web-push');

const app = express();

app.use(cors());
app.use(express.json());


// =====================================================
// CONFIGURACIÓN VAPID
// =====================================================

const PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY;
const PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;
const VAPID_EMAIL = process.env.VAPID_EMAIL;


// =====================================================
// ARCHIVOS PÚBLICOS
// =====================================================

app.use(express.static(path.join(__dirname, 'public')));


// =====================================================
// WEB PUSH
// =====================================================

webpush.setVapidDetails(
  VAPID_EMAIL,
  PUBLIC_KEY,
  PRIVATE_KEY
);


// =====================================================
// BASE DE DATOS
// =====================================================

const db = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});


// =====================================================
// SUSCRIPCIONES PUSH
// =====================================================

app.post('/suscribir', async (req, res) => {
  try {
    const sub = req.body;

    if (!sub || !sub.endpoint || !sub.keys) {
      return res.status(400).send('Suscripción inválida');
    }

    const existe = await db.query(
      'SELECT 1 FROM suscripciones_hotel WHERE endpoint = $1',
      [sub.endpoint]
    );

    if (existe.rows.length > 0) {
      return res.sendStatus(200);
    }

    await db.query(
      `INSERT INTO suscripciones_hotel
       (endpoint, p256dh, auth)
       VALUES ($1, $2, $3)`,
      [
        sub.endpoint,
        sub.keys.p256dh,
        sub.keys.auth
      ]
    );

    console.log('✅ Nueva suscripción hotel guardada');

    res.sendStatus(201);

  } catch (err) {
    console.error('❌ Error guardando suscripción:', err);
    res.status(500).send('Error');
  }
});


// =====================================================
// RUTA PRINCIPAL
// =====================================================

app.get('/', (req, res) => {
  res.sendFile(
    path.join(__dirname, 'public/index.html')
  );
});

// ==========================================
// CATEGORÍAS DE INVENTARIO
// ==========================================

// Obtener todas las categorías
app.get('/categorias-inventario', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT
        id,
        nombre,
        fecha_creacion
      FROM categorias_inventario
      ORDER BY nombre ASC
    `);

    res.json(result.rows);

  } catch (err) {
    console.error("🔥 ERROR CATEGORÍAS INVENTARIO:", err);

    res.status(500).json({
      error: err.code || "ERROR",
      mensaje: err.message || "Error desconocido"
    });
  }
});


// Crear una nueva categoría
app.post('/categorias-inventario', async (req, res) => {
  try {

    const nombre = String(req.body.nombre || "").trim();

    if (!nombre) {
      return res.status(400).send("El nombre de la categoría es obligatorio");
    }

    const existe = await db.query(
      `
      SELECT id
      FROM categorias_inventario
      WHERE LOWER(nombre) = LOWER($1)
      `,
      [nombre]
    );

    if (existe.rows.length > 0) {
      return res.status(409).send("Esa categoría ya existe");
    }

    const result = await db.query(
      `
      INSERT INTO categorias_inventario (nombre)
      VALUES ($1)
      RETURNING *
      `,
      [nombre]
    );

    res.status(201).json(result.rows[0]);

  } catch (err) {

    console.error("🔥 ERROR CREANDO CATEGORÍA:", err);

    res.status(500).json({
      error: err.code || "ERROR",
      mensaje: err.message || "Error desconocido"
    });
  }
});


// Eliminar una categoría
app.delete('/categorias-inventario/:id', async (req, res) => {
  try {

    const id = req.params.id;

    // Comprobar si tiene productos
    const productos = await db.query(
      `
      SELECT COUNT(*) AS total
      FROM inventario
      WHERE categoria_id = $1
      `,
      [id]
    );

    const total = Number(productos.rows[0].total);

    if (total > 0) {

      return res.status(409).send(
        "No puedes eliminar esta categoría porque tiene productos asociados."
      );
    }


    await db.query(
      `
      DELETE FROM categorias_inventario
      WHERE id = $1
      `,
      [id]
    );

    res.send("Categoría eliminada correctamente");

  } catch (err) {

    console.error("🔥 ERROR ELIMINANDO CATEGORÍA:", err);

    res.status(500).json({
      error: err.code || "ERROR",
      mensaje: err.message || "Error desconocido"
    });
  }
});


// ==========================================
// INVENTARIO
// ==========================================

// Obtener productos
app.get('/inventario', async (req, res) => {
  try {

    const result = await db.query(`
      SELECT
        i.id,
        i.nombre,
        i.cantidad,
        i.stock_minimo,
        i.encargado,
        i.fecha,
        i.categoria_id,
        c.nombre AS categoria

      FROM inventario i

      LEFT JOIN categorias_inventario c
        ON i.categoria_id = c.id

      ORDER BY i.id DESC
    `);

    res.json(result.rows);

  } catch (err) {

    console.error("🔥 ERROR REAL INVENTARIO:", err);

    res.status(500).json({
      error: err.code || "ERROR",
      mensaje: err.message || "Error desconocido"
    });
  }
});


// Crear producto
app.post('/inventario', async (req, res) => {
  try {

    const {
      nombre,
      cantidad,
      categoria_id,
      stock_minimo,
      encargado,
      fecha
    } = req.body;


    if (!nombre || cantidad === undefined || cantidad === "") {
      return res.status(400).send(
        "Producto y stock son obligatorios"
      );
    }


    if (!categoria_id) {
      return res.status(400).send(
        "Debes seleccionar una categoría"
      );
    }


    // Verificar que la categoría exista
    const categoria = await db.query(
      `
      SELECT id
      FROM categorias_inventario
      WHERE id = $1
      `,
      [categoria_id]
    );


    if (categoria.rows.length === 0) {
      return res.status(400).send(
        "La categoría seleccionada no existe"
      );
    }


    await db.query(
      `
      INSERT INTO inventario
      (
        nombre,
        cantidad,
        categoria_id,
        stock_minimo,
        encargado,
        fecha
      )

      VALUES ($1, $2, $3, $4, $5, $6)
      `,
      [
        nombre.trim(),
        Number(cantidad),
        Number(categoria_id),
        Number(stock_minimo) || 1,
        encargado || "",
        fecha || null
      ]
    );


    res.send("Producto guardado correctamente");

  } catch (err) {

    console.error("🔥 ERROR GUARDANDO INVENTARIO:", err);

    res.status(500).send(err.message);
  }
});


// Actualizar producto
app.put('/inventario', async (req, res) => {
  try {

    const {
      id,
      nombre,
      cantidad,
      categoria_id,
      stock_minimo,
      encargado,
      fecha
    } = req.body;


    if (!id || !nombre || cantidad === undefined || cantidad === "") {
      return res.status(400).send(
        "Datos incompletos"
      );
    }


    if (!categoria_id) {
      return res.status(400).send(
        "Debes seleccionar una categoría"
      );
    }


    // Verificar categoría
    const categoria = await db.query(
      `
      SELECT id
      FROM categorias_inventario
      WHERE id = $1
      `,
      [categoria_id]
    );


    if (categoria.rows.length === 0) {
      return res.status(400).send(
        "La categoría seleccionada no existe"
      );
    }


    await db.query(
      `
      UPDATE inventario

      SET
        nombre = $1,
        cantidad = $2,
        categoria_id = $3,
        stock_minimo = $4,
        encargado = $5,
        fecha = $6

      WHERE id = $7
      `,
      [
        nombre.trim(),
        Number(cantidad),
        Number(categoria_id),
        Number(stock_minimo) || 1,
        encargado || "",
        fecha || null,
        id
      ]
    );


    res.send("Producto actualizado correctamente");

  } catch (err) {

    console.error("🔥 ERROR ACTUALIZANDO INVENTARIO:", err);

    res.status(500).send(err.message);
  }
});


// Eliminar producto
app.delete('/inventario/:id', async (req, res) => {
  try {

    const id = req.params.id;

    await db.query(
      `
      DELETE FROM inventario
      WHERE id = $1
      `,
      [id]
    );

    res.send("Producto eliminado correctamente");

  } catch (err) {

    console.error("🔥 ERROR ELIMINANDO INVENTARIO:", err);

    res.status(500).send(err.message);
  }
});

// =====================================================
// MANTENIMIENTO
// =====================================================

app.get('/mantenimiento', async (req, res) => {
  try {
    const result = await db.query(
      'SELECT * FROM mantenimiento'
    );

    res.json(result.rows);

  } catch (err) {
    console.error(
      '🔥 ERROR REAL MANTENIMIENTO:',
      err
    );

    res.status(500).send(err.message);
  }
});


app.post('/mantenimiento', async (req, res) => {
  const {
    habitacion,
    descripcion,
    encargado,
    fecha
  } = req.body;

  try {
    await db.query(
      `INSERT INTO mantenimiento
       (habitacion, descripcion, encargado, fecha)
       VALUES ($1, $2, $3, $4)`,
      [
        habitacion,
        descripcion,
        encargado,
        fecha
      ]
    );

    res.send('Guardado');

  } catch (err) {
    console.error(
      '❌ ERROR POST MANTENIMIENTO:',
      err
    );

    res.status(500).send(err.message);
  }
});


app.put('/mantenimiento', async (req, res) => {
  const {
    id,
    habitacion,
    descripcion,
    encargado,
    fecha
  } = req.body;

  try {
    await db.query(
      `UPDATE mantenimiento
       SET habitacion=$1,
           descripcion=$2,
           encargado=$3,
           fecha=$4
       WHERE id=$5`,
      [
        habitacion,
        descripcion,
        encargado,
        fecha,
        id
      ]
    );

    res.send('Actualizado');

  } catch (err) {
    console.error(
      '❌ ERROR PUT MANTENIMIENTO:',
      err
    );

    res.status(500).send(err.message);
  }
});


app.delete('/mantenimiento/:id', async (req, res) => {
  try {
    await db.query(
      'DELETE FROM mantenimiento WHERE id=$1',
      [req.params.id]
    );

    res.send('Eliminado');

  } catch (err) {
    console.error(
      '❌ ERROR DELETE MANTENIMIENTO:',
      err
    );

    res.status(500).send(err.message);
  }
});


// =====================================================
// HABITACIONES
// =====================================================

// OBTENER HABITACIONES
app.get('/habitaciones', async (req, res) => {
  try {
    console.log(
      '🏨 GET /habitaciones - iniciando consulta'
    );

    const result = await db.query(`
      SELECT *
      FROM habitaciones
      ORDER BY id DESC
    `);

    console.log(
      '🏨 GET /habitaciones - registros:',
      result.rows.length
    );

    res.json(result.rows);

  } catch (err) {

    console.error(
      '🔥 ERROR REAL GET /habitaciones'
    );

    console.error(
      'Código:',
      err.code
    );

    console.error(
      'Mensaje:',
      err.message
    );

    console.error(
      'Detalle:',
      err.detail
    );

    console.error(
      'Stack:',
      err.stack
    );

    res.status(500).json({
      error: err.code || 'ERROR',
      mensaje:
        err.message ||
        'Error desconocido'
    });
  }
});


// GUARDAR HABITACIÓN
app.post('/habitaciones', async (req, res) => {
  try {

    let {
      habitacion,
      fecha,
      encargado,
      color,
      inicio,
      fin
    } = req.body;

    if (
      !habitacion ||
      !fecha ||
      !encargado
    ) {
      return res
        .status(400)
        .send('Datos incompletos');
    }

    const inicioLimpio =
      inicio && inicio !== ''
        ? inicio
        : null;

    const finLimpio =
      fin && fin !== ''
        ? fin
        : null;

    await db.query(
      `INSERT INTO habitaciones
       (
         habitacion,
         fecha,
         encargado,
         color,
         inicio,
         fin
       )
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        Number(habitacion),
        fecha,
        encargado,
        color || null,
        inicioLimpio,
        finLimpio
      ]
    );

    res.send('Guardado');

  } catch (err) {

    console.error(
      '🔥 ERROR REAL POST HABITACIONES:',
      err
    );

    res.status(500).send(
      err.message
    );
  }
});


// ELIMINAR HABITACIÓN
app.delete('/habitaciones/:id', async (req, res) => {
  try {

    const id = req.params.id;

    await db.query(
      'DELETE FROM habitaciones WHERE id = $1',
      [id]
    );

    res.send(
      'Eliminado correctamente'
    );

  } catch (err) {

    console.error(
      '🔥 ERROR ELIMINANDO HABITACION:',
      err
    );

    res.status(500).send(
      err.message
    );
  }
});


// =====================================================
// LIMPIEZA
// =====================================================

app.get('/limpieza', async (req, res) => {
  try {

    const result = await db.query(
      `SELECT *
       FROM control_limpieza
       ORDER BY id DESC`
    );

    res.json(result.rows);

  } catch (err) {

    console.error(
      '🔥 ERROR REAL LIMPIEZA:',
      err
    );

    res.status(500).send(
      err.message
    );
  }
});


app.post('/limpieza', async (req, res) => {

  const {
    habitacion,
    tipo_accion,
    fecha,
    empleado,
    observacion
  } = req.body;

  try {

    await db.query(
      `INSERT INTO control_limpieza
       (
         habitacion,
         tipo_accion,
         fecha,
         empleado,
         observacion,
         estado
       )
       VALUES ($1, $2, $3, $4, $5, 'hecho')`,
      [
        habitacion,
        tipo_accion,
        fecha,
        empleado,
        observacion
      ]
    );

    res.send('Guardado');

  } catch (err) {

    console.error(
      '❌ ERROR POST LIMPIEZA:',
      err
    );

    res.status(500).send(
      err.message
    );
  }
});


app.put('/limpieza', async (req, res) => {

  const {
    id,
    habitacion,
    tipo_accion,
    fecha,
    empleado,
    observacion
  } = req.body;

  try {

    await db.query(
      `UPDATE control_limpieza
       SET
         habitacion=$1,
         tipo_accion=$2,
         fecha=$3,
         empleado=$4,
         observacion=$5
       WHERE id=$6`,
      [
        habitacion,
        tipo_accion,
        fecha,
        empleado,
        observacion,
        id
      ]
    );

    res.send('Actualizado');

  } catch (err) {

    console.error(
      '❌ ERROR PUT LIMPIEZA:',
      err
    );

    res.status(500).send(
      err.message
    );
  }
});


app.delete('/limpieza/:id', async (req, res) => {
  try {

    await db.query(
      'DELETE FROM control_limpieza WHERE id=$1',
      [req.params.id]
    );

    res.send('Eliminado');

  } catch (err) {

    console.error(
      '❌ ERROR DELETE LIMPIEZA:',
      err
    );

    res.status(500).send(
      err.message
    );
  }
});


// =====================================================
// TAREAS
// =====================================================

// OBTENER TAREAS
app.get('/tareas', async (req, res) => {
  try {

    const result = await db.query(
      `SELECT *
       FROM tareas_hotel
       ORDER BY id DESC`
    );

    res.json(result.rows);

  } catch (err) {

    console.error(
      '🔥 ERROR REAL TAREAS:',
      err
    );

    res.status(500).send(
      err.message
    );
  }
});


// CREAR TAREA + NOTIFICAR
app.post('/tareas', async (req, res) => {

  const {
    descripcion,
    asignado_por,
    fecha
  } = req.body;

  try {

    await db.query(
      `INSERT INTO tareas_hotel
       (
         descripcion,
         asignado_por,
         fecha,
         estado
       )
       VALUES ($1, $2, $3, $4)`,
      [
        descripcion,
        asignado_por,
        fecha,
        'pendiente'
      ]
    );

    const payload = JSON.stringify({
      title: '📋 Nueva tarea',
      body: descripcion
    });

    const subs = await db.query(
      'SELECT * FROM suscripciones_hotel'
    );

    for (const sub of subs.rows) {

      const pushSubscription = {
        endpoint: sub.endpoint,
        keys: {
          p256dh: sub.p256dh,
          auth: sub.auth
        }
      };

      try {

        await webpush.sendNotification(
          pushSubscription,
          payload
        );

      } catch (err) {

        console.log(
          '❌ Error push:',
          err.statusCode || err
        );

        if (
          err.statusCode === 410 ||
          err.statusCode === 404
        ) {

          await db.query(
            `DELETE FROM suscripciones_hotel
             WHERE endpoint = $1`,
            [sub.endpoint]
          );
        }
      }
    }

    res.send(
      'Tarea creada y notificada'
    );

  } catch (err) {

    console.error(
      '🔥 ERROR GENERAL TAREAS:',
      err
    );

    res.status(500).send(
      err.message
    );
  }
});


// COMPLETAR TAREA + NOTIFICAR
app.put('/tareas/:id', async (req, res) => {

  try {

    const id = req.params.id;
    const {
      realizado_por
    } = req.body;

    const result = await db.query(
      `UPDATE tareas_hotel
       SET
         estado = 'hecho',
         realizado_por = $1
       WHERE id = $2
       RETURNING *`,
      [
        realizado_por,
        id
      ]
    );

    if (result.rows.length === 0) {
      return res
        .status(404)
        .send('Tarea no encontrada');
    }

    const tarea = result.rows[0];

    const payload = JSON.stringify({
      title: '✅ Tarea completada',
      body: `${tarea.descripcion} fue finalizada por ${realizado_por}`
    });

    const subs = await db.query(
      'SELECT * FROM suscripciones_hotel'
    );

    for (const sub of subs.rows) {

      const pushSubscription = {
        endpoint: sub.endpoint,
        keys: {
          p256dh: sub.p256dh,
          auth: sub.auth
        }
      };

      try {

        await webpush.sendNotification(
          pushSubscription,
          payload
        );

      } catch (err) {

        if (
          err.statusCode === 410 ||
          err.statusCode === 404
        ) {

          await db.query(
            `DELETE FROM suscripciones_hotel
             WHERE endpoint = $1`,
            [sub.endpoint]
          );
        }
      }
    }

    res.send(
      'Tarea completada con responsable'
    );

  } catch (err) {

    console.error(
      '🔥 ERROR COMPLETANDO TAREA:',
      err
    );

    res.status(500).send(
      err.message
    );
  }
});


// ELIMINAR TAREA
app.delete('/tareas/:id', async (req, res) => {

  try {

    const id = req.params.id;

    await db.query(
      'DELETE FROM tareas_hotel WHERE id = $1',
      [id]
    );

    res.send(
      'Tarea eliminada'
    );

  } catch (err) {

    console.error(
      '🔥 ERROR ELIMINANDO TAREA:',
      err
    );

    res.status(500).send(
      err.message
    );
  }
});


// =====================================================
// INICIAR SERVIDOR
// =====================================================

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(
    `Servidor corriendo en puerto ${PORT}`
  );
});