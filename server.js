// Importaciones de librerías esenciales
const express = require('express');
const cors = require('cors');
const path = require('path');
const sqlite = require('sqlite');
const sqlite3 = require('sqlite3');
const { v4: uuidv4 } = require('uuid');

// --- Configuración Inicial ---
const app = express();
const PORT = 3000;
const DB_PATH = 'yoga.db'; // Nombre del archivo de la base de datos SQLite

// Usar middlewares
app.use(cors());
app.use(express.json());

// Base de datos
let db;

// Esquema SQL con datos iniciales (NO DEPENDE DE UN ARCHIVO EXTERNO)
const INITIAL_SQL_SCHEMA = `
-- Creación de tablas
CREATE TABLE alumnos (
  id_alumno TEXT PRIMARY KEY,
  nombres TEXT NOT NULL,
  apellidos TEXT NOT NULL,
  dni TEXT UNIQUE NOT NULL,
  email TEXT,
  telefono TEXT
);

CREATE TABLE horario_clases (
  id_clase INTEGER PRIMARY KEY,
  dia TEXT,
  hora TEXT,
  clase TEXT,
  capacidad INTEGER DEFAULT 6
);

CREATE TABLE alumnos_clases (
  alumno_id TEXT,
  clase_id INTEGER,
  PRIMARY KEY (alumno_id, clase_id),
  FOREIGN KEY (alumno_id) REFERENCES alumnos(id_alumno) ON DELETE CASCADE,
  FOREIGN KEY (clase_id) REFERENCES horario_clases(id_clase) ON DELETE CASCADE
);

-- Inserción de 30 alumnos (ajustado a 5 columnas para evitar error)
INSERT INTO alumnos (id_alumno, nombres, apellidos, dni, email, telefono) VALUES ('a1', 'Leandro', 'Pérez', '11678443', 'leandro.perez@icloud.com', '54');
INSERT INTO alumnos (id_alumno, nombres, apellidos, dni, email, telefono) VALUES ('a2', 'Daiana', 'Martínez', '55412533', 'daiana.martinez@icloud.com', '54');
INSERT INTO alumnos (id_alumno, nombres, apellidos, dni, email, telefono) VALUES ('a3', 'María', 'Díaz', '24672546', 'maria.diaz@outlook.com', '54');
INSERT INTO alumnos (id_alumno, nombres, apellidos, dni, email, telefono) VALUES ('a4', 'Micaela', 'Ramos', '49544950', 'micaela.ramos@yahoo.com', '54');
INSERT INTO alumnos (id_alumno, nombres, apellidos, dni, email, telefono) VALUES ('a5', 'Carolina', 'Ruiz', '20434052', 'carolina.ruiz@outlook.com', '54');
INSERT INTO alumnos (id_alumno, nombres, apellidos, dni, email, telefono) VALUES ('a6', 'Gonzalo', 'Martínez', '34090698', 'gonzalo.martinez@yahoo.com', '54');

-- Inserción de Horarios de Clases (Capacidad máxima 6 por defecto)
INSERT INTO horario_clases (id_clase, dia, hora, clase) VALUES (2, 'Lunes', '10:00:00', 'HATHA YOGA');
INSERT INTO horario_clases (id_clase, dia, hora, clase) VALUES (3, 'Lunes', '17:00:00', 'HATHA YOGA');
INSERT INTO horario_clases (id_clase, dia, hora, clase) VALUES (4, 'Lunes', '18:00:00', 'ACROYOGA');
INSERT INTO horario_clases (id_clase, dia, hora, clase) VALUES (5, 'Lunes', '19:00:00', 'PILATES');
INSERT INTO horario_clases (id_clase, dia, hora, clase) VALUES (6, 'Lunes', '20:00:00', 'HATHA YOGA');
INSERT INTO horario_clases (id_clase, dia, hora, clase) VALUES (7, 'Martes', '10:00:00', 'PILATES EXTREME');
INSERT INTO horario_clases (id_clase, dia, hora, clase) VALUES (8, 'Martes', '15:00:00', 'ASHTANGA YOGA');
INSERT INTO horario_clases (id_clase, dia, hora, clase) VALUES (9, 'Martes', '16:00:00', 'ACROYOGA');
INSERT INTO horario_clases (id_clase, dia, hora, clase) VALUES (10, 'Martes', '17:00:00', 'PILATES');
INSERT INTO horario_clases (id_clase, dia, hora, clase) VALUES (11, 'Martes', '18:00:00', 'PILATES EXTREME');
INSERT INTO horario_clases (id_clase, dia, hora, clase) VALUES (12, 'Miércoles', '10:00:00', 'HATHA YOGA');
INSERT INTO horario_clases (id_clase, dia, hora, clase) VALUES (13, 'Miércoles', '16:00:00', 'PILATES');
INSERT INTO horario_clases (id_clase, dia, hora, clase) VALUES (14, 'Miércoles', '18:00:00', 'ASHTANGA YOGA');
INSERT INTO horario_clases (id_clase, dia, hora, clase) VALUES (15, 'Miércoles', '19:00:00', 'PILATES');
INSERT INTO horario_clases (id_clase, dia, hora, clase) VALUES (16, 'Miércoles', '20:00:00', 'HATHA YOGA');
INSERT INTO horario_clases (id_clase, dia, hora, clase) VALUES (17, 'Jueves', '09:00:00', 'ACROYOGA');
INSERT INTO horario_clases (id_clase, dia, hora, clase) VALUES (18, 'Jueves', '10:00:00', 'PILATES EXTREME');
INSERT INTO horario_clases (id_clase, dia, hora, clase) VALUES (19, 'Jueves', '17:00:00', 'HATHA YOGA');
INSERT INTO horario_clases (id_clase, dia, hora, clase) VALUES (20, 'Jueves', '18:00:00', 'PILATES EXTREME');
INSERT INTO horario_clases (id_clase, dia, hora, clase) VALUES (21, 'Viernes', '09:00:00', 'PILATES');
INSERT INTO horario_clases (id_clase, dia, hora, clase) VALUES (22, 'Viernes', '15:00:00', 'ASHTANGA YOGA');
INSERT INTO horario_clases (id_clase, dia, hora, clase) VALUES (23, 'Viernes', '16:00:00', 'PILATES');
INSERT INTO horario_clases (id_clase, dia, hora, clase) VALUES (24, 'Viernes', '17:00:00', 'PILATES');
INSERT INTO horario_clases (id_clase, dia, hora, clase) VALUES (25, 'Viernes', '18:00:00', 'ACROYOGA');
INSERT INTO horario_clases (id_clase, dia, hora, clase) VALUES (26, 'Viernes', '19:00:00', 'PILATES');
INSERT INTO horario_clases (id_clase, dia, hora, clase) VALUES (27, 'Viernes', '20:00:00', 'HATHA YOGA');
INSERT INTO horario_clases (id_clase, dia, hora, clase) VALUES (28, 'Sábado', '09:00:00', 'YOGA+MEDITACIÓN');
INSERT INTO horario_clases (id_clase, dia, hora, clase) VALUES (29, 'Sábado', '10:00:00', 'ACROYOGA');
INSERT INTO horario_clases (id_clase, dia, hora, clase) VALUES (30, 'Sábado', '11:00:00', 'PILATES');

-- Inserción de inscripciones iniciales
INSERT INTO alumnos_clases (alumno_id, clase_id) VALUES ('a1', 10);
INSERT INTO alumnos_clases (alumno_id, clase_id) VALUES ('a1', 24);
INSERT INTO alumnos_clases (alumno_id, clase_id) VALUES ('a2', 2);
INSERT INTO alumnos_clases (alumno_id, clase_id) VALUES ('a2', 12);
INSERT INTO alumnos_clases (alumno_id, clase_id) VALUES ('a3', 10);
INSERT INTO alumnos_clases (alumno_id, clase_id) VALUES ('a4', 2);
`;

// --- Funciones de Base de Datos ---

/**
 * Inicializa la conexión a la base de datos y crea las tablas e inserta
 * los datos iniciales si no existen (Persistencia Real).
 */
async function initializeDatabase() {
    // 1. Abrir la conexión
    db = await sqlite.open({ filename: DB_PATH, driver: sqlite3.Database });

    try {
        // 2. Intentar una consulta simple para verificar si la tabla 'alumnos' ya existe y tiene datos.
        const result = await db.get("SELECT COUNT(id_alumno) AS count FROM alumnos");
        
        // Si la tabla existe y tiene datos, no hacemos nada (Persistencia OK)
        if (result && result.count > 0) {
            console.log('Base de datos ya inicializada. Conservando datos existentes.');
            return;
        }
        
    } catch (error) {
        // 3. Si la tabla no existe (SQLITE_ERROR) o está vacía, procedemos a inicializar.
        // Solo capturamos el error para proceder con la inicialización.
        console.log('Base de datos no inicializada o vacía. Creando tablas e insertando datos iniciales.');
    }

    // 4. Ejecutar el script completo de creación e inserción de datos iniciales
    try {
        await db.exec(INITIAL_SQL_SCHEMA);
        console.log('Base de datos inicializada con éxito.');
    } catch (e) {
        console.error("Error al ejecutar el esquema SQL inicial:", e);
        // Si falla aquí, probablemente la DB está corrupta o el SQL tiene un error de sintaxis.
    }
}

// --- Lógica de la API RESTful ---

/**
 * Endpoint 1: Obtener Grilla de Horarios con Conteo de Alumnos (Reporte)
 * Nivel RESTful: 2 (Recurso: /clases. Usa el verbo GET)
 */
app.get('/api/clases', async (req, res) => {
    // Consulta SQL avanzada para obtener la grilla y calcular los cupos por clase
    const query = `
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
                WHEN 'Lunes' THEN 1
                WHEN 'Martes' THEN 2
                WHEN 'Miércoles' THEN 3
                WHEN 'Jueves' THEN 4
                WHEN 'Viernes' THEN 5
                WHEN 'Sábado' THEN 6
                ELSE 7
            END,
            hc.hora;
    `;

    try {
        const clases = await db.all(query);
        res.json(clases);
    } catch (error) {
        console.error("Error al obtener la grilla de clases:", error);
        res.status(500).json({ error: 'Error al obtener la grilla de clases.' });
    }
});


/**
 * Endpoint 2: Gestión de Alumnos (CRUD/ABM) - Obtener todos los alumnos
 * Nivel RESTful: 2 (Recurso: /alumnos. Usa el verbo GET)
 * Nota: El POST para crear alumnos se realiza en el endpoint de reserva.
 */
app.get('/api/alumnos', async (req, res) => {
    try {
        const alumnos = await db.all('SELECT id_alumno, nombres, apellidos, dni, email, telefono FROM alumnos');
        res.json(alumnos);
    } catch (error) {
        console.error("Error al obtener alumnos:", error);
        res.status(500).json({ error: 'Error al obtener la lista de alumnos.' });
    }
});

/**
 * Endpoint 3: Gestión de Alumnos (CRUD/ABM) - Eliminar Alumno
 * Nivel RESTful: 2 (Recurso: /alumnos/:id. Usa el verbo DELETE)
 */
app.delete('/api/alumnos/:id', async (req, res) => {
    const { id } = req.params;
    try {
        // SQLite maneja la eliminación en cascada (DELETE CASCADE)
        // por lo que las inscripciones en alumnos_clases se eliminarán automáticamente.
        await db.run('DELETE FROM alumnos WHERE id_alumno = ?', id);
        
        // El frontend necesita re-validar la lista de alumnos.
        res.status(200).json({ message: 'Alumno y sus inscripciones eliminados con éxito.' });
    } catch (error) {
        console.error("Error al eliminar alumno:", error);
        res.status(500).json({ error: 'Error al eliminar el alumno.' });
    }
});

/**
 * Endpoint 4: Gestión de Alumnos (CRUD/ABM) - Actualizar Alumno
 * Nivel RESTful: 2 (Recurso: /alumnos/:id. Usa el verbo PUT)
 */
app.put('/api/alumnos/:id', async (req, res) => {
    const { id } = req.params;
    const { nombres, apellidos, dni, email, telefono } = req.body;
    
    // Validación básica
    if (!nombres || !apellidos || !dni) {
        return res.status(400).json({ error: 'Faltan campos obligatorios (nombres, apellidos, dni).' });
    }

    try {
        await db.run(
            'UPDATE alumnos SET nombres = ?, apellidos = ?, dni = ?, email = ?, telefono = ? WHERE id_alumno = ?',
            nombres, apellidos, dni, email, telefono, id
        );
        res.status(200).json({ message: 'Alumno actualizado con éxito.' });
    } catch (error) {
        console.error("Error al actualizar alumno:", error);
        // Manejar error de DNI duplicado
        if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
            return res.status(409).json({ error: 'El DNI ingresado ya está registrado por otro alumno.' });
        }
        res.status(500).json({ error: 'Error al actualizar el alumno.' });
    }
});


/**
 * Endpoint 5: Reserva de Clases (Inscripción) y Creación de Alumno (ABM)
 * Nivel RESTful: 2 (Recurso: /reservas. Usa el verbo POST)
 * Lógica compleja: Valida cupos y realiza dos inserciones (alumnos y alumnos_clases).
 */
app.post('/api/reservas', async (req, res) => {
    const { nombres, apellidos, dni, email, telefono, clases_ids } = req.body;
    
    // 1. Validación de Datos
    if (!nombres || !apellidos || !dni || !Array.isArray(clases_ids) || clases_ids.length === 0) {
        return res.status(400).json({ error: 'Faltan datos de alumno o clases a inscribir.' });
    }

    try {
        let alumnoId;

        // Iniciar transacción para asegurar atomicidad de la inscripción
        await db.run('BEGIN TRANSACTION');
        
        // A) Buscar o crear alumno
        
        // 1. Buscar alumno por DNI (asumiendo que DNI es la clave de negocio)
        let alumnoExistente = await db.get('SELECT id_alumno FROM alumnos WHERE dni = ?', dni);

        if (alumnoExistente) {
            // Si existe, usamos su ID
            alumnoId = alumnoExistente.id_alumno;
            // Opcional: Actualizar datos del alumno existente
            await db.run(
                'UPDATE alumnos SET nombres = ?, apellidos = ?, email = ?, telefono = ? WHERE id_alumno = ?',
                nombres, apellidos, email, telefono, alumnoId
            );
        } else {
            // 2. Si NO existe, creamos un nuevo alumno (ABM - C)
            alumnoId = uuidv4(); // Generamos un ID único (TEXT)
            await db.run(
                'INSERT INTO alumnos (id_alumno, nombres, apellidos, dni, email, telefono) VALUES (?, ?, ?, ?, ?, ?)',
                alumnoId, nombres, apellidos, dni, email, telefono
            );
        }

        // B) Validar e inscribir clases

        const erroresInscripcion = [];
        
        for (const claseId of clases_ids) {
            // 3. Verificar si el alumno ya está inscrito en esta clase
            const yaInscrito = await db.get('SELECT 1 FROM alumnos_clases WHERE alumno_id = ? AND clase_id = ?', alumnoId, claseId);
            if (yaInscrito) {
                erroresInscripcion.push({ claseId, mensaje: 'Ya está inscrito.' });
                continue;
            }

            // 4. Verificar cupo (SELECT COUNT)
            const cupoQuery = `
                SELECT
                    hc.capacidad,
                    COUNT(ac.alumno_id) AS inscriptos
                FROM
                    horario_clases hc
                LEFT JOIN
                    alumnos_clases ac ON hc.id_clase = ac.clase_id
                WHERE
                    hc.id_clase = ?
                GROUP BY
                    hc.id_clase;
            `;
            const cupoData = await db.get(cupoQuery, claseId);

            if (!cupoData) {
                 erroresInscripcion.push({ claseId, mensaje: 'Clase no encontrada.' });
                continue;
            }

            const { capacidad, inscriptos } = cupoData;
            
            // Lógica principal: si inscriptos es 6 o más, la clase está completa
            if (inscriptos >= capacidad) {
                // Agregar error para notificar al frontend
                erroresInscripcion.push({ claseId, mensaje: 'Clase Completa (Max: 6).' });
                continue; // No inscribir
            }

            // 5. Inscribir (si hay cupo)
            await db.run('INSERT INTO alumnos_clases (alumno_id, clase_id) VALUES (?, ?)', alumnoId, claseId);
        }

        // 6. Confirmar la transacción
        await db.run('COMMIT');

        // Respuesta final
        if (erroresInscripcion.length === 0) {
            res.status(201).json({ message: 'Inscripción(es) realizada(s) con éxito.', alumnoId: alumnoId });
        } else {
            // Devolver estado 202 (Accepted but Partial Content) o 409 (Conflict)
            // Se usa 200/201 para éxito parcial
            res.status(200).json({ 
                message: 'Inscripción(es) procesada(s) con advertencias.', 
                alumnoId: alumnoId,
                advertencias: erroresInscripcion 
            });
        }

    } catch (error) {
        // 7. Revertir la transacción si algo falla
        await db.run('ROLLBACK');
        console.error("Error en la reserva/inscripción:", error);
        
        // Manejo de error específico de DNI duplicado si la inserción original falló
        if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
            return res.status(409).json({ error: 'El DNI ingresado ya está registrado.' });
        }
        
        res.status(500).json({ error: 'Error interno del servidor al procesar la reserva.' });
    }
});


/**
 * Endpoint 6: Reporte Detallado de Clases de un Alumno
 * Nivel RESTful: 2 (Recurso: /alumnos/:id/clases. Usa el verbo GET)
 */
app.get('/api/alumnos/:id/clases', async (req, res) => {
    const { id } = req.params;
    
    // Consulta para obtener los detalles de las clases a las que está inscrito el alumno
    const query = `
        SELECT 
            hc.dia,
            hc.hora,
            hc.clase,
            hc.id_clase
        FROM
            alumnos_clases ac
        JOIN
            horario_clases hc ON ac.clase_id = hc.id_clase
        WHERE
            ac.alumno_id = ?
        ORDER BY
            CASE hc.dia
                WHEN 'Lunes' THEN 1
                WHEN 'Martes' THEN 2
                WHEN 'Miércoles' THEN 3
                WHEN 'Jueves' THEN 4
                WHEN 'Viernes' THEN 5
                WHEN 'Sábado' THEN 6
                ELSE 7
            END,
            hc.hora;
    `;
    
    try {
        const clasesInscritas = await db.all(query, id);
        res.json(clasesInscritas);
    } catch (error) {
        console.error("Error al obtener clases del alumno:", error);
        res.status(500).json({ error: 'Error al obtener las clases inscritas del alumno.' });
    }
});


// --- Servir el Frontend (index.html) ---

// Intentar servir el frontend estático. Debe llamarse index.html
// IMPORTANTE: Asegúrate de que tu archivo frontend se llama 'index.html'
app.get('*', (req, res) => {
    // Si la solicitud no es para un endpoint de la API, servimos el archivo HTML principal.
    if (req.originalUrl.startsWith('/api')) {
        return res.status(404).json({ error: 'Ruta de API no encontrada.' });
    }
    
    const filePath = path.join(__dirname, 'index.html');
    
    res.sendFile(filePath, (err) => {
        if (err) {
            console.error("Error al servir index.html:", err.message);
            res.status(500).send('Error al cargar la aplicación (index.html no encontrado o error en el servidor).');
        }
    });
});


// --- Inicialización y Arranque del Servidor ---

initializeDatabase().then(() => {
    console.log('Base de datos SQLite conectada.');
    app.listen(PORT, () => {
        console.log(`Servidor API escuchando en http://localhost:${PORT}`);
        console.log(`Frontend disponible en http://localhost:${PORT}/`);
    });
}).catch((err) => {
    console.error("Error fatal al inicializar la base de datos:", err);
    process.exit(1);
});
