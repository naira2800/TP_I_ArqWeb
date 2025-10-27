const express = require('express');
const cors = require('cors');
const path = require('path');
const { open } = require('sqlite');
const sqlite3 = require('sqlite3');
const { v4: uuidv4 } = require('uuid');

// --- Configuración Inicial ---
const app = express();
const PORT = 3000;
const DB_PATH = path.join(__dirname, 'yoga.db');
const CAPACIDAD_MAXIMA = 6;

// Variables para la conexión y el servidor (usadas por startServer/testing)
let db; 
let server; 

// Middleware
app.use(cors());
app.use(express.json());

// --- ESQUEMA SQL INICIAL (Autocontenido) ---
const INITIAL_SQL_SCHEMA = `
  -- Eliminar tablas si existen para garantizar un estado limpio en la inicialización
  DROP TABLE IF EXISTS alumnos_clases;
  DROP TABLE IF EXISTS alumnos;
  DROP TABLE IF EXISTS horario_clases;

  -- Crear tabla de alumnos
  CREATE TABLE alumnos (
    id_alumno INTEGER PRIMARY KEY AUTOINCREMENT,
    nombres TEXT NOT NULL,
    apellidos TEXT NOT NULL,
    dni TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    telefono TEXT
  );

  -- Crear tabla de horario de clases
  CREATE TABLE horario_clases (
    id_clase INTEGER PRIMARY KEY AUTOINCREMENT,
    dia TEXT NOT NULL,
    hora TIME NOT NULL,
    clase TEXT NOT NULL,
    capacidad INTEGER NOT NULL DEFAULT ${CAPACIDAD_MAXIMA}
  );

  -- Crear tabla de relación (muchos a muchos)
  CREATE TABLE alumnos_clases (
    alumno_id INTEGER,
    clase_id INTEGER,
    fecha_inscripcion DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (alumno_id, clase_id),
    FOREIGN KEY (alumno_id) REFERENCES alumnos(id_alumno) ON DELETE CASCADE,
    FOREIGN KEY (clase_id) REFERENCES horario_clases(id_clase) ON DELETE CASCADE
  );

  -- INSERTS de la Data Inicial (similar a yoga.sql)
  -- Clases (total 26)
  INSERT INTO horario_clases (dia, hora, clase) VALUES
    ('lunes', '09:00:00', 'HATHA YOGA'),
    ('lunes', '10:00:00', 'PILATES'),
    ('lunes', '17:00:00', 'ASHTANGA YOGA'),
    ('lunes', '18:00:00', 'ACROYOGA'),
    ('lunes', '19:00:00', 'PILATES'),
    ('lunes', '20:00:00', 'HATHA YOGA'),
    ('martes', '09:00:00', 'ASHTANGA YOGA'),
    ('martes', '10:00:00', 'HATHA YOGA'),
    ('martes', '17:00:00', 'PILATES'),
    ('martes', '18:00:00', 'ACROYOGA'),
    ('martes', '19:00:00', 'HATHA YOGA'),
    ('martes', '20:00:00', 'PILATES'),
    ('miércoles', '09:00:00', 'PILATES'),
    ('miércoles', '10:00:00', 'HATHA YOGA'),
    ('miércoles', '16:00:00', 'PILATES'),
    ('miércoles', '18:00:00', 'ASHTANGA YOGA'),
    ('miércoles', '19:00:00', 'PILATES'),
    ('miércoles', '20:00:00', 'HATHA YOGA'),
    ('jueves', '09:00:00', 'ACROYOGA'),
    ('jueves', '10:00:00', 'PILATES EXTREME'),
    ('jueves', '17:00:00', 'HATHA YOGA'),
    ('jueves', '18:00:00', 'PILATES EXTREME'),
    ('viernes', '09:00:00', 'PILATES'),
    ('viernes', '15:00:00', 'ASHTANGA YOGA'),
    ('viernes', '16:00:00', 'HATHA YOGA'),
    ('sábado ', '10:00:00', 'PILATES'); -- Nota: Sábado tiene un espacio final en la data original

  -- Alumnos de prueba
  INSERT INTO alumnos (nombres, apellidos, dni, email, telefono) VALUES
    ('Juan', 'Pérez', '12345678', 'juan.perez@test.com', '1122334455'), -- ID 1
    ('Ana', 'Gómez', '87654321', 'ana.gomez@test.com', '9988776655'); -- ID 2

  -- Inscripciones de prueba (Algunas clases llenas para testing)
  -- Clase 1 (Lunes 09:00) - Llenarla con 2
  INSERT INTO alumnos_clases (alumno_id, clase_id) VALUES (1, 1);
  INSERT INTO alumnos_clases (alumno_id, clase_id) VALUES (2, 1);
  
  -- Clase 2 (Lunes 10:00) - 1 alumno
  INSERT INTO alumnos_clases (alumno_id, clase_id) VALUES (1, 2);

  -- Clase 3 (Lunes 17:00) - 1 alumno
  INSERT INTO alumnos_clases (alumno_id, clase_id) VALUES (2, 3);

  -- Clase 4 (Lunes 18:00) - 1 alumno
  INSERT INTO alumnos_clases (alumno_id, clase_id) VALUES (1, 4);
  
  -- Clase 10 (Martes 18:00) - 1 alumno
  INSERT INTO alumnos_clases (alumno_id, clase_id) VALUES (2, 10);
  
  -- Clase 26 (Sábado 10:00) - 1 alumno
  INSERT INTO alumnos_clases (alumno_id, clase_id) VALUES (1, 26);

`;

// Función para inicializar la base de datos
async function initializeDatabase() {
  await db.exec(INITIAL_SQL_SCHEMA);
  console.log('[DB] Base de datos inicializada con esquema y data de prueba.');
}

// --- Rutas de la API ---

// 1. GET /api/clases - Horario con cupos
app.get('/api/clases', async (req, res) => {
  try {
    const clases = await db.all(`
      SELECT
        hc.id_clase,
        hc.dia,
        hc.hora,
        hc.clase,
        hc.capacidad,
        COUNT(ac.alumno_id) AS inscriptos
      FROM
        horario_clases hc
      LEFT JOIN
        alumnos_clases ac ON hc.id_clase = ac.clase_id
      GROUP BY
        hc.id_clase, hc.dia, hc.hora, hc.clase, hc.capacidad
      ORDER BY
        CASE hc.dia
          WHEN 'lunes' THEN 1
          WHEN 'martes' THEN 2
          WHEN 'miércoles' THEN 3
          WHEN 'jueves' THEN 4
          WHEN 'viernes' THEN 5
          WHEN 'sábado ' THEN 6 -- Cuidado con el espacio en 'sábado '
          ELSE 7
        END,
        hc.hora;
    `);

    res.json(clases);
  } catch (error) {
    console.error('Error al obtener el horario de clases:', error);
    res.status(500).json({ error: 'Error interno al cargar los horarios.' });
  }
});

// 2. POST /api/reservar - Reservar Clases
app.post('/api/reservar', async (req, res) => {
  const { nombres, apellidos, dni, email, telefono, clasesSeleccionadas } = req.body;

  if (!nombres || !apellidos || !dni || !email || !clasesSeleccionadas || clasesSeleccionadas.length === 0) {
    return res.status(400).json({ error: 'Faltan campos obligatorios para la reserva.' });
  }

  try {
    // 1. Obtener o Crear el Alumno
    let alumno = await db.get('SELECT id_alumno FROM alumnos WHERE dni = ?', [dni]);

    if (!alumno) {
      // Crear nuevo alumno
      const result = await db.run(
        'INSERT INTO alumnos (nombres, apellidos, dni, email, telefono) VALUES (?, ?, ?, ?, ?)',
        [nombres, apellidos, dni, email, telefono]
      );
      alumno = { id_alumno: result.lastID };
      console.log(`[RESERVA] Nuevo alumno creado: ${nombres} ${apellidos} (ID: ${alumno.id_alumno})`);
    }

    const alumnoId = alumno.id_alumno;
    const clasesExitosas = [];
    const clasesCompletas = [];

    // 2. Procesar las Reservas
    for (const claseIdStr of clasesSeleccionadas) {
      const claseId = parseInt(claseIdStr);

      // A. Verificar cupo actual
      const cupo = await db.get(`
        SELECT
          hc.id_clase,
          hc.dia,
          hc.hora,
          hc.clase,
          hc.capacidad,
          COUNT(ac.alumno_id) AS inscriptos
        FROM
          horario_clases hc
        LEFT JOIN
          alumnos_clases ac ON hc.id_clase = ac.clase_id
        WHERE
          hc.id_clase = ?
        GROUP BY
          hc.id_clase, hc.dia, hc.hora, hc.clase, hc.capacidad;
      `, [claseId]);

      if (!cupo) {
        console.warn(`[RESERVA] Clase ID ${claseId} no encontrada.`);
        continue;
      }
      
      const claseNombre = `${cupo.clase} (${cupo.dia} ${cupo.hora})`;

      // B. Chequear si ya está inscripto
      const yaInscripto = await db.get(
        'SELECT 1 FROM alumnos_clases WHERE alumno_id = ? AND clase_id = ?',
        [alumnoId, claseId]
      );

      if (yaInscripto) {
        // Ignorar si ya está inscripto, no es un error
        console.log(`[RESERVA] Alumno ${alumnoId} ya estaba inscripto a Clase ${claseId}.`);
        continue;
      }

      // C. Verificar si hay cupo
      if (cupo.inscriptos < cupo.capacidad) {
        // Inscribir al alumno
        await db.run(
          'INSERT INTO alumnos_clases (alumno_id, clase_id) VALUES (?, ?)',
          [alumnoId, claseId]
        );
        clasesExitosas.push(claseNombre);
        console.log(`[RESERVA] Inscripción exitosa: Alumno ${alumnoId} a Clase ${claseId}`);
      } else {
        // Clase llena
        clasesCompletas.push(claseNombre);
        console.log(`[RESERVA] Clase ID ${claseId} completa: ${cupo.inscriptos}/${cupo.capacidad}`);
      }
    }

    // 3. Devolver la Respuesta al Cliente
    let statusCode = 201; // Estado por defecto: Creado
    let message = 'Proceso de reserva completado.';

    if (clasesExitosas.length === 0 && clasesCompletas.length > 0) {
      statusCode = 200; // No se creó nada, solo hubo errores de cupo
      message = 'Las clases seleccionadas estaban completas o ya reservadas.';
    } else if (clasesCompletas.length > 0) {
      statusCode = 200; // Éxitos parciales, devolver 200 con alerta
      message = 'Reserva(s) exitosa(s), pero algunas clases estaban completas.';
    }

    res.status(statusCode).json({
      message: message,
      alumnoId: alumnoId,
      exitosas: clasesExitosas,
      completas: clasesCompletas,
    });

  } catch (error) {
    // Manejar errores de DNI/Email duplicado si el alumno era nuevo
    if (error.code === 'SQLITE_CONSTRAINT') {
      return res.status(409).json({ error: 'El DNI o Email ya se encuentran registrados por otro alumno. Intente nuevamente.' });
    }
    console.error('Error en el proceso de reserva:', error);
    res.status(500).json({ error: 'Error interno del servidor al procesar la reserva.' });
  }
});


// 3. GET /api/alumnos - Reporte de Alumnos (CRUD LIST)
app.get('/api/alumnos', async (req, res) => {
  try {
    const alumnos = await db.all('SELECT * FROM alumnos ORDER BY apellidos, nombres');
    res.json(alumnos);
  } catch (error) {
    console.error('Error al obtener la lista de alumnos:', error);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
});


// 4. PUT /api/alumnos/:id - Actualizar Alumno (CRUD UPDATE)
app.put('/api/alumnos/:id', async (req, res) => {
  const { id } = req.params;
  const { nombres, apellidos, dni, email, telefono } = req.body;

  if (!nombres || !apellidos || !dni || !email) {
    return res.status(400).json({ error: 'Faltan campos obligatorios para la actualización (Nombres, Apellidos, DNI, Email).' });
  }

  try {
    const result = await db.run(
      'UPDATE alumnos SET nombres = ?, apellidos = ?, dni = ?, email = ?, telefono = ? WHERE id_alumno = ?',
      [nombres, apellidos, dni, email, telefono, id]
    );

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Alumno no encontrado para actualizar.' });
    }

    res.status(200).json({ message: 'Alumno actualizado exitosamente.' });
  } catch (error) {
    if (error.code === 'SQLITE_CONSTRAINT') {
      return res.status(409).json({ error: 'El DNI o Email ya está registrado por otro alumno.' });
    }
    console.error(`Error al actualizar alumno ${id}:`, error);
    res.status(500).json({ error: 'Error interno al actualizar el alumno.' });
  }
});


// 5. DELETE /api/alumnos/:id - Eliminar Alumno (CRUD DELETE)
// Se requiere un token de autorización simple para esta operación
app.delete('/api/alumnos/:id', async (req, res) => {
  const { id } = req.params;
  const authToken = req.headers.authorization;
  const ADMIN_TOKEN = 'ADMIN_TOKEN_SECRETO'; // Token simple para demostración

  if (authToken !== ADMIN_TOKEN) {
    return res.status(403).json({ error: 'Acceso denegado. Se requiere autenticación de administrador.' });
  }

  try {
    // Alumnos_clases tiene ON DELETE CASCADE, por lo que solo borramos al alumno
    const result = await db.run('DELETE FROM alumnos WHERE id_alumno = ?', [id]);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Alumno no encontrado para eliminar.' });
    }

    res.status(200).json({ message: 'Alumno eliminado exitosamente (incluidas sus reservas).' });
  } catch (error) {
    console.error(`Error al eliminar alumno ${id}:`, error);
    res.status(500).json({ error: 'Error interno al eliminar el alumno.' });
  }
});


// 6. GET /api/reporte/detalle - Reporte Detallado de Clases
app.get('/api/reporte/detalle', async (req, res) => {
  try {
    // 1. Obtener todas las clases con el conteo de inscriptos
    const clases = await db.all(`
      SELECT
        hc.id_clase,
        hc.dia,
        hc.hora,
        hc.clase,
        hc.capacidad,
        COUNT(ac.alumno_id) AS inscriptos
      FROM
        horario_clases hc
      LEFT JOIN
        alumnos_clases ac ON hc.id_clase = ac.clase_id
      GROUP BY
        hc.id_clase, hc.dia, hc.hora, hc.clase, hc.capacidad
      ORDER BY
        hc.dia, hc.hora;
    `);

    // 2. Para cada clase, adjuntar la lista de alumnos inscritos
    for (const clase of clases) {
      const alumnos = await db.all(`
        SELECT
          a.id_alumno,
          a.nombres,
          a.apellidos,
          a.dni
        FROM
          alumnos a
        JOIN
          alumnos_clases ac ON a.id_alumno = ac.alumno_id
        WHERE
          ac.clase_id = ?
        ORDER BY
          a.apellidos, a.nombres;
      `, [clase.id_clase]);
      clase.alumnos_inscritos = alumnos;
    }

    res.json(clases);
  } catch (error) {
    console.error('Error al generar el reporte de detalle:', error);
    res.status(500).json({ error: 'Error interno al generar el reporte de detalle.' });
  }
});


// --- Servir el Frontend (index.html) ---
// Esta debe ser la última ruta para actuar como fallback
app.get('*', (req, res) => {
  // Aseguramos que el servidor sirva el index.html en la ruta raíz
  const filePath = path.join(__dirname, 'index.html');
  res.sendFile(filePath, (err) => {
    if (err) {
      console.error("Error al servir el index.html:", err);
      res.status(500).send('Error al cargar la aplicación frontend.');
    }
  });
});


// --- Iniciar el Servidor ---
async function startServer() {
  try {
    // Abrir la base de datos (se crea si no existe)
    db = await open({
      filename: DB_PATH,
      driver: sqlite3.Database
    });

    // Inicializar el esquema de la base de datos
    await initializeDatabase();

    // Iniciar el servidor
    server = app.listen(PORT, () => {
      console.log(`\n\n[SERVER] Servidor corriendo en http://localhost:${PORT}`);
    });

  } catch (err) {
    console.error(`\n\n[ERROR] No se pudo iniciar el servidor o conectar a la base de datos: ${err.message}`);
    process.exit(1);
  }
}

// Iniciar
startServer();

// **Exportaciones para Testing**
// Exportamos la app y la constante CAPACIDAD_MAXIMA para que 'server.test.js' pueda utilizarlos.
module.exports = app;
module.exports.CAPACIDAD_MAXIMA = CAPACIDAD_MAXIMA;
