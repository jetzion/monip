# Add AI Chat Using OpenRouter

Implement a fully functional AI-powered chat feature in the existing website. Use OpenRouter as the LLM provider. Integrate it into the current architecture and design system rather than creating a separate application.

## 1. Review the Existing Project

Before making changes:

- Inspect the existing framework, project structure, dependencies, styling, and routing.
- Identify the best place to integrate the chat interface.
- Follow the existing coding conventions and reusable components.
- Review the current `.gitignore` and environment variable configuration.

Do not rewrite existing functionality or introduce unnecessary dependencies.

## 2. Chat User Interface

Create a polished, responsive chat experience consistent with the website's visual design.

Include:

- A floating chat button fixed to the bottom-right corner of the viewport.
- A chat panel that opens and closes when the user clicks the button.
- A clear title, such as "Chat with us," and a welcome message.
- A message history that visually distinguishes user messages from AI responses.
- A text input with a send button.
- Support for sending messages using Enter and inserting new lines using Shift+Enter.
- A loading indicator while the AI is generating a response.
- Auto-scrolling to the latest message.
- Clear error messages when the request fails.
- A button to start a new conversation.
- A close button that hides the chat panel.

On desktop, the chat panel should be a comfortable floating window. On mobile, it should adapt to the screen and remain easy to use.

Use the website's established color palette, typography, buttons, and spacing. Ensure adequate contrast and accessible keyboard navigation.

## 3. OpenRouter Integration

Use OpenRouter as the AI provider.

API documentation: https://openrouter.ai/docs

Requirements:

- Make requests to OpenRouter from a server-side API endpoint, never directly from browser code.
- Use the OpenAI-compatible Chat Completions API.
- Read the API key from the `OPENROUTER_API_KEY` environment variable.
- Read the model identifier from an `OPENROUTER_MODEL` environment variable.
- Send the conversation history to the model so it can respond with context.
- Use environment variables for configuration rather than hardcoding credentials or model identifiers.
- Handle API errors, rate limits, timeouts, and malformed responses gracefully.
- Display a helpful message to the user if the AI service is temporarily unavailable.
- Prevent users from accessing server secrets through client-side code or API responses.

Use a configurable model rather than hardcoding a specific model throughout the application.

## 4. Environment Configuration

Create a `.env.local` file in the project root with the following template:

```dotenv
# OpenRouter API credentials
OPENROUTER_API_KEY=

# OpenRouter model identifier
OPENROUTER_MODEL=

# Optional: public site URL for OpenRouter request attribution
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

Leave the API key and model identifier blank. I will supply the values.

Also:

- Ensure `.env.local` is included in `.gitignore`.
- Never commit API keys or other secrets to Git.
- Create or update `.env.example` with the same variable names but no credentials.
- If required environment variables are missing, return a clear server-side configuration error without exposing secrets.
- Do not print API keys in logs or error messages.

## 5. Backend API

If this project uses Next.js, implement the chat endpoint using the appropriate server-side route handler for the existing router structure.

Suggested endpoint:

`POST /api/chat`

The endpoint should:

1. Validate the incoming request.
2. Accept the conversation messages in a defined format.
3. Enforce reasonable message-length and conversation-history limits.
4. Validate allowed message roles and message content.
5. Construct the OpenRouter request using server-side environment variables.
6. Return the assistant response in a predictable JSON format.
7. Handle upstream failures without exposing internal errors or credentials.

Use server-side `fetch` to call:

`https://openrouter.ai/api/v1/chat/completions`

Include the required `Authorization: Bearer ...` header and JSON content type. Add the optional `HTTP-Referer` and `X-OpenRouter-Title` headers where appropriate.

Keep the OpenRouter-specific implementation isolated so the provider or model can be changed later without rebuilding the chat interface.

## 6. Security and Reliability

Implement sensible baseline protections:

- Never expose the OpenRouter API key to the browser.
- Validate and limit request sizes.
- Add basic rate limiting or document the deployment-appropriate rate-limiting approach.
- Do not trust arbitrary client-supplied system messages; define the system prompt on the server.
- Do not allow the client to override server-side model settings or provider configuration.
- Avoid storing conversations or personal information persistently unless the existing application explicitly requires it.
- Handle network errors, HTTP errors, and unexpected response formats.
- Ensure users cannot cause unbounded token usage through excessively long messages or histories.

Do not claim the endpoint is production-secure unless the necessary protections are implemented and verified.

## 7. Chat Behavior

The chat should:

- Maintain the current conversation while the chat panel is open.
- Include recent conversation messages in subsequent requests.
- Display the user's message immediately.
- Show an obvious loading state while waiting for the model.
- Render the assistant's response clearly and safely.
- Prevent accidental duplicate submissions while a request is in progress.
- Allow users to start a fresh conversation.
- Preserve conversation state when the panel is closed and reopened during the current page session.

Do not persist chat history across sessions unless there is an existing application requirement to do so.

## 8. Testing and Verification

After implementation:

- Verify that the website builds successfully.
- Test the chat interface on desktop and mobile layouts.
- Test missing API-key configuration.
- Test successful responses when valid credentials are supplied.
- Test invalid credentials, API failures, and rate-limit responses.
- Verify that the API key is never included in client-side bundles, browser responses, or logs.
- Verify that `.env.local` is ignored by Git.
- Confirm that existing website functionality remains intact.

If the API key has not yet been provided, complete the implementation and validate the local UI and error-handling paths without attempting to fabricate credentials.

## 9. Final Deliverables

When finished, provide:

1. A summary of the implemented features.
2. A list of files created or modified.
3. Instructions for adding the OpenRouter API key and selecting a model in `.env.local`.
4. Instructions for running and testing the chat locally.
5. Any remaining production deployment requirements or limitations.

Implement the feature end-to-end. Do not stop after creating a mockup or a static chat interface.
