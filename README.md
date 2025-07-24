# Creatímetro Digital

Sistema de evaluación de creatividad para estudiantes con IA integrada.

## 🚀 Características

- ⏱️ Timer de 5 minutos para evaluación de creatividad
- 🤖 Evaluación automática con DeepSeek AI
- 📊 Métricas detalladas: Fluidez, Flexibilidad, Originalidad
- 📱 Diseño responsive para móviles
- 👨‍💼 Panel de administrador completo
- 📁 Exportación a CSV y JSON

## 🛠️ Instalación Local

```bash
git clone https://github.com/pjvalverde/creatimetro-digital.git
cd creatimetro-digital
npm install
```

## ⚙️ Configuración

1. Copia `.env.example` a `.env`
2. Configura tu API key de DeepSeek:
```bash
DEEPSEEK_API_KEY=tu_api_key_aqui
```

## 🏃‍♂️ Ejecución

### Desarrollo
```bash
npm run dev
```

### Producción
```bash
npm start
```

## 🌐 URLs

- **Estudiantes:** http://localhost:3000
- **Administrador:** http://localhost:3000/admin

## 📊 Métricas Evaluadas

### Automáticas con IA
- **Originalidad:** Alta (3), Media (2), Baja (1)
- **Categorización:** 10 categorías tecnológicas
- **Flexibilidad:** Diversidad de categorías

### Básicas
- **Fluidez:** Número de ideas generadas
- **Tiempo:** Duración de la evaluación
- **Engagement:** Diversión y desafío reportados

## 🚀 Despliegue en Railway

1. Conecta tu repositorio GitHub a Railway
2. Configura las variables de entorno:
   - `DEEPSEEK_API_KEY`
   - `NODE_ENV=production`
3. Railway desplegará automáticamente

## 📡 API Endpoints

- `POST /api/submit` - Enviar respuestas
- `GET /api/responses` - Obtener todas las respuestas
- `GET /api/stats` - Estadísticas generales
- `DELETE /api/responses/:id` - Eliminar respuesta
- `PUT /api/responses/:id/grade` - Calificación manual
- `POST /api/responses/:id/reevaluate` - Re-evaluar con IA
