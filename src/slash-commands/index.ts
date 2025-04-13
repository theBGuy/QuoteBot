import type { ChatInputCommandInteraction } from "discord.js";
import type { Command } from "./commands";
import { JokeCommand } from "./commands/core/joke";
import { MemeCommand } from "./commands/core/meme";
import { QodCommand } from "./commands/core/qod";
import { QuoteCommand } from "./commands/core/quote";
import { QuoteImgCommand } from "./commands/core/quoteImg";
import { RiddleCommand } from "./commands/core/riddle";
import { PingCommand } from "./commands/utility/ping";

export class InteractionHandler {
  private commands: Command[];

  constructor() {
    this.commands = [
      new PingCommand(),
      new MemeCommand(),
      new QodCommand(),
      new QuoteCommand(),
      new QuoteImgCommand(),
      new JokeCommand(),
      new RiddleCommand(),
    ];
  }

  getSlashCommands() {
    return this.commands.map((command: Command) => command.slashCommandConfig.toJSON());
  }

  async handleInteraction(interaction: ChatInputCommandInteraction): Promise<void> {
    const commandName = interaction.commandName;

    const matchedCommand = this.commands.find((command) => command.name === commandName);

    if (!matchedCommand) {
      return Promise.reject("Command not matched");
    }

    matchedCommand
      .execute(interaction)
      .then(() => {
        console.log(`Successfully executed command [/${interaction.commandName}]`, {
          guild: { id: interaction.guildId, name: interaction.guild?.name },
          user: { name: interaction.user.globalName },
        });
      })
      .catch((err) =>
        console.log(`Error executing command [/${interaction.commandName}]: ${err}`, {
          guild: { id: interaction.guildId, name: interaction.guild?.name },
          user: { name: interaction.user.globalName },
        }),
      );
  }
}
