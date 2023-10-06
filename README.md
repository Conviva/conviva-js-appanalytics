# conviva-js-appanalytics
Conviva Use Application Analytics to autocollect events and track application specific events and state changes.

# Installation

```
npm install @convivainc/conviva-js-appanalytics
```

```
yarn add @convivainc/conviva-js-appanalytics
```
# Usage
## Import to you project
Import the required packages into your project:
```js
import { convivaAppTracker, trackPageView, trackCustomEvent, setUserId } from '@convivainc/conviva-js-appanalytics';
import { PerformanceTimingPlugin } from '@convivainc/conviva-js-appanalytics-performance-timing';
import { ErrorTrackingPlugin, enableErrorTracking } from '@convivainc/conviva-js-appanalytics-error-tracking';
import { LinkClickTrackingPlugin, enableLinkClickTracking, enableButtonClickTracking } from '@convivainc/conviva-js-appanalytics-click-tracking';

```

## Initialization
Init the SDK with appId, customerKey and optional parameters. 
- appId: set this to your understandable application name, reflecting the platform and brand of your app. As an example: "WEB App", "LGTV Web App".
- convivaCustomerKey: the unique string identifier for your Conviva account. Provided by Conviva / can be obtained in the Conviva Pulse dashboard. 

```js
convivaAppTracker({
  appId: 'YOUR_APP_NAME_AS_STRING',
  convivaCustomerKey: 'CONVIVA_ACCOUNT_CUSTOMER_KEY',
  contexts: {
      performanceTiming: true
  },
  plugins: [ PerformanceTimingPlugin(), ErrorTrackingPlugin(), LinkClickTrackingPlugin()]
});

```

## Set the user id (viewer id)
```js
setUserId('replace_me_by_the_userId');
```

## Report Page View for tracking in-app page navigations.
```js
trackPageView();
```

## Enable autocollection of link & button clicks
```js
enableLinkClickTracking(); // Tracks all link clicks on the page
enableButtonClickTracking();
```

## Enable Error Tracking
```js
enableErrorTracking();

```

## Custom event tracking to track your application specific events and state changes
Use trackCustomEvent() API to track all kinds of events. This API provides 2 fields to describe the tracked events.

name - Name of the custom event.

data - Any type of data in json format.

The following example shows the data in JSON format.

```js
let custom_data = {
                    "identifier1": "test",
                    "identifier2": 1,
                    "identifier3":true
                  };

trackCustomEvent({
  name: "custom_event_name",
  data: custom_data
});
```

## Setting / Unsetting Custom tags to report your application specific data.
Use setCustomTags() API to set all kinds of tags (key value pairs). This API provides 1 argument that accepts data in JSON Format to describe the tags.

The following example shows the implementation of setting custom tags.
In this example we have 3 different tags tagKey1, tagKey2, tagKey3 with 3 different values.

```js
let customTagsToSet = {"tagKey1": "tagValue1","tagKey2": 1,"tagKey3":true};
setCustomTags(customTagsToSet);

```

Use unsetCustomTags() API to unset or remove that were already set. This API provides 1 argument to describe an array of tag keys to unset.

The following example shows the implementation of unset or remove custom tags.
```js
let customTagsToUnset = ['tagKey2', 'tagKey3'];
unsetCustomTags(customTagsToUnset);

```
#### Conviva Video Events to App Insight
We need minimum of the Video Sensor Core SDK Version of 4.5.13 to be in a stage to delegate the events:

[v4.5.13](https://github.com/Conviva/conviva-js-coresdk/releases/tag/v4.5.13)

4.5.13 (27/DEC/2022)
    - Supports broadcasting video events to Conviva App Insights SDKs to consume. For non App Insights users, there is no impact.


## Note:
For Script based integrations, please refer [https://github.com/Conviva/conviva-js-script-appanalytics](https://github.com/Conviva/conviva-js-script-appanalytics) for integration guidelines.
