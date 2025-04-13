import { redisClient } from "@/libs/redisClient";
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

type BulkMemesResponse = {
  count: number;
  memes: RedditPost[];
};

export async function fetchRandomMeme(message: Message, retries = 0): Promise<Partial<RedditPost>> {
  try {
    if (retries >= 5) throw new Error("Failed to fetch unique meme");

    const serverId = message.guild?.id;
    if (!serverId) {
      throw new Error("Server ID not found");
    }

    const MEMES_CACHE_KEY = `memes:${serverId}:all`;
    const USED_MEMES_KEY = `memes:${serverId}:used`;
    const ONE_WEEK_SECONDS = 7 * 24 * 60 * 60;

    let memesArray: RedditPost[] = [];
    const cachedMemes = await redisClient.get(MEMES_CACHE_KEY);

    if (cachedMemes) {
      memesArray = JSON.parse(cachedMemes);
      console.debug(`Retrieved ${memesArray.length} memes from cache for server ${message.guild.name}`);
    } else {
      console.debug(`Fetching memes from API for server ${message.guild.name}`);
      const response = await fetch("https://meme-api.com/gimme/programminghumor/50");
      const data: BulkMemesResponse = await response.json();

      if (!data.memes || data.memes.length === 0) {
        throw new Error("No memes returned from API");
      }

      memesArray = data.memes;
      await redisClient.set(MEMES_CACHE_KEY, JSON.stringify(memesArray), { EX: ONE_WEEK_SECONDS });
    }

    const usedMemeUrls = await redisClient.sMembers(USED_MEMES_KEY);
    const usedMemesSet = new Set(usedMemeUrls);
    const availableMemes = memesArray.filter((meme) => {
      const memeUrl = meme.preview?.at(-1);
      return memeUrl && !usedMemesSet.has(memeUrl);
    });

    console.debug(`${availableMemes.length} unused memes available out of ${memesArray.length} total`);

    if (availableMemes.length > 0) {
      const randomIndex = Math.floor(Math.random() * availableMemes.length);
      const selectedMeme = availableMemes[randomIndex];
      const memeUrl = selectedMeme.preview.at(-1);

      if (memeUrl) {
        await redisClient.sAdd(USED_MEMES_KEY, memeUrl);
        await redisClient.expire(USED_MEMES_KEY, ONE_WEEK_SECONDS);

        return {
          title: selectedMeme.title,
          author: selectedMeme.author,
          subreddit: selectedMeme.subreddit,
          url: memeUrl,
          postLink: selectedMeme.postLink,
        };
      }
    }

    if (retries === 0) {
      console.debug("All memes have been used, resetting used memes set");
      await redisClient.del(USED_MEMES_KEY);
      return fetchRandomMeme(message, retries + 1);
    }

    const randomMeme = memesArray[Math.floor(Math.random() * memesArray.length)];
    const memeUrl = randomMeme.preview?.at(-1);

    console.debug("No unused memes available, returning a random meme");
    return {
      title: randomMeme.title,
      author: randomMeme.author,
      subreddit: randomMeme.subreddit,
      url: memeUrl,
      postLink: randomMeme.postLink,
    };
  } catch (error) {
    console.error("Error fetching meme", error);

    if (retries < 3) {
      try {
        const response = await fetch("https://meme-api.com/gimme/programminghumor");
        const data: RedditPost = await response.json();

        return {
          title: data.title,
          author: data.author,
          subreddit: data.subreddit,
          url: data.preview?.at(-1),
          postLink: data.postLink,
        };
      } catch (fallbackError) {
        console.error("Fallback meme fetch failed", fallbackError);
      }
    }

    return {};
  }
}
