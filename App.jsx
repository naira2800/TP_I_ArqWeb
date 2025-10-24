// -----------------------------------------------------------------------------
// 1. Frontend: Implementación de la Grilla, Formulario y Reportes
// -----------------------------------------------------------------------------
import React, { useState, useEffect, useCallback } from 'react';
import { RefreshCcw, User, Calendar, BookOpen, Trash2, Edit } from 'lucide-react';

// URL base de la API de Node.js
const API_URL = 'http://localhost:3000/api';

// Utilidad para mapear los días en español y su orden
const DIAS_SEMANA = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado '];

// Componente principal de la aplicación
const App = () => {
    // Estados de la aplicación
    const [horario, setHorario] = useState([]);
    const [alumnos, setAlumnos] = useState([]);
    const [view, setView] = useState('horario'); // 'horario', 'reporte', 'crud'
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [formData, setFormData] = useState({ // Estado para el formulario de reserva
        nombres: '',
        apellidos: '',
        dni: '',
        email: '',
        telefono: '',
        clasesSeleccionadas: []
    });
    const [modal, setModal] = useState({ // Estado para el modal de reserva o edición
        isOpen: false,
        type: 'reserve', // 'reserve' o 'edit'
        claseId: null,
        alumnoId: null,
        title: ''
    });

    // -------------------------------------------------------------------------
    // Funciones de Fetching de Datos (CRUD: LEER)
    // -------------------------------------------------------------------------

    // Función para obtener la grilla de horarios
    const fetchHorario = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`${API_URL}/horario`);
            if (!response.ok) throw new Error('Error al cargar el horario.');
            const data = await response.json();

            // Agrupa y ordena el horario por día para la grilla
            const grouped = data.reduce((acc, clase) => {
                const dia = clase.dia.trim();
                if (!acc[dia]) acc[dia] = [];
                acc[dia].push(clase);
                return acc;
            }, {});

            // Ordena las clases dentro de cada día por hora
            Object.keys(grouped).forEach(dia => {
                grouped[dia].sort((a, b) => a.hora.localeCompare(b.hora));
            });

            setHorario(grouped);
        } catch (err) {
            console.error('Fetch Error:', err);
            setError('No se pudo conectar al servidor. Asegúrate de que el backend esté corriendo.');
        } finally {
            setLoading(false);
        }
    }, []);

    // Función para obtener la lista de alumnos (para Reporte/CRUD)
    const fetchAlumnos = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`${API_URL}/alumnos`);
            if (!response.ok) throw new Error('Error al cargar alumnos.');
            const data = await response.json();
            setAlumnos(data);
        } catch (err) {
            console.error('Fetch Error:', err);
            setError('No se pudo cargar la lista de alumnos.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (view === 'horario') {
            fetchHorario();
        } else if (view === 'reporte' || view === 'crud') {
            fetchAlumnos();
        }
    }, [view, fetchHorario, fetchAlumnos]);

    // -------------------------------------------------------------------------
    // Lógica del Formulario y Reservas (CRUD: CREAR)
    // -------------------------------------------------------------------------

    const openReserveModal = (claseId) => {
        const clase = getClaseById(claseId);
        if (!clase.disponible) {
            // Requisito: Si la clase está completa, aparece un alert.
            alert(`La clase ${clase.dia} a las ${clase.hora.substring(0, 5)} (${clase.clase}) está completa y no puedes inscribirte.`);
            return;
        }

        // Limpiar el formulario y abrir modal
        setFormData({ nombres: '', apellidos: '', dni: '', email: '', telefono: '', clasesSeleccionadas: [claseId] });
        setModal({
            isOpen: true,
            type: 'reserve',
            claseId: claseId,
            alumnoId: null,
            title: `Reserva para: ${clase.clase} (${clase.dia} ${clase.hora.substring(0, 5)})`
        });
    };

    const handleFormChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const toggleClaseSeleccionada = (claseId) => {
        setFormData(prev => {
            const newClases = prev.clasesSeleccionadas.includes(claseId)
                ? prev.clasesSeleccionadas.filter(id => id !== claseId)
                : [...prev.clasesSeleccionadas, claseId];
            return { ...prev, clasesSeleccionadas: newClases };
        });
    };

    // Función para manejar el envío del formulario de reserva/edición
    const handleFormSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const alumnoData = {
            nombres: formData.nombres.trim(),
            apellidos: formData.apellidos.trim(),
            dni: formData.dni.trim(),
            email: formData.email.trim(),
            telefono: formData.telefono.trim(),
        };

        if (modal.type === 'reserve') {
            try {
                const payload = {
                    alumno: alumnoData,
                    clases: formData.clasesSeleccionadas
                };

                const response = await fetch(`${API_URL}/reservas`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                });

                const result = await response.json();

                if (response.ok && response.status === 201) {
                    alert(`¡Reserva exitosa para ${result.inscripcionesRealizadas} clases!`);
                    setModal({ isOpen: false });
                    fetchHorario(); // Actualizar grilla
                } else if (response.status === 409) {
                    // Requisito: Si una clase está completa, aparecerá un alert informándole.
                    alert(`¡ERROR! Las siguientes clases están completas y no se pudo completar la reserva:\n- ${result.clasesCompletas.join('\n- ')}`);
                } else {
                    throw new Error(result.message || 'Error desconocido al procesar la reserva.');
                }
            } catch (err) {
                console.error('Error de Reserva:', err);
                setError(err.message);
            }
        } else if (modal.type === 'edit') {
            // CRUD: MODIFICAR (Alumnos)
            try {
                const response = await fetch(`${API_URL}/alumnos/${modal.alumnoId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(alumnoData),
                });

                if (!response.ok) throw new Error('Error al actualizar alumno.');
                alert('Alumno actualizado exitosamente.');
                setModal({ isOpen: false });
                fetchAlumnos(); // Actualizar lista de alumnos
            } catch (err) {
                console.error('Error de Edición:', err);
                setError(err.message);
            }
        }
        setLoading(false);
    };


    // -------------------------------------------------------------------------
    // Lógica CRUD de Alumnos (Punto 1.1: ABM)
    // -------------------------------------------------------------------------

    const openEditModal = (alumno) => {
        setFormData({
            nombres: alumno.nombres,
            apellidos: alumno.apellidos,
            dni: alumno.dni,
            email: alumno.email,
            telefono: alumno.telefono,
            clasesSeleccionadas: []
        });
        setModal({
            isOpen: true,
            type: 'edit',
            claseId: null,
            alumnoId: alumno.id_alumno,
            title: `Editar Alumno: ${alumno.nombres} ${alumno.apellidos}`
        });
    };

    const handleDeleteAlumno = async (alumnoId) => {
        // Usar un modal custom en lugar de window.confirm()
        if (!window.confirm('¿Está seguro de eliminar a este alumno y todas sus inscripciones?')) {
            return;
        }
        setLoading(true);
        try {
            const response = await fetch(`${API_URL}/alumnos/${alumnoId}`, {
                method: 'DELETE',
            });

            if (!response.ok) throw new Error('Error al eliminar alumno.');
            
            alert('Alumno eliminado exitosamente.');
            fetchAlumnos();
        } catch (err) {
            console.error('Error de Eliminación:', err);
            setError(err.message || 'No se pudo eliminar el alumno.');
        } finally {
            setLoading(false);
        }
    };
    
    // -------------------------------------------------------------------------
    // Componentes de Renderizado
    // -------------------------------------------------------------------------

    const getClaseById = (id) => {
        for (const dia in horario) {
            const clase = horario[dia].find(c => c.id_clase === id);
            if (clase) return clase;
        }
        return null;
    };

    /**
     * Renderiza la grilla de horarios.
     */
    const renderHorarioGrid = () => (
        <div className="p-4 md:p-8">
            <h1 className="text-3xl font-extrabold text-indigo-800 mb-6 flex items-center justify-center">
                <Calendar className="mr-2 h-7 w-7" /> Horario de Clases
            </h1>
            <p className="text-gray-600 text-center mb-6">
                Capacidad máxima por clase: <span className="font-bold text-red-500">6 alumnos</span>. Haz click en una clase disponible para reservar.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {DIAS_SEMANA.map(dia => (
                    <div key={dia} className="flex flex-col">
                        <h2 className="text-lg font-semibold bg-indigo-500 text-white p-2 rounded-t-lg shadow-md capitalize">
                            {dia}
                        </h2>
                        <div className="space-y-2 p-1 border border-indigo-200 rounded-b-lg flex-grow">
                            {horario[dia.trim()] && horario[dia.trim()].length > 0 ? (
                                horario[dia.trim()].map(clase => (
                                    <div
                                        key={clase.id_clase}
                                        onClick={() => clase.disponible && openReserveModal(clase.id_clase)}
                                        className={`p-3 rounded-lg shadow-sm transition-all duration-300 transform hover:scale-[1.02] cursor-pointer text-sm
                                            ${clase.disponible
                                            ? 'bg-green-100 text-green-800 border-green-300 hover:bg-green-200'
                                            : 'bg-red-200 text-red-800 border-red-400 opacity-70 cursor-not-allowed'
                                            }`}
                                    >
                                        <div className="font-bold">{clase.hora.substring(0, 5)} - {clase.clase}</div>
                                        <div className="mt-1 text-xs">
                                            {clase.estado} ({clase.cupoActual}/{clase.cupoMaximo})
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="p-3 text-center text-gray-500 text-sm">No hay clases programadas.</div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    /**
     * Renderiza el modal de Reserva/Edición.
     */
    const renderModal = () => {
        if (!modal.isOpen) return null;

        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
                    <h2 className="text-2xl font-bold mb-4 text-indigo-700">{modal.title}</h2>
                    <form onSubmit={handleFormSubmit}>
                        <div className="grid grid-cols-1 gap-4 mb-4">
                            <input
                                type="text"
                                name="nombres"
                                placeholder="Nombres"
                                value={formData.nombres}
                                onChange={handleFormChange}
                                required
                                className="p-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                            />
                            <input
                                type="text"
                                name="apellidos"
                                placeholder="Apellidos"
                                value={formData.apellidos}
                                onChange={handleFormChange}
                                required
                                className="p-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                            />
                            <input
                                type="text"
                                name="dni"
                                placeholder="DNI"
                                value={formData.dni}
                                onChange={handleFormChange}
                                required
                                disabled={modal.type === 'edit'} // No se puede editar el DNI en el ABM
                                className="p-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100"
                            />
                            <input
                                type="email"
                                name="email"
                                placeholder="Email"
                                value={formData.email}
                                onChange={handleFormChange}
                                required
                                className="p-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                            />
                            <input
                                type="text"
                                name="telefono"
                                placeholder="Teléfono"
                                value={formData.telefono}
                                onChange={handleFormChange}
                                required
                                className="p-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                            />
                        </div>

                        {modal.type === 'reserve' && (
                            <div className="mb-6 border p-4 rounded-lg bg-indigo-50">
                                <h3 className="font-semibold text-indigo-700 mb-3 flex items-center">
                                    <BookOpen className="mr-1 h-4 w-4" /> Seleccionar Clases Adicionales
                                </h3>
                                <div className="max-h-48 overflow-y-auto space-y-2">
                                    {Object.values(horario).flat().map(clase => (
                                        <label key={clase.id_clase} className={`flex items-center p-2 rounded-md transition duration-150 ${clase.disponible ? 'hover:bg-indigo-100 cursor-pointer' : 'bg-red-100 opacity-60 cursor-not-allowed'}`}>
                                            <input
                                                type="checkbox"
                                                checked={formData.clasesSeleccionadas.includes(clase.id_clase)}
                                                onChange={() => toggleClaseSeleccionada(clase.id_clase)}
                                                disabled={!clase.disponible}
                                                className="form-checkbox h-5 w-5 text-indigo-600 rounded"
                                            />
                                            <span className={`ml-3 text-sm font-medium ${clase.disponible ? 'text-gray-700' : 'text-red-500 line-through'}`}>
                                                {clase.dia} {clase.hora.substring(0, 5)} ({clase.clase}) - {clase.estado}
                                            </span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="flex justify-end space-x-3">
                            <button
                                type="button"
                                onClick={() => setModal({ isOpen: false })}
                                className="px-4 py-2 bg-gray-300 text-gray-800 font-semibold rounded-lg hover:bg-gray-400 transition duration-150"
                                disabled={loading}
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition duration-150 disabled:bg-indigo-400 flex items-center"
                                disabled={loading || formData.clasesSeleccionadas.length === 0 && modal.type === 'reserve'}
                            >
                                {loading && <RefreshCcw className="animate-spin mr-2 h-4 w-4" />}
                                {modal.type === 'reserve' ? 'Guardar Reserva' : 'Guardar Cambios'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        );
    };

    /**
     * Componente de Tabla para el Reporte/CRUD.
     */
    const AlumnosTable = ({ showCrud = false }) => {
        const [reporteAlumnoId, setReporteAlumnoId] = useState(null);
        const [clasesReporte, setClasesReporte] = useState([]);
        const [loadingReporte, setLoadingReporte] = useState(false);

        // Obtiene las clases inscritas para un alumno (Punto 1.2: Reporte detallado)
        const fetchClasesInscritas = async (id) => {
            setLoadingReporte(true);
            setReporteAlumnoId(id);
            setClasesReporte([]);
            try {
                const response = await fetch(`${API_URL}/alumnos/${id}/clases`);
                if (!response.ok) throw new Error('Error al cargar clases inscritas.');
                const data = await response.json();
                setClasesReporte(data);
            } catch (err) {
                console.error('Reporte Error:', err);
                alert('Error al generar el reporte de clases del alumno.');
            } finally {
                setLoadingReporte(false);
            }
        };

        const renderReporte = (alumno) => {
            if (reporteAlumnoId !== alumno.id_alumno) return null;

            return (
                <tr className="bg-indigo-50">
                    <td colSpan={showCrud ? 7 : 6} className="p-4 border-t border-indigo-200">
                        <div className="font-semibold text-indigo-700 mb-2">Clases Inscritas:</div>
                        {loadingReporte ? (
                            <div className="text-gray-500 flex items-center"><RefreshCcw className="animate-spin mr-2 h-4 w-4" /> Cargando...</div>
                        ) : clasesReporte.length > 0 ? (
                            <ul className="list-disc list-inside text-sm space-y-1">
                                {clasesReporte.map(c => (
                                    <li key={c.id_clase}>{c.dia} {c.hora.substring(0, 5)} - {c.clase}</li>
                                ))}
                            </ul>
                        ) : (
                            <div className="text-gray-500 text-sm">El alumno no tiene inscripciones activas.</div>
                        )}
                    </td>
                </tr>
            );
        };

        return (
            <div className="overflow-x-auto rounded-xl shadow-lg border border-gray-200">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-indigo-600 text-white">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Nombre Completo</th>
                            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">DNI</th>
                            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Email</th>
                            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Teléfono</th>
                            <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider">Acciones</th>
                            {showCrud && <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider">ABM</th>}
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {alumnos.map((alumno) => (
                            <React.Fragment key={alumno.id_alumno}>
                                <tr className="hover:bg-gray-50 transition duration-150">
                                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{alumno.nombres} {alumno.apellidos}</td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{alumno.dni}</td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{alumno.email}</td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{alumno.telefono}</td>
                                    <td className="px-4 py-4 whitespace-nowrap text-center text-sm font-medium">
                                        <button
                                            onClick={() => fetchClasesInscritas(alumno.id_alumno)}
                                            className="text-indigo-600 hover:text-indigo-900 transition duration-150 p-2 rounded-full hover:bg-indigo-100"
                                            title="Ver Clases"
                                        >
                                            <BookOpen className="h-5 w-5" />
                                        </button>
                                    </td>
                                    {showCrud && (
                                        <td className="px-4 py-4 whitespace-nowrap text-center text-sm font-medium space-x-2">
                                            <button
                                                onClick={() => openEditModal(alumno)}
                                                className="text-green-600 hover:text-green-900 transition duration-150 p-2 rounded-full hover:bg-green-100"
                                                title="Editar"
                                            >
                                                <Edit className="h-5 w-5" />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteAlumno(alumno.id_alumno)}
                                                className="text-red-600 hover:text-red-900 transition duration-150 p-2 rounded-full hover:bg-red-100"
                                                title="Eliminar"
                                            >
                                                <Trash2 className="h-5 w-5" />
                                            </button>
                                        </td>
                                    )}
                                </tr>
                                {renderReporte(alumno)}
                            </React.Fragment>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    };

    /**
     * Renderiza la pantalla de Reporte (Punto 1.2).
     */
    const renderReporteView = () => (
        <div className="p-4 md:p-8">
            <h1 className="text-3xl font-extrabold text-indigo-800 mb-6 flex items-center justify-center">
                <BookOpen className="mr-2 h-7 w-7" /> Reporte de Alumnos y Clases
            </h1>
            <p className="text-gray-600 text-center mb-6">
                Listado de alumnos registrados. Haz click en el icono de libro para ver el detalle de sus inscripciones.
            </p>
            {loading ? <p className="text-center text-indigo-500">Cargando alumnos...</p> : <AlumnosTable />}
        </div>
    );
    
    /**
     * Renderiza la pantalla de CRUD (Punto 1.1: ABM).
     */
    const renderCrudView = () => (
        <div className="p-4 md:p-8">
            <h1 className="text-3xl font-extrabold text-indigo-800 mb-6 flex items-center justify-center">
                <User className="mr-2 h-7 w-7" /> Gestión de Alumnos (CRUD/ABM)
            </h1>
            <p className="text-gray-600 text-center mb-6">
                Administración de la base de datos de Alumnos: Modificar o Eliminar.
            </p>
            {loading ? <p className="text-center text-indigo-500">Cargando alumnos...</p> : <AlumnosTable showCrud={true} />}
        </div>
    );

    // -------------------------------------------------------------------------
    // Layout Principal
    // -------------------------------------------------------------------------

    return (
        <div className="min-h-screen bg-gray-50 font-sans antialiased">
            {/* Navbar de Navegación */}
            <nav className="bg-white shadow-md sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex items-center">
                            <span className="text-2xl font-bold text-indigo-600">YogaFlow</span>
                        </div>
                        <div className="flex items-center space-x-4">
                            <NavItem name="Horario" currentView={view} targetView="horario" onClick={() => setView('horario')} />
                            <NavItem name="Reporte" currentView={view} targetView="reporte" onClick={() => setView('reporte')} />
                            <NavItem name="Gestión Alumnos (CRUD)" currentView={view} targetView="crud" onClick={() => setView('crud')} />
                            <button
                                onClick={fetchHorario}
                                className="p-2 rounded-full text-gray-500 hover:text-indigo-600 hover:bg-indigo-100 transition duration-150"
                                title="Recargar Data"
                                disabled={loading}
                            >
                                <RefreshCcw className={`h-5 w-5 ${loading && view === 'horario' ? 'animate-spin' : ''}`} />
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                {error && (
                    <div className="p-4 mb-4 text-sm text-red-700 bg-red-100 rounded-lg" role="alert">
                        {error}
                    </div>
                )}
                {view === 'horario' && renderHorarioGrid()}
                {view === 'reporte' && renderReporteView()}
                {view === 'crud' && renderCrudView()}
            </main>

            {renderModal()}
        </div>
    );
};

// Componente de ayuda para la navegación
const NavItem = ({ name, currentView, targetView, onClick }) => {
    const isActive = currentView === targetView;
    const baseClasses = "px-3 py-2 text-sm font-medium rounded-md transition duration-150";
    const activeClasses = "bg-indigo-100 text-indigo-700";
    const inactiveClasses = "text-gray-600 hover:bg-gray-50 hover:text-gray-800";

    return (
        <button
            onClick={onClick}
            className={`${baseClasses} ${isActive ? activeClasses : inactiveClasses}`}
        >
            {name}
        </button>
    );
};

export default App;
