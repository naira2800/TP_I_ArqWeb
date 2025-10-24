const express = require('express');
const cors = require('cors');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = 3000;
const MAX_ALUMNOS = 6; // Constante del negocio

app.use(cors());
app.use(express.json());

// --- Inicialización de Datos en Memoria (Simulando DB) ---
// Datos basados en yoga.sql

let alumnos = [
    { id: '1', nombres: 'Leandro', apellidos: 'Pérez', dni: '11678443', email: 'leandro.perez@icloud.com', telefono: '54' },
    { id: '2', nombres: 'Daiana', apellidos: 'Martínez', dni: '55412533', email: 'daiana.martinez@icloud.com', telefono: '54' },
    { id: '3', nombres: 'María', apellidos: 'Díaz', dni: '24672546', email: 'maria.diaz@outlook.com', telefono: '54' },
    // ... (El resto de los 30 alumnos iniciales se omiten aquí por brevedad, pero se simulan sus inscripciones abajo)
];

let clases = [
    { id: '2', dia: 'lunes', hora: '10:00:00', clase: 'HATHA YOGA', cantAlumnos: 4 },
    { id: '3', dia: 'lunes', hora: '17:00:00', clase: 'HATHA YOGA', cantAlumnos: 5 },
    { id: '4', dia: 'lunes', hora: '18:00:00', clase: 'ACROYOGA', cantAlumnos: 2 },
    { id: '5', dia: 'lunes', hora: '19:00:00', clase: 'PILATES', cantAlumnos: 1 },
    { id: '6', dia: 'lunes', hora: '20:00:00', clase: 'HATHA YOGA', cantAlumnos: 0 },
    { id: '7', dia: 'martes', hora: '10:00:00', clase: 'PILATES EXTREME', cantAlumnos: 0 },
    { id: '8', dia: 'martes', hora: '15:00:00', clase: 'ASHTANGA YOGA', cantAlumnos: 2 },
    { id: '9', dia: 'martes', hora: '16:00:00', clase: 'ACROYOGA', cantAlumnos: 0 },
    { id: '10', dia: 'martes', hora: '17:00:00', clase: 'PILATES', cantAlumnos: 0 },
    { id: '11', dia: 'martes', hora: '18:00:00', clase: 'PILATES EXTREME', cantAlumnos: 0 },
    { id: '12', dia: 'miércoles', hora: '10:00:00', clase: 'HATHA YOGA', cantAlumnos: 0 },
    { id: '13', dia: 'miércoles', hora: '16:00:00', clase: 'PILATES', cantAlumnos: 0 },
    { id: '14', dia: 'miércoles', hora: '18:00:00', clase: 'ASHTANGA YOGA', cantAlumnos: 0 },
    { id: '15', dia: 'miércoles', hora: '19:00:00', clase: 'PILATES', cantAlumnos: 0 },
    { id: '16', dia: 'miércoles', hora: '20:00:00', clase: 'HATHA YOGA', cantAlumnos: 0 },
    { id: '17', dia: 'jueves', hora: '09:00:00', clase: 'ACROYOGA', cantAlumnos: 0 },
    { id: '18', dia: 'jueves', hora: '10:00:00', clase: 'PILATES EXTREME', cantAlumnos: 0 },
    { id: '19', dia: 'jueves', hora: '17:00:00', clase: 'HATHA YOGA', cantAlumnos: 0 },
    { id: '20', dia: 'jueves', hora: '18:00:00', clase: 'PILATES EXTREME', cantAlumnos: 0 },
    { id: '21', dia: 'viernes', hora: '09:00:00', clase: 'PILATES', cantAlumnos: 0 },
    { id: '22', dia: 'viernes', hora: '15:00:00', clase: 'ASHTANGA YOGA', cantAlumnos: 0 },
    { id: '23', dia: 'viernes', hora: '16:00:00', clase: 'PILATES', cantAlumnos: 0 },
    { id: '24', dia: 'viernes', hora: '17:00:00', clase: 'PILATES', cantAlumnos: 0 },
    { id: '25', dia: 'viernes', hora: '18:00:00', clase: 'ACROYOGA', cantAlumnos: 0 },
    { id: '26', dia: 'viernes', hora: '19:00:00', clase: 'PILATES', cantAlumnos: 0 },
    { id: '27', dia: 'viernes', hora: '20:00:00', clase: 'HATHA YOGA', cantAlumnos: 0 },
    { id: '28', dia: 'sábado ', hora: '09:00:00', clase: 'YOGA+MEDITACIÓN', cantAlumnos: 0 },
    { id: '29', dia: 'sábado ', hora: '10:00:00', clase: 'ACROYOGA', cantAlumnos: 0 },
    { id: '30', dia: 'sábado ', hora: '11:00:00', clase: 'PILATES', cantAlumnos: 0 }
];
// Esta simulación es esencial: la tabla `alumnos_clases` define quién está en qué clase.
// Usamos un objeto para un acceso rápido: { clase_id: [alumno_id, ...], ... }
let alumnosClases = {
    '2': ['2', '3', '4', '5'], // HATHA YOGA (Lunes 10:00), 4 alumnos
    '3': ['6', '7', '8', '9', '10'], // HATHA YOGA (Lunes 17:00), 5 alumnos
    '4': ['11', '12'], // ACROYOGA (Lunes 18:00), 2 alumnos
    '5': ['13'], // PILATES (Lunes 19:00), 1 alumno
    '8': ['14', '15'], // ASHTANGA YOGA (Martes 15:00), 2 alumnos
    // Clases completas para pruebas:
    '31': ['A', 'B', 'C', 'D', 'E', 'F'] // Clase ficticia completa para demostración
};

// Se asegura que `alumnosClases` tenga la cuenta real para la lógica.
function updateClasesCount() {
    clases.forEach(clase => {
        clase.cantAlumnos = alumnosClases[clase.id] ? alumnosClases[clase.id].length : 0;
        clase.cupoCompleto = clase.cantAlumnos >= MAX_ALUMNOS;
    });
}
updateClasesCount();

// --- Rutas de la API (Nivel 2 RESTful) ---

// 1. OBTENER HORARIO Y ESTADO DE CUPOS (Listar clases)
app.get('/api/clases', (req, res) => {
    updateClasesCount(); // Asegura que el conteo esté actualizado
    res.json(clases.map(c => ({
        id: c.id,
        dia: c.dia,
        hora: c.hora,
        clase: c.clase,
        cantAlumnos: c.cantAlumnos,
        cupoCompleto: c.cupoCompleto,
        cuposDisponibles: MAX_ALUMNOS - c.cantAlumnos
    })));
});

// 2. OBTENER DETALLE DE UNA CLASE (Incluye alumnos inscritos)
app.get('/api/clases/:id', (req, res) => {
    const id = req.params.id;
    const clase = clases.find(c => c.id === id);
    if (!clase) {
        return res.status(404).json({ error: 'Clase no encontrada' });
    }

    const inscritosIds = alumnosClases[id] || [];
    const inscritos = alumnos.filter(a => inscritosIds.includes(a.id));

    res.json({
        ...clase,
        alumnosInscritos: inscritos
    });
});


// 3. INSCRIPCIÓN / CREACIÓN DE ALUMNO (ABM/CRUD: Create - Principal)
// Cuerpo: { nombres, apellidos, dni, email, telefono, clases_ids: ['id1', 'id2'] }
app.post('/api/inscripcion', (req, res) => {
    const { nombres, apellidos, dni, email, telefono, clases_ids } = req.body;

    if (!nombres || !apellidos || !dni || !email || !clases_ids || clases_ids.length === 0) {
        return res.status(400).json({ error: 'Faltan campos obligatorios o clases seleccionadas.' });
    }

    updateClasesCount();

    // 1. Validar cupos antes de inscribir al alumno
    const clasesAInscribir = clases_ids.map(id => clases.find(c => c.id === id)).filter(Boolean);
    const clasesCompletas = clasesAInscribir.filter(c => c.cupoCompleto);

    if (clasesCompletas.length > 0) {
        const nombresClasesCompletas = clasesCompletas.map(c => `${c.clase} (${c.dia} ${c.hora})`).join(', ');
        // Retorna 409 Conflict si hay clases completas (para el alert)
        return res.status(409).json({
            error: 'Una o más clases seleccionadas están completas.',
            clasesCompletas: nombresClasesCompletas
        });
    }

    // 2. Guardar el registro del alumno (Si ya existe por DNI, usar el ID existente)
    let alumnoExistente = alumnos.find(a => a.dni === dni);
    let nuevoAlumnoId;

    if (alumnoExistente) {
        nuevoAlumnoId = alumnoExistente.id;
        // Actualizar datos del alumno existente (si se requiere)
        Object.assign(alumnoExistente, { nombres, apellidos, email, telefono });
    } else {
        nuevoAlumnoId = uuidv4();
        const nuevoAlumno = {
            id: nuevoAlumnoId,
            nombres,
            apellidos,
            dni,
            email,
            telefono
        };
        alumnos.push(nuevoAlumno);
    }

    // 3. Guardar los nuevos registros en alumnos_clases
    let clasesInscritasExitosas = [];
    clasesAInscribir.forEach(clase => {
        // Doble chequeo de cupo justo antes de la inscripción
        if ((alumnosClases[clase.id] ? alumnosClases[clase.id].length : 0) < MAX_ALUMNOS) {
            if (!alumnosClases[clase.id]) {
                alumnosClases[clase.id] = [];
            }
            // Evitar duplicados (un alumno no puede inscribirse dos veces a la misma clase)
            if (!alumnosClases[clase.id].includes(nuevoAlumnoId)) {
                alumnosClases[clase.id].push(nuevoAlumnoId);
                clasesInscritasExitosas.push(clase.clase);
            }
        }
    });

    updateClasesCount();

    res.status(201).json({
        mensaje: 'Inscripción exitosa. Alumno registrado.',
        alumnoId: nuevoAlumnoId,
        clasesInscritas: clasesInscritasExitosas
    });
});

// --- Rutas de Gestión de Alumnos (ABM/CRUD) ---

// 4. OBTENER ALUMNOS (Reporte)
app.get('/api/alumnos', (req, res) => {
    res.json(alumnos);
});

// 5. OBTENER CLASES INSCRITAS DE UN ALUMNO (Reporte Detalle)
app.get('/api/alumnos/:id/clases', (req, res) => {
    const alumnoId = req.params.id;
    const clasesInscritas = [];

    for (const claseId in alumnosClases) {
        if (alumnosClases[claseId].includes(alumnoId)) {
            const clase = clases.find(c => c.id === claseId);
            if (clase) {
                clasesInscritas.push(clase);
            }
        }
    }
    res.json(clasesInscritas);
});


// 6. MODIFICAR ALUMNO (ABM/CRUD: Update)
app.put('/api/alumnos/:id', (req, res) => {
    const alumnoId = req.params.id;
    const { nombres, apellidos, dni, email, telefono } = req.body;

    const index = alumnos.findIndex(a => a.id === alumnoId);

    if (index === -1) {
        return res.status(404).json({ error: 'Alumno no encontrado para modificar' });
    }

    // Actualizar solo los campos proporcionados
    alumnos[index] = {
        ...alumnos[index],
        nombres: nombres || alumnos[index].nombres,
        apellidos: apellidos || alumnos[index].apellidos,
        dni: dni || alumnos[index].dni,
        email: email || alumnos[index].email,
        telefono: telefono || alumnos[index].telefono,
    };

    res.json({ mensaje: 'Alumno actualizado con éxito', alumno: alumnos[index] });
});

// 7. ELIMINAR ALUMNO (ABM/CRUD: Delete)
app.delete('/api/alumnos/:id', (req, res) => {
    const alumnoId = req.params.id;

    // 1. Eliminar de la lista de alumnos
    const initialLength = alumnos.length;
    alumnos = alumnos.filter(a => a.id !== alumnoId);

    if (alumnos.length === initialLength) {
        return res.status(404).json({ error: 'Alumno no encontrado para eliminar' });
    }

    // 2. Eliminar al alumno de todas las clases inscritas
    for (const claseId in alumnosClases) {
        alumnosClases[claseId] = alumnosClases[claseId].filter(id => id !== alumnoId);
        // Opcional: limpiar entradas vacías
        if (alumnosClases[claseId].length === 0) {
            delete alumnosClases[claseId];
        }
    }

    updateClasesCount();
    res.status(204).send(); // 204 No Content para eliminación exitosa
});


// --- Servir Frontend (Fallback) ---
// Debe ser la última ruta para actuar como fallback
app.get('*', (req, res) => {
    // Si la solicitud no es para un recurso de la API, sirve el archivo del frontend (App.jsx)
    // El frontend hará peticiones a /api/*
    res.sendFile(path.join(__dirname, 'App.jsx'), { headers: { 'Content-Type': 'application/javascript' } }, (err) => {
        if (err) {
            console.error('Error al intentar servir App.jsx:', err);
            res.status(404).send('No se pudo encontrar el frontend (App.jsx). Asegúrate de que existe en el directorio del servidor.');
        }
    });
});


// --- Inicio del Servidor ---
if (process.env.NODE_ENV !== 'test') {
    app.listen(PORT, () => {
        console.log(`Servidor API escuchando en http://localhost:${PORT}`);
    });
}

// Exportar la aplicación para el testing con supertest
module.exports = app;
