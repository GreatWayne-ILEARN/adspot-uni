const { resolve } = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: resolve(__dirname, '.env') });

console.log('DATABASE_URL:', process.env.DATABASE_URL ? process.env.DATABASE_URL.replace(/\/\/.*?:/, '//***:').replace(/@/, '***@') : 'NOT SET');
