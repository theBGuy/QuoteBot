import {
  AttachmentBuilder,
  type ChatInputCommandInteraction,
  Client,
  EmbedBuilder,
  Events,
  GatewayIntentBits,
  type Message,
  REST,
} from "discord.js";
import dotenv from "dotenv";
import { fetchRandomJoke, fetchRandomMeme, fetchRandomQuote, fetchRandomRiddle } from "./controllers";
import prismaClient from "./libs/prismaClient";
import { initializeRedis, redisClient } from "./libs/redisClient";
import { InteractionHandler } from "./slash-commands";

dotenv.config();

const DISCORD_ACCESS_TOKEN = process.env.CLIENT_TOKEN ?? "";
const DISCORD_CLIENT_ID = process.env.CLIENT_ID ?? "";

if (!DISCORD_ACCESS_TOKEN) {
  throw new Error(`Failed to load client token ${process.env.CLIENT_TOKEN}`);
}

if (!DISCORD_CLIENT_ID) {
  throw new Error(`Failed to load client id ${process.env.CLIENT_ID}`);
}

type RedditPost = {
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

class QuoteBotApplication {
  private client: Client;
  private discordRestClient: REST;
  private interactionHandler: InteractionHandler;
  private activeRiddles: Map<string, { riddle: string; answer: string }>;
  private activeJokes: Map<string, { id: number; punchline: string }>;

  constructor() {
    this.client = new Client({
      intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
      shards: "auto",
      failIfNotExists: false,
    });
    this.discordRestClient = new REST().setToken(DISCORD_ACCESS_TOKEN);
    this.interactionHandler = new InteractionHandler();
    this.activeRiddles = new Map();
    this.activeJokes = new Map();
  }

  async handleRiddleEvent(message: Message) {
    const riddleData = await fetchRandomRiddle();
    if (riddleData) {
      this.activeRiddles.set(message.author.id, riddleData);
      message.reply(`Here's your riddle: ${riddleData.riddle}`);
    } else {
      message.reply("Sorry, I couldn't fetch a riddle for you.");
    }
  }

  async handleQuoteEvent(message: Message) {
    const { quote, author } = await fetchRandomQuote();
    if (quote) {
      message.reply(`${quote} \n\n**${author}**`);
    } else {
      message.reply("Sorry, I couldn't fetch a quote for you.");
    }
  }

  async handleMemeEvent(message: Message) {
    const { meme, title, post, author: memeAuthor, subreddit } = await fetchRandomMeme(message);
    if (meme) {
      console.log("title", title, "author", memeAuthor, "post", post);
      const file = new AttachmentBuilder(meme);
      const memeEmbed = new EmbedBuilder()
        .setTitle(title)
        .setURL(post)
        .setAuthor({ name: memeAuthor })
        .setThumbnail(meme)
        .setImage(`attachment://${meme}`)
        .setFooter({ text: subreddit });
      message.reply({ embeds: [memeEmbed], files: [file] });
    } else {
      message.reply("Sorry, I couldn't fetch a meme for you.");
    }
  }

  async handleJokeEvent(message: Message) {
    const joke = await fetchRandomJoke(message);
    if (joke) {
      message.reply(`${joke.setup}`);
      this.activeJokes.set(message.author.id, { id: joke.id, punchline: joke.punchline });
    } else {
      message.reply("Sorry, I couldn't fetch a joke for you.");
    }
  }

  addClientEventHandlers() {
    this.client.on(Events.MessageCreate, async (message: Message) => {
      if (message.author.bot) return;

      const content = message.content.toLowerCase();

      if (this.activeRiddles.has(message.author.id)) {
        const riddleData = this.activeRiddles.get(message.author.id);
        if (riddleData) {
          message.reply(`You answered: ${message.content}.\nThe correct answer was: ${riddleData.answer}`);
          this.activeRiddles.delete(message.author.id);
        }
      }

      if (this.activeJokes.has(message.author.id)) {
        const jokePunchline = this.activeJokes.get(message.author.id);
        if (jokePunchline) {
          message.reply(jokePunchline.punchline);
          this.activeJokes.delete(message.author.id);
        }
      }

      switch (content) {
        case "riddle me this batman":
        case "!riddle":
          return this.handleRiddleEvent(message);
        case "give me a quote":
        case "!quote":
          return this.handleQuoteEvent(message);
        case "!meme":
          return this.handleMemeEvent(message);
        case "!joke":
          return this.handleJokeEvent(message);
        default:
          break;
      }
    });

    this.client.on(Events.InteractionCreate, (interaction) => {
      this.interactionHandler.handleInteraction(interaction as ChatInputCommandInteraction);
    });

    this.client.on(Events.ClientReady, (readyClient) => {
      console.log(`Ready! Logged in as ${readyClient.user.tag}`);
    });

    this.client.on(Events.Error, (err: Error) => {
      console.error("Client error", err);
    });
  }

  async startBot() {
    const signals: NodeJS.Signals[] = ["SIGINT", "SIGTERM"];
    for (const signal of signals) {
      process.on(signal, async () => {
        try {
          await redisClient.disconnect();
          await prismaClient.$disconnect();
          console.error(`Closed application on ${signal}`);
          process.exit(0);
        } catch (err) {
          console.error(`Error closing application on ${signal}`, err);
          process.exit(1);
        }
      });
    }
    try {
      await initializeRedis();
      await this.client.login(DISCORD_ACCESS_TOKEN);
      this.addClientEventHandlers();
    } catch (err) {
      console.error("Error starting bot", err);
    }
  }
}

const app = new QuoteBotApplication();
app.startBot();
