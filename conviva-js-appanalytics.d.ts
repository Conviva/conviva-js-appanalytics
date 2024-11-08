import { TrackerConfiguration, BrowserTracker, CookieSameSite, Platform, EventMethod, StateStorageStrategy, ConvivaDeviceMetadata, ActivityTrackingConfiguration, ActivityTrackingConfigurationCallback, ActivityCallback, ActivityCallbackData, BrowserPlugin, BrowserPluginConfiguration, BuiltInContexts, DisableAnonymousTrackingConfiguration, EnableAnonymousTrackingConfiguration, AnonymousTrackingOptions, FlushBufferConfiguration, PageViewEvent, ClearUserDataConfiguration } from '@convivainc/browser-tracker-core';
import { version, CommonEventProperties, ConditionalContextProvider, ContextPrimitive, ContextGenerator, FilterProvider, RuleSetProvider, SelfDescribingEvent, SelfDescribingJson, StructuredEvent, CustomEvent, ContextEvent, ContextFilter, RuleSet } from '@convivainc/tracker-core';
/**
 * Initialise a new tracker
 *
 * @param trackerId - The tracker id - also known as tracker namespace
 * @param endpoint - Collector endpoint in the form collector.mysite.com
 */
declare function newTracker(trackerId: string, endpoint: string): BrowserTracker;
/**
 * Initialise a new tracker
 *
 * @param trackerId - The tracker id - also known as tracker namespace
 * @param endpoint - Collector endpoint in the form collector.mysite.com
 * @param configuration - The initialisation options of the tracker
 */
declare function newTracker(trackerId: string, endpoint: string, configuration: TrackerConfiguration): BrowserTracker;
/**
 * Initialise a new tracker
 *
 * @param trackerId - The tracker id - also known as tracker namespace
 * @param endpoint - Collector endpoint in the form collector.mysite.com
 */
declare function convivaAppTracker(configuration: TrackerConfiguration): BrowserTracker;
/**
 * Expires current session and starts a new session.
 *
 * @param trackers - The tracker identifiers which will have their session refreshed
 */
declare function newSession(trackers?: Array<string>): void;
/**
 * Override referrer
 *
 * @param url - Custom Referrer which will be used as override
 * @param trackers - The tracker identifiers which will be configured
 */
declare function setReferrerUrl(url: string, trackers?: Array<string>): void;
/**
 * Override url
 *
 * @param url - Custom URL which will be used as override
 * @param trackers - The tracker identifiers which will be configured
 */
declare function setCustomUrl(url: string, trackers?: Array<string>): void;
/**
 * Override document.title
 *
 * @param title - Document title which will be used as override
 * @param trackers - The tracker identifiers which will be configured
 */
declare function setDocumentTitle(title: string, trackers?: Array<string>): void;
/**
 * Strip hash tag (or anchor) from URL
 *
 * @param enable - Whether to enable stripping of hash
 * @param trackers - The tracker identifiers which will be configured
 */
declare function discardHashTag(enable: boolean, trackers?: Array<string>): void;
/**
 * Strip braces from URL
 *
 * @param enable - Whther to enable stripping of braces
 * @param trackers - The tracker identifiers which will be configured
 */
declare function discardBrace(enable: boolean, trackers?: Array<string>): void;
/**
 * Set first-party cookie path
 *
 * @param path - The path which will be used when setting cookies
 * @param trackers - The tracker identifiers which will be configured
 */
declare function setCookiePath(path: string, trackers?: Array<string>): void;
/**
 * Set visitor cookie timeout (in seconds)
 *
 * @param timeout - The timeout until cookies will expire
 * @param trackers - The tracker identifiers which will be configured
 */
declare function setVisitorCookieTimeout(timeout: number, trackers?: Array<string>): void;
/**
 * Enable querystring decoration for links pasing a filter
 *
 * @param crossDomainLinker - Function used to determine which links to decorate
 * @param trackers - The tracker identifiers which will be configured
 */
declare function crossDomainLinker(crossDomainLinkerCriterion: (elt: HTMLAnchorElement | HTMLAreaElement) => boolean, trackers?: Array<string>): void;
/**
 * Enables page activity tracking (sends page pings to the Collector regularly).
 *
 * @param configuration - The activity tracking configuration
 * @param trackers - The tracker identifiers which will be configured
 */
declare function enableActivityTracking(configuration: ActivityTrackingConfiguration, trackers?: Array<string>): void;
/**
 * Enables page activity tracking (replaces collector ping with callback).
 *
 * @param configuration - The activity tracking callback configuration
 * @param trackers - The tracker identifiers which will be configured
 */
declare function enableActivityTrackingCallback(configuration: ActivityTrackingConfiguration & ActivityTrackingConfigurationCallback, trackers?: Array<string>): void;
/**
 * Triggers the activityHandler manually to allow external user defined activity. i.e. While watching a video
 *
 * @param trackers - The tracker identifiers which will be updated
 */
declare function updatePageActivity(trackers?: Array<string>): void;
/**
 * Sets the opt out cookie.
 *
 * @param name - of the opt out cookie
 * @param trackers - The tracker identifiers which will be configured
 */
declare function setOptOutCookie(name?: string | null, trackers?: Array<string>): void;
/**
 * Set the business-defined user ID for this user.
 *
 * @param userId - The business-defined user ID
 * @param trackers - The tracker identifiers which will be configured
 */
declare function setUserId(userId?: string | null, trackers?: Array<string>): void;
/**
 * Set the business-defined user ID for this user using the location querystring.
 *
 * @param querystringField - Name of a querystring name-value pair
 * @param trackers - The tracker identifiers which will be configured
 */
declare function setUserIdFromLocation(querystringField: string, trackers?: Array<string>): void;
/**
 * Set the business-defined user ID for this user using the referrer querystring.
 *
 * @param querystringField - Name of a querystring name-value pair
 * @param trackers - The tracker identifiers which will be configured
 */
declare function setUserIdFromReferrer(querystringField: string, trackers?: Array<string>): void;
/**
 * Set the business-defined user ID for this user to the value of a cookie.
 *
 * @param cookieName - Name of the cookie whose value will be assigned to businessUserId
 * @param trackers - The tracker identifiers which will be configured
 */
declare function setUserIdFromCookie(cookieName: string, trackers?: Array<string>): void;
/**
 * Specify the Snowplow collector URL. Specific http or https to force it
 * or leave it off to match the website protocol.
 *
 * @param collectorUrl - The collector URL, with or without protocol
 * @param trackers - The tracker identifiers which will be configured
 */
declare function setCollectorUrl(collectorUrl: string, trackers?: Array<string>): void;
/**
 * Set the buffer size
 * Can be useful if you want to stop batching requests to ensure events start
 * sending closer to event creation
 *
 * @param newBufferSize - The value with which to update the bufferSize to
 * @param trackers - The tracker identifiers which will be flushed
 */
declare function setBufferSize(newBufferSize: number, trackers?: Array<string>): void;
/**
 * Send all events in the outQueue
 * Only need to use this when sending events with a bufferSize of at least 2
 *
 * @param configuration - The configuration to use following flushing the buffer
 * @param trackers - The tracker identifiers which will be flushed
 */
declare function flushBuffer(configuration?: FlushBufferConfiguration, trackers?: Array<string>): void;
/**
 * Track a visit to a web page
 *
 * @param event - The Page View Event properties
 * @param trackers - The tracker identifiers which the event will be sent to
 */
declare function trackPageView(event?: PageViewEvent & CommonEventProperties, trackers?: Array<string>): void;
/**
 * Track a structured event
 * A classic style of event tracking, allows for easier movement between analytics
 * systems. A loosely typed event, creating a Self Describing event is preferred, but
 * useful for interoperability.
 *
 * @param event - The Structured Event properties
 * @param trackers - The tracker identifiers which the event will be sent to
 */
declare function trackStructEvent(event: StructuredEvent & CommonEventProperties, trackers?: Array<string>): void;
/**
 * Track a Custom event
 * A classic style of event tracking, allows for easier movement between analytics
 * systems. A loosely typed event, creating a Custom event is preferred, but
 * useful for interoperability.
 *
 * @param event - The Custom Event properties
 * @param trackers - The tracker identifiers which the event will be sent to
 */
declare function trackCustomEvent(event: CustomEvent & CommonEventProperties, trackers?: Array<string>): void;
/**
 * Set Custom Tags
 * A classic style of adding custom tags to HB
 *
 * @param event - The Custom Event properties
 * @param trackers - The tracker identifiers which the event will be sent to
 */
declare function setCustomTags(event: CustomEvent & CommonEventProperties, trackers?: Array<string>): void;
/**
 * Unset Custom Tags
 * A classic style of deleting custom tags to HB
 *
 * @param event - The Custom Event properties
 * @param trackers - The tracker identifiers which the event will be sent to
 */
declare function unsetCustomTags(event: CustomEvent & CommonEventProperties, trackers?: Array<string>): void;
/**
 * Track a self-describing event happening on this page.
 * A custom event type, allowing for an event to be tracked using your own custom schema
 * and a data object which conforms to the supplied schema
 *
 * @param event - The event information
 * @param trackers - The tracker identifiers which the event will be sent to
 */
declare function trackSelfDescribingEvent(event: SelfDescribingEvent & CommonEventProperties, trackers?: Array<string>): void;
/**
 * All provided contexts will be sent with every event
 *
 * @param contexts - An array of contexts or conditional contexts
 * @param trackers - The tracker identifiers which the global contexts will be added to
 */
declare function addGlobalContexts(contexts: Array<ConditionalContextProvider | ContextPrimitive>, trackers?: Array<string>): void;
/**
 * All provided contexts will no longer be sent with every event
 *
 * @param contexts - An array of contexts or conditional contexts
 * @param trackers - The tracker identifiers which the global contexts will be remove from
 */
declare function removeGlobalContexts(contexts: Array<ConditionalContextProvider | ContextPrimitive>, trackers?: Array<string>): void;
/**
 * Clear all global contexts that are sent with events
 *
 * @param trackers - The tracker identifiers which the global contexts will be cleared from
 */
declare function clearGlobalContexts(trackers?: Array<string>): void;
/**
 * Stop regenerating `pageViewId` (available from `web_page` context)
 *
 * @param trackers - The tracker identifiers which the event will preserve their Page View Ids
 */
declare function preservePageViewId(trackers?: Array<string>): void;
/**
 * Disables anonymous tracking if active (ie. tracker initialized with `anonymousTracking`)
 * For stateStorageStrategy override, uses supplied value first,
 * falls back to one defined in initial config, otherwise uses cookieAndLocalStorage.
 *
 * @param configuration - The configuration for disabling anonymous tracking
 * @param trackers - The tracker identifiers which the event will be sent to
 */
declare function disableAnonymousTracking(configuration?: DisableAnonymousTrackingConfiguration, trackers?: Array<string>): void;
/**
 * Enables anonymous tracking (ie. tracker initialized without `anonymousTracking`)
 *
 * @param configuration - The configuration for enabling anonymous tracking
 * @param trackers - The tracker identifiers which the event will be sent to
 */
declare function enableAnonymousTracking(configuration?: EnableAnonymousTrackingConfiguration, trackers?: Array<string>): void;
/**
 * Clears all cookies and local storage containing user and session identifiers
 *
 * @param trackers - The tracker identifiers which the event will be sent to
 */
declare function clearUserData(configuration?: ClearUserDataConfiguration, trackers?: Array<string>): void;
/**
 * Add a plugin into the plugin collection after trackers have already been initialised
 *
 * @param configuration - The plugin to add
 * @param trackers - The tracker identifiers which the plugin will be added to
 */
declare function addPlugin(configuration: BrowserPluginConfiguration, trackers?: Array<string>): void;
export { newTracker, convivaAppTracker, BrowserTracker, TrackerConfiguration, CookieSameSite, Platform, EventMethod, StateStorageStrategy, ConvivaDeviceMetadata, version, ActivityTrackingConfiguration, ActivityTrackingConfigurationCallback, ActivityCallback, ActivityCallbackData, BrowserPlugin, BrowserPluginConfiguration, BuiltInContexts, FlushBufferConfiguration, PageViewEvent, EnableAnonymousTrackingConfiguration, DisableAnonymousTrackingConfiguration, AnonymousTrackingOptions, ClearUserDataConfiguration, ConditionalContextProvider, ContextPrimitive, SelfDescribingEvent, SelfDescribingJson, CommonEventProperties, StructuredEvent, CustomEvent, ContextGenerator, FilterProvider, RuleSetProvider, ContextEvent, ContextFilter, RuleSet, newSession, setReferrerUrl, setCustomUrl, setDocumentTitle, discardHashTag, discardBrace, setCookiePath, setVisitorCookieTimeout, crossDomainLinker, enableActivityTracking, enableActivityTrackingCallback, updatePageActivity, setOptOutCookie, setUserId, setUserIdFromLocation, setUserIdFromReferrer, setUserIdFromCookie, setCollectorUrl, setBufferSize, flushBuffer, trackPageView, trackStructEvent, trackCustomEvent, setCustomTags, unsetCustomTags, trackSelfDescribingEvent, addGlobalContexts, removeGlobalContexts, clearGlobalContexts, preservePageViewId, disableAnonymousTracking, enableAnonymousTracking, clearUserData, addPlugin };
