# GenAI Chat UI

A sleek, modern chat interface for interacting with Large Language Models (LLMs). Built with Next.js, React, TypeScript, and Tailwind CSS.

## Features

- 🎨 **Beautiful UI** - Clean, modern interface with smooth animations
- ⚡ **Real-time Streaming** - See responses as they're generated
- 📱 **Responsive Design** - Works seamlessly on desktop and mobile
- 🔒 **Type Safe** - Built with TypeScript for better development experience
- 🌙 **Dark Mode Ready** - Includes dark mode support (can be extended)
- 🎯 **Customizable** - Easy to modify and extend

## Tech Stack

- **Next.js 14** - React framework with App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Utility-first CSS framework
- **Radix UI** - Accessible component primitives
- **Lucide React** - Beautiful icons

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn/pnpm
- OpenAI API key (or configure another LLM provider)

### Installation

1. **Clone and install dependencies:**

```bash
npm install
# or
yarn install
# or
pnpm install
```

2. **Set up environment variables:**

Copy the example environment file and add your API key:

```bash
cp .env.example .env.local
```

Then edit `.env.local` and add your OpenAI API key:

```
OPENAI_API_KEY=your_actual_api_key_here
OPENAI_MODEL=gpt-4o-mini
```

3. **Run the development server:**

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

4. **Open your browser:**

Navigate to [http://localhost:3000](http://localhost:3000)

## Configuration

### OpenAI Models

You can change the model by setting the `OPENAI_MODEL` environment variable:

- `gpt-4o-mini` (default, fast and cost-effective)
- `gpt-4o` (more capable)
- `gpt-4-turbo`
- `gpt-3.5-turbo`

### Customizing the UI

The UI is built with modular components:

- `components/chat/chat-container.tsx` - Main chat container
- `components/chat/chat-message.tsx` - Individual message bubbles
- `components/chat/chat-input.tsx` - Message input field
- `components/chat/chat-header.tsx` - Header with controls

You can easily customize colors, spacing, and behavior by editing these components or the Tailwind configuration.

## Project Structure

```
├── app/
│   ├── api/
│   │   └── chat/
│   │       └── route.ts       # API endpoint for chat
│   ├── globals.css            # Global styles
│   ├── layout.tsx             # Root layout
│   └── page.tsx               # Main chat page
├── components/
│   ├── chat/                  # Chat-specific components
│   └── ui/                    # Reusable UI components
├── lib/
│   └── utils.ts               # Utility functions
└── public/                    # Static assets
```

## Extending to Other LLM Providers

To use a different LLM provider, modify `app/api/chat/route.ts`:

1. Update the API endpoint URL
2. Adjust the request format
3. Handle the response stream format

Example for Anthropic Claude:

```typescript
const response = await fetch("https://api.anthropic.com/v1/messages", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "x-api-key": process.env.ANTHROPIC_API_KEY!,
    "anthropic-version": "2023-06-01",
  },
  body: JSON.stringify({
    model: "claude-3-opus-20240229",
    max_tokens: 1024,
    messages: messages,
    stream: true,
  }),
})
```

## License

MIT

## Contributing

Feel free to submit issues and enhancement requests!

