import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Cargar el archivo YAML de Swagger
const swaggerDocument = YAML.load(join(__dirname, 'swagger.yaml'));

// Configuración personalizada para Swagger UI
const swaggerOptions = {
  explorer: true,
  swaggerOptions: {
    docExpansion: 'none', // Colapsar todas las secciones por defecto
    filter: true, // Habilitar filtro de búsqueda
    showRequestHeaders: true,
    showCommonExtensions: true,
    tryItOutEnabled: true
  }
};

// CSS personalizado para mejorar la apariencia
const customCss = `
  .swagger-ui .topbar { 
    background-color: #2c3e50; 
  }
  .swagger-ui .topbar .download-url-wrapper .select-label {
    color: white;
  }
  .swagger-ui .info .title {
    color: #2c3e50;
  }
  .swagger-ui .scheme-container {
    background: #f8f9fa;
    border-radius: 5px;
    padding: 10px;
    margin: 10px 0;
  }
`;

export const setupSwagger = (app) => {
  // Endpoint para servir la documentación de Swagger
  app.use('/api-docs', swaggerUi.serve);
  app.get('/api-docs', swaggerUi.setup(swaggerDocument, {
    ...swaggerOptions,
    customCss,
    customSiteTitle: 'Moodle Enrollment Management API',
    customfavIcon: '/favicon.ico'
  }));
  
  // Endpoint alternativo para obtener el JSON de la especificación
  app.get('/api-docs.json', (req, res) => {
    res.json(swaggerDocument);
  });
  
  // Endpoint para obtener la especificación en YAML
  app.get('/api-docs.yaml', (req, res) => {
    res.type('text/yaml');
    res.send(YAML.stringify(swaggerDocument, 4));
  });
  
  console.log('📚 Swagger documentation available at: /api-docs');
  console.log('📄 API specification JSON at: /api-docs.json');
  console.log('📄 API specification YAML at: /api-docs.yaml');
};

export default { setupSwagger };