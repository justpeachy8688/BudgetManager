console.log("Hi from your service-worker.js file!");

const FILES_TO_CACHE = [

]

const CACHE_NAME = 'cache-v1';
const RUNTIME = 'runtime';

//LISTEN FOR INSTALL EVENT
self.addEventListener("install", (event) => {
    //USE event.waitUntil() PASSING A PROMISE TO EXTEND THE INSTALLING STAGE UNTIL THE PROMISE IS RESOLVED
    event.waitUntil(
        caches
            .open(CACHE_NAME)
            .then((cache) => cache.addAll(FILES_TO_CACHE))
            //USE self.skipWaiting() ANYTIME BEFORE ACTIVATION TO SKIP INSTALL STAGE AND DIRECTLY JUMP TO ACTIVATING STAGE
            .then(self.skipWaiting())
    );
});

//LISTEN FOR THE ACTIVATE EVENT. TAKES CARE OF CLEANING UP OLD CACHES.
self.addEventListener("activate", (event) => {
    const currentCaches = [CACHE_NAME, RUNTIME];
    ///LIKE ABOVE, EXTEND THE ACTIVATING STAGE UNTIL THE PROMISE IS RESOLVED WITH event.waitUntil()
    event.waitUntil(
        caches
            .keys()
            .then((cacheNames) => {
                return cacheNames.filter((cacheName) => !currentCaches.includes(cacheName));
            })
            .then((cachesToDelete) => {
                return Promise.all(
                    cachesToDelete.map((cacheToDelete) => {
                        return caches.delete(cacheToDelete);
                    })
                );
            })
            // USE self.clients.claim() TO START CONTROLLING ALL OPEN CLIENTS WITHOUT RELOADING THEM
            .then(() => self.clients.claim())
    );
});


self.addEventListener("fetch", (event) => {
    if (event.request.url.startsWith(self.location.origin)) {
        //HiJACK OUT HTTP RESPONSES AND UPDATE THEM
        event.respondWith(
            //caches.match(event.request) ALLOWS US TO MATCH EACH RESOURCE REQUESTED FROM THE NETWORK WITH THE EQUIVALENT RESOURCE AVAILABLE IN THE CACHE
            caches.match(event.request)
                .then((cachedResponse) => {
                    if (cachedResponse) {
                        return cachedResponse
                            ;
                    }

                    return caches.open(RUNTIME)
                        .then((cache) => {
                            //IF A MATCH WASN'T FOUND IN CACHE, TELL BROWSER TO FETCH THE DEFAULT NETWORK REQUEST FOR THAT RESOURCE, TO GET NEW RESOURCE FROM THE NETWORK IF AVAILABLE.
                            return fetch(event.request)
                                .then((response) => {
                                    //cache.put() ADD THE RESOURCE TO THE CACHE, THE RESOURCE IS GRABBED FROM event.request, THEN THE RESPONSE IS CLONED WITH response.clone AND ADDED TO CACHE.
                                    return cache.put(event.request, response.clone())
                                        .then(() => {
                                            return response;
                                            //IF REQ DOESN"T MATCH ANYTHING AND NETWORK IS NOT AVAILABLE, PROVIDE A FALLBACK SO THAT USER WILL SEE AT LEAST SOMETHING.
                                        }).catch(() => {
                                            return caches.match('public/icons/icon-512x512.png')
                                        })
                                });
                        });
                })
        );
    }
});


