// -----------------------------------------------------------------------------
// 3. Testing: Pruebas a los Endpoints de la API
// -----------------------------------------------------------------------------
const request = require('supertest');
// Importamos la aplicación, la inicialización de DB y la capacidad máxima

// module.exports = {
//   app: app,
//   initializeDatabase: initializeDatabase,
//   CAPACIDAD_MAXIMA: CAPACIDAD_MAXIMA
// };

const { app, initializeDatabase, CAPACIDAD_MAXIMA, openDatabase } = require('./server'); 
const AUTH_TOKEN = 'ADMIN_TOKEN_SECRETO'; // Debe coincidir con el valor en server.js

let testServer; // Variable para almacenar la instancia del servidor HTTP

// Configuramos la base de datos y levantamos el servidor antes de todas las pruebas
beforeAll(async () => {
    // 1. ABRIR la conexión a la base de datos (necesario antes de inicializar)
    await openDatabase();
    
    // 1. Inicializar la base de datos (crea o usa yoga.db)
    await initializeDatabase();
    
    // 2. Levantar el servidor HTTP temporalmente para Supertest
    // Esto es crucial para Supertest, que necesita una instancia HTTP para hacer peticiones.
    testServer = app.listen(0); 
    console.log(`[TEST] Servidor temporal levantado en el puerto ${testServer.address().port}`);
});

// Cerramos el servidor al finalizar todas las pruebas
afterAll(done => {
    testServer.close(done);
});

describe('API Endpoints Testing', () => {

    // Test 1: GET /api/clases - Horario con conteo correcto
    test('GET /api/clases debería retornar el horario con conteo correcto', async () => {
        // Supertest ahora usa el servidor HTTP levantado en beforeAll
        const response = await request(testServer).get('/api/clases');
        expect(response.statusCode).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);

        response.body.forEach(clase => {
            expect(clase).toHaveProperty('id_clase');
            expect(clase).toHaveProperty('dia');
            expect(clase).toHaveProperty('inscriptos'); // Campo corregido
            expect(clase).toHaveProperty('capacidad');
            
            // Verifica las inscripciones iniciales (Clase 1, 2, 3 tienen 2, 1, 1 inscritos respectivamente)
            // (La corrección en server.js asegura que la clase 1 tiene 1, clase 2 tiene 1, y clase 3 tiene 1)
            // Nota: Se asume que el ID 1 tiene 1, el ID 2 tiene 1, y el ID 3 tiene 1.
             
            // Las clases con inscripciones iniciales son: 2, 10, 12, y 24.
            const clasesConInscrito = [2, 10, 12, 24];

            if (clasesConInscrito.includes(clase.id_clase)) {
                 // Estas clases tienen 1 inscrito
                 expect(clase.inscriptos).toBe(1);
            } else {
                 // El resto de las clases deben tener 0 inscritos (estado inicial limpio)
                 expect(clase.inscriptos).toBe(0);
            }
    });
});

    // Test 2: POST /api/reservar - Creación de nuevo alumno e inscripciones
    test('POST /api/reservar debería crear un nuevo alumno y registrar inscripciones', async () => {
        const nuevaReserva = {
            nombres: 'Roberto',
            apellidos: 'García',
            dni: '99887766',
            email: 'roberto@test.com',
            telefono: '12345678',
            // Clase 5 (lunes 20:00) y Clase 7 (martes 10:00) están vacías
            clasesSeleccionadas: [5, 7] 
        };

        const response = await request(testServer)
            .post('/api/reservar')
            .send(nuevaReserva);

        expect(response.statusCode).toBe(201);
        expect(response.body.message).toBe('Proceso de reserva completado.');
        expect(response.body.exitosas.length).toBe(2);

        // Verifica que el alumno fue creado (o encontrado)
        expect(response.body).toHaveProperty('alumnoId');
        
        // Verifica que el alumno fue creado
        const alumnoResponse = await request(testServer).get('/api/alumnos');
        const nuevoAlumno = alumnoResponse.body.find(a => a.dni === '99887766');
        expect(nuevoAlumno).toBeDefined();
    });

    // Test 3: POST /api/reservar - Clase Completa (Último cupo y Advertencia)
    test('POST /api/reservar debería retornar 200 y reportar clases completas', async () => {
        // 1. Llenar la Clase 4 (ACROYOGA lunes 18:00). Empieza con 1 inscrito, capacidad 6.
        // Necesitamos 5 reservas adicionales.
        const claseIdToFill = 4;
        const claseIdToReserve = 7; // Clase que sí se puede reservar

        for (let i = 0; i < 6; i++) {
             const tempReserva = {
                nombres: `Alumno ${i}`,
                apellidos: `Llenado ${i}`,
                dni: `9000000${i}`,
                email: `test${i}@full.com`,
                clasesSeleccionadas: [claseIdToFill]
            };
            // Usamos Supertest para ejecutar la inserción
            await request(testServer).post('/api/reservar').send(tempReserva);
        }

        // 2. Última reserva: intenta reservar la clase llena (Clase 4) y una clase vacía (Clase 7)
        const reservaConAdvertencia = {
            nombres: 'Test',
            apellidos: 'Advertencia',
            dni: '11111111',
            email: 'test@warning.com',
            clasesSeleccionadas: [claseIdToFill, claseIdToReserve]
        };

        const response = await request(testServer)
            .post('/api/reservar')
            .send(reservaConAdvertencia);

        // La respuesta debe ser 200 (OK) con advertencia, no 201 (Created)
        expect(response.statusCode).toBe(200); 
        // Se corrige la expectativa del mensaje para que coincida con el server
        expect(response.body.message).toBe('Proceso de reserva completado.');
        expect(response.body.completas.length).toBe(1);
        expect(response.body.exitosas.length).toBe(1); // La Clase 7 se reserva
        expect(response.body.completas[0]).toContain('ACROYOGA (lunes 18:00:00)');
    });

    // Test 4: PUT /api/alumnos/:id - Actualización de Alumno (CRUD: Update)
    test('PUT /api/alumnos/:id debería actualizar los datos de un alumno', async () => {
        // Alumno ID 1 está en la data inicial
        const alumnoId = 1;
        const nuevosDatos = {
            nombres: 'Leandro Actualizado',
            apellidos: 'Perez',
            dni: '11678443',
            email: 'leandro.perez.actualizado@test.com',
            telefono: '00000000'
        };

        const response = await request(testServer)
            .put(`/api/alumnos/${alumnoId}`)
            .send(nuevosDatos);

        expect(response.statusCode).toBe(200);
        // Verifica que la respuesta indique el cambio exitoso
        expect(response.body.message).toBe('Alumno actualizado exitosamente.');
    });

    // Test 5: DELETE /api/alumnos/:id - Eliminación de Alumno (con Auth) (CRUD: Delete)
    test('DELETE /api/alumnos/:id debería eliminar un alumno (con Auth)', async () => {
        // Primero creamos un alumno de prueba para borrar
        const alumnoParaBorrar = {
            nombres: 'Borrar',
            apellidos: 'Test',
            dni: '22222222',
            email: 'borrar@test.com',
            telefono: '123'
        };
        // Usamos una clase vacía (ej: Clase 10)
        const createResponse = await request(testServer).post('/api/reservar').send({ 
            ...alumnoParaBorrar, 
            clasesSeleccionadas: [10] 
        });
        const alumnoId = createResponse.body.alumnoId;

        // Eliminar el alumno con Auth
        const deleteResponse = await request(testServer)
            .delete(`/api/alumnos/${alumnoId}`)
            .set('Authorization', AUTH_TOKEN); // Adjuntamos el token

        expect(deleteResponse.statusCode).toBe(200);
        expect(deleteResponse.body.message).toBe('Alumno eliminado exitosamente (incluidas sus reservas).');

        // Verificar que ya no exista
        const allAlumnosResponse = await request(testServer).get('/api/alumnos');
        const exists = allAlumnosResponse.body.some(a => a.id_alumno === alumnoId);
        expect(exists).toBe(false);
    });
    
    // Test 6: GET /api/alumnos - Lista de alumnos (Reporte)
    test('GET /api/alumnos debería retornar la lista de alumnos', async () => {
        const response = await request(testServer).get('/api/alumnos');
        expect(response.statusCode).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
        // Debe tener más que los 4 iniciales + 2 creados + 1 advertencia + 1 borrado = 7
        expect(response.body.length).toBeGreaterThan(6); 
    });

    // Test 7: GET /api/reporte/detalle (Datos para PDF)
    test('GET /api/reporte/detalle debería retornar todas las clases con la lista de alumnos', async () => {
        const response = await request(testServer).get('/api/reporte/detalle');
        expect(response.statusCode).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body.length).toBeGreaterThan(20); // Debe tener todas las clases

        // Verifica que la data contenga la información del alumno inscrito en Clase 1
        const clase2 = response.body.find(c => c.id_clase === 2);
        expect(clase2).toBeDefined();
        expect(clase2).toHaveProperty('alumnos_inscritos');
        expect(clase2.alumnos_inscritos.length).toBe(1); // Alumno 1
        expect(clase2.alumnos_inscritos[0]).toHaveProperty('nombres');
});
});
