// -----------------------------------------------------------------------------
// 2. Backend: Implementación de la API RESTful (Nivel 2) y Persistencia en Memoria
// -----------------------------------------------------------------------------
const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = 3000;
const MAX_ALUMNOS = 6; // Capacidad máxima por clase

app.use(cors());
app.use(express.json());

// 2.1. Persistencia en Memoria con Set de Datos Default
// Los datos se cargan del archivo yoga.sql proporcionado.
let alumnos = [
    { id_alumno: '1', nombres: 'Leandro', apellidos: 'Pérez', dni: '11678443', email: 'leandro.perez@icloud.com', telefono: '54' },
    { id_alumno: '2', nombres: 'Daiana', apellidos: 'Martínez', dni: '55412533', email: 'daiana.martinez@icloud.com', telefono: '54' },
    { id_alumno: '3', nombres: 'María', 'apellidos': 'Díaz', dni: '24672546', email: 'maria.diaz@outlook.com', telefono: '54' },
    // ... Se cargarían los 30 alumnos iniciales aquí
];

let horario_clases = [
    { id_clase: '2', dia: 'lunes', hora: '10:00:00', clase: 'HATHA YOGA' },
    { id_clase: '3', dia: 'lunes', hora: '17:00:00', clase: 'HATHA YOGA' },
    { id_clase: '4', dia: 'lunes', hora: '18:00:00', clase: 'ACROYOGA' },
    { id_clase: '5', dia: 'lunes', hora: '19:00:00', clase: 'PILATES' },
    { id_clase: '6', dia: 'lunes', hora: '20:00:00', clase: 'HATHA YOGA' },
    { id_clase: '7', dia: 'martes', hora: '10:00:00', clase: 'PILATES EXTREME' },
    { id_clase: '8', dia: 'martes', hora: '15:00:00', clase: 'ASHTANGA YOGA' },
    { id_clase: '9', dia: 'martes', hora: '16:00:00', clase: 'ACROYOGA' },
    { id_clase: '10', dia: 'martes', hora: '17:00:00', clase: 'PILATES' },
    { id_clase: '11', dia: 'martes', hora: '18:00:00', clase: 'PILATES EXTREME' },
    { id_clase: '12', dia: 'miércoles', hora: '10:00:00', clase: 'HATHA YOGA' },
    { id_clase: '13', dia: 'miércoles', hora: '16:00:00', clase: 'PILATES' },
    { id_clase: '14', dia: 'miércoles', hora: '18:00:00', clase: 'ASHTANGA YOGA' },
    { id_clase: '15', dia: 'miércoles', hora: '19:00:00', clase: 'PILATES' },
    { id_clase: '16', dia: 'miércoles', hora: '20:00:00', clase: 'HATHA YOGA' },
    { id_clase: '17', dia: 'jueves', hora: '09:00:00', clase: 'ACROYOGA' },
    { id_clase: '18', dia: 'jueves', hora: '10:00:00', clase: 'PILATES EXTREME' },
    { id_clase: '19', dia: 'jueves', hora: '17:00:00', clase: 'HATHA YOGA' },
    { id_clase: '20', dia: 'jueves', hora: '18:00:00', clase: 'PILATES EXTREME' },
    { id_clase: '21', dia: 'viernes', hora: '09:00:00', clase: 'PILATES' },
    { id_clase: '22', dia: 'viernes', hora: '15:00:00', clase: 'ASHTANGA YOGA' },
    { id_clase: '23', dia: 'viernes', hora: '16:00:00', clase: 'PILATES' },
    { id_clase: '24', dia: 'viernes', hora: '17:00:00', clase: 'PILATES' },
    { id_clase: '25', dia: 'viernes', hora: '18:00:00', clase: 'ACROYOGA' },
    { id_clase: '26', dia: 'viernes', hora: '19:00:00', clase: 'PILATES' },
    { id_clase: '27', dia: 'viernes', hora: '20:00:00', clase: 'HATHA YOGA' },
    { id_clase: '28', dia: 'sábado ', hora: '09:00:00', clase: 'YOGA+MEDITACIÓN' },
    { id_clase: '29', dia: 'sábado ', hora: '10:00:00', clase: 'ACROYOGA' },
    { id_clase: '30', dia: 'sábado ', hora: '11:00:00', clase: 'PILATES' },
];

let alumnos_clases = [
    // La data inicial está diseñada para simular cupos.
    // Clase 2 (HATHA YOGA - lunes 10:00): 4 alumnos
    { alumno_id: '1', clase_id: '2' },
    { alumno_id: '2', clase_id: '2' },
    { alumno_id: '3', clase_id: '2' },
    { alumno_id: '4', clase_id: '2' },

    // Clase 3 (HATHA YOGA - lunes 17:00): 5 alumnos (casi completa)
    { alumno_id: '5', clase_id: '3' },
    { alumno_id: '6', clase_id: '3' },
    { alumno_id: '7', clase_id: '3' },
    { alumno_id: '8', clase_id: '3' },
    { alumno_id: '9', clase_id: '3' },

    // Clase 4 (ACROYOGA - lunes 18:00): 6 alumnos (COMPLETA)
    { alumno_id: '10', clase_id: '4' },
    { alumno_id: '11', clase_id: '4' },
    { alumno_id: '12', clase_id: '4' },
    { alumno_id: '13', clase_id: '4' },
    { alumno_id: '14', clase_id: '4' },
    { alumno_id: '15', clase_id: '4' },

    // Otras inscripciones
    { alumno_id: '1', clase_id: '10' },
    { alumno_id: '2', clase_id: '12' },
];

// -----------------------------------------------------------------------------
// Funciones de Lógica de Negocio
// -----------------------------------------------------------------------------

/**
 * Calcula la cantidad de alumnos inscritos en una clase.
 * @param {string} claseId - ID de la clase.
 * @returns {number} - Cantidad de alumnos.
 */
const contarAlumnosPorClase = (claseId) => {
    return alumnos_clases.filter(ac => ac.clase_id === claseId).length;
};

/**
 * Prepara el horario con la información de cupos.
 * @returns {Array} - Horario de clases enriquecido.
 */
const getHorarioConCupos = () => {
    return horario_clases.map(clase => {
        const inscritos = contarAlumnosPorClase(clase.id_clase);
        return {
            ...clase,
            cupoActual: inscritos,
            cupoMaximo: MAX_ALUMNOS,
            disponible: inscritos < MAX_ALUMNOS,
            estado: inscritos >= MAX_ALUMNOS ? 'Clase Completa' : 'Disponible',
        };
    });
};

// -----------------------------------------------------------------------------
// 2.1. API RESTful - Endpoints
// -----------------------------------------------------------------------------

/**
 * GET /api/horario
 * Obtiene la grilla de horarios con el estado de cupos.
 */
app.get('/api/horario', (req, res) => {
    // Retorna la grilla de clases enriquecida
    const horario = getHorarioConCupos();
    return res.status(200).json(horario);
});

/**
 * GET /api/alumnos
 * Obtiene el listado completo de alumnos (Reporte y CRUD).
 */
app.get('/api/alumnos', (req, res) => {
    return res.status(200).json(alumnos);
});

/**
 * GET /api/alumnos/:id/clases
 * Obtiene las clases en las que está inscrito un alumno (para el reporte).
 */
app.get('/api/alumnos/:id/clases', (req, res) => {
    const alumnoId = req.params.id;
    const clasesInscritas = alumnos_clases
        .filter(ac => ac.alumno_id === alumnoId)
        .map(ac => horario_clases.find(hc => hc.id_clase === ac.clase_id));

    if (!alumnos.find(a => a.id_alumno === alumnoId)) {
        return res.status(404).json({ message: 'Alumno no encontrado.' });
    }

    return res.status(200).json(clasesInscritas.filter(c => c)); // Filtra por si alguna clase fue borrada
});


/**
 * POST /api/reservas
 * Proceso principal de reserva: registra alumno y sus inscripciones. (ABM: CREAR)
 * Body: { alumno: {nombres, apellidos, dni, email, telefono}, clases: [claseId1, claseId2, ...] }
 */
app.post('/api/reservas', (req, res) => {
    const { alumno: alumnoData, clases: clasesIds } = req.body;

    if (!alumnoData || !clasesIds || clasesIds.length === 0) {
        return res.status(400).json({ message: 'Datos incompletos para la reserva.' });
    }

    // 1. Verificar cupos para todas las clases solicitadas
    const clasesCompletas = clasesIds.filter(claseId => {
        return contarAlumnosPorClase(claseId) >= MAX_ALUMNOS;
    });

    if (clasesCompletas.length > 0) {
        // En este punto, el frontend ya hizo una verificación, pero se verifica de nuevo por seguridad
        // El requisito pide un 'alert', pero en el backend enviamos la lista de clases completas.
        const nombresClasesCompletas = clasesCompletas.map(id => {
            const clase = horario_clases.find(c => c.id_clase === id);
            return `${clase.dia} ${clase.hora} (${clase.clase})`;
        });

        return res.status(409).json({ // 409 Conflict
            message: 'Alerta: Una o más clases seleccionadas están completas.',
            clasesCompletas: nombresClasesCompletas
        });
    }

    // 2. Guardar o encontrar alumno
    let alumnoExistente = alumnos.find(a => a.dni === alumnoData.dni);
    let alumnoId;

    if (alumnoExistente) {
        // Actualizar datos del alumno existente (si aplica)
        Object.assign(alumnoExistente, alumnoData);
        alumnoId = alumnoExistente.id_alumno;
    } else {
        // Crear nuevo alumno (ABM: CREAR)
        const nuevoAlumno = {
            id_alumno: uuidv4(), // Usar UUID para ID en memoria
            ...alumnoData
        };
        alumnos.push(nuevoAlumno);
        alumnoId = nuevoAlumno.id_alumno;
    }

    // 3. Guardar registros en alumnos_clases (Inscripción)
    const nuevasInscripciones = [];
    clasesIds.forEach(claseId => {
        // Evitar duplicados (un alumno no puede inscribirse dos veces a la misma clase)
        const yaInscrito = alumnos_clases.some(ac => ac.alumno_id === alumnoId && ac.clase_id === claseId);
        if (!yaInscrito) {
            alumnos_clases.push({ alumno_id: alumnoId, clase_id: claseId });
            nuevasInscripciones.push(claseId);
        }
    });

    if (nuevasInscripciones.length > 0) {
        return res.status(201).json({
            message: 'Reserva exitosa.',
            alumnoId: alumnoId,
            inscripcionesRealizadas: nuevasInscripciones.length
        });
    } else {
        return res.status(200).json({
            message: 'El alumno ya estaba inscrito a todas las clases seleccionadas.',
            alumnoId: alumnoId,
            inscripcionesRealizadas: 0
        });
    }
});

/**
 * PUT /api/alumnos/:id
 * Actualiza los datos de un alumno existente (CRUD: MODIFICAR).
 */
app.put('/api/alumnos/:id', (req, res) => {
    const alumnoId = req.params.id;
    const updatedData = req.body;
    const index = alumnos.findIndex(a => a.id_alumno === alumnoId);

    if (index === -1) {
        return res.status(404).json({ message: 'Alumno no encontrado.' });
    }

    alumnos[index] = { ...alumnos[index], ...updatedData, id_alumno: alumnoId };
    return res.status(200).json(alumnos[index]);
});

/**
 * DELETE /api/alumnos/:id
 * Elimina un alumno y todas sus inscripciones (CRUD: ELIMINAR).
 */
app.delete('/api/alumnos/:id', (req, res) => {
    const alumnoId = req.params.id;
    const initialLength = alumnos.length;

    // Eliminar alumno
    alumnos = alumnos.filter(a => a.id_alumno !== alumnoId);

    if (alumnos.length === initialLength) {
        return res.status(404).json({ message: 'Alumno no encontrado.' });
    }

    // Eliminar inscripciones asociadas
    alumnos_clases = alumnos_clases.filter(ac => ac.alumno_id !== alumnoId);

    return res.status(204).send(); // 204 No Content
});

// -----------------------------------------------------------------------------
// Inicio del Servidor
// -----------------------------------------------------------------------------
const server = app.listen(PORT, () => {
    console.log(`🚀 Servidor API escuchando en http://localhost:${PORT}`);
    console.log(`Capacidad máxima por clase: ${MAX_ALUMNOS} alumnos.`);
});

// Exporta la app para testing (Punto 3.1)
module.exports = { app, server, MAX_ALUMNOS };
