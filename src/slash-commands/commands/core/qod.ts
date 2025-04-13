import { CommandService } from "@/services/CommandService";
import { type CacheType, type ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import type { Command } from "..";

const commandService = new CommandService();

export class QodCommand implements Command {
  name = "qod";
  description = "Get the quote of the day";
  slashCommandConfig = new SlashCommandBuilder().setName(this.name).setDescription(this.description);

  async execute(interaction: ChatInputCommandInteraction<CacheType>): Promise<any> {
    await commandService.handleQuoteOfTheDay(interaction);
  }
}
