const express = require('express');
const cors = require('cors')
const bodyParser = require('body-parser');

const { userRoutes } = require('./src/routes/userRoute');
const db = require('./src/config/mongoConnection');

const app = express();
const port = 3000;

// Middleware
app.use(cors())
app.use(bodyParser.json());
app.use('/api/auth', userRoutes);

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
