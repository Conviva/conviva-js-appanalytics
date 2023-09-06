
# Changelog
## 0.3.29 (06/SEP/2023)
* Optimised performance timing context.

## 0.3.27 (27/JUL/2023)
* Fixes issue of elemntId not reported in button click event.

## 0.3.26 (17/JUL/2023)
* Supports collection of network request(http/https) performance metrics using the xmlhttpRequest or fetch Interceptor(which is disabled by default)

## 0.3.25 (28/JUN/2023)
* Fixes issue of duplicate eventIndex when app is opened in two or more tabs.

## 0.3.20 (01/JUN/2023)
* Removed unused fields from request payload.
* Fixes issue with default time of 'cacheRefreshInterval' when its fetch failed from remote config.

## 0.3.17 (24/APR/2023))
* Implements feature of the client id based event sequence number.

## 0.3.16 (14/APR/2023)
* Fixed Issue with remote config not applied after refresh interval.

## 0.3.14 (28/MAR/2023)
* Automatic tracking of Ajax requests enabled.

## 0.3.7 (23/DEC/2022)
* Detects Conviva Video Sensor events and metadata.

## 0.3.4 (12/DEC/2022)
* Exposes setCustomTags & unsetCustomTags APIs to report custom application data.

## 0.3.2 (28/OCT/2022)
* Added event_index and previousEventTimestamp into every HB.

## 0.2.11 (08/SEP/2022)
* Remote Config feature supported
* Improved periodic ping request (page_ping) feature to ping unconditionally regardless of user activity on the page.
* Fixed issue with button click detection on DOM change & avoided duplicate events being sent.
* Fixed issue with Page Title not being updated correctly

