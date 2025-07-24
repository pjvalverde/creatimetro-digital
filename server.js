const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const RESPONSES_FILE = path.join(__dirname, 'responses.json');

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Función para leer respuestas del archivo
function readResponses() {
    try {
        if (fs.existsSync(RESPONSES_FILE)) {
            const data = fs.readFileSync(RESPONSES_FILE, 'utf8');
            return JSON.parse(data);
        }
        return [];
    } catch (error) {
        console.error('Error reading responses:', error);
        return [];
    }
}

// Función para escribir respuestas al archivo
function writeResponses(responses) {
    try {
        fs.writeFileSync(RESPONSES_FILE, JSON.stringify(responses, null, 2));
    } catch (error) {
        console.error('Error writing responses:', error);
    }
}

// Función para calcular métricas de creatividad
function calculateCreativityMetrics(ideas) {
    // Fluidez: número de ideas completadas (no vacías)
    const fluidez = ideas.filter(idea => idea && idea.trim().length > 0).length;
    
    // Flexibilidad: diversidad de categorías temáticas
    const categories = new Set();
    const keywords = {
        'tecnologia': ['robot', 'ia', 'inteligencia', 'artificial', 'tecnolog', 'digital'],
        'transporte': ['auto', 'carro', 'avion', 'nave', 'vuelo', 'transporte', 'viaje'],
        'medicina': ['medic', 'salud', 'cura', 'enfermedad', 'doctor', 'hospital'],
        'comunicacion': ['comunic', 'telefon', 'mensaje', 'chat', 'video', 'hologram'],
        'energia': ['energia', 'solar', 'electr', 'bateria', 'combustible'],
        'espacio': ['espacio', 'planeta', 'marte', 'luna', 'galaxia', 'universo'],
        'educacion': ['educac', 'aprend', 'escuela', 'estudi', 'enseñ'],
        'hogar': ['casa', 'hogar', 'cocina', 'habitac', 'mueble'],
        'entretenimiento': ['juego', 'divers', 'entret', 'pelicula', 'musica'],
        'trabajo': ['trabajo', 'oficina', 'empleo', 'laboral', 'productiv']
    };
    
    ideas.forEach(idea => {
        if (idea && idea.trim().length > 0) {
            const ideaLower = idea.toLowerCase();
            for (const [category, keywordList] of Object.entries(keywords)) {
                if (keywordList.some(keyword => ideaLower.includes(keyword))) {
                    categories.add(category);
                    break;
                }
            }
        }
    });
    
    const flexibilidad = categories.size;
    
    // Puntaje de creatividad combinado (0-100)
    const puntajeCreatividad = Math.min(100, (fluidez * 7) + (flexibilidad * 3));
    
    return {
        fluidez,
        flexibilidad,
        puntajeCreatividad
    };
}

// Endpoint POST /api/submit para recibir respuestas de formulario
app.post('/api/submit', (req, res) => {
    try {
        const {
            nombre,
            correo,
            ideas,
            diversion,
            desafio,
            masActividades,
            comentarios,
            tiempoUtilizado
        } = req.body;

        // Validar datos requeridos
        if (!nombre || !correo || !ideas) {
            return res.status(400).json({
                success: false,
                message: 'Nombre, correo e ideas son requeridos'
            });
        }

        // Calcular métricas de creatividad
        const metricas = calculateCreativityMetrics(ideas);

        // Crear nueva respuesta
        const nuevaRespuesta = {
            id: Date.now().toString(),
            timestamp: new Date().toISOString(),
            nombre,
            correo,
            ideas,
            diversion: parseInt(diversion),
            desafio: parseInt(desafio),
            masActividades,
            comentarios,
            tiempoUtilizado: parseInt(tiempoUtilizado),
            metricas,
            calificacionManual: null
        };

        // Leer respuestas existentes y agregar la nueva
        const respuestas = readResponses();
        respuestas.push(nuevaRespuesta);
        writeResponses(respuestas);

        res.json({
            success: true,
            message: 'Respuesta guardada exitosamente',
            metricas
        });

    } catch (error) {
        console.error('Error al guardar respuesta:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// Endpoint GET /api/responses para obtener todas las respuestas
app.get('/api/responses', (req, res) => {
    try {
        const respuestas = readResponses();
        res.json({
            success: true,
            data: respuestas
        });
    } catch (error) {
        console.error('Error al obtener respuestas:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// Endpoint GET /api/stats para estadísticas
app.get('/api/stats', (req, res) => {
    try {
        const respuestas = readResponses();
        
        if (respuestas.length === 0) {
            return res.json({
                success: true,
                data: {
                    totalRespuestas: 0,
                    promedioFluidez: 0,
                    promedioFlexibilidad: 0,
                    promedioPuntaje: 0,
                    promedioDiversion: 0,
                    promedioDesafio: 0,
                    promedioTiempo: 0
                }
            });
        }

        const stats = {
            totalRespuestas: respuestas.length,
            promedioFluidez: respuestas.reduce((sum, r) => sum + r.metricas.fluidez, 0) / respuestas.length,
            promedioFlexibilidad: respuestas.reduce((sum, r) => sum + r.metricas.flexibilidad, 0) / respuestas.length,
            promedioPuntaje: respuestas.reduce((sum, r) => sum + r.metricas.puntajeCreatividad, 0) / respuestas.length,
            promedioDiversion: respuestas.reduce((sum, r) => sum + r.diversion, 0) / respuestas.length,
            promedioDesafio: respuestas.reduce((sum, r) => sum + r.desafio, 0) / respuestas.length,
            promedioTiempo: respuestas.reduce((sum, r) => sum + r.tiempoUtilizado, 0) / respuestas.length
        };

        res.json({
            success: true,
            data: stats
        });

    } catch (error) {
        console.error('Error al obtener estadísticas:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// Endpoint DELETE /api/responses/:id para eliminar respuesta específica
app.delete('/api/responses/:id', (req, res) => {
    try {
        const { id } = req.params;
        const respuestas = readResponses();
        
        const respuestasFiltradas = respuestas.filter(r => r.id !== id);
        
        if (respuestasFiltradas.length === respuestas.length) {
            return res.status(404).json({
                success: false,
                message: 'Respuesta no encontrada'
            });
        }

        writeResponses(respuestasFiltradas);

        res.json({
            success: true,
            message: 'Respuesta eliminada exitosamente'
        });

    } catch (error) {
        console.error('Error al eliminar respuesta:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// Endpoint PUT /api/responses/:id/grade para asignar calificación manual
app.put('/api/responses/:id/grade', (req, res) => {
    try {
        const { id } = req.params;
        const { calificacion } = req.body;
        
        if (calificacion < 0 || calificacion > 100) {
            return res.status(400).json({
                success: false,
                message: 'La calificación debe estar entre 0 y 100'
            });
        }

        const respuestas = readResponses();
        const respuestaIndex = respuestas.findIndex(r => r.id === id);
        
        if (respuestaIndex === -1) {
            return res.status(404).json({
                success: false,
                message: 'Respuesta no encontrada'
            });
        }

        respuestas[respuestaIndex].calificacionManual = calificacion;
        writeResponses(respuestas);

        res.json({
            success: true,
            message: 'Calificación asignada exitosamente'
        });

    } catch (error) {
        console.error('Error al asignar calificación:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// Ruta para servir el panel de administrador
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`🚀 Creatímetro Digital ejecutándose en http://localhost:${PORT}`);
    console.log(`📊 Panel de administrador: http://localhost:${PORT}/admin`);
});
