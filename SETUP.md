# Quick Setup Guide

## What You Have

I've created a complete, production-ready chat UI for LLMs with:

✅ **Modern Tech Stack**
- Next.js 14 with App Router
- TypeScript for type safety
- Tailwind CSS for styling
- Beautiful, accessible UI components

✅ **Features**
- Real-time streaming responses
- Clean, modern interface
- Responsive design
- Auto-scrolling chat
- Message history
- Clear conversation button

## What You Need to Get Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Create a `.env.local` file in the root directory:

```bash
OPENAI_API_KEY=your_actual_api_key_here
OPENAI_MODEL=gpt-4o-mini
```

**To get an OpenAI API key:**
1. Go to https://platform.openai.com/api-keys
2. Sign up or log in
3. Create a new API key
4. Copy it into your `.env.local` file

### 3. Run the Development Server

```bash
npm run dev
```

### 4. Open in Browser

Navigate to: **http://localhost:3000**

## Project Structure

```
GenAI UI/
├── app/
│   ├── api/chat/route.ts    # Backend API endpoint (handles LLM requests)
│   ├── page.tsx             # Main chat interface
│   ├── layout.tsx           # Root layout
│   └── globals.css          # Global styles
├── components/
│   ├── chat/                # Chat-specific components
│   │   ├── chat-container.tsx
│   │   ├── chat-header.tsx
│   │   ├── chat-input.tsx
│   │   └── chat-message.tsx
│   └── ui/                  # Reusable UI components
├── lib/
│   └── utils.ts             # Utility functions
└── package.json
```

## Customization Tips

### Change Colors
Edit `app/globals.css` - modify the CSS variables in the `:root` section.

### Change Model
Update `OPENAI_MODEL` in `.env.local`:
- `gpt-4o-mini` - Fast, cost-effective (default)
- `gpt-4o` - More capable
- `gpt-4-turbo` - Latest GPT-4

### Modify UI Components
All chat components are in `components/chat/` - customize as needed!

## Troubleshooting

### "OpenAI API key not configured"
- Make sure you created `.env.local` (not `.env`)
- Restart the dev server after creating the file
- Check that your API key is valid

### Port 3000 already in use
```bash
npm run dev -- -p 3001
```

### Build Errors
Make sure all dependencies are installed:
```bash
rm -rf node_modules package-lock.json
npm install
```

## Next Steps

1. ✅ Install dependencies: `npm install`
2. ✅ Add your API key to `.env.local`
3. ✅ Run: `npm run dev`
4. 🎉 Start chatting!

## Need Help?

- Check the README.md for detailed documentation
- Review the component files to understand the architecture
- Customize the UI to match your brand/needs

