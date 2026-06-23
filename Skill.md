---
name: shutterpixs-line-bot-debugging
description: >-
  Instructions and workflow for running, testing, and debugging the ShutterPixs LINE OA bot, managing Thai keyword replies, and configuring ngrok tunnels.
---

# ShutterPixs LINE Bot Debugging & Maintenance

## Overview
This skill provides the workflow and best practices for debugging, testing, and maintaining the LINE Official Account bot for the ShutterPixs booking system. It covers starting the backend dev server, tunnel configurations with ngrok, managing Thai keyword triggers, and setting up Flex Messages.

## Dependencies
- Node.js v18+
- ngrok (CLI installed and authenticated)
- LINE Developers Account (Messaging API Channel Access Token & Secret)

## Quick Start

### 1. Start the Dev Server
First, run the backend server in development mode:
```bash
cd backend
npm run dev
```

### 2. Expose Port 3005 with ngrok
In a separate terminal, start the ngrok tunnel to expose the local server:
```bash
ngrok http 3005
```

### 3. Update LINE Webhook URL
1. Retrieve the public HTTPS URL from ngrok (e.g., `https://xxxx-xxxx.ngrok-free.dev`).
2. Go to the [LINE Developers Console](https://developers.line.biz/).
3. Select your Channel → **Messaging API settings** tab.
4. Set the **Webhook URL** to:
   `https://xxxx-xxxx.ngrok-free.dev/api/webhook/line`
5. Click **Verify** to confirm the connection succeeds (returns `Success`).

---

## Workflow

### 1. Debugging Webhook Connection
If the LINE bot does not respond to messages:
1. Verify if the backend server is running and listening on port `3005`.
2. Verify if `ngrok` is running and forwarding to `http://localhost:3005`.
3. Check the ngrok request inspector by opening `http://localhost:4040` in a browser or querying the API:
   ```bash
   curl -s http://localhost:4040/api/tunnels
   ```
4. If requests reach the server but return `500 Internal Server Error`, inspect the server console logs for stack traces. Common issues include expired/invalid channel tokens or a blocked Gemini API Key.

### 2. Managing Keywords & Flex Messages
The LINE bot responds to specific Thai keywords with rich Flex Messages. All message routing happens in `backend/server.js` within the helper function `getFlexMessageForText(text)`.

The available categories and their keyword mappings are:
- **Wedding / Pre-Wedding:** `"งานแต่ง"`, `"แต่งงาน"`, `"wedding"`, `"พรีเวด"`
- **Ordination:** `"งานบวช"`, `"บวช"`, `"อุปสมบท"`, `"ordination"`
- **Graduation:** `"รับปริญญา"`, `"เรียนจบ"`, `"graduation"`, `"นอกรอบ"`
- **Event:** `"อีเว้น"`, `"อีเวน"`, `"สัมมนา"`, `"event"`, `"ปาร์ตี้"`
- **Portrait / Other:** `"ถ่ายภาพอื่นๆ"`, `"อื่นๆ"`, `"portrait"`, `"พอร์ตเทรต"`, `"บุคคล"`, `"โปรไฟล์"`
- **All / General Inquiry:** `"สอบถาม"`, `"ราคา"`, `"กี่บาท"`, `"แพ็กเกจ"`, etc. (Replies with a Carousel containing all services).

#### Code Template for Flex Messages
To edit the Flex Message layout or pricing, modify the `getServiceFlexMessage(category)` function in `backend/server.js`. The structures follow the LINE Flex Message Schema:
```javascript
const flexBubble = {
  type: "bubble",
  hero: {
    type: "image",
    url: "IMAGE_URL",
    size: "full",
    aspectRatio: "20:13",
    aspectMode: "cover"
  },
  body: {
    type: "box",
    layout: "vertical",
    contents: [
      { type: "text", text: "Title", weight: "bold", size: "xl", color: "COLOR_HEX" }
      // ... details ...
    ]
  }
};
```

### 3. Handling API Key Block / Leak
If you see the error `Your API key was reported as leaked. Please use another API key` in the server logs:
1. Go to [Google AI Studio](https://aistudio.google.com/).
2. Create a new API Key.
3. Open `backend/.env` and update the key:
   ```env
   GEMINI_API_KEY=your_new_gemini_api_key
   ```
4. Restart the backend server. The bot will automatically reload the new key.

---

### 4. Admin CMS Mock Authentication Bypass
For local testing of dashboard database writes without requiring live Firebase Auth accounts:
1. The backend authentication middleware (`backend/middlewares/auth.js`) is configured to accept `mock-admin-token` as a valid authorization token.
2. In the Admin CMS frontend, click **Mock Login** to set the authorization token to `mock-admin-token`. This allows read and write access to the Firestore database for local testing.

### 5. Admin Theme & Dark/Light Mode Switcher
The admin dashboard supports standard dark and light mode toggling:
- **Theme Variables**: Variable styles are declared inside `frontend/admin.css` under `:root` (default dark mode variables) and `:root[data-theme="light"]` / `@media (prefers-color-scheme: light)` (light mode overrides).
- **OS Theme Sync**: By default, if the user hasn't pinned a specific theme, it automatically synchronizes with the system OS dark/light setting.
- **FOUC Prevention**: A blocking inline script in `<head>` of `admin.html` reads `shutterpixs_theme` from `localStorage` and sets `data-theme` on the `html` element immediately, preventing a Flash of Unstyled Content (FOUC).
- **Manual Toggle**: Clicking `#btn-theme-toggle` toggles between modes, flips the sun/moon icon, and stores the user preference in `localStorage`.

---

## Common Mistakes

- **Incorrect Content-Length in Tests:** When mock-testing the webhook endpoint via curl or Node scripts, ensure the `Content-Length` header uses `Buffer.byteLength(data)` instead of `data.length`. Non-ASCII Thai characters take up multiple bytes, and using `data.length` will truncate the payload, throwing `SyntaxError: Unterminated string in JSON`.
- **Double-เ Vowel Mismatch:** In Thai, users occasionally type `เเ` (two separate `\u0e40` characters) instead of `แ` (one `\u0e41` character). The keyword normalizer automatically replaces `\u0e40\u0e40` with `\u0e41` in `server.js` to prevent matching failures. Keep this normalization logic intact when extending keywords.
- **Port Conflict (EADDRINUSE):** If you attempt to start nodemon when another instance of the server is already active in a terminal, it will crash with `EADDRINUSE: address already in use :::3005`. Find and kill the conflicting process or let nodemon handle file reloads automatically.
- **Unstyled Theme Flash (FOUC):** Do not load theme-applying scripts using async/defer attributes or ES modules. Always place a blocking inline script at the top of the `<head>` block to prevent a brief visual flash of the default dark theme when loading light mode.
- **Hardcoded Component Colors:** Avoid using hardcoded hex values (e.g. `#000000` or `#ffffff`) for component backgrounds or text colors. Always use custom theme variables like `var(--bg-body)` or `var(--text-primary)` to ensure the components render properly in both light and dark modes.
