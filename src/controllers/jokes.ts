import { redisClient } from "@/libs/redisClient";
import type { Message } from "discord.js";

export type JokeApiResponse = {
  type: string;
  setup: string;
  punchline: string;
  id: number;
};

export async function fetchRandomJoke(message: Message, retries = 0): Promise<JokeApiResponse | null> {
  try {
    if (retries >= 5) throw new Error("Failed to fetch unique joke");

    const serverId = message.guild?.id;
    if (!serverId) {
      throw new Error("Server ID not found");
    }

    const JOKES_CACHE_KEY = `jokes:${serverId}:all`;
    const USED_JOKES_KEY = `jokes:${serverId}:used`;
    const ONE_WEEK_SECONDS = 7 * 24 * 60 * 60;

    let jokesArray: JokeApiResponse[] = [];
    const cachedJokes = await redisClient.get(JOKES_CACHE_KEY);

    if (cachedJokes) {
      jokesArray = JSON.parse(cachedJokes);
      console.debug(`Retrieved ${jokesArray.length} jokes from cache for server ${message.guild.name}`);
    } else {
      console.debug(`Fetching jokes from API for server ${message.guild.name}`);
      const response = await fetch("https://official-joke-api.appspot.com/jokes/random/100");
      jokesArray = await response.json();

      await redisClient.set(JOKES_CACHE_KEY, JSON.stringify(jokesArray), { EX: ONE_WEEK_SECONDS });
    }

    const usedJokeIds = await redisClient.sMembers(USED_JOKES_KEY);
    const usedJokesSet = new Set(usedJokeIds);
    const availableJokes = jokesArray.filter((joke) => joke?.id && !usedJokesSet.has(`${joke.id}`));

    console.debug(`${availableJokes.length} unused jokes available out of ${jokesArray.length} total`);

    if (availableJokes.length > 0) {
      const randomIndex = Math.floor(Math.random() * availableJokes.length);
      const selectedJoke = availableJokes[randomIndex];

      await redisClient.sAdd(USED_JOKES_KEY, `${selectedJoke.id}`);
      await redisClient.expire(USED_JOKES_KEY, ONE_WEEK_SECONDS);

      return selectedJoke;
    }

    if (retries === 0) {
      console.debug("All jokes have been used, resetting used jokes set");
      await redisClient.del(USED_JOKES_KEY);
      return fetchRandomJoke(message, retries + 1);
    }

    const randomJoke = jokesArray[Math.floor(Math.random() * jokesArray.length)];
    console.debug("No unused jokes available, returning a random joke");
    return randomJoke;
  } catch (error) {
    console.error("Error fetching joke", error);
    return null;
  }
}
