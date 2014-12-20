/* global OPTIONS:true, onPrefChange:true, getPreferredFmt:true, createNode:true, asyncGet:true, onReady:true, onInit:true, handleVolChange:true, logify:true */
// the following jshint global rule is only because jshint support for ES6 arrow
// functions is limited
/* global wrapper:true, args:true */
"use strict";

//This Addons Preferences
var OPTIONS = {};
// push your prefernces change listner function to this table, yah the old way
const onPrefChange = [];
const Qlt = ["higher",
    "high",
    "medium",
    "low"
];
const Cdc = ["webm", "mp4"];
self.port.on("preferences", function(prefs) {
    OPTIONS = prefs;
    onPrefChange.forEach(f => f());
});

self.port.on("prefChanged", function(pref) {
    OPTIONS[pref.name] = pref.value;
    onPrefChange.forEach(f => f(pref.name));
});

const getPreferredFmt = (fmts, wrapper = {}) => {
    // for example of the optional wrapper, see data/youtube-formats.js
    var i, j, slct;
    var _cdc = [
        Cdc[OPTIONS.prefCdc],
        Cdc[(OPTIONS.prefCdc + 1 % 2)]
    ];
    i = OPTIONS.prefQlt;
    while (i > -1) {
        for (j = 0; j < 2; j++) {
            slct = Qlt[i] + "/" + _cdc[j];
            slct = wrapper[slct] || slct;
            if (fmts[slct])
                return fmts[slct];
        }
        i = (i >= OPTIONS.prefQlt) ? i + 1 : i - 1;
        if (i > 3)
            i = OPTIONS.prefQlt - 1;
    }
    logify("Error on getPreferredFmt", fmts, wrapper);
};

const createNode = (type, prprt, data, style) => {
    logify("createNode", type, prprt);
    var node = document.createElement(type);
    if (prprt)
        Object.keys(prprt).forEach(p => node[p] = prprt[p]);
    if (data)
        Object.keys(data).forEach(d => node.dataset[d] = data[d]);
    if (style)
        Object.keys(style).forEach(s => node.style[s] = style[s]);
    // Debugging Video elements errors.
    if (type === "video") {
        node.addEventListener("error", e => logify("Error on video element", e));
        node.addEventListener("stalled", e => logify("Fetching Stoped on video element", e));
    }
    return node;
};

const asyncGet = (url, headers, mimetype) => {
    logify("asyncGet", url);
    return new Promise(function(resolve, reject) {
        var xhr = new XMLHttpRequest();
        xhr.open("GET", url, true);
        if (headers)
            Object.keys(headers).forEach(h => xhr.setRequestHeader(h, headers[h]));
        if (mimetype && xhr.overrideMimeType)
            xhr.overrideMimeType(mimetype);
        xhr.onload = function() {
            if (this.status !== 200) {
                reject(this.status);
                logify("Error on asyncGet", url, headers, this.status);
                return;
            }
            resolve(this.responseText);
        };
        xhr.onerror = function() {
            reject();
        };
        xhr.send();
    });
};

const logify = (...args) =>
    console.log.apply(console, args.map(s => JSON.stringify(s, null, 2)));

const handleVolChange = player => {
    onPrefChange.push(function(pref) {
        if (player && pref === "volume") {
            player.volume = OPTIONS[pref] / 100;
        }
    });
};

const onReady = f => {
    //TODO: document readyState is "loading" (and DOMECotentLoaded) even DOM elements are
    //accessible
    try {
        if (document.readyState !== "loading") {
            f();
        } else {
            document.addEventListener("DOMContentLoaded", f);
        }
    } catch (e) {
        console.error("Exception", e.lineNumber, e.columnNumber, e.message, e.stack);
    }
};

const onInit = f => {
    // code running on when="ready" mode or does not need until onReady
    // execc but depend on preferences, need to wrapped to this funct.
    // need
    document.onafterscriptexecute = function() {
        document.onafterscriptexecute = undefined;
        f();
    };
};