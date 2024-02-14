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
- appVersion: set app version in string format.

```js
convivaAppTracker({
  appId: 'YOUR_APP_NAME_AS_STRING',
  convivaCustomerKey: 'CONVIVA_ACCOUNT_CUSTOMER_KEY',
  appVersion: "1.1.0",
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
By default document.title is set as page title but you can also pass custom page title details in trackPageView.
```js
trackPageView(); // default page title is document.title
trackPageView({"title": "Custom Page Title"});
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

#### Conviva Video Events to App Insight
We need minimum of the Video Sensor Core SDK Version of 4.5.13 to be in a stage to delegate the events:

[v4.5.13](https://github.com/Conviva/conviva-js-coresdk/releases/tag/v4.5.13)

4.5.13 (27/DEC/2022)
    - Supports broadcasting video events to Conviva App Insights SDKs to consume. For non App Insights users, there is no impact.

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
## AutoCollection of Network Request made using XMLHttpRequest and fetch api
This feature supports to track the Network Requests triggered with in application using XMLHttpRequest and fetch api
*Note: This collection is disabled by default, reach out to Conviva Team enabling the tracking.* <br>

<br> *Here are some of the granular details/limitations of the feature:*
* *Response and Request Body atributes are collected only when the:*
    * *size is < 10kb and the content-length is available* 
    * *response body is type json and content-type is "json", "text/plain", "text/javascript" or "application/javascript"*
* *Response and Request Headers are collected only when the:*
    * *server is provisioned with "Access-Control-Expose-Headers:*"* 



## AutoCollection of Meta tags from HEAD section of HTML page
This feature supports to track the Meta tags from HEAD section of HTML page based on the config provided.
#### metaTagsTracking is the config to collect Meta tags and can be provided as part of tracker Initialization under configs field.

Structure of metaTagsTracking config 
```js
//for below meta tags
<HTML>
    <HEAD>
    <meta name="keywords" content="HTML, CSS, JavaScript">
    <meta name="description" content="Free Web tutorials for HTML and CSS">
    <meta name="author" content="John Doe">
    <meta http-equiv="refresh" content="30">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta property="site_name" content="goole.com">
    <meta property="title" content="Sample app">
    <meta property="description" content="Tv series content">
    <meta property="locale" content="es_ES">
    <meta property="type" content="video">
    </HEAD>
</HTML>

//Example config to collect all name attributes and it's value and few certain property attributes and it's value.
convivaAppTracker({
  appId: 'YOUR_APP_NAME_AS_STRING',
  convivaCustomerKey: 'CONVIVA_ACCOUNT_CUSTOMER_KEY',
  appVersion: "1.1.0",
  contexts: {
      performanceTiming: true
  },
  plugins: [ PerformanceTimingPlugin(), ErrorTrackingPlugin(), LinkClickTrackingPlugin()],
  configs:{
        metaTagsTracking: {
          "tags":
            [
              {
                "key": "name", //mandatory //here key sepcifies what attributes tag to collect
                "value": "content", //mandatory //value specifies the value .
              },
              {
                "key": "property",
                "value": "content",
                "condition": ["title", "locale"] // optional //value of attributes placed in key to collect 
              },
              ...
            ]
        }
    }
});

```

## Auto Ingestion of "traceparent" header to network requests
This feature supports to ingest "traceparent" header into network requests based on the config provided. Note: This ingestion is disabled by default, reach out to Conviva Team enabling the tracking.

<details>
    <summary><b>Auto-collected Events</b></summary>


##### Conviva provides a rich set of application performance metrics with the help of autocollected app events, such as _button_click_, and _network_request_.

Event | Occurrence |
------|------------|
network_request | after receiving the network request response |
page_ping | Max X and Y scroll positions difference comparing to the last event|
application_error | when an error occurrs in the application|
button_click | on the button click callback|
link_click | on the link click callback|

To learn about the default metrics for analyzing the native and web applications performance, such as App Crashes, Avg Screen Load Time, and Page Loads, refer to the [App Experience Metrics](https://pulse.conviva.com/learning-center/content/app_experience/app_experience_metrics.html?tocpath=App%20Experience%7C_____8) page in the Learning Center.
</details>

## Note:
For Script based integrations, please refer [https://github.com/Conviva/conviva-js-script-appanalytics](https://github.com/Conviva/conviva-js-script-appanalytics) for integration guidelines.
