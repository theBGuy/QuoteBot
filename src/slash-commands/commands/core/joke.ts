import { CommandService } from "@/services/CommandService";
import { type CacheType, type ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import type { Command } from "..";

const commandService = new CommandService();

export class JokeCommand implements Command {
  name = "joke";
  description = "Get a random joke";
  slashCommandConfig = new SlashCommandBuilder().setName(this.name).setDescription(this.description);

  async execute(interaction: ChatInputCommandInteraction<CacheType>): Promise<any> {
    await commandService.handleJoke(interaction);
  }
}
