import { TrackerConfiguration, BrowserTracker, CookieSameSite, Platform, EventMethod, StateStorageStrategy, ConvivaDeviceMetadata, ActivityTrackingConfiguration, ActivityTrackingConfigurationCallback, ActivityCallback, ActivityCallbackData, BrowserPlugin, BrowserPluginConfiguration, BuiltInContexts, DisableAnonymousTrackingConfiguration, EnableAnonymousTrackingConfiguration, AnonymousTrackingOptions, FlushBufferConfiguration, PageViewEvent, ClearUserDataConfiguration, ErrorEventProperties } from '@convivainc/browser-tracker-core';
import { version, CommonEventProperties, ConditionalContextProvider, ContextPrimitive, ContextGenerator, FilterProvider, RuleSetProvider, SelfDescribingEvent, SelfDescribingJson, StructuredEvent, CustomEvent, ContextEvent, ContextFilter, RuleSet, ButtonClickEvent, LinkClickEvent } from '@convivainc/tracker-core';
/**
 * Initialise a new tracker
 *
 * @param trackerId - The tracker id - also known as tracker namespace
 * @param endpoint - Collector endpoint in the form collector.mysite.com
 */
declare function convivaAppTracker(configuration: TrackerConfiguration): BrowserTracker;
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
 * Set the business-defined user ID for this user.
 *
 * @param userId - The business-defined user ID
 * @param trackers - The tracker identifiers which will be configured
 */
declare function setUserId(userId?: string | null, trackers?: Array<string>): void;
/**
 * Track a visit to a web page
 *
 * @param event - The Page View Event properties
 * @param trackers - The tracker identifiers which the event will be sent to
 */
declare function trackPageView(event?: PageViewEvent & CommonEventProperties, trackers?: Array<string>): void;
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
 * set if app has to keepAlive in Background
 *
 * @param isAlive - boolena to keep session active in background
 * @param trackers - The tracker identifiers which the plugin will be added to
 */
// export function setKeepAliveInBackground(isAlive: boolean, trackers?: Array<string>) {
//   dispatchToTrackers(trackers, (t) => {
//     t.setKeepAliveInBG(isAlive);
//   });
// }
/**
 * set if app has to keepAlive in Background
 *
 * @param isAlive - boolena to keep session active in background
 * @param trackers - The tracker identifiers which the plugin will be added to
 */
declare function cleanup(trackers?: Array<string>): void;
/**
 * Get Client ID
 * Return string
 */
declare function getClientId(): string;
/**
 * Set Client ID
 * A classic style for setting custom ClientID
 *
 * @param clientId - The Custom Event properties
 * @param trackers - The tracker identifiers which the event will be sent to
 */
declare function setClientId(clientId: string): void;
/**
 * Manually log a button click
 *
 * @param event - The event information
 * @param trackers - The tracker identifiers which the event will be sent to
 */
declare function trackButtonClick(event: ButtonClickEvent & CommonEventProperties, trackers?: Array<string>): void;
/**
 * Manually log a click
 *
 * @param event - The event information
 * @param trackers - The tracker identifiers which the event will be sent to
 */
declare function trackLinkClick(event: LinkClickEvent & CommonEventProperties, trackers?: Array<string>): void;
declare function trackError(event: ErrorEventProperties & CommonEventProperties, trackers?: Array<string>): void;
export { convivaAppTracker, BrowserTracker, TrackerConfiguration, CookieSameSite, Platform, EventMethod, StateStorageStrategy, ConvivaDeviceMetadata, version, ActivityTrackingConfiguration, ActivityTrackingConfigurationCallback, ActivityCallback, ActivityCallbackData, BrowserPlugin, BrowserPluginConfiguration, BuiltInContexts, FlushBufferConfiguration, PageViewEvent, EnableAnonymousTrackingConfiguration, DisableAnonymousTrackingConfiguration, AnonymousTrackingOptions, ClearUserDataConfiguration, ConditionalContextProvider, ContextPrimitive, SelfDescribingEvent, SelfDescribingJson, CommonEventProperties, StructuredEvent, CustomEvent, ContextGenerator, FilterProvider, RuleSetProvider, ContextEvent, ContextFilter, RuleSet, ErrorEventProperties, setReferrerUrl, setCustomUrl, setDocumentTitle, setUserId, trackPageView, trackCustomEvent, setCustomTags, unsetCustomTags, cleanup, getClientId, setClientId, trackButtonClick, trackLinkClick, trackError };
