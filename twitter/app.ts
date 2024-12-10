import cron from 'node-cron';
import { fetchTrendingCoins } from './fetchTrendingCoins';
import { auditAndReplyToMentions, auditAndTweet } from './auditAndTweets';
import winston from 'winston';

// Initialize logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.simple()
  ),
  transports: [
    new winston.transports.File({ filename: 'app.log' }),
    new winston.transports.Console(),
  ],
});

logger.info('Scheduler started.');

// Function to run the tasks
async function runTasks() {
  logger.info('Running tasks at ' + new Date().toLocaleString());
  
  try {
    await auditAndReplyToMentions();
    logger.info('Tasks completed successfully.');
  } catch (error) {
    logger.error('Error running scheduled tasks: ' + (error as Error).message);
  }
}

// Function to run trending coins task
async function runTrendingCoinsTask() {
  logger.info('Running trending coins task at ' + new Date().toLocaleString());
  
  try {
    // Fetch trending coins
    await fetchTrendingCoins();
    logger.info('Trending coins task completed successfully.');
  } catch (error) {
    logger.error('Error running trending coins task: ' + (error as Error).message);
  }
}

// Function to run audit and tweet task
async function runAuditAndTweetTask() {
  logger.info('Running audit and tweet task at ' + new Date().toLocaleString());
  
  try {
    // Audit and tweet
    await auditAndTweet();
    logger.info('Audit and tweet task completed successfully.');
  } catch (error) {
    logger.error('Error running audit and tweet task: ' + (error as Error).message);
  }
}

// Run tasks immediately upon startup
runTasks();
runTrendingCoinsTask();
runAuditAndTweetTask();

// Schedule audit and tweet task to run every 10 minutes
cron.schedule('*/10 * * * *', async () => {
  runTasks();
  runAuditAndTweetTask();
});

// Schedule trending coins task to run every three hours
cron.schedule('0 */3 * * *', async () => {
  await runTrendingCoinsTask();
});