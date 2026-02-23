<!DOCTYPE html>
<html lang="ar">
<head>
<meta charset="UTF-8">
<title>Audio Splitter PRO</title>
<script src="https://cdnjs.cloudflare.com/ajax/libs/lamejs/1.2.0/lame.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/jszip/3.7.1/jszip.min.js"></script>
<style>
body{
    font-family: Arial;
    background: linear-gradient(135deg,#1e3c72,#2a5298);
    color:white;
    text-align:center;
    padding:40px;
    direction:rtl;
}
.container{
    background:white;
    color:#333;
    padding:30px;
    border-radius:15px;
    max-width:500px;
    margin:auto;
}
button{
    padding:10px 20px;
    background:#2a5298;
    color:white;
    border:none;
    border-radius:8px;
    cursor:pointer;
}
input{
    margin:15px 0;
}
</style>
</head>
<body>

<div class="container">
<h2>🎧 تقسيم ملف صوتي إلى 28 ثانية</h2>
<input type="file" id="audioInput" accept="audio/*"><br>
<button onclick="splitAudio()">تقسيم وتحميل ZIP</button>
<p id="status"></p>
</div>

<script>
async function splitAudio(){
    const file = document.getElementById("audioInput").files[0];
    if(!file){ alert("اختر ملف صوت"); return; }

    document.getElementById("status").innerText="جاري المعالجة...";

    const segmentDuration = 28;
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const arrayBuffer = await file.arrayBuffer();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

    const totalDuration = audioBuffer.duration;
    const numSegments = Math.ceil(totalDuration / segmentDuration);
    const zip = new JSZip();

    for(let i=0;i<numSegments;i++){
        const start = i * segmentDuration;
        const end = Math.min((i+1)*segmentDuration,totalDuration);

        const offlineContext = new OfflineAudioContext(
            1,
            (end-start)*audioBuffer.sampleRate,
            audioBuffer.sampleRate
        );

        const source = offlineContext.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(offlineContext.destination);
        source.start(0,start,end-start);

        const rendered = await offlineContext.startRendering();
        const mp3Blob = encodeMP3(rendered);
        zip.file(`part_${i+1}.mp3`, mp3Blob);
    }

    const content = await zip.generateAsync({type:"blob"});
    const link = document.createElement("a");
    link.href = URL.createObjectURL(content);
    link.download = "audio_segments.zip";
    link.click();

    document.getElementById("status").innerText="تم الانتهاء ✅";
}

function encodeMP3(audioBuffer){
    const samples = audioBuffer.getChannelData(0);
    const sampleRate = audioBuffer.sampleRate;
    const mp3encoder = new lamejs.Mp3Encoder(1, sampleRate, 128);
    const sampleBlockSize = 1152;
    let mp3Data = [];

    for(let i=0;i<samples.length;i+=sampleBlockSize){
        const sampleChunk = samples.subarray(i,i+sampleBlockSize);
        const mp3buf = mp3encoder.encodeBuffer(convertFloatToInt16(sampleChunk));
        if(mp3buf.length>0) mp3Data.push(mp3buf);
    }

    const mp3buf = mp3encoder.flush();
    if(mp3buf.length>0) mp3Data.push(mp3buf);

    return new Blob(mp3Data,{type:"audio/mp3"});
}

function convertFloatToInt16(buffer){
    let l = buffer.length;
    let buf = new Int16Array(l);
    while(l--){
        buf[l] = Math.min(1, buffer[l]) * 0x7FFF;
    }
    return buf;
}
</script>

</body>
</html>
