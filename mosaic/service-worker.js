// service-worker.js

// IMPORTANT: This path must match the 'action' URL specified in your manifest.json's 'share_target' object.
// For example, if your app is at /mosaic/ and manifest action is "handle-share",
// then this should be '/mosaic/handle-share'.
// If manifest is at root and action is "/handle-shared-image", use that.
const SHARE_TARGET_PATH = "/"; // ADJUST THIS TO YOUR MANIFEST'S ACTION PATH

// This 'name' must match the 'name' attribute of the 'files' parameter
// in your manifest.json's 'share_target.params.files[0].name'.
const FORM_DATA_FILE_KEY = "shared_image"; // ADJUST THIS TO YOUR MANIFEST'S FILE PARAM NAME

self.addEventListener("install", (event) => {
  console.log("Service Worker: Install");
  // Force the waiting service worker to become the active service worker.
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  console.log("Service Worker: Activate");
  // Ensure the service worker takes control of the page immediately.
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  if (event.request.method === "POST" && url.pathname === SHARE_TARGET_PATH) {
    event.respondWith(
      (async () => {
        try {
          const formData = await event.request.formData();
          const files = formData.getAll(FORM_DATA_FILE_KEY);

          if (files && files.length > 0) {
            const file = files[0]; // Process the first file

            // Send the file to all open client windows
            const clientList = await self.clients.matchAll({
              type: "window",
              includeUncontrolled: true
            });
            for (const client of clientList) {
              // Attempt to focus the client before sending the message
              if (client.focus) {
                await client
                  .focus()
                  .catch((err) =>
                    console.warn("SW: Could not focus client", err)
                  );
              }
              client.postMessage({ type: "shared-image-file", file: file });
            }
          } else {
            console.warn(
              `Service Worker: No files found in POST data for key '${FORM_DATA_FILE_KEY}' on path '${SHARE_TARGET_PATH}'.`
            );
          }
        } catch (error) {
          console.error("Service Worker: Error processing shared file:", error);
        }
        // Redirect to the app's root page after processing the share.
        // This helps bring the app to the foreground if it was already open, or open it if closed.
        return Response.redirect("/", 303);
      })()
    );
  }
});
