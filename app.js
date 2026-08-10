const { FFmpeg } = FFmpegWASM;
const { fetchFile, toBlobURL } = FFmpegUtil;

let ffmpeg = null;

async function loadFFmpeg() {
  const statusEl = document.getElementById('status');
  if (ffmpeg) return ffmpeg;

  statusEl.innerText = "FFmpeg ইঞ্জিনের ফাইল লোড হচ্ছে...";
  ffmpeg = new FFmpeg();

  const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';
  await ffmpeg.load({
    coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
    wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
  });

  statusEl.innerText = "ইঞ্জিন তৈরি!";
  return ffmpeg;
}

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

  try {
    const ff = await loadFFmpeg();
    
    statusEl.innerText = "ভিডিও প্রসেস করা হচ্ছে...";
    await ff.writeFile('input.mp4', await fetchFile(file));

    // -c copy : ভিডিও re-encode হবে না (100% Quality same)
    // -map_metadata -1 : আগের ফোন/ক্যামেরার মেটাডাটা মুছে দেবে
    await ff.exec([
      '-i', 'input.mp4',
      '-c', 'copy',
      '-map_metadata', '-1',
      '-metadata', 'major_brand=isom',
      '-metadata', 'compatible_brands=isomiso2avc1mp41',
      'output.mp4'
    ]);

    statusEl.innerText = "প্রসেসিং সম্পন্ন!";

    const data = await ff.readFile('output.mp4');
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
    statusEl.innerText = "ত্রুটি ঘটেছে! কনসোল চেক করুন।";
  } finally {
    btn.disabled = false;
  }
}
