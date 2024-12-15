require('dotenv').config(); // Tambahkan ini untuk menggunakan .env file
console.log('CLOUDANT_URL:', process.env.CLOUDANT_URL);
console.log('CLOUDANT_API_KEY:', process.env.CLOUDANT_API_KEY);


const express = require('express');
const path = require('path');
const Cloudant = require('@cloudant/cloudant');

// Middleware
const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Cloudant connection
const cloudant = Cloudant({ 
    url: process.env.CLOUDANT_URL, 
    plugins: { iamauth: { iamApiKey: process.env.CLOUDANT_APIKEY } }
});

// Database Initialization
const dbName = 'ibm-todo-list-app'; // Pastikan sesuai nama database di Cloudant
let db;
cloudant.db.get(dbName)
  .then(() => {
    console.log(`Database '${dbName}' already exists.`);
    db = cloudant.db.use(dbName);
  })
  .catch(() => {
    console.log(`Database '${dbName}' does not exist. Creating...`);
    cloudant.db.create(dbName).then(() => {
      db = cloudant.db.use(dbName);
      console.log(`Database '${dbName}' created.`);
    }).catch(err => {
      console.error('Error creating database:', err);
    });
  });

// Routes
app.post('/add', async (req, res) => {
  const { item } = req.body;
  try {
    if (item) {
      await db.insert({ item });
    }
    res.redirect('/');
  } catch (err) {
    console.error('Error adding item:', err);
    res.status(500).send('Failed to add item');
  }
});

app.get('/list', async (req, res) => {
  try {
    const result = await db.list({ include_docs: true });
    const todos = result.rows.map(row => row.doc.item);
    res.json(todos);
  } catch (err) {
    console.error('Error fetching tasks:', err);
    res.status(500).send('Failed to fetch tasks');
  }
});


// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port http://localhost:${PORT}`);
});
