const app = require('./app');
const http = require('http');
const socketIO = require('./utils/socket');
const connectDB = require('./config/database');

connectDB();

const server = http.createServer(app);
const PORT = process.env.PORT || 5000;

socketIO.init(server);

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Voting System Backend is active`);
});