import { InteractionHandler } from "@/slash-commands";
import { REST, Routes } from "discord.js";
import dotenv from "dotenv";

dotenv.config();

const DISCORD_ACCESS_TOKEN = process.env.CLIENT_TOKEN ?? "";
const DISCORD_CLIENT_ID = process.env.CLIENT_ID ?? "";

if (!DISCORD_ACCESS_TOKEN) {
  throw new Error(`Failed to load client token ${process.env.CLIENT_TOKEN}`);
}

if (!DISCORD_CLIENT_ID) {
  throw new Error(`Failed to load client id ${process.env.CLIENT_ID}`);
}

const interactionHandler = new InteractionHandler();
const discordRestClient = new REST().setToken(DISCORD_ACCESS_TOKEN);
const commands = interactionHandler.getSlashCommands();
discordRestClient
  .put(Routes.applicationCommands(DISCORD_CLIENT_ID), {
    body: commands,
  })
  .then((data: any) => {
    console.log(`Successfully registered ${data.length} global application (/) commands`);
  })
  .catch((err) => {
    console.error("Error registering application (/) commands", err);
  });
