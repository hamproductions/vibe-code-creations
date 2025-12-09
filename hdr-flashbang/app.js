
    // --- Utils ---
    function log(msg) {
        const logArea = document.getElementById('logArea');
        logArea.classList.remove('hidden');
        const entry = document.createElement('div');
        entry.textContent = `> ${msg}`;
        logArea.appendChild(entry);
        logArea.scrollTop = logArea.scrollHeight;
        console.log(msg);
    }

    // --- State ---
    const REF_WHITE_NITS = 1000;
    const MAX_PQ_NITS = 10000;

    // Elements
    const fileInput = document.getElementById('fileInput');
    const refInput = document.getElementById('refInput');
    const gainSlider = document.getElementById('gainSlider');
    const gainValue = document.getElementById('gainValue');
    const downloadBtn = document.getElementById('downloadBtn');
    const canvas = document.getElementById('webgpuCanvas');
    const exportCanvas = document.getElementById('exportCanvas');
    const loadingOverlay = document.getElementById('loadingOverlay');
    const loadingText = document.getElementById('loadingText');
    const previewBadge = document.getElementById('previewBadge');
    const hexStatus = document.getElementById('hexStatus');

    let device, context, pipeline, texture, sampler, uniformBuffer, bindGroup;
    let sourceImageBitmap = null;
    let webGpuReady = false;
    let capturedMetadata = []; // Reference file chunks
    let generatedBlobUrl = null;

    // --- Hex Loader ---
    function getHardcodedHex() {
        const raw = document.getElementById('HARDCODED_ICC').textContent;
        // Clean whitespace, newlines, comments
        return raw.replace(/[^0-9A-Fa-f]/g, '');
    }

    function checkHexStatus() {
        const hex = getHardcodedHex();
        if (hex.length > 20) {
            hexStatus.innerHTML = `<span class="text-emerald-400">Found ${hex.length/2} bytes</span>`;
        } else {
            hexStatus.innerHTML = `<span class="text-yellow-500">Empty or invalid hex in &lt;head&gt;</span>`;
        }
    }
    // Check immediately
    checkHexStatus();

    // --- 1. WebGPU Init ---
    async function initWebGPU() {
        if (!navigator.gpu) { log("WebGPU not supported."); return false; }
        try {
            const adapter = await navigator.gpu.requestAdapter();
            device = await adapter.requestDevice();
            context = canvas.getContext('webgpu');
            context.configure({
                device,
                format: 'rgba16float',
                toneMapping: { mode: "extended" },
                usage: GPUTextureUsage.RENDER_ATTACHMENT
            });
            createPipeline();
            log("WebGPU Initialized (Extended Mode)");
            return true;
        } catch (e) {
            log("WebGPU Error: " + e.message);
            return false;
        }
    }

    function createPipeline() {
        const shaderModule = device.createShaderModule({
            code: `
                struct Uniforms { gain: f32 };
                @group(0) @binding(0) var mySampler: sampler;
                @group(0) @binding(1) var myTexture: texture_2d<f32>;
                @group(0) @binding(2) var<uniform> uniforms: Uniforms;
                struct VSOutput { @builtin(position) position: vec4f, @location(0) uv: vec2f };
                @vertex fn vs_main(@builtin(vertex_index) vi : u32) -> VSOutput {
                    var pos = array<vec2f, 4>(vec2f(-1, 1), vec2f(-1, -1), vec2f(1, 1), vec2f(1, -1));
                    var uvs = array<vec2f, 4>(vec2f(0, 0), vec2f(0, 1), vec2f(1, 0), vec2f(1, 1));
                    var out: VSOutput; out.position = vec4f(pos[vi], 0, 1); out.uv = uvs[vi]; return out;
                }
                @fragment fn fs_main(@location(0) uv: vec2f) -> @location(0) vec4f {
                    let color = textureSample(myTexture, mySampler, uv);
                    return vec4f(color.rgb * uniforms.gain, color.a);
                }
            `
        });
        pipeline = device.createRenderPipeline({
            layout: 'auto',
            vertex: { module: shaderModule, entryPoint: 'vs_main' },
            fragment: { module: shaderModule, entryPoint: 'fs_main', targets: [{ format: 'rgba16float' }] },
            primitive: { topology: 'triangle-strip' },
        });
        uniformBuffer = device.createBuffer({ size: 4, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST });
        sampler = device.createSampler({ magFilter: 'linear', minFilter: 'linear' });
    }

    (async () => { webGpuReady = await initWebGPU(); })();

    // --- 2. Input Handlers ---
    fileInput.addEventListener('change', async (e) => {
        if (!e.target.files[0] || !webGpuReady) return;
        sourceImageBitmap = await createImageBitmap(e.target.files[0]);
        const maxDim = 2048;
        let w = sourceImageBitmap.width, h = sourceImageBitmap.height;
        if (w > maxDim || h > maxDim) { const r = Math.min(maxDim/w, maxDim/h); w*=r; h*=r; }
        canvas.width = w; canvas.height = h;

        texture = device.createTexture({ size: [sourceImageBitmap.width, sourceImageBitmap.height], format: 'rgba8unorm', usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT });
        device.queue.copyExternalImageToTexture({ source: sourceImageBitmap }, { texture: texture }, [sourceImageBitmap.width, sourceImageBitmap.height]);
        bindGroup = device.createBindGroup({ layout: pipeline.getBindGroupLayout(0), entries: [{binding:0, resource:sampler}, {binding:1, resource:texture.createView()}, {binding:2, resource:{buffer:uniformBuffer}}] });

        previewBadge.classList.remove('hidden');
        resetToWebGPU();
        downloadBtn.disabled = false;
        render();
    });

    function resetToWebGPU() {
        canvas.classList.remove('hidden');
        if(document.getElementById('resultPreview')) {
            document.getElementById('resultPreview').classList.add('hidden');
        }
        if(document.getElementById('saveBtn')) {
            document.getElementById('saveBtn').classList.add('hidden');
        }
        if (generatedBlobUrl) {
            URL.revokeObjectURL(generatedBlobUrl);
            generatedBlobUrl = null;
        }
    }

    refInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const buffer = await file.arrayBuffer();
        const view = new DataView(buffer);
        const bytes = new Uint8Array(buffer);
        if (view.getUint32(0) !== 0x89504E47) return;

        capturedMetadata = [];
        let cursor = 8;
        while (cursor < bytes.length) {
            const len = view.getUint32(cursor, false);
            const type = new TextDecoder().decode(bytes.slice(cursor + 4, cursor + 8));
            if (['iCCP', 'cHRM', 'gAMA', 'sRGB', 'cICP'].includes(type)) {
                capturedMetadata.push(bytes.slice(cursor, cursor + len + 12));
            }
            cursor += len + 12;
        }
        log(`Reference loaded. Captured chunks: ${capturedMetadata.length}`);
    });

    gainSlider.addEventListener('input', (e) => {
        gainValue.textContent = parseFloat(e.target.value).toFixed(1);
        resetToWebGPU();
        render();
    });

    function render() {
        if (!device || !pipeline) return;
        const gain = parseFloat(gainSlider.value);
        device.queue.writeBuffer(uniformBuffer, 0, new Float32Array([gain]));
        const enc = device.createCommandEncoder();
        const pass = enc.beginRenderPass({ colorAttachments: [{ view: context.getCurrentTexture().createView(), clearValue: {r:0,g:0,b:0,a:1}, loadOp: 'clear', storeOp: 'store' }] });
        pass.setPipeline(pipeline);
        pass.setBindGroup(0, bindGroup);
        pass.draw(4);
        pass.end();
        device.queue.submit([enc.finish()]);
    }

    // --- 4. Helpers ---
    function calcAdler32(data) {
        let a=1, b=0; const M=65521;
        for(let i=0;i<data.length;i++){ a=(a+data[i])%M; b=(b+a)%M; }
        return ((b<<16)|a)>>>0;
    }
    const crcTable = new Uint32Array(256);
    for(let n=0;n<256;n++){ let c=n; for(let k=0;k<8;k++) c=(c&1)?(0xEDB88320^(c>>>1)):(c>>>1); crcTable[n]=c; }
    function calcCRC32(buf) {
        let c=0xFFFFFFFF; for(let i=0;i<buf.length;i++) c=(c>>>8)^crcTable[(c^buf[i])&0xFF]; return (c^0xFFFFFFFF)>>>0;
    }
    function toLinear(v) { return v<=0.04045 ? v/12.92 : Math.pow((v+0.055)/1.055, 2.4); }
    function toPQ(v) {
        const m1=2610/16384, m2=2523*128/4096, c1=3424/4096, c2=2413*32/4096, c3=2392*32/4096;
        const Y = Math.max(0, v); const Ym1 = Math.pow(Y, m1);
        return Math.pow((c1 + c2*Ym1)/(1 + c3*Ym1), m2);
    }
    function convertTo2020(r,g,b) {
        return [
            0.6274*r + 0.3293*g + 0.0433*b,
            0.0691*r + 0.9195*g + 0.0114*b,
            0.0164*r + 0.0880*g + 0.8956*b
        ];
    }
    function hexToBytes(hex) {
        const bytes = new Uint8Array(hex.length / 2);
        for (let i = 0; i < bytes.length; i++) {
            bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
        }
        return bytes;
    }

    // --- Core Processing Logic ---
    async function processImage(mode, gain, hex, sourceBitmap, useHybrid = false) {
        if (mode === 'gainmap') {
            // ISO 21496-1 Gain Map
            const iccHex = useHybrid ? hex : null;
            if (useHybrid) log("Hybrid Mode: Injecting custom ICC...");
            
            const resultApi = await generateGainMapJpeg(sourceBitmap, gain, iccHex);
            return new Blob([resultApi], {type: 'image/jpeg'});
        } else {
            // Standard/Hex/Clone (PNG Path)
            exportCanvas.width = sourceBitmap.width;
            exportCanvas.height = sourceBitmap.height;
            const ctx = exportCanvas.getContext('2d', {colorSpace:'srgb'});
            ctx.drawImage(sourceBitmap,0,0);
            const sdrData = ctx.getImageData(0,0,exportCanvas.width,exportCanvas.height).data;
            const w=exportCanvas.width, h=exportCanvas.height;
            const scaleFactor = (REF_WHITE_NITS/MAX_PQ_NITS) * gain;

            const rowSize = 1 + w*8;
            const rawBuffer = new Uint8Array(h*rowSize);
            const view = new DataView(rawBuffer.buffer);
            let srcIdx=0, dstIdx=0;

            for(let y=0; y<h; y++) {
                rawBuffer[dstIdx++] = 0;
                for(let x=0; x<w; x++) {
                    const lr = toLinear(sdrData[srcIdx]/255), lg = toLinear(sdrData[srcIdx+1]/255), lb = toLinear(sdrData[srcIdx+2]/255);
                    const [r20,g20,b20] = convertTo2020(lr,lg,lb);

                    view.setUint16(dstIdx, toPQ(Math.min(1, r20*scaleFactor))*65535, false); dstIdx+=2;
                    view.setUint16(dstIdx, toPQ(Math.min(1, g20*scaleFactor))*65535, false); dstIdx+=2;
                    view.setUint16(dstIdx, toPQ(Math.min(1, b20*scaleFactor))*65535, false); dstIdx+=2;
                    view.setUint16(dstIdx, 65535, false); dstIdx+=2;
                    srcIdx+=4;
                }
            }

            // Inline Compression Logic (simulated sync for simplicity in flow, but it's async)
            const stream = new Blob([rawBuffer]).stream().pipeThrough(new CompressionStream('deflate'));
            const buf = await new Response(stream).arrayBuffer();
            let zlibData = new Uint8Array(buf);

            if(zlibData[0] !== 0x78) {
                const wrapper = new Uint8Array(zlibData.length+6);
                wrapper[0]=0x78; wrapper[1]=0x9C;
                wrapper.set(zlibData,2);
                new DataView(wrapper.buffer).setUint32(wrapper.length-4, calcAdler32(rawBuffer), false);
                zlibData = wrapper;
            }

            // Assembly
            const chunks = [];
            chunks.push(new Uint8Array([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]));

            const ihdr = new Uint8Array(13);
            const dv = new DataView(ihdr.buffer);
            dv.setUint32(0, w, false); dv.setUint32(4, h, false);
            ihdr[8]=16; ihdr[9]=6;
            writeChunk(chunks, 'IHDR', ihdr);

            // METADATA INJECTION
            if (mode === 'hex') {
                if (hex.length < 20) throw new Error("Hardcoded Hex is empty!");
                const bytes = hexToBytes(hex);
                // Heuristic: Is it a Chunk (Start with len + iCCP) or Profile (acsp)?
                const sig = new TextDecoder().decode(bytes.slice(4, 8)); // bytes 4-8 usually 'iCCP'
                if (sig === 'iCCP') {
                    chunks.push(bytes);
                } else {
                    // Profile compression logic...
                    const pStream = new Blob([bytes]).stream().pipeThrough(new CompressionStream('deflate'));
                    const pBuf = await new Response(pStream).arrayBuffer();
                    let pData = new Uint8Array(pBuf);
                    if (pData[0] !== 0x78) {
                        const w = new Uint8Array(pData.length+6);
                        w[0]=0x78; w[1]=0x9C; w.set(pData,2);
                        new DataView(w.buffer).setUint32(w.length-4, calcAdler32(bytes), false);
                        pData = w;
                    }
                    const name = new TextEncoder().encode("HDR");
                    const method = new Uint8Array([0]);
                    const payload = new Uint8Array(name.length + 1 + 1 + pData.length);
                    payload.set(name, 0);
                    payload[name.length] = 0; // Null
                    payload[name.length + 1] = 0; // Method
                    payload.set(pData, name.length + 2);
                    writeChunk(chunks, 'iCCP', payload);
                }
            } else if (mode === 'clone') {
                if (capturedMetadata.length === 0) throw new Error("No reference loaded!");
                chunks.push(...capturedMetadata);
            } else {
                writeChunk(chunks, 'cICP', new Uint8Array([9, 16, 0, 1]));
                const g = new Uint8Array(4); new DataView(g.buffer).setUint32(0, 100000, false);
                writeChunk(chunks, 'gAMA', g);
            }

            writeChunk(chunks, 'IDAT', zlibData);
            writeChunk(chunks, 'IEND', new Uint8Array(0));

            return new Blob(chunks, {type:'image/png'});
        }
    }

    // --- Main Encoder ---
    downloadBtn.addEventListener('click', async () => {
        if (!sourceImageBitmap) return;

        const mode = document.querySelector('input[name="metaMode"]:checked').value;
        const hex = getHardcodedHex();
        const useHybrid = document.getElementById('hybridMode') ? document.getElementById('hybridMode').checked : false;

        loadingOverlay.classList.remove('hidden');
        loadingText.textContent = "Processing...";
        await new Promise(r=>requestAnimationFrame(r));

        try {
            const gain = parseFloat(gainSlider.value);
            const blob = await processImage(mode, gain, hex, sourceImageBitmap, useHybrid);
            
            generatedBlobUrl = URL.createObjectURL(blob);
            
            // Switch view to Result Preview
            const resultPreview = document.getElementById('resultPreview');
            const saveBtn = document.getElementById('saveBtn');
            
            if (resultPreview) {
                resultPreview.src = generatedBlobUrl;
                resultPreview.classList.remove('hidden');
                canvas.classList.add('hidden');
            }
            if (saveBtn) {
                saveBtn.classList.remove('hidden');
            }
            
            log("Preview Generated. Ready to Save.");

        } catch(e) {
            log(e.message);
            alert("Error: "+e.message);
            console.error(e);
        } finally {
            loadingOverlay.classList.add('hidden');
        }
    });

    const saveBtn = document.getElementById('saveBtn');
    if (saveBtn) {
        saveBtn.addEventListener('click', () => {
            if (!generatedBlobUrl) return;
            const a = document.createElement('a');
            a.href = generatedBlobUrl;
            // Determine extension from input mode? Or just check Blob type?
            // Blob type is reliable.
            // But we need to know what mode we ran? 
            // We can just parse the blob type again? 
            // Actually simpler: processImage returns explicit types.
            // Just check the blob type property if available or guess.
            // blob.type is correct.
            const isJpeg = generatedBlobUrl.includes('blob:') ? true : false; // Hack? No.
            // We can store the last extension in a var.
            const ext = 'png'; // Default
            // But wait, Gainmap is JPG.
            // Let's store the blob type properly or just default name.
            // Actually, let's just use generic name and maybe the browser handles it? No.
            // Let's rely on the user knowing what they made? No.
            
            // Re-check mode to determine extension for filename
            const mode = document.querySelector('input[name="metaMode"]:checked').value;
            const extension = (mode === 'gainmap') ? 'jpg' : 'png';

            a.download = `HDR-Flashbang-v7-${Date.now()}.${extension}`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        });
    }

    // --- Test Mode Runner ---
    const runTestBtn = document.getElementById('runTestBtn');
    const testResults = document.getElementById('testResults');
    
    // Enable button when image loaded
    fileInput.addEventListener('change', () => { 
        if(runTestBtn) runTestBtn.disabled = false; 
    });

    if (runTestBtn) {
        runTestBtn.addEventListener('click', async () => {
            if (!sourceImageBitmap) return;
            const hex = getHardcodedHex();
            const gain = parseFloat(gainSlider.value);
            
            testResults.innerHTML = '';
            testResults.classList.remove('hidden');
            loadingOverlay.classList.remove('hidden');
            loadingText.textContent = "Running All Strategies...";
            
            const tasks = [
                { name: 'Standard cICP', mode: 'standard', hybrid: false },
                { name: 'Hardcoded Hex', mode: 'hex', hybrid: false },
                { name: 'ISO Gain Map', mode: 'gainmap', hybrid: false },
                { name: 'Gain Map + Custom ICC', mode: 'gainmap', hybrid: true }
            ];

            for (const t of tasks) {
                try {
                    loadingText.textContent = `Testing: ${t.name}...`;
                    await new Promise(r=>requestAnimationFrame(r)); // UI Refresh
                    
                    const start = performance.now();
                    const blob = await processImage(t.mode, gain, hex, sourceImageBitmap, t.hybrid);
                    const dur = (performance.now() - start).toFixed(0);
                    
                    const url = URL.createObjectURL(blob);
                    
                    // Create Card
                    const div = document.createElement('div');
                    div.className = "bg-neutral-900 rounded-lg p-3 border border-neutral-800 flex flex-col gap-2";
                    div.innerHTML = `
                        <div class="text-xs font-bold text-indigo-400 flex justify-between">
                            <span>${t.name}</span>
                            <span class="text-neutral-500">${dur}ms</span>
                        </div>
                        <div class="relative aspect-square bg-black rounded overflow-hidden">
                            <img src="${url}" class="object-cover w-full h-full" title="Click to open full">
                        </div>
                        <div class="text-[10px] text-neutral-500 font-mono break-all">${(blob.size/1024).toFixed(1)} KB</div>
                        <a href="${url}" download="Test-${t.name.replace(/\s+/g,'-')}.${blob.type==='image/jpeg'?'jpg':'png'}" class="text-[10px] bg-neutral-800 hover:bg-neutral-700 text-center py-1 rounded text-white transition-colors">Download</a>
                    `;
                    testResults.appendChild(div);
                } catch(e) {
                    const div = document.createElement('div');
                    div.className = "bg-neutral-900 rounded-lg p-3 border border-red-900/50 flex flex-col gap-2";
                    div.innerHTML = `
                        <div class="text-xs font-bold text-red-500">${t.name} Failed</div>
                        <div class="text-[10px] text-red-400">${e.message}</div>
                    `;
                    testResults.appendChild(div);
                }
            }
            
            loadingOverlay.classList.add('hidden');
        });
    }

    function writeChunk(chunks, type, data) {
        const len = new Uint8Array(4); new DataView(len.buffer).setUint32(0, data.length, false);
        chunks.push(len);
        const t = new TextEncoder().encode(type);
        chunks.push(t); chunks.push(data);
        const crc = new Uint8Array(t.length+data.length); crc.set(t,0); crc.set(data,4);
        const cVal = new Uint8Array(4); new DataView(cVal.buffer).setUint32(0, calcCRC32(crc), false);
        chunks.push(cVal);
    }

    // --- 5. ISO Gain Map Implementation ---
    let ultraHdrInstance = null;
    
    async function getUltraHdr() {
        if (ultraHdrInstance) return ultraHdrInstance;
        // Import from CDN
        const mod = await import('https://cdn.jsdelivr.net/npm/@monogrid/gainmap-js@3.0.6/libultrahdr-wasm/build/libultrahdr-esm.js');
        ultraHdrInstance = await mod.default(); 
        return ultraHdrInstance;
    }

    // --- ICC Injection Logic ---
    async function getRawIccFromHex(hex) {
        if (!hex || hex.length < 20) return null;
        const bytes = hexToBytes(hex);
        const sig = new TextDecoder().decode(bytes.slice(4, 8));

        if (sig === 'iCCP') {
            // It's a PNG chunk: [Len][iCCP][Name\0][Method][CompressedProfile][CRC]
            // We need to extract CompressedProfile and Decompress it.
            // Name can be variable length. Find first null byte.
            let nullIdx = -1;
            for(let i=8; i<8+80; i++) { if(bytes[i]===0) { nullIdx=i; break; } }
            if(nullIdx === -1) throw new Error("Invalid iCCP chunk: No null separator found");
            
            // Method is at nullIdx + 1
            const method = bytes[nullIdx+1];
            if(method !== 0) throw new Error("Unsupported compression method");
            
            const compressed = bytes.slice(nullIdx+2, bytes.length - 4); // Exclude CRC at end
            
            // Decompress
            try {
                const ds = new DecompressionStream('deflate');
                const writer = ds.writable.getWriter();
                writer.write(compressed);
                writer.close();
                const output = await new Response(ds.readable).arrayBuffer();
                return new Uint8Array(output);
            } catch (e) {
                // Determine if it was actually a raw profile wrapped in zlib or just raw zlib
                // But for now, assume standard zlib deflate
                log("Decompression failed: " + e.message);
                throw e;
            }

        } else if (new TextDecoder().decode(bytes.slice(0, 4)) === 'acsp' || 
                   new TextDecoder().decode(bytes.slice(12, 16)) === 'mntr') {
             // It might be a raw profile (starts with size? or just signature?)
             // Hex dump usually starts with 00 00 0x xx 'acsp'
             return bytes;
        } else {
             // Assume it's a raw profile if it doesn't look like iCCP
             // Or maybe it is a raw zlib stream?
             // Let's assume the user pasted the full iCCP chunk as per previous instructions.
             return bytes;
        }
    }

    function createJpegApp2Marker(iccBytes) {
        // JPEG APP2 ICC Marker: [FF E2] [Len (2)] [ICC_PROFILE\0] [ChunkNum] [TotalChunks] [Data]
        // Max JPEG marker size is 64k. If ICC > ~64k, need split.
        // For simplicity, handle single chunk for now (common for these hack profiles).
        
        const ID = new TextEncoder().encode("ICC_PROFILE\0"); // 12 bytes
        const MAX_DATA = 65533 - 2 - ID.length - 2; // ~65k
        
        if (iccBytes.length > MAX_DATA) {
            log("Warning: ICC Profile too large for single APP2 chunk. Splitting not implemented yet.");
            // TODO: Implement multi-chunk if needed
        }

        const len = 2 + ID.length + 2 + iccBytes.length;
        const marker = new Uint8Array(2 + len);
        const v = new DataView(marker.buffer);
        
        marker[0] = 0xFF; marker[1] = 0xE2;
        v.setUint16(2, len, false);
        marker.set(ID, 4);
        marker[4 + ID.length] = 1; // Chunk 1
        marker[4 + ID.length + 1] = 1; // Total 1
        marker.set(iccBytes, 4 + ID.length + 2);
        
        return marker;
    }

    function injectApp2(jpegBytes, app2Marker) {
        // Find place to insert. After SOI (FF D8).
        if (jpegBytes[0] !== 0xFF || jpegBytes[1] !== 0xD8) throw new Error("Not a valid JPEG");
        
        const out = new Uint8Array(jpegBytes.length + app2Marker.length);
        out.set(jpegBytes.slice(0, 2), 0); // SOI
        out.set(app2Marker, 2); // APP2
        out.set(jpegBytes.slice(2), 2 + app2Marker.length); // Rest
        return out;
    }

    async function generateGainMapJpeg(sourceBitmap, gain, injectIccHex = null) {
        // 1. Prepare SDR JPEG
        exportCanvas.width = sourceBitmap.width;
        exportCanvas.height = sourceBitmap.height;
        const ctx = exportCanvas.getContext('2d', {colorSpace:'srgb'});
        ctx.drawImage(sourceBitmap, 0, 0);
        const sdrBlob = await new Promise(r => exportCanvas.toBlob(r, 'image/jpeg', 0.95));
        let sdrBytes = new Uint8Array(await sdrBlob.arrayBuffer());



        // 2. Prepare Gain Map JPEG (Solid White = Max Boost)
        // We'll scale it down slightly for efficiency, standard practice
        const gmW = Math.max(1, Math.floor(sourceBitmap.width / 2));
        const gmH = Math.max(1, Math.floor(sourceBitmap.height / 2));
        const gmCanvas = document.createElement('canvas');
        gmCanvas.width = gmW;
        gmCanvas.height = gmH;
        const gmCtx = gmCanvas.getContext('2d');
        gmCtx.fillStyle = '#FFFFFF'; // All pixels = 1.0 (Mapped to GainMapMax)
        gmCtx.fillRect(0, 0, gmW, gmH);
        const gmBlob = await new Promise(r => gmCanvas.toBlob(r, 'image/jpeg', 0.8));
        const gmBytes = new Uint8Array(await gmBlob.arrayBuffer());

        // 3. Metadata Parameters (Log2 space)
        // Gain is linear multiplier (e.g., 5.0x). 
        // ISO 21496-1 uses log2 for Min/Max.
        // CORRECTION: Standard path treats gain=1.0 as 1000 nits.
        // GainMap applies multiplier to SDR Base (approx 203 nits).
        // Scaling Factor = (Gain * 1000) / 203.
        const sdrNits = 203;
        const targetNits = gain * 1000;
        const linearGain = targetNits / sdrNits;
        
        const logGain = Math.log2(Math.max(1, linearGain)); 
        
        const metadata = {
            gainMapMax: logGain,      // The Gain when Map Pixel is 1.0 (White)
            gainMapMin: 0.0,          // The Gain when Map Pixel is 0.0 (Black) -> 0 log2 = 1.0 linear
            mapGamma: 1.0,            // Linear mapping
            offsetSdr: 0.0,
            offsetHdr: 0.0,
            hdrCapacityMin: 0.0,
            hdrCapacityMax: Math.max(logGain, Math.log2(10)) // Claim at least 1000 nits capacity if requested is lower
        };

        // 4. Invoke Library
        log("Loading libultrahdr...");
        const lib = await getUltraHdr();
        
        log(`Embedding GainMap... Max Gain: ${gain.toFixed(1)}x (${logGain.toFixed(2)} log2)`);
        
        let result = lib.appendGainMap(
            exportCanvas.width, exportCanvas.height, // Width/Height of Final Container
            sdrBytes, sdrBytes.length,
            gmBytes, gmBytes.length,
            metadata.gainMapMax, metadata.gainMapMin, metadata.mapGamma, 
            metadata.offsetSdr, metadata.offsetHdr, 
            metadata.hdrCapacityMin, metadata.hdrCapacityMax
        );

        if (!result) throw new Error("Failed to generate Gain Map image.");

        // --- Hybrid Mode Injection (Post-Process) ---
        // Injecting AFTER generation ensures the library doesn't strip our custom APP2 logic.
        if (injectIccHex) {
            try {
                log("Hybrid Mode: Parsing custom ICC...");
                const rawIcc = await getRawIccFromHex(injectIccHex);
                if (rawIcc) {
                    log(`Extracted ICC Profile (${rawIcc.length} bytes). Creating APP2...`);
                    const app2 = createJpegApp2Marker(rawIcc);
                    // Inject into the FINAL Gain Map JPEG
                    result = injectApp2(result, app2);
                    log("Injected APP2 ICC Marker into Gain Map JPEG.");
                }
            } catch (e) {
                log("Hybrid Injection Failed: " + e.message);
                throw new Error("Hybrid Injection Failed: " + e.message);
            }
        }

        return result;
    }
