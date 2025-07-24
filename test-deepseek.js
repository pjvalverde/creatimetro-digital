// Script para probar la API de DeepSeek
// Ejecutar con: node test-deepseek.js

require('dotenv').config();
const axios = require('axios');

async function testDeepSeekAPI() {
    console.log('🧪 Probando conexión con DeepSeek AI...\n');
    
    // Verificar variables de entorno
    if (!process.env.DEEPSEEK_API_KEY) {
        console.log('❌ ERROR: DEEPSEEK_API_KEY no configurada');
        console.log('💡 Configura tu .env con: DEEPSEEK_API_KEY=sk-xxxxx');
        return;
    }
    
    if (process.env.DEEPSEEK_API_KEY === 'sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx') {
        console.log('❌ ERROR: Usando API key de ejemplo');
        console.log('💡 Reemplaza con tu API key real de DeepSeek');
        return;
    }
    
    console.log('✅ Variables de entorno configuradas');
    console.log(`🔑 API Key: ${process.env.DEEPSEEK_API_KEY.substring(0, 10)}...`);
    console.log(`🌐 API URL: ${process.env.DEEPSEEK_API_URL}\n`);
    
    // Probar evaluación de una idea
    const ideaPrueba = "Robots que pueden leer emociones humanas y responder apropiadamente";
    
    try {
        console.log(`💡 Evaluando idea: "${ideaPrueba}"`);
        
        const prompt = `Evalúa la siguiente idea tecnológica para el año 2075 en cuanto a originalidad (Alta, Media, Baja) y clasifícala en una categoría tecnológica (Transporte, Salud, Robótica, Comunicación, Energía, Educación, Medioambiente, Entretenimiento, Hogar, Otra).

Idea: "${ideaPrueba}"

Responde ÚNICAMENTE en este formato exacto:
Originalidad: [Alta/Media/Baja]
Categoría: [Una de las categorías listadas]`;

        const response = await axios.post(
            process.env.DEEPSEEK_API_URL,
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
                },
                timeout: 10000
            }
        );

        const aiResponse = response.data.choices[0].message.content.trim();
        console.log(`🤖 Respuesta de IA:\n${aiResponse}\n`);
        
        // Parsear respuesta
        const originalidadMatch = aiResponse.match(/Originalidad:\s*(Alta|Media|Baja)/i);
        const categoriaMatch = aiResponse.match(/Categoría:\s*(Transporte|Salud|Robótica|Comunicación|Energía|Educación|Medioambiente|Entretenimiento|Hogar|Otra)/i);
        
        if (originalidadMatch && categoriaMatch) {
            console.log('✅ Evaluación exitosa:');
            console.log(`   🌟 Originalidad: ${originalidadMatch[1]}`);
            console.log(`   🏷️ Categoría: ${categoriaMatch[1]}`);
            console.log('\n🎉 DeepSeek AI configurado correctamente!');
        } else {
            console.log('⚠️ Respuesta no parseada correctamente');
            console.log('💡 Verifica el formato de respuesta de la IA');
        }

    } catch (error) {
        console.log('❌ Error conectando con DeepSeek:');
        if (error.response) {
            console.log(`   Status: ${error.response.status}`);
            console.log(`   Error: ${error.response.data.error?.message || error.response.data}`);
        } else if (error.request) {
            console.log('   No se recibió respuesta del servidor');
        } else {
            console.log(`   Error: ${error.message}`);
        }
        
        console.log('\n💡 Posibles soluciones:');
        console.log('   - Verifica que tu API key sea válida');
        console.log('   - Asegúrate de tener crédito en tu cuenta DeepSeek');
        console.log('   - Verifica tu conexión a internet');
    }
}

// Ejecutar prueba
testDeepSeekAPI();
