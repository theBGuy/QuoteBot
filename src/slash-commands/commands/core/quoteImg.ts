import { CommandService } from "@/services/CommandService";
import { type CacheType, type ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import type { Command } from "..";

const commandService = new CommandService();

export default class QuoteImgCommand implements Command {
  name = "quoteimg";
  description = "Get a random quote on an image";
  slashCommandConfig = new SlashCommandBuilder().setName(this.name).setDescription(this.description);

  async execute(interaction: ChatInputCommandInteraction<CacheType>): Promise<any> {
    await commandService.handleQuoteImage(interaction);
  }
}
