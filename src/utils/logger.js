const fs = require('fs');
const path = require('path');
const config = require('../config/config');

// Ensure logs directory exists
const logsDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

const getCurrentLevel = () => {
  const env = config.nodeEnv || 'development';
  const isDevelopment = env === 'development';
  return isDevelopment ? 'debug' : 'warn';
};

const colors = {
  error: '\x1b[31m', // red
  warn: '\x1b[33m',  // yellow
  info: '\x1b[32m',  // green
  http: '\x1b[35m',  // magenta
  debug: '\x1b[37m', // white
  reset: '\x1b[0m'   // reset
};

const getTimestamp = () => {
  const now = new Date();
  return now.toISOString().replace('T', ' ').replace('Z', '');
};

const formatMessage = (level, message) => {
  const timestamp = getTimestamp();
  const color = colors[level] || colors.reset;
  const reset = colors.reset;
  return `${timestamp} ${color}${level.toUpperCase()}${reset}: ${message}`;
};

const writeToFile = (level, message) => {
  try {
    const timestamp = getTimestamp();
    const logMessage = `${timestamp} ${level.toUpperCase()}: ${message}\n`;
    
    // Write to all.log
    fs.appendFileSync(path.join(logsDir, 'all.log'), logMessage);
    
    // Write to error.log for error level
    if (level === 'error') {
      fs.appendFileSync(path.join(logsDir, 'error.log'), logMessage);
    }
  } catch (err) {
    console.error('Failed to write to log file:', err.message);
  }
};

const shouldLog = (logLevel) => {
  const currentLevel = getCurrentLevel();
  return levels[logLevel] <= levels[currentLevel];
};

const logger = {
  error: (message) => {
    if (shouldLog('error')) {
      const formattedMessage = formatMessage('error', message);
      console.error(formattedMessage);
      writeToFile('error', message);
    }
  },
  
  warn: (message) => {
    if (shouldLog('warn')) {
      const formattedMessage = formatMessage('warn', message);
      console.warn(formattedMessage);
      writeToFile('warn', message);
    }
  },
  
  info: (message) => {
    if (shouldLog('info')) {
      const formattedMessage = formatMessage('info', message);
      console.info(formattedMessage);
      writeToFile('info', message);
    }
  },
  
  http: (message) => {
    if (shouldLog('http')) {
      const formattedMessage = formatMessage('http', message);
      console.log(formattedMessage);
      writeToFile('http', message);
    }
  },
  
  debug: (message) => {
    if (shouldLog('debug')) {
      const formattedMessage = formatMessage('debug', message);
      console.log(formattedMessage);
      writeToFile('debug', message);
    }
  }
};

module.exports = logger;
