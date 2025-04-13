import { type CacheType, type ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import type { Command } from "..";

export default class UserCommand implements Command {
  name = "user";
  description = "Provides information about the user.";
  slashCommandConfig = new SlashCommandBuilder().setName(this.name).setDescription(this.description);

  async execute(interaction: ChatInputCommandInteraction<CacheType>): Promise<any> {
    return interaction.reply(
      `This command was run by ${interaction.user.username}, who joined on ${interaction.user.createdTimestamp}.`,
    );
  }
}
