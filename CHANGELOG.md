# Changelog

## 1.4.8 (12/SEP/2025)
* Supports event source message stream tracking with comprehensive event monitoring (open, send, message, error).
* Introduces baggageConfiguration to set conviva client ID & conversation Id into baggage header for agent backend propogation.
* Supports for Salesforce's lazy loaded agent detection.
* Due to lazy load of ui, overlap was persisting in replay. This has been fixed. Now there will be no persisting overlaps.
* Fix for blobs upload with no payload.

## 1.4.4-beta (04/SEP/2025)
* Supports request or respose size upto 20KB

## 1.4.3 (28/AUG/2025)
* Introduces Session Replay
  - Session Replay enables the visual reconstruction and review of user navigations and actions within a customer's app. This feature captures how users interact with the app, including clicks, navigation, scrolling, media engagement, and text input, and then replays these interactions in a video-like experience.

  NOTE: By default, Session Replay is disabled. To enable it, please contact the Conviva Support team.

## 1.3.2 (19/AUG/2025)
* Introduces Intelligent Collection of SSE & WebSocket events designed to optimize data collection while ensuring flexibility and actionable insights with reduced volume:
  - Controls volume through Activation rules (Collect or Block).
  - Controls collection of attributes in SSE / WebSocket message payloads
  - Supports filtering based on request URL's hostname, path, scheme, and filtering based on attributes in SSE / WebSocket messages.
* Supports cookie support for sharing clId within subdomains based on config `enableClIdInCookies` passed in tracker init. 
* Fixes issue in application's readyState checks that depended XMLHttpRequest.UNSENT, XMLHttpRequest.OPENED, XMLHttpRequest.HEADERS_RECEIVED, XMLHttpRequest.LOADING, XMLHttpRequest.DONE. The fix now intelligently intercepts XHRs without any modifications to original behaviour.
* Fixes issue window undefined when initialising our tracker inside server side app.

## 1.2.0-beta (30/JUL/2025)
* Supports auto-collection of Server-Sent Events (SSE).
* Supports WebSocket message stream tracking with comprehensive event monitoring (open, close, send, message, error).

## 1.1.17 (01/AUG/2025)
* Support added to enable and disable common events through application configuration

## 1.1.16 (29/JUL/2025)
* Enhanced XMLHttpRequest interception to improve performance

## 1.1.15 (16/JUL/2025)
* Supports persisting custom selectors after page refresh

## 1.1.14 (11/JUL/2025)
* Supports extracting query params from page URLs & network request URLs. To enable it, please contact the Conviva Support team.

## 1.1.11 (01/JUL/2025)
* Support added for 'text/html' Content-Type

## 1.1.10 (20/JUNE/2025)
* Enhanced click detection
* Parses NWR response bodies even when the Content-Length header is missing

## 1.1.9 (23/MAY/2025)
* Supports click tracking in shadow dom when in open mode.
* Introduces custom attribute collection for click tracking.

## 1.1.8 (06/MAY/2025)
* Supports limiting of burst in reporting errors
* Fixes issue in collecting link clicks in multi-page applications.
* Supports setting proxy for the gateway url.

## 1.1.7 (24/APR/2025)

- Fixes compatibility issues with typescript declarations in legacy frameworks like Angular 6.

## 1.1.6 (04/APR/2025)

- Supports integration with Conviva Visual Labeling extension
- Enhances network request tracking to handle relative URLs
- Fixes typescript declarations for setCustomTags & unsetCustomTags API
- Fixes an exception caused on old browsers that do not support AbortController API

## 1.1.4 (05/MAR/2025)

- Fixes an issue of modifying relative URL while intercepting XHR Request.

## 1.1.3 (25/FEB/2025)

- Fixes an issue of missing targetUrl and target in link Clicks.

## 1.1.2 (18/FEB/2025)

- Enhances collection of clicks to capture all kinds of elements automatically and currently supports standard html elements, elements created using reactjs, angular and vue frameworks. Read more: [Autocollection of Clicks] (https://github.com/Conviva/conviva-js-appanalytics?tab=readme-ov-file#autocollection-of-clicks)

## 1.1.1 (04/FEB/2025)

- Introduces Intelligent Collection of Network Request Feature designed to optimize data collection while ensuring flexibility and actionable insights with reduced volume:
  - Controls network request volume through Activation rules (Collect or Block), which override previous URL-based blocklists.
  - Supports URL-based filtering using hostname, path, scheme, and filtering based on duration and response status code.
- Introduces getClientId & setClientId APIs to share Conviva's clientId across different sensor instances for usecases such as subdomains, webviews etc.
- Fixes an issue where cleanup() API removes listeners permanently for the instance preventing re-initialize to add listeners back.

<br><b>NOTE:</b></br>
By default, Intelligent Collection feature is not enabled during Activation. To enable it, please contact the Conviva Support team. Existing customers will not be impacted if the feature remains disabled, as all changes are fully backward compatible.

## 1.0.5 (17/JAN/2025)

- Fixes an issue that custom events are not reaching to pulse.

## 1.0.4 (27/DEC/2024)

- Fixes an issue that prevents "fetch" API to return response, when the URL to be monitored is blocklisted using remote configuration management.

## 1.0.3 (16/DEC/2024)

- Introduces "cleanup" API to comprehensively remove Conviva from the application footprint.
- Simplifies integration steps by consuming enableLinkClickTracking, enableButtonClickTracking & enableErrorTracking APIs into initialization sequence.
- Refactored & restructured internal dependencies that improves size and performance of the library.

## 0.7.8 (03/DEC/2024)

- Supports Controlled Ingestion Feature which is disabled by default. Upgrading to this version will not change the collection behavior unless it is enabled. To enable this feature, please contact Conviva support team.
- Supports sending Diagnostic Info Events which is disabled by default.

## 0.6.16 (08/NOV/2024)

- Introduces “deviceMetadata” key inside ConvivaAppTracker Initialisation config to set additional device related information. Please refer to [Device Metadata feature](https://github.com/Conviva/conviva-js-appanalytics?tab=readme-ov-file#eco-sensor-api-for-setting-device-metadata-from-application-for-sdks) for more details.
- Introduces Event Batching Feature with configurable payload size and interval caps, immediate dispatch for urgent events, remote configuration, and fixed limits from Activation
- Fixes the error with document / window being undefined for NexJS Web applications.

## 0.6.14 (23/OCT/2024)

- Improves performance by disconnecting mutation observer when continuous mutations are detected without many significant changes in DOM.

## 0.6.12 (30/SEPT/2024)

- Added ES5 support.
- Added required attributes in Conviva Video Events. Requires upgrade of video Sensor SDK to [v4.7.11](https://github.com/Conviva/conviva-js-coresdk/releases/tag/v4.7.11) or above.

## 0.6.11 (05/SEPT/2024)

- Enhanced the SDK’s remote configuration capabilities for more efficient management of tracking features.
- Fixes issue of page-ping event not sent when there is no user activity and app is in the foreground.

## 0.6.8 (20/JUL/2024)

- Fixes the issue of missing prototype for XMLHttpRequest thereby causing implementations using prototype to be unusable.
- Fixes the issue of Click Tracking Plugin continuously observing for changes to attributes of all elements in DOM tree, thereby causing performance degradation.

## 0.6.7 (10/MAY/2024)

- Added Angular framework support.

## 0.6.6 (25/APR/2024)

- Enables auto-tracking of visibility change events in the web applications by sending the `conviva_application_foreground` and `conviva_application_background` events, which are enabled by default.
- Enables auto-tracking of _lcp (Largest Contentful Paint)_ context.
- Enables auto-tracking of the _First App Launch_ feature by using the _First Launch_ custom tag context.
- Allows auto-tracking of the _Window Load_ event in the web applications. This is achieved by sending the `conviva_window_loaded` custom event, which is enabled by default.
- Allows auto-tracking of visibility state change to be hidden before tracking the page view. This is achieved by sending the `conviva_app_backgrnd_before_page_view` custom event, which is enabled by default.
- Optimizes the payload size by applying _gzip encryption_ and _schema optimization_.
- Supports custom gateway URL by using the unique `CUSTOMER_KEY` associated with each customer.
- Renames the remote configuration URL domain to `*.[conviva.com](http://conviva.com/)`.
- Updates the default block list of the _Network Request Tracking_ feature.
- Introduces a new _Performance Context_ based on `PerformanceNavigationTiming`. The old _Performance Context_, based on `PerformanceTiming`, is deprecated. By default, the old _Performance Context_ remains enabled. Configure the new _Performance Context_ via Remote Config.
- Integrates custom and video events tracking configurations into Remote Config to offer a unified setup.
- Improves the _Custom Event Blocking_ logic by implementing the substring matching technique.
- Resolves the Traceparent header generation issue. Now the Traceparent header is generated for all target URLs that are set to `*` in `traceparentconfig`.
- Reduces the number of cached payload data entries in local storage from 1000 to 10, and the sending limit of the entries without caching from 40kb to 20kb. Both these settings are manageable via Remote Config.
- Changes the behavior of local storage from _Last In, First Out (LIFO)_ to _First In, First Out (FIFO)_, when the maximum limit (10 entries) is reached.
- Reduces the payload size of _Network Request Event_ by limiting the default attributes to `targetUrl`, `method`, `responseStatusCode` and `duration`. However, the retention of request/response body/header attributes remain unchanged.

## 0.5.3 (07/FEB/2024)

- Added capability to generate "traceparent" header for network requests based on config.
- Fixes issue of missing "assetName" from conviva video events.

## 0.4.8 (25/JAN/2024)

- Added capability of autotracking meta tags present inside HEAD section of HTML page based on keys provided as config. Please refer to [Meta Tags feature](https://github.com/Conviva/conviva-js-appanalytics?tab=readme-ov-file#autocollection-of-meta-tags-from-head-section-of-html-page) for more details.
- Added functionality for app to report appVersion as part of init config. Please refer to [Initialization](https://github.com/Conviva/conviva-js-appanalytics?tab=readme-ov-file#initialization) for more details.
- Enhances network requests & response collection feature to support collection of response and request body where content-type is `text/javascript`, `application/javascript` along with already supported `text/plain` and `application/json`.
- Enhances trackPageView api to take custom page title as input. Please refer to [trackPageView Info](https://github.com/Conviva/conviva-js-appanalytics?tab=readme-ov-file#report-page-view-for-tracking-in-app-page-navigations) for more details.

## 0.4.6 (05/JAN/2024)

- Added remote-config control in button and link click tracking custom api.

## 0.4.5 (02/JAN/2024)

- Fixes issue of reporting incorrect app video bounce rate metric because conviva video event being dropped when video session id is negative.

## 0.4.4 (15/DEC/2023)

- Added typescript support.
- Fixes issue of handling input to fetch api when input is instance of Request object instead of url string during network request tracking.

## 0.4.3 (27/OCT/2023)

- Enhances network requests & response collection feature to capture limited (json only, size limit 10kb) and controlled set of information from headers and body.

## 0.3.34 (19/OCT/2023)

- Fixes issue in linkClickTracking & buttonClickTracking generating lots of console errors due to internal initialization sequence.
- Fixes and stops reporting exceptions / errors containing no information, status code and stacktrace. Such as browser errors caused due to extensions.
- Removed the dependency on "Request()" API while tracking network requests to avoid side effects of API compatibility to affect xhr or fetch API calls in application.

## 0.3.32 (06/OCT/2023)

- Supports the trackCustomEvent() with JSON Object as an argument
- Enhances default blocklist for Network Request Tracking
- Fixes issue of not reporting network request when the fetch request is failed
- Fixes the issue of target url being reported with only relative path in case of xmlHttpRequest Request is made with relative path by appending `window.location.domain` to the relative path.

## 0.3.29 (06/SEP/2023)

- Optimised performance timing context.

## 0.3.27 (27/JUL/2023)

- Fixes issue of elemntId not reported in button click event.

## 0.3.26 (17/JUL/2023)

- Supports collection of network request(http/https) performance metrics using the xmlhttpRequest or fetch Interceptor(which is disabled by default)

## 0.3.25 (28/JUN/2023)

- Fixes issue of duplicate eventIndex when app is opened in two or more tabs.

## 0.3.20 (01/JUN/2023)

- Removed unused fields from request payload.
- Fixes issue with default time of 'cacheRefreshInterval' when its fetch failed from remote config.

## 0.3.17 (24/APR/2023))

- Implements feature of the client id based event sequence number.

## 0.3.16 (14/APR/2023)

- Fixed Issue with remote config not applied after refresh interval.

## 0.3.14 (28/MAR/2023)

- Automatic tracking of Ajax requests enabled.

## 0.3.7 (23/DEC/2022)

- Detects Conviva Video Sensor events and metadata.

## 0.3.4 (12/DEC/2022)

- Exposes setCustomTags & unsetCustomTags APIs to report custom application data.

## 0.3.2 (28/OCT/2022)

- Added event_index and previousEventTimestamp into every HB.

## 0.2.11 (08/SEP/2022)

- Remote Config feature supported
- Improved periodic ping request (page_ping) feature to ping unconditionally regardless of user activity on the page.
- Fixed issue with button click detection on DOM change & avoided duplicate events being sent.
- Fixed issue with Page Title not being updated correctly
