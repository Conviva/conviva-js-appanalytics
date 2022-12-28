/*!
 * Browser tracker for Snowplow v0.3.8 (http://bit.ly/sp-js)
 * Copyright 2022 Snowplow Analytics Ltd, 2010 Anthon Pang
 * Licensed under BSD-3-Clause
 */

(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
    typeof define === 'function' && define.amd ? define(['exports'], factory) :
    (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.snowplowBrowserTracking = {}));
})(this, (function (exports) { 'use strict';

    /*! *****************************************************************************
    Copyright (c) Microsoft Corporation.

    Permission to use, copy, modify, and/or distribute this software for any
    purpose with or without fee is hereby granted.

    THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
    REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
    AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
    INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
    LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
    OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
    PERFORMANCE OF THIS SOFTWARE.
    ***************************************************************************** */

    var __assign = function() {
        __assign = Object.assign || function __assign(t) {
            for (var s, i = 1, n = arguments.length; i < n; i++) {
                s = arguments[i];
                for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
            }
            return t;
        };
        return __assign.apply(this, arguments);
    };

    function __spreadArray(to, from, pack) {
        if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
            if (ar || !(i in from)) {
                if (!ar) ar = Array.prototype.slice.call(from, 0, i);
                ar[i] = from[i];
            }
        }
        return to.concat(ar || Array.prototype.slice.call(from));
    }

    var rngBrowser = {exports: {}};

    // Unique ID creation requires a high quality random # generator.  In the
    // browser this is a little complicated due to unknown quality of Math.random()
    // and inconsistent support for the `crypto` API.  We do the best we can via
    // feature-detection

    // getRandomValues needs to be invoked in a context where "this" is a Crypto
    // implementation. Also, find the complete implementation of crypto on IE11.
    var getRandomValues = (typeof(crypto) != 'undefined' && crypto.getRandomValues && crypto.getRandomValues.bind(crypto)) ||
                          (typeof(msCrypto) != 'undefined' && typeof window.msCrypto.getRandomValues == 'function' && msCrypto.getRandomValues.bind(msCrypto));

    if (getRandomValues) {
      // WHATWG crypto RNG - http://wiki.whatwg.org/wiki/Crypto
      var rnds8 = new Uint8Array(16); // eslint-disable-line no-undef

      rngBrowser.exports = function whatwgRNG() {
        getRandomValues(rnds8);
        return rnds8;
      };
    } else {
      // Math.random()-based (RNG)
      //
      // If all else fails, use Math.random().  It's fast, but is of unspecified
      // quality.
      var rnds = new Array(16);

      rngBrowser.exports = function mathRNG() {
        for (var i = 0, r; i < 16; i++) {
          if ((i & 0x03) === 0) r = Math.random() * 0x100000000;
          rnds[i] = r >>> ((i & 0x03) << 3) & 0xff;
        }

        return rnds;
      };
    }

    /**
     * Convert array of 16 byte values to UUID string format of the form:
     * XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX
     */

    var byteToHex = [];
    for (var i = 0; i < 256; ++i) {
      byteToHex[i] = (i + 0x100).toString(16).substr(1);
    }

    function bytesToUuid$2(buf, offset) {
      var i = offset || 0;
      var bth = byteToHex;
      // join used to fix memory issue caused by concatenation: https://bugs.chromium.org/p/v8/issues/detail?id=3175#c4
      return ([
        bth[buf[i++]], bth[buf[i++]],
        bth[buf[i++]], bth[buf[i++]], '-',
        bth[buf[i++]], bth[buf[i++]], '-',
        bth[buf[i++]], bth[buf[i++]], '-',
        bth[buf[i++]], bth[buf[i++]], '-',
        bth[buf[i++]], bth[buf[i++]],
        bth[buf[i++]], bth[buf[i++]],
        bth[buf[i++]], bth[buf[i++]]
      ]).join('');
    }

    var bytesToUuid_1 = bytesToUuid$2;

    var rng$1 = rngBrowser.exports;
    var bytesToUuid$1 = bytesToUuid_1;

    // **`v1()` - Generate time-based UUID**
    //
    // Inspired by https://github.com/LiosK/UUID.js
    // and http://docs.python.org/library/uuid.html

    var _nodeId;
    var _clockseq;

    // Previous uuid creation time
    var _lastMSecs = 0;
    var _lastNSecs = 0;

    // See https://github.com/uuidjs/uuid for API details
    function v1$1(options, buf, offset) {
      var i = buf && offset || 0;
      var b = buf || [];

      options = options || {};
      var node = options.node || _nodeId;
      var clockseq = options.clockseq !== undefined ? options.clockseq : _clockseq;

      // node and clockseq need to be initialized to random values if they're not
      // specified.  We do this lazily to minimize issues related to insufficient
      // system entropy.  See #189
      if (node == null || clockseq == null) {
        var seedBytes = rng$1();
        if (node == null) {
          // Per 4.5, create and 48-bit node id, (47 random bits + multicast bit = 1)
          node = _nodeId = [
            seedBytes[0] | 0x01,
            seedBytes[1], seedBytes[2], seedBytes[3], seedBytes[4], seedBytes[5]
          ];
        }
        if (clockseq == null) {
          // Per 4.2.2, randomize (14 bit) clockseq
          clockseq = _clockseq = (seedBytes[6] << 8 | seedBytes[7]) & 0x3fff;
        }
      }

      // UUID timestamps are 100 nano-second units since the Gregorian epoch,
      // (1582-10-15 00:00).  JSNumbers aren't precise enough for this, so
      // time is handled internally as 'msecs' (integer milliseconds) and 'nsecs'
      // (100-nanoseconds offset from msecs) since unix epoch, 1970-01-01 00:00.
      var msecs = options.msecs !== undefined ? options.msecs : new Date().getTime();

      // Per 4.2.1.2, use count of uuid's generated during the current clock
      // cycle to simulate higher resolution clock
      var nsecs = options.nsecs !== undefined ? options.nsecs : _lastNSecs + 1;

      // Time since last uuid creation (in msecs)
      var dt = (msecs - _lastMSecs) + (nsecs - _lastNSecs)/10000;

      // Per 4.2.1.2, Bump clockseq on clock regression
      if (dt < 0 && options.clockseq === undefined) {
        clockseq = clockseq + 1 & 0x3fff;
      }

      // Reset nsecs if clock regresses (new clockseq) or we've moved onto a new
      // time interval
      if ((dt < 0 || msecs > _lastMSecs) && options.nsecs === undefined) {
        nsecs = 0;
      }

      // Per 4.2.1.2 Throw error if too many uuids are requested
      if (nsecs >= 10000) {
        throw new Error('uuid.v1(): Can\'t create more than 10M uuids/sec');
      }

      _lastMSecs = msecs;
      _lastNSecs = nsecs;
      _clockseq = clockseq;

      // Per 4.1.4 - Convert from unix epoch to Gregorian epoch
      msecs += 12219292800000;

      // `time_low`
      var tl = ((msecs & 0xfffffff) * 10000 + nsecs) % 0x100000000;
      b[i++] = tl >>> 24 & 0xff;
      b[i++] = tl >>> 16 & 0xff;
      b[i++] = tl >>> 8 & 0xff;
      b[i++] = tl & 0xff;

      // `time_mid`
      var tmh = (msecs / 0x100000000 * 10000) & 0xfffffff;
      b[i++] = tmh >>> 8 & 0xff;
      b[i++] = tmh & 0xff;

      // `time_high_and_version`
      b[i++] = tmh >>> 24 & 0xf | 0x10; // include version
      b[i++] = tmh >>> 16 & 0xff;

      // `clock_seq_hi_and_reserved` (Per 4.2.2 - include variant)
      b[i++] = clockseq >>> 8 | 0x80;

      // `clock_seq_low`
      b[i++] = clockseq & 0xff;

      // `node`
      for (var n = 0; n < 6; ++n) {
        b[i + n] = node[n];
      }

      return buf ? buf : bytesToUuid$1(b);
    }

    var v1_1 = v1$1;

    var rng = rngBrowser.exports;
    var bytesToUuid = bytesToUuid_1;

    function v4$1(options, buf, offset) {
      var i = buf && offset || 0;

      if (typeof(options) == 'string') {
        buf = options === 'binary' ? new Array(16) : null;
        options = null;
      }
      options = options || {};

      var rnds = options.random || (options.rng || rng)();

      // Per 4.4, set bits for version and `clock_seq_hi_and_reserved`
      rnds[6] = (rnds[6] & 0x0f) | 0x40;
      rnds[8] = (rnds[8] & 0x3f) | 0x80;

      // Copy bytes to buffer, if provided
      if (buf) {
        for (var ii = 0; ii < 16; ++ii) {
          buf[i + ii] = rnds[ii];
        }
      }

      return buf || bytesToUuid(rnds);
    }

    var v4_1 = v4$1;

    var v1 = v1_1;
    var v4 = v4_1;

    var uuid = v4;
    uuid.v1 = v1;
    uuid.v4 = v4;

    var uuid_1 = uuid;

    /*!
     * Core functionality for Snowplow JavaScript trackers v0.3.8 (http://bit.ly/sp-js)
     * Copyright 2022 Snowplow Analytics Ltd, 2010 Anthon Pang
     * Licensed under BSD-3-Clause
     */

    var version$1 = "0.3.8.1";

    /*
     * Copyright (c) 2013 Kevin van Zonneveld (http://kvz.io)
     * and Contributors (http://phpjs.org/authors)
     *
     * Permission is hereby granted, free of charge, to any person obtaining a copy of
     * this software and associated documentation files (the "Software"), to deal in
     * the Software without restriction, including without limitation the rights to
     * use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies
     * of the Software, and to permit persons to whom the Software is furnished to do
     * so, subject to the following conditions:
     *
     * The above copyright notice and this permission notice shall be included in all
     * copies or substantial portions of the Software.
     *
     * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
     * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
     * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
     * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
     * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
     * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
     * SOFTWARE.
     */
    /**
     * Decodes a url safe Base 64 encoded string
     * @remarks See: {@link http://tools.ietf.org/html/rfc4648#page-7}
     * @param data - String to decode
     * @returns The decoded string
     */
    function base64urldecode(data) {
        if (!data) {
            return data;
        }
        var padding = 4 - (data.length % 4);
        switch (padding) {
            case 2:
                data += '==';
                break;
            case 3:
                data += '=';
                break;
        }
        var b64Data = data.replace(/-/g, '+').replace(/_/g, '/');
        return base64decode(b64Data);
    }
    /**
     * Encodes a string into a url safe Base 64 encoded string
     * @remarks See: {@link http://tools.ietf.org/html/rfc4648#page-7}
     * @param data - String to encode
     * @returns The url safe Base 64 string
     */
    function base64urlencode(data) {
        if (!data) {
            return data;
        }
        var enc = base64encode(data);
        return enc.replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
    }
    var b64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
    /**
     * Encode string as base64.
     * Any type can be passed, but will be stringified
     *
     * @param data - string to encode
     * @returns base64-encoded string
     */
    function base64encode(data) {
        // discuss at: http://phpjs.org/functions/base64_encode/
        // original by: Tyler Akins (http://rumkin.com)
        // improved by: Bayron Guevara
        // improved by: Thunder.m
        // improved by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
        // improved by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
        // improved by: Rafał Kukawski (http://kukawski.pl)
        // bugfixed by: Pellentesque Malesuada
        // example 1: base64_encode('Kevin van Zonneveld');
        // returns 1: 'S2V2aW4gdmFuIFpvbm5ldmVsZA=='
        // example 2: base64_encode('a');
        // returns 2: 'YQ=='
        // example 3: base64_encode('✓ à la mode');
        // returns 3: '4pyTIMOgIGxhIG1vZGU='
        var o1, o2, o3, h1, h2, h3, h4, bits, i = 0, ac = 0;
        var tmp_arr = [];
        if (!data) {
            return data;
        }
        data = unescape(encodeURIComponent(data));
        do {
            // pack three octets into four hexets
            o1 = data.charCodeAt(i++);
            o2 = data.charCodeAt(i++);
            o3 = data.charCodeAt(i++);
            bits = (o1 << 16) | (o2 << 8) | o3;
            h1 = (bits >> 18) & 0x3f;
            h2 = (bits >> 12) & 0x3f;
            h3 = (bits >> 6) & 0x3f;
            h4 = bits & 0x3f;
            // use hexets to index into b64, and append result to encoded string
            tmp_arr[ac++] = b64.charAt(h1) + b64.charAt(h2) + b64.charAt(h3) + b64.charAt(h4);
        } while (i < data.length);
        var enc = tmp_arr.join('');
        var r = data.length % 3;
        return (r ? enc.slice(0, r - 3) : enc) + '==='.slice(r || 3);
    }
    /**
     * Decode base64 to string
     *
     * @param data - base64 to string
     * @returns decoded string
     */
    function base64decode(encodedData) {
        //  discuss at: http://locutus.io/php/base64_decode/
        // original by: Tyler Akins (http://rumkin.com)
        // improved by: Thunder.m
        // improved by: Kevin van Zonneveld (http://kvz.io)
        // improved by: Kevin van Zonneveld (http://kvz.io)
        //    input by: Aman Gupta
        //    input by: Brett Zamir (http://brett-zamir.me)
        // bugfixed by: Onno Marsman (https://twitter.com/onnomarsman)
        // bugfixed by: Pellentesque Malesuada
        // bugfixed by: Kevin van Zonneveld (http://kvz.io)
        // improved by: Indigo744
        //   example 1: base64_decode('S2V2aW4gdmFuIFpvbm5ldmVsZA==')
        //   returns 1: 'Kevin van Zonneveld'
        //   example 2: base64_decode('YQ==')
        //   returns 2: 'a'
        //   example 3: base64_decode('4pyTIMOgIGxhIG1vZGU=')
        //   returns 3: '✓ à la mode'
        // decodeUTF8string()
        // Internal function to decode properly UTF8 string
        // Adapted from Solution #1 at https://developer.mozilla.org/en-US/docs/Web/API/WindowBase64/Base64_encoding_and_decoding
        var decodeUTF8string = function (str) {
            // Going backwards: from bytestream, to percent-encoding, to original string.
            return decodeURIComponent(str
                .split('')
                .map(function (c) {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            })
                .join(''));
        };
        var o1, o2, o3, h1, h2, h3, h4, bits, i = 0, ac = 0, dec = '';
        var tmpArr = [];
        if (!encodedData) {
            return encodedData;
        }
        encodedData += '';
        do {
            // unpack four hexets into three octets using index points in b64
            h1 = b64.indexOf(encodedData.charAt(i++));
            h2 = b64.indexOf(encodedData.charAt(i++));
            h3 = b64.indexOf(encodedData.charAt(i++));
            h4 = b64.indexOf(encodedData.charAt(i++));
            bits = (h1 << 18) | (h2 << 12) | (h3 << 6) | h4;
            o1 = (bits >> 16) & 0xff;
            o2 = (bits >> 8) & 0xff;
            o3 = bits & 0xff;
            if (h3 === 64) {
                tmpArr[ac++] = String.fromCharCode(o1);
            }
            else if (h4 === 64) {
                tmpArr[ac++] = String.fromCharCode(o1, o2);
            }
            else {
                tmpArr[ac++] = String.fromCharCode(o1, o2, o3);
            }
        } while (i < encodedData.length);
        dec = tmpArr.join('');
        return decodeUTF8string(dec.replace(/\0+$/, ''));
    }

    /*
     * Copyright (c) 2022 Snowplow Analytics Ltd, 2010 Anthon Pang
     * All rights reserved.
     *
     * Redistribution and use in source and binary forms, with or without
     * modification, are permitted provided that the following conditions are met:
     *
     * 1. Redistributions of source code must retain the above copyright notice, this
     *    list of conditions and the following disclaimer.
     *
     * 2. Redistributions in binary form must reproduce the above copyright notice,
     *    this list of conditions and the following disclaimer in the documentation
     *    and/or other materials provided with the distribution.
     *
     * 3. Neither the name of the copyright holder nor the names of its
     *    contributors may be used to endorse or promote products derived from
     *    this software without specific prior written permission.
     *
     * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
     * AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
     * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
     * DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE
     * FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
     * DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
     * SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
     * CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
     * OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
     * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
     */
    function payloadBuilder() {
        var dict = {}, allJson = [], jsonForProcessing = [], contextEntitiesForProcessing = [];
        var processor;
        var add = function (key, value) {
            if (value != null && value !== '') {
                // null also checks undefined
                dict[key] = value;
            }
        };
        var addDict = function (dict) {
            for (var key in dict) {
                if (Object.prototype.hasOwnProperty.call(dict, key)) {
                    add(key, dict[key]);
                }
            }
        };
        var addJson = function (keyIfEncoded, keyIfNotEncoded, json) {
            if (json && isNonEmptyJson(json)) {
                var jsonWithKeys = { keyIfEncoded: keyIfEncoded, keyIfNotEncoded: keyIfNotEncoded, json: json };
                jsonForProcessing.push(jsonWithKeys);
                allJson.push(jsonWithKeys);
            }
        };
        var addContextEntity = function (entity) {
            contextEntitiesForProcessing.push(entity);
        };
        return {
            add: add,
            addDict: addDict,
            addJson: addJson,
            addContextEntity: addContextEntity,
            getPayload: function () { return dict; },
            getJson: function () { return allJson; },
            withJsonProcessor: function (jsonProcessor) {
                processor = jsonProcessor;
            },
            build: function () {
                processor === null || processor === void 0 ? void 0 : processor(this, jsonForProcessing, contextEntitiesForProcessing);
                return dict;
            }
        };
    }
    /**
     * A helper to build a Snowplow request from a set of name-value pairs, provided using the add methods.
     * Will base64 encode JSON, if desired, on build
     *
     * @returns The request builder, with add and build methods
     */
    function payloadJsonProcessor(encodeBase64) {
        return function (payloadBuilder, jsonForProcessing, contextEntitiesForProcessing) {
            var add = function (json, keyIfEncoded, keyIfNotEncoded) {
                var str = JSON.stringify(json);
                if (encodeBase64) {
                    payloadBuilder.add(keyIfEncoded, base64urlencode(str));
                }
                else {
                    payloadBuilder.add(keyIfNotEncoded, str);
                }
            };
            var getContextFromPayload = function () {
                var payload = payloadBuilder.getPayload();
                if (encodeBase64 ? payload.cx : payload.co) {
                    return JSON.parse(encodeBase64 ? base64urldecode(payload.cx) : payload.co);
                }
                return undefined;
            };
            var combineContexts = function (originalContext, newContext) {
                var context = originalContext || getContextFromPayload();
                if (context) {
                    context.data = context.data.concat(newContext.data);
                }
                else {
                    context = newContext;
                }
                return context;
            };
            var context = undefined;
            for (var _i = 0, jsonForProcessing_1 = jsonForProcessing; _i < jsonForProcessing_1.length; _i++) {
                var json = jsonForProcessing_1[_i];
                if (json.keyIfEncoded === 'cx') {
                    context = combineContexts(context, json.json);
                }
                else {
                    add(json.json, json.keyIfEncoded, json.keyIfNotEncoded);
                }
            }
            jsonForProcessing.length = 0;
            if (contextEntitiesForProcessing.length) {
                var newContext = {
                    schema: 'iglu:com.snowplowanalytics.snowplow/contexts/jsonschema/1-0-0',
                    data: __spreadArray([], contextEntitiesForProcessing, true)
                };
                context = combineContexts(context, newContext);
                contextEntitiesForProcessing.length = 0;
            }
            if (context) {
                add(context, 'cx', 'co');
            }
        };
    }
    /**
     * Is property a non-empty JSON?
     * @param property - Checks if object is non-empty json
     */
    function isNonEmptyJson(property) {
        if (!isJson(property)) {
            return false;
        }
        for (var key in property) {
            if (Object.prototype.hasOwnProperty.call(property, key)) {
                return true;
            }
        }
        return false;
    }
    /**
     * Is property a JSON?
     * @param property - Checks if object is json
     */
    function isJson(property) {
        return (typeof property !== 'undefined' &&
            property !== null &&
            (property.constructor === {}.constructor || property.constructor === [].constructor));
    }

    /*
     * Copyright (c) 2022 Snowplow Analytics Ltd, 2010 Anthon Pang
     * All rights reserved.
     *
     * Redistribution and use in source and binary forms, with or without
     * modification, are permitted provided that the following conditions are met:
     *
     * 1. Redistributions of source code must retain the above copyright notice, this
     *    list of conditions and the following disclaimer.
     *
     * 2. Redistributions in binary form must reproduce the above copyright notice,
     *    this list of conditions and the following disclaimer in the documentation
     *    and/or other materials provided with the distribution.
     *
     * 3. Neither the name of the copyright holder nor the names of its
     *    contributors may be used to endorse or promote products derived from
     *    this software without specific prior written permission.
     *
     * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
     * AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
     * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
     * DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE
     * FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
     * DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
     * SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
     * CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
     * OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
     * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
     */
    var label = 'Snowplow: ';
    var LOG_LEVEL;
    (function (LOG_LEVEL) {
        LOG_LEVEL[LOG_LEVEL["none"] = 0] = "none";
        LOG_LEVEL[LOG_LEVEL["error"] = 1] = "error";
        LOG_LEVEL[LOG_LEVEL["warn"] = 2] = "warn";
        LOG_LEVEL[LOG_LEVEL["debug"] = 3] = "debug";
        LOG_LEVEL[LOG_LEVEL["info"] = 4] = "info";
    })(LOG_LEVEL || (LOG_LEVEL = {}));
    var LOG = logger();
    function logger(logLevel) {
        if (logLevel === void 0) { logLevel = LOG_LEVEL.warn; }
        function setLogLevel(level) {
            if (LOG_LEVEL[level]) {
                logLevel = level;
            }
            else {
                logLevel = LOG_LEVEL.warn;
            }
        }
        /**
         * Log errors, with or without error object
         */
        function error(message, error) {
            var extraParams = [];
            for (var _i = 2; _i < arguments.length; _i++) {
                extraParams[_i - 2] = arguments[_i];
            }
            if (logLevel >= LOG_LEVEL.error && typeof console !== 'undefined') {
                var logMsg = label + message + '\n';
                if (error) {
                    console.error.apply(console, __spreadArray([logMsg + '\n', error], extraParams, false));
                }
                else {
                    console.error.apply(console, __spreadArray([logMsg], extraParams, false));
                }
            }
        }
        /**
         * Log warnings, with or without error object
         */
        function warn(message, error) {
            var extraParams = [];
            for (var _i = 2; _i < arguments.length; _i++) {
                extraParams[_i - 2] = arguments[_i];
            }
            if (logLevel >= LOG_LEVEL.warn && typeof console !== 'undefined') {
                var logMsg = label + message;
                if (error) {
                    console.warn.apply(console, __spreadArray([logMsg + '\n', error], extraParams, false));
                }
                else {
                    console.warn.apply(console, __spreadArray([logMsg], extraParams, false));
                }
            }
        }
        /**
         * Log debug messages
         */
        function debug(message) {
            var extraParams = [];
            for (var _i = 1; _i < arguments.length; _i++) {
                extraParams[_i - 1] = arguments[_i];
            }
            if (logLevel >= LOG_LEVEL.debug && typeof console !== 'undefined') {
                console.debug.apply(console, __spreadArray([label + message], extraParams, false));
            }
        }
        /**
         * Log info messages
         */
        function info(message) {
            var extraParams = [];
            for (var _i = 1; _i < arguments.length; _i++) {
                extraParams[_i - 1] = arguments[_i];
            }
            if (logLevel >= LOG_LEVEL.info && typeof console !== 'undefined') {
                console.info.apply(console, __spreadArray([label + message], extraParams, false));
            }
        }
        return { setLogLevel: setLogLevel, warn: warn, error: error, debug: debug, info: info };
    }

    /*
     * Copyright (c) 2022 Snowplow Analytics Ltd, 2010 Anthon Pang
     * All rights reserved.
     *
     * Redistribution and use in source and binary forms, with or without
     * modification, are permitted provided that the following conditions are met:
     *
     * 1. Redistributions of source code must retain the above copyright notice, this
     *    list of conditions and the following disclaimer.
     *
     * 2. Redistributions in binary form must reproduce the above copyright notice,
     *    this list of conditions and the following disclaimer in the documentation
     *    and/or other materials provided with the distribution.
     *
     * 3. Neither the name of the copyright holder nor the names of its
     *    contributors may be used to endorse or promote products derived from
     *    this software without specific prior written permission.
     *
     * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
     * AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
     * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
     * DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE
     * FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
     * DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
     * SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
     * CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
     * OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
     * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
     */
    /**
     * Contains helper functions to aid in the addition and removal of Global Contexts
     */
    function globalContexts() {
        var globalPrimitives = [];
        var conditionalProviders = [];
        /**
         * Returns all applicable global contexts for a specified event
         * @param event - The event to check for applicable global contexts for
         * @returns An array of contexts
         */
        var assembleAllContexts = function (event) {
            var eventSchema = getUsefulSchema(event);
            var eventType = getEventType(event);
            var contexts = [];
            var generatedPrimitives = generatePrimitives(globalPrimitives, event, eventType, eventSchema);
            contexts.push.apply(contexts, generatedPrimitives);
            var generatedConditionals = generateConditionals(conditionalProviders, event, eventType, eventSchema);
            contexts.push.apply(contexts, generatedConditionals);
            return contexts;
        };
        return {
            getGlobalPrimitives: function () {
                return globalPrimitives;
            },
            getConditionalProviders: function () {
                return conditionalProviders;
            },
            addGlobalContexts: function (contexts) {
                var acceptedConditionalContexts = [];
                var acceptedContextPrimitives = [];
                for (var _i = 0, contexts_1 = contexts; _i < contexts_1.length; _i++) {
                    var context = contexts_1[_i];
                    if (isConditionalContextProvider(context)) {
                        acceptedConditionalContexts.push(context);
                    }
                    else if (isContextPrimitive(context)) {
                        acceptedContextPrimitives.push(context);
                    }
                }
                globalPrimitives = globalPrimitives.concat(acceptedContextPrimitives);
                conditionalProviders = conditionalProviders.concat(acceptedConditionalContexts);
            },
            clearGlobalContexts: function () {
                conditionalProviders = [];
                globalPrimitives = [];
            },
            removeGlobalContexts: function (contexts) {
                var _loop_1 = function (context) {
                    if (isConditionalContextProvider(context)) {
                        conditionalProviders = conditionalProviders.filter(function (item) { return JSON.stringify(item) !== JSON.stringify(context); });
                    }
                    else if (isContextPrimitive(context)) {
                        globalPrimitives = globalPrimitives.filter(function (item) { return JSON.stringify(item) !== JSON.stringify(context); });
                    }
                };
                for (var _i = 0, contexts_2 = contexts; _i < contexts_2.length; _i++) {
                    var context = contexts_2[_i];
                    _loop_1(context);
                }
            },
            getApplicableContexts: function (event) {
                return assembleAllContexts(event);
            }
        };
    }
    function pluginContexts(plugins) {
        /**
         * Add common contexts to every event
         *
         * @param array - additionalContexts List of user-defined contexts
         * @returns userContexts combined with commonContexts
         */
        return {
            addPluginContexts: function (additionalContexts) {
                var combinedContexts = additionalContexts ? __spreadArray([], additionalContexts, true) : [];
                plugins.forEach(function (plugin) {
                    try {
                        if (plugin.contexts) {
                            combinedContexts.push.apply(combinedContexts, plugin.contexts());
                        }
                    }
                    catch (ex) {
                        LOG.error('Error adding plugin contexts', ex);
                    }
                });
                return combinedContexts;
            }
        };
    }
    /**
     * Slices a schema into its composite parts. Useful for ruleset filtering.
     * @param input - A schema string
     * @returns The vendor, schema name, major, minor and patch information of a schema string
     */
    function getSchemaParts(input) {
        var re = new RegExp('^iglu:([a-zA-Z0-9-_.]+)/([a-zA-Z0-9-_]+)/jsonschema/([1-9][0-9]*)-(0|[1-9][0-9]*)-(0|[1-9][0-9]*)$');
        var matches = re.exec(input);
        if (matches !== null)
            return matches.slice(1, 6);
        return undefined;
    }
    /**
     * Validates the vendor section of a schema string contains allowed wildcard values
     * @param parts - Array of parts from a schema string
     * @returns Whether the vendor validation parts are a valid combination
     */
    function validateVendorParts(parts) {
        if (parts[0] === '*' || parts[1] === '*') {
            return false; // no wildcard in first or second part
        }
        if (parts.slice(2).length > 0) {
            var asterisk = false;
            for (var _i = 0, _a = parts.slice(2); _i < _a.length; _i++) {
                var part = _a[_i];
                if (part === '*')
                    // mark when we've found a wildcard
                    asterisk = true;
                else if (asterisk)
                    // invalid if alpha parts come after wildcard
                    return false;
            }
            return true;
        }
        else if (parts.length == 2)
            return true;
        return false;
    }
    /**
     * Validates the vendor part of a schema string is valid for a rule set
     * @param input - Vendor part of a schema string
     * @returns Whether the vendor validation string is valid
     */
    function validateVendor(input) {
        var parts = input.split('.');
        if (parts && parts.length > 1)
            return validateVendorParts(parts);
        return false;
    }
    /**
     * Checks for validity of input and returns all the sections of a schema string that are used to match rules in a ruleset
     * @param input - A Schema string
     * @returns The sections of a schema string that are used to match rules in a ruleset
     */
    function getRuleParts(input) {
        var re = new RegExp('^iglu:((?:(?:[a-zA-Z0-9-_]+|\\*).)+(?:[a-zA-Z0-9-_]+|\\*))/([a-zA-Z0-9-_.]+|\\*)/jsonschema/([1-9][0-9]*|\\*)-(0|[1-9][0-9]*|\\*)-(0|[1-9][0-9]*|\\*)$');
        var matches = re.exec(input);
        if (matches !== null && validateVendor(matches[1]))
            return matches.slice(1, 6);
        return undefined;
    }
    /**
     * Ensures the rules specified in a schema string of a ruleset are valid
     * @param input - A Schema string
     * @returns if there rule is valid
     */
    function isValidRule(input) {
        var ruleParts = getRuleParts(input);
        if (ruleParts) {
            var vendor = ruleParts[0];
            return ruleParts.length === 5 && validateVendor(vendor);
        }
        return false;
    }
    /**
     * Check if a variable is an Array containing only strings
     * @param input - The variable to validate
     * @returns True if the input is an array containing only strings
     */
    function isStringArray(input) {
        return (Array.isArray(input) &&
            input.every(function (x) {
                return typeof x === 'string';
            }));
    }
    /**
     * Validates whether a rule set is an array of valid ruleset strings
     * @param input - The Array of rule set arguments
     * @returns True is the input is an array of valid rules
     */
    function isValidRuleSetArg(input) {
        if (isStringArray(input))
            return input.every(function (x) {
                return isValidRule(x);
            });
        else if (typeof input === 'string')
            return isValidRule(input);
        return false;
    }
    /**
     * Check if a variable is a valid, non-empty Self Describing JSON
     * @param input - The variable to validate
     * @returns True if a valid Self Describing JSON
     */
    function isSelfDescribingJson(input) {
        var sdj = input;
        if (isNonEmptyJson(sdj))
            if ('schema' in sdj && 'data' in sdj)
                return typeof sdj.schema === 'string' && typeof sdj.data === 'object';
        return false;
    }
    /**
     * Validates if the input object contains the expected properties of a ruleset
     * @param input - The object containing a rule set
     * @returns True if a valid rule set
     */
    function isRuleSet(input) {
        var ruleSet = input;
        var ruleCount = 0;
        if (input != null && typeof input === 'object' && !Array.isArray(input)) {
            if (Object.prototype.hasOwnProperty.call(ruleSet, 'accept')) {
                if (isValidRuleSetArg(ruleSet['accept'])) {
                    ruleCount += 1;
                }
                else {
                    return false;
                }
            }
            if (Object.prototype.hasOwnProperty.call(ruleSet, 'reject')) {
                if (isValidRuleSetArg(ruleSet['reject'])) {
                    ruleCount += 1;
                }
                else {
                    return false;
                }
            }
            // if either 'reject' or 'accept' or both exists,
            // we have a valid ruleset
            return ruleCount > 0 && ruleCount <= 2;
        }
        return false;
    }
    /**
     * Validates if the function can be a valid context generator function
     * @param input - The function to be validated
     */
    function isContextCallbackFunction(input) {
        return typeof input === 'function' && input.length <= 1;
    }
    /**
     * Validates if the function can be a valid context primitive function or self describing json
     * @param input - The function or orbject to be validated
     * @returns True if either a Context Generator or Self Describing JSON
     */
    function isContextPrimitive(input) {
        return isContextCallbackFunction(input) || isSelfDescribingJson(input);
    }
    /**
     * Validates if an array is a valid shape to be a Filter Provider
     * @param input - The Array of Context filter callbacks
     */
    function isFilterProvider(input) {
        if (Array.isArray(input)) {
            if (input.length === 2) {
                if (Array.isArray(input[1])) {
                    return isContextCallbackFunction(input[0]) && input[1].every(isContextPrimitive);
                }
                return isContextCallbackFunction(input[0]) && isContextPrimitive(input[1]);
            }
        }
        return false;
    }
    /**
     * Validates if an array is a valid shape to be an array of rule sets
     * @param input - The Array of Rule Sets
     */
    function isRuleSetProvider(input) {
        if (Array.isArray(input) && input.length === 2) {
            if (!isRuleSet(input[0]))
                return false;
            if (Array.isArray(input[1]))
                return input[1].every(isContextPrimitive);
            return isContextPrimitive(input[1]);
        }
        return false;
    }
    /**
     * Checks if an input array is either a filter provider or a rule set provider
     * @param input - An array of filter providers or rule set providers
     * @returns Whether the array is a valid {@link ConditionalContextProvider}
     */
    function isConditionalContextProvider(input) {
        return isFilterProvider(input) || isRuleSetProvider(input);
    }
    /**
     * Checks if a given schema matches any rules within the provided rule set
     * @param ruleSet - The rule set containing rules to match schema against
     * @param schema - The schema to be matched against the rule set
     */
    function matchSchemaAgainstRuleSet(ruleSet, schema) {
        var rejectCount = 0;
        var acceptCount = 0;
        var acceptRules = ruleSet['accept'];
        if (Array.isArray(acceptRules)) {
            if (ruleSet.accept.some(function (rule) { return matchSchemaAgainstRule(rule, schema); })) {
                acceptCount++;
            }
        }
        else if (typeof acceptRules === 'string') {
            if (matchSchemaAgainstRule(acceptRules, schema)) {
                acceptCount++;
            }
        }
        var rejectRules = ruleSet['reject'];
        if (Array.isArray(rejectRules)) {
            if (ruleSet.reject.some(function (rule) { return matchSchemaAgainstRule(rule, schema); })) {
                rejectCount++;
            }
        }
        else if (typeof rejectRules === 'string') {
            if (matchSchemaAgainstRule(rejectRules, schema)) {
                rejectCount++;
            }
        }
        if (acceptCount > 0 && rejectCount === 0) {
            return true;
        }
        else if (acceptCount === 0 && rejectCount > 0) {
            return false;
        }
        return false;
    }
    /**
     * Checks if a given schema matches a specific rule from a rule set
     * @param rule - The rule to match schema against
     * @param schema - The schema to be matched against the rule
     */
    function matchSchemaAgainstRule(rule, schema) {
        if (!isValidRule(rule))
            return false;
        var ruleParts = getRuleParts(rule);
        var schemaParts = getSchemaParts(schema);
        if (ruleParts && schemaParts) {
            if (!matchVendor(ruleParts[0], schemaParts[0]))
                return false;
            for (var i = 1; i < 5; i++) {
                if (!matchPart(ruleParts[i], schemaParts[i]))
                    return false;
            }
            return true; // if it hasn't failed, it passes
        }
        return false;
    }
    function matchVendor(rule, vendor) {
        // rule and vendor must have same number of elements
        var vendorParts = vendor.split('.');
        var ruleParts = rule.split('.');
        if (vendorParts && ruleParts) {
            if (vendorParts.length !== ruleParts.length)
                return false;
            for (var i = 0; i < ruleParts.length; i++) {
                if (!matchPart(vendorParts[i], ruleParts[i]))
                    return false;
            }
            return true;
        }
        return false;
    }
    function matchPart(rule, schema) {
        // parts should be the string nested between slashes in the URI: /example/
        return (rule && schema && rule === '*') || rule === schema;
    }
    // Returns the "useful" schema, i.e. what would someone want to use to identify events.
    // For some events this is the 'e' property but for unstructured events, this is the
    // 'schema' from the 'ue_px' field.
    function getUsefulSchema(sb) {
        var eventJson = sb.getJson();
        for (var _i = 0, eventJson_1 = eventJson; _i < eventJson_1.length; _i++) {
            var json = eventJson_1[_i];
            if (json.keyIfEncoded === 'ue_px' && typeof json.json['data'] === 'object') {
                var schema = json.json['data']['schema'];
                if (typeof schema == 'string') {
                    return schema;
                }
            }
        }
        return '';
    }
    function getEventType(payloadBuilder) {
        var eventType = payloadBuilder.getPayload()['e'];
        return typeof eventType === 'string' ? eventType : '';
    }
    function buildGenerator(generator, event, eventType, eventSchema) {
        var contextGeneratorResult = undefined;
        try {
            // try to evaluate context generator
            var args = {
                event: event.getPayload(),
                eventType: eventType,
                eventSchema: eventSchema
            };
            contextGeneratorResult = generator(args);
            // determine if the produced result is a valid SDJ
            if (Array.isArray(contextGeneratorResult) && contextGeneratorResult.every(isSelfDescribingJson)) {
                return contextGeneratorResult;
            }
            else if (isSelfDescribingJson(contextGeneratorResult)) {
                return contextGeneratorResult;
            }
            else {
                return undefined;
            }
        }
        catch (error) {
            contextGeneratorResult = undefined;
        }
        return contextGeneratorResult;
    }
    function normalizeToArray(input) {
        if (Array.isArray(input)) {
            return input;
        }
        return Array.of(input);
    }
    function generatePrimitives(contextPrimitives, event, eventType, eventSchema) {
        var _a;
        var normalizedInputs = normalizeToArray(contextPrimitives);
        var partialEvaluate = function (primitive) {
            var result = evaluatePrimitive(primitive, event, eventType, eventSchema);
            if (result && result.length !== 0) {
                return result;
            }
            return undefined;
        };
        var generatedContexts = normalizedInputs.map(partialEvaluate);
        return (_a = []).concat.apply(_a, generatedContexts.filter(function (c) { return c != null && c.filter(Boolean); }));
    }
    function evaluatePrimitive(contextPrimitive, event, eventType, eventSchema) {
        if (isSelfDescribingJson(contextPrimitive)) {
            return [contextPrimitive];
        }
        else if (isContextCallbackFunction(contextPrimitive)) {
            var generatorOutput = buildGenerator(contextPrimitive, event, eventType, eventSchema);
            if (isSelfDescribingJson(generatorOutput)) {
                return [generatorOutput];
            }
            else if (Array.isArray(generatorOutput)) {
                return generatorOutput;
            }
        }
        return undefined;
    }
    function evaluateProvider(provider, event, eventType, eventSchema) {
        if (isFilterProvider(provider)) {
            var filter = provider[0];
            var filterResult = false;
            try {
                var args = {
                    event: event.getPayload(),
                    eventType: eventType,
                    eventSchema: eventSchema
                };
                filterResult = filter(args);
            }
            catch (error) {
                filterResult = false;
            }
            if (filterResult === true) {
                return generatePrimitives(provider[1], event, eventType, eventSchema);
            }
        }
        else if (isRuleSetProvider(provider)) {
            if (matchSchemaAgainstRuleSet(provider[0], eventSchema)) {
                return generatePrimitives(provider[1], event, eventType, eventSchema);
            }
        }
        return [];
    }
    function generateConditionals(providers, event, eventType, eventSchema) {
        var _a;
        var normalizedInput = normalizeToArray(providers);
        var partialEvaluate = function (provider) {
            var result = evaluateProvider(provider, event, eventType, eventSchema);
            if (result && result.length !== 0) {
                return result;
            }
            return undefined;
        };
        var generatedContexts = normalizedInput.map(partialEvaluate);
        return (_a = []).concat.apply(_a, generatedContexts.filter(function (c) { return c != null && c.filter(Boolean); }));
    }

    /*
     * Copyright (c) 2022 Snowplow Analytics Ltd, 2010 Anthon Pang
     * All rights reserved.
     *
     * Redistribution and use in source and binary forms, with or without
     * modification, are permitted provided that the following conditions are met:
     *
     * 1. Redistributions of source code must retain the above copyright notice, this
     *    list of conditions and the following disclaimer.
     *
     * 2. Redistributions in binary form must reproduce the above copyright notice,
     *    this list of conditions and the following disclaimer in the documentation
     *    and/or other materials provided with the distribution.
     *
     * 3. Neither the name of the copyright holder nor the names of its
     *    contributors may be used to endorse or promote products derived from
     *    this software without specific prior written permission.
     *
     * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
     * AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
     * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
     * DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE
     * FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
     * DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
     * SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
     * CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
     * OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
     * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
     */
    /**
     * Transform optional/old-behavior number timestamp into`Timestamp` ADT
     *
     * @param timestamp - optional number or timestamp object
     * @returns correct timestamp object
     */
    function getTimestamp(timestamp) {
        if (timestamp == null) {
            return { type: 'dtm', value: new Date().getTime() };
        }
        else if (typeof timestamp === 'number') {
            return { type: 'dtm', value: timestamp };
        }
        else if (timestamp.type === 'ttm') {
            // We can return timestamp here, but this is safer fallback
            return { type: 'ttm', value: timestamp.value };
        }
        else {
            return { type: 'dtm', value: timestamp.value || new Date().getTime() };
        }
    }
    /**
     * Create a tracker core object
     *
     * @param base64 - Whether to base 64 encode contexts and self describing event JSONs
     * @param corePlugins - The core plugins to be processed with each event
     * @param callback - Function applied to every payload dictionary object
     * @returns Tracker core
     */
    function trackerCore(configuration) {
        if (configuration === void 0) { configuration = {}; }
        function newCore(base64, corePlugins, callback) {
            var pluginContextsHelper = pluginContexts(corePlugins), globalContextsHelper = globalContexts();
            var encodeBase64 = base64, payloadPairs = {}; // Dictionary of key-value pairs which get added to every payload, e.g. tracker version
            /**
             * Wraps an array of custom contexts in a self-describing JSON
             *
             * @param contexts - Array of custom context self-describing JSONs
             * @returns Outer JSON
             */
            function completeContexts(contexts) {
                if (contexts && contexts.length) {
                    return {
                        schema: 'iglu:com.snowplowanalytics.snowplow/contexts/jsonschema/1-0-0',
                        data: contexts
                    };
                }
                return undefined;
            }
            /**
             * Adds all global contexts to a contexts array
             *
             * @param pb - PayloadData
             * @param contexts - Custom contexts relating to the event
             */
            function attachGlobalContexts(pb, contexts) {
                var applicableContexts = globalContextsHelper.getApplicableContexts(pb);
                var returnedContexts = [];
                if (contexts && contexts.length) {
                    returnedContexts.push.apply(returnedContexts, contexts);
                }
                if (applicableContexts && applicableContexts.length) {
                    returnedContexts.push.apply(returnedContexts, applicableContexts);
                }
                return returnedContexts;
            }
            /**
             * Gets called by every trackXXX method
             * Adds context and payloadPairs name-value pairs to the payload
             * Applies the callback to the built payload
             *
             * @param pb - Payload
             * @param context - Custom contexts relating to the event
             * @param timestamp - Timestamp of the event
             * @returns Payload after the callback is applied
             */
            function track(pb, context, timestamp) {
                pb.withJsonProcessor(payloadJsonProcessor(encodeBase64));
                pb.add('eid', uuid_1.v4());
                pb.addDict(payloadPairs);
                var tstamp = getTimestamp(timestamp);
                pb.add(tstamp.type, tstamp.value.toString());
                var allContexts = attachGlobalContexts(pb, pluginContextsHelper.addPluginContexts(context));
                var wrappedContexts = completeContexts(allContexts);
                if (wrappedContexts !== undefined) {
                    pb.addJson('cx', 'co', wrappedContexts);
                }
                corePlugins.forEach(function (plugin) {
                    try {
                        if (plugin.beforeTrack) {
                            plugin.beforeTrack(pb);
                        }
                    }
                    catch (ex) {
                        LOG.error('Plugin beforeTrack', ex);
                    }
                });
                if (typeof callback === 'function') {
                    callback(pb);
                }
                var finalPayload = pb.build();
                corePlugins.forEach(function (plugin) {
                    try {
                        if (plugin.afterTrack) {
                            plugin.afterTrack(finalPayload);
                        }
                    }
                    catch (ex) {
                        LOG.error('Plugin afterTrack', ex);
                    }
                });
                return finalPayload;
            }
            /**
             * Set a persistent key-value pair to be added to every payload
             *
             * @param key - Field name
             * @param value - Field value
             */
            function addPayloadPair(key, value) {
                payloadPairs[key] = value;
            }
            var core = {
                track: track,
                addPayloadPair: addPayloadPair,
                configuration: configuration,
                // convivaRemoteTrackerConfig,
                getConfig: function () {
                    return configuration;
                },
                setConfig: function (config) {
                    if (config) {
                        if (typeof config.base64 !== 'undefined') {
                            configuration.base64 = config.base64;
                            encodeBase64 = config.base64;
                        }
                        if (typeof config.linkClickTracking !== 'undefined') {
                            configuration.linkClickTracking = config.linkClickTracking;
                        }
                        if (typeof config.buttonClickTracking !== 'undefined') {
                            configuration.buttonClickTracking = config.buttonClickTracking;
                        }
                        if (typeof config.customEvent !== 'undefined') {
                            configuration.customEvent = config.customEvent;
                        }
                        if (typeof config.exceptionAutotracking !== 'undefined') {
                            configuration.exceptionAutotracking = config.exceptionAutotracking;
                        }
                        if (typeof config.enablePeriodicHeartbeat !== 'undefined') {
                            configuration.enablePeriodicHeartbeat = config.enablePeriodicHeartbeat;
                        }
                        if (typeof config.periodicHeartbeatInterval !== 'undefined') {
                            configuration.periodicHeartbeatInterval = config.periodicHeartbeatInterval;
                        }
                        if (typeof config.customEventTrackingConfiguration !== 'undefined') {
                            configuration.customEventTrackingConfiguration = config.customEventTrackingConfiguration;
                        }
                        if (typeof config.convivaVideoEventTrackingConfiguration !== 'undefined') {
                            configuration.convivaVideoEventTrackingConfiguration = config.convivaVideoEventTrackingConfiguration;
                        }
                        if (typeof config.ajaxTrackingConfiguration !== 'undefined') {
                            configuration.ajaxTrackingConfiguration = config.ajaxTrackingConfiguration;
                        }
                    }
                },
                getBase64Encoding: function () {
                    return encodeBase64;
                },
                setBase64Encoding: function (encode) {
                    encodeBase64 = encode;
                },
                addPayloadDict: function (dict) {
                    for (var key in dict) {
                        if (Object.prototype.hasOwnProperty.call(dict, key)) {
                            payloadPairs[key] = dict[key];
                        }
                    }
                },
                resetPayloadPairs: function (dict) {
                    payloadPairs = isJson(dict) ? dict : {};
                },
                setTrackerVersion: function (version) {
                    addPayloadPair('tv', version);
                },
                setTrackerNamespace: function (name) {
                    addPayloadPair('tna', name);
                },
                setAppId: function (appId) {
                    addPayloadPair('aid', appId);
                },
                setPlatform: function (value) {
                    addPayloadPair('p', value);
                },
                setUserId: function (userId) {
                    addPayloadPair('uid', userId);
                },
                setScreenResolution: function (width, height) {
                    addPayloadPair('res', width + 'x' + height);
                },
                setViewport: function (width, height) {
                    addPayloadPair('vp', width + 'x' + height);
                },
                setColorDepth: function (depth) {
                    addPayloadPair('cd', depth);
                },
                setTimezone: function (timezone) {
                    addPayloadPair('tz', timezone);
                },
                setLang: function (lang) {
                    addPayloadPair('lang', lang);
                },
                setIpAddress: function (ip) {
                    addPayloadPair('ip', ip);
                },
                setUseragent: function (useragent) {
                    addPayloadPair('ua', useragent);
                },
                addGlobalContexts: function (contexts) {
                    globalContextsHelper.addGlobalContexts(contexts);
                },
                clearGlobalContexts: function () {
                    globalContextsHelper.clearGlobalContexts();
                },
                removeGlobalContexts: function (contexts) {
                    globalContextsHelper.removeGlobalContexts(contexts);
                }
            };
            return core;
        }
        var base64 = configuration.base64, corePlugins = configuration.corePlugins, callback = configuration.callback, plugins = corePlugins !== null && corePlugins !== void 0 ? corePlugins : [], partialCore = newCore(base64 !== null && base64 !== void 0 ? base64 : true, plugins, callback), core = __assign(__assign({}, partialCore), { addPlugin: function (configuration) {
                var _a, _b;
                var plugin = configuration.plugin;
                plugins.push(plugin);
                (_a = plugin.logger) === null || _a === void 0 ? void 0 : _a.call(plugin, LOG);
                (_b = plugin.activateCorePlugin) === null || _b === void 0 ? void 0 : _b.call(plugin, core);
            } });
        plugins === null || plugins === void 0 ? void 0 : plugins.forEach(function (plugin) {
            var _a, _b;
            (_a = plugin.logger) === null || _a === void 0 ? void 0 : _a.call(plugin, LOG);
            (_b = plugin.activateCorePlugin) === null || _b === void 0 ? void 0 : _b.call(plugin, core);
        });
        return core;
    }
    /**
     * Build a self-describing event
     * A custom event type, allowing for an event to be tracked using your own custom schema
     * and a data object which conforms to the supplied schema
     *
     * @param event - Contains the properties and schema location for the event
     * @returns PayloadBuilder to be sent to {@link @snowplow/tracker-core#TrackerCore.track}
     */
    function buildSelfDescribingEvent(event) {
        var _a = event.event, schema = _a.schema, data = _a.data, pb = payloadBuilder();
        var ueJson = {
            schema: 'iglu:com.snowplowanalytics.snowplow/unstruct_event/jsonschema/1-0-0',
            data: { schema: schema, data: data }
        };
        pb.add('e', 'ue');
        pb.addJson('ue_px', 'ue_pr', ueJson);
        return pb;
    }
    /**
     * Build a Page View Event
     * Represents a Page View, which is typically fired as soon as possible when a web page
     * is loaded within the users browser. Often also fired on "virtual page views" within
     * Single Page Applications (SPA).
     *
     * @param event - Contains the properties for the Page View event
     * @returns PayloadBuilder to be sent to {@link @snowplow/tracker-core#TrackerCore.track}
     */
    function buildPageView(event) {
        var pageUrl = event.pageUrl, pageTitle = event.pageTitle, referrer = event.referrer, pb = payloadBuilder();
        pb.add('e', 'pv'); // 'pv' for Page View
        pb.add('url', pageUrl);
        pb.add('page', pageTitle);
        pb.add('refr', referrer);
        return pb;
    }
    /**
     * Build a Page Ping Event
     * Fires when activity tracking is enabled in the browser.
     * Tracks same information as the last tracked Page View and includes scroll
     * information from the current page view
     *
     * @param event - Contains the properties for the Page Ping event
     * @returns PayloadBuilder to be sent to {@link @snowplow/tracker-core#TrackerCore.track}
     */
    function buildPagePing(event) {
        var pageUrl = event.pageUrl, pageTitle = event.pageTitle, referrer = event.referrer, minXOffset = event.minXOffset, maxXOffset = event.maxXOffset, minYOffset = event.minYOffset, maxYOffset = event.maxYOffset, pb = payloadBuilder();
        pb.add('e', 'pp'); // 'pp' for Page Ping
        pb.add('url', pageUrl);
        pb.add('page', pageTitle);
        pb.add('refr', referrer);
        if (minXOffset && !isNaN(Number(minXOffset)))
            pb.add('pp_mix', minXOffset.toString());
        if (maxXOffset && !isNaN(Number(maxXOffset)))
            pb.add('pp_max', maxXOffset.toString());
        if (minYOffset && !isNaN(Number(minYOffset)))
            pb.add('pp_miy', minYOffset.toString());
        if (maxYOffset && !isNaN(Number(maxYOffset)))
            pb.add('pp_may', maxYOffset.toString());
        return pb;
    }
    /**
     * Build a Structured Event
     * A classic style of event tracking, allows for easier movement between analytics
     * systems. A loosely typed event, creating a Self Describing event is preferred, but
     * useful for interoperability.
     *
     * @param event - Contains the properties for the Structured event
     * @returns PayloadBuilder to be sent to {@link @snowplow/tracker-core#TrackerCore.track}
     */
    function buildStructEvent(event) {
        var category = event.category, action = event.action, label = event.label, property = event.property, value = event.value, pb = payloadBuilder();
        pb.add('e', 'se'); // 'se' for Structured Event
        pb.add('se_ca', category);
        pb.add('se_ac', action);
        pb.add('se_la', label);
        pb.add('se_pr', property);
        pb.add('se_va', value == null ? undefined : value.toString());
        return pb;
    }
    /**
     * Build a Custom Event
     * A classic style of event tracking, allows for easier movement between analytics
     * systems. A loosely typed event, creating a Custom event is preferred, but
     * useful for interoperability.
     *
     * @param event - Contains the properties for the Custom event
     * @returns PayloadBuilder
     */
    function buildCustomEvent(event) {
        var name = event.name, data = event.data;
        return buildSelfDescribingEvent({
            event: {
                schema: 'iglu:com.conviva/raw_event/jsonschema/1-0-1',
                data: removeEmptyProperties({ name: name, data: data })
            }
        });
    }
    /**
     * Build a Custom Event
     * A classic style of event tracking, allows for easier movement between analytics
     * systems. A loosely typed event, creating a Custom event is preferred, but
     * useful for interoperability.
     *
     * @param event - Contains the properties for the Custom event
     * @returns PayloadBuilder
     */
    function buildAjaxEvent(event) {
        var targetUrl = event.targetUrl, webResourceTiming = event.webResourceTiming;
        return buildSelfDescribingEvent({
            event: {
                schema: 'iglu:com.conviva/network_request/jsonschema/1-0-1',
                data: removeEmptyProperties({ targetUrl: targetUrl, webResourceTiming: webResourceTiming })
            }
        });
    }
    /**
     * Build a Conviva Video Event
     * A classic style of event tracking, allows for easier movement between analytics
     * systems. A loosely typed event, creating a Custom Conviva Video event is preferred, but
     * useful for interoperability.
     *
     * @param event - Contains the properties for the Custom event
     * @returns PayloadBuilder
     */
    function buildConvivaVideoEvent(event) {
        return buildSelfDescribingEvent({
            event: {
                schema: 'iglu:com.conviva/conviva_video_events/jsonschema/1-0-4',
                data: removeEmptyProperties(event)
            }
        });
    }
    /**
     * Returns a copy of a JSON with undefined and null properties removed
     *
     * @param event - JSON object to clean
     * @param exemptFields - Set of fields which should not be removed even if empty
     * @returns A cleaned copy of eventJson
     */
    function removeEmptyProperties(event, exemptFields) {
        if (exemptFields === void 0) { exemptFields = {}; }
        var ret = {};
        for (var k in event) {
            if (exemptFields[k] || (event[k] !== null && typeof event[k] !== 'undefined')) {
                ret[k] = event[k];
            }
        }
        return ret;
    }

    /*
     * Copyright (c) 2022 Snowplow Analytics Ltd, 2010 Anthon Pang
     * All rights reserved.
     *
     * Redistribution and use in source and binary forms, with or without
     * modification, are permitted provided that the following conditions are met:
     *
     * 1. Redistributions of source code must retain the above copyright notice, this
     *    list of conditions and the following disclaimer.
     *
     * 2. Redistributions in binary form must reproduce the above copyright notice,
     *    this list of conditions and the following disclaimer in the documentation
     *    and/or other materials provided with the distribution.
     *
     * 3. Neither the name of the copyright holder nor the names of its
     *    contributors may be used to endorse or promote products derived from
     *    this software without specific prior written permission.
     *
     * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
     * AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
     * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
     * DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE
     * FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
     * DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
     * SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
     * CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
     * OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
     * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
     */
    var version = version$1;

    var sha1 = {exports: {}};

    var crypt = {exports: {}};

    (function() {
      var base64map
          = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/',

      crypt$1 = {
        // Bit-wise rotation left
        rotl: function(n, b) {
          return (n << b) | (n >>> (32 - b));
        },

        // Bit-wise rotation right
        rotr: function(n, b) {
          return (n << (32 - b)) | (n >>> b);
        },

        // Swap big-endian to little-endian and vice versa
        endian: function(n) {
          // If number given, swap endian
          if (n.constructor == Number) {
            return crypt$1.rotl(n, 8) & 0x00FF00FF | crypt$1.rotl(n, 24) & 0xFF00FF00;
          }

          // Else, assume array and swap all items
          for (var i = 0; i < n.length; i++)
            n[i] = crypt$1.endian(n[i]);
          return n;
        },

        // Generate an array of any length of random bytes
        randomBytes: function(n) {
          for (var bytes = []; n > 0; n--)
            bytes.push(Math.floor(Math.random() * 256));
          return bytes;
        },

        // Convert a byte array to big-endian 32-bit words
        bytesToWords: function(bytes) {
          for (var words = [], i = 0, b = 0; i < bytes.length; i++, b += 8)
            words[b >>> 5] |= bytes[i] << (24 - b % 32);
          return words;
        },

        // Convert big-endian 32-bit words to a byte array
        wordsToBytes: function(words) {
          for (var bytes = [], b = 0; b < words.length * 32; b += 8)
            bytes.push((words[b >>> 5] >>> (24 - b % 32)) & 0xFF);
          return bytes;
        },

        // Convert a byte array to a hex string
        bytesToHex: function(bytes) {
          for (var hex = [], i = 0; i < bytes.length; i++) {
            hex.push((bytes[i] >>> 4).toString(16));
            hex.push((bytes[i] & 0xF).toString(16));
          }
          return hex.join('');
        },

        // Convert a hex string to a byte array
        hexToBytes: function(hex) {
          for (var bytes = [], c = 0; c < hex.length; c += 2)
            bytes.push(parseInt(hex.substr(c, 2), 16));
          return bytes;
        },

        // Convert a byte array to a base-64 string
        bytesToBase64: function(bytes) {
          for (var base64 = [], i = 0; i < bytes.length; i += 3) {
            var triplet = (bytes[i] << 16) | (bytes[i + 1] << 8) | bytes[i + 2];
            for (var j = 0; j < 4; j++)
              if (i * 8 + j * 6 <= bytes.length * 8)
                base64.push(base64map.charAt((triplet >>> 6 * (3 - j)) & 0x3F));
              else
                base64.push('=');
          }
          return base64.join('');
        },

        // Convert a base-64 string to a byte array
        base64ToBytes: function(base64) {
          // Remove non-base-64 characters
          base64 = base64.replace(/[^A-Z0-9+\/]/ig, '');

          for (var bytes = [], i = 0, imod4 = 0; i < base64.length;
              imod4 = ++i % 4) {
            if (imod4 == 0) continue;
            bytes.push(((base64map.indexOf(base64.charAt(i - 1))
                & (Math.pow(2, -2 * imod4 + 8) - 1)) << (imod4 * 2))
                | (base64map.indexOf(base64.charAt(i)) >>> (6 - imod4 * 2)));
          }
          return bytes;
        }
      };

      crypt.exports = crypt$1;
    })();

    var charenc = {
      // UTF-8 encoding
      utf8: {
        // Convert a string to a byte array
        stringToBytes: function(str) {
          return charenc.bin.stringToBytes(unescape(encodeURIComponent(str)));
        },

        // Convert a byte array to a string
        bytesToString: function(bytes) {
          return decodeURIComponent(escape(charenc.bin.bytesToString(bytes)));
        }
      },

      // Binary encoding
      bin: {
        // Convert a string to a byte array
        stringToBytes: function(str) {
          for (var bytes = [], i = 0; i < str.length; i++)
            bytes.push(str.charCodeAt(i) & 0xFF);
          return bytes;
        },

        // Convert a byte array to a string
        bytesToString: function(bytes) {
          for (var str = [], i = 0; i < bytes.length; i++)
            str.push(String.fromCharCode(bytes[i]));
          return str.join('');
        }
      }
    };

    var charenc_1 = charenc;

    (function() {
      var crypt$1 = crypt.exports,
          utf8 = charenc_1.utf8,
          bin = charenc_1.bin,

      // The core
      sha1$1 = function (message) {
        // Convert to byte array
        if (message.constructor == String)
          message = utf8.stringToBytes(message);
        else if (typeof Buffer !== 'undefined' && typeof Buffer.isBuffer == 'function' && Buffer.isBuffer(message))
          message = Array.prototype.slice.call(message, 0);
        else if (!Array.isArray(message))
          message = message.toString();

        // otherwise assume byte array

        var m  = crypt$1.bytesToWords(message),
            l  = message.length * 8,
            w  = [],
            H0 =  1732584193,
            H1 = -271733879,
            H2 = -1732584194,
            H3 =  271733878,
            H4 = -1009589776;

        // Padding
        m[l >> 5] |= 0x80 << (24 - l % 32);
        m[((l + 64 >>> 9) << 4) + 15] = l;

        for (var i = 0; i < m.length; i += 16) {
          var a = H0,
              b = H1,
              c = H2,
              d = H3,
              e = H4;

          for (var j = 0; j < 80; j++) {

            if (j < 16)
              w[j] = m[i + j];
            else {
              var n = w[j - 3] ^ w[j - 8] ^ w[j - 14] ^ w[j - 16];
              w[j] = (n << 1) | (n >>> 31);
            }

            var t = ((H0 << 5) | (H0 >>> 27)) + H4 + (w[j] >>> 0) + (
                    j < 20 ? (H1 & H2 | ~H1 & H3) + 1518500249 :
                    j < 40 ? (H1 ^ H2 ^ H3) + 1859775393 :
                    j < 60 ? (H1 & H2 | H1 & H3 | H2 & H3) - 1894007588 :
                             (H1 ^ H2 ^ H3) - 899497514);

            H4 = H3;
            H3 = H2;
            H2 = (H1 << 30) | (H1 >>> 2);
            H1 = H0;
            H0 = t;
          }

          H0 += a;
          H1 += b;
          H2 += c;
          H3 += d;
          H4 += e;
        }

        return [H0, H1, H2, H3, H4];
      },

      // Public API
      api = function (message, options) {
        var digestbytes = crypt$1.wordsToBytes(sha1$1(message));
        return options && options.asBytes ? digestbytes :
            options && options.asString ? bin.bytesToString(digestbytes) :
            crypt$1.bytesToHex(digestbytes);
      };

      api._blocksize = 16;
      api._digestsize = 20;

      sha1.exports = api;
    })();

    var hash = sha1.exports;

    /*!
     * Core functionality for Snowplow Browser trackers v0.3.8 (http://bit.ly/sp-js)
     * Copyright 2022 Snowplow Analytics Ltd, 2010 Anthon Pang
     * Licensed under BSD-3-Clause
     */
    /*
     * Checks whether localStorage is available, in a way that
     * does not throw a SecurityError in Firefox if "always ask"
     * is enabled for cookies (https://github.com/snowplow/snowplow/issues/163).
     */
    function hasLocalStorage() {
        try {
            return !!window.localStorage;
        }
        catch (e) {
            return true; // SecurityError when referencing it means it exists
        }
    }
    /*
     * Checks whether localStorage is accessible
     * sets and removes an item to handle private IOS5 browsing
     * (http://git.io/jFB2Xw)
     */
    function localStorageAccessible() {
        var mod = 'modernizr';
        if (!hasLocalStorage()) {
            return false;
        }
        try {
            var ls = window.localStorage;
            ls.setItem(mod, mod);
            ls.removeItem(mod);
            return true;
        }
        catch (e) {
            return false;
        }
    }
    /**
     * Gets the current viewport.
     *
     * Code based on:
     * - http://andylangton.co.uk/articles/javascript/get-viewport-size-javascript/
     * - http://responsejs.com/labs/dimensions/
     */
    function detectViewport() {
        var width, height;
        if ('innerWidth' in window) {
            width = window['innerWidth'];
            height = window['innerHeight'];
        }
        else {
            var e = document.documentElement || document.body;
            width = e['clientWidth'];
            height = e['clientHeight'];
        }
        if (width >= 0 && height >= 0) {
            return width + 'x' + height;
        }
        else {
            return null;
        }
    }
    /**
     * Gets the dimensions of the current
     * document.
     *
     * Code based on:
     * - http://andylangton.co.uk/articles/javascript/get-viewport-size-javascript/
     */
    function detectDocumentSize() {
        var de = document.documentElement, // Alias
        be = document.body,
        // document.body may not have rendered, so check whether be.offsetHeight is null
        bodyHeight = be ? Math.max(be.offsetHeight, be.scrollHeight) : 0;
        var w = Math.max(de.clientWidth, de.offsetWidth, de.scrollWidth);
        var h = Math.max(de.clientHeight, de.offsetHeight, de.scrollHeight, bodyHeight);
        return isNaN(w) || isNaN(h) ? '' : w + 'x' + h;
    }

    /*
     * Copyright (c) 2022 Snowplow Analytics Ltd, 2010 Anthon Pang
     * All rights reserved.
     *
     * Redistribution and use in source and binary forms, with or without
     * modification, are permitted provided that the following conditions are met:
     *
     * 1. Redistributions of source code must retain the above copyright notice, this
     *    list of conditions and the following disclaimer.
     *
     * 2. Redistributions in binary form must reproduce the above copyright notice,
     *    this list of conditions and the following disclaimer in the documentation
     *    and/or other materials provided with the distribution.
     *
     * 3. Neither the name of the copyright holder nor the names of its
     *    contributors may be used to endorse or promote products derived from
     *    this software without specific prior written permission.
     *
     * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
     * AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
     * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
     * DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE
     * FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
     * DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
     * SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
     * CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
     * OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
     * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
     */
    /**
     * Checks if an object is a string
     * @param str - The object to check
     */
    function isString(str) {
        if (str && typeof str.valueOf() === 'string') {
            return true;
        }
        return false;
    }
    /**
     * Checks if an object is an integer
     * @param int - The object to check
     */
    function isInteger(int) {
        return ((Number.isInteger && Number.isInteger(int)) || (typeof int === 'number' && isFinite(int) && Math.floor(int) === int));
    }
    /**
     * Cleans up the page title
     */
    function fixupTitle(title) {
        if (!isString(title)) {
            title = title.text || '';
            var tmp = document.getElementsByTagName('title');
            if (tmp && tmp[0] != null) {
                title = tmp[0].text;
            }
        }
        return title;
    }
    /**
     * Extract hostname from URL
     */
    function getHostName(url) {
        // scheme : // [username [: password] @] hostname [: port] [/ [path] [? query] [# fragment]]
        var e = new RegExp('^(?:(?:https?|ftp):)/*(?:[^@]+@)?([^:/#]+)'), matches = e.exec(url);
        return matches ? matches[1] : url;
    }
    /**
     * Fix-up domain
     */
    function fixupDomain(domain) {
        var dl = domain.length;
        // remove trailing '.'
        if (domain.charAt(--dl) === '.') {
            domain = domain.slice(0, dl);
        }
        // remove leading '*'
        if (domain.slice(0, 2) === '*.') {
            domain = domain.slice(1);
        }
        return domain;
    }
    /**
     * Get page referrer. In the case of a single-page app,
     * if the URL changes without the page reloading, pass
     * in the old URL. It will be returned unless overriden
     * by a "refer(r)er" parameter in the querystring.
     *
     * @param string - oldLocation Optional.
     * @returns string The referrer
     */
    function getReferrer(oldLocation) {
        var windowAlias = window, fromQs = fromQuerystring('referrer', windowAlias.location.href) || fromQuerystring('referer', windowAlias.location.href);
        // Short-circuit
        if (fromQs) {
            return fromQs;
        }
        // In the case of a single-page app, return the old URL
        if (oldLocation) {
            return oldLocation;
        }
        try {
            if (windowAlias.top) {
                return windowAlias.top.document.referrer;
            }
            else if (windowAlias.parent) {
                return windowAlias.parent.document.referrer;
            }
        }
        catch (_a) { }
        return document.referrer;
    }
    /**
     * Cross-browser helper function to add event handler
     */
    function addEventListener(element, eventType, eventHandler, options) {
        if (element.addEventListener) {
            element.addEventListener(eventType, eventHandler, options);
            return true;
        }
        // IE Support
        if (element.attachEvent) {
            return element.attachEvent('on' + eventType, eventHandler);
        }
        element['on' + eventType] = eventHandler;
    }
    /**
     * Return value from name-value pair in querystring
     */
    function fromQuerystring(field, url) {
        var match = new RegExp('^[^#]*[?&]' + field + '=([^&#]*)').exec(url);
        if (!match) {
            return null;
        }
        return decodeURIComponent(match[1].replace(/\+/g, ' '));
    }
    /**
     * Add a name-value pair to the querystring of a URL
     *
     * @param string - url URL to decorate
     * @param string - name Name of the querystring pair
     * @param string - value Value of the querystring pair
     */
    function decorateQuerystring(url, name, value) {
        var initialQsParams = name + '=' + value;
        var hashSplit = url.split('#');
        var qsSplit = hashSplit[0].split('?');
        var beforeQuerystring = qsSplit.shift();
        // Necessary because a querystring may contain multiple question marks
        var querystring = qsSplit.join('?');
        if (!querystring) {
            querystring = initialQsParams;
        }
        else {
            // Whether this is the first time the link has been decorated
            var initialDecoration = true;
            var qsFields = querystring.split('&');
            for (var i = 0; i < qsFields.length; i++) {
                if (qsFields[i].substr(0, name.length + 1) === name + '=') {
                    initialDecoration = false;
                    qsFields[i] = initialQsParams;
                    querystring = qsFields.join('&');
                    break;
                }
            }
            if (initialDecoration) {
                querystring = initialQsParams + '&' + querystring;
            }
        }
        hashSplit[0] = beforeQuerystring + '?' + querystring;
        return hashSplit.join('#');
    }
    /**
     * Attempt to get a value from localStorage
     *
     * @param string - key
     * @returns string The value obtained from localStorage, or
     *                undefined if localStorage is inaccessible
     */
    function attemptGetLocalStorage(key) {
        try {
            var localStorageAlias = window.localStorage, exp = localStorageAlias.getItem(key + '.expires');
            if (exp === null || +exp > Date.now()) {
                return localStorageAlias.getItem(key);
            }
            else {
                localStorageAlias.removeItem(key);
                localStorageAlias.removeItem(key + '.expires');
            }
            return undefined;
        }
        catch (e) {
            return undefined;
        }
    }
    /**
     * Attempt to write a value to localStorage
     *
     * @param string - key
     * @param string - value
     * @param number - ttl Time to live in seconds, defaults to 2 years from Date.now()
     * @returns boolean Whether the operation succeeded
     */
    function attemptWriteLocalStorage(key, value, ttl) {
        if (ttl === void 0) { ttl = 63072000; }
        try {
            var localStorageAlias = window.localStorage, t = Date.now() + ttl * 1000;
            localStorageAlias.setItem("".concat(key, ".expires"), t.toString());
            localStorageAlias.setItem(key, value);
            return true;
        }
        catch (e) {
            return false;
        }
    }
    /**
     * Attempt to delete a value from localStorage
     *
     * @param string - key
     * @returns boolean Whether the operation succeeded
     */
    function attemptDeleteLocalStorage(key) {
        try {
            var localStorageAlias = window.localStorage;
            localStorageAlias.removeItem(key);
            localStorageAlias.removeItem(key + '.expires');
            return true;
        }
        catch (e) {
            return false;
        }
    }
    /**
     * Finds the root domain
     */
    function findRootDomain(sameSite, secure) {
        var windowLocationHostnameAlias = window.location.hostname, cookiePrefix = '_sp_root_domain_test_', cookieName = cookiePrefix + new Date().getTime(), cookieValue = '_test_value_' + new Date().getTime();
        var split = windowLocationHostnameAlias.split('.');
        var position = split.length - 1;
        while (position >= 0) {
            var currentDomain = split.slice(position, split.length).join('.');
            cookie(cookieName, cookieValue, 0, '/', currentDomain, sameSite, secure);
            if (cookie(cookieName) === cookieValue) {
                // Clean up created cookie(s)
                deleteCookie(cookieName, currentDomain, sameSite, secure);
                var cookieNames = getCookiesWithPrefix(cookiePrefix);
                for (var i = 0; i < cookieNames.length; i++) {
                    deleteCookie(cookieNames[i], currentDomain, sameSite, secure);
                }
                return currentDomain;
            }
            position -= 1;
        }
        // Cookies cannot be read
        return windowLocationHostnameAlias;
    }
    /**
     * Deletes an arbitrary cookie by setting the expiration date to the past
     *
     * @param cookieName - The name of the cookie to delete
     * @param domainName - The domain the cookie is in
     */
    function deleteCookie(cookieName, domainName, sameSite, secure) {
        cookie(cookieName, '', -1, '/', domainName, sameSite, secure);
    }
    /**
     * Fetches the name of all cookies beginning with a certain prefix
     *
     * @param cookiePrefix - The prefix to check for
     * @returns array The cookies that begin with the prefix
     */
    function getCookiesWithPrefix(cookiePrefix) {
        var cookies = document.cookie.split('; ');
        var cookieNames = [];
        for (var i = 0; i < cookies.length; i++) {
            if (cookies[i].substring(0, cookiePrefix.length) === cookiePrefix) {
                cookieNames.push(cookies[i]);
            }
        }
        return cookieNames;
    }
    /**
     * Get and set the cookies associated with the current document in browser
     * This implementation always returns a string, returns the cookie value if only name is specified
     *
     * @param name - The cookie name (required)
     * @param value - The cookie value
     * @param ttl - The cookie Time To Live (seconds)
     * @param path - The cookies path
     * @param domain - The cookies domain
     * @param samesite - The cookies samesite attribute
     * @param secure - Boolean to specify if cookie should be secure
     * @returns string The cookies value
     */
    function cookie(name, value, ttl, path, domain, samesite, secure) {
        if (arguments.length > 1) {
            return (document.cookie =
                name +
                    '=' +
                    encodeURIComponent(value !== null && value !== void 0 ? value : '') +
                    (ttl ? '; Expires=' + new Date(+new Date() + ttl * 1000).toUTCString() : '') +
                    (path ? '; Path=' + path : '') +
                    (domain ? '; Domain=' + domain : '') +
                    (samesite ? '; SameSite=' + samesite : '') +
                    (secure ? '; Secure' : ''));
        }
        return decodeURIComponent((('; ' + document.cookie).split('; ' + name + '=')[1] || '').split(';')[0]);
    }

    /*
     * Copyright (c) 2022 Snowplow Analytics Ltd, 2010 Anthon Pang
     * All rights reserved.
     *
     * Redistribution and use in source and binary forms, with or without
     * modification, are permitted provided that the following conditions are met:
     *
     * 1. Redistributions of source code must retain the above copyright notice, this
     *    list of conditions and the following disclaimer.
     *
     * 2. Redistributions in binary form must reproduce the above copyright notice,
     *    this list of conditions and the following disclaimer in the documentation
     *    and/or other materials provided with the distribution.
     *
     * 3. Neither the name of the copyright holder nor the names of its
     *    contributors may be used to endorse or promote products derived from
     *    this software without specific prior written permission.
     *
     * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
     * AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
     * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
     * DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE
     * FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
     * DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
     * SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
     * CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
     * OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
     * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
     */
    /**
     * Object handling sending events to a collector.
     * Instantiated once per tracker instance.
     *
     * @param id - The Snowplow function name (used to generate the localStorage key)
     * @param sharedSate - Stores reference to the outbound queue so it can unload the page when all queues are empty
     * @param useLocalStorage - Whether to use localStorage at all
     * @param eventMethod - if null will use 'beacon' otherwise can be set to 'post', 'get', or 'beacon' to force.
     * @param postPath - The path where events are to be posted
     * @param bufferSize - How many events to batch in localStorage before sending them all
     * @param maxPostBytes - Maximum combined size in bytes of the event JSONs in a POST request
     * @param maxGetBytes - Maximum size in bytes of the complete event URL string in a GET request. 0 for no limit.
     * @param useStm - Whether to add timestamp to events
     * @param maxLocalStorageQueueSize - Maximum number of queued events we will attempt to store in local storage
     * @param connectionTimeout - Defines how long to wait before aborting the request
     * @param anonymousTracking - Defines whether to set the SP-Anonymous header for anonymous tracking on GET and POST
     * @param customHeaders - Allows custom headers to be defined and passed on XMLHttpRequest requests
     * @param withCredentials - Sets the value of the withCredentials flag on XMLHttpRequest (GET and POST) requests
     * @param retryStatusCodes – Failure HTTP response status codes from Collector for which sending events should be retried (they can override the `dontRetryStatusCodes`)
     * @param dontRetryStatusCodes – Failure HTTP response status codes from Collector for which sending events should not be retried
     * @returns object OutQueueManager instance
     */
    function OutQueueManager(id, sharedSate, useLocalStorage, eventMethod, postPath, bufferSize, maxPostBytes, maxGetBytes, useStm, maxLocalStorageQueueSize, connectionTimeout, anonymousTracking, customHeaders, withCredentials, retryStatusCodes, dontRetryStatusCodes) {
        var executingQueue = false, configCollectorUrl, outQueue = [];
        //Force to lower case if its a string
        eventMethod = typeof eventMethod === 'string' ? eventMethod.toLowerCase() : eventMethod;
        // Use the Beacon API if eventMethod is set true, 'true', or 'beacon'.
        var isBeaconRequested = eventMethod === true || eventMethod === 'beacon' || eventMethod === 'true',
        // Fall back to POST or GET for browsers which don't support Beacon API
        isBeaconAvailable = Boolean(isBeaconRequested &&
            window.navigator &&
            window.navigator.sendBeacon &&
            !hasWebKitBeaconBug(window.navigator.userAgent)), useBeacon = isBeaconAvailable && isBeaconRequested,
        // Use GET if specified
        isGetRequested = eventMethod === 'get',
        // Don't use XhrHttpRequest for browsers which don't support CORS XMLHttpRequests (e.g. IE <= 9)
        useXhr = Boolean(window.XMLHttpRequest && 'withCredentials' in new XMLHttpRequest()),
        // Use POST if specified
        usePost = !isGetRequested && useXhr && (eventMethod === 'post' || isBeaconRequested),
        // Resolve all options and capabilities and decide path
        path = usePost ? postPath : '/i',
        // Different queue names for GET and POST since they are stored differently
        queueName = "snowplowOutQueue_".concat(id, "_").concat(usePost ? 'post2' : 'get');
        // Ensure we don't set headers when beacon is the requested eventMethod as we might fallback to POST
        // and end up sending them in older browsers which don't support beacon leading to inconsistencies
        if (isBeaconRequested)
            customHeaders = {};
        // Get buffer size or set 1 if unable to buffer
        bufferSize = (useLocalStorage && localStorageAccessible() && usePost && bufferSize) || 1;
        if (useLocalStorage) {
            // Catch any JSON parse errors or localStorage that might be thrown
            try {
                var localStorageQueue = window.localStorage.getItem(queueName);
                outQueue = localStorageQueue ? JSON.parse(localStorageQueue) : [];
            }
            catch (e) { }
        }
        // Initialize to and empty array if we didn't get anything out of localStorage
        if (!Array.isArray(outQueue)) {
            outQueue = [];
        }
        // Used by pageUnloadGuard
        sharedSate.outQueues.push(outQueue);
        if (useXhr && bufferSize > 1) {
            sharedSate.bufferFlushers.push(function (sync) {
                if (!executingQueue) {
                    executeQueue(sync);
                }
            });
        }
        /*
         * Convert a dictionary to a querystring
         * The context field is the last in the querystring
         */
        function getQuerystring(request) {
            var querystring = '?', lowPriorityKeys = { co: true, cx: true }, firstPair = true;
            for (var key in request) {
                if (request.hasOwnProperty(key) && !lowPriorityKeys.hasOwnProperty(key)) {
                    if (!firstPair) {
                        querystring += '&';
                    }
                    else {
                        firstPair = false;
                    }
                    querystring += encodeURIComponent(key) + '=' + encodeURIComponent(request[key]);
                }
            }
            for (var contextKey in lowPriorityKeys) {
                if (request.hasOwnProperty(contextKey) && lowPriorityKeys.hasOwnProperty(contextKey)) {
                    querystring += '&' + contextKey + '=' + encodeURIComponent(request[contextKey]);
                }
            }
            return querystring;
        }
        /*
         * Convert numeric fields to strings to match payload_data schema
         */
        function getBody(request) {
            var cleanedRequest = Object.keys(request)
                .map(function (k) { return [k, request[k]]; })
                .reduce(function (acc, _a) {
                var key = _a[0], value = _a[1];
                acc[key] = value.toString();
                return acc;
            }, {});
            return {
                evt: cleanedRequest,
                bytes: getUTF8Length(JSON.stringify(cleanedRequest))
            };
        }
        /**
         * Count the number of bytes a string will occupy when UTF-8 encoded
         * Taken from http://stackoverflow.com/questions/2848462/count-bytes-in-textarea-using-javascript/
         *
         * @param string - s
         * @returns number Length of s in bytes when UTF-8 encoded
         */
        function getUTF8Length(s) {
            var len = 0;
            for (var i = 0; i < s.length; i++) {
                var code = s.charCodeAt(i);
                if (code <= 0x7f) {
                    len += 1;
                }
                else if (code <= 0x7ff) {
                    len += 2;
                }
                else if (code >= 0xd800 && code <= 0xdfff) {
                    // Surrogate pair: These take 4 bytes in UTF-8 and 2 chars in UCS-2
                    // (Assume next char is the other [valid] half and just skip it)
                    len += 4;
                    i++;
                }
                else if (code < 0xffff) {
                    len += 3;
                }
                else {
                    len += 4;
                }
            }
            return len;
        }
        var postable = function (queue) {
            return typeof queue[0] === 'object';
        };
        /**
         * Send event as POST request right away without going to queue. Used when the request surpasses maxGetBytes or maxPostBytes
         * @param body POST request body
         * @param configCollectorUrl full collector URL with path
         */
        function sendPostRequestWithoutQueueing(body, configCollectorUrl) {
            var xhr = initializeXMLHttpRequest(configCollectorUrl, true, false);
            xhr.send(encloseInPayloadDataEnvelope(attachStmToEvent([body.evt])));
        }
        /*
         * Queue for submission to the collector and start processing queue
         */
        function enqueueRequest(request, url) {
            configCollectorUrl = url + path;
            var eventTooBigWarning = function (bytes, maxBytes) {
                return LOG.warn('Event (' + bytes + 'B) too big, max is ' + maxBytes);
            };
            if (usePost) {
                var body = getBody(request);
                if (body.bytes >= maxPostBytes) {
                    eventTooBigWarning(body.bytes, maxPostBytes);
                    sendPostRequestWithoutQueueing(body, configCollectorUrl);
                    return;
                }
                else {
                    outQueue.push(body);
                }
            }
            else {
                var querystring = getQuerystring(request);
                if (maxGetBytes > 0) {
                    var requestUrl = createGetUrl(querystring);
                    var bytes = getUTF8Length(requestUrl);
                    if (bytes >= maxGetBytes) {
                        eventTooBigWarning(bytes, maxGetBytes);
                        if (useXhr) {
                            var body = getBody(request);
                            var postUrl = url + postPath;
                            sendPostRequestWithoutQueueing(body, postUrl);
                        }
                        return;
                    }
                }
                outQueue.push(querystring);
            }
            var savedToLocalStorage = false;
            if (useLocalStorage) {
                savedToLocalStorage = attemptWriteLocalStorage(queueName, JSON.stringify(outQueue.slice(0, maxLocalStorageQueueSize)));
            }
            // If we're not processing the queue, we'll start.
            if (!executingQueue && (!savedToLocalStorage || outQueue.length >= bufferSize)) {
                executeQueue();
            }
        }
        /*
         * Run through the queue of requests, sending them one at a time.
         * Stops processing when we run out of queued requests, or we get an error.
         */
        function executeQueue(sync) {
            if (sync === void 0) { sync = false; }
            // Failsafe in case there is some way for a bad value like "null" to end up in the outQueue
            while (outQueue.length && typeof outQueue[0] !== 'string' && typeof outQueue[0] !== 'object') {
                outQueue.shift();
            }
            if (outQueue.length < 1) {
                executingQueue = false;
                return;
            }
            // Let's check that we have a URL
            if (!isString(configCollectorUrl)) {
                throw 'No collector configured';
            }
            executingQueue = true;
            if (useXhr) {
                // Keep track of number of events to delete from queue
                var chooseHowManyToSend = function (queue) {
                    var numberToSend = 0, byteCount = 0;
                    while (numberToSend < queue.length) {
                        byteCount += queue[numberToSend].bytes;
                        if (byteCount >= maxPostBytes) {
                            break;
                        }
                        else {
                            numberToSend += 1;
                        }
                    }
                    return numberToSend;
                };
                var url = void 0, xhr_1, numberToSend_1;
                if (postable(outQueue)) {
                    url = configCollectorUrl;
                    xhr_1 = initializeXMLHttpRequest(url, true, sync);
                    numberToSend_1 = chooseHowManyToSend(outQueue);
                }
                else {
                    url = createGetUrl(outQueue[0]);
                    xhr_1 = initializeXMLHttpRequest(url, false, sync);
                    numberToSend_1 = 1;
                }
                // Time out POST requests after connectionTimeout
                var xhrTimeout_1 = setTimeout(function () {
                    xhr_1.abort();
                    executingQueue = false;
                }, connectionTimeout);
                var removeEventsFromQueue_1 = function (numberToSend) {
                    for (var deleteCount = 0; deleteCount < numberToSend; deleteCount++) {
                        outQueue.shift();
                    }
                    if (useLocalStorage) {
                        attemptWriteLocalStorage(queueName, JSON.stringify(outQueue.slice(0, maxLocalStorageQueueSize)));
                    }
                };
                // The events (`numberToSend` of them), have been sent, so we remove them from the outQueue
                // We also call executeQueue() again, to let executeQueue() check if we should keep running through the queue
                var onPostSuccess_1 = function (numberToSend) {
                    removeEventsFromQueue_1(numberToSend);
                    executeQueue();
                };
                xhr_1.onreadystatechange = function () {
                    if (xhr_1.readyState === 4 && xhr_1.status >= 200) {
                        clearTimeout(xhrTimeout_1);
                        if (xhr_1.status < 300) {
                            onPostSuccess_1(numberToSend_1);
                        }
                        else {
                            if (!shouldRetryForStatusCode(xhr_1.status)) {
                                LOG.error("Status ".concat(xhr_1.status, ", will not retry."));
                                removeEventsFromQueue_1(numberToSend_1);
                            }
                            executingQueue = false;
                        }
                    }
                };
                if (!postable(outQueue)) {
                    // If not postable then it's a GET so just send it
                    xhr_1.send();
                }
                else {
                    var batch = outQueue.slice(0, numberToSend_1);
                    if (batch.length > 0) {
                        var beaconStatus = false;
                        var eventBatch = batch.map(function (x) {
                            return x.evt;
                        });
                        if (useBeacon) {
                            var blob = new Blob([encloseInPayloadDataEnvelope(attachStmToEvent(eventBatch))], {
                                type: 'application/json'
                            });
                            try {
                                beaconStatus = navigator.sendBeacon(url, blob);
                            }
                            catch (error) {
                                beaconStatus = false;
                            }
                        }
                        // When beaconStatus is true, we can't _guarantee_ that it was successful (beacon queues asynchronously)
                        // but the browser has taken it out of our hands, so we want to flush the queue assuming it will do its job
                        if (beaconStatus === true) {
                            onPostSuccess_1(numberToSend_1);
                        }
                        else {
                            xhr_1.send(encloseInPayloadDataEnvelope(attachStmToEvent(eventBatch)));
                        }
                    }
                }
            }
            else if (!anonymousTracking && !postable(outQueue)) {
                // We can't send with this technique if anonymous tracking is on as we can't attach the header
                var image = new Image(1, 1), loading_1 = true;
                image.onload = function () {
                    if (!loading_1)
                        return;
                    loading_1 = false;
                    outQueue.shift();
                    if (useLocalStorage) {
                        attemptWriteLocalStorage(queueName, JSON.stringify(outQueue.slice(0, maxLocalStorageQueueSize)));
                    }
                    executeQueue();
                };
                image.onerror = function () {
                    if (!loading_1)
                        return;
                    loading_1 = false;
                    executingQueue = false;
                };
                image.src = createGetUrl(outQueue[0]);
                setTimeout(function () {
                    if (loading_1 && executingQueue) {
                        loading_1 = false;
                        executeQueue();
                    }
                }, connectionTimeout);
            }
            else {
                executingQueue = false;
            }
        }
        function shouldRetryForStatusCode(statusCode) {
            // success, don't retry
            if (statusCode >= 200 && statusCode < 300) {
                return false;
            }
            // retry if status code among custom user-supplied retry codes
            if (retryStatusCodes.includes(statusCode)) {
                return true;
            }
            // retry if status code *not* among the don't retry codes
            return !dontRetryStatusCodes.includes(statusCode);
        }
        /**
         * Open an XMLHttpRequest for a given endpoint with the correct credentials and header
         *
         * @param string - url The destination URL
         * @returns object The XMLHttpRequest
         */
        function initializeXMLHttpRequest(url, post, sync) {
            var xhr = new XMLHttpRequest();
            if (post) {
                xhr.open('POST', url, !sync);
                xhr.setRequestHeader('Content-Type', 'application/json; charset=UTF-8');
            }
            else {
                xhr.open('GET', url, !sync);
            }
            xhr.withCredentials = withCredentials;
            if (anonymousTracking) {
                xhr.setRequestHeader('SP-Anonymous', '*');
            }
            for (var header in customHeaders) {
                if (Object.prototype.hasOwnProperty.call(customHeaders, header)) {
                    xhr.setRequestHeader(header, customHeaders[header]);
                }
            }
            return xhr;
        }
        /**
         * Enclose an array of events in a self-describing payload_data JSON string
         *
         * @param array - events Batch of events
         * @returns string payload_data self-describing JSON
         */
        function encloseInPayloadDataEnvelope(events) {
            return JSON.stringify({
                schema: 'iglu:com.snowplowanalytics.snowplow/payload_data/jsonschema/1-0-4',
                data: events
            });
        }
        /**
         * Attaches the STM field to outbound POST events.
         *
         * @param events - the events to attach the STM to
         */
        function attachStmToEvent(events) {
            var stm = new Date().getTime().toString();
            for (var i = 0; i < events.length; i++) {
                events[i]['stm'] = stm;
            }
            return events;
        }
        /**
         * Creates the full URL for sending the GET request. Will append `stm` if enabled
         *
         * @param nextRequest - the query string of the next request
         */
        function createGetUrl(nextRequest) {
            if (useStm) {
                return configCollectorUrl + nextRequest.replace('?', '?stm=' + new Date().getTime() + '&');
            }
            return configCollectorUrl + nextRequest;
        }
        return {
            enqueueRequest: enqueueRequest,
            executeQueue: function () {
                if (!executingQueue) {
                    executeQueue();
                }
            },
            setUseLocalStorage: function (localStorage) {
                useLocalStorage = localStorage;
            },
            setAnonymousTracking: function (anonymous) {
                anonymousTracking = anonymous;
            },
            setCollectorUrl: function (url) {
                configCollectorUrl = url + path;
            },
            setBufferSize: function (newBufferSize) {
                bufferSize = newBufferSize;
            }
        };
        function hasWebKitBeaconBug(useragent) {
            return (isIosVersionLessThanOrEqualTo(13, useragent) ||
                (isMacosxVersionLessThanOrEqualTo(10, 15, useragent) && isSafari(useragent)));
            function isIosVersionLessThanOrEqualTo(major, useragent) {
                var match = useragent.match('(iP.+; CPU .*OS (d+)[_d]*.*) AppleWebKit/');
                if (match && match.length) {
                    return parseInt(match[0]) <= major;
                }
                return false;
            }
            function isMacosxVersionLessThanOrEqualTo(major, minor, useragent) {
                var match = useragent.match('(Macintosh;.*Mac OS X (d+)_(d+)[_d]*.*) AppleWebKit/');
                if (match && match.length) {
                    return parseInt(match[0]) <= major || (parseInt(match[0]) === major && parseInt(match[1]) <= minor);
                }
                return false;
            }
            function isSafari(useragent) {
                return useragent.match('Version/.* Safari/') && !isChromiumBased(useragent);
            }
            function isChromiumBased(useragent) {
                return useragent.match('Chrom(e|ium)');
            }
        }
    }

    /*
     * Copyright (c) 2022 Snowplow Analytics Ltd, 2010 Anthon Pang
     * All rights reserved.
     *
     * Redistribution and use in source and binary forms, with or without
     * modification, are permitted provided that the following conditions are met:
     *
     * 1. Redistributions of source code must retain the above copyright notice, this
     *    list of conditions and the following disclaimer.
     *
     * 2. Redistributions in binary form must reproduce the above copyright notice,
     *    this list of conditions and the following disclaimer in the documentation
     *    and/or other materials provided with the distribution.
     *
     * 3. Neither the name of the copyright holder nor the names of its
     *    contributors may be used to endorse or promote products derived from
     *    this software without specific prior written permission.
     *
     * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
     * AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
     * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
     * DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE
     * FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
     * DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
     * SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
     * CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
     * OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
     * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
     */
    /*
     * Extract parameter from URL
     */
    function getParameter(url, name) {
        // scheme : // [username [: password] @] hostname [: port] [/ [path] [? query] [# fragment]]
        var e = new RegExp('^(?:https?|ftp)(?::/*(?:[^?]+))([?][^#]+)'), matches = e.exec(url);
        if (matches && (matches === null || matches === void 0 ? void 0 : matches.length) > 1) {
            return fromQuerystring(name, matches[1]);
        }
        return null;
    }
    /*
     * Fix-up URL when page rendered from search engine cache or translated page.
     */
    function fixupUrl(hostName, href, referrer) {
        var _a;
        if (hostName === 'translate.googleusercontent.com') {
            // Google
            if (referrer === '') {
                referrer = href;
            }
            href = (_a = getParameter(href, 'u')) !== null && _a !== void 0 ? _a : '';
            hostName = getHostName(href);
        }
        else if (hostName === 'cc.bingj.com' || // Bing & Yahoo
            hostName === 'webcache.googleusercontent.com' // Google
        ) {
            href = document.links[0].href;
            hostName = getHostName(href);
        }
        return [hostName, href, referrer];
    }

    /*
     * Copyright (c) 2022 Snowplow Analytics Ltd, 2010 Anthon Pang
     * All rights reserved.
     *
     * Redistribution and use in source and binary forms, with or without
     * modification, are permitted provided that the following conditions are met:
     *
     * 1. Redistributions of source code must retain the above copyright notice, this
     *    list of conditions and the following disclaimer.
     *
     * 2. Redistributions in binary form must reproduce the above copyright notice,
     *    this list of conditions and the following disclaimer in the documentation
     *    and/or other materials provided with the distribution.
     *
     * 3. Neither the name of the copyright holder nor the names of its
     *    contributors may be used to endorse or promote products derived from
     *    this software without specific prior written permission.
     *
     * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
     * AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
     * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
     * DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE
     * FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
     * DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
     * SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
     * CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
     * OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
     * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
     */
    /**
     * Indices of cookie values
     */
    var cookieDisabledIndex = 0, domainUserIdIndex = 1, createTsIndex = 2, visitCountIndex = 3, nowTsIndex = 4, lastVisitTsIndex = 5, sessionIdIndex = 6, previousSessionIdIndex = 7, firstEventIdIndex = 8, firstEventTsInMsIndex = 9, eventIndexIndex = 10;
    function emptyIdCookie() {
        var idCookie = ['1', '', 0, 0, 0, undefined, '', '', '', undefined, 0];
        return idCookie;
    }
    /**
     * Parses the cookie values from its string representation.
     *
     * @param id Cookie value as string
     * @param domainUserId Domain user ID to be used in case of empty cookie string
     * @returns Parsed ID cookie tuple
     */
    function parseIdCookie(id, domainUserId, memorizedSessionId, memorizedVisitCount) {
        var now = new Date(), nowTs = Math.round(now.getTime() / 1000), tmpContainer;
        if (id) {
            tmpContainer = id.split('.');
            // cookies enabled
            tmpContainer.unshift('0');
        }
        else {
            tmpContainer = [
                // cookies disabled
                '1',
                // Domain user ID
                domainUserId,
                // Creation timestamp - seconds since Unix epoch
                nowTs,
                // visitCount - 0 = no previous visit
                memorizedVisitCount,
                // Current visit timestamp
                nowTs,
                // Last visit timestamp - blank meaning no previous visit
                '',
                // Session ID
                memorizedSessionId,
            ];
        }
        if (!tmpContainer[sessionIdIndex] || tmpContainer[sessionIdIndex] === 'undefined') {
            // session id
            tmpContainer[sessionIdIndex] = uuid_1.v4();
        }
        if (!tmpContainer[previousSessionIdIndex] || tmpContainer[previousSessionIdIndex] === 'undefined') {
            // previous session id
            tmpContainer[previousSessionIdIndex] = '';
        }
        if (!tmpContainer[firstEventIdIndex] || tmpContainer[firstEventIdIndex] === 'undefined') {
            // firstEventId - blank meaning no previous event
            tmpContainer[firstEventIdIndex] = '';
        }
        if (!tmpContainer[firstEventTsInMsIndex] || tmpContainer[firstEventTsInMsIndex] === 'undefined') {
            // firstEventTs - blank meaning no previous event
            tmpContainer[firstEventTsInMsIndex] = '';
        }
        if (!tmpContainer[eventIndexIndex] || tmpContainer[eventIndexIndex] === 'undefined') {
            // eventIndex – 0 = no previous event
            tmpContainer[eventIndexIndex] = -1;
        }
        var parseIntOr = function (value, defaultValue) {
            var parsed = parseInt(value);
            return isNaN(parsed) ? defaultValue : parsed;
        };
        var parseIntOrUndefined = function (value) { return (value ? parseIntOr(value, undefined) : undefined); };
        var parsed = [
            tmpContainer[cookieDisabledIndex],
            tmpContainer[domainUserIdIndex],
            parseIntOr(tmpContainer[createTsIndex], nowTs),
            parseIntOr(tmpContainer[visitCountIndex], memorizedVisitCount),
            parseIntOr(tmpContainer[nowTsIndex], nowTs),
            parseIntOrUndefined(tmpContainer[lastVisitTsIndex]),
            tmpContainer[sessionIdIndex],
            tmpContainer[previousSessionIdIndex],
            tmpContainer[firstEventIdIndex],
            parseIntOrUndefined(tmpContainer[firstEventTsInMsIndex]),
            parseIntOr(tmpContainer[eventIndexIndex], -1),
        ];
        return parsed;
    }
    /**
     * Initializes the domain user ID if not already present in the cookie. Sets an empty string if anonymous tracking.
     *
     * @param idCookie Parsed cookie
     * @param configAnonymousTracking Whether anonymous tracking is enabled
     * @returns Domain user ID
     */
    function initializeDomainUserId(idCookie, configAnonymousTracking) {
        var domainUserId;
        if (idCookie[domainUserIdIndex]) {
            domainUserId = idCookie[domainUserIdIndex];
        }
        else if (!configAnonymousTracking) {
            domainUserId = uuid_1.v4();
            idCookie[domainUserIdIndex] = domainUserId;
        }
        else {
            domainUserId = '';
            idCookie[domainUserIdIndex] = domainUserId;
        }
        return domainUserId;
    }
    /**
     * Starts a new session with a new ID.
     * Sets the previous session, last visit timestamp, and increments visit count if cookies enabled.
     * First event references are reset and will be updated in `updateFirstEventInIdCookie`.
     *
     * @param idCookie Parsed cookie
     * @param memorizedVisitCount Visit count to be used if cookies not enabled
     * @returns New session ID
     */
    function startNewIdCookieSession(idCookie, memorizedVisitCount) {
        if (memorizedVisitCount === void 0) { memorizedVisitCount = 1; }
        // If cookies are enabled, base visit count and session ID on the cookies
        if (cookiesEnabledInIdCookie(idCookie)) {
            // Store the previous session ID
            idCookie[previousSessionIdIndex] = idCookie[sessionIdIndex];
            // Set lastVisitTs to currentVisitTs
            idCookie[lastVisitTsIndex] = idCookie[nowTsIndex];
            // Increment the session ID
            idCookie[visitCountIndex]++;
        }
        else {
            idCookie[visitCountIndex] = memorizedVisitCount;
        }
        // Create a new sessionId
        var sessionId = uuid_1.v4();
        idCookie[sessionIdIndex] = sessionId;
        // Reset event index and first event references
        idCookie[eventIndexIndex] = -1;
        idCookie[firstEventIdIndex] = '';
        idCookie[firstEventTsInMsIndex] = undefined;
        return sessionId;
    }
    /**
     * Update now timestamp in cookie.
     *
     * @param idCookie Parsed cookie
     */
    function updateNowTsInIdCookie(idCookie) {
        idCookie[nowTsIndex] = Math.round(new Date().getTime() / 1000);
    }
    /**
     * Updates the first event references according to the event payload if first event in session.
     *
     * @param idCookie Parsed cookie
     * @param payloadBuilder Event payload builder
     */
    function updateFirstEventInIdCookie(idCookie, payloadBuilder) {
        // Update first event references if new session or not present
        if (idCookie[eventIndexIndex] === -1) {
            var payload = payloadBuilder.build();
            idCookie[firstEventIdIndex] = payload['eid'];
            var ts = (payload['dtm'] || payload['ttm']);
            idCookie[firstEventTsInMsIndex] = ts ? parseInt(ts) : undefined;
        }
    }
    /**
     * Increments event index counter.
     *
     * @param idCookie Parsed cookie
     */
    function incrementEventIndexInIdCookie(idCookie) {
        idCookie[eventIndexIndex] += 1;
    }
    /**
     * Serializes parsed cookie to string representation.
     *
     * @param idCookie Parsed cookie
     * @returns String cookie value
     */
    function serializeIdCookie(idCookie) {
        idCookie.shift();
        return idCookie.join('.');
    }
    /**
     * Transforms the parsed cookie into a client session context entity.
     *
     * @param idCookie Parsed cookie
     * @param configStateStorageStrategy Cookie storage strategy
     * @returns Client session context entity
     */
    function clientSessionFromIdCookie(idCookie, configStateStorageStrategy) {
        var firstEventTsInMs = idCookie[firstEventTsInMsIndex];
        var clientSession = {
            userId: idCookie[domainUserIdIndex],
            sessionId: idCookie[sessionIdIndex],
            eventIndex: idCookie[eventIndexIndex],
            sessionIndex: idCookie[visitCountIndex],
            previousSessionId: idCookie[previousSessionIdIndex] || null,
            storageMechanism: configStateStorageStrategy == 'localStorage' ? 'LOCAL_STORAGE' : 'COOKIE_1',
            firstEventId: idCookie[firstEventIdIndex] || null,
            firstEventTimestamp: firstEventTsInMs ? new Date(firstEventTsInMs).toISOString() : null
        };
        return clientSession;
    }
    function sessionIdFromIdCookie(idCookie) {
        return idCookie[sessionIdIndex];
    }
    function domainUserIdFromIdCookie(idCookie) {
        return idCookie[domainUserIdIndex];
    }
    function visitCountFromIdCookie(idCookie) {
        return idCookie[visitCountIndex];
    }
    function cookiesEnabledInIdCookie(idCookie) {
        return idCookie[cookieDisabledIndex] === '0';
    }

    /*
     * Copyright (c) 2022 Snowplow Analytics Ltd, 2010 Anthon Pang
     * All rights reserved.
     *
     * Redistribution and use in source and binary forms, with or without
     * modification, are permitted provided that the following conditions are met:
     *
     * 1. Redistributions of source code must retain the above copyright notice, this
     *    list of conditions and the following disclaimer.
     *
     * 2. Redistributions in binary form must reproduce the above copyright notice,
     *    this list of conditions and the following disclaimer in the documentation
     *    and/or other materials provided with the distribution.
     *
     * 3. Neither the name of the copyright holder nor the names of its
     *    contributors may be used to endorse or promote products derived from
     *    this software without specific prior written permission.
     *
     * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
     * AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
     * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
     * DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE
     * FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
     * DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
     * SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
     * CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
     * OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
     * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
     */
    /**
     * The Snowplow Tracker
     *
     * @param trackerId - The unique identifier of the tracker
     * @param namespace - The namespace of the tracker object
     * @param version - The current version of the JavaScript Tracker
     * @param endpoint - The collector endpoint to send events to, with or without protocol
     * @param sharedState - An object containing state which is shared across tracker instances
     * @param trackerConfiguration - Dictionary of configuration options
     */
    function Tracker(trackerId, namespace, version, endpoint, sharedState, trackerConfiguration) {
        if (trackerConfiguration === void 0) { trackerConfiguration = {}; }
        var browserPlugins = [];
        var newTracker = function (trackerId, namespace, version, endpoint, state, trackerConfiguration) {
            var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _0, _1, _2;
            /************************************************************
             * Private members
             ************************************************************/
            var storedConvivaRemoteConfig, storedConvivaEndpointUrl;
            // Default conviva configuration
            var convivaRemoteTrackerConfig = {
                base64: true,
                linkClickTracking: true,
                buttonClickTracking: true,
                customEvent: true,
                exceptionAutotracking: true,
                enablePeriodicHeartbeat: true,
                periodicHeartbeatInterval: 40,
                customEventTrackingConfiguration: {},
                convivaVideoEventTrackingConfiguration: {},
                ajaxTrackingConfiguration: {}
            };
            if (window.localStorage) {
                storedConvivaRemoteConfig = localStorage.getItem('ConvivaRemoteConfig')
                    ? localStorage.getItem('ConvivaRemoteConfig')
                    : JSON.stringify(convivaRemoteTrackerConfig);
                storedConvivaEndpointUrl = localStorage.getItem('ConvivaEndpoint')
                    ? localStorage.getItem('ConvivaEndpoint')
                    : 'https://appgw.conviva.com';
            }
            else {
                storedConvivaEndpointUrl = 'https://appgw.conviva.com';
                storedConvivaRemoteConfig = JSON.stringify(convivaRemoteTrackerConfig);
            }
            if (trackerConfiguration.gatewayUrl) {
                endpoint = trackerConfiguration.gatewayUrl;
            }
            else if (storedConvivaEndpointUrl) {
                endpoint = storedConvivaEndpointUrl;
            }
            else {
                endpoint = 'https://appgw.conviva.com';
            }
            if (!namespace) {
                namespace = 'CAT';
            }
            // Object.keys(JSON.parse(storedConvivaRemoteConfig)).forEach(function(key) {
            //   convivaRemoteTrackerConfig[key] = typeof(storedConvivaRemoteConfig[key]) !== 'undefined' ? storedConvivaRemoteConfig[key] : convivaRemoteTrackerConfig[key];
            // });
            var parsedConfig = JSON.parse(storedConvivaRemoteConfig);
            if (typeof parsedConfig.base64 != 'undefined') {
                convivaRemoteTrackerConfig.base64 = parsedConfig.base64;
            }
            if (typeof parsedConfig.linkClickTracking != 'undefined') {
                convivaRemoteTrackerConfig.linkClickTracking = parsedConfig.linkClickTracking;
            }
            if (typeof parsedConfig.buttonClickTracking != 'undefined') {
                convivaRemoteTrackerConfig.buttonClickTracking = parsedConfig.buttonClickTracking;
            }
            if (typeof parsedConfig.exceptionAutotracking != 'undefined') {
                convivaRemoteTrackerConfig.exceptionAutotracking = parsedConfig.exceptionAutotracking;
            }
            if (typeof parsedConfig.enablePeriodicHeartbeat != 'undefined') {
                convivaRemoteTrackerConfig.enablePeriodicHeartbeat = parsedConfig.enablePeriodicHeartbeat;
            }
            if (typeof parsedConfig.periodicHeartbeatInterval != 'undefined') {
                convivaRemoteTrackerConfig.periodicHeartbeatInterval = parsedConfig.periodicHeartbeatInterval;
            }
            if (typeof parsedConfig.customEventTrackingConfiguration != 'undefined') {
                convivaRemoteTrackerConfig.customEventTrackingConfiguration = parsedConfig.customEventTrackingConfiguration;
            }
            if (typeof parsedConfig.convivaVideoEventTrackingConfiguration != 'undefined') {
                convivaRemoteTrackerConfig.convivaVideoEventTrackingConfiguration =
                    parsedConfig.convivaVideoEventTrackingConfiguration;
            }
            if (typeof parsedConfig.ajaxTrackingConfiguration != 'undefined') {
                convivaRemoteTrackerConfig.ajaxTrackingConfiguration = parsedConfig.ajaxTrackingConfiguration;
            }
            if (window.XMLHttpRequest) {
                var configxhr_1 = new XMLHttpRequest();
                configxhr_1.onreadystatechange = function () {
                    if (this.readyState == 4) {
                        if (this.status == 200) {
                            // Typical action to be performed when the document is ready:
                            var remoteConfig = JSON.parse(configxhr_1.response);
                            updateRemoteConfig(remoteConfig);
                        }
                        else {
                            if (convivaFallbackConfig._convivaVersion && convivaFallbackConfig._convivaCustomerKey) {
                                try {
                                    delete convivaFallbackConfig._convivaVersion;
                                    configxhr_1.open('GET', 'https://drt1fhpy4haqm.cloudfront.net/js/' +
                                        convivaFallbackConfig._convivaCustomerKey +
                                        '/remote_config.json', true);
                                    // configxhr.setRequestHeader('Cache-Control', 'no-cache');
                                    configxhr_1.send();
                                }
                                catch (e) {
                                    delete convivaFallbackConfig._convivaVersion;
                                }
                            }
                            else if (convivaFallbackConfig._convivaCustomerKey) {
                                try {
                                    delete convivaFallbackConfig._convivaCustomerKey;
                                    configxhr_1.open('GET', 'https://drt1fhpy4haqm.cloudfront.net/js/remote_config.json', true);
                                    // configxhr.setRequestHeader('Cache-Control', 'no-cache');
                                    configxhr_1.send();
                                }
                                catch (e) {
                                    delete convivaFallbackConfig._convivaCustomerKey;
                                }
                            }
                        }
                    }
                };
                var configtimerCallback = function (url) {
                    try {
                        configxhr_1.open('GET', url, true);
                        // configxhr.setRequestHeader('Cache-Control', 'no-cache');
                        configxhr_1.send();
                    }
                    catch (e) { }
                };
                if (trackerConfiguration.trackerConfigUrl) {
                    configtimerCallback(trackerConfiguration.trackerConfigUrl);
                    window.setInterval(configtimerCallback, 3600000, trackerConfiguration.trackerConfigUrl);
                }
                else {
                    var convivaFallbackConfig = {
                        _platform: 'js',
                        _convivaVersion: version,
                        _convivaCustomerKey: trackerConfiguration.convivaCustomerKey
                    };
                    var defaultRemoteConfigUrl = 'https://drt1fhpy4haqm.cloudfront.net/js/' +
                        trackerConfiguration.convivaCustomerKey +
                        '/' +
                        version +
                        '/remote_config.json';
                    configtimerCallback(defaultRemoteConfigUrl);
                    window.setInterval(configtimerCallback, 3600000, defaultRemoteConfigUrl);
                }
            }
            //use POST if eventMethod isn't present on the newTrackerConfiguration
            trackerConfiguration.eventMethod = (_a = trackerConfiguration.eventMethod) !== null && _a !== void 0 ? _a : 'post';
            var getStateStorageStrategy = function (config) { var _a; return (_a = config.stateStorageStrategy) !== null && _a !== void 0 ? _a : 'cookieAndLocalStorage'; }, getAnonymousSessionTracking = function (config) {
                var _a, _b;
                if (typeof config.anonymousTracking === 'boolean') {
                    return false;
                }
                return (_b = ((_a = config.anonymousTracking) === null || _a === void 0 ? void 0 : _a.withSessionTracking) === true) !== null && _b !== void 0 ? _b : false;
            }, getAnonymousServerTracking = function (config) {
                var _a, _b;
                if (typeof config.anonymousTracking === 'boolean') {
                    return false;
                }
                return (_b = ((_a = config.anonymousTracking) === null || _a === void 0 ? void 0 : _a.withServerAnonymisation) === true) !== null && _b !== void 0 ? _b : false;
            }, getAnonymousTracking = function (config) { return !!config.anonymousTracking; };
            // Get all injected plugins
            browserPlugins.push(getBrowserDataPlugin());
            if ((_c = (_b = trackerConfiguration === null || trackerConfiguration === void 0 ? void 0 : trackerConfiguration.contexts) === null || _b === void 0 ? void 0 : _b.webPage) !== null && _c !== void 0 ? _c : true) {
                browserPlugins.push(getWebPagePlugin()); // Defaults to including the Web Page context
            }
            browserPlugins.push(getConvivaPlugin()); // Defaults to including Conviva context
            browserPlugins.push(getConvivaCustomTagsPlugin()); // Defaults to including Conviva context
            browserPlugins.push.apply(// Defaults to including Conviva context
            browserPlugins, ((_d = trackerConfiguration.plugins) !== null && _d !== void 0 ? _d : []));
            var // Tracker core
            core = trackerCore({
                base64: convivaRemoteTrackerConfig.base64,
                corePlugins: browserPlugins,
                callback: sendRequest,
                linkClickTracking: convivaRemoteTrackerConfig.linkClickTracking,
                buttonClickTracking: convivaRemoteTrackerConfig.buttonClickTracking,
                customEvent: true,
                exceptionAutotracking: convivaRemoteTrackerConfig.exceptionAutotracking,
                enablePeriodicHeartbeat: convivaRemoteTrackerConfig.enablePeriodicHeartbeat,
                periodicHeartbeatInterval: convivaRemoteTrackerConfig.periodicHeartbeatInterval,
                customEventTrackingConfiguration: convivaRemoteTrackerConfig.customEventTrackingConfiguration,
                convivaVideoEventTrackingConfiguration: convivaRemoteTrackerConfig.convivaVideoEventTrackingConfiguration,
                ajaxTrackingConfiguration: convivaRemoteTrackerConfig.ajaxTrackingConfiguration
            }),
            // Aliases
            browserLanguage = navigator.userLanguage || navigator.language, documentCharset = document.characterSet || document.charset,
            // Current URL and Referrer URL
            locationArray = fixupUrl(window.location.hostname, window.location.href, getReferrer()), domainAlias = fixupDomain(locationArray[0]), locationHrefAlias = locationArray[1], configReferrerUrl = locationArray[2], customReferrer,
            // Platform defaults to web for this tracker
            configPlatform = (_e = trackerConfiguration.platform) !== null && _e !== void 0 ? _e : 'web',
            // Snowplow collector URL
            configCollectorUrl = asCollectorUrl(endpoint),
            // Custom path for post requests (to get around adblockers)
            // configPostPath = trackerConfiguration.postPath ?? '/com.snowplowanalytics.snowplow/ctp',
            configPostPath = (_f = trackerConfiguration.postPath) !== null && _f !== void 0 ? _f : '/' + trackerConfiguration.convivaCustomerKey + '/ctp',
            // Site ID
            configTrackerSiteId = (_g = trackerConfiguration.appId) !== null && _g !== void 0 ? _g : '',
            //Conviva Customer Key
            convivaCustomerKey = (_h = trackerConfiguration.convivaCustomerKey) !== null && _h !== void 0 ? _h : '',
            // Document URL
            configCustomUrl,
            //Conviva Custom tags
            convivaCustomTags = {},
            // Document title
            lastDocumentTitle = document.title,
            // Custom title
            lastConfigTitle,
            // Controls whether activity tracking page ping event timers are reset on page view events
            resetActivityTrackingOnPageView = (_j = trackerConfiguration.resetActivityTrackingOnPageView) !== null && _j !== void 0 ? _j : true,
            // Disallow hash tags in URL. TODO: Should this be set to true by default?
            configDiscardHashTag,
            // Disallow brace in URL.
            configDiscardBrace,
            // First-party cookie name prefix
            configCookieNamePrefix = (_k = trackerConfiguration.cookieName) !== null && _k !== void 0 ? _k : '_sp_',
            // First-party cookie domain
            // User agent defaults to origin hostname
            configCookieDomain = (_l = trackerConfiguration.cookieDomain) !== null && _l !== void 0 ? _l : undefined,
            // First-party cookie path
            // Default is user agent defined.
            configCookiePath = '/',
            // First-party cookie samesite attribute
            configCookieSameSite = (_m = trackerConfiguration.cookieSameSite) !== null && _m !== void 0 ? _m : 'None',
            // First-party cookie secure attribute
            configCookieSecure = (_o = trackerConfiguration.cookieSecure) !== null && _o !== void 0 ? _o : true,
            // Do Not Track browser feature
            dnt = navigator.doNotTrack || navigator.msDoNotTrack || window.doNotTrack,
            // Do Not Track
            configDoNotTrack = typeof trackerConfiguration.respectDoNotTrack !== 'undefined'
                ? trackerConfiguration.respectDoNotTrack && (dnt === 'yes' || dnt === '1')
                : false,
            // Opt out of cookie tracking
            configOptOutCookie,
            // Life of the visitor cookie (in seconds)
            configVisitorCookieTimeout = (_p = trackerConfiguration.cookieLifetime) !== null && _p !== void 0 ? _p : 63072000, // 2 years
            // Life of the session cookie (in seconds)
            configSessionCookieTimeout = (_q = trackerConfiguration.sessionCookieTimeout) !== null && _q !== void 0 ? _q : 1800, // 30 minutes
            // Allows tracking user session (using cookies or local storage), can only be used with anonymousTracking
            configAnonymousSessionTracking = getAnonymousSessionTracking(trackerConfiguration),
            // Will send a header to server to prevent returning cookie and capturing IP
            configAnonymousServerTracking = getAnonymousServerTracking(trackerConfiguration),
            // Sets tracker to work in anonymous mode without accessing client storage
            configAnonymousTracking = getAnonymousTracking(trackerConfiguration),
            // Strategy defining how to store the state: cookie, localStorage, cookieAndLocalStorage or none
            configStateStorageStrategy = getStateStorageStrategy(trackerConfiguration),
            // ! Conviva-Specific !
            convivaConfigStorageSpace = 'Conviva', convivaConfigStorageKey = 'sdkConfig', convivaConfigClidKey = 'clId',
            // convivaConfigIidKey = 'iid',
            convivaClid, convivaIid, convivaEventIndex = 0,
            // Last activity timestamp
            lastActivityTime,
            // The last time an event was fired on the page - used to invalidate session if cookies are disabled
            lastEventTime = new Date().getTime(),
            // How are we scrolling?
            minXOffset, maxXOffset, minYOffset, maxYOffset,
            // Domain hash value
            domainHash,
            // Domain unique user ID
            domainUserId,
            // ID for the current session
            memorizedSessionId,
            // Index for the current session - kept in memory in case cookies are disabled
            memorizedVisitCount = 1,
            // Business-defined unique user ID
            businessUserId,
            // Manager for local storage queue
            outQueue = OutQueueManager(trackerId, state, configStateStorageStrategy == 'localStorage' || configStateStorageStrategy == 'cookieAndLocalStorage', trackerConfiguration.eventMethod, configPostPath, (_r = trackerConfiguration.bufferSize) !== null && _r !== void 0 ? _r : 1, (_s = trackerConfiguration.maxPostBytes) !== null && _s !== void 0 ? _s : 40000, (_t = trackerConfiguration.maxGetBytes) !== null && _t !== void 0 ? _t : 0, (_u = trackerConfiguration.useStm) !== null && _u !== void 0 ? _u : true, (_v = trackerConfiguration.maxLocalStorageQueueSize) !== null && _v !== void 0 ? _v : 1000, (_w = trackerConfiguration.connectionTimeout) !== null && _w !== void 0 ? _w : 5000, configAnonymousServerTracking, (_x = trackerConfiguration.customHeaders) !== null && _x !== void 0 ? _x : {}, (_y = trackerConfiguration.withCredentials) !== null && _y !== void 0 ? _y : true, (_z = trackerConfiguration.retryStatusCodes) !== null && _z !== void 0 ? _z : [], ((_0 = trackerConfiguration.dontRetryStatusCodes) !== null && _0 !== void 0 ? _0 : []).concat([400, 401, 403, 410, 422])),
            // Whether pageViewId should be regenerated after each trackPageView. Affect web_page context
            preservePageViewId = false,
            // Previous HB timestamp by Conviva - Tied to iid
            convivaPrevHbTimeStamp,
            // Whether first trackPageView was fired and pageViewId should not be changed anymore until reload
            pageViewSent = false,
            // Activity tracking config for callback and pacge ping variants
            activityTrackingConfig = {
                enabled: true,
                installed: false,
                configurations: {
                    pagePing: {
                        configMinimumVisitLength: 5 * 1000,
                        configHeartBeatTimer: 40 * 1000,
                        callback: logPagePing
                    }
                }
            }, configSessionContext = (_2 = (_1 = trackerConfiguration.contexts) === null || _1 === void 0 ? void 0 : _1.session) !== null && _2 !== void 0 ? _2 : false, toOptoutByCookie;
            if (trackerConfiguration.hasOwnProperty('discoverRootDomain') && trackerConfiguration.discoverRootDomain) {
                configCookieDomain = findRootDomain(configCookieSameSite, configCookieSecure);
            }
            // Set up unchanging name-value pairs
            core.setTrackerVersion(version);
            core.setTrackerNamespace(namespace);
            core.setAppId(configTrackerSiteId);
            core.setPlatform(configPlatform);
            core.addPayloadPair('cookie', navigator.cookieEnabled ? '1' : '0');
            core.addPayloadPair('cs', documentCharset);
            core.addPayloadPair('lang', browserLanguage);
            core.addPayloadPair('res', screen.width + 'x' + screen.height);
            core.addPayloadPair('cd', screen.colorDepth);
            /*
             * Initialize tracker
             */
            updateDomainHash();
            initializeIdsAndCookies();
            if (trackerConfiguration.crossDomainLinker) {
                decorateLinks(trackerConfiguration.crossDomainLinker);
            }
            /**
             * Recalculate the domain, URL, and referrer
             */
            function refreshUrl() {
                locationArray = fixupUrl(window.location.hostname, window.location.href, getReferrer());
                // If this is a single-page app and the page URL has changed, then:
                //   - if the new URL's querystring contains a "refer(r)er" parameter, use it as the referrer
                //   - otherwise use the old URL as the referer
                if (locationArray[1] !== locationHrefAlias) {
                    configReferrerUrl = getReferrer(locationHrefAlias);
                }
                domainAlias = fixupDomain(locationArray[0]);
                locationHrefAlias = locationArray[1];
            }
            /**
             * Decorate the querystring of a single link
             *
             * @param event - e The event targeting the link
             */
            function linkDecorationHandler(evt) {
                var timestamp = new Date().getTime();
                var elt = evt.currentTarget;
                if (elt === null || elt === void 0 ? void 0 : elt.href) {
                    elt.href = decorateQuerystring(elt.href, '_sp', domainUserId + '.' + timestamp);
                }
            }
            /**
             * Enable querystring decoration for links pasing a filter
             * Whenever such a link is clicked on or navigated to via the keyboard,
             * add "_sp={{duid}}.{{timestamp}}" to its querystring
             *
             * @param crossDomainLinker - Function used to determine which links to decorate
             */
            function decorateLinks(crossDomainLinker) {
                for (var i = 0; i < document.links.length; i++) {
                    var elt = document.links[i];
                    if (!elt.spDecorationEnabled && crossDomainLinker(elt)) {
                        addEventListener(elt, 'click', linkDecorationHandler, true);
                        addEventListener(elt, 'mousedown', linkDecorationHandler, true);
                        // Don't add event listeners more than once
                        elt.spDecorationEnabled = true;
                    }
                }
            }
            /*
             * Removes hash tag from the URL
             *
             * URLs are purified before being recorded in the cookie,
             * or before being sent as GET parameters
             */
            function purify(url) {
                var targetPattern;
                if (configDiscardHashTag) {
                    targetPattern = new RegExp('#.*');
                    url = url.replace(targetPattern, '');
                }
                if (configDiscardBrace) {
                    targetPattern = new RegExp('[{}]', 'g');
                    url = url.replace(targetPattern, '');
                }
                return url;
            }
            /*
             * Extract scheme/protocol from URL
             */
            function getProtocolScheme(url) {
                var e = new RegExp('^([a-z]+):'), matches = e.exec(url);
                return matches ? matches[1] : null;
            }
            /*
             * Resolve relative reference
             *
             * Note: not as described in rfc3986 section 5.2
             */
            function resolveRelativeReference(baseUrl, url) {
                var protocol = getProtocolScheme(url), i;
                if (protocol) {
                    return url;
                }
                if (url.slice(0, 1) === '/') {
                    return getProtocolScheme(baseUrl) + '://' + getHostName(baseUrl) + url;
                }
                baseUrl = purify(baseUrl);
                if ((i = baseUrl.indexOf('?')) >= 0) {
                    baseUrl = baseUrl.slice(0, i);
                }
                if ((i = baseUrl.lastIndexOf('/')) !== baseUrl.length - 1) {
                    baseUrl = baseUrl.slice(0, i + 1);
                }
                return baseUrl + url;
            }
            /*
             * Send request
             */
            function sendRequest(request) {
                if (!(configDoNotTrack || toOptoutByCookie)) {
                    outQueue.enqueueRequest(request.build(), configCollectorUrl);
                }
            }
            /*
             * Get cookie name with prefix and domain hash
             */
            function getSnowplowCookieName(baseName) {
                return configCookieNamePrefix + baseName + '.' + domainHash;
            }
            /*
             * Cookie getter.
             */
            function getSnowplowCookieValue(cookieName) {
                var fullName = getSnowplowCookieName(cookieName);
                if (configStateStorageStrategy == 'localStorage') {
                    return attemptGetLocalStorage(fullName);
                }
                else if (configStateStorageStrategy == 'cookie' || configStateStorageStrategy == 'cookieAndLocalStorage') {
                    return cookie(fullName);
                }
                return undefined;
            }
            /*
             * Update domain hash
             */
            function updateDomainHash() {
                refreshUrl();
                domainHash = hash((configCookieDomain || domainAlias) + (configCookiePath || '/')).slice(0, 4); // 4 hexits = 16 bits
            }
            /*
             * Process all "activity" events.
             * For performance, this function must have low overhead.
             */
            function activityHandler() {
                var now = new Date();
                lastActivityTime = now.getTime();
            }
            /*
             * Process all "scroll" events.
             */
            function scrollHandler() {
                updateMaxScrolls();
                activityHandler();
            }
            /*
             * Returns [pageXOffset, pageYOffset]
             */
            function getPageOffsets() {
                var documentElement = document.documentElement;
                if (documentElement) {
                    return [documentElement.scrollLeft || window.pageXOffset, documentElement.scrollTop || window.pageYOffset];
                }
                return [0, 0];
            }
            /*
             * Quick initialization/reset of max scroll levels
             */
            function resetMaxScrolls() {
                var offsets = getPageOffsets();
                var x = offsets[0];
                minXOffset = x;
                maxXOffset = x;
                var y = offsets[1];
                minYOffset = y;
                maxYOffset = y;
            }
            /*
             * Check the max scroll levels, updating as necessary
             */
            function updateMaxScrolls() {
                var offsets = getPageOffsets();
                var x = offsets[0];
                if (x < minXOffset) {
                    minXOffset = x;
                }
                else if (x > maxXOffset) {
                    maxXOffset = x;
                }
                var y = offsets[1];
                if (y < minYOffset) {
                    minYOffset = y;
                }
                else if (y > maxYOffset) {
                    maxYOffset = y;
                }
            }
            /*
             * Prevents offsets from being decimal or NaN
             * See https://github.com/snowplow/snowplow-javascript-tracker/issues/324
             */
            function cleanOffset(offset) {
                return Math.round(offset);
            }
            /*
             * Sets or renews the session cookie
             */
            function setSessionCookie() {
                var cookieName = getSnowplowCookieName('ses');
                var cookieValue = '*';
                setCookie(cookieName, cookieValue, configSessionCookieTimeout);
            }
            /*
             * Sets the Visitor ID cookie: either the first time loadDomainUserIdCookie is called
             * or when there is a new visit or a new page view
             */
            function setDomainUserIdCookie(idCookie) {
                var cookieName = getSnowplowCookieName('id');
                var cookieValue = serializeIdCookie(idCookie);
                setCookie(cookieName, cookieValue, configVisitorCookieTimeout);
            }
            /*
             * no-op if anonymousTracking enabled, will still set cookies if anonymousSessionTracking is enabled
             * Sets a cookie based on the storage strategy:
             * - if 'localStorage': attemps to write to local storage
             * - if 'cookie' or 'cookieAndLocalStorage': writes to cookies
             * - otherwise: no-op
             */
            function setCookie(name, value, timeout) {
                if (configAnonymousTracking && !configAnonymousSessionTracking) {
                    return;
                }
                if (configStateStorageStrategy == 'localStorage') {
                    attemptWriteLocalStorage(name, value, timeout);
                }
                else if (configStateStorageStrategy == 'cookie' || configStateStorageStrategy == 'cookieAndLocalStorage') {
                    cookie(name, value, timeout, configCookiePath, configCookieDomain, configCookieSameSite, configCookieSecure);
                }
            }
            /**
             * Clears all cookie and local storage for id and ses values
             */
            function clearUserDataAndCookies(configuration) {
                var idname = getSnowplowCookieName('id');
                var sesname = getSnowplowCookieName('ses');
                attemptDeleteLocalStorage(idname);
                attemptDeleteLocalStorage(sesname);
                deleteCookie(idname, configCookieDomain, configCookieSameSite, configCookieSecure);
                deleteCookie(sesname, configCookieDomain, configCookieSameSite, configCookieSecure);
                if (!(configuration === null || configuration === void 0 ? void 0 : configuration.preserveSession)) {
                    memorizedSessionId = uuid_1.v4();
                    memorizedVisitCount = 1;
                }
                if (!(configuration === null || configuration === void 0 ? void 0 : configuration.preserveUser)) {
                    domainUserId = uuid_1.v4();
                    businessUserId = null;
                }
            }
            /**
             * Toggle Anaonymous Tracking
             */
            function toggleAnonymousTracking(configuration) {
                if (configuration && configuration.stateStorageStrategy) {
                    trackerConfiguration.stateStorageStrategy = configuration.stateStorageStrategy;
                    configStateStorageStrategy = getStateStorageStrategy(trackerConfiguration);
                }
                configAnonymousTracking = getAnonymousTracking(trackerConfiguration);
                configAnonymousSessionTracking = getAnonymousSessionTracking(trackerConfiguration);
                configAnonymousServerTracking = getAnonymousServerTracking(trackerConfiguration);
                outQueue.setUseLocalStorage(configStateStorageStrategy == 'localStorage' || configStateStorageStrategy == 'cookieAndLocalStorage');
                outQueue.setAnonymousTracking(configAnonymousServerTracking);
            }
            /*
             * Load the domain user ID and the session ID
             * Set the cookies (if cookies are enabled)
             */
            function initializeIdsAndCookies() {
                generateClidAndIid();
                if (configAnonymousTracking && !configAnonymousSessionTracking) {
                    return;
                }
                var sesCookieSet = configStateStorageStrategy != 'none' && !!getSnowplowCookieValue('ses');
                var idCookie = loadDomainUserIdCookie();
                domainUserId = initializeDomainUserId(idCookie, configAnonymousTracking);
                if (!sesCookieSet) {
                    memorizedSessionId = startNewIdCookieSession(idCookie);
                }
                else {
                    memorizedSessionId = sessionIdFromIdCookie(idCookie);
                }
                memorizedVisitCount = visitCountFromIdCookie(idCookie);
                if (configStateStorageStrategy != 'none') {
                    setSessionCookie();
                    // Update currentVisitTs
                    updateNowTsInIdCookie(idCookie);
                    setDomainUserIdCookie(idCookie);
                }
            }
            /*
             * Load visitor ID cookie
             */
            function loadDomainUserIdCookie() {
                if (configStateStorageStrategy == 'none') {
                    return emptyIdCookie();
                }
                var id = getSnowplowCookieValue('id') || undefined;
                return parseIdCookie(id, domainUserId, memorizedSessionId, memorizedVisitCount);
            }
            /**
             * Adds the protocol in front of our collector URL
             *
             * @param string - collectorUrl The collector URL with or without protocol
             * @returns string collectorUrl The tracker URL with protocol
             */
            function asCollectorUrl(collectorUrl) {
                if (collectorUrl.indexOf('http') === 0) {
                    return collectorUrl;
                }
                return ('https:' === document.location.protocol ? 'https' : 'http') + '://' + collectorUrl;
            }
            /**
             * Initialize new `pageViewId` if it shouldn't be preserved.
             * Should be called when `trackPageView` is invoked
             */
            function resetPageView() {
                if (!preservePageViewId || state.pageViewId == null) {
                    state.pageViewId = uuid_1.v4();
                }
            }
            /**
             * Safe function to get `pageViewId`.
             * Generates it if it wasn't initialized by other tracker
             */
            function getPageViewId() {
                if (state.pageViewId == null) {
                    state.pageViewId = uuid_1.v4();
                }
                return state.pageViewId;
            }
            /**
             * Put together a web page context with a unique UUID for the page view
             *
             * @returns web_page context
             */
            function getWebPagePlugin() {
                return {
                    contexts: function () {
                        return [
                            {
                                schema: 'iglu:com.snowplowanalytics.snowplow/web_page/jsonschema/1-0-0',
                                data: {
                                    id: getPageViewId()
                                }
                            },
                        ];
                    }
                };
            }
            /*
             * Attaches common web fields to every request (resolution, url, referrer, etc.)
             * Also sets the required cookies.
             */
            function getConvivaPlugin() {
                return {
                    contexts: function () {
                        return [
                            {
                                schema: 'iglu:com.conviva/clid_schema/jsonschema/1-0-1',
                                data: {
                                    clid: getClid(),
                                    iid: getIid().toString(),
                                    ck: getCustomerKey()
                                }
                            },
                            {
                                schema: 'iglu:com.conviva/event_info/jsonschema/1-0-1',
                                data: getEventInfoData()
                            },
                        ];
                    }
                };
            }
            // Custom Tags context to be added
            function getConvivaCustomTagsPlugin() {
                return {
                    contexts: function () {
                        return [
                            {
                                schema: 'iglu:com.conviva/custom_tags/jsonschema/1-0-0',
                                data: getConvivaCustomTagsData()
                            },
                        ];
                    }
                };
            }
            function getConvivaCustomTagsData() {
                var temp = { data: convivaCustomTags };
                return temp;
            }
            function getEventInfoData() {
                var temp_data = {
                    eventIndex: convivaEventIndex++
                };
                if (convivaPrevHbTimeStamp != null) {
                    temp_data.previousEventTimestamp = convivaPrevHbTimeStamp;
                }
                convivaPrevHbTimeStamp = new Date().toISOString();
                return temp_data;
            }
            function getCustomerKey() {
                return convivaCustomerKey;
            }
            function getClid() {
                return convivaClid;
            }
            function getIid() {
                return convivaIid;
            }
            function generateClidAndIid() {
                try {
                    var localStorageAlias = window.localStorage;
                    var configJson = localStorageAlias.getItem(convivaConfigStorageSpace + '.' + convivaConfigStorageKey);
                    var config = JSON.parse(configJson || '{}');
                    // let data = {};
                    if (config === '{}' || typeof config === 'undefined') {
                        convivaClid = generateClid();
                        convivaIid = generateIid();
                    }
                    else {
                        convivaClid = config[convivaConfigClidKey] || generateClid();
                        convivaIid = generateIid();
                    }
                    writeConvivaIdsToStorage();
                }
                catch (err) {
                    console.warn(err);
                    return;
                }
            }
            function writeConvivaIdsToStorage() {
                try {
                    var localStorageAlias = window.localStorage;
                    var configToSave = {
                        clId: convivaClid,
                        iid: convivaIid
                    };
                    var data = null;
                    try {
                        data = JSON.stringify(configToSave);
                    }
                    catch (e) {
                        return undefined;
                    }
                    // console.log(
                    //   'writing to the storage: ' + convivaConfigStorageSpace + '.' + convivaConfigStorageKey + ', value: ' + data
                    // );
                    return localStorageAlias.setItem(convivaConfigStorageSpace + '.' + convivaConfigStorageKey, data);
                }
                catch (e) {
                    return undefined;
                }
            }
            // call this once to generate the clid and save to the local storage
            function generateClid() {
                try {
                    var MAX_ID = 2147483647;
                    var clid = Math.floor(Math.random() * MAX_ID).toString() +
                        '.' +
                        Math.floor(Math.random() * MAX_ID).toString() +
                        '.' +
                        Math.floor(Math.random() * MAX_ID).toString() +
                        '.' +
                        Math.floor(Math.random() * MAX_ID).toString();
                    return clid;
                }
                catch (err) {
                    console.warn(err);
                    return undefined;
                }
            }
            // generate iid as a random number
            function generateIid() {
                try {
                    var MAX_ID = 2147483647;
                    var iid = Math.floor(Math.random() * MAX_ID);
                    return iid;
                }
                catch (err) {
                    console.warn(err);
                    return -1;
                }
            }
            function getBrowserDataPlugin() {
                var anonymizeOr = function (value) { return (configAnonymousTracking ? null : value); };
                var anonymizeSessionOr = function (value) {
                    return configAnonymousSessionTracking ? value : anonymizeOr(value);
                };
                return {
                    beforeTrack: function (payloadBuilder) {
                        var ses = getSnowplowCookieValue('ses'), idCookie = loadDomainUserIdCookie();
                        if (configOptOutCookie) {
                            toOptoutByCookie = !!cookie(configOptOutCookie);
                        }
                        else {
                            toOptoutByCookie = false;
                        }
                        if (configDoNotTrack || toOptoutByCookie) {
                            clearUserDataAndCookies();
                            return;
                        }
                        // If cookies are enabled, base visit count and session ID on the cookies
                        if (cookiesEnabledInIdCookie(idCookie)) {
                            // New session?
                            if (!ses && configStateStorageStrategy != 'none') {
                                memorizedSessionId = startNewIdCookieSession(idCookie);
                            }
                            else {
                                memorizedSessionId = sessionIdFromIdCookie(idCookie);
                            }
                            memorizedVisitCount = visitCountFromIdCookie(idCookie);
                        }
                        else if (new Date().getTime() - lastEventTime > configSessionCookieTimeout * 1000) {
                            memorizedVisitCount++;
                            memorizedSessionId = startNewIdCookieSession(idCookie, memorizedVisitCount);
                        }
                        // Update cookie
                        updateNowTsInIdCookie(idCookie);
                        updateFirstEventInIdCookie(idCookie, payloadBuilder);
                        incrementEventIndexInIdCookie(idCookie);
                        payloadBuilder.add('vp', detectViewport());
                        payloadBuilder.add('ds', detectDocumentSize());
                        payloadBuilder.add('vid', anonymizeSessionOr(memorizedVisitCount));
                        payloadBuilder.add('sid', anonymizeSessionOr(memorizedSessionId));
                        payloadBuilder.add('duid', anonymizeOr(domainUserIdFromIdCookie(idCookie))); // Always load from cookie as this is better ettiquette than in-memory values
                        payloadBuilder.add('uid', anonymizeOr(businessUserId));
                        refreshUrl();
                        payloadBuilder.add('refr', purify(customReferrer || configReferrerUrl));
                        if (document) {
                            payloadBuilder.add('page', document.title);
                        }
                        // Add the page URL last as it may take us over the IE limit (and we don't always need it)
                        payloadBuilder.add('url', purify(configCustomUrl || locationHrefAlias));
                        if (configSessionContext && !configAnonymousSessionTracking && !configAnonymousTracking) {
                            addSessionContextToPayload(payloadBuilder, clientSessionFromIdCookie(idCookie, configStateStorageStrategy));
                        }
                        // Update cookies
                        if (configStateStorageStrategy != 'none') {
                            setDomainUserIdCookie(idCookie);
                            setSessionCookie();
                        }
                        lastEventTime = new Date().getTime();
                    }
                };
            }
            function addSessionContextToPayload(payloadBuilder, clientSession) {
                var sessionContext = {
                    schema: 'iglu:com.snowplowanalytics.snowplow/client_session/jsonschema/1-0-2',
                    data: clientSession
                };
                payloadBuilder.addContextEntity(sessionContext);
            }
            /**
             * Expires current session and starts a new session.
             */
            function newSession() {
                // If cookies are enabled, base visit count and session ID on the cookies
                var idCookie = loadDomainUserIdCookie();
                // When cookies are enabled
                if (cookiesEnabledInIdCookie(idCookie)) {
                    // When cookie/local storage is enabled - make a new session
                    if (configStateStorageStrategy != 'none') {
                        memorizedSessionId = startNewIdCookieSession(idCookie);
                    }
                    else {
                        memorizedSessionId = sessionIdFromIdCookie(idCookie);
                    }
                    memorizedVisitCount = visitCountFromIdCookie(idCookie);
                    // Create a new session cookie
                    setSessionCookie();
                }
                else {
                    memorizedVisitCount++;
                    memorizedSessionId = startNewIdCookieSession(idCookie, memorizedVisitCount);
                }
                updateNowTsInIdCookie(idCookie);
                // Update cookies
                if (configStateStorageStrategy != 'none') {
                    setDomainUserIdCookie(idCookie);
                    setSessionCookie();
                }
                lastEventTime = new Date().getTime();
            }
            /**
             * Combine an array of unchanging contexts with the result of a context-creating function
             *
             * @param staticContexts - Array of custom contexts
             * @param contextCallback - Function returning an array of contexts
             */
            function finalizeContexts(staticContexts, contextCallback) {
                return (staticContexts || []).concat(contextCallback ? contextCallback() : []);
            }
            var isJson = function (str) {
                try {
                    var y = JSON.parse(str);
                    return typeof y === 'object';
                }
                catch (e) {
                    return false;
                }
            };
            function saveCustomTags(tags) {
                try {
                    var tagsKeys = Object.keys(tags);
                    if (isJson(JSON.stringify(tags))) {
                        // Traverse through tags set by API for keys
                        // Replace existing key if found, or else add key-value pair to object
                        tagsKeys.forEach(function (tagKey) {
                            if (tagKey !== '') {
                                Object.defineProperty(convivaCustomTags, tagKey, {
                                    value: '' + tags[tagKey],
                                    writable: true,
                                    enumerable: true,
                                    configurable: true
                                });
                            }
                        });
                    }
                    else {
                        console.warn('Conviva AppTracker:: Invalid format used for setCustomTags API');
                    }
                }
                catch (e) {
                    console.warn('Conviva AppTracker:: Failed to set Custom tags. Check format of data set.');
                }
            }
            function deleteCustomTags(tags) {
                try {
                    // Assuming 'tags' is an array of strings with keys to be deleted
                    // Traverse through tags set by API for keys
                    // Delete entry if key is found
                    tags.forEach(function (tagKey) {
                        delete convivaCustomTags[tagKey];
                    });
                }
                catch (e) {
                    console.warn('Conviva AppTracker:: Failed to unset Custom tag(s). Check format of keys set.');
                }
            }
            function logPageView(_a) {
                var title = _a.title, context = _a.context, timestamp = _a.timestamp, contextCallback = _a.contextCallback;
                refreshUrl();
                if (pageViewSent) {
                    // Do not reset pageViewId if previous events were not page_view
                    resetPageView();
                }
                pageViewSent = true;
                // So we know what document.title was at the time of trackPageView
                lastDocumentTitle = document.title;
                lastConfigTitle = title;
                // Fixup page title
                var pageTitle = fixupTitle(lastConfigTitle || lastDocumentTitle);
                // Log page view
                core.track(buildPageView({
                    pageUrl: purify(configCustomUrl || locationHrefAlias),
                    pageTitle: pageTitle,
                    referrer: purify(customReferrer || configReferrerUrl)
                }), finalizeContexts(context, contextCallback), timestamp);
                // Send ping (to log that user has stayed on page)
                var now = new Date();
                var installingActivityTracking = false;
                if (activityTrackingConfig.enabled && !activityTrackingConfig.installed) {
                    activityTrackingConfig.installed = true;
                    installingActivityTracking = true;
                    // Add mousewheel event handler, detect passive event listeners for performance
                    var detectPassiveEvents_1 = {
                        update: function update() {
                            if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
                                var passive_1 = false;
                                var options = Object.defineProperty({}, 'passive', {
                                    get: function get() {
                                        passive_1 = true;
                                    },
                                    set: function set() { }
                                });
                                // note: have to set and remove a no-op listener instead of null
                                // (which was used previously), becasue Edge v15 throws an error
                                // when providing a null callback.
                                // https://github.com/rafrex/detect-passive-events/pull/3
                                var noop = function noop() { };
                                window.addEventListener('testPassiveEventSupport', noop, options);
                                window.removeEventListener('testPassiveEventSupport', noop, options);
                                detectPassiveEvents_1.hasSupport = passive_1;
                            }
                        }
                    };
                    detectPassiveEvents_1.update();
                    // Detect available wheel event
                    var wheelEvent = 'onwheel' in document.createElement('div')
                        ? 'wheel' // Modern browsers support "wheel"
                        : document.onmousewheel !== undefined
                            ? 'mousewheel' // Webkit and IE support at least "mousewheel"
                            : 'DOMMouseScroll'; // let's assume that remaining browsers are older Firefox
                    if (Object.prototype.hasOwnProperty.call(detectPassiveEvents_1, 'hasSupport')) {
                        addEventListener(document, wheelEvent, activityHandler, { passive: true });
                    }
                    else {
                        addEventListener(document, wheelEvent, activityHandler);
                    }
                    // Capture our initial scroll points
                    resetMaxScrolls();
                    // Add event handlers; cross-browser compatibility here varies significantly
                    // @see http://quirksmode.org/dom/events
                    var documentHandlers = ['click', 'mouseup', 'mousedown', 'mousemove', 'keypress', 'keydown', 'keyup'];
                    var windowHandlers = ['resize', 'focus', 'blur'];
                    var listener = function (_, handler) {
                        if (handler === void 0) { handler = activityHandler; }
                        return function (ev) {
                            return addEventListener(document, ev, handler);
                        };
                    };
                    documentHandlers.forEach(listener(document));
                    windowHandlers.forEach(listener(window));
                    listener(window, scrollHandler)('scroll');
                }
                if (activityTrackingConfig.enabled && (resetActivityTrackingOnPageView || installingActivityTracking)) {
                    // Periodic check for activity.
                    lastActivityTime = now.getTime();
                    var key = void 0;
                    for (key in activityTrackingConfig.configurations) {
                        var config = activityTrackingConfig.configurations[key];
                        if (config) {
                            //Clear page ping heartbeat on new page view
                            window.clearInterval(config.activityInterval);
                            activityInterval(config, context, contextCallback);
                        }
                    }
                }
            }
            function activityInterval(config, context, contextCallback) {
                var executePagePing = function (cb, c) {
                    refreshUrl();
                    var convivaConfiguration = tracker.core.getConfig();
                    if (convivaConfiguration.enablePeriodicHeartbeat) {
                        if (convivaConfiguration.periodicHeartbeatInterval != undefined) {
                            var convivaInterval = convivaConfiguration.periodicHeartbeatInterval * 1000;
                            if (convivaInterval != config.configHeartBeatTimer) {
                                window.clearInterval(config.activityInterval);
                                config.activityInterval = window.setInterval(heartbeat, convivaInterval);
                            }
                        }
                    }
                    else {
                        window.clearInterval(config.activityInterval);
                    }
                    cb({ context: c, pageViewId: getPageViewId(), minXOffset: minXOffset, minYOffset: minYOffset, maxXOffset: maxXOffset, maxYOffset: maxYOffset });
                    resetMaxScrolls();
                };
                var previousPagePing = new Date();
                var pingConviva = function () {
                    executePagePing(config.callback, finalizeContexts(context, contextCallback));
                };
                window.setTimeout(pingConviva, 2000);
                var heartbeat = function () {
                    var now = new Date();
                    // There was activity during the heart beat period;
                    // on average, this is going to overstate the visitDuration by configHeartBeatTimer/2
                    if (previousPagePing.getTime() + config.configHeartBeatTimer > now.getTime() ||
                        lastActivityTime + config.configHeartBeatTimer > now.getTime()) {
                        previousPagePing = now;
                        executePagePing(config.callback, finalizeContexts(context, contextCallback));
                    }
                };
                config.activityInterval = window.setInterval(heartbeat, config.configHeartBeatTimer);
            }
            /**
             * Configure the activity tracking and ensures integer values for min visit and heartbeat
             */
            function configureActivityTracking(configuration) {
                var minimumVisitLength = configuration.minimumVisitLength, heartbeatDelay = configuration.heartbeatDelay, callback = configuration.callback;
                if (isInteger(minimumVisitLength) && isInteger(heartbeatDelay)) {
                    return {
                        configMinimumVisitLength: minimumVisitLength * 1000,
                        configHeartBeatTimer: heartbeatDelay * 1000,
                        callback: callback
                    };
                }
                LOG.error('Activity tracking minimumVisitLength & heartbeatDelay must be integers');
                return undefined;
            }
            /**
             * Log that a user is still viewing a given page by sending a page ping.
             * Not part of the public API - only called from logPageView() above.
             */
            function logPagePing(_a) {
                var context = _a.context, minXOffset = _a.minXOffset, minYOffset = _a.minYOffset, maxXOffset = _a.maxXOffset, maxYOffset = _a.maxYOffset;
                var newDocumentTitle = document.title;
                if (newDocumentTitle !== lastDocumentTitle) {
                    lastDocumentTitle = newDocumentTitle;
                    lastConfigTitle = undefined;
                }
                core.track(buildPagePing({
                    pageUrl: purify(configCustomUrl || locationHrefAlias),
                    pageTitle: fixupTitle(lastConfigTitle || lastDocumentTitle),
                    referrer: purify(customReferrer || configReferrerUrl),
                    minXOffset: cleanOffset(minXOffset),
                    maxXOffset: cleanOffset(maxXOffset),
                    minYOffset: cleanOffset(minYOffset),
                    maxYOffset: cleanOffset(maxYOffset)
                }), context);
            }
            var apiMethods = {
                getDomainSessionIndex: function () {
                    return memorizedVisitCount;
                },
                getPageViewId: function () {
                    return getPageViewId();
                },
                newSession: newSession,
                getCookieName: function (basename) {
                    return getSnowplowCookieName(basename);
                },
                getUserId: function () {
                    return businessUserId;
                },
                getDomainUserId: function () {
                    return loadDomainUserIdCookie()[1];
                },
                getDomainUserInfo: function () {
                    return loadDomainUserIdCookie();
                },
                setReferrerUrl: function (url) {
                    customReferrer = url;
                },
                setCustomUrl: function (url) {
                    refreshUrl();
                    configCustomUrl = resolveRelativeReference(locationHrefAlias, url);
                },
                setDocumentTitle: function (title) {
                    // So we know what document.title was at the time of trackPageView
                    lastDocumentTitle = document.title;
                    lastConfigTitle = title;
                },
                discardHashTag: function (enableFilter) {
                    configDiscardHashTag = enableFilter;
                },
                discardBrace: function (enableFilter) {
                    configDiscardBrace = enableFilter;
                },
                setCookiePath: function (path) {
                    configCookiePath = path;
                    updateDomainHash();
                },
                setVisitorCookieTimeout: function (timeout) {
                    configVisitorCookieTimeout = timeout;
                },
                crossDomainLinker: function (crossDomainLinkerCriterion) {
                    decorateLinks(crossDomainLinkerCriterion);
                },
                enableActivityTracking: function (configuration) {
                    if (!activityTrackingConfig.configurations.pagePing) {
                        activityTrackingConfig.enabled = true;
                        activityTrackingConfig.configurations.pagePing = configureActivityTracking(__assign(__assign({}, configuration), { callback: logPagePing }));
                    }
                },
                enableActivityTrackingCallback: function (configuration) {
                    if (!activityTrackingConfig.configurations.callback) {
                        activityTrackingConfig.enabled = true;
                        activityTrackingConfig.configurations.callback = configureActivityTracking(configuration);
                    }
                },
                updatePageActivity: function () {
                    activityHandler();
                },
                setOptOutCookie: function (name) {
                    configOptOutCookie = name;
                },
                setUserId: function (userId) {
                    businessUserId = userId;
                },
                setUserIdFromLocation: function (querystringField) {
                    refreshUrl();
                    businessUserId = fromQuerystring(querystringField, locationHrefAlias);
                },
                setUserIdFromReferrer: function (querystringField) {
                    refreshUrl();
                    businessUserId = fromQuerystring(querystringField, configReferrerUrl);
                },
                setUserIdFromCookie: function (cookieName) {
                    businessUserId = cookie(cookieName);
                },
                setCollectorUrl: function (collectorUrl) {
                    configCollectorUrl = asCollectorUrl(collectorUrl);
                    outQueue.setCollectorUrl(configCollectorUrl);
                },
                setBufferSize: function (newBufferSize) {
                    outQueue.setBufferSize(newBufferSize);
                },
                flushBuffer: function (configuration) {
                    if (configuration === void 0) { configuration = {}; }
                    outQueue.executeQueue();
                    if (configuration.newBufferSize) {
                        outQueue.setBufferSize(configuration.newBufferSize);
                    }
                },
                trackPageView: function (event) {
                    if (event === void 0) { event = {}; }
                    logPageView(event);
                },
                trackVideoEvent: function (event) {
                    if (event === void 0) { event = {}; }
                    try {
                        var convivaConfig = this.core.getConfig();
                        if (event.name == '' || event.name == undefined) {
                            console.warn('Conviva App Tracker:: Video event could not be tracked due to missing name property!!');
                        }
                        if (convivaConfig.convivaVideoEventTrackingConfiguration != undefined) {
                            if (convivaConfig.convivaVideoEventTrackingConfiguration.blocklist != undefined &&
                                convivaConfig.convivaVideoEventTrackingConfiguration.blocklist.length > 0) {
                                var blocklist = convivaConfig.convivaVideoEventTrackingConfiguration.blocklist;
                                if (blocklist.indexOf('*') == -1) {
                                    if (blocklist.indexOf('' + event.name) == -1) {
                                        this.core.track(buildConvivaVideoEvent({
                                            name: event.name,
                                            sid: event.sid,
                                            iid: event.iid,
                                            clid: event.clid,
                                            st: event.st,
                                            sst: event.sst,
                                            an: event.an,
                                            cl: event.cl,
                                            lv: event.lv,
                                            pn: event.pn,
                                            vid: event.vid,
                                            fw: event.fw,
                                            fwv: event.fwv,
                                            mn: event.mn,
                                            mv: event.mv,
                                            url: event.url,
                                            tags: event.tags,
                                            cen: event.cen,
                                            ced: event.ced,
                                            oldsc: event.old,
                                            newsc: event["new"],
                                            err: event.err,
                                            br: event.br,
                                            ft: event.ft
                                        }), event.context, event.timestamp);
                                    }
                                }
                            }
                            else {
                                this.core.track(buildConvivaVideoEvent({
                                    name: event.name,
                                    sid: event.sid,
                                    iid: event.iid,
                                    clid: event.clid,
                                    st: event.st,
                                    sst: event.sst,
                                    an: event.an,
                                    cl: event.cl,
                                    lv: event.lv,
                                    pn: event.pn,
                                    vid: event.vid,
                                    fw: event.fw,
                                    fwv: event.fwv,
                                    mn: event.mn,
                                    mv: event.mv,
                                    url: event.url,
                                    tags: event.tags,
                                    cen: event.cen,
                                    ced: event.ced,
                                    oldsc: event.old,
                                    newsc: event["new"],
                                    err: event.err,
                                    br: event.br,
                                    ft: event.ft
                                }), event.context, event.timestamp);
                            }
                        }
                        else {
                            this.core.track(buildConvivaVideoEvent({
                                name: event.name,
                                sid: event.sid,
                                iid: event.iid,
                                clid: event.clid,
                                st: event.st,
                                sst: event.sst,
                                an: event.an,
                                cl: event.cl,
                                lv: event.lv,
                                pn: event.pn,
                                vid: event.vid,
                                fw: event.fw,
                                fwv: event.fwv,
                                mn: event.mn,
                                mv: event.mv,
                                url: event.url,
                                tags: event.tags,
                                cen: event.cen,
                                ced: event.ced,
                                oldsc: event.old,
                                newsc: event["new"],
                                err: event.err,
                                br: event.br,
                                ft: event.ft
                            }), event.context, event.timestamp);
                        }
                    }
                    catch (e) {
                        console.warn('Conviva App Tracker:: Video event could not be tracked due to an exception!!', e);
                    }
                },
                trackAjaxEvent: function (event) {
                    if (event === void 0) { event = {}; }
                    try {
                        if (event.initiatorType === 'xmlhttprequest') {
                            var convivaConfig = this.core.getConfig();
                            if (event.name == '' || event.name == undefined) {
                                console.warn('Conviva App Tracker:: Ajax request could not be tracked due to missing URL property!!');
                            }
                            else {
                                // Track requests that are not conviva.com HBs /wsg & /ctp
                                if (event.name.indexOf('conviva.com') == -1) {
                                    // Check configuration for blocked strings / domains in URL
                                    if (convivaConfig.ajaxTrackingConfiguration != undefined) {
                                        if (convivaConfig.ajaxTrackingConfiguration.blocklist != undefined &&
                                            convivaConfig.ajaxTrackingConfiguration.blocklist.length > 0) {
                                            var blocklist = convivaConfig.ajaxTrackingConfiguration.blocklist;
                                            if (blocklist.indexOf('*') == -1) {
                                                var blocked = false;
                                                // Check if URL contains any of blacklisted strings
                                                for (var i = 0; i < blocklist.length; i++) {
                                                    if (event.name.indexOf(blocklist[i]) !== -1) {
                                                        blocked = true;
                                                    }
                                                }
                                                if (!blocked) {
                                                    this.core.track(buildAjaxEvent({
                                                        targetUrl: event.name,
                                                        webResourceTiming: event
                                                    }), event.context, event.timestamp);
                                                }
                                            }
                                        }
                                        else {
                                            this.core.track(buildAjaxEvent({
                                                targetUrl: event.name,
                                                webResourceTiming: event
                                            }), event.context, event.timestamp);
                                        }
                                    }
                                    else {
                                        this.core.track(buildAjaxEvent({
                                            targetUrl: event.name,
                                            webResourceTiming: event
                                        }), event.context, event.timestamp);
                                    }
                                }
                            }
                        }
                    }
                    catch (e) {
                        console.warn('Conviva App Tracker:: Ajax request could not be tracked due an exception!!', e);
                    }
                },
                setCustomTags: function (event) {
                    if (event === void 0) { event = {}; }
                    saveCustomTags(event);
                },
                unsetCustomTags: function (event) {
                    if (event === void 0) { event = {}; }
                    deleteCustomTags(event);
                },
                preservePageViewId: function () {
                    preservePageViewId = true;
                },
                disableAnonymousTracking: function (configuration) {
                    trackerConfiguration.anonymousTracking = false;
                    toggleAnonymousTracking(configuration);
                    initializeIdsAndCookies();
                    outQueue.executeQueue(); // There might be some events in the queue we've been unable to send in anonymous mode
                },
                enableAnonymousTracking: function (configuration) {
                    var _a;
                    trackerConfiguration.anonymousTracking = (_a = (configuration && (configuration === null || configuration === void 0 ? void 0 : configuration.options))) !== null && _a !== void 0 ? _a : true;
                    toggleAnonymousTracking(configuration);
                    // Reset the page view, if not tracking the session, so can't stitch user into new events on the page view id
                    if (!configAnonymousSessionTracking) {
                        resetPageView();
                    }
                },
                clearUserData: clearUserDataAndCookies
            };
            return __assign(__assign({}, apiMethods), { id: trackerId, namespace: namespace, core: core, sharedState: state });
        };
        function updateRemoteConfig(config) {
            var coreConfig = {
                base64: true,
                linkClickTracking: true,
                buttonClickTracking: true,
                customEvent: true,
                exceptionAutotracking: true,
                enablePeriodicHeartbeat: true,
                periodicHeartbeatInterval: 40,
                customEventTrackingConfiguration: {},
                convivaVideoEventTrackingConfiguration: {},
                ajaxTrackingConfiguration: {}
            };
            coreConfig.base64 = config.configurationBundle[0].trackerConfiguration.base64Encoding;
            coreConfig.linkClickTracking = config.configurationBundle[0].trackerConfiguration.linkClickTracking;
            coreConfig.buttonClickTracking = config.configurationBundle[0].trackerConfiguration.buttonClickTracking;
            coreConfig.customEvent = config.configurationBundle[0].trackerConfiguration.customEvent;
            coreConfig.exceptionAutotracking = config.configurationBundle[0].trackerConfiguration.exceptionAutotracking;
            coreConfig.enablePeriodicHeartbeat = config.configurationBundle[0].trackerConfiguration.enablePeriodicHeartbeat;
            coreConfig.periodicHeartbeatInterval = config.configurationBundle[0].trackerConfiguration.periodicHeartbeatInterval;
            coreConfig.customEventTrackingConfiguration = config.configurationBundle[0].customEventTrackingConfiguration;
            coreConfig.convivaVideoEventTrackingConfiguration =
                config.configurationBundle[0].convivaVideoEventTrackingConfiguration;
            coreConfig.ajaxTrackingConfiguration = config.configurationBundle[0].ajaxTrackingConfiguration;
            tracker.setCollectorUrl(config.configurationBundle[0].networkConfiguration.endpoint);
            if (window.localStorage) {
                localStorage.setItem('ConvivaRemoteConfig', JSON.stringify(coreConfig));
                localStorage.setItem('ConvivaEndpoint', config.configurationBundle[0].networkConfiguration.endpoint);
            }
            tracker.core.setConfig(coreConfig);
        }
        // Initialise the tracker
        var partialTracker = newTracker(trackerId, namespace, version, endpoint, sharedState, trackerConfiguration), tracker = __assign(__assign({}, partialTracker), { addPlugin: function (configuration) {
                var _a, _b;
                tracker.core.addPlugin(configuration);
                (_b = (_a = configuration.plugin).activateBrowserPlugin) === null || _b === void 0 ? void 0 : _b.call(_a, tracker);
            } });
        // Initialise each plugin with the tracker
        browserPlugins.forEach(function (p) {
            var _a;
            (_a = p.activateBrowserPlugin) === null || _a === void 0 ? void 0 : _a.call(p, tracker);
        });
        return tracker;
    }

    /*
     * Copyright (c) 2022 Snowplow Analytics Ltd, 2010 Anthon Pang
     * All rights reserved.
     *
     * Redistribution and use in source and binary forms, with or without
     * modification, are permitted provided that the following conditions are met:
     *
     * 1. Redistributions of source code must retain the above copyright notice, this
     *    list of conditions and the following disclaimer.
     *
     * 2. Redistributions in binary form must reproduce the above copyright notice,
     *    this list of conditions and the following disclaimer in the documentation
     *    and/or other materials provided with the distribution.
     *
     * 3. Neither the name of the copyright holder nor the names of its
     *    contributors may be used to endorse or promote products derived from
     *    this software without specific prior written permission.
     *
     * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
     * AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
     * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
     * DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE
     * FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
     * DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
     * SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
     * CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
     * OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
     * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
     */
    var namedTrackers = {};
    /**
     * Dispatch function to all specified trackers
     *
     * @param trackers - An optional list of trackers to send the event to, or will send to all trackers
     * @param fn - The function which will run against each tracker
     */
    function dispatchToTrackers(trackers, fn) {
        try {
            getTrackers(trackers !== null && trackers !== void 0 ? trackers : allTrackerNames()).forEach(fn);
        }
        catch (ex) {
            LOG.error('Function failed', ex);
        }
    }
    /**
     * Creates a Tracker and adds it to the internal collection
     * @param trackerId - The unique identifier of the tracker
     * @param namespace - The namespace of the tracker, tracked with each event as `tna`
     * @param version - The current version of the tracker library
     * @param endpoint - The endpoint to send events to
     * @param sharedState - The instance of shared state to use for this tracker
     * @param configuration - The configuration to use for this tracker instance
     */
    function addTracker(trackerId, namespace, version, endpoint, sharedState, configuration) {
        if (!namedTrackers.hasOwnProperty(trackerId)) {
            namedTrackers[trackerId] = Tracker(trackerId, namespace, version, endpoint, sharedState, configuration);
            return namedTrackers[trackerId];
        }
        return null;
    }
    /**
     * Gets an array of tracker instances based on the list of identifiers
     * @param trackerIds - An array of unique identifiers of the trackers
     * @returns The tracker instances, or empty list if none found
     */
    function getTrackers(trackerIds) {
        return getTrackersFromCollection(trackerIds, namedTrackers);
    }
    /**
     * Returns all the unique tracker identifiers
     */
    function allTrackerNames() {
        return Object.keys(namedTrackers);
    }
    function getTrackersFromCollection(trackerIds, trackerCollection) {
        var trackers = [];
        for (var _i = 0, trackerIds_1 = trackerIds; _i < trackerIds_1.length; _i++) {
            var id = trackerIds_1[_i];
            if (trackerCollection.hasOwnProperty(id)) {
                trackers.push(trackerCollection[id]);
            }
            else {
                LOG.warn(id + ' not configured');
            }
        }
        return trackers;
    }

    /*
     * Copyright (c) 2022 Snowplow Analytics Ltd, 2010 Anthon Pang
     * All rights reserved.
     *
     * Redistribution and use in source and binary forms, with or without
     * modification, are permitted provided that the following conditions are met:
     *
     * 1. Redistributions of source code must retain the above copyright notice, this
     *    list of conditions and the following disclaimer.
     *
     * 2. Redistributions in binary form must reproduce the above copyright notice,
     *    this list of conditions and the following disclaimer in the documentation
     *    and/or other materials provided with the distribution.
     *
     * 3. Neither the name of the copyright holder nor the names of its
     *    contributors may be used to endorse or promote products derived from
     *    this software without specific prior written permission.
     *
     * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
     * AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
     * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
     * DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE
     * FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
     * DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
     * SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
     * CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
     * OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
     * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
     */
    /**
     * A set of variables which are shared among all initialised trackers
     */
    var SharedState = /** @class */ (function () {
        function SharedState() {
            /* List of request queues - one per Tracker instance */
            this.outQueues = [];
            this.bufferFlushers = [];
            /* DOM Ready */
            this.hasLoaded = false;
            this.registeredOnLoadHandlers = [];
        }
        return SharedState;
    }());
    function createSharedState() {
        var sharedState = new SharedState(), documentAlias = document, windowAlias = window;
        /*
         * Handle page visibility event
         * Works everywhere except IE9
         */
        function visibilityChangeHandler() {
            if (documentAlias.visibilityState == 'hidden') {
                // Flush all POST queues
                sharedState.bufferFlushers.forEach(function (flusher) {
                    flusher(false);
                });
            }
        }
        function flushBuffers() {
            // Flush all POST queues
            sharedState.bufferFlushers.forEach(function (flusher) {
                flusher(false);
            });
        }
        /*
         * Handler for onload event
         */
        function loadHandler() {
            var i;
            if (!sharedState.hasLoaded) {
                sharedState.hasLoaded = true;
                for (i = 0; i < sharedState.registeredOnLoadHandlers.length; i++) {
                    sharedState.registeredOnLoadHandlers[i]();
                }
            }
            return true;
        }
        /*
         * Add onload or DOM ready handler
         */
        function addReadyListener() {
            if (documentAlias.addEventListener) {
                documentAlias.addEventListener('DOMContentLoaded', function ready() {
                    documentAlias.removeEventListener('DOMContentLoaded', ready, false);
                    loadHandler();
                });
            }
            else if (documentAlias.attachEvent) {
                documentAlias.attachEvent('onreadystatechange', function ready() {
                    if (documentAlias.readyState === 'complete') {
                        documentAlias.detachEvent('onreadystatechange', ready);
                        loadHandler();
                    }
                });
            }
            // fallback
            addEventListener(windowAlias, 'load', loadHandler, false);
        }
        /************************************************************
         * Constructor
         ************************************************************/
        // initialize the Snowplow singleton
        if (documentAlias.visibilityState) {
            // Flush for mobile and modern browsers
            addEventListener(documentAlias, 'visibilitychange', visibilityChangeHandler, false);
        }
        // Last attempt at flushing in beforeunload
        addEventListener(windowAlias, 'beforeunload', flushBuffers, false);
        if (document.readyState === 'loading') {
            addReadyListener();
        }
        else {
            loadHandler();
        }
        return sharedState;
    }

    /*
     * Copyright (c) 2022 Snowplow Analytics Ltd, 2010 Anthon Pang
     * All rights reserved.
     *
     * Redistribution and use in source and binary forms, with or without
     * modification, are permitted provided that the following conditions are met:
     *
     * 1. Redistributions of source code must retain the above copyright notice, this
     *    list of conditions and the following disclaimer.
     *
     * 2. Redistributions in binary form must reproduce the above copyright notice,
     *    this list of conditions and the following disclaimer in the documentation
     *    and/or other materials provided with the distribution.
     *
     * 3. Neither the name of the copyright holder nor the names of its
     *    contributors may be used to endorse or promote products derived from
     *    this software without specific prior written permission.
     *
     * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
     * AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
     * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
     * DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE
     * FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
     * DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
     * SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
     * CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
     * OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
     * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
     */
    /**
     * Expires current session and starts a new session.
     *
     * @param trackers - The tracker identifiers which will have their session refreshed
     */
    function newSession(trackers) {
        dispatchToTrackers(trackers, function (t) {
            t.newSession();
        });
    }
    /**
     * Override referrer
     *
     * @param url - Custom Referrer which will be used as override
     * @param trackers - The tracker identifiers which will be configured
     */
    function setReferrerUrl(url, trackers) {
        dispatchToTrackers(trackers, function (t) {
            t.setReferrerUrl(url);
        });
    }
    /**
     * Override url
     *
     * @param url - Custom URL which will be used as override
     * @param trackers - The tracker identifiers which will be configured
     */
    function setCustomUrl(url, trackers) {
        dispatchToTrackers(trackers, function (t) {
            t.setCustomUrl(url);
        });
    }
    /**
     * Override document.title
     *
     * @param title - Document title which will be used as override
     * @param trackers - The tracker identifiers which will be configured
     */
    function setDocumentTitle(title, trackers) {
        dispatchToTrackers(trackers, function (t) {
            t.setDocumentTitle(title);
        });
    }
    /**
     * Strip hash tag (or anchor) from URL
     *
     * @param enable - Whether to enable stripping of hash
     * @param trackers - The tracker identifiers which will be configured
     */
    function discardHashTag(enable, trackers) {
        dispatchToTrackers(trackers, function (t) {
            t.discardHashTag(enable);
        });
    }
    /**
     * Strip braces from URL
     *
     * @param enable - Whther to enable stripping of braces
     * @param trackers - The tracker identifiers which will be configured
     */
    function discardBrace(enable, trackers) {
        dispatchToTrackers(trackers, function (t) {
            t.discardBrace(enable);
        });
    }
    /**
     * Set first-party cookie path
     *
     * @param path - The path which will be used when setting cookies
     * @param trackers - The tracker identifiers which will be configured
     */
    function setCookiePath(path, trackers) {
        dispatchToTrackers(trackers, function (t) {
            t.setCookiePath(path);
        });
    }
    /**
     * Set visitor cookie timeout (in seconds)
     *
     * @param timeout - The timeout until cookies will expire
     * @param trackers - The tracker identifiers which will be configured
     */
    function setVisitorCookieTimeout(timeout, trackers) {
        dispatchToTrackers(trackers, function (t) {
            t.setVisitorCookieTimeout(timeout);
        });
    }
    /**
     * Enable querystring decoration for links pasing a filter
     *
     * @param crossDomainLinker - Function used to determine which links to decorate
     * @param trackers - The tracker identifiers which will be configured
     */
    function crossDomainLinker(crossDomainLinkerCriterion, trackers) {
        dispatchToTrackers(trackers, function (t) {
            t.crossDomainLinker(crossDomainLinkerCriterion);
        });
    }
    /**
     * Enables page activity tracking (sends page pings to the Collector regularly).
     *
     * @param configuration - The activity tracking configuration
     * @param trackers - The tracker identifiers which will be configured
     */
    function enableActivityTracking(configuration, trackers) {
        dispatchToTrackers(trackers, function (t) {
            t.enableActivityTracking(configuration);
        });
    }
    /**
     * Enables page activity tracking (replaces collector ping with callback).
     *
     * @param configuration - The activity tracking callback configuration
     * @param trackers - The tracker identifiers which will be configured
     */
    function enableActivityTrackingCallback(configuration, trackers) {
        dispatchToTrackers(trackers, function (t) {
            t.enableActivityTrackingCallback(configuration);
        });
    }
    /**
     * Triggers the activityHandler manually to allow external user defined activity. i.e. While watching a video
     *
     * @param trackers - The tracker identifiers which will be updated
     */
    function updatePageActivity(trackers) {
        dispatchToTrackers(trackers, function (t) {
            t.updatePageActivity();
        });
    }
    /**
     * Sets the opt out cookie.
     *
     * @param name - of the opt out cookie
     * @param trackers - The tracker identifiers which will be configured
     */
    function setOptOutCookie(name, trackers) {
        dispatchToTrackers(trackers, function (t) {
            t.setOptOutCookie(name);
        });
    }
    /**
     * Set the business-defined user ID for this user.
     *
     * @param userId - The business-defined user ID
     * @param trackers - The tracker identifiers which will be configured
     */
    function setUserId(userId, trackers) {
        dispatchToTrackers(trackers, function (t) {
            t.setUserId(userId);
        });
    }
    /**
     * Set the business-defined user ID for this user using the location querystring.
     *
     * @param querystringField - Name of a querystring name-value pair
     * @param trackers - The tracker identifiers which will be configured
     */
    function setUserIdFromLocation(querystringField, trackers) {
        dispatchToTrackers(trackers, function (t) {
            t.setUserIdFromLocation(querystringField);
        });
    }
    /**
     * Set the business-defined user ID for this user using the referrer querystring.
     *
     * @param querystringField - Name of a querystring name-value pair
     * @param trackers - The tracker identifiers which will be configured
     */
    function setUserIdFromReferrer(querystringField, trackers) {
        dispatchToTrackers(trackers, function (t) {
            t.setUserIdFromReferrer(querystringField);
        });
    }
    /**
     * Set the business-defined user ID for this user to the value of a cookie.
     *
     * @param cookieName - Name of the cookie whose value will be assigned to businessUserId
     * @param trackers - The tracker identifiers which will be configured
     */
    function setUserIdFromCookie(cookieName, trackers) {
        dispatchToTrackers(trackers, function (t) {
            t.setUserIdFromCookie(cookieName);
        });
    }
    /**
     * Specify the Snowplow collector URL. Specific http or https to force it
     * or leave it off to match the website protocol.
     *
     * @param collectorUrl - The collector URL, with or without protocol
     * @param trackers - The tracker identifiers which will be configured
     */
    function setCollectorUrl(collectorUrl, trackers) {
        dispatchToTrackers(trackers, function (t) {
            t.setCollectorUrl(collectorUrl);
        });
    }
    /**
     * Set the buffer size
     * Can be useful if you want to stop batching requests to ensure events start
     * sending closer to event creation
     *
     * @param newBufferSize - The value with which to update the bufferSize to
     * @param trackers - The tracker identifiers which will be flushed
     */
    function setBufferSize(newBufferSize, trackers) {
        dispatchToTrackers(trackers, function (t) {
            t.setBufferSize(newBufferSize);
        });
    }
    /**
     * Send all events in the outQueue
     * Only need to use this when sending events with a bufferSize of at least 2
     *
     * @param configuration - The configuration to use following flushing the buffer
     * @param trackers - The tracker identifiers which will be flushed
     */
    function flushBuffer(configuration, trackers) {
        dispatchToTrackers(trackers, function (t) {
            t.flushBuffer(configuration);
        });
    }
    /**
     * Track a visit to a web page
     *
     * @param event - The Page View Event properties
     * @param trackers - The tracker identifiers which the event will be sent to
     */
    function trackPageView(event, trackers) {
        dispatchToTrackers(trackers, function (t) {
            t.trackPageView(event);
        });
    }
    /**
     * Track a structured event
     * A classic style of event tracking, allows for easier movement between analytics
     * systems. A loosely typed event, creating a Self Describing event is preferred, but
     * useful for interoperability.
     *
     * @param event - The Structured Event properties
     * @param trackers - The tracker identifiers which the event will be sent to
     */
    function trackStructEvent(event, trackers) {
        dispatchToTrackers(trackers, function (t) {
            t.core.track(buildStructEvent(event), event.context, event.timestamp);
        });
    }
    /**
     * Track a Custom event
     * A classic style of event tracking, allows for easier movement between analytics
     * systems. A loosely typed event, creating a Custom event is preferred, but
     * useful for interoperability.
     *
     * @param event - The Custom Event properties
     * @param trackers - The tracker identifiers which the event will be sent to
     */
    // export function trackCustomEvent(structure: any, event: CustomEvent & CommonEventProperties, trackers?: Array<string>) :void{
    //   dispatchToTrackers(trackers, (t) => {
    //     let convivaConfig = t.core.getConfig();
    //     if(structure.name == "" || structure.name == undefined) {
    //       console.warn("custom event name is mandatory for trackCustomEvent API!!");
    //     }
    //     try {
    //       let parsedData = JSON.parse(structure.data);
    //       if(!parsedData) {
    //         console.warn("Unable to parse custom event data as JSON");
    //       }
    //     } catch(e) {
    //       console.warn("Unable to parse custom event data as JSON");
    //     }
    //     if (convivaConfig.customEventTrackingConfiguration != undefined) {
    //       if (
    //         convivaConfig.customEventTrackingConfiguration.blocklist != undefined &&
    //         convivaConfig.customEventTrackingConfiguration.blocklist.length > 0
    //       ) {
    //         let blocklist = convivaConfig.customEventTrackingConfiguration.blocklist;
    //         if (blocklist.indexOf('*') == -1) {
    //           if (blocklist.indexOf('' + structure.name) == -1) {
    //             t.core.track(
    //               buildCustomEvent({ name: structure.name, data: structure.data }),
    //               event.context,
    //               event.timestamp
    //             );
    //           }
    //         }
    //       } else {
    //         t.core.track(buildCustomEvent({ name: structure.name, data: structure.data }), event.context, event.timestamp);
    //       }
    //     } else {
    //       t.core.track(buildCustomEvent({ name: structure.name, data: structure.data }), event.context, event.timestamp);
    //     }
    //   });
    // }
    /**
     * Track a Custom event
     * A classic style of event tracking, allows for easier movement between analytics
     * systems. A loosely typed event, creating a Custom event is preferred, but
     * useful for interoperability.
     *
     * @param event - The Custom Event properties
     * @param trackers - The tracker identifiers which the event will be sent to
     */
    function trackCustomEvent(event, trackers) {
        dispatchToTrackers(trackers, function (t) {
            var convivaConfig = t.core.getConfig();
            if (event.name == '' || event.name == undefined) {
                console.warn('Conviva App Tracker:: custom event name is mandatory for trackCustomEvent API!!');
            }
            try {
                var parsedData = JSON.parse(event.data);
                if (!parsedData) {
                    console.warn('Conviva App Tracker:: Unable to parse custom event data as JSON');
                }
            }
            catch (e) {
                console.warn('Conviva App Tracker:: Unable to parse custom event data as JSON');
            }
            if (convivaConfig.customEventTrackingConfiguration != undefined) {
                if (convivaConfig.customEventTrackingConfiguration.blocklist != undefined &&
                    convivaConfig.customEventTrackingConfiguration.blocklist.length > 0) {
                    var blocklist = convivaConfig.customEventTrackingConfiguration.blocklist;
                    if (blocklist.indexOf('*') == -1) {
                        if (blocklist.indexOf('' + event.name) == -1) {
                            t.core.track(buildCustomEvent({ name: event.name, data: event.data }), event.context, event.timestamp);
                        }
                    }
                }
                else {
                    t.core.track(buildCustomEvent({ name: event.name, data: event.data }), event.context, event.timestamp);
                }
            }
            else {
                t.core.track(buildCustomEvent({ name: event.name, data: event.data }), event.context, event.timestamp);
            }
        });
    }
    /**
     * Set Custom Tags
     * A classic style of adding custom tags to HB
     *
     * @param event - The Custom Event properties
     * @param trackers - The tracker identifiers which the event will be sent to
     */
    function setCustomTags(event, trackers) {
        dispatchToTrackers(trackers, function (t) {
            try {
                t.setCustomTags(event);
            }
            catch (e) {
                console.warn('Conviva App Tracker:: Unable to set custom tags data!');
            }
        });
    }
    /**
     * Unset Custom Tags
     * A classic style of deleting custom tags to HB
     *
     * @param event - The Custom Event properties
     * @param trackers - The tracker identifiers which the event will be sent to
     */
    function unsetCustomTags(event, trackers) {
        dispatchToTrackers(trackers, function (t) {
            try {
                t.unsetCustomTags(event);
            }
            catch (e) {
                console.warn('Conviva App Tracker:: Unable to set custom tags data!');
            }
        });
    }
    /**
     * Track a self-describing event happening on this page.
     * A custom event type, allowing for an event to be tracked using your own custom schema
     * and a data object which conforms to the supplied schema
     *
     * @param event - The event information
     * @param trackers - The tracker identifiers which the event will be sent to
     */
    function trackSelfDescribingEvent(event, trackers) {
        dispatchToTrackers(trackers, function (t) {
            t.core.track(buildSelfDescribingEvent({ event: event.event }), event.context, event.timestamp);
        });
    }
    /**
     * All provided contexts will be sent with every event
     *
     * @param contexts - An array of contexts or conditional contexts
     * @param trackers - The tracker identifiers which the global contexts will be added to
     */
    function addGlobalContexts(contexts, trackers) {
        dispatchToTrackers(trackers, function (t) {
            t.core.addGlobalContexts(contexts);
        });
    }
    /**
     * All provided contexts will no longer be sent with every event
     *
     * @param contexts - An array of contexts or conditional contexts
     * @param trackers - The tracker identifiers which the global contexts will be remove from
     */
    function removeGlobalContexts(contexts, trackers) {
        dispatchToTrackers(trackers, function (t) {
            t.core.removeGlobalContexts(contexts);
        });
    }
    /**
     * Clear all global contexts that are sent with events
     *
     * @param trackers - The tracker identifiers which the global contexts will be cleared from
     */
    function clearGlobalContexts(trackers) {
        dispatchToTrackers(trackers, function (t) {
            t.core.clearGlobalContexts();
        });
    }
    /**
     * Stop regenerating `pageViewId` (available from `web_page` context)
     *
     * @param trackers - The tracker identifiers which the event will preserve their Page View Ids
     */
    function preservePageViewId(trackers) {
        dispatchToTrackers(trackers, function (t) {
            t.preservePageViewId();
        });
    }
    /**
     * Disables anonymous tracking if active (ie. tracker initialized with `anonymousTracking`)
     * For stateStorageStrategy override, uses supplied value first,
     * falls back to one defined in initial config, otherwise uses cookieAndLocalStorage.
     *
     * @param configuration - The configuration for disabling anonymous tracking
     * @param trackers - The tracker identifiers which the event will be sent to
     */
    function disableAnonymousTracking(configuration, trackers) {
        dispatchToTrackers(trackers, function (t) {
            t.disableAnonymousTracking(configuration);
        });
    }
    /**
     * Enables anonymous tracking (ie. tracker initialized without `anonymousTracking`)
     *
     * @param configuration - The configuration for enabling anonymous tracking
     * @param trackers - The tracker identifiers which the event will be sent to
     */
    function enableAnonymousTracking(configuration, trackers) {
        dispatchToTrackers(trackers, function (t) {
            t.enableAnonymousTracking(configuration);
        });
    }
    /**
     * Clears all cookies and local storage containing user and session identifiers
     *
     * @param trackers - The tracker identifiers which the event will be sent to
     */
    function clearUserData(configuration, trackers) {
        dispatchToTrackers(trackers, function (t) {
            t.clearUserData(configuration);
        });
    }
    /**
     * Add a plugin into the plugin collection after trackers have already been initialised
     *
     * @param configuration - The plugin to add
     * @param trackers - The tracker identifiers which the plugin will be added to
     */
    function addPlugin(configuration, trackers) {
        dispatchToTrackers(trackers, function (t) {
            t.addPlugin(configuration);
        });
    }

    /*
     * Copyright (c) 2022 Snowplow Analytics Ltd, 2010 Anthon Pang
     * All rights reserved.
     *
     * Redistribution and use in source and binary forms, with or without
     * modification, are permitted provided that the following conditions are met:
     *
     * 1. Redistributions of source code must retain the above copyright notice, this
     *    list of conditions and the following disclaimer.
     *
     * 2. Redistributions in binary form must reproduce the above copyright notice,
     *    this list of conditions and the following disclaimer in the documentation
     *    and/or other materials provided with the distribution.
     *
     * 3. Neither the name of the copyright holder nor the names of its
     *    contributors may be used to endorse or promote products derived from
     *    this software without specific prior written permission.
     *
     * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
     * AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
     * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
     * DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE
     * FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
     * DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
     * SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
     * CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
     * OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
     * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
     */
    var state = typeof window !== 'undefined' ? createSharedState() : undefined;
    /**
     * Initialise a new tracker
     *
     * @param trackerId - The tracker id - also known as tracker namespace
     * @param endpoint - Collector endpoint in the form collector.mysite.com
     * @param configuration - The initialisation options of the tracker
     */
    function newTracker(trackerId, endpoint, configuration) {
        if (configuration === void 0) { configuration = {}; }
        if (state) {
            return addTracker(trackerId, trackerId, "js-".concat(version), endpoint, state, configuration);
        }
        else {
            return undefined;
        }
    }
    /**
     * Initialise a new tracker
     *
     * @param trackerId - The tracker id - also known as tracker namespace
     * @param endpoint - Collector endpoint in the form collector.mysite.com
     * @param configuration - The initialisation options of the tracker
     */
    function convivaAppTracker(configuration) {
        if (configuration === void 0) { configuration = {}; }
        var trackerId = 'CAT';
        if (state) {
            var tracker = addTracker(trackerId, trackerId, "js-".concat(version), '', state, configuration);
            if (document && document.addEventListener) {
                document.addEventListener('convivaVideoEvent', function (event) {
                    if (event && tracker) {
                        tracker.trackVideoEvent(event);
                    }
                });
            }
            return tracker;
        }
        else {
            return undefined;
        }
    }

    exports.addGlobalContexts = addGlobalContexts;
    exports.addPlugin = addPlugin;
    exports.clearGlobalContexts = clearGlobalContexts;
    exports.clearUserData = clearUserData;
    exports.convivaAppTracker = convivaAppTracker;
    exports.crossDomainLinker = crossDomainLinker;
    exports.disableAnonymousTracking = disableAnonymousTracking;
    exports.discardBrace = discardBrace;
    exports.discardHashTag = discardHashTag;
    exports.enableActivityTracking = enableActivityTracking;
    exports.enableActivityTrackingCallback = enableActivityTrackingCallback;
    exports.enableAnonymousTracking = enableAnonymousTracking;
    exports.flushBuffer = flushBuffer;
    exports.newSession = newSession;
    exports.newTracker = newTracker;
    exports.preservePageViewId = preservePageViewId;
    exports.removeGlobalContexts = removeGlobalContexts;
    exports.setBufferSize = setBufferSize;
    exports.setCollectorUrl = setCollectorUrl;
    exports.setCookiePath = setCookiePath;
    exports.setCustomTags = setCustomTags;
    exports.setCustomUrl = setCustomUrl;
    exports.setDocumentTitle = setDocumentTitle;
    exports.setOptOutCookie = setOptOutCookie;
    exports.setReferrerUrl = setReferrerUrl;
    exports.setUserId = setUserId;
    exports.setUserIdFromCookie = setUserIdFromCookie;
    exports.setUserIdFromLocation = setUserIdFromLocation;
    exports.setUserIdFromReferrer = setUserIdFromReferrer;
    exports.setVisitorCookieTimeout = setVisitorCookieTimeout;
    exports.trackCustomEvent = trackCustomEvent;
    exports.trackPageView = trackPageView;
    exports.trackSelfDescribingEvent = trackSelfDescribingEvent;
    exports.trackStructEvent = trackStructEvent;
    exports.unsetCustomTags = unsetCustomTags;
    exports.updatePageActivity = updatePageActivity;
    exports.version = version;

    Object.defineProperty(exports, '__esModule', { value: true });

}));
//# sourceMappingURL=index.umd.js.map
