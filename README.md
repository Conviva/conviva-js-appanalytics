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
import { LinkClickTrackingPlugin, enableLinkClickTracking, ButtonClickTrackingPlugin, enableButtonClickTracking } from '@convivainc/conviva-js-appanalytics-click-tracking';

```

## Initialization

```js
convivaAppTracker({
  appId: '{{YOUR_APP_ID_ADVISED_BY_Conviva}}',
  convivaCustomerKey: '{{YOUR_CUSTOMER_KEY_ADVISED_BY_Conviva}}',
  contexts: {
      performanceTiming: true
  },
  plugins: [ PerformanceTimingPlugin(), ErrorTrackingPlugin()]
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

```

## Extend tracking to track your application specific events and state changes
Use trackStructEvent event type to track all kinds of events. This event type provides 5 fields to describe the tracked events. The semantics of the values for these 5 fields are flexible and could be customized.

category - Define a broad classification of categories for various types of events, such as button, user actions, state, etc.

action - Define the type of action. For example, click, scroll, submit, add to cart, etc.

label - Label the item under the action or subject of the action.

property - Define the properties associated with the event.

value - Define the value (float number). For example, scroll position, total number of items added to a cart, etc.

The following example shows the implementation of the 'on click' event listener to any element on the web page. The category is button, label is the rendered text of the clicked button, and property is a list of classes.

```js
trackStructEvent({
   category: 'subscription',
   action: 'purchase',
   label:'success',
   property:'1-year',
   value: 250.00
});
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
}. ['CAT']);
```

## Note:
* Refer [https://pulse.conviva.com/learning-center/content/sensor_developer_center/sensor_integration/javascript/application_analytics/js_application_analytics.htm](https://pulse.conviva.com/learning-center/content/sensor_developer_center/sensor_integration/javascript/application_analytics/js_application_analytics.htm) for integration guidelines.
