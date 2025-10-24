// -----------------------------------------------------------------------------
// 3. Testing: Pruebas a los Endpoints de la API
// -----------------------------------------------------------------------------
const request = require('supertest');
const { app, server, MAX_ALUMNOS } = require('./server'); // Importa la app de Express y la capacidad máxima

// Cerramos el servidor al finalizar las pruebas
afterAll(done => {
    server.close(done);
});

describe('API Endpoints Testing', () => {

    // Test 1: GET /api/horario
    test('GET /api/horario debería retornar el horario con cupos y estado correcto', async () => {
        const response = await request(app).get('/api/horario');
        expect(response.statusCode).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
        
        // Verifica que todas las clases tengan la estructura de cupo correcta
        response.body.forEach(clase => {
            expect(clase).toHaveProperty('id_clase');
            expect(clase).toHaveProperty('dia');
            expect(clase).toHaveProperty('cupoActual');
            expect(clase).toHaveProperty('disponible');
            expect(clase).toHaveProperty('estado');
            expect(clase.cupoMaximo).toBe(MAX_ALUMNOS);

            // Verifica la lógica de estado (ej: la clase 4 está completa en la data inicial)
            if (clase.id_clase === '4') {
                expect(clase.cupoActual).toBe(MAX_ALUMNOS);
                expect(clase.disponible).toBe(false);
                expect(clase.estado).toBe('Clase Completa');
            }
        });
    });

    // Test 2: POST /api/reservas (Reserva exitosa)
    test('POST /api/reservas debería crear un nuevo alumno y registrar inscripciones', async () => {
        const nuevaReserva = {
            alumno: {
                nombres: 'Roberto',
                apellidos: 'García',
                dni: '99887766',
                email: 'roberto@test.com',
                telefono: '12345678'
            },
            // Clase 6 (lunes 20:00) y Clase 7 (martes 10:00) están vacías
            clases: ['6', '7'] 
        };

        const response = await request(app)
            .post('/api/reservas')
            .send(nuevaReserva);

        expect(response.statusCode).toBe(201);
        expect(response.body.message).toBe('Reserva exitosa.');
        expect(response.body.inscripcionesRealizadas).toBe(2);

        // Verifica que el alumno fue creado
        const alumnoResponse = await request(app).get('/api/alumnos');
        const nuevoAlumno = alumnoResponse.body.find(a => a.dni === '99887766');
        expect(nuevoAlumno).toBeDefined();
    });

    // Test 3: POST /api/reservas (Clase Completa)
    test('POST /api/reservas debería fallar si se intenta reservar una clase completa', async () => {
        const reservaFallida = {
            alumno: {
                nombres: 'Test',
                apellidos: 'Completo',
                dni: '11111111',
                email: 'test@full.com',
                telefono: '11111111'
            },
            // Clase 4 (ACROYOGA lunes 18:00) está completa en la data inicial
            clases: ['4', '10']
        };

        const response = await request(app)
            .post('/api/reservas')
            .send(reservaFallida);

        expect(response.statusCode).toBe(409); // 409 Conflict
        expect(response.body.message).toContain('Alerta: Una o más clases seleccionadas están completas.');
        expect(response.body.clasesCompletas.length).toBe(1);
        expect(response.body.clasesCompletas[0]).toContain('lunes 18:00:00 (ACROYOGA)');
    });

    // Test 4: ABM (CRUD) - Actualizar Alumno (PUT)
    test('PUT /api/alumnos/:id debería actualizar los datos de un alumno', async () => {
        // Encontrar un ID de alumno existente (usaremos el primero)
        const alumnoId = '1';
        const nuevosDatos = {
            email: 'leandro.perez.actualizado@test.com',
            telefono: '00000000'
        };

        const response = await request(app)
            .put(`/api/alumnos/${alumnoId}`)
            .send(nuevosDatos);

        expect(response.statusCode).toBe(200);
        expect(response.body.email).toBe(nuevosDatos.email);
        expect(response.body.telefono).toBe(nuevosDatos.telefono);
        expect(response.body.id_alumno).toBe(alumnoId);
    });

    // Test 5: ABM (CRUD) - Eliminar Alumno (DELETE)
    test('DELETE /api/alumnos/:id debería eliminar un alumno', async () => {
        // Primero creamos un alumno de prueba para borrar
        const alumnoParaBorrar = {
            nombres: 'Borrar',
            apellidos: 'Test',
            dni: '22222222',
            email: 'borrar@test.com',
            telefono: '123'
        };
        const createResponse = await request(app).post('/api/reservas').send({ alumno: alumnoParaBorrar, clases: ['6'] });
        const alumnoId = createResponse.body.alumnoId;

        // Eliminar el alumno
        const deleteResponse = await request(app).delete(`/api/alumnos/${alumnoId}`);
        expect(deleteResponse.statusCode).toBe(204);

        // Verificar que ya no exista
        const allAlumnosResponse = await request(app).get('/api/alumnos');
        const exists = allAlumnosResponse.body.some(a => a.id_alumno === alumnoId);
        expect(exists).toBe(false);
    });

    // Test 6: Reporte - GET /api/alumnos
    test('GET /api/alumnos debería retornar la lista de alumnos', async () => {
        const response = await request(app).get('/api/alumnos');
        expect(response.statusCode).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body.length).toBeGreaterThan(0);
        // Verifica estructura básica
        expect(response.body[0]).toHaveProperty('dni');
    });

    // Test 7: Reporte - GET /api/alumnos/:id/clases
    test('GET /api/alumnos/:id/clases debería retornar las clases inscritas del alumno', async () => {
        // Alumno ID '1' está inscrito a las clases '2' y '10' en la data inicial
        const alumnoId = '1';
        const response = await request(app).get(`/api/alumnos/${alumnoId}/clases`);
        expect(response.statusCode).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body.length).toBe(2);
        // Verifica que la data contenga la información de las clases
        expect(response.body.some(c => c.id_clase === '2')).toBe(true);
        expect(response.body.some(c => c.id_clase === '10')).toBe(true);
    });

});
