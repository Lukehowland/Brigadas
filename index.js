const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const swaggerJsDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
require('dotenv').config();

// Database connection
const db = require('./db');

// Initialize Express app
const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Swagger configuration
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API Bomberos Forestales',
      version: '1.0.0',
      description: 'API para gestión de brigadas y recursos de bomberos forestales',
      contact: {
        name: 'Administrador',
        email: 'admin@example.com',
      },
    },
    servers: [
      {
        url: `http://localhost:${port}`,
        description: 'Servidor de desarrollo',
      },
    ],
  },
  apis: ['./routes/*.js'], // Path to the API routes files
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// Routes
app.use('/api/brigadas', require('./routes/brigadas'));
app.use('/api/tallas', require('./routes/tallas'));
app.use('/api/tipos-recursos', require('./routes/tiposRecursos'));
app.use('/api/inventario', require('./routes/inventario'));

// Root route
app.get('/', (req, res) => {
  res.json({
    message: 'API Bomberos Forestales',
    documentation: `http://localhost:${port}/api-docs`,
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: true,
    message: 'Error interno del servidor',
    details: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

// Start server
app.listen(port, () => {
  console.log(`Servidor ejecutándose en http://localhost:${port}`);
  console.log(`Documentación disponible en http://localhost:${port}/api-docs`);
});
