
console.log('Script loaded!')
var cacheStorageKey = 'minimal-pwa-8'

var cacheList = [
    '/',
    'index.html',
]

self.addEventListener('install', function(e) {
    console.log('Cache event!')
    e.waitUntil(caches.open(cacheStorageKey).then(function(cache) {
        console.log('Adding to Cache:', cacheList)
        return cache.addAll(cacheList)
    }).then(function() {
        console.log('Skip waiting!')
        return self.skipWaiting()
    }))
})

self.addEventListener('activate', function(e) {
    console.log('Activate event')
    e.waitUntil(Promise.all(caches.keys().then(cacheNames => {
        return cacheNames.map((name) => {
            if (name !== cacheStorageKey) {
                return caches.delete(name)
            }
            return null
        })
    })).then(() => {
        console.log('Clients claims.')
        return self.clients.claim()
    }))
})

self.addEventListener('fetch', function(event) {
    event.respondWith(
        caches.match(event.request).then(response => {
            return response || fetch(event.request, {mode: 'no-cors'})
        })
    )
})
