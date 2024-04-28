const express = require('express');
const cors = require('cors')
const bodyParser = require('body-parser');
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./swagger-output.json');

const { userRoutes } = require('./src/routes/userRoute');
const db = require('./src/config/mongoConnection');



const app = express();
app.use(express.json());
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.set('view engine', 'ejs');
const port = [3000, 8000];

// Middleware
app.use(cors())
app.use(bodyParser.json());
app.use('/api/auth', userRoutes);

// app.listen(port, () => {
//   console.log(`Server is running at http://localhost:${port}`);
// });

port.forEach(port => {
  const server = app.listen(port, () => {
    if (port === 3000) {
      console.log(`Server is running at http://localhost:${port}`);
    } else if (port === 8000) {
      console.log(`Swagger documentation is available at http://localhost:${port}/api-docs`);
    }
  });
  server.on('error', error => {
    console.error(`Error starting server on port ${port}:`, error);
  });
});
