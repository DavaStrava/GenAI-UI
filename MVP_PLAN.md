# MVP Plan: 1-Week Delivery

## 🎯 MVP Goal

Deliver a **functional multi-LLM chat interface** that demonstrates the core value proposition: **seamlessly switching between different LLM providers** with basic project organization and chat persistence.

**Target:** Working demo that can be shown to stakeholders and early users.

---

## ✅ MVP Scope (What's Included)

### Core Features

1. **Multi-LLM Support** (FR 1.1)
   - Support for **3 LLM providers**: OpenAI, Anthropic (Claude), Google (Gemini)
   - LLM selector in UI (dropdown or sidebar)
   - Model selection per provider
   - Visual status indicators

2. **API Key Management** (FR 1.1.2)
   - Settings page for API key input
   - Secure storage (localStorage for MVP, encrypted)
   - API key validation on save

3. **Basic Project System** (FR 4.1, 5.1)
   - Create/rename/delete projects
   - Project sidebar/navigation
   - Active project indicator
   - Project-based chat organization

4. **Chat Persistence** (FR 5.1)
   - Save chats to localStorage (or simple JSON file)
   - Load previous chats
   - Chat list in sidebar
   - Basic chat metadata (name, date, LLM used)

5. **Model Parameters** (FR 1.1.4)
   - Temperature control (slider)
   - Max tokens setting
   - Parameters persist per chat session

### Out of Scope (For Later)

- ❌ RAG/Knowledge Bases
- ❌ Workflow Builder
- ❌ Document Editor
- ❌ Global Search
- ❌ Dark/Light Mode Toggle
- ❌ Keyboard Shortcuts
- ❌ Database (using localStorage for MVP)

---

## 📅 7-Day Sprint Breakdown

### **Day 1: Multi-LLM Provider Abstraction**

**Goal:** Refactor existing OpenAI code to support multiple providers.

**Tasks:**
- [ ] Create LLM provider abstraction layer
  - `lib/llm/providers/base.ts` - Base provider interface
  - `lib/llm/providers/openai.ts` - OpenAI implementation (refactor existing)
  - `lib/llm/providers/anthropic.ts` - Anthropic Claude implementation
  - `lib/llm/providers/google.ts` - Google Gemini implementation
- [ ] Create provider factory/registry
  - `lib/llm/provider-factory.ts`
- [ ] Update `/api/chat/route.ts` to accept `provider` and `model` parameters
- [ ] Test all 3 providers with streaming

**Deliverable:** Can switch between providers via API (test with Postman/curl)

**Time Estimate:** 6-8 hours

---

### **Day 2: Settings & API Key Management**

**Goal:** Build UI for managing API keys and model selection.

**Tasks:**
- [ ] Create settings page (`/app/settings/page.tsx`)
  - API key input fields for each provider
  - Model selection dropdowns
  - Save/cancel buttons
- [ ] Create settings storage service
  - `lib/storage/settings.ts` - localStorage wrapper with encryption
  - Store API keys securely (use simple encryption or at minimum, base64)
- [ ] Create settings API endpoint (`/api/settings/route.ts`)
  - GET: Retrieve settings
  - POST: Save settings
  - Validate API keys (optional: test connection)
- [ ] Add settings link/button in header
- [ ] Update chat API to use stored API keys

**Deliverable:** Can configure API keys via UI, keys persist across sessions

**Time Estimate:** 6-8 hours

---

### **Day 3: LLM Selector UI Component**

**Goal:** Add LLM selection to the main chat interface.

**Tasks:**
- [ ] Create `LLMSelector` component
  - Dropdown or sidebar panel
  - Show available providers
  - Show available models per provider
  - Display connection status
  - Show current selection
- [ ] Integrate into chat header or sidebar
- [ ] Add React context for active LLM (`lib/contexts/llm-context.tsx`)
- [ ] Update chat API call to use selected LLM
- [ ] Add visual feedback (loading states, error handling)

**Deliverable:** Can switch LLMs from UI, selection persists during session

**Time Estimate:** 5-6 hours

---

### **Day 4: Basic Project System**

**Goal:** Implement project creation and management.

**Tasks:**
- [ ] Create project storage service
  - `lib/storage/projects.ts` - localStorage wrapper
  - Project data structure: `{ id, name, createdAt, updatedAt }`
- [ ] Create project sidebar component
  - `components/projects/project-sidebar.tsx`
  - Project list
  - Create new project button
  - Active project indicator
  - Project context menu (rename, delete)
- [ ] Create project context (`lib/contexts/project-context.tsx`)
- [ ] Add project creation modal
- [ ] Integrate sidebar into main layout
- [ ] Update layout to accommodate sidebar

**Deliverable:** Can create/manage projects, active project is tracked

**Time Estimate:** 6-7 hours

---

### **Day 5: Chat Persistence**

**Goal:** Save and load chat sessions within projects.

**Tasks:**
- [ ] Create chat storage service
  - `lib/storage/chats.ts` - localStorage wrapper
  - Chat data structure: `{ id, projectId, name, messages, llmProvider, llmModel, createdAt, updatedAt }`
- [ ] Update chat state management
  - Save chat on message send
  - Auto-generate chat names (first message preview)
  - Associate chats with active project
- [ ] Create chat list component
  - `components/chats/chat-list.tsx`
  - Display chats for active project
  - Chat item with name, date, LLM indicator
  - Click to load chat
- [ ] Add chat management (rename, delete)
- [ ] Update main page to load chat on selection
- [ ] Add "New Chat" button

**Deliverable:** Chats save automatically, can load previous chats, organized by project

**Time Estimate:** 6-7 hours

---

### **Day 6: Model Parameters & Polish**

**Goal:** Add model parameter controls and UI polish.

**Tasks:**
- [ ] Create model parameters panel
  - `components/settings/model-parameters.tsx`
  - Temperature slider (0-2)
  - Max tokens input
  - Top-P slider (optional)
- [ ] Integrate parameters into chat API
- [ ] Add parameters to chat storage
- [ ] UI polish:
  - Improve sidebar styling
  - Add loading states
  - Improve error messages
  - Add empty states
- [ ] Add chat metadata display (LLM used, parameters)
- [ ] Test edge cases (no API keys, invalid keys, network errors)

**Deliverable:** Full feature set working, polished UI

**Time Estimate:** 5-6 hours

---

### **Day 7: Testing, Bug Fixes & Documentation**

**Goal:** Ensure MVP is stable and ready for demo.

**Tasks:**
- [ ] End-to-end testing
  - Test all 3 LLM providers
  - Test project creation/management
  - Test chat save/load
  - Test settings persistence
- [ ] Bug fixes
- [ ] Error handling improvements
- [ ] Update README with MVP features
- [ ] Create simple demo script/walkthrough
- [ ] Performance check (localStorage limits, etc.)
- [ ] Final UI polish

**Deliverable:** Stable MVP ready for demonstration

**Time Estimate:** 4-6 hours

---

## 🏗️ Technical Architecture

### Storage Strategy (MVP)

**Use localStorage** for simplicity:
- Settings: `genai_settings`
- Projects: `genai_projects`
- Chats: `genai_chats_{projectId}`

**Structure:**
```typescript
// Settings
{
  apiKeys: {
    openai: string,
    anthropic: string,
    google: string
  },
  defaultProvider: string,
  defaultModel: string
}

// Projects
[
  { id: string, name: string, createdAt: Date, updatedAt: Date }
]

// Chats (per project)
[
  {
    id: string,
    name: string,
    messages: Message[],
    llmProvider: string,
    llmModel: string,
    temperature: number,
    maxTokens: number,
    createdAt: Date,
    updatedAt: Date
  }
]
```

### File Structure

```
lib/
  llm/
    providers/
      base.ts
      openai.ts
      anthropic.ts
      google.ts
    provider-factory.ts
  storage/
    settings.ts
    projects.ts
    chats.ts
  contexts/
    llm-context.tsx
    project-context.tsx
  utils/
    encryption.ts (simple encryption for API keys)

components/
  llm/
    llm-selector.tsx
  projects/
    project-sidebar.tsx
    project-item.tsx
    new-project-modal.tsx
  chats/
    chat-list.tsx
    chat-item.tsx
  settings/
    model-parameters.tsx

app/
  settings/
    page.tsx
  api/
    chat/
      route.ts (updated)
    settings/
      route.ts (new)
```

---

## 📦 Required Dependencies

```json
{
  "dependencies": {
    // Existing dependencies...
    
    // For API key encryption (simple)
    "crypto-js": "^4.2.0",
    
    // For date formatting
    "date-fns": "^3.0.0"
  },
  "devDependencies": {
    "@types/crypto-js": "^4.2.0"
  }
}
```

**Note:** No database needed for MVP - using localStorage.

---

## 🎨 UI/UX Requirements

### Layout Changes

```
┌─────────────────────────────────────────┐
│ Header (LLM Selector | Settings | Clear)│
├──────────┬──────────────────────────────┤
│          │                              │
│ Projects │     Chat Messages            │
│ Sidebar  │                              │
│          │                              │
│ - Proj 1 │                              │
│   - Chat1│                              │
│   - Chat2│                              │
│ - Proj 2 │                              │
│          │                              │
│ [+ New]  │                              │
│          │                              │
├──────────┴──────────────────────────────┤
│           Chat Input                    │
└─────────────────────────────────────────┘
```

### Key UI Components

1. **LLM Selector** (in header or sidebar)
   - Dropdown with provider icons
   - Model selection nested
   - Status indicator (connected/disconnected)

2. **Project Sidebar**
   - Collapsible
   - Project list with active indicator
   - Chat list under each project
   - "New Project" button

3. **Settings Page**
   - Tabbed or sectioned
   - API keys section
   - Model parameters section
   - Save button

---

## ✅ Success Criteria

### MVP is Complete When:

- [x] User can configure API keys for 3 LLM providers
- [x] User can switch between LLMs from the UI
- [x] User can create and manage projects
- [x] Chats are automatically saved and organized by project
- [x] User can load previous chats
- [x] Model parameters (temperature, max tokens) are adjustable
- [x] All features work without errors
- [x] UI is clean and intuitive
- [x] Can demonstrate end-to-end workflow

### Demo Script

1. **Setup (30 seconds)**
   - Open settings
   - Add API keys for OpenAI and Claude
   - Save settings

2. **Project Creation (30 seconds)**
   - Create new project "Research Project"
   - See it appear in sidebar

3. **Multi-LLM Chat (2 minutes)**
   - Start new chat
   - Select OpenAI GPT-4
   - Ask: "Explain quantum computing"
   - Switch to Claude
   - Ask: "Continue from where OpenAI left off"
   - Show how responses differ

4. **Chat Persistence (1 minute)**
   - Create another chat
   - Close browser tab
   - Reopen, select project
   - Load previous chat
   - Show messages are preserved

5. **Project Organization (30 seconds)**
   - Create second project
   - Show chats are separated by project

**Total Demo Time:** ~5 minutes

---

## 🚨 Risks & Mitigations

### Risk 1: API Rate Limits
**Mitigation:** Add rate limit error handling, show user-friendly messages

### Risk 2: localStorage Size Limits (~5-10MB)
**Mitigation:** 
- Implement chat cleanup (keep last N chats per project)
- Add export/import functionality if needed
- Monitor storage usage

### Risk 3: API Key Security
**Mitigation:**
- Use simple encryption (crypto-js)
- Never log API keys
- Clear warnings about localStorage security
- Plan for proper encryption in v2

### Risk 4: Provider API Changes
**Mitigation:**
- Abstract provider interfaces well
- Test with multiple models
- Have fallback error handling

### Risk 5: Time Overrun
**Mitigation:**
- Prioritize: Multi-LLM > Projects > Persistence > Parameters
- Cut features if needed (parameters can be Day 7)
- Focus on core demo flow

---

## 📊 MVP vs Full PRD

| Feature | MVP | Full PRD |
|---------|-----|----------|
| Multi-LLM Support | ✅ 3 providers | ✅ All providers |
| API Key Management | ✅ Basic (localStorage) | ✅ Encrypted DB |
| Project System | ✅ Basic | ✅ Full with KB |
| Chat Persistence | ✅ localStorage | ✅ Database |
| Model Parameters | ✅ Basic (temp, tokens) | ✅ Full (all params) |
| RAG/Knowledge Base | ❌ | ✅ |
| Workflow Builder | ❌ | ✅ |
| Document Editor | ❌ | ✅ |
| Global Search | ❌ | ✅ |
| Dark Mode | ❌ | ✅ |

---

## 🚀 Post-MVP Next Steps

After MVP delivery, prioritize based on feedback:

1. **Week 2-3:** Database migration (SQLite/PostgreSQL)
2. **Week 3-4:** Basic document editor
3. **Week 4-5:** Knowledge base upload (simple file storage)
4. **Week 5-6:** RAG integration
5. **Week 7+:** Workflow builder

---

## 📝 Daily Standup Template

**Day X Progress:**
- ✅ Completed: [list]
- 🚧 In Progress: [list]
- ⚠️ Blockers: [list]
- 📋 Next: [list]

---

## 🎯 Definition of Done (Per Feature)

- [ ] Code written and reviewed
- [ ] Feature works end-to-end
- [ ] Error handling implemented
- [ ] UI is polished
- [ ] Tested manually
- [ ] No console errors
- [ ] Works across browsers (Chrome, Firefox, Safari)

---

**Total Estimated Time:** 35-45 hours (1 week with focused work)

**Key Success Factor:** Focus on core demo flow, defer nice-to-haves to post-MVP.






