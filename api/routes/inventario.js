const express = require('express');
const router = express.Router();
const db = require('../../../../Downloads/untitled333/db');

/**
 * @swagger
 * components:
 *   schemas:
 *     InventarioItem:
 *       type: object
 *       required:
 *         - brigada_id
 *         - tipo_recurso_id
 *       properties:
 *         id:
 *           type: integer
 *           description: ID auto-generado del item de inventario
 *         brigada_id:
 *           type: integer
 *           description: ID de la brigada a la que pertenece
 *         tipo_recurso_id:
 *           type: integer
 *           description: ID del tipo de recurso
 *         talla_id:
 *           type: integer
 *           description: ID de la talla (solo para items que requieren talla)
 *         cantidad:
 *           type: integer
 *           description: Cantidad disponible
 *         monto_aproximado:
 *           type: number
 *           format: float
 *           description: Monto aproximado (solo para logística)
 *         observaciones:
 *           type: string
 *           description: Observaciones adicionales
 *         created_at:
 *           type: string
 *           format: date-time
 *           description: Fecha de creación
 *         updated_at:
 *           type: string
 *           format: date-time
 *           description: Fecha de última actualización
 */

/**
 * @swagger
 * tags:
 *   name: Inventario
 *   description: API para gestión de inventario
 */

/**
 * @swagger
 * /api/inventario/brigada/{brigada_id}:
 *   get:
 *     summary: Obtiene todo el inventario de una brigada
 *     tags: [Inventario]
 *     parameters:
 *       - in: path
 *         name: brigada_id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID de la brigada
 *     responses:
 *       200:
 *         description: Inventario completo de la brigada
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 epp:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/InventarioItem'
 *                 herramientas:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/InventarioItem'
 *                 logistica:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/InventarioItem'
 *                 alimentacion:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/InventarioItem'
 *                 campo:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/InventarioItem'
 *                 limpieza:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/InventarioItem'
 *                 medicamentos:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/InventarioItem'
 *                 rescate_animal:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/InventarioItem'
 *       404:
 *         description: Brigada no encontrada
 *       500:
 *         description: Error del servidor
 */
router.get('/brigada/:brigada_id', async (req, res, next) => {
  try {
    const { brigada_id } = req.params;

    // Verificar si la brigada existe
    const brigadaCheck = await db.query(`SELECT * FROM brigadas WHERE id = ${brigada_id}`);
    if (brigadaCheck.recordset.length === 0) {
      return res.status(404).json({ message: 'Brigada no encontrada' });
    }

    // Consultar todos los tipos de inventario para la brigada
    const inventarioEPP = await db.query(`
      SELECT i.*, t.codigo as talla_codigo, t.descripcion as talla_descripcion, 
             tr.categoria, tr.nombre as tipo_recurso_nombre, tr.requiere_talla
      FROM inventario_epp i
      LEFT JOIN tallas t ON i.talla_id = t.id
      JOIN tipos_recursos tr ON i.tipo_recurso_id = tr.id
      WHERE i.brigada_id = ${brigada_id}
      ORDER BY tr.nombre, t.codigo
    `);

    const inventarioHerramientas = await db.query(`
      SELECT i.*, tr.categoria, tr.nombre as tipo_recurso_nombre
      FROM inventario_herramientas i
      JOIN tipos_recursos tr ON i.tipo_recurso_id = tr.id
      WHERE i.brigada_id = ${brigada_id}
      ORDER BY tr.nombre
    `);

    const inventarioLogistica = await db.query(`
      SELECT i.*, tr.categoria, tr.nombre as tipo_recurso_nombre
      FROM inventario_logistica i
      JOIN tipos_recursos tr ON i.tipo_recurso_id = tr.id
      WHERE i.brigada_id = ${brigada_id}
      ORDER BY tr.nombre
    `);

    const inventarioAlimentacion = await db.query(`
      SELECT i.*, tr.categoria, tr.nombre as tipo_recurso_nombre
      FROM inventario_alimentacion i
      JOIN tipos_recursos tr ON i.tipo_recurso_id = tr.id
      WHERE i.brigada_id = ${brigada_id}
      ORDER BY tr.nombre
    `);

    const inventarioCampo = await db.query(`
      SELECT i.*, tr.categoria, tr.nombre as tipo_recurso_nombre
      FROM inventario_campo i
      JOIN tipos_recursos tr ON i.tipo_recurso_id = tr.id
      WHERE i.brigada_id = ${brigada_id}
      ORDER BY tr.nombre
    `);

    const inventarioLimpieza = await db.query(`
      SELECT i.*, tr.categoria, tr.nombre as tipo_recurso_nombre
      FROM inventario_limpieza i
      JOIN tipos_recursos tr ON i.tipo_recurso_id = tr.id
      WHERE i.brigada_id = ${brigada_id}
      ORDER BY tr.nombre
    `);

    const inventarioMedicamentos = await db.query(`
      SELECT i.*, tr.categoria, tr.nombre as tipo_recurso_nombre
      FROM inventario_medicamentos i
      JOIN tipos_recursos tr ON i.tipo_recurso_id = tr.id
      WHERE i.brigada_id = ${brigada_id}
      ORDER BY tr.nombre
    `);

    const inventarioRescateAnimal = await db.query(`
      SELECT i.*, tr.categoria, tr.nombre as tipo_recurso_nombre
      FROM inventario_rescate_animal i
      JOIN tipos_recursos tr ON i.tipo_recurso_id = tr.id
      WHERE i.brigada_id = ${brigada_id}
      ORDER BY tr.nombre
    `);

    res.json({
      epp: inventarioEPP.recordset,
      herramientas: inventarioHerramientas.recordset,
      logistica: inventarioLogistica.recordset,
      alimentacion: inventarioAlimentacion.recordset,
      campo: inventarioCampo.recordset,
      limpieza: inventarioLimpieza.recordset,
      medicamentos: inventarioMedicamentos.recordset,
      rescate_animal: inventarioRescateAnimal.recordset
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/inventario/epp:
 *   post:
 *     summary: Agrega un item de EPP al inventario
 *     tags: [Inventario]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - brigada_id
 *               - tipo_recurso_id
 *             properties:
 *               brigada_id:
 *                 type: integer
 *               tipo_recurso_id:
 *                 type: integer
 *               talla_id:
 *                 type: integer
 *               cantidad:
 *                 type: integer
 *               observaciones:
 *                 type: string
 *     responses:
 *       201:
 *         description: Item agregado exitosamente
 *       400:
 *         description: Datos inválidos
 *       500:
 *         description: Error del servidor
 */
router.post('/epp', async (req, res, next) => {
  try {
    const { brigada_id, tipo_recurso_id, talla_id, cantidad, observaciones } = req.body;

    if (!brigada_id || !tipo_recurso_id) {
      return res.status(400).json({ message: 'La brigada y el tipo de recurso son requeridos' });
    }

    // Verificar si la brigada existe
    const brigadaCheck = await db.query(`SELECT * FROM brigadas WHERE id = ${brigada_id}`);
    if (brigadaCheck.recordset.length === 0) {
      return res.status(400).json({ message: 'Brigada no encontrada' });
    }

    // Verificar si el tipo de recurso existe y es de categoría EPP
    const tipoRecursoCheck = await db.query(`SELECT * FROM tipos_recursos WHERE id = ${tipo_recurso_id}`);
    if (tipoRecursoCheck.recordset.length === 0) {
      return res.status(400).json({ message: 'Tipo de recurso no encontrado' });
    }

    if (tipoRecursoCheck.recordset[0].categoria !== 'EPP') {
      return res.status(400).json({ message: 'El tipo de recurso no pertenece a la categoría EPP' });
    }

    // Verificar si requiere talla
    if (tipoRecursoCheck.recordset[0].requiere_talla && !talla_id) {
      return res.status(400).json({ message: 'Este tipo de recurso requiere especificar una talla' });
    }

    // Verificar si la talla existe
    if (talla_id) {
      const tallaCheck = await db.query(`SELECT * FROM tallas WHERE id = ${talla_id}`);
      if (tallaCheck.recordset.length === 0) {
        return res.status(400).json({ message: 'Talla no encontrada' });
      }
    }

    // Verificar si ya existe un registro para esta combinación
    const existingCheck = await db.query(`
      SELECT * FROM inventario_epp 
      WHERE brigada_id = ${brigada_id} 
      AND tipo_recurso_id = ${tipo_recurso_id}
      ${talla_id ? `AND talla_id = ${talla_id}` : 'AND talla_id IS NULL'}
    `);

    if (existingCheck.recordset.length > 0) {
      // Actualizar el registro existente
      const updateQuery = `
        UPDATE inventario_epp 
        SET cantidad = ${cantidad || 0}, 
            observaciones = @param0,
            updated_at = GETDATE()
        OUTPUT INSERTED.*
        WHERE id = ${existingCheck.recordset[0].id}
      `;

      const result = await db.query(updateQuery, [{ value: observaciones || null }]);
      return res.json(result.recordset[0]);
    }

    // Crear un nuevo registro
    const insertQuery = `
      INSERT INTO inventario_epp (
        brigada_id, 
        tipo_recurso_id, 
        talla_id, 
        cantidad, 
        observaciones
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
      { value: brigada_id },
      { value: tipo_recurso_id },
      { value: talla_id || null },
      { value: cantidad || 0 },
      { value: observaciones || null }
    ];

    const result = await db.query(insertQuery, params);
    res.status(201).json(result.recordset[0]);
  } catch (error) {
    next(error);
  }
});

// Función genérica para manejar las operaciones de inventario
const handleInventarioOperation = async (req, res, next, tableName, categoria) => {
  try {
    const { brigada_id, tipo_recurso_id, cantidad, monto_aproximado, observaciones } = req.body;

    if (!brigada_id || !tipo_recurso_id) {
      return res.status(400).json({ message: 'La brigada y el tipo de recurso son requeridos' });
    }

    // Verificar si la brigada existe
    const brigadaCheck = await db.query(`SELECT * FROM brigadas WHERE id = ${brigada_id}`);
    if (brigadaCheck.recordset.length === 0) {
      return res.status(400).json({ message: 'Brigada no encontrada' });
    }

    // Verificar si el tipo de recurso existe y es de la categoría correcta
    const tipoRecursoCheck = await db.query(`SELECT * FROM tipos_recursos WHERE id = ${tipo_recurso_id}`);
    if (tipoRecursoCheck.recordset.length === 0) {
      return res.status(400).json({ message: 'Tipo de recurso no encontrado' });
    }

    if (tipoRecursoCheck.recordset[0].categoria !== categoria) {
      return res.status(400).json({ message: `El tipo de recurso no pertenece a la categoría ${categoria}` });
    }

    // Verificar si ya existe un registro para esta combinación
    const existingCheck = await db.query(`
      SELECT * FROM ${tableName} 
      WHERE brigada_id = ${brigada_id} 
      AND tipo_recurso_id = ${tipo_recurso_id}
    `);

    if (existingCheck.recordset.length > 0) {
      // Actualizar el registro existente
      let updateQuery = `
        UPDATE ${tableName} 
        SET cantidad = ${cantidad || 0}, 
            observaciones = @param0,
            updated_at = GETDATE()
      `;

      const params = [{ value: observaciones || null }];

      // Agregar monto_aproximado si es la tabla de logística
      if (tableName === 'inventario_logistica' && monto_aproximado !== undefined) {
        updateQuery += `, monto_aproximado = @param1`;
        params.push({ value: monto_aproximado || 0 });
      }

      updateQuery += ` OUTPUT INSERTED.* WHERE id = ${existingCheck.recordset[0].id}`;

      const result = await db.query(updateQuery, params);
      return res.json(result.recordset[0]);
    }

    // Crear un nuevo registro
    let insertQuery = `
      INSERT INTO ${tableName} (
        brigada_id, 
        tipo_recurso_id, 
        cantidad
    `;

    let valuesPart = `
      VALUES (
        @param0, 
        @param1, 
        @param2
    `;

    const params = [
      { value: brigada_id },
      { value: tipo_recurso_id },
      { value: cantidad || 0 }
    ];

    let paramIndex = 3;

    // Agregar monto_aproximado si es la tabla de logística
    if (tableName === 'inventario_logistica' && monto_aproximado !== undefined) {
      insertQuery += `, monto_aproximado`;
      valuesPart += `, @param${paramIndex}`;
      params.push({ value: monto_aproximado || 0 });
      paramIndex++;
    }

    // Agregar observaciones
    insertQuery += `, observaciones) OUTPUT INSERTED.*`;
    valuesPart += `, @param${paramIndex})`;
    params.push({ value: observaciones || null });

    const result = await db.query(insertQuery + valuesPart, params);
    res.status(201).json(result.recordset[0]);
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/inventario/herramientas:
 *   post:
 *     summary: Agrega un item de herramientas al inventario
 *     tags: [Inventario]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - brigada_id
 *               - tipo_recurso_id
 *             properties:
 *               brigada_id:
 *                 type: integer
 *               tipo_recurso_id:
 *                 type: integer
 *               cantidad:
 *                 type: integer
 *               observaciones:
 *                 type: string
 *     responses:
 *       201:
 *         description: Item agregado exitosamente
 *       400:
 *         description: Datos inválidos
 *       500:
 *         description: Error del servidor
 */
router.post('/herramientas', (req, res, next) => {
  handleInventarioOperation(req, res, next, 'inventario_herramientas', 'HERRAMIENTAS');
});

/**
 * @swagger
 * /api/inventario/logistica:
 *   post:
 *     summary: Agrega un item de logística al inventario
 *     tags: [Inventario]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - brigada_id
 *               - tipo_recurso_id
 *             properties:
 *               brigada_id:
 *                 type: integer
 *               tipo_recurso_id:
 *                 type: integer
 *               cantidad:
 *                 type: number
 *                 format: float
 *               monto_aproximado:
 *                 type: number
 *                 format: float
 *               observaciones:
 *                 type: string
 *     responses:
 *       201:
 *         description: Item agregado exitosamente
 *       400:
 *         description: Datos inválidos
 *       500:
 *         description: Error del servidor
 */
router.post('/logistica', (req, res, next) => {
  handleInventarioOperation(req, res, next, 'inventario_logistica', 'LOGISTICA');
});

/**
 * @swagger
 * /api/inventario/alimentacion:
 *   post:
 *     summary: Agrega un item de alimentación al inventario
 *     tags: [Inventario]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - brigada_id
 *               - tipo_recurso_id
 *             properties:
 *               brigada_id:
 *                 type: integer
 *               tipo_recurso_id:
 *                 type: integer
 *               cantidad:
 *                 type: integer
 *               observaciones:
 *                 type: string
 *     responses:
 *       201:
 *         description: Item agregado exitosamente
 *       400:
 *         description: Datos inválidos
 *       500:
 *         description: Error del servidor
 */
router.post('/alimentacion', (req, res, next) => {
  handleInventarioOperation(req, res, next, 'inventario_alimentacion', 'ALIMENTACION');
});

/**
 * @swagger
 * /api/inventario/campo:
 *   post:
 *     summary: Agrega un item de campo al inventario
 *     tags: [Inventario]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - brigada_id
 *               - tipo_recurso_id
 *             properties:
 *               brigada_id:
 *                 type: integer
 *               tipo_recurso_id:
 *                 type: integer
 *               cantidad:
 *                 type: integer
 *               observaciones:
 *                 type: string
 *     responses:
 *       201:
 *         description: Item agregado exitosamente
 *       400:
 *         description: Datos inválidos
 *       500:
 *         description: Error del servidor
 */
router.post('/campo', (req, res, next) => {
  handleInventarioOperation(req, res, next, 'inventario_campo', 'CAMPO');
});

/**
 * @swagger
 * /api/inventario/limpieza:
 *   post:
 *     summary: Agrega un item de limpieza al inventario
 *     tags: [Inventario]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - brigada_id
 *               - tipo_recurso_id
 *             properties:
 *               brigada_id:
 *                 type: integer
 *               tipo_recurso_id:
 *                 type: integer
 *               cantidad:
 *                 type: integer
 *               observaciones:
 *                 type: string
 *     responses:
 *       201:
 *         description: Item agregado exitosamente
 *       400:
 *         description: Datos inválidos
 *       500:
 *         description: Error del servidor
 */
router.post('/limpieza', (req, res, next) => {
  handleInventarioOperation(req, res, next, 'inventario_limpieza', 'LIMPIEZA');
});

/**
 * @swagger
 * /api/inventario/medicamentos:
 *   post:
 *     summary: Agrega un item de medicamentos al inventario
 *     tags: [Inventario]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - brigada_id
 *               - tipo_recurso_id
 *             properties:
 *               brigada_id:
 *                 type: integer
 *               tipo_recurso_id:
 *                 type: integer
 *               cantidad:
 *                 type: integer
 *               observaciones:
 *                 type: string
 *     responses:
 *       201:
 *         description: Item agregado exitosamente
 *       400:
 *         description: Datos inválidos
 *       500:
 *         description: Error del servidor
 */
router.post('/medicamentos', (req, res, next) => {
  handleInventarioOperation(req, res, next, 'inventario_medicamentos', 'MEDICAMENTOS');
});

/**
 * @swagger
 * /api/inventario/rescate-animal:
 *   post:
 *     summary: Agrega un item de rescate animal al inventario
 *     tags: [Inventario]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - brigada_id
 *               - tipo_recurso_id
 *             properties:
 *               brigada_id:
 *                 type: integer
 *               tipo_recurso_id:
 *                 type: integer
 *               cantidad:
 *                 type: integer
 *               observaciones:
 *                 type: string
 *     responses:
 *       201:
 *         description: Item agregado exitosamente
 *       400:
 *         description: Datos inválidos
 *       500:
 *         description: Error del servidor
 */
router.post('/rescate-animal', (req, res, next) => {
  handleInventarioOperation(req, res, next, 'inventario_rescate_animal', 'RESCATE_ANIMAL');
});

// Función genérica para eliminar items de inventario
const handleInventarioDelete = async (req, res, next, tableName) => {
  try {
    const { id } = req.params;

    // Verificar si el item existe
    const checkResult = await db.query(`SELECT * FROM ${tableName} WHERE id = ${id}`);
    if (checkResult.recordset.length === 0) {
      return res.status(404).json({ message: 'Item de inventario no encontrado' });
    }

    await db.query(`DELETE FROM ${tableName} WHERE id = ${id}`);
    res.json({ message: 'Item eliminado exitosamente' });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/inventario/epp/{id}:
 *   delete:
 *     summary: Elimina un item de EPP del inventario
 *     tags: [Inventario]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID del item de inventario
 *     responses:
 *       200:
 *         description: Item eliminado exitosamente
 *       404:
 *         description: Item no encontrado
 *       500:
 *         description: Error del servidor
 */
router.delete('/epp/:id', (req, res, next) => {
  handleInventarioDelete(req, res, next, 'inventario_epp');
});

/**
 * @swagger
 * /api/inventario/herramientas/{id}:
 *   delete:
 *     summary: Elimina un item de herramientas del inventario
 *     tags: [Inventario]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID del item de inventario
 *     responses:
 *       200:
 *         description: Item eliminado exitosamente
 *       404:
 *         description: Item no encontrado
 *       500:
 *         description: Error del servidor
 */
router.delete('/herramientas/:id', (req, res, next) => {
  handleInventarioDelete(req, res, next, 'inventario_herramientas');
});

/**
 * @swagger
 * /api/inventario/logistica/{id}:
 *   delete:
 *     summary: Elimina un item de logística del inventario
 *     tags: [Inventario]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID del item de inventario
 *     responses:
 *       200:
 *         description: Item eliminado exitosamente
 *       404:
 *         description: Item no encontrado
 *       500:
 *         description: Error del servidor
 */
router.delete('/logistica/:id', (req, res, next) => {
  handleInventarioDelete(req, res, next, 'inventario_logistica');
});

/**
 * @swagger
 * /api/inventario/alimentacion/{id}:
 *   delete:
 *     summary: Elimina un item de alimentación del inventario
 *     tags: [Inventario]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID del item de inventario
 *     responses:
 *       200:
 *         description: Item eliminado exitosamente
 *       404:
 *         description: Item no encontrado
 *       500:
 *         description: Error del servidor
 */
router.delete('/alimentacion/:id', (req, res, next) => {
  handleInventarioDelete(req, res, next, 'inventario_alimentacion');
});

/**
 * @swagger
 * /api/inventario/campo/{id}:
 *   delete:
 *     summary: Elimina un item de campo del inventario
 *     tags: [Inventario]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID del item de inventario
 *     responses:
 *       200:
 *         description: Item eliminado exitosamente
 *       404:
 *         description: Item no encontrado
 *       500:
 *         description: Error del servidor
 */
router.delete('/campo/:id', (req, res, next) => {
  handleInventarioDelete(req, res, next, 'inventario_campo');
});

/**
 * @swagger
 * /api/inventario/limpieza/{id}:
 *   delete:
 *     summary: Elimina un item de limpieza del inventario
 *     tags: [Inventario]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID del item de inventario
 *     responses:
 *       200:
 *         description: Item eliminado exitosamente
 *       404:
 *         description: Item no encontrado
 *       500:
 *         description: Error del servidor
 */
router.delete('/limpieza/:id', (req, res, next) => {
  handleInventarioDelete(req, res, next, 'inventario_limpieza');
});

/**
 * @swagger
 * /api/inventario/medicamentos/{id}:
 *   delete:
 *     summary: Elimina un item de medicamentos del inventario
 *     tags: [Inventario]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID del item de inventario
 *     responses:
 *       200:
 *         description: Item eliminado exitosamente
 *       404:
 *         description: Item no encontrado
 *       500:
 *         description: Error del servidor
 */
router.delete('/medicamentos/:id', (req, res, next) => {
  handleInventarioDelete(req, res, next, 'inventario_medicamentos');
});

/**
 * @swagger
 * /api/inventario/rescate-animal/{id}:
 *   delete:
 *     summary: Elimina un item de rescate animal del inventario
 *     tags: [Inventario]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID del item de inventario
 *     responses:
 *       200:
 *         description: Item eliminado exitosamente
 *       404:
 *         description: Item no encontrado
 *       500:
 *         description: Error del servidor
 */
router.delete('/rescate-animal/:id', (req, res, next) => {
  handleInventarioDelete(req, res, next, 'inventario_rescate_animal');
});

module.exports = router;
