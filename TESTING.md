# Testing Guide

This document outlines how to test the MVP features of GenAI Chat UI.

## Pre-Testing Checklist

- [ ] All dependencies installed (`npm install`)
- [ ] Build succeeds (`npm run build`)
- [ ] Development server starts (`npm run dev`)
- [ ] At least one API key configured

## Test Scenarios

### 1. API Key Management

**Test Settings Storage**
- [ ] Navigate to Settings page
- [ ] Enter API key for OpenAI
- [ ] Click Validate - should show success
- [ ] Save settings
- [ ] Refresh page - key should persist
- [ ] Verify key is encrypted in localStorage

**Test Multiple Providers**
- [ ] Configure keys for all 3 providers
- [ ] Validate each key
- [ ] Save all keys
- [ ] Verify all keys persist after refresh

**Test Invalid Keys**
- [ ] Enter invalid API key
- [ ] Click Validate - should show error
- [ ] Error message should be clear

### 2. Multi-LLM Provider Switching

**Test Provider Selection**
- [ ] Click LLM selector in header
- [ ] Should show all 3 providers
- [ ] Select OpenAI
- [ ] Should show available models
- [ ] Select a model
- [ ] Header should update to show selection

**Test Provider Switching Mid-Conversation**
- [ ] Start chat with OpenAI
- [ ] Send a message
- [ ] Switch to Anthropic
- [ ] Send another message
- [ ] Both messages should use correct providers

**Test API Key Indicators**
- [ ] Providers without API keys should show warning icon
- [ ] Providers with keys should not show warning
- [ ] Current provider without key should show error on send

### 3. Chat Functionality

**Test Basic Chat**
- [ ] Start new chat
- [ ] Send message
- [ ] Should receive streaming response
- [ ] Response should appear in real-time
- [ ] Loading indicator should work correctly

**Test Streaming**
- [ ] Send a long prompt
- [ ] Response should stream character by character
- [ ] Should not have duplicate content
- [ ] Should complete properly

**Test Error Handling**
- [ ] Send message without API key configured
- [ ] Should show clear error message
- [ ] Send message with invalid API key
- [ ] Should show API error message

### 4. Chat Persistence

**Test Auto-Save**
- [ ] Start new chat
- [ ] Send 2-3 messages
- [ ] Wait 1-2 seconds
- [ ] Check localStorage - chat should be saved
- [ ] Chat should appear in chat list

**Test Chat Loading**
- [ ] Create a chat with multiple messages
- [ ] Click on different chat
- [ ] Click back on original chat
- [ ] All messages should load correctly

**Test Chat Naming**
- [ ] Start new chat
- [ ] First message: "What is React?"
- [ ] Chat name should auto-generate from first message
- [ ] Name should be truncated if too long

**Test Chat Rename**
- [ ] Right-click on chat (or click menu)
- [ ] Select Rename
- [ ] Enter new name
- [ ] Name should update in list

**Test Chat Delete**
- [ ] Create a test chat
- [ ] Delete it via context menu
- [ ] Should be removed from list
- [ ] If it was active, should switch to another chat

### 5. Project Management

**Test Project Creation**
- [ ] Click "New Project" button
- [ ] Enter project name
- [ ] Create project
- [ ] Should appear in sidebar
- [ ] Should become active project

**Test Project Switching**
- [ ] Create 2 projects
- [ ] Switch between them
- [ ] Each should have separate chat list
- [ ] Active project indicator should update

**Test Project Rename**
- [ ] Create project
- [ ] Right-click → Rename
- [ ] Enter new name
- [ ] Name should update

**Test Project Delete**
- [ ] Create 2 projects
- [ ] Delete one project
- [ ] Should be removed from list
- [ ] If deleted project was active, should switch to other
- [ ] Cannot delete last remaining project

**Test Default Project**
- [ ] On first load, should have "Default Project"
- [ ] Cannot delete if it's the only project

### 6. Model Parameters

**Test Temperature Control**
- [ ] Click "Parameters" button in header
- [ ] Panel should expand
- [ ] Adjust temperature slider
- [ ] Value should update in display
- [ ] Send message - should use new temperature

**Test Max Tokens**
- [ ] In parameters panel
- [ ] Enter max tokens value (e.g., 100)
- [ ] Send message
- [ ] Response should be limited to max tokens
- [ ] Clear max tokens field
- [ ] Send message - should have no limit

**Test Parameter Persistence**
- [ ] Set temperature to 1.0
- [ ] Send message
- [ ] Start new chat
- [ ] Parameters should persist across chats
- [ ] Chat should save parameters when created

### 7. UI/UX Testing

**Test Responsive Design**
- [ ] Resize browser window
- [ ] UI should adapt properly
- [ ] Sidebars should remain usable
- [ ] Chat input should be accessible

**Test Loading States**
- [ ] Send message
- [ ] Should show loading indicator
- [ ] Should show streaming dots
- [ ] Should hide when complete

**Test Empty States**
- [ ] New chat - should show welcome message
- [ ] No projects - should show default project
- [ ] No chats in project - should show empty message

**Test Navigation**
- [ ] All buttons should be clickable
- [ ] Dropdowns should open/close properly
- [ ] Modals should work correctly
- [ ] Settings page should be accessible

### 8. Error Scenarios

**Test Network Errors**
- [ ] Disconnect internet
- [ ] Send message
- [ ] Should show network error

**Test API Rate Limits**
- [ ] Send many rapid messages
- [ ] If rate limited, should show clear error
- [ ] Should suggest waiting

**Test Invalid Input**
- [ ] Try to create project with empty name
- [ ] Should prevent creation
- [ ] Try to send empty message
- [ ] Should prevent sending

**Test Storage Limits**
- [ ] Create many chats with long messages
- [ ] Should handle gracefully
- [ ] Should not crash if localStorage is full

### 9. Edge Cases

**Test Rapid Provider Switching**
- [ ] Switch providers quickly while message is streaming
- [ ] Should handle gracefully

**Test Long Messages**
- [ ] Send very long message (1000+ characters)
- [ ] Should handle correctly

**Test Special Characters**
- [ ] Send message with emojis, special chars
- [ ] Should display correctly

**Test Concurrent Chats**
- [ ] Open multiple browser tabs
- [ ] Each should have independent state

## Automated Testing (Future)

Currently, the MVP focuses on manual testing. Future versions should include:

- [ ] Unit tests for storage functions
- [ ] Unit tests for provider implementations
- [ ] Integration tests for API routes
- [ ] E2E tests for critical flows
- [ ] Performance tests for streaming

## Browser Compatibility

Test in:
- [ ] Chrome/Chromium (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)

## Performance Checks

- [ ] Initial page load < 2 seconds
- [ ] Message send response < 500ms
- [ ] Streaming smooth (no lag)
- [ ] Chat list loads quickly
- [ ] No memory leaks during long sessions

## Security Checks

- [ ] API keys encrypted in storage
- [ ] API keys not exposed in network tab (only to provider APIs)
- [ ] No sensitive data in localStorage keys
- [ ] XSS protection (no raw HTML injection)

## Regression Testing

After each change, verify:
- [ ] All existing features still work
- [ ] No new console errors
- [ ] Build succeeds
- [ ] Type checking passes




