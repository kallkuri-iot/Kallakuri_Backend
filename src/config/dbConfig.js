// Database configuration with fallback options
require('dotenv').config();

const MONGODB_CONNECTION_STRING = process.env.MONGODB_URI || 'mongodb+srv://helloandhello1344_db_user:nNTC7OTun7eta36Q@cluster0.bssqdv6.mongodb.net/Kallakuri?retryWrites=true&w=majority&appName=Cluster0';

module.exports = {
  getMongoURI: () => MONGODB_CONNECTION_STRING,
  options: {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    retryWrites: true,
    w: 'majority'
  }
};