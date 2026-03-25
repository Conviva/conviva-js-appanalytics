# AGENTS.md

Conviva JavaScript DPI SDK — AI Agent Integration Specification

Repository: `Conviva/conviva-js-appanalytics`
Package: `@convivainc/conviva-js-appanalytics`
Language: JavaScript / TypeScript
Platform: Web

---

# Purpose

This file is the authoritative operating contract for AI agents integrating this SDK. It takes precedence over all other documentation.

Agents help developers integrate the SDK correctly, with minimal diffs, using only documented APIs.

---

# Hard Rules

## Never invent SDK APIs

Agents must **only generate code using APIs listed in this document**. Do NOT generate guessed configuration fields, undocumented callbacks, undocumented plugins, undocumented React/Vue providers, or undocumented automatic tracking features.

If a requested feature cannot be implemented using the allowed API surface, the agent must say so explicitly.

## Never fabricate required values

Agents must never invent Conviva customer keys, application identifiers, app versions, user identifiers, or metadata values. Missing values must be requested from the developer or marked clearly as placeholders:

```js
const CONVIVA_CUSTOMER_KEY = "REPLACE_ME";
```

## Minimize codebase modifications

Modify as few files as possible. Prefer existing bootstrap points. Avoid refactoring unrelated logic. **Smallest safe diff.**

## SDK initialization must occur exactly once

Never initialize the SDK inside render functions, loops, router hooks that run repeatedly, or frequently remounted components.

## Never implement optional APIs without explicit request

All APIs marked `[OPTIONAL]` in the API surface block must not be added to any integration unless the developer explicitly asks for them.

---

# Allowed SDK API Surface

```js
import {
  convivaAppTracker,    // Initialize SDK
  setUserId,            // Set authenticated user identity
  trackPageView,        // Track page navigation
  trackCustomEvent,     // [OPTIONAL] Track business events — implement only when explicitly requested
  setCustomTags,        // [OPTIONAL] Add session-level metadata — implement only when explicitly requested
  unsetCustomTags,      // [OPTIONAL] Remove session-level metadata — implement only when explicitly requested
  trackError,           // [OPTIONAL] Report application errors — implement only when explicitly requested
  getClientId,          // [OPTIONAL] Retrieve Conviva client ID — only for special use cases (e.g. multi-domain)
  setClientId,          // [OPTIONAL] Provide client ID — only for special use cases (e.g. multi-domain)
  trackNetworkRequest,  // [OPTIONAL] Manually track network requests — implement only when explicitly requested
  ConvivaDeviceMetadata // [OPTIONAL] Device metadata schema — required only for TV/STB environments
} from "@convivainc/conviva-js-appanalytics";
```

---

# Supported Integration Modes

Environments: JavaScript, TypeScript, SPA, MPA
Frameworks: React, Next.js, Angular, Vue, Nuxt, Vanilla JavaScript

Script tag integration is **not supported**. For script-based integration: `https://github.com/Conviva/conviva-js-script-appanalytics`

**Next.js:** SDK initialization must occur in a Client Component only (add `"use client"` directive). Never initialize in a Server Component, a server action, or `layout.tsx` without the `"use client"` directive.

---

# Required Inputs Before Integration

| Field                | Required | Purpose / Example                        |
| -------------------- | -------- | ---------------------------------------- |
| convivaCustomerKey   | Yes      | `"abc123"`                               |
| appId                | Yes      | `"WebApp"`                               |
| appVersion           | Yes      | `"2.1.0"`                                |
| session replay       | Ask      | optional feature — must ask developer    |
| framework            | Often    | determine integration style              |
| router               | Often    | required for SPA page tracking           |
| user identity source | Often    | for setUserId                            |
| device metadata      | Often    | required for TV/STB environments         |

---

# Agent Integration Workflow

### Step 1 — Determine application type

Identify SPA or MPA. If unclear, ask the developer.

### Step 2 — Identify application bootstrap location

Preferred initialization points: `main.js`, `main.ts`, `App.js`, `App.ts`, client entrypoint, root layout client initializer.

Do not assume file names or project structure. If unclear, ask the developer before generating code.

### Step 3 — Install SDK

```
npm install @convivainc/conviva-js-appanalytics  # or: yarn add @convivainc/conviva-js-appanalytics
```

### Step 4 — Initialize SDK

```js
convivaAppTracker({
  appId: "APP_ID",
  convivaCustomerKey: "CUSTOMER_KEY",
  appVersion: "APP_VERSION"
});
```

### Step 5 — Set user identity

```js
setUserId(userId);
```

Update identity on: login, logout, account switch. Ask developer if anonymous/guest users have no ID. Ask developer to verify the userid value is not PII.

### Step 6 — Track page views

Page views are **not automatically captured**. Agents must explicitly call `trackPageView()`.

An optional `title` can be passed to set a custom page title:

```js
trackPageView({ title: 'Custom Page Title' });
```

---

# Page View Tracking Rules

## SPA

SPA page view tracking decision:

1. Framework router present → `trackPageView()` on route change
2. History/hash API used → `trackPageView()` on navigation event
3. No navigation mechanism → `trackPageView()` once after root mounts

Do not assume a router exists. Do not fire `trackPageView()` before the new screen becomes visible. Every logical page or screen transition must trigger a page view event.

### React SPA Without Router — fire once on mount

```javascript
useEffect(() => {
  trackPageView();
}, []);
```

### React SPA With Router — fire on every route change

```javascript
useEffect(() => {
  trackPageView();
}, [location]);
```

## MPA

```js
window.addEventListener("load", () => {
  trackPageView();
});
```

---

# Custom Event Tracking — Optional

```js
trackCustomEvent({
  name: "checkout_started",
  data: { step: 1 }
});
```

Rules: event names must be stable, payload must be JSON serializable, payloads should remain small, do not include sensitive data.

---

# Error Tracking — Optional

```js
trackError({
  message: "Checkout error",
  filename: "checkout.js",
  error: err
});
```

Recommended locations: global error handler, framework error boundary, logging systems.

---

# Client ID Synchronization — Optional

**Agents must NOT implement `getClientId` or `setClientId` unless the developer explicitly requests it.**

These APIs are for special use cases only, such as synchronizing a Conviva client ID across multiple domains or subdomains. Do not add them to a standard single-domain integration.

When requested:

```js
getClientId();          // call after initialization
setClientId(clientId);  // call before initialization
```

---

# Custom Tags — Optional

Attaches session-level key-value metadata to all subsequent events (e.g. subscription tier, content category). Use `unsetCustomTags` to remove previously set keys.

```js
setCustomTags({ plan: "premium", region: "us-west" });
unsetCustomTags(["plan"]);
```

---

# Network Request Tracking — Optional

Manually reports network calls that are not automatically captured. Accepts two objects: `requestDetails` (outgoing request) and `responseDetails` (response).

```js
import { trackNetworkRequest } from '@convivainc/conviva-js-appanalytics';

const requestDetails = {
  url: url,
  method: method,                                        // 'GET', 'POST', etc.
  headers: requestHeaders,                               // e.g. { 'Content-Type': 'application/json' }
  body: requestBody,                                     // e.g. JSON.stringify({ key: 'value' })
  requestTime: performance?.now() ?? Date.now(),
  size: requestBodySize                                  // size of the request body in bytes
};

// make the actual network request, then populate responseDetails:

const responseDetails = {
  status: res.status,                                    // e.g. 200, 404
  statusText: res.statusText,                            // e.g. 'OK', 'Not Found'
  responseTime: performance?.now() ?? Date.now(),
  body: await res.clone().json(),                        // parsed JSON response
  headers: Object.fromEntries(res.headers.entries()),    // response headers
};

trackNetworkRequest({ requestDetails, responseDetails });
```

---

# Device Metadata — Optional (TV/STB only)

Required only for Smart TV or Set-Top Box environments where device metadata cannot be auto-detected. Not needed for standard web/SPA/MPA integrations.

```js
convivaAppTracker({
  appId: "APP_ID",
  convivaCustomerKey: "CUSTOMER_KEY",
  appVersion: "APP_VERSION",
  deviceMetadata: {
    [ConvivaDeviceMetadata.DEVICE_TYPE]: "SmartTV",
    [ConvivaDeviceMetadata.DEVICE_BRAND]: "Samsung"
  }
});
```

---

# Replay Integration

```
npm install @convivainc/conviva-js-replay
```

Replay must initialize **before** the App Analytics SDK. Incorrect order will break replay.

```js
import { initReplay } from "@convivainc/conviva-js-replay";

initReplay(customerKey);
convivaAppTracker({...});
```

---

# Content Security Policy

```
connect-src https://rc.conviva.com/ http://appgw.conviva.com/ https://rcg.conviva.com/
```

Replay may also require: `worker-src 'self' blob:;`

---

# Agent Checklist

**Before generating code:**
- [ ] App type known (SPA or MPA)
- [ ] Initialization location identified
- [ ] Required inputs collected
- [ ] Only allowed SDK APIs will be used

**After generating code:**
- [ ] Initialization occurs exactly once
- [ ] No tracking occurs before initialization
- [ ] Page view tracking present
- [ ] User identity placeholder marked; developer asked to verify value is not PII
- [ ] No undocumented APIs referenced

---

# Anti-Hallucination Rules

Do NOT invent configuration flags:
```js
// WRONG
convivaAppTracker({ autoTrackPages: true });
```

Do NOT invent React provider components:
```jsx
// WRONG
<ConvivaProvider />
```

Do NOT assume page tracking is automatic — always instrument explicitly.

Do NOT assume replay is built into DPI — it requires a separate package.

Do NOT implement `trackCustomEvent` or `trackError` proactively — only add them when the developer explicitly asks.

Do NOT implement `getClientId` or `setClientId` in a standard integration — these are for special use cases only (e.g. multi-domain client ID synchronization).

Do NOT implement `trackNetworkRequest`, `setCustomTags`, `unsetCustomTags`, or `ConvivaDeviceMetadata` proactively — only add them when explicitly requested by the developer.

---

# Minimal Integration Template

```js
import {
  convivaAppTracker,
  setUserId,
  trackPageView
} from "@convivainc/conviva-js-appanalytics";

convivaAppTracker({
  appId: "REPLACE_ME_APP_ID",
  convivaCustomerKey: "REPLACE_ME_CUSTOMER_KEY",
  appVersion: "REPLACE_ME_APP_VERSION"
});

setUserId("REPLACE_ME_USER_ID");

trackPageView();
```

---

# Mandatory Prompt Template for AI Agents

Before generating final integration code, agents must request:

```
To integrate Conviva App Analytics I need:

1. Conviva Customer Key
2. appId
3. appVersion
4. Where does user identity come from?
5. Should session replay be enabled?
```
