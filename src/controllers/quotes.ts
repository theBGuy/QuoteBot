import { redisClient } from "@/libs/redisClient";

export type QuoteData = {
  quote: string | null;
  author: string | null;
};

type ZenQuoteApiResponse = Array<{
  q: string; // quote (why they didn't do quote idk)
  a: string; // author
  h: string; // HTML formatted quote
}>;

export async function fetchRandomQuote(): Promise<QuoteData> {
  const QUOTES_CACHE_KEY = "zen_quotes_cache";
  const CACHE_TTL = 24 * 60 * 60;

  try {
    const cachedQuotes = await redisClient.get(QUOTES_CACHE_KEY);

    if (cachedQuotes) {
      console.debug("Using cached quotes");
      const quotes = JSON.parse(cachedQuotes);
      const randomIndex = Math.floor(Math.random() * quotes.length);
      return {
        quote: quotes[randomIndex].q,
        author: quotes[randomIndex].a,
      };
    }

    console.debug("Fetching quotes from API");
    const response = await fetch("https://zenquotes.io/api/quotes");
    const data: ZenQuoteApiResponse = await response.json();

    await redisClient.set(QUOTES_CACHE_KEY, JSON.stringify(data), {
      EX: CACHE_TTL,
    });

    const randomIndex = Math.floor(Math.random() * data.length);
    return {
      quote: data[randomIndex].q,
      author: data[randomIndex].a,
    };
  } catch (error) {
    console.error("Error fetching quote", error);
    return { quote: null, author: null };
  }
}

export async function fetchQuoteOfTheDay(): Promise<QuoteData> {
  const QOTD_CACHE_KEY = "quote_of_the_day_cache";

  try {
    const cachedQuote = await redisClient.get(QOTD_CACHE_KEY);

    if (cachedQuote) {
      console.debug("Using cached quote of the day");
      return JSON.parse(cachedQuote);
    }

    console.debug("Fetching quote of the day from API");
    const response = await fetch("https://zenquotes.io/api/today");
    const data: ZenQuoteApiResponse = await response.json();

    if (!data || !data[0]) {
      throw new Error("Invalid response from quote API");
    }

    const quoteData = {
      quote: data[0].q,
      author: data[0].a,
    };

    const now = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(now.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    const secondsUntilMidnight = Math.floor((tomorrow.getTime() - now.getTime()) / 1000);

    await redisClient.set(QOTD_CACHE_KEY, JSON.stringify(quoteData), {
      EX: secondsUntilMidnight,
    });

    return quoteData;
  } catch (error) {
    console.error("Error fetching quote of the day", error);
    return { quote: null, author: null };
  }
}
