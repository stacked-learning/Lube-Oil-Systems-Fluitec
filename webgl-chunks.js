/* Installed before Unity's loader. Chunk URLs remain ordinary static files. */
(() => {
  "use strict";
  const manifest = {"Build/b5d91239cd321a0716b7f47f4a9a830f.wasm.unityweb": {"size": 12446521, "chunks": [{"url": "Build/b5d91239cd321a0716b7f47f4a9a830f.wasm.unityweb.part0000", "size": 12446521, "sha256": "c99a907b70c161a7aa632ccff7c4eadc86608698a47cd664a2a8da7daba6455e"}]}, "Build/c434a27c13d8d17b1e50ae4c8e588631.data.unityweb": {"size": 114407180, "chunks": [{"url": "Build/c434a27c13d8d17b1e50ae4c8e588631.data.unityweb.part0000", "size": 20971520, "sha256": "ba50361d9c077f43b4d811cdda8498bde5e22e213c2b1468db86ad79427d202f"}, {"url": "Build/c434a27c13d8d17b1e50ae4c8e588631.data.unityweb.part0001", "size": 20971520, "sha256": "501353e6555a644dc82d36358d0596987a6740945ad2b1476083a6749bac399b"}, {"url": "Build/c434a27c13d8d17b1e50ae4c8e588631.data.unityweb.part0002", "size": 20971520, "sha256": "bfd0fb62b1520ee79c7801ebd1395ddcd86c7b3345617a1dcebc86729692ec3b"}, {"url": "Build/c434a27c13d8d17b1e50ae4c8e588631.data.unityweb.part0003", "size": 20971520, "sha256": "69ccd5c4eb6cb73ffeb21e8926155dd72e7ca9f0c462d515f02b07599b6d6096"}, {"url": "Build/c434a27c13d8d17b1e50ae4c8e588631.data.unityweb.part0004", "size": 20971520, "sha256": "d23ca8ed0382588835df02bd7e10a9a077510db196c6888dd46421a77d82212f"}, {"url": "Build/c434a27c13d8d17b1e50ae4c8e588631.data.unityweb.part0005", "size": 9549580, "sha256": "b3fda36bd94b8143db61391a9ae36023ccc71685b665700543082f3e12067d18"}]}};
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
