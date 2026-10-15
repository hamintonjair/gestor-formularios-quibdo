# Gestor de Formularios y Registros Institucionales

Plataforma web moderna y segura integrada con **Google Workspace (Google Forms y Google Drive)** para la gestión, creación dinámica y control de respuestas de formularios de registro ciudadano.

---

## Características Principales

- **Autenticación con Google Workspace**: Inicio de sesión seguro con cuentas de Google para interactuar directamente con las APIs de Google Drive y Google Forms.
- **Gestor de Formularios en Vivo**: Listado de formularios desde Google Drive, selección de formulario activo y búsqueda rápida por ID o enlace.
- **Creador de Formularios Dinámicos**: Creación y personalización de nuevos formularios de registro en Google Forms con campos personalizados (Texto, Párrafo, Fecha, Selección Única, Casillas, Menú Desplegable).
- **Adición de Preguntas**: Posibilidad de añadir nuevas preguntas a formularios existentes en Google Forms al instante.
- **Exportación a Excel Estructurado (.xls)**: Exportación de registros a una hoja de cálculo profesional con cabeceras en **negrita**, fondo en **morado institucional de Google Forms (`#673ab7`)**, bordes limpios y celdas formateadas correctamente para evitar superposiciones.
- **Estadísticas y Analíticas**: Tarjetas resumen con métricas de participación, registros por período y filtros avanzados.
- **Gestión de Registros**: Tabla interactiva de ciudadanos registrados, copia masiva de correos electrónicos y visualización detallada de fichas de inscripción.

---

## Tecnologías Utilizadas

- **React 19** + **TypeScript**
- **Vite** (Bundler de alto rendimiento)
- **Tailwind CSS v4** (Sistema de estilos moderno)
- **Lucide React** (Iconografía)
- **Google APIs (Drive & Forms REST APIs)**
- **Firebase Authentication**

---

## Despliegue en Render (Static Site)

Esta aplicación está optimizada para ser desplegada en **Render** como un sitio estático (*Static Site*):

1. **Build Command**: 
   \`\`\`bash
   npm install && npm run build
   \`\`\`
2. **Publish Directory**: 
   \`\`\`bash
   dist
   \`\`\`
3. **Redirects / Rewrites** (para soportar rutas de SPA de React):
   - **Source**: \`/*\`
   - **Destination**: \`/index.html\`
   - **Action**: \`Rewrite\`

---

## Licencia

Proyecto desarrollado para la gestión institucional. Todos los derechos reservados.
