const StatsD = require('node-statsd');
const client = new StatsD();

const incrementApiCount = (apiName) => {
  client.increment(`api.${apiName}.count`);
};

const recordApiTime = (apiName, startTime) => {
  const executionTime = Date.now() - startTime;
  client.timing(`api.${apiName}.time`, executionTime);
};

const recordDbQueryTime = (queryName, startTime) => {
  const queryTime = Date.now() - startTime;
  client.timing(`db.query.${queryName}.time`, queryTime);
};

const recordS3OperationTime = (operationName, startTime) => {
  const operationTime = Date.now() - startTime;
  client.timing(`s3.operation.${operationName}.time`, operationTime);
};

module.exports = {
  incrementApiCount,
  recordApiTime,
  recordDbQueryTime,
  recordS3OperationTime
};