const { Pool } = require('pg');
require('dotenv').config();

console.log('🚀 Iniciando configuración de base de datos...');
console.log('📊 Variables de entorno:');
console.log('  - Host:', process.env.PGHOST || 'localhost');
console.log('  - Puerto:', Number(process.env.PGPORT || 5432));
console.log('  - Base de datos:', process.env.PGDATABASE || 'bomberos_forestales');
console.log('  - Usuario:', process.env.PGUSER || 'bdadmingrad');
console.log('  - SSL:', process.env.PGSSL === 'false' ? 'Deshabilitado' : 'Habilitado');
console.log('  - Contraseña:', process.env.PGPASSWORD ? '***configurada***' : '***no configurada***');

// PostgreSQL configuration with SSL REQUIRED
const pool = new Pool({
  host: process.env.PGHOST || 'localhost',
  port: Number(process.env.PGPORT || 5432),
  database: process.env.PGDATABASE || 'bomberos_forestales',
  user: process.env.PGUSER || 'bdadmingrad',
  password: process.env.PGPASSWORD || '',
  ssl: process.env.PGSSL === 'true' ? { rejectUnauthorized: false } : false,
  // Configuraciones adicionales para mejor manejo de conexiones
  max: 20, // máximo número de clientes en el pool
  idleTimeoutMillis: 30000, // tiempo antes de cerrar clientes inactivos
  connectionTimeoutMillis: 10000, // tiempo máximo para establecer conexión
});

pool.on('connect', (client) => {
  console.log('✅ Nueva conexión establecida con PostgreSQL');
  console.log('🔗 ID de proceso del servidor:', client.processID);
});

pool.on('error', (err, client) => {
  console.error('❌ Error inesperado del pool de conexiones:', err.message);
  console.error('📍 Código de error:', err.code);
  process.exit(-1); // Terminar la aplicación en caso de error crítico
});

pool.on('acquire', (client) => {
  console.log('🔄 Cliente adquirido del pool');
});

pool.on('release', (client) => {
  console.log('🔄 Cliente liberado al pool');
});

// Función para probar la conexión inicial
async function testConnection() {
  console.log('\n🔍 Probando conexión a la base de datos...');
  try {
    const client = await pool.connect();
    console.log('✅ Conexión exitosa establecida');
    
    // Probar una consulta simple
    const result = await client.query('SELECT NOW() as current_time, version() as pg_version');
    console.log('⏰ Tiempo del servidor:', result.rows[0].current_time);
    console.log('📦 Versión de PostgreSQL:', result.rows[0].pg_version.split(' ')[0] + ' ' + result.rows[0].pg_version.split(' ')[1]);
    
    client.release();
    console.log('🎉 Prueba de conexión completada exitosamente');
    return true;
  } catch (error) {
    console.error('❌ Error al conectar con la base de datos:');
    console.error('📍 Mensaje:', error.message);
    console.error('📍 Código:', error.code);
    console.error('📍 Detalle:', error.detail || 'No disponible');
    return false;
  }
}

function transformTsqlToPostgres(queryText) {
  console.log('🔄 Transformando consulta T-SQL a PostgreSQL...');
  console.log('   Original:', queryText);
  
  let text = queryText;
  // Replace GETDATE() with NOW()
  text = text.replace(/GETDATE\(\)/gi, 'NOW()');
  // Remove OUTPUT INSERTED.* and add RETURNING * accordingly
  const hasOutput = /OUTPUT\s+INSERTED\.\*/i.test(text);
  if (hasOutput) {
    text = text.replace(/OUTPUT\s+INSERTED\.\*/gi, '');
    const isInsert = /^\s*INSERT\b/i.test(text);
    const isUpdate = /^\s*UPDATE\b/i.test(text);
    if (isInsert || isUpdate) {
      // Append RETURNING * if not already present
      if (!/RETURNING\s+\*/i.test(text)) {
        text = text.trim();
        // Ensure we don't place RETURNING before a trailing semicolon
        if (text.endsWith(';')) text = text.slice(0, -1);
        text = text + ' RETURNING *';
      }
    }
  }
  // Replace @paramN with $N+1 (since routes use @param0..)
  text = text.replace(/@param(\d+)/gi, (_, num) => `$${Number(num) + 1}`);
  
  console.log('   Transformada:', text);
  return text;
}

// Ejecutar test de conexión al cargar el módulo
testConnection().then(success => {
  if (success) {
    console.log('🚀 Módulo de base de datos listo para usar');
  } else {
    console.error('💥 Falló la inicialización de la base de datos');
  }
});

module.exports = {
  // Helper function to execute queries; supports params as array of objects {value}
  async query(queryText, params = []) {
    console.log(`\n📝 Ejecutando consulta: ${queryText.substring(0, 100)}${queryText.length > 100 ? '...' : ''}`);
    console.log(`🔢 Parámetros: ${params.length > 0 ? JSON.stringify(params) : 'ninguno'}`);
    
    try {
      const text = transformTsqlToPostgres(queryText);
      // Normalize params: accept [{value: x}] or raw values
      let values = [];
      if (Array.isArray(params) && params.length > 0) {
        values = params.map(p => (p && Object.prototype.hasOwnProperty.call(p, 'value') ? p.value : p));
      }
      
      console.log('📤 Ejecutando en PostgreSQL...');
      const result = await pool.query(text, values);
      console.log(`✅ Consulta ejecutada exitosamente - ${result.rowCount} filas afectadas`);
      
      // Emulate mssql shape partially
      return { recordset: result.rows, rowsAffected: [result.rowCount] };
    } catch (error) {
      console.error('❌ Error en PostgreSQL:', error.message);
      console.error('📍 Código de error:', error.code);
      throw error;
    }
  },

  // Stored procedures are not used; keep a placeholder
  async executeProcedure() {
    console.log('⚠️ executeProcedure llamado - no soportado en PostgreSQL');
    throw new Error('executeProcedure is not supported in PostgreSQL migration. Use direct queries.');
  },

  // Execute a transaction for an array of SQL text statements
  async executeTransaction(queries = []) {
    console.log(`\n🔄 Iniciando transacción con ${queries.length} consultas...`);
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      console.log('✅ Transacción iniciada');
      
      const results = [];
      for (let i = 0; i < queries.length; i++) {
        const q = queries[i];
        console.log(`📝 Ejecutando consulta ${i + 1}/${queries.length}: ${q.substring(0, 50)}...`);
        const text = transformTsqlToPostgres(q);
        const r = await client.query(text);
        results.push({ recordset: r.rows, rowsAffected: [r.rowCount] });
        console.log(`✅ Consulta ${i + 1} completada - ${r.rowCount} filas afectadas`);
      }
      
      await client.query('COMMIT');
      console.log('🎉 Transacción completada exitosamente');
      return results;
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('❌ Error en transacción, haciendo rollback:', error.message);
      throw error;
    } finally {
      client.release();
      console.log('🔌 Cliente de base de datos liberado');
    }
  },

  // Función adicional para verificar el estado de la conexión
  async checkConnection() {
    return await testConnection();
  },

  // Función para cerrar el pool de conexiones
  async close() {
    console.log('🔒 Cerrando pool de conexiones...');
    await pool.end();
    console.log('✅ Pool de conexiones cerrado');
  }
};