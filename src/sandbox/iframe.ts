function iframeTemplate(source: string) {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta http-equiv="X-UA-Compatible" content="IE=edge">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title></title>

      <script type="ts-module-browser-config">
        {
          "serviceWorkerPath": "${window.location.origin}/sw.js",
          "resolver": "skypack"
        }
      </script>
      <script src="https://unpkg.com/ts-module-browser@1.3.6"></script>
      <script type="ts-module-browser">${source}</script>
    </head>
    <body>
      <div id="sandbox"></div>
    </body>
    </html>
  `;
}

function getIframe(url: string): Promise<HTMLIFrameElement> {
  return new Promise((resolve) => {
    const previewContainer = document.getElementById("preview");
    if (!previewContainer) {
      throw new Error(
        "Cannot create iframe, because #preview container does not existst"
      );
    }

    // Clearing old iframe
    previewContainer.innerHTML = "";

    const frame = document.createElement("iframe");
    frame.src = url;
    frame.onload = () => {
      resolve(frame);
    };

    document.getElementById("preview")?.appendChild(frame);
  });
}

function unregisterWorkers() {
  return new Promise((resolve) => {
    navigator.serviceWorker.getRegistrations().then(async (registrations) => {
      for (let registration of registrations) {
        await registration.unregister();
      }

      resolve(true);
    });
  });
}

/** Get iframe source from server */
export async function refreshIframe(source: string) {
  // Create iframe or get it cached version
  const iframe = await getIframe(`${window.location.origin}/iframe.html`);
  const iframeContent = iframeTemplate(source);

  if (iframe.contentWindow) {
    await unregisterWorkers();
    await iframe.contentWindow.navigator.serviceWorker.register(
      `${window.location.origin}/sw.js`
    );

    iframe.contentWindow.document.open();
    iframe.contentWindow.document.write(iframeContent);
    iframe.contentWindow.document.close();
  }
}
