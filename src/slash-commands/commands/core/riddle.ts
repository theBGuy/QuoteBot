import { CommandService } from "@/services/CommandService";
import { type CacheType, type ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import type { Command } from "..";

const commandService = new CommandService();

export class RiddleCommand implements Command {
  name = "riddle";
  description = "Get a random riddle";
  slashCommandConfig = new SlashCommandBuilder().setName(this.name).setDescription(this.description);

  async execute(interaction: ChatInputCommandInteraction<CacheType>): Promise<any> {
    await commandService.handleRiddle(interaction);
  }
}
