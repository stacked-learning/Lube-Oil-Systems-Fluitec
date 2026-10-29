/* Installed before Unity's loader. Chunk URLs remain ordinary static files. */
(() => {
  "use strict";
  const manifest = {"Build/1d0298472e460f53554b68b4f42339f1.data.unityweb": {"size": 114145415, "chunks": [{"url": "Build/1d0298472e460f53554b68b4f42339f1.data.unityweb.part0000", "size": 20971520, "sha256": "e790f4103e9bc142dd649c50f5b740a9b0c68c5a5c87b0fc33b35d026f1b384b"}, {"url": "Build/1d0298472e460f53554b68b4f42339f1.data.unityweb.part0001", "size": 20971520, "sha256": "883f07f467bf5c932f5ce88abf6a08aae609681ccb83691ee0d3353c146539b4"}, {"url": "Build/1d0298472e460f53554b68b4f42339f1.data.unityweb.part0002", "size": 20971520, "sha256": "58ee5a4ebf1c4c32677e89bd492c36c6d8a821d384bad9f49005f81318ae92fa"}, {"url": "Build/1d0298472e460f53554b68b4f42339f1.data.unityweb.part0003", "size": 20971520, "sha256": "bc277c6075902bce5b9dab23b4235075d9b29c17f1ab760455a071c2d385213c"}, {"url": "Build/1d0298472e460f53554b68b4f42339f1.data.unityweb.part0004", "size": 20971520, "sha256": "5c78b0232430cbc04924129d434119207b5a724ac715e0c7bd115308a952ac1d"}, {"url": "Build/1d0298472e460f53554b68b4f42339f1.data.unityweb.part0005", "size": 9287815, "sha256": "aa7db3144c6cb75f45ff09042b747252884949759889e5922dcc4f665ba05e83"}]}, "Build/b5d91239cd321a0716b7f47f4a9a830f.wasm.unityweb": {"size": 12446521, "chunks": [{"url": "Build/b5d91239cd321a0716b7f47f4a9a830f.wasm.unityweb.part0000", "size": 12446521, "sha256": "c99a907b70c161a7aa632ccff7c4eadc86608698a47cd664a2a8da7daba6455e"}]}};
  const base = new URL(".", document.currentScript.src);
  const originalFetch = window.fetch.bind(window);
  const files = new Map(Object.entries(manifest).map(([name, entry]) => [new URL(name, base).href, entry]));
  window.fetch = async (input, init) => {
    const url = new URL(input instanceof Request ? input.url : input, document.baseURI);
    const entry = files.get(url.href);
    if (!entry) return originalFetch(input, init);
    const method = (init && init.method) || (input instanceof Request ? input.method : "GET");
    if (method !== "GET") return originalFetch(input, init);
    const signal = (init && init.signal) || (input instanceof Request ? input.signal : undefined);
    let index = 0;
    const stream = new ReadableStream({
      async pull(controller) {
        try {
          if (index === entry.chunks.length) { controller.close(); return; }
          const chunk = entry.chunks[index++];
          const response = await originalFetch(new URL(chunk.url, base), { signal, cache: "no-cache" });
          if (!response.ok) throw new Error(`Chunk download failed: ${chunk.url} (${response.status})`);
          const bytes = new Uint8Array(await response.arrayBuffer());
          if (bytes.byteLength !== chunk.size) throw new Error(`Chunk size mismatch: ${chunk.url}`);
          const digest = await crypto.subtle.digest("SHA-256", bytes);
          const hash = Array.from(new Uint8Array(digest), b => b.toString(16).padStart(2, "0")).join("");
          if (hash !== chunk.sha256) throw new Error(`Chunk integrity mismatch: ${chunk.url}`);
          controller.enqueue(bytes);
        } catch (error) { controller.error(error); }
      }
    });
    return new Response(stream, { headers: {
      "Content-Length": String(entry.size),
      "Content-Type": url.pathname.endsWith(".wasm") ? "application/wasm" : "application/octet-stream"
    }});
  };
})();
