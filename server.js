const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const sqlite = require('sqlite');
const sqlite3 = require('sqlite3');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = 3000;
const DB_PATH = path.join(__dirname, 'yoga.db');
// Eliminamos la dependencia de SQL_SCHEMA_PATH

const MAX_ALUMNOS = 6;

let db;

// Esquema y datos SQL para la inicialización (Anteriormente en yoga.sql)
const INITIAL_SQL_SCHEMA = `
-- Habilita la integridad referencial para ON DELETE CASCADE
PRAGMA foreign_keys = ON; 

-- Eliminar tablas si existen para inicializar siempre desde cero
DROP TABLE IF EXISTS alumnos_clases;
DROP TABLE IF EXISTS alumnos;
DROP TABLE IF EXISTS horario_clases;

-- Table structure for alumnos
CREATE TABLE alumnos (
  id_alumno INTEGER PRIMARY KEY AUTOINCREMENT,
  nombres TEXT,
  apellidos TEXT,
  dni TEXT UNIQUE, -- DNI debe ser único
  email TEXT,
  telefono TEXT
);

-- Records of alumnos
INSERT INTO alumnos (nombres, apellidos, dni, email, telefono) VALUES (1, 'Leandro', 'Pérez', '11678443', 'leandro.perez@icloud.com', '54');
INSERT INTO alumnos (nombres, apellidos, dni, email, telefono) VALUES (2, 'Daiana', 'Martínez', '55412533', 'daiana.martinez@icloud.com', '54');
INSERT INTO alumnos (nombres, apellidos, dni, email, telefono) VALUES (3, 'María', 'Díaz', '24672546', 'maria.diaz@outlook.com', '54');
INSERT INTO alumnos (nombres, apellidos, dni, email, telefono) VALUES (4, 'Micaela', 'Ramos', '49544950', 'micaela.ramos@yahoo.com', '54');
INSERT INTO alumnos (nombres, apellidos, dni, email, telefono) VALUES (5, 'Carolina', 'Ruiz', '20434052', 'carolina.ruiz@outlook.com', '54');
INSERT INTO alumnos (nombres, apellidos, dni, email, telefono) VALUES (6, 'Gonzalo', 'Martínez', '34090698', 'gonzalo.martinez@yahoo.com', '54');
INSERT INTO alumnos (nombres, apellidos, dni, email, telefono) VALUES (7, 'Tomás', 'Pérez', '35403012', 'tomas.perez@gmail.com', '54');
INSERT INTO alumnos (nombres, apellidos, dni, email, telefono) VALUES (8, 'Hernán', 'López', '13075222', 'hernan.lopez@icloud.com', '54');
INSERT INTO alumnos (nombres, apellidos, dni, email, telefono) VALUES (9, 'Sofía', 'Benítez', '28654492', 'sofia.benitez@hotmail.com', '54');
INSERT INTO alumnos (nombres, apellidos, dni, email, telefono) VALUES (10, 'Bruno', 'Gutiérrez', '54974694', 'bruno.gutierrez@yahoo.com', '54');
INSERT INTO alumnos (nombres, apellidos, dni, email, telefono) VALUES (11, 'Camila', 'Suárez', '35464823', 'camila.suarez@yahoo.com', '54');
INSERT INTO alumnos (nombres, apellidos, dni, email, telefono) VALUES (12, 'Micaela', 'Gómez', '31169695', 'micaela.gomez@hotmail.com', '54');
INSERT INTO alumnos (nombres, apellidos, dni, email, telefono) VALUES (13, 'Santiago', 'Ponce', '43502842', 'santiago.ponce@hotmail.com', '54');
INSERT INTO alumnos (nombres, apellidos, dni, email, telefono) VALUES (14, 'Valentina', 'Silva', '59995364', 'valentina.silva@live.com', '54');
INSERT INTO alumnos (nombres, apellidos, dni, email, telefono) VALUES (15, 'Lautaro', 'Pereyra', '19283286', 'lautaro.pereyra@live.com', '54');
INSERT INTO alumnos (nombres, apellidos, dni, email, telefono) VALUES (16, 'Diego', 'Méndez', '20736210', 'diego.mendez@icloud.com', '54');
INSERT INTO alumnos (nombres, apellidos, dni, email, telefono) VALUES (17, 'Rocío', 'Suárez', '45508262', 'rocio.suarez@yahoo.com', '54');
INSERT INTO alumnos (nombres, apellidos, dni, email, telefono) VALUES (18, 'Milagros', 'Ponce', '32828789', 'milagros.ponce@gmail.com', '54');
INSERT INTO alumnos (nombres, apellidos, dni, email, telefono) VALUES (19, 'Juan', 'Barrera', '58296952', 'juan.barrera@yahoo.com', '54');
INSERT INTO alumnos (nombres, apellidos, dni, email, telefono) VALUES (20, 'Leandro', 'Muñoz', '52879174', 'leandro.munoz@live.com', '54');
INSERT INTO alumnos (nombres, apellidos, dni, email, telefono) VALUES (21, 'Esteban', 'Torres', '46197113', 'esteban.torres@live.com', '54');
INSERT INTO alumnos (nombres, apellidos, dni, email, telefono) VALUES (22, 'Jorge', 'Vega', '30636923', 'jorge.vega@outlook.com', '54');
INSERT INTO alumnos (nombres, apellidos, dni, email, telefono) VALUES (23, 'Sol', 'Ferreyra', '14644773', 'sol.ferreyra@live.com', '54');
INSERT INTO alumnos (nombres, apellidos, dni, email, telefono) VALUES (24, 'Morena', 'Torres', '27787649', 'morena.torres@live.com', '54');
INSERT INTO alumnos (nombres, apellidos, dni, email, telefono) VALUES (25, 'Hernán', 'Muñoz', '36775919', 'hernan.munoz@icloud.com', '54');
INSERT INTO alumnos (nombres, apellidos, dni, email, telefono) VALUES (26, 'Jorge', 'Silva', '25079183', 'jorge.silva@gmail.com', '54');
INSERT INTO alumnos (nombres, apellidos, dni, email, telefono) VALUES (27, 'Juan', 'López', '57502401', 'juan.lopez@icloud.com', '54');
INSERT INTO alumnos (nombres, apellidos, dni, email, telefono) VALUES (28, 'Carolina', 'López', '44504433', 'carolina.lopez@outlook.com', '54');
INSERT INTO alumnos (nombres, apellidos, dni, email, telefono) VALUES (29, 'Sol', 'Figueroa', '48668909', 'sol.figueroa@hotmail.com', '54');
INSERT INTO alumnos (nombres, apellidos, dni, email, telefono) VALUES (30, 'Sofía', 'Martínez', '54223583', 'sofia.martinez@hotmail.com', '54');

-- Table structure for horario_clases
CREATE TABLE horario_clases (
  id_clase INTEGER PRIMARY KEY AUTOINCREMENT,
  dia TEXT,
  hora TEXT,
  clase TEXT
);

-- Records of horario_clases (Nota: La columna cantAlumnos será actualizada por updateClasesCount)
INSERT INTO horario_clases (id_clase, dia, hora, clase) VALUES (2, 'lunes', '10:00:00', 'HATHA YOGA');
INSERT INTO horario_clases (id_clase, dia, hora, clase) VALUES (3, 'lunes', '17:00:00', 'HATHA YOGA');
INSERT INTO horario_clases (id_clase, dia, hora, clase) VALUES (4, 'lunes', '18:00:00', 'ACROYOGA');
INSERT INTO horario_clases (id_clase, dia, hora, clase) VALUES (5, 'lunes', '19:00:00', 'PILATES');
INSERT INTO horario_clases (id_clase, dia, hora, clase) VALUES (6, 'lunes', '20:00:00', 'HATHA YOGA');
INSERT INTO horario_clases (id_clase, dia, hora, clase) VALUES (7, 'martes', '10:00:00', 'PILATES EXTREME');
INSERT INTO horario_clases (id_clase, dia, hora, clase) VALUES (8, 'martes', '15:00:00', 'ASHTANGA YOGA');
INSERT INTO horario_clases (id_clase, dia, hora, clase) VALUES (9, 'martes', '16:00:00', 'ACROYOGA');
INSERT INTO horario_clases (id_clase, dia, hora, clase) VALUES (10, 'martes', '17:00:00', 'PILATES');
INSERT INTO horario_clases (id_clase, dia, hora, clase) VALUES (11, 'martes', '18:00:00', 'PILATES EXTREME');
INSERT INTO horario_clases (id_clase, dia, hora, clase) VALUES (12, 'miércoles', '10:00:00', 'HATHA YOGA');
INSERT INTO horario_clases (id_clase, dia, hora, clase) VALUES (13, 'miércoles', '16:00:00', 'PILATES');
INSERT INTO horario_clases (id_clase, dia, hora, clase) VALUES (14, 'miércoles', '18:00:00', 'ASHTANGA YOGA');
INSERT INTO horario_clases (id_clase, dia, hora, clase) VALUES (15, 'miércoles', '19:00:00', 'PILATES');
INSERT INTO horario_clases (id_clase, dia, hora, clase) VALUES (16, 'miércoles', '20:00:00', 'HATHA YOGA');
INSERT INTO horario_clases (id_clase, dia, hora, clase) VALUES (17, 'jueves', '09:00:00', 'ACROYOGA');
INSERT INTO horario_clases (id_clase, dia, hora, clase) VALUES (18, 'jueves', '10:00:00', 'PILATES EXTREME');
INSERT INTO horario_clases (id_clase, dia, hora, clase) VALUES (19, 'jueves', '17:00:00', 'HATHA YOGA');
INSERT INTO horario_clases (id_clase, dia, hora, clase) VALUES (20, 'jueves', '18:00:00', 'PILATES EXTREME');
INSERT INTO horario_clases (id_clase, dia, hora, clase) VALUES (21, 'viernes', '09:00:00', 'PILATES');
INSERT INTO horario_clases (id_clase, dia, hora, clase) VALUES (22, 'viernes', '15:00:00', 'ASHTANGA YOGA');
INSERT INTO horario_clases (id_clase, dia, hora, clase) VALUES (23, 'viernes', '16:00:00', 'PILATES');
INSERT INTO horario_clases (id_clase, dia, hora, clase) VALUES (24, 'viernes', '17:00:00', 'PILATES');
INSERT INTO horario_clases (id_clase, dia, hora, clase) VALUES (25, 'viernes', '18:00:00', 'ACROYOGA');
INSERT INTO horario_clases (id_clase, dia, hora, clase) VALUES (26, 'viernes', '19:00:00', 'PILATES');
INSERT INTO horario_clases (id_clase, dia, hora, clase) VALUES (27, 'viernes', '20:00:00', 'HATHA YOGA');
INSERT INTO horario_clases (id_clase, dia, hora, clase) VALUES (28, 'sábado ', '09:00:00', 'YOGA+MEDITACIÓN');
INSERT INTO horario_clases (id_clase, dia, hora, clase) VALUES (29, 'sábado ', '10:00:00', 'ACROYOGA');
INSERT INTO horario_clases (id_clase, dia, hora, clase) VALUES (30, 'sábado ', '11:00:00', 'PILATES');

-- Table structure for alumnos_clases (Tabla N:M)
CREATE TABLE alumnos_clases (
  alumno_id INTEGER,
  clase_id INTEGER,
  PRIMARY KEY (alumno_id, clase_id),
  FOREIGN KEY (alumno_id) REFERENCES alumnos(id_alumno) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (clase_id) REFERENCES horario_clases(id_clase) ON DELETE CASCADE ON UPDATE CASCADE
);

-- Records of alumnos_clases
INSERT INTO alumnos_clases (alumno_id, clase_id) VALUES (1, 10);
INSERT INTO alumnos_clases (alumno_id, clase_id) VALUES (1, 24);
INSERT INTO alumnos_clases (alumno_id, clase_id) VALUES (2, 2);
INSERT INTO alumnos_clases (alumno_id, clase_id) VALUES (2, 12);
`;

// Configuración de Express y Middleware
app.use(cors());
app.use(express.json());

// Función para inicializar la base de datos
async function initializeDatabase() {
    try {
        db = await sqlite.open({
            filename: DB_PATH,
            driver: sqlite3.Database
        });

        console.log('Base de datos SQLite conectada.');

        // Ejecutar el esquema incrustado
        const statements = INITIAL_SQL_SCHEMA.split(';').filter(s => s.trim().length > 0);

        // Ejecutar las sentencias una por una
        for (const statement of statements) {
            await db.exec(statement);
        }

        console.log('Base de datos inicializada con esquema y datos internos.');
        
        // Ejecutar un update para calcular la columna cantAlumnos con datos reales
        await updateClasesCount();

    } catch (error) {
        console.error('Error al inicializar la base de datos:', error);
        process.exit(1);
    }
}

// Función auxiliar para actualizar los conteos de alumnos en horario_clases
async function updateClasesCount() {
    // Para SQLite, necesitamos actualizar cada fila individualmente o recrear una tabla temporalmente.
    // Lo más simple es usar la subconsulta con UPDATE, que SQLite soporta.
    await db.run(`
        UPDATE horario_clases
        SET cantAlumnos = (
            SELECT COUNT(clase_id)
            FROM alumnos_clases
            WHERE clase_id = horario_clases.id_clase
        );
    `);
    console.log('Conteo de alumnos por clase actualizado.');
}

// --- ENDPOINTS DE LA API RESTFUL ---

// Ruta 0: Servir el frontend (index.html) como fallback para SPA
app.get('/', (req, res) => {
    const htmlPath = path.join(__dirname, 'index.html');
    if (fs.existsSync(htmlPath)) {
        // Establecer el Content-Type correcto para HTML
        res.sendFile(htmlPath, { headers: { 'Content-Type': 'text/html' } });
    } else {
        res.status(404).send('Frontend file (index.html) not found.');
    }
});

// 1. OBTENER HORARIOS Y CUPOS (GET /api/clases)
app.get('/api/clases', async (req, res) => {
    try {
        // Aseguramos que el conteo esté al día
        await updateClasesCount(); 

        const clases = await db.all(`
            SELECT 
                id_clase as id,
                dia,
                hora,
                clase,
                cantAlumnos
            FROM horario_clases
            ORDER BY 
                CASE dia 
                    WHEN 'lunes' THEN 1 
                    WHEN 'martes' THEN 2 
                    WHEN 'miércoles' THEN 3 
                    WHEN 'jueves' THEN 4 
                    WHEN 'viernes' THEN 5 
                    WHEN 'sábado ' THEN 6 
                    ELSE 7 
                END, hora;
        `);

        // Transformar datos para el frontend (añadir cupoCompleto y cuposDisponibles)
        const result = clases.map(c => ({
            ...c,
            cupoCompleto: c.cantAlumnos >= MAX_ALUMNOS,
            cuposDisponibles: MAX_ALUMNOS - c.cantAlumnos,
        }));

        res.json(result);
    } catch (error) {
        console.error('Error al obtener clases:', error);
        res.status(500).json({ message: 'Error interno del servidor al obtener clases.' });
    }
});


// 2. INSCRIPCIÓN / RESERVA DE CLASES (POST /api/inscripcion) - Implementa CRUD (Crear Alumno) y lógica de negocio
app.post('/api/inscripcion', async (req, res) => {
    const { nombres, apellidos, dni, email, telefono, clases_ids } = req.body;

    if (!nombres || !apellidos || !dni || !email || !clases_ids || clases_ids.length === 0) {
        return res.status(400).json({ message: 'Faltan campos obligatorios para la inscripción.' });
    }

    try {
        await db.run('BEGIN TRANSACTION');

        // 1. Buscar o Crear Alumno (ABM - C)
        let alumno = await db.get('SELECT id_alumno as id FROM alumnos WHERE dni = ?', [dni]);
        let alumnoId;

        if (alumno) {
            alumnoId = alumno.id;
            // Actualizar datos del alumno existente (ABM - U)
            await db.run('UPDATE alumnos SET nombres = ?, apellidos = ?, email = ?, telefono = ? WHERE id_alumno = ?',
                [nombres, apellidos, email, telefono, alumnoId]);
            console.log(`Alumno ${alumnoId} existente actualizado.`);
        } else {
            // Insertar nuevo alumno (ABM - C)
            const result = await db.run('INSERT INTO alumnos (nombres, apellidos, dni, email, telefono) VALUES (?, ?, ?, ?, ?)',
                [nombres, apellidos, dni, email, telefono]);
            alumnoId = result.lastID;
            console.log(`Nuevo alumno ${alumnoId} creado.`);
        }

        // 2. Verificar Cupos y Registrar Inscripciones
        const clasesCompletas = [];
        const clasesInscritas = [];

        for (const claseId of clases_ids) {
            // Recalculamos el cupo justo antes de intentar inscribir, para evitar colisiones
            await db.run('UPDATE horario_clases SET cantAlumnos = (SELECT COUNT(clase_id) FROM alumnos_clases WHERE clase_id = horario_clases.id_clase) WHERE id_clase = ?', [claseId]);
            
            const claseInfo = await db.get('SELECT clase, dia, hora, cantAlumnos FROM horario_clases WHERE id_clase = ?', [claseId]);

            if (!claseInfo) continue;

            const isFull = claseInfo.cantAlumnos >= MAX_ALUMNOS;
            
            // Verificar si el alumno ya está inscrito
            const alreadyInscrito = await db.get('SELECT 1 FROM alumnos_clases WHERE alumno_id = ? AND clase_id = ?', [alumnoId, claseId]);

            if (isFull) {
                clasesCompletas.push(`${claseInfo.clase} (${claseInfo.dia} ${claseInfo.hora.substring(0, 5)})`);
            } else if (!alreadyInscrito) {
                // Inscribir al alumno (CREATE en alumnos_clases)
                await db.run('INSERT INTO alumnos_clases (alumno_id, clase_id) VALUES (?, ?)', [alumnoId, claseId]);
                clasesInscritas.push(`${claseInfo.clase} (${claseInfo.dia} ${claseInfo.hora.substring(0, 5)})`);
            }
        }

        // 3. Manejo de Conflictos y Respuesta
        if (clasesCompletas.length > 0) {
            // Si alguna clase se llenó justo antes o estaba llena, abortar y avisar al usuario.
            await db.run('ROLLBACK');
            return res.status(409).json({ // 409 Conflict
                message: 'Algunas clases están completas.',
                clasesCompletas: clasesCompletas.join(', ')
            });
        }
        
        // Si no hay conflictos, consolidar la transacción.
        await db.run('COMMIT');
        
        // 4. Actualizar conteo de clases (finalmente, para asegurar que toda la tabla esté al día)
        await updateClasesCount();

        res.status(201).json({ 
            message: 'Inscripción procesada con éxito.', 
            alumnoId,
            clasesInscritas 
        });

    } catch (error) {
        await db.run('ROLLBACK');
        // El error 19 es típicamente una violación de restricción UNIQUE (como el DNI), aunque DNI ya se maneja en el paso 1.
        console.error('Error al procesar la inscripción:', error);
        res.status(500).json({ message: 'Error interno del servidor durante la transacción.' });
    }
});


// 3. REPORTE: OBTENER ALUMNOS (GET /api/alumnos)
app.get('/api/alumnos', async (req, res) => {
    try {
        const alumnos = await db.all('SELECT id_alumno as id, nombres, apellidos, dni, email, telefono FROM alumnos ORDER BY apellidos, nombres');
        res.json(alumnos);
    } catch (error) {
        console.error('Error al obtener alumnos:', error);
        res.status(500).json({ message: 'Error interno del servidor al obtener alumnos.' });
    }
});

// 4. REPORTE: OBTENER CLASES INSCRITAS DE UN ALUMNO (GET /api/alumnos/:id/clases)
app.get('/api/alumnos/:id/clases', async (req, res) => {
    const { id } = req.params;
    try {
        const clases = await db.all(`
            SELECT
                h.id_clase as id,
                h.dia,
                h.hora,
                h.clase
            FROM alumnos_clases ac
            JOIN horario_clases h ON ac.clase_id = h.id_clase
            WHERE ac.alumno_id = ?
            ORDER BY 
                CASE h.dia 
                    WHEN 'lunes' THEN 1 
                    WHEN 'martes' THEN 2 
                    WHEN 'miércoles' THEN 3 
                    WHEN 'jueves' THEN 4 
                    WHEN 'viernes' THEN 5 
                    WHEN 'sábado ' THEN 6 
                    ELSE 7 
                END, h.hora;
        `, [id]);
        res.json(clases);
    } catch (error) {
        console.error('Error al obtener clases del alumno:', error);
        res.status(500).json({ message: 'Error interno del servidor al obtener clases del alumno.' });
    }
});

// 5. ABM (CRUD): ACTUALIZAR ALUMNO (PUT /api/alumnos/:id)
app.put('/api/alumnos/:id', async (req, res) => {
    const { id } = req.params;
    const { nombres, apellidos, dni, email, telefono } = req.body;

    if (!nombres || !apellidos || !dni || !email) {
        return res.status(400).json({ message: 'Faltan campos obligatorios para actualizar.' });
    }

    try {
        const result = await db.run(
            'UPDATE alumnos SET nombres = ?, apellidos = ?, dni = ?, email = ?, telefono = ? WHERE id_alumno = ?',
            [nombres, apellidos, dni, email, telefono, id]
        );

        if (result.changes === 0) {
            return res.status(404).json({ message: 'Alumno no encontrado.' });
        }

        res.status(200).json({ message: 'Alumno actualizado con éxito.' });
    } catch (error) {
        console.error('Error al actualizar alumno:', error);
        res.status(500).json({ message: 'Error interno del servidor al actualizar alumno.' });
    }
});

// 6. ABM (CRUD): ELIMINAR ALUMNO (DELETE /api/alumnos/:id)
app.delete('/api/alumnos/:id', async (req, res) => {
    const { id } = req.params;

    try {
        // La tabla alumnos_clases tiene una restricción ON DELETE CASCADE,
        // por lo que al eliminar el alumno, se eliminan automáticamente sus inscripciones.
        const result = await db.run('DELETE FROM alumnos WHERE id_alumno = ?', [id]);

        if (result.changes === 0) {
            return res.status(404).json({ message: 'Alumno no encontrado.' });
        }
        
        // Actualizar conteo de clases después de la eliminación en cascada
        await updateClasesCount();

        res.status(204).send(); // 204 No Content para eliminación exitosa
    } catch (error) {
        console.error('Error al eliminar alumno:', error);
        res.status(500).json({ message: 'Error interno del servidor al eliminar alumno.' });
    }
});


// Inicialización y arranque del servidor
async function startServer() {
    await initializeDatabase();
    app.listen(PORT, () => {
        console.log(`Servidor API escuchando en http://localhost:${PORT}`);
    });
}

startServer();

