# Moodle Enrollment Management System

Sistema automatizado para la gestión de matriculaciones en Moodle a través de formularios web. Permite crear flujos personalizados para la creación y matriculación de usuarios en diferentes cursos de la plataforma educativa.

## 📋 Descripción

Esta aplicación Node.js automatiza el proceso de matriculación en Moodle mediante formularios web especializados. El sistema maneja diferentes tipos de programas educativos (becas, programas técnicos, universidades) e integra servicios externos como SharePoint para el almacenamiento de documentos y envío de notificaciones por correo electrónico.

## 🚀 Características

- **Formularios web personalizados** para diferentes programas educativos
- **Integración con Moodle API** para creación y matriculación automática de usuarios
- **Gestión de grupos** y asignación automática según el programa
- **Integración con SharePoint** para almacenamiento de documentos
- **Sistema de notificaciones por email** con plantillas personalizadas
- **Validación de solicitudes** para prevenir duplicados
- **Procesamiento automático** mediante tareas programadas (cron jobs)
- **Base de datos MySQL** para almacenamiento de solicitudes

## 🏗️ Arquitectura del Proyecto

```
enrol_management/
├── src/
│   ├── app.js                # Configuración principal de Express
│   ├── index.js              # Punto de entrada de la aplicación
│   ├── config.js             # Configuración de base de datos y puerto
│   ├── database.js           # Pool de conexiones MySQL
│   ├── job.js                # Tareas programadas
│   ├── config/
│   │   ├── courses.js        # Configuración de cursos y grupos
│   │   ├── moodle.js         # Integración con Moodle API
│   │   ├── sendMail.js       # Servicio de envío de emails
│   │   ├── sharepoint.js     # Integración con SharePoint
│   │   └── email_templates/  # Plantillas de correo electrónico
│   ├── routes/
│   │   ├── index.js          # Enrutador principal
│   │   ├── beca.router.js    # Rutas para programa de becas
│   │   ├── cs.router.js      # Rutas para programa CS
│   │   ├── tc.router.js      # Rutas para Trimble Connect
│   │   ├── eude.router.js    # Rutas para programa EUDE
│   │   └── db.router.js      # Rutas para gestión de BD
│   ├── services/
│   │   ├── beca.service.js   # Lógica de negocio para becas
│   │   ├── cs.service.js     # Lógica de negocio para CS
│   │   ├── tc.service.js     # Lógica de negocio para TC
│   │   ├── eude.service.js   # Lógica de negocio para EUDE
│   │   └── db.service.js     # Servicios de base de datos
│   ├── views/               # Plantillas EJS
│   └── public/             # Archivos estáticos (CSS, JS)
├── package.json
└── README.md
```

## 📦 Instalación

### Prerrequisitos
- Node.js 14.16.1 o superior
- MySQL
- Acceso a Moodle API
- Configuración de SharePoint (opcional)
- Servidor SMTP para envío de correos

### Pasos de instalación

1. **Clonar el repositorio**
```bash
git clone <repository-url>
cd enrol_management
```

2. **Instalar dependencias**
```bash
npm install
```

3. **Configurar variables de entorno**
Crear un archivo `.env` en la raíz del proyecto:
```env
# Base de datos
DB_HOST=db_server
DB_NAME=db_name
DB_USER=db_user
DB_PASS=db_password

# Correo electrónico SMPT
MAIL_ACCOUNT=correo
MAIL_PASS=password

# Moodle
MDL_DOMAIN=dominio_moodle
MDL_TOKEN=token_moodle

# Sharepoint

SP_CLIENT_ID=Sharepoint_id
SP_CLIENT_SECRET=client_sk
SP_TENANT_ID=Tenant_id
SP_TENANT_NAME=Tenant_name
SP_REFRESHTOKEN=Refresh_tk

# Puerto de la aplicación
PORT=4000


4. **Configurar base de datos**
- Crear la base de datos MySQL
- Ejecutar los scripts de creación de tablas necesarias

5. **Iniciar la aplicación**
```bash
# Modo desarrollo
npm run dev

# Modo producción
npm start
```

## 🔧 Configuración

### Cursos y Grupos
El archivo `src/config/courses.js` contiene la configuración de cursos disponibles y sus respectivos grupos. Cada curso incluye:
- ID del curso en Moodle
- Nombre del curso
- Enlace al curso
- Grupos disponibles con sus IDs y nombres

### Plantillas de Email
Las plantillas de correo se encuentran en `src/config/email_templates/` y están organizadas por tipo de programa. Utilizan el motor de plantillas EJS.

## 🌐 Endpoints Principales

### Programa de Becas
- `GET /beca/form` - Formulario de solicitud de beca
- `POST /beca` - Procesamiento de solicitud de beca

### Programa CS (Customer Success)
- `GET /cs/form` - Formulario para clientes
- `POST /cs` - Procesamiento de solicitud de cliente

### Programa Trimble Connect
- `GET /tc/form` - Formulario para Trimble Connect
- `POST /tc` - Procesamiento de solicitud TC

### Programa EUDE
- `GET /eude/form` - Formulario para programa EUDE
- `POST /eude` - Procesamiento de solicitud EUDE

### Gestión de Base de Datos
- `GET /db/courses` - Visualización de cursos disponibles
- Otros endpoints para administración

## 🔄 Proceso de Matriculación

1. **Usuario completa formulario** web específico del programa
2. **Validación de datos** y verificación de duplicados
3. **Subida de documentos** a SharePoint (si aplica)
4. **Creación de usuario** en Moodle (si no existe)
5. **Matriculación en curso** y asignación a grupo correspondiente
6. **Envío de notificaciones** por correo electrónico
7. **Almacenamiento en BD** para seguimiento

## ⏰ Tareas Programadas

El sistema ejecuta tareas automáticas cada minuto mediante cron jobs:
- Procesamiento de solicitudes pendientes
- Matriculaciones automáticas
- Limpieza de registros temporales

## 🛠️ Tecnologías Utilizadas

- **Backend**: Node.js con Express.js
- **Base de datos**: MySQL
- **Motor de plantillas**: EJS
- **Integración APIs**: Axios
- **Subida de archivos**: Formidable
- **Tareas programadas**: node-cron
- **Envío de emails**: Nodemailer
- **Gestión de formularios**: Form-data

## 📧 Sistema de Notificaciones

El sistema envía diferentes tipos de correos electrónicos:
- Confirmación de recepción de solicitud
- Notificación de matriculación exitosa
- Notificación de rechazo (para becas)
- Correos internos para administradores

## 🔐 Seguridad

- Validación de datos de entrada
- Prevención de solicitudes duplicadas
- Gestión segura de archivos subidos
- Variables de entorno para credenciales

## 🚀 Despliegue

Para despliegue en producción:
1. Configurar variables de entorno apropiadas
2. Asegurar conectividad con Moodle y SharePoint
3. Configurar servidor web (nginx/Apache) como proxy reverso
4. Configurar SSL/TLS
5. Implementar monitoreo y logs

## 📝 Contribución

1. Fork el proyecto
2. Crear rama para nueva funcionalidad (`git checkout -b feature/nueva-funcionalidad`)
3. Commit cambios (`git commit -am 'Agrega nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Crear Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia ISC.

## 🤝 Soporte

Para soporte técnico o consultas, contactar al equipo de desarrollo.

---

**Versión**: 1.0.0  
**Node.js**: 14.16.1  
**Autor**: Equipo de Desarrollo