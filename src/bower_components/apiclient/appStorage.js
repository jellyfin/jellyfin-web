define([], function() {
    "use strict";

    function onCachePutFail(e) {
        console.log(e);
    }

    function updateCache(instance) {
        if (instance.cache) {
            instance.cache.put("data", new Response(JSON.stringify(instance.localData))).catch(onCachePutFail);
        }
    }

    function onCacheOpened(result) {
        this.cache = result;
        this.localData = {};
    }

    function MyStore() {

        this.setItem = function(name, value) {
            localStorage.setItem(name, value);

            if (this.localData && this.localData[name] !== value) {
                this.localData[name] = value;
                updateCache(this);
            }
        };

        this.getItem = function(name) {
            return localStorage.getItem(name);
        };

        this.removeItem = function(name) {
            localStorage.removeItem(name);

            if (this.localData) {
                delete this.localData[name];
                updateCache(this);
            }
        };

        try {
            if (self.caches) {
                self.caches.open("embydata").then(onCacheOpened.bind(this));
            }
        } catch (err) {
            console.log("Error opening cache: " + err);
        }
    }

    return new MyStore;
});