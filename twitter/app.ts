import cron from 'node-cron';
import { fetchTrendingCoins } from './fetchTrendingCoins';
import { auditAndTweet } from './auditAndTweets';
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
    // Fetch trending coins
    await fetchTrendingCoins();
    
    // Audit and tweet
    await auditAndTweet();
    
    logger.info('Tasks completed successfully.');
  } catch (error) {
    logger.error('Error running scheduled tasks: ' + (error as Error).message);
  }
}

// Run tasks immediately upon startup
runTasks();

// Schedule tasks to run every three hours
cron.schedule('0 */3 * * *', async () => {
  await runTasks();
});