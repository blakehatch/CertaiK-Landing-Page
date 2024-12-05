// twitter/utils.ts
import twitterClient from './client';

export async function postTweet(text: string) {
  try {
    const tweet = await twitterClient.v2.tweet(text);
    console.log('Tweet posted:', tweet.data.text);
    return tweet;
  } catch (error) {
    console.error('Error posting tweet:', error);
    throw error;
  }
}