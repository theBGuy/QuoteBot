import { CommandService } from "@/services/CommandService";
import { type CacheType, type ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import type { Command } from "..";

export default class TriviaCommand implements Command {
  name = "trivia";
  description = "Get a random trivia question";
  slashCommandConfig = new SlashCommandBuilder().setName(this.name).setDescription(this.description);

  async execute(interaction: ChatInputCommandInteraction<CacheType>): Promise<any> {
    const commandService = CommandService.getInstance();
    await commandService.handleTrivia(interaction);
  }
}
