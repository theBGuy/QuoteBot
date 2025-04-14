import { CommandService } from "@/services/CommandService";
import { type CacheType, type ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import type { Command } from "..";

export default class JokeCommand implements Command {
  name = "joke";
  description = "Get a random joke";
  slashCommandConfig = new SlashCommandBuilder().setName(this.name).setDescription(this.description);

  async execute(interaction: ChatInputCommandInteraction<CacheType>): Promise<any> {
    const commandService = CommandService.getInstance();
    await commandService.handleJoke(interaction);
  }
}
