import type { Message } from "discord.js";
import { redisClient } from "../libs/redisClient";

export type TriviaQuestion = {
  type: "multiple" | "boolean";
  difficulty: "easy" | "medium" | "hard";
  category: string;
  question: string;
  correct_answer: string;
  incorrect_answers: string[];
};

export type TriviaResponse = {
  response_code: number;
  results: TriviaQuestion[];
};

export type TriviaData = {
  question: string;
  category: string;
  difficulty: string;
  correct_answer: string;
  answers: string[];
};

/**
 * Fetches a random trivia question, ensuring that recently used questions aren't repeated
 * @param message Discord message that triggered the request
 * @param retries Number of retry attempts (to avoid infinite loops)
 * @returns A trivia question with shuffled answer options
 */
export async function fetchRandomTrivia(message: Message, retries = 0): Promise<TriviaData | null> {
  try {
    if (retries >= 5) throw new Error("Failed to fetch unique trivia question");

    const serverId = message.guild?.id;
    if (!serverId) {
      throw new Error("Server ID not found");
    }

    const TRIVIA_CACHE_KEY = `trivia:${serverId}:all`;
    const USED_TRIVIA_KEY = `trivia:${serverId}:used`;
    const ONE_DAY_SECONDS = 24 * 60 * 60;

    let triviaArray: TriviaQuestion[] = [];
    const cachedTrivia = await redisClient.get(TRIVIA_CACHE_KEY);

    if (cachedTrivia) {
      triviaArray = JSON.parse(cachedTrivia);
      console.debug(`Retrieved ${triviaArray.length} trivia questions from cache for server ${message.guild.name}`);
    } else {
      console.debug(`Fetching trivia questions from API for server ${message.guild.name}`);
      const response = await fetch("https://opentdb.com/api.php?amount=50");
      const data: TriviaResponse = await response.json();

      if (data.response_code !== 0 || !data.results || data.results.length === 0) {
        throw new Error("Invalid response from trivia API");
      }

      triviaArray = data.results;
      await redisClient.set(TRIVIA_CACHE_KEY, JSON.stringify(triviaArray), { EX: ONE_DAY_SECONDS });
    }

    const usedTriviaIds = await redisClient.sMembers(USED_TRIVIA_KEY);
    const usedTriviaSet = new Set(usedTriviaIds);

    const availableTrivia = triviaArray.filter((question) => {
      const questionId = hashQuestion(question.question);
      return !usedTriviaSet.has(questionId);
    });

    console.debug(`${availableTrivia.length} unused trivia questions available out of ${triviaArray.length} total`);

    if (availableTrivia.length > 0) {
      const randomIndex = Math.floor(Math.random() * availableTrivia.length);
      const selectedTrivia = availableTrivia[randomIndex];
      const questionId = hashQuestion(selectedTrivia.question);

      await redisClient.sAdd(USED_TRIVIA_KEY, questionId);
      await redisClient.expire(USED_TRIVIA_KEY, ONE_DAY_SECONDS);

      const allAnswers = [selectedTrivia.correct_answer, ...selectedTrivia.incorrect_answers];
      const shuffledAnswers = shuffleArray(allAnswers);

      return {
        question: decodeHtmlEntities(selectedTrivia.question),
        category: decodeHtmlEntities(selectedTrivia.category),
        difficulty: capitalize(selectedTrivia.difficulty),
        correct_answer: decodeHtmlEntities(selectedTrivia.correct_answer),
        answers: shuffledAnswers.map((answer) => decodeHtmlEntities(answer)),
      };
    }

    if (retries === 0) {
      console.debug("All trivia questions have been used, resetting used questions set");
      await redisClient.del(USED_TRIVIA_KEY);
      return fetchRandomTrivia(message, retries + 1);
    }

    const randomTrivia = triviaArray[Math.floor(Math.random() * triviaArray.length)];
    const allAnswers = [randomTrivia.correct_answer, ...randomTrivia.incorrect_answers];

    console.debug("No unused trivia questions available, returning a random question");
    return {
      question: decodeHtmlEntities(randomTrivia.question),
      category: decodeHtmlEntities(randomTrivia.category),
      difficulty: capitalize(randomTrivia.difficulty),
      correct_answer: decodeHtmlEntities(randomTrivia.correct_answer),
      answers: shuffleArray(allAnswers).map((answer) => decodeHtmlEntities(answer)),
    };
  } catch (error) {
    console.error("Error fetching trivia", error);
    return null;
  }
}

/**
 * Creates a simple hash of the question text to use as a unique identifier
 */
function hashQuestion(question: string): string {
  let hash = 0;
  for (let i = 0; i < question.length; i++) {
    const char = question.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash.toString();
}

/**
 * Shuffles an array using Fisher-Yates algorithm
 */
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Decodes HTML entities in the text (e.g. &quot; to ")
 */
function decodeHtmlEntities(text: string): string {
  const entities: Record<string, string> = {
    "&amp;": "&",
    "&lt;": "<",
    "&gt;": ">",
    "&quot;": '"',
    "&#039;": "'",
    "&apos;": "'",
    "&#39;": "'",
    "&nbsp;": " ",
  };

  return text.replace(/&([^;]+);/g, (match, entity) => {
    if (entities[match]) {
      return entities[match];
    }
    if (entity.startsWith("#x")) {
      // Hexadecimal character reference
      return String.fromCodePoint(Number.parseInt(entity.slice(2), 16));
    }
    if (entity.startsWith("#")) {
      // Decimal character reference
      return String.fromCodePoint(Number.parseInt(entity.slice(1), 10));
    }
    return match;
  });
}

function capitalize(string: string): string {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

export function getDifficultyColor(difficulty: string): number {
  switch (difficulty.toLowerCase()) {
    case "easy":
      return 0x00ff00; // Green
    case "medium":
      return 0xffa500; // Orange
    case "hard":
      return 0xff0000; // Red
    default:
      return 0x0099ff; // Blue
  }
}
