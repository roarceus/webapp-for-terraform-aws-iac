const winston = require('winston');
const { format, transports } = winston;
const logFile = '/var/log/webapp.log';

const logger = winston.createLogger({
  level: 'info',
  format: format.combine(
    format.timestamp(),
    format.printf(({ level, message, timestamp }) => {
      return `[${level.toUpperCase()}] ${timestamp} - ${message}`;
    })
  ),
  transports: [
    new transports.Console({
      format: format.combine(
        format.colorize(),
        format.printf(({ level, message, timestamp }) => {
          return `[${level.toUpperCase()}] ${timestamp} - ${message}`;
        })
      ),
    }),
    new transports.File({
      filename: logFile,
      format: format.combine(
        format.timestamp(),
        format.json()
      ),
    })
  ]
});

module.exports = logger;
