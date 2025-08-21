const express = require('express');
const router = express.Router();
const db = require('../../../../Downloads/untitled333/db');

/**
 * @swagger
 * components:
 *   schemas:
 *     TipoRecurso:
 *       type: object
 *       required:
 *         - categoria
 *         - nombre
 *       properties:
 *         id:
 *           type: integer
 *           description: ID auto-generado del tipo de recurso
 *         categoria:
 *           type: string
 *           description: Categoría del recurso (EPP, HERRAMIENTAS, LOGISTICA, etc.)
 *         nombre:
 *           type: string
 *           description: Nombre del tipo de recurso
 *         requiere_talla:
 *           type: boolean
 *           description: Indica si el recurso requiere especificar talla
 *         requiere_cantidad:
 *           type: boolean
 *           description: Indica si el recurso requiere especificar cantidad
 *         activo:
 *           type: boolean
 *           description: Indica si el tipo de recurso está activo
 *       example:
 *         id: 1
 *         categoria: EPP
 *         nombre: Casco Forestal
 *         requiere_talla: false
 *         requiere_cantidad: true
 *         activo: true
 */

/**
 * @swagger
 * tags:
 *   name: TiposRecursos
 *   description: API para gestión de tipos de recursos
 */

/**
 * @swagger
 * /api/tipos-recursos:
 *   get:
 *     summary: Obtiene todos los tipos de recursos
 *     tags: [TiposRecursos]
 *     parameters:
 *       - in: query
 *         name: categoria
 *         schema:
 *           type: string
 *         description: Filtrar por categoría
 *       - in: query
 *         name: activo
 *         schema:
 *           type: boolean
 *         description: Filtrar por estado activo/inactivo
 *     responses:
 *       200:
 *         description: Lista de tipos de recursos
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/TipoRecurso'
 *       500:
 *         description: Error del servidor
 */
router.get('/', async (req, res, next) => {
  try {
    const { categoria, activo } = req.query;
    let query = 'SELECT * FROM tipos_recursos';
    const conditions = [];

    if (categoria) {
      conditions.push(`categoria = '${categoria}'`);
    }

    if (activo !== undefined) {
      conditions.push(`activo = ${activo === 'true' ? 'TRUE' : 'FALSE'}`);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY categoria, nombre';

    const result = await db.query(query);
    res.json(result.recordset);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/tipos-recursos/categorias:
 *   get:
 *     summary: Obtiene todas las categorías disponibles
 *     tags: [TiposRecursos]
 *     responses:
 *       200:
 *         description: Lista de categorías
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: string
 *       500:
 *         description: Error del servidor
 */
router.get('/categorias', async (req, res, next) => {
  try {
    const result = await db.query('SELECT DISTINCT categoria FROM tipos_recursos ORDER BY categoria');
    const categorias = result.recordset.map(item => item.categoria);
    res.json(categorias);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/tipos-recursos/{id}:
 *   get:
 *     summary: Obtiene un tipo de recurso por ID
 *     tags: [TiposRecursos]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID del tipo de recurso
 *     responses:
 *       200:
 *         description: Detalles del tipo de recurso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TipoRecurso'
 *       404:
 *         description: Tipo de recurso no encontrado
 *       500:
 *         description: Error del servidor
 */
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await db.query(`SELECT * FROM tipos_recursos WHERE id = ${id}`);

    if (result.recordset.length === 0) {
      return res.status(404).json({ message: 'Tipo de recurso no encontrado' });
    }

    res.json(result.recordset[0]);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/tipos-recursos:
 *   post:
 *     summary: Crea un nuevo tipo de recurso
 *     tags: [TiposRecursos]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - categoria
 *               - nombre
 *             properties:
 *               categoria:
 *                 type: string
 *               nombre:
 *                 type: string
 *               requiere_talla:
 *                 type: boolean
 *               requiere_cantidad:
 *                 type: boolean
 *               activo:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Tipo de recurso creado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TipoRecurso'
 *       400:
 *         description: Datos inválidos
 *       500:
 *         description: Error del servidor
 */
router.post('/', async (req, res, next) => {
  try {
    const {
      categoria,
      nombre,
      requiere_talla,
      requiere_cantidad,
      activo
    } = req.body;

    if (!categoria || !nombre) {
      return res.status(400).json({ message: 'La categoría y el nombre son requeridos' });
    }

    // Verificar si ya existe un tipo de recurso con el mismo nombre en la misma categoría
    const checkResult = await db.query(`SELECT * FROM tipos_recursos WHERE categoria = '${categoria}' AND nombre = '${nombre}'`);
    if (checkResult.recordset.length > 0) {
      return res.status(400).json({ message: 'Ya existe un tipo de recurso con ese nombre en la misma categoría' });
    }

    const query = `
      INSERT INTO tipos_recursos (
        categoria, 
        nombre, 
        requiere_talla, 
        requiere_cantidad, 
        activo
      ) 
      OUTPUT INSERTED.*
      VALUES (
        @param0, 
        @param1, 
        @param2, 
        @param3, 
        @param4
      )
    `;

    const params = [
      { value: categoria },
      { value: nombre },
      { value: ['true', true, 1, '1'].includes(requiere_talla) },
      { value: !(['false', false, 0, '0'].includes(requiere_cantidad)) },
      { value: !(['false', false, 0, '0'].includes(activo)) }
    ];

    const result = await db.query(query, params);
    res.status(201).json(result.recordset[0]);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/tipos-recursos/{id}:
 *   put:
 *     summary: Actualiza un tipo de recurso existente
 *     tags: [TiposRecursos]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID del tipo de recurso
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               categoria:
 *                 type: string
 *               nombre:
 *                 type: string
 *               requiere_talla:
 *                 type: boolean
 *               requiere_cantidad:
 *                 type: boolean
 *               activo:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Tipo de recurso actualizado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TipoRecurso'
 *       400:
 *         description: Datos inválidos
 *       404:
 *         description: Tipo de recurso no encontrado
 *       500:
 *         description: Error del servidor
 */
router.put('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      categoria,
      nombre,
      requiere_talla,
      requiere_cantidad,
      activo
    } = req.body;

    // Verificar si el tipo de recurso existe
    const checkResult = await db.query(`SELECT * FROM tipos_recursos WHERE id = ${id}`);
    if (checkResult.recordset.length === 0) {
      return res.status(404).json({ message: 'Tipo de recurso no encontrado' });
    }

    // Si se está actualizando la categoría o el nombre, verificar que no exista otro con la misma combinación
    if ((categoria && nombre) &&
        (categoria !== checkResult.recordset[0].categoria || nombre !== checkResult.recordset[0].nombre)) {
      const duplicateCheck = await db.query(
        `SELECT * FROM tipos_recursos WHERE categoria = '${categoria}' AND nombre = '${nombre}' AND id != ${id}`
      );
      if (duplicateCheck.recordset.length > 0) {
        return res.status(400).json({ message: 'Ya existe un tipo de recurso con ese nombre en la misma categoría' });
      }
    }

    // Construir la consulta de actualización
    let updateQuery = 'UPDATE tipos_recursos SET ';
    const updateParams = [];
    let paramIndex = 0;

    if (categoria !== undefined) {
      updateQuery += `categoria = @param${paramIndex}, `;
      updateParams.push({ value: categoria });
      paramIndex++;
    }

    if (nombre !== undefined) {
      updateQuery += `nombre = @param${paramIndex}, `;
      updateParams.push({ value: nombre });
      paramIndex++;
    }

    if (requiere_talla !== undefined) {
      updateQuery += `requiere_talla = @param${paramIndex}, `;
      updateParams.push({ value: ['true', true, 1, '1'].includes(requiere_talla) });
      paramIndex++;
    }

    if (requiere_cantidad !== undefined) {
      updateQuery += `requiere_cantidad = @param${paramIndex}, `;
      updateParams.push({ value: !(['false', false, 0, '0'].includes(requiere_cantidad)) });
      paramIndex++;
    }

    if (activo !== undefined) {
      updateQuery += `activo = @param${paramIndex}, `;
      updateParams.push({ value: !(['false', false, 0, '0'].includes(activo)) });
      paramIndex++;
    }

    // Eliminar la coma final y agregar la condición WHERE
    updateQuery = updateQuery.slice(0, -2);
    updateQuery += ` OUTPUT INSERTED.* WHERE id = ${id}`;

    // Si no hay campos para actualizar, devolver el tipo de recurso sin cambios
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
 * /api/tipos-recursos/{id}:
 *   delete:
 *     summary: Elimina un tipo de recurso
 *     tags: [TiposRecursos]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID del tipo de recurso
 *     responses:
 *       200:
 *         description: Tipo de recurso eliminado exitosamente
 *       400:
 *         description: No se puede eliminar porque está en uso
 *       404:
 *         description: Tipo de recurso no encontrado
 *       500:
 *         description: Error del servidor
 */
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    // Verificar si el tipo de recurso existe
    const checkResult = await db.query(`SELECT * FROM tipos_recursos WHERE id = ${id}`);
    if (checkResult.recordset.length === 0) {
      return res.status(404).json({ message: 'Tipo de recurso no encontrado' });
    }

    // Verificar si el tipo de recurso está siendo utilizado en algún inventario
    const tablas = [
      'inventario_epp',
      'inventario_herramientas',
      'inventario_logistica',
      'inventario_alimentacion',
      'inventario_campo',
      'inventario_limpieza',
      'inventario_medicamentos',
      'inventario_rescate_animal'
    ];

    for (const tabla of tablas) {
      const usageCheck = await db.query(`SELECT COUNT(*) as count FROM ${tabla} WHERE tipo_recurso_id = ${id}`);
      if (usageCheck.recordset[0].count > 0) {
        return res.status(400).json({
          message: `No se puede eliminar el tipo de recurso porque está siendo utilizado en ${tabla}`
        });
      }
    }

    await db.query(`DELETE FROM tipos_recursos WHERE id = ${id}`);
    res.json({ message: 'Tipo de recurso eliminado exitosamente' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
