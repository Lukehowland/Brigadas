# API Sistema Bomberos Forestales

API RESTful para la gestión de brigadas y recursos de bomberos forestales. Esta API permite administrar brigadas, equipamiento, herramientas, y otros recursos necesarios para las operaciones de bomberos forestales.

## Características

- Gestión completa de brigadas forestales
- Catálogo de tallas para equipamiento
- Catálogo de tipos de recursos por categoría
- Gestión de inventario por brigada:
  - Equipamiento de Protección Personal (EPP)
  - Herramientas
  - Logística
  - Alimentación
  - Equipo de Campo
  - Productos de Limpieza
  - Medicamentos
  - Equipamiento para Rescate Animal
- Documentación interactiva con Swagger

## Requisitos

- Node.js (v14 o superior)
- SQL Server (2016 o superior)
- npm o yarn

## Instalación

1. Clonar el repositorio:
   ```
   git clone <url-del-repositorio>
   cd bomberos-forestales-api
   ```

2. Instalar dependencias:
   ```
   npm install
   ```

3. Configurar variables de entorno:
   - Crear un archivo `.env` en la raíz del proyecto basado en el archivo `.env.example`
   - Configurar las credenciales de la base de datos y otras variables de entorno

4. Crear la base de datos:
   - Ejecutar el script `database.sql` en SQL Server Management Studio o mediante otro cliente SQL

5. Iniciar el servidor:
   ```
   npm start
   ```

   Para desarrollo con recarga automática:
   ```
   npm run dev
   ```

## Estructura del Proyecto

```
bomberos-forestales-api/
├── database.sql         # Script de creación de la base de datos
├── .env                 # Variables de entorno (no incluido en el repositorio)
├── .env.example         # Ejemplo de variables de entorno
├── index.js             # Punto de entrada de la aplicación
├── db.js                # Configuración de conexión a la base de datos
├── package.json         # Dependencias y scripts
├── routes/              # Rutas de la API
│   ├── brigadas.js      # Endpoints para gestión de brigadas
│   ├── tallas.js        # Endpoints para gestión de tallas
│   ├── tiposRecursos.js # Endpoints para gestión de tipos de recursos
│   └── inventario.js    # Endpoints para gestión de inventario
└── README.md            # Documentación del proyecto
```

## Documentación de la API

La documentación interactiva de la API está disponible en la ruta `/api-docs` cuando el servidor está en ejecución. Esta documentación permite probar los endpoints directamente desde el navegador.

### Endpoints Principales

#### Brigadas

- `GET /api/brigadas` - Obtener todas las brigadas
- `GET /api/brigadas/:id` - Obtener una brigada por ID
- `POST /api/brigadas` - Crear una nueva brigada
- `PUT /api/brigadas/:id` - Actualizar una brigada existente
- `DELETE /api/brigadas/:id` - Eliminar una brigada

#### Tallas

- `GET /api/tallas` - Obtener todas las tallas
- `GET /api/tallas/:id` - Obtener una talla por ID
- `POST /api/tallas` - Crear una nueva talla
- `PUT /api/tallas/:id` - Actualizar una talla existente
- `DELETE /api/tallas/:id` - Eliminar una talla

#### Tipos de Recursos

- `GET /api/tipos-recursos` - Obtener todos los tipos de recursos
- `GET /api/tipos-recursos/categorias` - Obtener todas las categorías disponibles
- `GET /api/tipos-recursos/:id` - Obtener un tipo de recurso por ID
- `POST /api/tipos-recursos` - Crear un nuevo tipo de recurso
- `PUT /api/tipos-recursos/:id` - Actualizar un tipo de recurso existente
- `DELETE /api/tipos-recursos/:id` - Eliminar un tipo de recurso

#### Inventario

- `GET /api/inventario/brigada/:brigada_id` - Obtener todo el inventario de una brigada
- `POST /api/inventario/epp` - Agregar un item de EPP al inventario
- `POST /api/inventario/herramientas` - Agregar un item de herramientas al inventario
- `POST /api/inventario/logistica` - Agregar un item de logística al inventario
- `POST /api/inventario/alimentacion` - Agregar un item de alimentación al inventario
- `POST /api/inventario/campo` - Agregar un item de campo al inventario
- `POST /api/inventario/limpieza` - Agregar un item de limpieza al inventario
- `POST /api/inventario/medicamentos` - Agregar un item de medicamentos al inventario
- `POST /api/inventario/rescate-animal` - Agregar un item de rescate animal al inventario
- `DELETE /api/inventario/epp/:id` - Eliminar un item de EPP del inventario
- `DELETE /api/inventario/herramientas/:id` - Eliminar un item de herramientas del inventario
- `DELETE /api/inventario/logistica/:id` - Eliminar un item de logística del inventario
- `DELETE /api/inventario/alimentacion/:id` - Eliminar un item de alimentación del inventario
- `DELETE /api/inventario/campo/:id` - Eliminar un item de campo del inventario
- `DELETE /api/inventario/limpieza/:id` - Eliminar un item de limpieza del inventario
- `DELETE /api/inventario/medicamentos/:id` - Eliminar un item de medicamentos del inventario
- `DELETE /api/inventario/rescate-animal/:id` - Eliminar un item de rescate animal del inventario

## Ejemplos de Uso

### Crear una Brigada

```bash
curl -X POST http://localhost:3000/api/brigadas \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Brigada Forestal Central",
    "cantidad_bomberos_activos": 15,
    "contacto_celular_comandante": "555-1111",
    "encargado_logistica": "Ana García",
    "contacto_celular_logistica": "555-2222",
    "numero_emergencia_publico": "911"
  }'
```

### Agregar un Item de EPP al Inventario

```bash
curl -X POST http://localhost:3000/api/inventario/epp \
  -H "Content-Type: application/json" \
  -d '{
    "brigada_id": 1,
    "tipo_recurso_id": 1,
    "talla_id": 3,
    "cantidad": 10,
    "observaciones": "Cascos nuevos adquiridos en enero 2023"
  }'
```

### Obtener el Inventario de una Brigada

```bash
curl -X GET http://localhost:3000/api/inventario/brigada/1
```

## Licencia

Este proyecto está licenciado bajo la Licencia MIT - ver el archivo LICENSE para más detalles.

## Contacto

Para preguntas o soporte, contactar a admin@example.com
