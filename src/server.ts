import { Client, Events, GatewayIntentBits, type Message, REST } from "discord.js";
import dotenv from "dotenv";
import prismaClient from "./libs/prismaClient";
import { initializeRedis, redisClient } from "./libs/redisClient";
import { CommandService } from "./services/CommandService";
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

class QuoteBotApplication {
  private client: Client;
  private discordRestClient: REST;
  private interactionHandler: InteractionHandler;
  private commandService: CommandService;

  constructor() {
    this.client = new Client({
      intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
      shards: "auto",
      failIfNotExists: false,
    });
    this.discordRestClient = new REST().setToken(DISCORD_ACCESS_TOKEN);
    this.interactionHandler = new InteractionHandler();
    this.commandService = new CommandService();
  }

  addClientEventHandlers() {
    this.client.on(Events.MessageCreate, async (message: Message) => {
      if (message.author.bot) return;

      const content = message.content.toLowerCase();

      const riddleResponse = await this.commandService.checkActiveRiddle(message.author.id, message.content);
      if (riddleResponse) {
        return message.reply(riddleResponse);
      }

      const jokeResponse = await this.commandService.checkActiveJoke(message.author.id);
      if (jokeResponse) {
        return message.reply(jokeResponse);
      }

      const triviaResponse = await this.commandService.checkTrivia(message.author.id, message.content);
      if (triviaResponse) {
        return message.reply(triviaResponse);
      }

      switch (content) {
        case "riddle me this batman":
        case "!riddle":
          return this.commandService.handleRiddle(message);
        case "give me a quote":
        case "!quote":
          return this.commandService.handleQuote(message);
        case "!qod":
          return this.commandService.handleQuoteOfTheDay(message);
        case "!quoteimg":
          return this.commandService.handleQuoteImage(message);
        case "!meme":
          return this.commandService.handleMeme(message);
        case "!joke":
          return this.commandService.handleJoke(message);
        case "!trivia":
          return this.commandService.handleTrivia(message);
        default:
          break;
      }
    });

    this.client.on(Events.InteractionCreate, async (interaction) => {
      if (!interaction.isChatInputCommand()) return;
      await this.interactionHandler.handleInteraction(interaction);
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
