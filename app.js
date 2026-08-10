const { FFmpeg } = FFmpegWASM;
const { fetchFile, toBlobURL } = FFmpegUtil;

let ffmpeg = null;

async function processVideo() {
  const inputEl = document.getElementById('video-input');
  const statusEl = document.getElementById('status');
  const downloadArea = document.getElementById('download-area');
  const btn = document.getElementById('process-btn');

  if (!inputEl.files[0]) {
    alert("একটি ভিডিও ফাইল সিলেক্ট করুন!");
    return;
  }

  const file = inputEl.files[0];
  btn.disabled = true;
  downloadArea.innerHTML = "";
  statusEl.innerText = "FFmpeg ইঞ্জিন লোড হচ্ছে... (প্রথমবার ৫-১০ সেকেন্ড লাগতে পারে)";

  try {
    if (!ffmpeg) {
      ffmpeg = new FFmpeg();
      // jsdelivr CDN - ফাস্ট ও মোবাইল ব্রাউজার ফ্রেন্ডলি
      const baseURL = 'https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.6/dist/umd';
      await ffmpeg.load({
        coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
        wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
      });
    }

    statusEl.innerText = "ভিডিও মেটাডাটা প্রসেস করা হচ্ছে...";
    await ffmpeg.writeFile('input.mp4', await fetchFile(file));

    // -c copy : ভিডিও re-encode হবে না (100% Quality same)
    // -map_metadata -1 : মেটাডাটা স্ট্রিপ করবে
    await ffmpeg.exec([
      '-i', 'input.mp4',
      '-c', 'copy',
      '-map_metadata', '-1',
      '-metadata', 'major_brand=isom',
      '-metadata', 'compatible_brands=isomiso2avc1mp41',
      'output.mp4'
    ]);

    statusEl.innerText = "প্রসেসিং সফলভাবে সম্পন্ন!";

    const data = await ffmpeg.readFile('output.mp4');
    const blob = new Blob([data.buffer], { type: 'video/mp4' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `maska_${file.name}`;
    a.innerText = "📥 প্রসেস করা ভিডিও ডাউনলোড করুন";
    a.className = "download-btn";
    
    downloadArea.appendChild(a);
  } catch (err) {
    console.error(err);
    statusEl.innerText = "এরর: " + (err.message || "ভিডিও প্রসেস করা যায়নি।");
  } finally {
    btn.disabled = false;
  }
}
