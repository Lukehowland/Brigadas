const express = require('express');
const router = express.Router();
const db = require('../db');

/**
 * @swagger
 * components:
 *   schemas:
 *     Brigada:
 *       type: object
 *       required:
 *         - nombre
 *       properties:
 *         id:
 *           type: integer
 *           description: ID auto-generado de la brigada
 *         nombre:
 *           type: string
 *           description: Nombre de la brigada
 *         cantidad_bomberos_activos:
 *           type: integer
 *           description: Cantidad de bomberos activos en la brigada
 *         contacto_celular_comandante:
 *           type: string
 *           description: Número de contacto del comandante
 *         encargado_logistica:
 *           type: string
 *           description: Nombre del encargado de logística
 *         contacto_celular_logistica:
 *           type: string
 *           description: Número de contacto del encargado de logística
 *         numero_emergencia_publico:
 *           type: string
 *           description: Número de emergencia público
 *         created_at:
 *           type: string
 *           format: date-time
 *           description: Fecha de creación
 *         updated_at:
 *           type: string
 *           format: date-time
 *           description: Fecha de última actualización
 *       example:
 *         id: 1
 *         nombre: Brigada Forestal Norte
 *         cantidad_bomberos_activos: 12
 *         contacto_celular_comandante: 555-1234
 *         encargado_logistica: Juan Pérez
 *         contacto_celular_logistica: 555-5678
 *         numero_emergencia_publico: 911
 */

/**
 * @swagger
 * tags:
 *   name: Brigadas
 *   description: API para gestión de brigadas
 */

/**
 * @swagger
 * /api/brigadas:
 *   get:
 *     summary: Obtiene todas las brigadas
 *     tags: [Brigadas]
 *     responses:
 *       200:
 *         description: Lista de brigadas
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Brigada'
 *       500:
 *         description: Error del servidor
 */
router.get('/', async (req, res, next) => {
  try {
    const result = await db.query('SELECT * FROM brigadas ORDER BY nombre');
    res.json(result.recordset);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/brigadas/{id}:
 *   get:
 *     summary: Obtiene una brigada por ID
 *     tags: [Brigadas]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID de la brigada
 *     responses:
 *       200:
 *         description: Detalles de la brigada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Brigada'
 *       404:
 *         description: Brigada no encontrada
 *       500:
 *         description: Error del servidor
 */
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await db.query(`SELECT * FROM brigadas WHERE id = ${id}`);

    if (result.recordset.length === 0) {
      return res.status(404).json({ message: 'Brigada no encontrada' });
    }

    res.json(result.recordset[0]);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/brigadas:
 *   post:
 *     summary: Crea una nueva brigada
 *     tags: [Brigadas]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nombre
 *             properties:
 *               nombre:
 *                 type: string
 *               cantidad_bomberos_activos:
 *                 type: integer
 *               contacto_celular_comandante:
 *                 type: string
 *               encargado_logistica:
 *                 type: string
 *               contacto_celular_logistica:
 *                 type: string
 *               numero_emergencia_publico:
 *                 type: string
 *     responses:
 *       201:
 *         description: Brigada creada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Brigada'
 *       400:
 *         description: Datos inválidos
 *       500:
 *         description: Error del servidor
 */
router.post('/', async (req, res, next) => {
  try {
    const {
      nombre,
      cantidad_bomberos_activos,
      contacto_celular_comandante,
      encargado_logistica,
      contacto_celular_logistica,
      numero_emergencia_publico
    } = req.body;

    if (!nombre) {
      return res.status(400).json({ message: 'El nombre de la brigada es requerido' });
    }

    const query = `
      INSERT INTO brigadas (
        nombre, 
        cantidad_bomberos_activos, 
        contacto_celular_comandante, 
        encargado_logistica, 
        contacto_celular_logistica, 
        numero_emergencia_publico
      ) 
      OUTPUT INSERTED.*
      VALUES (
        @param0, 
        @param1, 
        @param2, 
        @param3, 
        @param4, 
        @param5
      )
    `;

    const params = [
      { value: nombre },
      { value: cantidad_bomberos_activos || 0 },
      { value: contacto_celular_comandante || null },
      { value: encargado_logistica || null },
      { value: contacto_celular_logistica || null },
      { value: numero_emergencia_publico || null }
    ];

    const result = await db.query(query, params);
    res.status(201).json(result.recordset[0]);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/brigadas/{id}:
 *   put:
 *     summary: Actualiza una brigada existente
 *     tags: [Brigadas]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID de la brigada
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nombre:
 *                 type: string
 *               cantidad_bomberos_activos:
 *                 type: integer
 *               contacto_celular_comandante:
 *                 type: string
 *               encargado_logistica:
 *                 type: string
 *               contacto_celular_logistica:
 *                 type: string
 *               numero_emergencia_publico:
 *                 type: string
 *     responses:
 *       200:
 *         description: Brigada actualizada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Brigada'
 *       400:
 *         description: Datos inválidos
 *       404:
 *         description: Brigada no encontrada
 *       500:
 *         description: Error del servidor
 */
router.put('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      nombre,
      cantidad_bomberos_activos,
      contacto_celular_comandante,
      encargado_logistica,
      contacto_celular_logistica,
      numero_emergencia_publico
    } = req.body;

    // Verificar si la brigada existe
    const checkResult = await db.query(`SELECT * FROM brigadas WHERE id = ${id}`);
    if (checkResult.recordset.length === 0) {
      return res.status(404).json({ message: 'Brigada no encontrada' });
    }

    // Construir la consulta de actualización
    let updateQuery = 'UPDATE brigadas SET ';
    const updateParams = [];
    let paramIndex = 0;

    if (nombre !== undefined) {
      updateQuery += `nombre = @param${paramIndex}, `;
      updateParams.push({ value: nombre });
      paramIndex++;
    }

    if (cantidad_bomberos_activos !== undefined) {
      updateQuery += `cantidad_bomberos_activos = @param${paramIndex}, `;
      updateParams.push({ value: cantidad_bomberos_activos });
      paramIndex++;
    }

    if (contacto_celular_comandante !== undefined) {
      updateQuery += `contacto_celular_comandante = @param${paramIndex}, `;
      updateParams.push({ value: contacto_celular_comandante });
      paramIndex++;
    }

    if (encargado_logistica !== undefined) {
      updateQuery += `encargado_logistica = @param${paramIndex}, `;
      updateParams.push({ value: encargado_logistica });
      paramIndex++;
    }

    if (contacto_celular_logistica !== undefined) {
      updateQuery += `contacto_celular_logistica = @param${paramIndex}, `;
      updateParams.push({ value: contacto_celular_logistica });
      paramIndex++;
    }

    if (numero_emergencia_publico !== undefined) {
      updateQuery += `numero_emergencia_publico = @param${paramIndex}, `;
      updateParams.push({ value: numero_emergencia_publico });
      paramIndex++;
    }

    // Eliminar la coma final y agregar la condición WHERE
    updateQuery = updateQuery.slice(0, -2);
    updateQuery += ` OUTPUT INSERTED.* WHERE id = ${id}`;

    // Si no hay campos para actualizar, devolver la brigada sin cambios
    if (updateParams.length === 0) {
      return res.json(checkResult.recordset[0]);
    }

    const result = await db.query(updateQuery, updateParams);
    res.json(result.recordset[0]);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/brigadas/{id}:
 *   delete:
 *     summary: Elimina una brigada
 *     tags: [Brigadas]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID de la brigada
 *     responses:
 *       200:
 *         description: Brigada eliminada exitosamente
 *       404:
 *         description: Brigada no encontrada
 *       500:
 *         description: Error del servidor
 */
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    // Verificar si la brigada existe
    const checkResult = await db.query(`SELECT * FROM brigadas WHERE id = ${id}`);
    if (checkResult.recordset.length === 0) {
      return res.status(404).json({ message: 'Brigada no encontrada' });
    }

    await db.query(`DELETE FROM brigadas WHERE id = ${id}`);
    res.json({ message: 'Brigada eliminada exitosamente' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
