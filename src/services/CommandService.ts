import { fetchRandomTrivia, getDifficultyColor } from "@/controllers/trivia";
import { AttachmentBuilder, type ChatInputCommandInteraction, EmbedBuilder, type Message } from "discord.js";
import {
  fetchQuoteOfTheDay,
  fetchRandomJoke,
  fetchRandomMeme,
  fetchRandomQuote,
  fetchRandomRiddle,
} from "../controllers";

export class CommandService {
  private activeRiddles: Map<string, { riddle: string; answer: string }>;
  private activeJokes: Map<string, { id: number; punchline: string }>;
  private activeTriviaQuestions: Map<string, { correctAnswer: string; question: string }>;

  constructor() {
    this.activeRiddles = new Map();
    this.activeJokes = new Map();
    this.activeTriviaQuestions = new Map();
  }

  private getUserId(source: Message | ChatInputCommandInteraction): string {
    if ("author" in source) {
      return source.author.id;
    }
    return source.user.id;
  }

  private async sendResponse(
    source: Message | ChatInputCommandInteraction,
    content: string | { embeds?: EmbedBuilder[]; files?: AttachmentBuilder[] },
  ): Promise<void> {
    if ("author" in source) {
      if (typeof content === "string") {
        await source.reply(content);
      } else {
        await source.reply({ embeds: content.embeds, files: content.files });
      }
    } else {
      if (typeof content === "string") {
        await source.reply(content);
      } else {
        await source.reply({ embeds: content.embeds, files: content.files });
      }
    }
  }

  async handleRiddle(source: Message | ChatInputCommandInteraction) {
    const riddleData = await fetchRandomRiddle();
    if (riddleData) {
      this.activeRiddles.set(this.getUserId(source), riddleData);
      await this.sendResponse(source, `Here's your riddle: ${riddleData.riddle}`);
    } else {
      await this.sendResponse(source, "Sorry, I couldn't fetch a riddle for you.");
    }
  }

  async handleQuote(source: Message | ChatInputCommandInteraction) {
    const { quote, author } = await fetchRandomQuote();
    if (quote) {
      await this.sendResponse(source, `${quote} \n\n**${author}**`);
    } else {
      await this.sendResponse(source, "Sorry, I couldn't fetch a quote for you.");
    }
  }

  async handleQuoteOfTheDay(source: Message | ChatInputCommandInteraction) {
    const { quote, author } = await fetchQuoteOfTheDay();
    if (quote) {
      await this.sendResponse(source, `${quote} \n\n**${author}**`);
    } else {
      await this.sendResponse(source, "Sorry, I couldn't fetch a quote for you.");
    }
  }

  async handleQuoteImage(source: Message | ChatInputCommandInteraction) {
    try {
      const cacheParam = Math.random().toString(36).substring(7);
      const imageUrl = `https://zenquotes.io/api/image?cb=${cacheParam}`;
      const response = await fetch(imageUrl, { method: "HEAD" });

      if (!response.ok) {
        await this.sendResponse(source, "Sorry, I couldn't fetch a quote image right now.");
        return;
      }

      const embed = new EmbedBuilder()
        .setImage(imageUrl)
        .setColor(0x0099ff)
        .setFooter({ text: "Powered by ZenQuotes.io" })
        .setTimestamp();

      await this.sendResponse(source, { embeds: [embed] });
    } catch (error) {
      console.error("Error fetching quote image:", error);
      await this.sendResponse(source, "Sorry, there was an error fetching the quote image.");
    }
  }

  async handleMeme(source: Message | ChatInputCommandInteraction) {
    const { url, title, postLink, author: memeAuthor, subreddit } = await fetchRandomMeme(source as Message);
    if (url) {
      const file = new AttachmentBuilder(url);
      const memeEmbed = new EmbedBuilder()
        .setTitle(title ?? null)
        .setURL(postLink ?? null)
        .setAuthor({ name: memeAuthor ?? "" })
        .setThumbnail(url)
        .setImage(`attachment://${file.name}`)
        .setFooter({ text: subreddit ?? "" });

      await this.sendResponse(source, { embeds: [memeEmbed], files: [file] });
    } else {
      await this.sendResponse(source, "Sorry, I couldn't fetch a meme for you.");
    }
  }

  async handleJoke(source: Message | ChatInputCommandInteraction) {
    const joke = await fetchRandomJoke(source as Message);
    if (joke) {
      await this.sendResponse(source, `${joke.setup}`);
      this.activeJokes.set(this.getUserId(source), { id: joke.id, punchline: joke.punchline });
    } else {
      await this.sendResponse(source, "Sorry, I couldn't fetch a joke for you.");
    }
  }

  async handleTrivia(source: Message | ChatInputCommandInteraction) {
    try {
      const triviaData = await fetchRandomTrivia(source as Message);

      if (!triviaData) {
        await this.sendResponse(source, "Sorry, I couldn't fetch a trivia question for you.");
        return;
      }

      const userId = this.getUserId(source);
      const questionEmbed = new EmbedBuilder()
        .setColor(getDifficultyColor(triviaData.difficulty))
        .setTitle("🎮 Trivia Time!")
        .setDescription(triviaData.question)
        .addFields(
          { name: "Category", value: triviaData.category, inline: true },
          { name: "Difficulty", value: triviaData.difficulty, inline: true },
        )
        .setFooter({ text: "Reply with the letter of your answer (A, B, C, or D)" });

      const options = ["🇦", "🇧", "🇨", "🇩"];
      const answerOptions = triviaData.answers.map((answer, index) => `${options[index]} ${answer}`).join("\n\n");

      questionEmbed.addFields({ name: "Options", value: answerOptions });

      const correctIndex = triviaData.answers.indexOf(triviaData.correct_answer);
      this.activeTriviaQuestions.set(userId, {
        correctAnswer: options[correctIndex],
        question: triviaData.question,
      });

      await this.sendResponse(source, { embeds: [questionEmbed] });
    } catch (error) {
      console.error("Error handling trivia:", error);
      await this.sendResponse(source, "Sorry, there was an error with the trivia question.");
    }
  }

  async checkActiveRiddle(userId: string, userResponse: string): Promise<string | null> {
    if (this.activeRiddles.has(userId)) {
      const riddleData = this.activeRiddles.get(userId);
      if (riddleData) {
        this.activeRiddles.delete(userId);
        return `You answered: ${userResponse}.\nThe correct answer was: ${riddleData.answer}`;
      }
    }
    return null;
  }

  async checkActiveJoke(userId: string): Promise<string | null> {
    if (this.activeJokes.has(userId)) {
      const jokeData = this.activeJokes.get(userId);
      if (jokeData) {
        this.activeJokes.delete(userId);
        return jokeData.punchline;
      }
    }
    return null;
  }

  async checkTrivia(userId: string, userResponse: string): Promise<string | null> {
    if (this.activeTriviaQuestions.has(userId)) {
      const triviaData = this.activeTriviaQuestions.get(userId);
      if (triviaData) {
        this.activeTriviaQuestions.delete(userId);

        // Convert user input to emoji if they entered A, B, C, D
        let userAnswer = userResponse.trim().toUpperCase();
        if (userAnswer === "A") userAnswer = "🇦";
        else if (userAnswer === "B") userAnswer = "🇧";
        else if (userAnswer === "C") userAnswer = "🇨";
        else if (userAnswer === "D") userAnswer = "🇩";

        if (userAnswer === triviaData.correctAnswer) {
          return "✅ Correct! Well done!";
        }
        return `❌ Sorry, that's incorrect. The correct answer was ${triviaData.correctAnswer}.`;
      }
    }
    return null;
  }
}
