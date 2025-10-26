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

  -- Crear tabla de relación N:M
  CREATE TABLE alumnos_clases (
    alumno_id INTEGER,
    clase_id INTEGER,
    PRIMARY KEY (alumno_id, clase_id),
    FOREIGN KEY (alumno_id) REFERENCES alumnos(id_alumno) ON DELETE CASCADE,
    FOREIGN KEY (clase_id) REFERENCES horario_clases(id_clase) ON DELETE CASCADE
  );

  -- Inserción de datos iniciales para la tabla alumnos (5 columnas)
  INSERT INTO alumnos (nombres, apellidos, dni, email, telefono) VALUES ('Leandro', 'Pérez', '11678443', 'leandro.perez@icloud.com', '54');
  INSERT INTO alumnos (nombres, apellidos, dni, email, telefono) VALUES ('Daiana', 'Martínez', '55412533', 'daiana.martinez@icloud.com', '54');
  INSERT INTO alumnos (nombres, apellidos, dni, email, telefono) VALUES ('María', 'Díaz', '24672546', 'maria.diaz@outlook.com', '54');
  INSERT INTO alumnos (nombres, apellidos, dni, email, telefono) VALUES ('Micaela', 'Ramos', '49544950', 'micaela.ramos@yahoo.com', '54');

  -- Inserción de datos iniciales para la tabla de clases
  INSERT INTO horario_clases (dia, hora, clase) VALUES ('lunes', '10:00:00', 'HATHA YOGA');
  INSERT INTO horario_clases (dia, hora, clase) VALUES ('lunes', '17:00:00', 'HATHA YOGA');
  INSERT INTO horario_clases (dia, hora, clase) VALUES ('lunes', '18:00:00', 'ACROYOGA');
  INSERT INTO horario_clases (dia, hora, clase) VALUES ('lunes', '19:00:00', 'PILATES');
  INSERT INTO horario_clases (dia, hora, clase) VALUES ('lunes', '20:00:00', 'HATHA YOGA');
  INSERT INTO horario_clases (dia, hora, clase) VALUES ('martes', '10:00:00', 'PILATES EXTREME');
  INSERT INTO horario_clases (dia, hora, clase) VALUES ('martes', '15:00:00', 'ASHTANGA YOGA');
  INSERT INTO horario_clases (dia, hora, clase) VALUES ('martes', '16:00:00', 'ACROYOGA');
  INSERT INTO horario_clases (dia, hora, clase) VALUES ('martes', '17:00:00', 'PILATES');
  INSERT INTO horario_clases (dia, hora, clase) VALUES ('martes', '18:00:00', 'PILATES EXTREME');
  INSERT INTO horario_clases (dia, hora, clase) VALUES ('miércoles', '10:00:00', 'HATHA YOGA');
  INSERT INTO horario_clases (dia, hora, clase) VALUES ('miércoles', '16:00:00', 'PILATES');
  INSERT INTO horario_clases (dia, hora, clase) VALUES ('miércoles', '18:00:00', 'ASHTANGA YOGA');
  INSERT INTO horario_clases (dia, hora, clase) VALUES ('miércoles', '19:00:00', 'PILATES');
  INSERT INTO horario_clases (dia, hora, clase) VALUES ('miércoles', '20:00:00', 'HATHA YOGA');
  INSERT INTO horario_clases (dia, hora, clase) VALUES ('jueves', '09:00:00', 'ACROYOGA');
  INSERT INTO horario_clases (dia, hora, clase) VALUES ('jueves', '10:00:00', 'PILATES EXTREME');
  INSERT INTO horario_clases (dia, hora, clase) VALUES ('jueves', '17:00:00', 'HATHA YOGA');
  INSERT INTO horario_clases (dia, hora, clase) VALUES ('jueves', '18:00:00', 'PILATES EXTREME');
  INSERT INTO horario_clases (dia, hora, clase) VALUES ('viernes', '09:00:00', 'PILATES');
  INSERT INTO horario_clases (dia, hora, clase) VALUES ('viernes', '15:00:00', 'ASHTANGA YOGA');
  INSERT INTO horario_clases (dia, hora, clase) VALUES ('viernes', '16:00:00', 'PILATES');
  INSERT INTO horario_clases (dia, hora, clase) VALUES ('viernes', '17:00:00', 'PILATES');
  INSERT INTO horario_clases (dia, hora, clase) VALUES ('viernes', '18:00:00', 'ACROYOGA');
  INSERT INTO horario_clases (dia, hora, clase) VALUES ('viernes', '19:00:00', 'PILATES');
  INSERT INTO horario_clases (dia, hora, clase) VALUES ('viernes', '20:00:00', 'HATHA YOGA');
  INSERT INTO horario_clases (dia, hora, clase) VALUES ('sábado', '09:00:00', 'YOGA+MEDITACIÓN');
  INSERT INTO horario_clases (dia, hora, clase) VALUES ('sábado', '10:00:00', 'ACROYOGA');
  INSERT INTO horario_clases (dia, hora, clase) VALUES ('sábado', '11:00:00', 'PILATES');

  -- Inserción de inscripciones iniciales (para tests)
  INSERT INTO alumnos_clases (alumno_id, clase_id) VALUES (1, 1);
  INSERT INTO alumnos_clases (alumno_id, clase_id) VALUES (2, 1);
  INSERT INTO alumnos_clases (alumno_id, clase_id) VALUES (3, 2);
  INSERT INTO alumnos_clases (alumno_id, clase_id) VALUES (4, 3);
`;


let db;

/**
 * Inicializa la base de datos SQLite.
 * Si la tabla 'alumnos' no existe o está vacía, crea las tablas e inserta los datos iniciales.
 */
async function initializeDatabase() {
  try {
    db = await open({
      filename: DB_PATH,
      driver: sqlite3.Database,
    });
    console.log('Base de datos SQLite conectada.');

    // Verificar si la base de datos necesita ser inicializada
    // Intentamos hacer un conteo en una tabla clave. Si falla, es que no existe.
    const result = await db.get("SELECT COUNT(*) AS count FROM alumnos");

    if (result.count === 0) {
      // Las tablas existen pero están vacías o la base de datos es nueva
      await db.exec(INITIAL_SQL_SCHEMA);
      console.log('Base de datos inicializada y poblada con datos por defecto.');
    } else {
      console.log('Base de datos ya poblada. Usando datos existentes.');
    }
  } catch (err) {
    // Si la consulta inicial falla (ej: la tabla no existe), ejecutamos el esquema completo.
    if (err.code === 'SQLITE_ERROR' && err.message.includes('no such table')) {
      try {
        await db.exec(INITIAL_SQL_SCHEMA);
        console.log('Base de datos creada, inicializada y poblada con datos por defecto.');
      } catch (execErr) {
        console.error('Error al ejecutar el esquema inicial de la base de datos:', execErr);
      }
    } else {
      console.error('Error al inicializar/conectar la base de datos:', err);
    }
  }
}

// --- Endpoints de la API RESTful ---

/**
 * GET /api/clases
 * Obtiene la grilla de horarios con el conteo de alumnos inscritos.
 * Nivel 2 REST: Incluye conteos dinámicos (metadata).
 */
app.get('/api/clases', async (req, res) => {
  try {
    const clases = await db.all(`
      SELECT
        hc.id_clase,
        hc.dia,
        hc.hora,
        hc.clase,
        hc.capacidad,
        COALESCE(COUNT(ac.alumno_id), 0) AS inscriptos
      FROM
        horario_clases hc
      LEFT JOIN
        alumnos_clases ac ON hc.id_clase = ac.clase_id
      GROUP BY
        hc.id_clase
      ORDER BY
        CASE hc.dia
          WHEN 'lunes' THEN 1
          WHEN 'martes' THEN 2
          WHEN 'miércoles' THEN 3
          WHEN 'jueves' THEN 4
          WHEN 'viernes' THEN 5
          WHEN 'sábado' THEN 6
          ELSE 7
        END,
        hc.hora;
    `);
    res.json(clases);
  } catch (error) {
    console.error('Error al obtener clases:', error);
    res.status(500).json({ error: 'Error interno al obtener los horarios de clases.' });
  }
});

/**
 * POST /api/reservar
 * Inscribe un nuevo alumno o uno existente a una o varias clases.
 * Implementa la lógica de cupos y la transacción de datos (ABM/CRUD: Create).
 */
app.post('/api/reservar', async (req, res) => {
  const { nombres, apellidos, dni, email, telefono, clasesSeleccionadas } = req.body;

  if (!nombres || !apellidos || !dni || !email || !clasesSeleccionadas || clasesSeleccionadas.length === 0) {
    return res.status(400).json({ error: 'Faltan campos obligatorios o clases seleccionadas.' });
  }

  try {
    let alumnoId;

    // 1. Verificar si el alumno ya existe por DNI o Email
    let existingAlumno = await db.get('SELECT id_alumno FROM alumnos WHERE dni = ? OR email = ?', [dni, email]);

    if (existingAlumno) {
      alumnoId = existingAlumno.id_alumno;
    } else {
      // 2. Insertar nuevo alumno si no existe
      const result = await db.run(
        'INSERT INTO alumnos (nombres, apellidos, dni, email, telefono) VALUES (?, ?, ?, ?, ?)',
        [nombres, apellidos, dni, email, telefono]
      );
      alumnoId = result.lastID;
    }

    // 3. Verificar cupos y realizar inscripciones
    const inscripcionesExitosas = [];
    const clasesCompletas = [];
    const clasesYaInscritas = [];

    for (const claseId of clasesSeleccionadas) {
      const claseInfo = await db.get(`
        SELECT
          hc.capacidad,
          hc.clase,
          hc.dia,
          hc.hora,
          COUNT(ac.alumno_id) AS inscriptos
        FROM horario_clases hc
        LEFT JOIN alumnos_clases ac ON hc.id_clase = ac.clase_id
        WHERE hc.id_clase = ?
        GROUP BY hc.id_clase;
      `, [claseId]);

      // Verificar si ya está inscrito
      const yaInscrito = await db.get('SELECT 1 FROM alumnos_clases WHERE alumno_id = ? AND clase_id = ?', [alumnoId, claseId]);

      if (yaInscrito) {
        clasesYaInscritas.push(`${claseInfo.clase} (${claseInfo.dia} ${claseInfo.hora})`);
        continue;
      }

      // Verificar cupo
      if (claseInfo.inscriptos >= claseInfo.capacidad) {
        clasesCompletas.push(`${claseInfo.clase} (${claseInfo.dia} ${claseInfo.hora})`);
        continue;
      }

      // Inscribir al alumno
      await db.run('INSERT INTO alumnos_clases (alumno_id, clase_id) VALUES (?, ?)', [alumnoId, claseId]);
      inscripcionesExitosas.push(`${claseInfo.clase} (${claseInfo.dia} ${claseInfo.hora})`);
    }

    // 4. Generar respuesta
    const response = {
      message: 'Proceso de reserva completado.',
      alumnoId: alumnoId,
      exitosas: inscripcionesExitosas,
      completas: clasesCompletas,
      yaInscritas: clasesYaInscritas,
    };

    if (clasesCompletas.length > 0) {
      // Devolver 200 OK con mensaje de advertencia
      return res.status(200).json(response);
    }

    res.status(201).json(response);

  } catch (error) {
    console.error('Error en el proceso de reserva:', error);
    res.status(500).json({ error: 'Error interno del servidor al procesar la reserva.' });
  }
});

/**
 * GET /api/alumnos
 * Obtiene la lista completa de alumnos. (ABM/CRUD: Read)
 */
app.get('/api/alumnos', async (req, res) => {
  try {
    const alumnos = await db.all('SELECT * FROM alumnos ORDER BY apellidos, nombres');
    res.json(alumnos);
  } catch (error) {
    console.error('Error al obtener alumnos:', error);
    res.status(500).json({ error: 'Error interno al obtener la lista de alumnos.' });
  }
});

/**
 * PUT /api/alumnos/:id
 * Actualiza los datos de un alumno. (ABM/CRUD: Update)
 */
app.put('/api/alumnos/:id', async (req, res) => {
  const { id } = req.params;
  const { nombres, apellidos, dni, email, telefono } = req.body;

  if (!nombres || !apellidos || !dni || !email) {
    return res.status(400).json({ error: 'Faltan campos obligatorios para la actualización.' });
  }

  try {
    const result = await db.run(
      'UPDATE alumnos SET nombres = ?, apellidos = ?, dni = ?, email = ?, telefono = ? WHERE id_alumno = ?',
      [nombres, apellidos, dni, email, telefono, id]
    );

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Alumno no encontrado o sin cambios.' });
    }

    res.json({ message: 'Alumno actualizado exitosamente.' });

  } catch (error) {
    console.error('Error al actualizar alumno:', error);
    res.status(500).json({ error: 'Error interno del servidor al actualizar el alumno.' });
  }
});

/**
 * DELETE /api/alumnos/:id
 * Elimina un alumno y todas sus inscripciones asociadas (debido a CASCADE). (ABM/CRUD: Delete)
 * RESTRICCIÓN DE SEGURIDAD: Requiere el header Authorization.
 */
app.delete('/api/alumnos/:id', async (req, res) => {
  // RESTRICCIÓN DE SEGURIDAD: Verificar autenticación simulada
  const authHeader = req.headers.authorization;
  if (!authHeader || authHeader !== 'ADMIN_TOKEN_SECRETO') {
    return res.status(401).json({ error: 'Acceso no autorizado. Se requiere autenticación para eliminar alumnos.' });
  }

  const { id } = req.params;

  try {
    const result = await db.run('DELETE FROM alumnos WHERE id_alumno = ?', [id]);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Alumno no encontrado.' });
    }

    res.json({ message: 'Alumno eliminado exitosamente (incluidas sus reservas).' });

  } catch (error) {
    console.error('Error al eliminar alumno:', error);
    res.status(500).json({ error: 'Error interno del servidor al eliminar el alumno.' });
  }
});

/**
 * GET /api/reporte/detalle
 * Nuevo endpoint para obtener la data del reporte PDF: clases con sus alumnos.
 */
app.get('/api/reporte/detalle', async (req, res) => {
  try {
    // 1. Obtener todas las clases con el conteo de alumnos
    const clases = await db.all(`
      SELECT
        hc.id_clase,
        hc.dia,
        hc.hora,
        hc.clase,
        hc.capacidad,
        COALESCE(COUNT(ac.alumno_id), 0) AS inscriptos
      FROM
        horario_clases hc
      LEFT JOIN
        alumnos_clases ac ON hc.id_clase = ac.clase_id
      GROUP BY
        hc.id_clase
      ORDER BY
        hc.dia, hc.hora;
    `);

    // 2. Para cada clase, obtener la lista de alumnos inscritos
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

// --- Inicio del Servidor ---
async function startServer() {
  await initializeDatabase();
  app.listen(PORT, () => {
    console.log(`Servidor API escuchando en http://localhost:${PORT}`);
    console.log(`Frontend disponible en http://localhost:${PORT}/`);
  });
}

startServer();
module.exports = app; // Exportar app para el testing

