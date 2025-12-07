# Troubleshooting Guide

This document contains solutions to common issues encountered during development and usage.

## Dropdown Menu Click Issues

### Problem
Dropdown menus (particularly the LLM selector in the chat interface) appear but options are not clickable. The dropdown may be visible but clicking on items doesn't trigger any action.

### Root Cause
This issue occurs when dropdowns are rendered within complex DOM hierarchies with:
- Multiple stacking contexts (z-index layers)
- Parent containers with `overflow: hidden` or `overflow: auto`
- Fixed/absolute positioning conflicts
- Backdrop overlays interfering with click events

The problem is especially common when:
- Using `absolute` positioning for dropdowns while backdrops use `fixed` positioning
- Dropdowns are nested inside scrollable containers
- Multiple z-index layers create stacking context conflicts

### Solution
Use **React Portals** to render dropdowns at the document body level, completely outside the normal DOM hierarchy.

**Implementation Pattern:**
```tsx
import { createPortal } from "react-dom"

// In your component
{isOpen && isMounted && createPortal(
  <>
    {/* Backdrop */}
    <div
      className="fixed inset-0 z-[9998]"
      onClick={() => setIsOpen(false)}
    />
    
    {/* Dropdown */}
    <div 
      ref={dropdownRef}
      className="fixed w-64 bg-background border border-border rounded-lg shadow-lg z-[9999]"
      style={{
        top: `${dropdownPosition.top}px`,
        right: `${dropdownPosition.right}px`,
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Dropdown content */}
    </div>
  </>,
  document.body
)}
```

**Key Points:**
1. **Use `createPortal`** to render at `document.body` level
2. **Calculate position dynamically** using `getBoundingClientRect()` on the trigger button
3. **Use high z-index values** (9998 for backdrop, 9999 for dropdown) to ensure they're on top
4. **Stop propagation** on dropdown container to prevent backdrop from closing it
5. **Use click-outside detection** as a backup (optional, backdrop handles it)

### Example: LLM Selector Component
See `components/llm/llm-selector.tsx` for a complete implementation.

### Best Practices for Future Dropdowns

1. **Always use portals for dropdowns** that need to escape parent containers
2. **Calculate positions dynamically** - don't rely on CSS positioning alone
3. **Use fixed positioning** for portaled dropdowns (not absolute)
4. **Implement proper click-outside handling** using backdrop or event listeners
5. **Test in various scroll positions** and container contexts

### Alternative Solutions (Less Recommended)

- Using `position: fixed` without portals (may still have stacking context issues)
- Increasing z-index values (doesn't solve stacking context problems)
- Using `pointer-events` manipulation (fragile and can break other interactions)

### Related Files
- `components/llm/llm-selector.tsx` - Working implementation using portals
- `components/projects/new-project-modal.tsx` - Modal example (also uses fixed positioning)

---

## API Rate Limit and Quota Errors

### Problem
Getting 429 (Too Many Requests) or quota exceeded errors from API providers, especially Google's Gemini API.

### Common Causes

1. **Google Gemini Free Tier Limits**
   - `gemini-2.5-pro` has very low free tier limits (often 0 requests/day)
   - Free tier quotas reset daily but are quite restrictive
   - Different models have different quota limits

2. **Rate Limiting**
   - Too many requests in a short time period
   - Exceeded per-minute or per-day limits

3. **Billing/Account Issues**
   - Free tier exhausted
   - Billing not set up for paid tier
   - Account restrictions

### Solutions

**For Google Gemini:**
1. **Model Selection**:
   - `gemini-2.5-flash` - Has higher free tier limits BUT has known issues with empty responses
   - `gemini-2.5-pro` - More reliable but very low free tier limits
   - If `gemini-2.5-flash` hangs or returns no response, try `gemini-2.0-flash` or switch to another provider
2. **Wait for quota reset** - Free tier quotas reset daily
3. **Set up billing** - Paid tier has much higher limits
4. **Check your quota** - Visit https://ai.dev/usage?tab=rate-limit
5. **Timeout Issues** - If requests hang, the API may be experiencing issues. Try a different model or provider.

**For All Providers:**
1. **Switch to a different model** - Some models have higher limits
2. **Switch to a different provider** - If one is rate-limited, try another
3. **Wait and retry** - Rate limits are usually temporary
4. **Check your API usage** - Monitor your usage in the provider's dashboard

### Error Message Improvements

The application now provides user-friendly error messages for quota errors:
- Identifies if it's a free tier limit
- Suggests alternative models (e.g., `gemini-2.5-flash`)
- Shows retry delay if available
- Provides links to quota documentation

### Demo Recommendations

For demos, use models with higher free tier limits:
- ✅ **Google**: `gemini-2.5-flash` (recommended)
- ❌ **Google**: `gemini-2.5-pro` (very low free tier limits)
- ✅ **OpenAI**: `gpt-4o-mini` (good free tier)
- ✅ **Anthropic**: Most Claude models have reasonable free tiers

### Related Links
- [Google Gemini Rate Limits](https://ai.google.dev/gemini-api/docs/rate-limits)
- [Google API Usage Dashboard](https://ai.dev/usage?tab=rate-limit)
- [OpenAI Rate Limits](https://platform.openai.com/docs/guides/rate-limits)
- [Anthropic Rate Limits](https://docs.anthropic.com/claude/docs/rate-limits)

---

## Google Gemini Empty Response / Hanging Requests

### Problem
When using `gemini-2.5-flash` (or sometimes other Gemini models), requests hang indefinitely with no response or error message.

### Root Cause
This is a known issue with Google's Gemini API, particularly with `gemini-2.5-flash`:
- The API may return empty responses without errors
- Requests can hang without timing out
- Model-specific issues with certain API versions

### Solutions

1. **Switch to a different Gemini model**:
   - Try `gemini-2.0-flash` instead of `gemini-2.5-flash`
   - Or use `gemini-2.5-pro` (if you have quota)

2. **Switch to a different provider**:
   - Use OpenAI or Anthropic as an alternative
   - This is often the most reliable solution

3. **Wait and retry**:
   - Google's API may be experiencing temporary issues
   - Try again after a few minutes

4. **Check API status**:
   - Visit Google's API status page
   - Check for known issues with specific models

### Implementation Notes

The application now includes:
- **60-second timeout** on Google API requests to prevent indefinite hanging
- **Better error detection** for empty responses
- **Improved error messages** when no content is received

### Related Links
- [Google Gemini API Troubleshooting](https://ai.google.dev/gemini-api/docs/troubleshooting)
- [Known Issues Discussion](https://discuss.ai.google.dev/)

---

## Hydration Errors

### Problem
React hydration errors occur when server-rendered HTML doesn't match client-rendered HTML, particularly with conditional rendering based on browser APIs (like `localStorage`).

### Solution
Use `useEffect` to gate client-only rendering:

```tsx
const [isMounted, setIsMounted] = useState(false)

useEffect(() => {
  setIsMounted(true)
}, [])

// Only render client-only content after mount
{isMounted && <ClientOnlyComponent />}
```

---

## API Key Validation Issues

### Problem
API keys are not being validated or saved correctly.

### Solution
1. Check browser console for errors
2. Verify encryption/decryption is working (check `lib/utils/encryption.ts`)
3. Ensure API endpoint is accessible (`/api/settings`)
4. Check that keys are being stored in localStorage correctly

---

## Model Selection Not Persisting

### Problem
Selected model/provider resets when navigating or refreshing.

### Solution
1. Ensure settings are being saved to localStorage
2. Check that `LLMContext` is reading from saved settings on mount
3. Verify `defaultProvider` and `defaultModel` are being set correctly

---

## General Debugging Tips

1. **Check browser console** for errors
2. **Inspect DOM** to see actual rendered structure
3. **Check z-index values** using browser dev tools
4. **Test in different browsers** (Chrome, Firefox, Safari)
5. **Clear browser cache** and localStorage if issues persist
6. **Check React DevTools** for component state issues

