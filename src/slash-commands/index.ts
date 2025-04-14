import { readdirSync } from "node:fs";
import { join } from "node:path";
import type { ChatInputCommandInteraction } from "discord.js";
import type { Command } from "./commands";

export class InteractionHandler {
  private commands: Command[] = [];

  constructor() {
    this.loadCommands();
  }

  private loadCommands() {
    const commandsPath = join(__dirname, "commands");

    const loadCommandsFromDir = (dirPath: string) => {
      try {
        const items = readdirSync(dirPath, { withFileTypes: true });

        for (const item of items) {
          const itemPath = join(dirPath, item.name);

          if (item.isDirectory()) {
            loadCommandsFromDir(itemPath);
          } else if (item.name.endsWith(".ts") || item.name.endsWith(".js")) {
            if (item.name === "index.ts" || item.name === "index.js") continue;
            if (item.name.startsWith("types.") || item.name.startsWith("interfaces.")) continue;

            try {
              const commandModule = require(itemPath);

              // Look for default export or named exports that might be command classes
              const CommandClass = commandModule.default || Object.values(commandModule)[0];

              if (CommandClass && typeof CommandClass === "function") {
                const command = new CommandClass();

                if (command.name && command.slashCommandConfig && typeof command.execute === "function") {
                  console.log(`Loaded command: ${command.name}`);
                  this.commands.push(command);
                }
              }
            } catch (error) {
              console.error(`Error loading command from file ${itemPath}:`, error);
            }
          }
        }
      } catch (error) {
        console.error(`Error reading directory ${dirPath}:`, error);
      }
    };

    loadCommandsFromDir(commandsPath);

    console.log(`Loaded ${this.commands.length} commands`);
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
