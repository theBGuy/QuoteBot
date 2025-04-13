import { CommandService } from "@/services/CommandService";
import { type CacheType, type ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import type { Command } from "..";

const commandService = new CommandService();

export default class QuoteCommand implements Command {
  name = "quote";
  description = "Get a random quote";
  slashCommandConfig = new SlashCommandBuilder().setName(this.name).setDescription(this.description);

  async execute(interaction: ChatInputCommandInteraction<CacheType>): Promise<any> {
    await commandService.handleQuote(interaction);
  }
}
