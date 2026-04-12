require('dotenv').config();
const axios = require('axios');
axios.get('https://api.deepseek.com/models', {
    headers: { 'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}` }
}).then(res => console.table(res.data.data))
  .catch(err => console.error(err.message));