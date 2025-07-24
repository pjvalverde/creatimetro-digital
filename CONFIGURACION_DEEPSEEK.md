# 🔑 Configuración de DeepSeek AI en Railway

## Paso 1: Obtener API Key de DeepSeek

1. Ve a: https://platform.deepseek.com/
2. Regístrate o inicia sesión
3. Ve a **API Keys** en el dashboard
4. Crea una nueva API key
5. Copia la key (formato: `sk-xxxxxxxxxxxxxxxxxxxxx`)

## Paso 2: Configurar en Railway

### Acceder a Variables de Entorno:
1. Ve a tu proyecto: https://railway.com/project/4b2fd8ea-7da0-4a06-b970-26f13d075575
2. Selecciona el servicio `creatimetro-digital`
3. Ve a la pestaña **"Variables"**

### Agregar Variables:
```
DEEPSEEK_API_KEY=tu_api_key_real_aquí
DEEPSEEK_API_URL=https://api.deepseek.com/v1/chat/completions
NODE_ENV=production
```

## Paso 3: Verificar Configuración

Después del deploy, verifica que:
- ✅ La aplicación inicie sin errores
- ✅ Las respuestas se evalúen automáticamente con IA
- ✅ En el panel admin aparezca "🤖 Evaluado con IA"

## Paso 4: URLs de tu aplicación

- **Estudiantes:** https://tu-app.railway.app
- **Administrador:** https://tu-app.railway.app/admin

## Troubleshooting

### Si no funciona la IA:
1. Verifica que `DEEPSEEK_API_KEY` esté configurada correctamente
2. Revisa los logs en Railway console
3. Las respuestas funcionarán con evaluación básica como fallback

### Logs útiles:
- ✅ `🤖 Evaluando ideas con DeepSeek AI...` - IA funcionando
- ⚠️ `📊 Usando evaluación manual (fallback)...` - Sin IA

## Precio DeepSeek

- Muy económico: ~$0.14 por 1M tokens
- Una evaluación típica usa ~50-100 tokens
- 10,000 evaluaciones ≈ $0.07-0.14
