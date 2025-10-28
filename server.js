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
app.use(express.static(path.join(__dirname, 'public')));

// --- ESQUEMA SQL INICIAL (Asegurando data completa y correcta) ---
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

  -- Inserción de datos iniciales para la tabla alumnos (30 registros del yoga.sql)
  INSERT INTO alumnos (nombres, apellidos, dni, email, telefono) VALUES
    ('Leandro', 'Pérez', '11678443', 'leandro.perez@icloud.com', '54'),
    ('Daiana', 'Martínez', '55412533', 'daiana.martinez@icloud.com', '54'),
    ('María', 'Díaz', '24672546', 'maria.diaz@outlook.com', '54'),
    ('Micaela', 'Ramos', '49544950', 'micaela.ramos@yahoo.com', '54'),
    ('Carolina', 'Ruiz', '20434052', 'carolina.ruiz@outlook.com', '54'),
    ('Gonzalo', 'Martínez', '34090698', 'gonzalo.martinez@yahoo.com', '54'),
    ('Tomás', 'Pérez', '35403012', 'tomas.perez@gmail.com', '54'),
    ('Hernán', 'López', '13075222', 'hernan.lopez@icloud.com', '54'),
    ('Sofía', 'Benítez', '28654492', 'sofia.benitez@hotmail.com', '54'),
    ('Bruno', 'Gutiérrez', '54974694', 'bruno.gutierrez@yahoo.com', '54'),
    ('Camila', 'Suárez', '35464823', 'camila.suarez@yahoo.com', '54'),
    ('Micaela', 'Gómez', '31169695', 'micaela.gomez@hotmail.com', '54'),
    ('Santiago', 'Ponce', '43502842', 'santiago.ponce@hotmail.com', '54'),
    ('Valentina', 'Silva', '59995364', 'valentina.silva@live.com', '54'),
    ('Lautaro', 'Pereyra', '19283286', 'lautaro.pereyra@live.com', '54'),
    ('Diego', 'Méndez', '20736210', 'diego.mendez@icloud.com', '54'),
    ('Rocío', 'Suárez', '45508262', 'rocio.suarez@yahoo.com', '54'),
    ('Milagros', 'Ponce', '32828789', 'milagros.ponce@gmail.com', '54'),
    ('Juan', 'Barrera', '58296952', 'juan.barrera@yahoo.com', '54'),
    ('Leandro', 'Muñoz', '52879174', 'leandro.munoz@live.com', '54'),
    ('Esteban', 'Torres', '46197113', 'esteban.torres@live.com', '54'),
    ('Jorge', 'Vega', '30636923', 'jorge.vega@outlook.com', '54'),
    ('Sol', 'Ferreyra', '14644773', 'sol.ferreyra@live.com', '54'),
    ('Morena', 'Torres', '27787649', 'morena.torres@live.com', '54'),
    ('Hernán', 'Muñoz', '36775919', 'hernan.munoz@icloud.com', '54'),
    ('Jorge', 'Silva', '25079183', 'jorge.silva@gmail.com', '54'),
    ('Juan', 'López', '57502401', 'juan.lopez@icloud.com', '54'),
    ('Carolina', 'López', '44504433', 'carolina.lopez@outlook.com', '54'),
    ('Sol', 'Figueroa', '48668909', 'sol.figueroa@hotmail.com', '54'),
    ('Sofía', 'Martínez', '54223583', 'sofia.martinez@hotmail.com', '54');

  -- Inserción de datos iniciales para la tabla de clases (30 registros del yoga.sql)
  INSERT INTO horario_clases (id_clase, dia, hora, clase) VALUES
    (2, 'lunes', '10:00:00', 'HATHA YOGA'),
    (3, 'lunes', '17:00:00', 'HATHA YOGA'),
    (4, 'lunes', '18:00:00', 'ACROYOGA'),
    (5, 'lunes', '19:00:00', 'PILATES'),
    (6, 'lunes', '20:00:00', 'HATHA YOGA'),
    (7, 'martes', '10:00:00', 'PILATES EXTREME'),
    (8, 'martes', '15:00:00', 'ASHTANGA YOGA'),
    (9, 'martes', '16:00:00', 'ACROYOGA'),
    (10, 'martes', '17:00:00', 'PILATES'),
    (11, 'martes', '18:00:00', 'PILATES EXTREME'),
    (12, 'miércoles', '10:00:00', 'HATHA YOGA'),
    (13, 'miércoles', '16:00:00', 'PILATES'),
    (14, 'miércoles', '18:00:00', 'ASHTANGA YOGA'),
    (15, 'miércoles', '19:00:00', 'PILATES'),
    (16, 'miércoles', '20:00:00', 'HATHA YOGA'),
    (17, 'jueves', '09:00:00', 'ACROYOGA'),
    (18, 'jueves', '10:00:00', 'PILATES EXTREME'),
    (19, 'jueves', '17:00:00', 'HATHA YOGA'),
    (20, 'jueves', '18:00:00', 'PILATES EXTREME'),
    (21, 'viernes', '09:00:00', 'PILATES'),
    (22, 'viernes', '15:00:00', 'ASHTANGA YOGA'),
    (23, 'viernes', '16:00:00', 'PILATES'),
    (24, 'viernes', '17:00:00', 'PILATES'),
    (25, 'viernes', '18:00:00', 'ACROYOGA'),
    (26, 'viernes', '19:00:00', 'PILATES'),
    (27, 'viernes', '20:00:00', 'HATHA YOGA'),
    (28, 'sábado ', '09:00:00', 'YOGA+MEDITACIÓN'),
    (29, 'sábado ', '10:00:00', 'ACROYOGA'),
    (30, 'sábado ', '11:00:00', 'PILATES');
    
  -- Inserción de inscripciones iniciales (del yoga.sql, Alumno ID 1 y 2)
  INSERT INTO alumnos_clases (alumno_id, clase_id) VALUES (1, 10);
  INSERT INTO alumnos_clases (alumno_id, clase_id) VALUES (1, 24);
  INSERT INTO alumnos_clases (alumno_id, clase_id) VALUES (2, 2);
  INSERT INTO alumnos_clases (alumno_id, clase_id) VALUES (2, 12);

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
        COALESCE(COUNT(ac.alumno_id), 0) AS inscriptos
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
          WHEN 'sábado ' THEN 6 -- Usar 'sábado ' para coincidir con el insert
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
  //const { nombres, apellidos, dni, email, telefono } = req.body;

const { nombres, apellidos, dni, email, telefono, clasesSeleccionadas } = req.body;

  if (!nombres || !apellidos || !dni || !email || !clasesSeleccionadas || clasesSeleccionadas.length === 0) {
  

  //const { nombres, apellidos, dni, email, telefono, clasesSeleccionadas } = req.body;

 // if (!nombres || !apellidos || !dni || !email || !clasesSeleccionadas || clasesSeleccionadas.length === 0) {

  try {
    // 1. Obtener o Crear el Alumno
    let alumno = await db.get('SELECT id_alumno FROM alumnos WHERE dni = ? OR email = ?', [dni, email]);

    if (!alumno) {
      // Crear nuevo alumno
      const result = await db.run(
        'INSERT INTO alumnos (nombres, apellidos, dni, email, telefono) VALUES (?, ?, ?, ?, ?)',
        [nombres, apellidos, dni, email, telefono]
      );
      alumno = { id_alumno: result.lastID };
    }

    const alumnoId = alumno.id_alumno;
    const clasesExitosas = [];
    const clasesCompletas = [];
    const clasesYaInscritas = []; // Añadido para mejor feedback

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

      if (!cupo) continue;
      
      const claseNombre = `${cupo.clase} (${cupo.dia.trim()} ${cupo.hora.slice(0, 5)})`;

      // B. Chequear si ya está inscripto
      const yaInscripto = await db.get(
        'SELECT 1 FROM alumnos_clases WHERE alumno_id = ? AND clase_id = ?',
        [alumnoId, claseId]
      );

      if (yaInscripto) {
        clasesYaInscritas.push(claseNombre);
        continue;
      }

      // C. Verificar si hay cupo
      // **CORRECCIÓN LÓGICA:** Usar cupo.capacidad
      if (cupo.inscriptos < cupo.capacidad) {
        // Inscribir al alumno
        await db.run(
          'INSERT INTO alumnos_clases (alumno_id, clase_id) VALUES (?, ?)',
          [alumnoId, claseId]
        );
        clasesExitosas.push(claseNombre);
      } else {
        // Clase llena
        clasesCompletas.push(claseNombre);
      }
    }

    // 3. Devolver la Respuesta al Cliente
    let statusCode = 201; // Estado por defecto: Creado
    let message = 'Proceso de reserva completado.';

    if (clasesExitosas.length === 0 && (clasesCompletas.length > 0 || clasesYaInscritas.length > 0)) {
      statusCode = 200; // No se creó nada, solo hubo errores/avisos
      message = 'No se pudo completar la reserva. Las clases estaban llenas o ya reservadas.';
    } else if (clasesCompletas.length > 0 || clasesYaInscritas.length > 0) {
      statusCode = 200; // Éxitos parciales, devolver 200 con alerta
      message = 'Reserva(s) exitosa(s) con algunas advertencias.';
    }

    res.status(statusCode).json({
      message: message,
      alumnoId: alumnoId,
      exitosas: clasesExitosas,
      completas: clasesCompletas,
      yaInscritas: clasesYaInscritas,
    });

  } catch (error) {
    if (error.code === 'SQLITE_CONSTRAINT') {
      return res.status(409).json({ error: 'El DNI o Email ya se encuentran registrados. Intente con otro.' });
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
      return res.status(404).json({ error: 'Alumno no encontrado o sin cambios.' });
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
app.delete('/api/alumnos/:id', async (req, res) => {
  const { id } = req.params;
  const authToken = req.headers.authorization;
  const ADMIN_TOKEN = 'ADMIN_TOKEN_SECRETO';

  if (authToken !== ADMIN_TOKEN) {
    return res.status(403).json({ error: 'Acceso denegado. Se requiere autenticación de administrador.' });
  }

  try {
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
        COALESCE(COUNT(ac.alumno_id), 0) AS inscriptos
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
app.get('/', (req, res) => {
  const filePath = path.join(__dirname, 'index.html');
  res.sendFile(filePath, (err) => {
    if (err) {
      console.error("Error al servir el index.html:", err);
      res.status(500).send('Error al cargar la aplicación frontend.');
    }
  });
});

// Ruta de fallback para servir el frontend
app.get('*', (req, res) => {
  const filePath = path.join(__dirname, 'index.html');
  res.sendFile(filePath);
});


// --- Iniciar el Servidor ---
async function startServer() {
  try {
    // Abrir la base de datos (se crea si no existe)
    db = await open({
      filename: DB_PATH,
      driver: sqlite3.Database
    });

    // Inicializar el esquema de la base de datos (siempre se reinicia para garantizar consistencia)
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

// **Añadido para Testing**
// Definir la función openDatabase. Necesita ser una función con nombre
// si la vamos a referenciar en el objeto de exportación.
async function openDatabase() {
    db = await open({
      filename: DB_PATH,
      driver: sqlite3.Database
    });
    return db; // Retorna el objeto db abierto
}


// Iniciar (solo si el archivo se ejecuta directamente, no cuando es importado para testing)
if (require.main === module) {
  startServer();
}

// **Exportaciones para Testing**
// Exportar un objeto con TODAS las propiedades referenciadas correctamente
module.exports = {
    app: app,
    CAPACIDAD_MAXIMA: CAPACIDAD_MAXIMA,
    initializeDatabase: initializeDatabase,
    openDatabase: openDatabase 
};






