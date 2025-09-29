# Configuración de Swagger para Moodle Enrollment Management API

## Archivos Creados

Se han creado los siguientes archivos para documentar la API:

1. **`swagger.yaml`** - Especificación OpenAPI 3.0.3 completa
2. **`swagger-setup.js`** - Configuración para Swagger UI (opcional)
3. **`SWAGGER_SETUP.md`** - Este archivo con instrucciones

## Opción 1: Uso Directo del Archivo YAML

Puedes usar el archivo `swagger.yaml` directamente con herramientas como:

- **Swagger Editor Online**: https://editor.swagger.io/
- **Postman**: Importar el archivo YAML
- **Insomnia**: Importar especificación OpenAPI
- **VS Code**: Con extensiones como "Swagger Viewer"

## Opción 2: Integrar Swagger UI en la Aplicación

Si deseas integrar la documentación directamente en tu aplicación Express:

### 1. Instalar Dependencias

```bash
npm install swagger-ui-express yamljs
```

### 2. Modificar `src/app.js`

Agrega las siguientes líneas a tu archivo `src/app.js`:

```javascript
// Importar después de las otras importaciones
import { setupSwagger } from '../swagger-setup.js';

// Agregar después de configurar las rutas (antes del export default app)
setupSwagger(app);
```

### 3. Acceder a la Documentación

Una vez implementado, podrás acceder a:

- **Documentación interactiva**: `http://localhost:4000/api-docs`
- **Especificación JSON**: `http://localhost:4000/api-docs.json`
- **Especificación YAML**: `http://localhost:4000/api-docs.yaml`

## Características de la Documentación

### Endpoints Documentados

- ✅ **Programa de Becas** (`/beca/*`)
- ✅ **Customer Success** (`/cs/*`)
- ✅ **Trimble Connect** (`/tc/*`)
- ✅ **EUDE** (`/eude/*`)
- ✅ **Gestión de Base de Datos** (`/db/*`)

### Esquemas Incluidos

- `BecaRequest` - Solicitudes de beca
- `Course` - Información de cursos
- `Group` - Grupos de Moodle
- `CustomerEnrollmentRequest` - Solicitudes de clientes
- `TrimbleConnectRequest` - Solicitudes TC
- `ErrorResponse` - Respuestas de error

### Características Técnicas

- **OpenAPI 3.0.3** compatible
- **Multipart/form-data** para uploads
- **Validaciones** de tipos y formatos
- **Ejemplos** de request/response
- **Códigos de error** HTTP estándar
- **Tags** organizacionales
- **Descripciiones** detalladas

## Personalización

### Modificar Servidores

Edita la sección `servers` en `swagger.yaml`:

```yaml
servers:
  - url: http://localhost:4000
    description: Servidor de desarrollo
  - url: https://tu-dominio.com
    description: Servidor de producción
```

### Agregar Autenticación

Si implementas autenticación, descomenta y configura:

```yaml
components:
  securitySchemes:
    ApiKeyAuth:
      type: apiKey
      in: header
      name: X-API-Key

security:
  - ApiKeyAuth: []
```

### Personalizar UI

Modifica `swagger-setup.js` para cambiar:
- Colores y estilos CSS
- Opciones de expansión
- Configuraciones de interfaz

## Validación

Puedes validar la especificación usando:

```bash
npx swagger-codegen validate -i swagger.yaml
```

O en línea en: https://validator.swagger.io/

## Generación de Código

La especificación puede usarse para generar:
- **Clientes SDK** en múltiples lenguajes
- **Stubs de servidor**
- **Documentación** en otros formatos

Ejemplo:
```bash
npx swagger-codegen generate -i swagger.yaml -l javascript -o ./client-sdk
```

## Mantenimiento

Para mantener la documentación actualizada:

1. **Al agregar nuevos endpoints**: Actualiza `swagger.yaml`
2. **Al cambiar schemas**: Modifica la sección `components/schemas`
3. **Al cambiar URLs**: Actualiza la sección `servers`

## Recursos Útiles

- [OpenAPI 3.0.3 Specification](https://spec.openapis.org/oas/v3.0.3)
- [Swagger UI Configuration](https://swagger.io/docs/open-source-tools/swagger-ui/usage/configuration/)
- [YAML Syntax Guide](https://yaml.org/spec/1.2/spec.html)

---

**Nota**: La documentación está basada en el análisis del código actual. Si hay cambios en los endpoints o schemas, asegúrate de actualizar el archivo `swagger.yaml` correspondiente.