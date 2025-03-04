import type { Message } from "discord.js";

export type RedditPost = {
  postLink: string;
  subreddit: string;
  title: string;
  url: string;
  nsfw: boolean;
  spoiler: boolean;
  author: string;
  ups: number;
  preview: string[];
};

export type JokeApiResponse = {
  type: string;
  setup: string;
  punchline: string;
  id: number;
};

// simple in memory cache
const memeCache: Map<string, Map<string, number>> = new Map();
const jokeCache: Map<string, Map<number, number>> = new Map();
const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export async function fetchRandomRiddle() {
  try {
    const response = await fetch("https://riddles-api.vercel.app/random");
    const data = await response.json();
    return { riddle: data.riddle, answer: data.answer };
  } catch (error) {
    console.error("Error fetching riddle", error);
    return null;
  }
}

export async function fetchRandomQuote() {
  try {
    const response = await fetch("https://zenquotes.io/api/random");
    const data: { q: string; a: string }[] = await response.json();
    const { q: quote, a: author } = data[0];
    return { quote, author };
  } catch (error) {
    console.error("Error fetching quote", error);
    return { quote: null, author: null };
  }
}

export async function fetchRandomMeme(message: Message) {
  try {
    const response = await fetch("https://meme-api.com/gimme/programminghumor");
    const data: RedditPost = await response.json();

    const serverId = message.guild?.id;
    if (!serverId) {
      throw new Error("Server ID not found");
    }

    // Initialize cache for the server if it doesn't exist
    if (!memeCache.has(serverId)) {
      console.debug(`Created cache for server ${message.guild.name}`);
      memeCache.set(serverId, new Map());
    }

    // biome-ignore lint/style/noNonNullAssertion: <It's handled above it can't be null>
    const serverCache = memeCache.get(serverId)!;

    // Clean up cache - any older than a week
    const now = Date.now();
    for (const [url, timestamp] of serverCache.entries()) {
      if (now - timestamp > ONE_WEEK_MS) {
        serverCache.delete(url);
      }
    }

    const memeUrl = data.preview.at(-1);
    if (!memeUrl || serverCache.has(memeUrl)) {
      console.debug("Meme found in cache, fetching new one");
      return fetchRandomMeme(message); // Recursively fetch another meme
    }

    // Add the new meme to the cache
    serverCache.set(memeUrl, now);

    return {
      title: data.title,
      author: data.author,
      subreddit: data.subreddit,
      meme: data.preview.at(-1),
      post: data.postLink,
    };
  } catch (error) {
    console.error("Error fetching meme", error);
    return {};
  }
}

export async function fetchRandomJoke(message: Message, retries = 0) {
  try {
    if (retries >= 5) throw new Error("Failed to fetch unique joke");

    const response = await fetch("https://official-joke-api.appspot.com/jokes/programming/random");
    const data: JokeApiResponse[] = await response.json();

    const serverId = message.guild?.id;
    if (!serverId) {
      throw new Error("Server ID not found");
    }

    // Initialize cache for the server if it doesn't exist
    if (!jokeCache.has(serverId)) {
      console.debug(`Created cache for server ${message.guild.name}`);
      jokeCache.set(serverId, new Map());
    }

    // biome-ignore lint/style/noNonNullAssertion: <It's handled above it can't be null>
    const serverCache = jokeCache.get(serverId)!;

    // Clean up cache - any older than a week
    const now = Date.now();
    for (const [url, timestamp] of serverCache.entries()) {
      if (now - timestamp > ONE_WEEK_MS) {
        serverCache.delete(url);
      }
    }

    const joke = data[0];
    const jokeId = joke.id;
    if (!jokeId || serverCache.has(jokeId)) {
      console.debug("Joke found in cache, fetching new one");
      return fetchRandomJoke(message, retries + 1); // Recursively fetch another joke
    }

    // Add the new meme to the cache
    serverCache.set(jokeId, now);

    return joke;
  } catch (error) {
    console.error("Error fetching joke", error);
    return null;
  }
}
