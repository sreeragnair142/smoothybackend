const app = require('./app');
const http = require('http');
const mongoose = require('mongoose');

const PORT = process.env.PORT || 5000;


const server = http.createServer(app);

// Connect to MongoDB first, then start server
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('Database is connected successfully 😎');
    server.listen(PORT, () => {
      console.log(`Server connected at 🖥️ ${PORT}`);
    });
  })
  .catch(err => {
    console.error('Database connection failed 😢', err);
    process.exit(1);
  });