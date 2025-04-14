import { CommandService } from "@/services/CommandService";
import { type CacheType, type ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import type { Command } from "..";

export default class MemeCommand implements Command {
  name = "meme";
  description = "Generate random meme from programming humor subreddit";
  slashCommandConfig = new SlashCommandBuilder().setName(this.name).setDescription(this.description);

  async execute(interaction: ChatInputCommandInteraction<CacheType>): Promise<any> {
    const commandService = CommandService.getInstance();
    await commandService.handleMeme(interaction);
  }
}
