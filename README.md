# GenAI Chat UI - MVP

A powerful, multi-LLM chat interface that lets you seamlessly switch between different AI providers (OpenAI, Anthropic Claude, Google Gemini) with project organization and chat persistence. Built with Next.js, React, TypeScript, and Tailwind CSS.

## 🚀 MVP Features

### Multi-LLM Support
- **3 LLM Providers**: OpenAI (GPT-4, GPT-4o-mini, GPT-3.5-turbo), Anthropic (Claude 3.5 Sonnet, Claude 3 Opus, etc.), Google (Gemini 1.5 Pro, Gemini 1.5 Flash)
- **Easy Switching**: Switch between providers and models with a simple dropdown
- **Visual Indicators**: See which providers have API keys configured

### API Key Management
- **Secure Storage**: API keys are encrypted and stored locally in your browser
- **Validation**: Test API keys before saving
- **Per-Provider Keys**: Configure separate keys for each LLM provider
- **Settings Page**: Dedicated UI for managing all API keys

### Project System
- **Organize Chats**: Create multiple projects to organize your conversations
- **Project Sidebar**: Easy navigation between projects
- **Project Management**: Create, rename, and delete projects

### Chat Persistence
- **Auto-Save**: Chats are automatically saved as you type
- **Chat History**: View and load previous conversations
- **Project-Based**: Chats are organized by project
- **Chat Management**: Rename and delete chats

### Model Parameters
- **Temperature Control**: Adjust creativity/randomness (0-2)
- **Max Tokens**: Set maximum response length
- **Persistent Settings**: Parameters are saved with each chat

### Modern UI/UX
- **Beautiful Interface**: Clean, modern design with smooth animations
- **Real-time Streaming**: See responses as they're generated
- **Responsive Design**: Works seamlessly on desktop and mobile
- **Dark Mode Ready**: Includes dark mode support

## 🛠️ Tech Stack

- **Next.js 14** - React framework with App Router
- **TypeScript** - Type safety throughout
- **Tailwind CSS** - Utility-first CSS framework
- **Radix UI** - Accessible component primitives
- **Lucide React** - Beautiful icons
- **crypto-js** - API key encryption
- **date-fns** - Date formatting

## 📦 Installation

### Prerequisites

- Node.js 18+ and npm/yarn/pnpm
- API keys for at least one LLM provider:
  - OpenAI: [Get API Key](https://platform.openai.com/api-keys)
  - Anthropic: [Get API Key](https://console.anthropic.com/)
  - Google: [Get API Key](https://makersuite.google.com/app/apikey)

### Setup

1. **Clone and install dependencies:**

```bash
npm install
```

2. **Run the development server:**

```bash
npm run dev
```

3. **Open your browser:**

Navigate to [http://localhost:3000](http://localhost:3000)

4. **Configure API Keys:**

   - Click the "Settings" button in the header
   - Enter your API keys for the providers you want to use
   - Optionally validate each key
   - Click "Save Settings"

## 🎯 Quick Start Guide

### 1. Configure API Keys

1. Go to **Settings** (click the gear icon in the header)
2. Enter your API keys for one or more providers
3. Click **Validate** to test each key
4. Click **Save Settings**

### 2. Create a Project

1. In the **Projects** sidebar, click **New Project**
2. Enter a project name (e.g., "Research", "Code Help")
3. Click **Create**

### 3. Start a Chat

1. In the **Chats** sidebar, click **New Chat**
2. Select your preferred LLM from the dropdown in the header
3. Type your message and press Enter
4. Your chat will auto-save as you use it

### 4. Switch LLMs Mid-Conversation

1. Click the **LLM selector** in the header (shows current provider/model)
2. Select a different provider or model
3. Continue your conversation - each message uses the selected LLM

### 5. Adjust Model Parameters

1. Click **Parameters** in the header to expand the panel
2. Adjust **Temperature** (0-2) for creativity
3. Set **Max Tokens** to limit response length
4. Changes apply to new messages

## 📁 Project Structure

```
├── app/
│   ├── api/
│   │   ├── chat/
│   │   │   └── route.ts           # Chat API endpoint (multi-LLM support)
│   │   └── settings/
│   │       └── route.ts           # Settings API (key validation)
│   ├── settings/
│   │   └── page.tsx               # Settings page
│   ├── globals.css                # Global styles
│   ├── layout.tsx                 # Root layout with providers
│   └── page.tsx                   # Main chat page
├── components/
│   ├── chat/                      # Chat components
│   ├── chats/                     # Chat list component
│   ├── llm/                       # LLM selector component
│   ├── projects/                  # Project sidebar components
│   ├── settings/                  # Settings components
│   └── ui/                        # Reusable UI components
├── lib/
│   ├── llm/
│   │   ├── providers/             # LLM provider implementations
│   │   │   ├── base.ts           # Base provider interface
│   │   │   ├── openai.ts         # OpenAI implementation
│   │   │   ├── anthropic.ts      # Anthropic implementation
│   │   │   └── google.ts         # Google implementation
│   │   └── provider-factory.ts   # Provider registry
│   ├── contexts/
│   │   ├── llm-context.tsx       # LLM state management
│   │   └── project-context.tsx   # Project state management
│   ├── storage/
│   │   ├── settings.ts           # Settings storage (encrypted)
│   │   ├── projects.ts           # Project storage
│   │   └── chats.ts              # Chat storage
│   └── utils/
│       └── encryption.ts         # API key encryption
└── package.json
```

## 🔧 Configuration

### Environment Variables (Optional)

For development, you can set API keys in `.env.local`:

```bash
OPENAI_API_KEY=your_key_here
ANTHROPIC_API_KEY=your_key_here
GOOGLE_API_KEY=your_key_here
```

**Note**: The MVP primarily uses browser-based storage. Environment variables serve as fallbacks during development.

### Available Models

#### OpenAI
- `gpt-4o` - Latest and most capable
- `gpt-4o-mini` - Fast and cost-effective (default)
- `gpt-4-turbo` - High performance
- `gpt-4` - Standard GPT-4
- `gpt-3.5-turbo` - Fast and affordable

#### Anthropic Claude
- `claude-3-5-sonnet-20241022` - Latest Claude 3.5
- `claude-3-5-sonnet-20240620` - Claude 3.5 Sonnet
- `claude-3-opus-20240229` - Most capable
- `claude-3-sonnet-20240229` - Balanced performance
- `claude-3-haiku-20240307` - Fast and efficient

#### Google Gemini
- `gemini-2.5-pro` - Most capable (stable release) ⚠️ Very low free tier limits
- `gemini-2.5-flash` - Fast and efficient (supports up to 1M tokens) ✅ Recommended for free tier
- `gemini-2.0-flash` - Fast and versatile multimodal model

**Note**: For free tier usage, `gemini-2.5-flash` is recommended as it has much higher quota limits than `gemini-2.5-pro`.

## 🔒 Security Notes

- **API Keys**: Stored encrypted in browser localStorage
- **Local Storage**: All data is stored locally in your browser
- **No Server Storage**: API keys never leave your device (except to the LLM provider APIs)
- **Production**: For production use, consider implementing server-side key management

## 📝 Usage Tips

1. **Organize by Project**: Create separate projects for different topics or use cases
2. **Switch LLMs**: Different providers excel at different tasks - experiment!
3. **Adjust Temperature**: 
   - Low (0.1-0.3): More deterministic, good for factual queries
   - Medium (0.7): Balanced creativity (default)
   - High (1.5-2.0): More creative, good for brainstorming
4. **Chat Persistence**: Your chats auto-save, so you can safely close and reopen
5. **Multiple Conversations**: Each project can have multiple chats

## 🐛 Troubleshooting

For detailed troubleshooting information, see [TROUBLESHOOTING.md](./TROUBLESHOOTING.md).

### Quick Fixes

**API Key Errors:**
- **"API key is required"**: Go to Settings and configure your API keys
- **"API key validation failed"**: Check that your key is correct and has the right permissions
- **Rate Limit Errors**: You've exceeded your API quota - wait or upgrade your plan

**Storage Issues:**
- **Chats not saving**: Check browser localStorage quota (usually 5-10MB)
- **Data lost**: All data is stored locally - clearing browser data will delete it

**Build Errors:**
- Run `npm install` to ensure all dependencies are installed
- Check Node.js version (requires 18+)
- Clear `.next` folder and rebuild: `rm -rf .next && npm run build`

**Dropdown/UI Issues:**
- If dropdown menus are not clickable, see [TROUBLESHOOTING.md](./TROUBLESHOOTING.md#dropdown-menu-click-issues) for the solution

## 🚧 Known Limitations (MVP)

- **Local Storage Only**: Data stored in browser (not synced across devices)
- **No Export/Import**: Can't export chats or settings yet
- **No Search**: Can't search through chat history
- **No Sharing**: Can't share chats with others
- **Manual API Key Entry**: No OAuth integration

## 🔮 Future Enhancements

- Database integration (PostgreSQL/SQLite)
- User authentication
- Chat export/import
- Global search
- Dark/light mode toggle
- Keyboard shortcuts
- RAG/Knowledge base integration
- Workflow builder

## 📄 License

MIT

## 🤝 Contributing

Feel free to submit issues and enhancement requests!
