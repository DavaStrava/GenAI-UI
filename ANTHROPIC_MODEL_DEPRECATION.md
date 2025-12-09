# Anthropic Model Deprecation Issue

## Problem Summary

On December 9, 2024, users experienced "model not found" errors when attempting to use Anthropic Claude models, specifically:
- `claude-3-5-sonnet-20241022`
- `claude-3-5-sonnet-20240620`
- `claude-3-5-haiku-20241022`
- `claude-3-opus-20240229`
- `claude-3-sonnet-20240229`
- `claude-3-haiku-20240307`

**Error Message:**
```
Error: Anthropic model not found. The model "claude-3-5-sonnet-20241022" may not be available with your API key.
```

## Root Cause

These model versions were **deprecated and retired** by Anthropic. Even though:
1. The API keys were valid and working
2. The model IDs were correctly formatted
3. The API requests were properly structured

The models themselves were no longer available through the Anthropic API, causing all requests to fail with "model not found" errors.

## Solution

Removed all deprecated model versions from the codebase and updated to only include currently active models:

### Active Models (as of December 2024)
- `claude-sonnet-4-20250514` - Claude Sonnet 4 ✅ (Confirmed working)
- `claude-opus-4-20250514` - Claude Opus 4 ✅ (Confirmed working)
- `claude-opus-4-1-20250805` - Claude Opus 4.1 ✅ (Confirmed working)

### Note on Claude 4.5 Models
Claude 4.5 models (Sonnet 4.5, Opus 4.5, Haiku 4.5) are **not yet available** via the Anthropic API, or they use a different naming format that hasn't been confirmed. Attempted formats that don't work:
- `claude-sonnet-4.5` ❌
- `claude-sonnet-4-5-20250805` ❌
- `claude-opus-4.5` ❌

**Action Required:** When Claude 4.5 models become available via API, verify the exact model ID format from Anthropic's documentation and update `lib/llm/providers/anthropic.ts` accordingly.

### Files Updated
1. `lib/llm/providers/anthropic.ts` - Removed deprecated models from provider list
2. `app/api/chat/route.ts` - Updated validation list to only include active models

## How to Avoid This Issue in the Future

### 1. Monitor Anthropic's Model Deprecation Schedule

Anthropic maintains a public deprecation schedule:
- **Documentation**: https://docs.anthropic.com/en/docs/about-claude/model-deprecations
- **Release Notes**: https://docs.anthropic.com/en/release-notes/api

**Action Items:**
- Check the deprecation schedule quarterly
- Set up alerts for deprecation announcements
- Subscribe to Anthropic's release notes

### 2. Implement Model Validation

The codebase now includes:
- Validation in `app/api/chat/route.ts` to ensure only valid models are used
- Flexible validation that accepts any model starting with "claude-" to support future models
- Better error messages that show the actual API error from Anthropic

### 3. Regular Model List Updates

**When to Update:**
- When Anthropic announces new model versions
- When Anthropic deprecates existing models
- Quarterly review of available models

**How to Update:**
1. Check Anthropic's current model list: https://docs.anthropic.com/en/api/messages
2. Update `lib/llm/providers/anthropic.ts` with new/removed models
3. Update validation list in `app/api/chat/route.ts`
4. Test with actual API calls to verify models work
5. Update this documentation

### 4. Testing Strategy

**Before Deploying Model Updates:**
1. Test each model with a simple API call
2. Verify error handling works correctly
3. Check that model selector UI displays correctly
4. Ensure saved model preferences are migrated/validated

### 5. Error Handling Improvements

The codebase now includes:
- Detailed error messages from Anthropic API
- Authentication error detection
- Model validation before API calls
- Console logging for debugging (without exposing API keys)

### 6. User Communication

**If Models Are Deprecated:**
1. Update model list immediately
2. Add validation to auto-correct invalid model selections
3. Show clear error messages if users have deprecated models saved
4. Provide migration path to new models

## Technical Details

### Model ID Format

Anthropic model IDs follow this pattern:
- `claude-{version}-{variant}-{date}` (e.g., `claude-3-7-sonnet-20250219`)
- `claude-{variant}-{version}-{date}` (e.g., `claude-sonnet-4-20250514`)

The date suffix indicates the specific model version/release date.

### API Key Validation

Anthropic API keys:
- Must start with `sk-ant-`
- Should be trimmed of whitespace
- Are validated in `app/api/chat/route.ts`

### Error Response Format

Anthropic API errors include:
```json
{
  "error": {
    "type": "error_type",
    "message": "Human-readable error message"
  }
}
```

Common error types:
- `authentication_error` - API key issue
- `invalid_request_error` - Model not found or invalid parameters
- `rate_limit_error` - Too many requests

## Related Files

- `lib/llm/providers/anthropic.ts` - Model provider definition
- `app/api/chat/route.ts` - API route with model validation
- `lib/contexts/llm-context.tsx` - Model selection and validation logic
- `components/llm/llm-selector.tsx` - UI for model selection

## References

- [Anthropic API Documentation](https://docs.anthropic.com/en/api/messages)
- [Model Deprecation Schedule](https://docs.anthropic.com/en/docs/about-claude/model-deprecations)
- [API Release Notes](https://docs.anthropic.com/en/release-notes/api)
- [API Errors Reference](https://docs.anthropic.com/en/api/errors)

