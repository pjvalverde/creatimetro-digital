const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
require('dotenv').config();

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

// Función para calcular métricas de creatividad con DeepSeek API
async function evaluateIdeasWithAI(ideas) {
    const evaluatedIdeas = [];
    const validIdeas = ideas.filter(idea => idea && idea.trim().length > 0);
    
    for (const idea of validIdeas) {
        try {
            const evaluation = await evaluateIdeaWithDeepSeek(idea);
            evaluatedIdeas.push({
                idea: idea,
                originalidad: evaluation.originalidad,
                categoria: evaluation.categoria,
                originalidadPuntos: getOriginalidadPoints(evaluation.originalidad)
            });
        } catch (error) {
            console.error('Error evaluando idea:', idea, error);
            // Fallback a evaluación manual si falla la API
            evaluatedIdeas.push({
                idea: idea,
                originalidad: 'Media',
                categoria: 'Otra',
                originalidadPuntos: 2
            });
        }
    }

    // Calcular métricas finales
    const fluidez = validIdeas.length;
    const categorias = new Set(evaluatedIdeas.map(e => e.categoria));
    const flexibilidad = categorias.size;
    const originalidadPromedio = evaluatedIdeas.reduce((sum, e) => sum + e.originalidadPuntos, 0) / evaluatedIdeas.length || 0;
    const puntajeCreatividad = Math.min(100, (fluidez * 5) + (flexibilidad * 5) + (originalidadPromedio * 20));

    return {
        fluidez,
        flexibilidad,
        originalidadPromedio: Math.round(originalidadPromedio * 10) / 10,
        puntajeCreatividad: Math.round(puntajeCreatividad),
        evaluacionDetallada: evaluatedIdeas,
        categorias: Array.from(categorias)
    };
}

// Función para evaluar una idea individual con DeepSeek
async function evaluateIdeaWithDeepSeek(idea) {
    const prompt = `Evalúa la siguiente idea tecnológica para el año 2075 en cuanto a originalidad (Alta, Media, Baja) y clasifícala en una categoría tecnológica (Transporte, Salud, Robótica, Comunicación, Energía, Educación, Medioambiente, Entretenimiento, Hogar, Otra).

Idea: "${idea}"

Responde ÚNICAMENTE en este formato exacto:
Originalidad: [Alta/Media/Baja]
Categoría: [Una de las categorías listadas]`;

    const response = await axios.post(
        process.env.DEEPSEEK_API_URL || 'https://api.deepseek.com/v1/chat/completions',
        {
            model: 'deepseek-chat',
            messages: [
                {
                    role: 'user',
                    content: prompt
                }
            ],
            max_tokens: 100,
            temperature: 0.1
        },
        {
            headers: {
                'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`,
                'Content-Type': 'application/json'
            }
        }
    );

    const aiResponse = response.data.choices[0].message.content.trim();
    
    // Parsear la respuesta de la AI
    const originalidadMatch = aiResponse.match(/Originalidad:\s*(Alta|Media|Baja)/i);
    const categoriaMatch = aiResponse.match(/Categoría:\s*(Transporte|Salud|Robótica|Comunicación|Energía|Educación|Medioambiente|Entretenimiento|Hogar|Otra)/i);
    
    return {
        originalidad: originalidadMatch ? originalidadMatch[1] : 'Media',
        categoria: categoriaMatch ? categoriaMatch[1] : 'Otra'
    };
}

// Función auxiliar para convertir originalidad a puntos
function getOriginalidadPoints(originalidad) {
    switch (originalidad.toLowerCase()) {
        case 'alta': return 3;
        case 'media': return 2;
        case 'baja': return 1;
        default: return 2;
    }
}

// Función para calcular métricas de creatividad (versión fallback)
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
app.post('/api/submit', async (req, res) => {
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

        // Calcular métricas de creatividad con IA (si la API está disponible)
        let metricas;
        const useAI = process.env.DEEPSEEK_API_KEY && process.env.DEEPSEEK_API_KEY !== 'your_deepseek_api_key_here';
        
        if (useAI) {
            console.log('🤖 Evaluando ideas con DeepSeek AI...');
            metricas = await evaluateIdeasWithAI(ideas);
        } else {
            console.log('📊 Usando evaluación manual (fallback)...');
            metricas = calculateCreativityMetrics(ideas);
        }

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
            calificacionManual: null,
            evaluadoConIA: useAI
        };

        // Leer respuestas existentes y agregar la nueva
        const respuestas = readResponses();
        respuestas.push(nuevaRespuesta);
        writeResponses(respuestas);

        console.log(`✅ Nueva respuesta guardada de ${nombre} (${respuestas.length} total)`);

        res.json({
            success: true,
            message: 'Respuesta guardada exitosamente',
            metricas,
            evaluadoConIA: useAI
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

// Endpoint POST /api/responses/:id/reevaluate para re-evaluar con IA
app.post('/api/responses/:id/reevaluate', async (req, res) => {
    try {
        const { id } = req.params;
        
        const respuestas = readResponses();
        const respuestaIndex = respuestas.findIndex(r => r.id === id);
        
        if (respuestaIndex === -1) {
            return res.status(404).json({
                success: false,
                message: 'Respuesta no encontrada'
            });
        }

        const respuesta = respuestas[respuestaIndex];
        
        // Verificar que la API de DeepSeek esté configurada
        const useAI = process.env.DEEPSEEK_API_KEY && process.env.DEEPSEEK_API_KEY !== 'your_deepseek_api_key_here';
        
        if (!useAI) {
            return res.status(400).json({
                success: false,
                message: 'API de DeepSeek no configurada'
            });
        }

        // Re-evaluar con IA
        const nuevasMetricas = await evaluateIdeasWithAI(respuesta.ideas);
        
        // Actualizar respuesta
        respuestas[respuestaIndex].metricas = nuevasMetricas;
        respuestas[respuestaIndex].evaluadoConIA = true;
        respuestas[respuestaIndex].reevaluadoEn = new Date().toISOString();
        
        writeResponses(respuestas);

        res.json({
            success: true,
            message: 'Respuesta re-evaluada con IA exitosamente',
            metricas: nuevasMetricas
        });

    } catch (error) {
        console.error('Error al re-evaluar respuesta:', error);
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
