# Demo Walkthrough

This guide walks you through demonstrating the MVP features of GenAI Chat UI.

## Demo Script (5 minutes)

### Step 1: Setup (30 seconds)

1. Open the application at `http://localhost:3000`
2. Click **Settings** in the header
3. Enter API keys for at least 2 providers (OpenAI and Google, or OpenAI and Anthropic recommended)
4. Click **Validate** to test each key
5. Click **Save Settings**
6. Click **Back to Chat**

**What to show**: "Here we configure API keys for multiple LLM providers. Keys are encrypted and stored securely in your browser."

---

### Step 2: Project Creation (30 seconds)

1. In the **Projects** sidebar, click **New Project**
2. Enter project name: "Research Project"
3. Click **Create**
4. Notice the project appears in the sidebar

**What to show**: "Projects help organize your conversations. You can create different projects for different topics or use cases."

---

### Step 3: Multi-LLM Chat (2 minutes)

1. In the **Chats** sidebar, click **New Chat**
2. Click the **LLM Selector** in the header (shows "OpenAI / gpt-4o-mini")
3. Select **OpenAI** → **gpt-4o-mini** (if not already selected)
4. Ask: "Explain quantum computing in simple terms"
5. Wait for response
6. **While response is streaming**, click **LLM Selector** again
7. Switch to another provider:
   - **Anthropic** → **claude-3-5-sonnet-20241022** (recommended - most reliable)
   - **Google** → **gemini-2.0-flash** (if available, more reliable than 2.5-flash)
   - **Note**: `gemini-2.5-flash` has known issues with empty responses. `gemini-2.5-pro` has very low free tier limits.
8. Ask: "Continue from where the previous response left off"
9. Compare the responses

**What to show**: "Notice how we can switch between providers mid-conversation. Each provider has its own strengths - OpenAI might be faster, Google/Gemini might be more detailed, Claude might be better at analysis."

**Note**: 
- If Google models hang or return no response, this is a known issue - switch to Anthropic or OpenAI
- If you get a quota error, try a different model or provider

---

### Step 4: Model Parameters (1 minute)

1. Click **Parameters** button in the header to expand
2. Show **Temperature** slider (currently 0.7)
3. Adjust to **0.2** (more deterministic)
4. Ask: "Write a haiku about coding"
5. Adjust temperature to **1.5** (more creative)
6. Ask: "Write another haiku about coding"
7. Compare the responses

**What to show**: "Temperature controls creativity. Lower values give more focused, consistent responses. Higher values are more creative and varied."

---

### Step 5: Chat Persistence (1 minute)

1. Notice the current chat has a name (auto-generated from first message)
2. Send a few more messages
3. Click **New Chat** button
4. Start a new conversation
5. In the **Chats** sidebar, click on the previous chat
6. Show that all messages are preserved
7. To rename a chat, either:
   - **Right-click** on the chat in the sidebar, then click **Rename**
   - **Hover** over the chat to see the three-dot menu (⋮), click it, then click **Rename**
8. Rename the chat to something descriptive (press Enter to save, Escape to cancel)

**What to show**: "Chats auto-save as you use them. You can have multiple conversations in each project, and they persist across browser sessions."

---

### Step 6: Project Organization (30 seconds)

1. Create a second project: "Code Help"
2. Switch between projects
3. Show that chats are separated by project
4. Show project context menu (rename, delete)

**What to show**: "Projects keep your conversations organized. Each project has its own chat list, perfect for different use cases."

---

## Key Features to Highlight

### ✨ Multi-LLM Support
- **Show**: Switch between providers with a single click
- **Explain**: Different providers excel at different tasks
- **Demo**: Ask the same question to different providers and compare

### 🔐 Secure API Key Management
- **Show**: Settings page with encrypted storage
- **Explain**: Keys are encrypted and stored locally
- **Demo**: Validate a key to show it works

### 📁 Project Organization
- **Show**: Multiple projects with separate chats
- **Explain**: Organize conversations by topic or use case
- **Demo**: Create a project and show chat isolation

### 💾 Auto-Save & Persistence
- **Show**: Chats save automatically
- **Explain**: No need to manually save - it just works
- **Demo**: Close and reopen a chat to show persistence

### ⚙️ Model Parameters
- **Show**: Temperature and max tokens controls
- **Explain**: Fine-tune responses to your needs
- **Demo**: Same prompt with different temperatures

## Common Demo Scenarios

### Scenario 1: Research Assistant
1. Create "Research" project
2. Use OpenAI for quick fact-checking
3. Switch to Google/Gemini or Claude for deeper analysis
4. Compare responses side-by-side

### Scenario 2: Code Help
1. Create "Code Help" project
2. Use GPT-4 for code generation
3. Use Google/Gemini or Claude for code review
4. Show how different models complement each other

### Scenario 3: Creative Writing
1. Create "Writing" project
2. Set temperature to 1.5 (high creativity)
3. Use Google/Gemini for brainstorming
4. Switch to OpenAI or Claude for refinement

## Troubleshooting During Demo

If something goes wrong:

- **API Key Error**: "Let me check the settings - ah, we need to configure the API key first"
- **Quota/Rate Limit Error (429)**: 
  - Google: "The free tier quota for this model has been exceeded. Let's try `gemini-2.5-flash` instead, which has higher limits, or switch to another provider."
  - General: "This might be a rate limit - let's try a different provider or model"
- **No Response**: "This might be a rate limit - let's try a different provider"
- **Loading Slow**: "The response is streaming, so you can see it in real-time as it generates"

## Closing Points

1. **"All your data stays local"** - Everything is stored in your browser
2. **"No account needed"** - Just configure API keys and start chatting
3. **"Easy to extend"** - Built with a modular architecture
4. **"Multi-provider"** - Never locked into a single vendor

## Total Demo Time: ~5 minutes

This gives a comprehensive overview while keeping it concise and engaging!



