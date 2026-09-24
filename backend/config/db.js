const { Sequelize } = require('sequelize');

/**
 * Sequelize instance for MySQL. Connection details come from environment
 * variables so local/dev/prod can point at different databases without
 * touching code (spec section 28: no secrets hard-coded).
 */
const sequelize = new Sequelize(
  process.env.DB_NAME || 'smart_parking',
  process.env.DB_USER || 'root',
  process.env.DB_PASSWORD || '',
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    dialect: 'mysql',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    define: {
      timestamps: true, // adds createdAt/updatedAt to every model automatically
    },
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  }
);

/**
 * Verifies the connection and syncs models to tables.
 * `alter: true` in development keeps tables in sync with model definitions
 * without dropping data; use real migrations for production instead.
 */
const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log(`MySQL connected: ${process.env.DB_HOST || 'localhost'}/${process.env.DB_NAME || 'smart_parking'}`);

    await sequelize.sync({ alter: process.env.NODE_ENV !== 'production' });
    console.log('Database models synchronized');
  } catch (error) {
    console.error(`Failed to connect to MySQL: ${error.message}`);
    process.exit(1);
  }
};

module.exports = { sequelize, connectDB };
