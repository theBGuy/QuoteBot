// import { SlashCommandBuilder } from "discord.js";

// export default {
//   data: new SlashCommandBuilder().setName("user").setDescription("Provides information about the user."),
//   async execute(interaction: any) {
//     // interaction.user is the object representing the User who ran the command
//     // interaction.member is the GuildMember object, which represents the user in the specific guild
//     await interaction.reply(
//       `This command was run by ${interaction.user.username}, who joined on ${interaction.member.joinedAt}.`,
//     );
//   },
// };
import { type CacheType, type ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import type { Command } from "..";

export class UserCommand implements Command {
  name = "user";
  description = "Provides information about the user.";
  slashCommandConfig = new SlashCommandBuilder().setName(this.name).setDescription(this.description);

  async execute(interaction: ChatInputCommandInteraction<CacheType>): Promise<any> {
    console.debug(JSON.stringify(interaction.user, null, 2));
    return interaction.reply(
      `This command was run by ${interaction.user.username}, who joined on ${interaction.user.createdTimestamp}.`,
    );
  }
}
