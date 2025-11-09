const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: 'jcook',
    host: 'localhost',
    database: 'lexigram',
    password: '',
    port: 5432,
});

module.exports = pool;