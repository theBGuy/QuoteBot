# QuoteBot

A feature-rich Discord bot that provides quotes, jokes, memes, trivia, and riddles. It <!-- features user scoring, leaderboards, and --> uses modern technologies like Redis for caching and PostgreSQL for persistent storage.

## Features

- **Quotes System**: Get random inspirational quotes and quote of the day
- **Joke System**: Fetch random jokes with setup and punchline delivery
- **Meme System**: Retrieve programming humor memes from Reddit
- **Trivia System**: Test your knowledge with random trivia questions
- **Riddle System**: Challenge yourself with brain teasers
<!-- - **Scoring System**: Earn points by correctly answering trivia and riddles -->
<!-- - **Leaderboards**: Compete with other server members -->
- **Both Slash Commands and Text Commands**: Flexible command interface

## Commands

| Command | Description |
|---------|-------------|
| `/quote` or `!quote` | Get an inspirational quote |
| `/qod` or `!qod` | Get quote of the day |
| `/quoteimg` or `!quoteimg` | Get a quote as an image |
| `/joke` or `!joke` | Get a random joke (delivered in two parts) |
| `/meme` or `!meme` | Get a programming humor meme |
| `/trivia` or `!trivia` | Answer a trivia question |
| `/riddle` or `!riddle` | Solve a riddle |
<!-- | `/scores` or `!scores` | View your score stats | -->
<!-- | `/leaderboard` or `!leaderboard` | View server leaderboard | -->

## Technology Stack

- **TypeScript**: For type-safe code
- **Discord.js**: For Discord API integration
- **Redis**: For efficient caching
- **PostgreSQL**: For persistent data storage
- **Prisma ORM**: For database operations
- **Docker**: For containerization and deployment

## Setup

### Prerequisites

- Node.js 22.14.0 or higher
- Docker and Docker Compose (for containerized deployment)
- PostgreSQL database
- Redis instance

### Environment Variables

Create a `.env` file in the root directory with the following variables:

```
# Discord Bot Configuration
CLIENT_TOKEN=your_discord_bot_token
CLIENT_ID=your_discord_application_id

# Database Configuration
DATABASE_URL=postgresql://postgres:prisma@localhost:5432/quote-bot?schema=public
DATABASE_PORT=5432

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379

# Node Environment
NODE_ENV=development
```

### Installation

1. Clone the repository
```
git clone https://github.com/theBGuy/QuoteBot.git
cd QuoteBot
```
2. Install dependencies
```
npm install
```
3. Generate Prisma client
```
npx prisma generate
```
4. Set up the database
```
npx prisma db push
```
5. Register slash commands
```
npm run register-commands
```
6. Start the bot
```
npm run dev
```

### Docker Deployment

To deploy using Docker:

```
docker-compose up -d
```

To develop using Docker:

```
docker compose up --watch
```

## Architecture

The codebase is organized as follows:

- **controllers**: API integration with external services
- **services**: Business logic for bot features
- **libs**: Shared utilities
- **slash-commands**: Slash command implementation
- **prisma**: Database schema and migrations

## Caching Strategy

QuoteBot uses Redis for efficient caching:

- Quotes are cached for 24 hours
- Joke and meme usage is tracked to avoid repetition
- Quote of the day refreshes at midnight
- Trivia questions are cached and tracked to avoid repeats

<!-- ## Scoring System

Users earn points when interacting with the bot:

- **Trivia**: 5 points for correct answers
- **Riddles**: 10 points for correct answers
- **Jokes**: 1 point for interactions -->

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Thanks to the creators of the various APIs used by this bot
- ZenQuotes.io for quote data
- JokeAPI for jokes
- OpenTriviaDB for trivia questions
- Reddit for memes

---

Made with ❤️ and TypeScript