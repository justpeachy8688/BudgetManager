console.log("Hi from your service-worker.js file!");

const FILES_TO_CACHE = [
    "/",
    "/index.html",
    "/index.js",
    "/indexedDB.js",
    "/manifest.webmanifest",
    "/style.css",
    "/icons/icon-512x512.png",
    "/icons/icon-192x192.png"
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
// self.addEventListener("activate", (event) => {
//     const currentCaches = [CACHE_NAME, RUNTIME];
//     ///LIKE ABOVE, EXTEND THE ACTIVATING STAGE UNTIL THE PROMISE IS RESOLVED WITH event.waitUntil()
//     event.waitUntil(
//         caches
//             .keys()
//             .then((cacheNames) => {
//                 return cacheNames.filter((cacheName) => !currentCaches.includes(cacheName));
//             })
//             .then((cachesToDelete) => {
//                 return Promise.all(
//                     cachesToDelete.map((cacheToDelete) => {
//                         return caches.delete(cacheToDelete);
//                     })
//                 );
//             })
//             // USE self.clients.claim() TO START CONTROLLING ALL OPEN CLIENTS WITHOUT RELOADING THEM
//             .then(() => self.clients.claim())
//     );
// });


self.addEventListener("fetch", (event) => {
    if (event.request.url.includes("/api/")) {
        //HiJACK OUT HTTP RESPONSES AND UPDATE THEM
        event.respondWith(
            caches.open(CACHE_NAME)
                .then(cache => {
                    return fetch(event.request)
                        .then(response => {
                            if (response.status === 200) {
                                cache.put(event.request.url, response.clone());
                            }
                            return response;
                        }).catch(err => {
                            return cache.match(event.request);
                        })
                }).catch(err => {
                    console.log(err);
                })
        );
        return;
    }
    event.respondWith(
        fetch(event.request)
            .catch(function () {
                return caches.match(event.request)
                    .then(function (response) {
                        if (response) {
                            return response;
                        } else if (event.response.headers.get("accept").includes("text/html")) {
                            return caches.match("/")
                        }
                    })
            })
    )
})


