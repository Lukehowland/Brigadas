const sql = require('mssql');
require('dotenv').config();

// Configuration for SQL Server connection - SQL Server Authentication
const config = {
  user: 'luke', // Usuario por defecto de SQL Server
  password: 'root123', // Pon aquí la contraseña del usuario sa
  server: 'LUKE\\SQLEXPRESS',
  database: 'BomberosForestales',
  options: {
    encrypt: false,
    trustServerCertificate: true,
    enableArithAbort: true
  }
};

// Create a connection pool
const poolPromise = new sql.ConnectionPool(config)
    .connect()
    .then(pool => {
      console.log('Connected to SQL Server with Windows Authentication');
      return pool;
    })
    .catch(err => {
      console.error('Database connection failed:', err);
      throw err;
    });

// Export the pool and sql for use in other modules
module.exports = {
  sql,
  poolPromise,

  // Helper function to execute queries
  async query(queryText, params = []) {
    try {
      const pool = await poolPromise;
      const request = pool.request();

      // Add parameters to the request if provided
      if (params && params.length > 0) {
        params.forEach((param, index) => {
          request.input(`param${index}`, param.value);
        });
      }

      const result = await request.query(queryText);
      return result;
    } catch (error) {
      console.error('SQL error:', error);
      throw error;
    }
  },

  // Helper function to execute stored procedures
  async executeProcedure(procedureName, params = {}) {
    try {
      const pool = await poolPromise;
      const request = pool.request();

      // Add parameters to the request if provided
      if (params && Object.keys(params).length > 0) {
        Object.keys(params).forEach(key => {
          request.input(key, params[key]);
        });
      }

      const result = await request.execute(procedureName);
      return result;
    } catch (error) {
      console.error('SQL error:', error);
      throw error;
    }
  },

  // Helper function to execute a transaction
  async executeTransaction(queries = []) {
    let transaction;
    try {
      const pool = await poolPromise;
      transaction = new sql.Transaction(pool);

      await transaction.begin();
      const request = new sql.Request(transaction);

      const results = [];
      for (const query of queries) {
        const result = await request.query(query);
        results.push(result);
      }

      await transaction.commit();
      return results;
    } catch (error) {
      console.error('Transaction error:', error);
      if (transaction) await transaction.rollback();
      throw error;
    }
  }
};
