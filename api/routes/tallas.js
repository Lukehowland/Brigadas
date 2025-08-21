const express = require('express');
const router = express.Router();
const db = require('../../../../Downloads/untitled333/db');

/**
 * @swagger
 * components:
 *   schemas:
 *     Talla:
 *       type: object
 *       required:
 *         - codigo
 *         - descripcion
 *       properties:
 *         id:
 *           type: integer
 *           description: ID auto-generado de la talla
 *         codigo:
 *           type: string
 *           description: Código de la talla (XS, S, M, L, XL, XXL, etc.)
 *         descripcion:
 *           type: string
 *           description: Descripción de la talla
 *         numero_equivalente:
 *           type: integer
 *           description: Número equivalente para tallas numéricas (ej. 37, 38, 39 para calzado)
 *       example:
 *         id: 1
 *         codigo: XL
 *         descripcion: Extra Large
 *         numero_equivalente: null
 */

/**
 * @swagger
 * tags:
 *   name: Tallas
 *   description: API para gestión de tallas
 */

/**
 * @swagger
 * /api/tallas:
 *   get:
 *     summary: Obtiene todas las tallas
 *     tags: [Tallas]
 *     responses:
 *       200:
 *         description: Lista de tallas
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Talla'
 *       500:
 *         description: Error del servidor
 */
router.get('/', async (req, res, next) => {
  try {
    const result = await db.query('SELECT * FROM tallas ORDER BY codigo');
    res.json(result.recordset);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/tallas/{id}:
 *   get:
 *     summary: Obtiene una talla por ID
 *     tags: [Tallas]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID de la talla
 *     responses:
 *       200:
 *         description: Detalles de la talla
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Talla'
 *       404:
 *         description: Talla no encontrada
 *       500:
 *         description: Error del servidor
 */
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await db.query(`SELECT * FROM tallas WHERE id = ${id}`);

    if (result.recordset.length === 0) {
      return res.status(404).json({ message: 'Talla no encontrada' });
    }

    res.json(result.recordset[0]);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/tallas:
 *   post:
 *     summary: Crea una nueva talla
 *     tags: [Tallas]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - codigo
 *               - descripcion
 *             properties:
 *               codigo:
 *                 type: string
 *               descripcion:
 *                 type: string
 *               numero_equivalente:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Talla creada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Talla'
 *       400:
 *         description: Datos inválidos
 *       500:
 *         description: Error del servidor
 */
router.post('/', async (req, res, next) => {
  try {
    const { codigo, descripcion, numero_equivalente } = req.body;

    if (!codigo || !descripcion) {
      return res.status(400).json({ message: 'El código y la descripción son requeridos' });
    }

    // Verificar si ya existe una talla con el mismo código
    const checkResult = await db.query(`SELECT * FROM tallas WHERE codigo = '${codigo}'`);
    if (checkResult.recordset.length > 0) {
      return res.status(400).json({ message: 'Ya existe una talla con ese código' });
    }

    const query = `
      INSERT INTO tallas (
        codigo, 
        descripcion, 
        numero_equivalente
      ) 
      OUTPUT INSERTED.*
      VALUES (
        @param0, 
        @param1, 
        @param2
      )
    `;

    const params = [
      { value: codigo },
      { value: descripcion },
      { value: numero_equivalente || null }
    ];

    const result = await db.query(query, params);
    res.status(201).json(result.recordset[0]);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/tallas/{id}:
 *   put:
 *     summary: Actualiza una talla existente
 *     tags: [Tallas]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID de la talla
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               codigo:
 *                 type: string
 *               descripcion:
 *                 type: string
 *               numero_equivalente:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Talla actualizada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Talla'
 *       400:
 *         description: Datos inválidos
 *       404:
 *         description: Talla no encontrada
 *       500:
 *         description: Error del servidor
 */
router.put('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { codigo, descripcion, numero_equivalente } = req.body;

    // Verificar si la talla existe
    const checkResult = await db.query(`SELECT * FROM tallas WHERE id = ${id}`);
    if (checkResult.recordset.length === 0) {
      return res.status(404).json({ message: 'Talla no encontrada' });
    }

    // Si se está actualizando el código, verificar que no exista otro con el mismo código
    if (codigo && codigo !== checkResult.recordset[0].codigo) {
      const codeCheckResult = await db.query(`SELECT * FROM tallas WHERE codigo = '${codigo}' AND id != ${id}`);
      if (codeCheckResult.recordset.length > 0) {
        return res.status(400).json({ message: 'Ya existe otra talla con ese código' });
      }
    }

    // Construir la consulta de actualización
    let updateQuery = 'UPDATE tallas SET ';
    const updateParams = [];
    let paramIndex = 0;

    if (codigo !== undefined) {
      updateQuery += `codigo = @param${paramIndex}, `;
      updateParams.push({ value: codigo });
      paramIndex++;
    }

    if (descripcion !== undefined) {
      updateQuery += `descripcion = @param${paramIndex}, `;
      updateParams.push({ value: descripcion });
      paramIndex++;
    }

    if (numero_equivalente !== undefined) {
      updateQuery += `numero_equivalente = @param${paramIndex}, `;
      updateParams.push({ value: numero_equivalente });
      paramIndex++;
    }

    // Eliminar la coma final y agregar la condición WHERE
    updateQuery = updateQuery.slice(0, -2);
    updateQuery += ` OUTPUT INSERTED.* WHERE id = ${id}`;

    // Si no hay campos para actualizar, devolver la talla sin cambios
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
 * /api/tallas/{id}:
 *   delete:
 *     summary: Elimina una talla
 *     tags: [Tallas]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID de la talla
 *     responses:
 *       200:
 *         description: Talla eliminada exitosamente
 *       404:
 *         description: Talla no encontrada
 *       500:
 *         description: Error del servidor
 */
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    // Verificar si la talla existe
    const checkResult = await db.query(`SELECT * FROM tallas WHERE id = ${id}`);
    if (checkResult.recordset.length === 0) {
      return res.status(404).json({ message: 'Talla no encontrada' });
    }

    // Verificar si la talla está siendo utilizada en algún inventario
    const usageCheck = await db.query(`SELECT COUNT(*) as count FROM inventario_epp WHERE talla_id = ${id}`);
    if (usageCheck.recordset[0].count > 0) {
      return res.status(400).json({
        message: 'No se puede eliminar la talla porque está siendo utilizada en el inventario'
      });
    }

    await db.query(`DELETE FROM tallas WHERE id = ${id}`);
    res.json({ message: 'Talla eliminada exitosamente' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
