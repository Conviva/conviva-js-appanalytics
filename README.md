# conviva-js-appanalytics
Conviva Use Application Analytics to autocollect events and track application specific events and state changes.

# Installation

```
npm install @convivainc/conviva-js-appanalytics
npm install @convivainc/conviva-js-appanalytics-performance-timing
npm install @convivainc/conviva-js-appanalytics-error-tracking
npm install @convivainc/conviva-js-appanalytics-click-tracking
```

```
yarn add @convivainc/conviva-js-appanalytics
```
# Usage
## Import to you project
Import the required packages into your project:
```js
import { convivaAppTracker, trackPageView, enableActivityTracking, trackCustomEvent, setUserId, trackStructEvent } from '@convivainc/conviva-js-appanalytics';
import { PerformanceTimingPlugin } from '@convivainc/conviva-js-appanalytics-performance-timing';
import { ErrorTrackingPlugin, enableErrorTracking } from '@convivainc/conviva-js-appanalytics-error-tracking';
import { LinkClickTrackingPlugin, enableLinkClickTracking, enableButtonClickTracking } from '@convivainc/conviva-js-appanalytics-click-tracking';

```

## Initialization

```js
convivaAppTracker({
  appId: '{{YOUR_APP_ID_ADVISED_BY_Conviva}}',
  convivaCustomerKey: '{{YOUR_CUSTOMER_KEY_ADVISED_BY_Conviva}}',
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

## Enable autocollection
```js
enableActivityTracking({
  minimumVisitLength: 2, // can be customized upon the customer’s business logic
  heartbeatDelay: 40 //can be customized upon the customer’s business logic
});
trackPageView();
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

data - Any type of data in string format.

The following example shows the implementation of the 'onClick' event listener to any element.

```js
let custom_data = "{\"identifier1\": \"test\",\"identifier2\": 1,\"identifier3\":true}";

trackCustomEvent({
  name: "custom_event_name",
  data: custom_data
}, ['CAT']);
```

## Note:
* Refer [https://pulse.conviva.com/learning-center/content/sensor_developer_center/sensor_integration/javascript/application_analytics/js_application_analytics.htm](https://pulse.conviva.com/learning-center/content/sensor_developer_center/sensor_integration/javascript/application_analytics/js_application_analytics.htm) for integration guidelines.
