import type { Room } from "./room.js";

export function getHTML(room: Room): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,viewport-fit=cover">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="theme-color" content="#0b141a">
<title>${esc(room.name)} — hotmic</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
:root{--bg:#0b141a;--surface:#1a2730;--header:#1f2c34;--accent:#00a884;--accent2:#53bdeb;--text:#e9edef;--text2:#8696a0;--danger:#ef4444;--border:#2a3942}
body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;background:var(--bg);color:var(--text);height:100dvh;display:flex;flex-direction:column;overflow:hidden;-webkit-user-select:none;user-select:none}

.join-screen{display:flex;flex-direction:column;align-items:center;justify-content:center;height:100dvh;padding:24px;gap:16px}
.join-screen h1{font-size:24px;font-weight:600}
.join-screen h2{font-size:14px;color:var(--text2);font-weight:400}
.join-icon{margin-bottom:8px}
.join-input{width:100%;max-width:300px;padding:12px 16px;background:var(--surface);border:1px solid var(--border);border-radius:10px;color:var(--text);font-size:16px;outline:none}
.join-input:focus{border-color:var(--accent)}
.join-btn{width:100%;max-width:300px;padding:14px;background:var(--accent);color:#fff;border:none;border-radius:10px;font-size:16px;font-weight:600;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px}
.join-btn:active{opacity:0.8}
.join-btn svg{flex-shrink:0}
.join-error{color:var(--danger);font-size:13px;text-align:center}

.call-screen{display:none;flex-direction:column;height:100dvh}
.call-header{background:var(--header);padding:14px 16px;display:flex;align-items:center;justify-content:space-between;flex-shrink:0;border-bottom:1px solid var(--border)}
.call-header-left h1{font-size:17px;font-weight:600}
.call-header-left span{font-size:13px;color:var(--text2)}
.call-timer{font-size:13px;color:var(--accent);font-variant-numeric:tabular-nums;font-weight:500}

.participants{flex:1;display:flex;flex-wrap:wrap;align-items:center;justify-content:center;gap:28px;padding:24px;overflow-y:auto;align-content:center}

.peer{display:flex;flex-direction:column;align-items:center;gap:10px;width:110px}
.avatar-wrap{position:relative;width:92px;height:92px;display:flex;align-items:center;justify-content:center}
.avatar{width:72px;height:72px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:26px;font-weight:600;color:#fff;position:relative;z-index:1;transition:opacity .2s}
.avatar.muted{opacity:.45}
.avatar.offline{opacity:.25}

/* Voice visualizer ring */
.voice-ring{position:absolute;inset:0;z-index:2;pointer-events:none}

/* Subtle idle pulse for connected peers */
.pulse-ring{position:absolute;inset:-3px;border-radius:50%;border:2px solid var(--accent);opacity:0;z-index:0}
.peer.speaking .pulse-ring{display:none}

.peer-name{font-size:13px;color:var(--text2);text-align:center;max-width:110px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.you-badge{font-size:10px;color:var(--accent);font-weight:600}
.peer-status{font-size:11px;color:var(--text2);display:flex;align-items:center;gap:4px;height:16px}
.peer-status svg{flex-shrink:0}
.peer-status.muted{color:var(--danger)}
.peer-status.speaking{color:var(--accent)}

.controls{background:var(--header);padding:20px;display:flex;justify-content:center;gap:32px;flex-shrink:0;padding-bottom:max(20px,env(safe-area-inset-bottom));border-top:1px solid var(--border)}
.ctrl-btn{width:64px;height:64px;border-radius:50%;border:none;display:flex;align-items:center;justify-content:center;cursor:pointer;transition:all .15s}
.ctrl-btn:active{transform:scale(.9)}
.ctrl-btn svg{pointer-events:none}
.mute-btn{background:var(--surface);color:var(--text)}
.mute-btn.muted{background:var(--danger);color:#fff}
.leave-btn{background:var(--danger);color:#fff}

.banner{display:none;padding:8px;text-align:center;font-size:13px;background:#e8a317;color:#000;flex-shrink:0;font-weight:500}
</style>
</head>
<body>

<div class="join-screen" id="joinScreen">
  <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#00a884" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="join-icon"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="22"/></svg>
  <h1>${esc(room.name)}</h1>
  <h2>Voice room · up to ${room.maxParticipants} people</h2>
  ${room.password ? '<input class="join-input" id="passInput" type="password" placeholder="Room password" autocomplete="off">' : ''}
  <input class="join-input" id="nameInput" type="text" placeholder="Your name" autocomplete="off" maxlength="20">
  <button class="join-btn" id="joinBtn" onclick="doJoin()"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="22"/></svg> Join with mic</button>
  <div class="join-error" id="joinError"></div>
</div>

<div class="call-screen" id="callScreen">
  <div class="banner" id="banner">Reconnecting...</div>
  <div class="call-header">
    <div class="call-header-left">
      <h1>${esc(room.name)}</h1>
      <span id="headerMeta">Connecting...</span>
    </div>
    <div class="call-timer" id="callTimer">00:00</div>
  </div>
  <div class="participants" id="peers"></div>
  <div class="controls">
    <button class="ctrl-btn mute-btn" id="muteBtn" onclick="toggleMute()">
      <svg id="micIcon" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="22"/></svg>
    </button>
    <button class="ctrl-btn leave-btn" onclick="doLeave()">
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7 2 2 0 0 1 1.72 2v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 2.59 3.4Z"/></svg>
    </button>
  </div>
</div>

<script>
const ROOM_ID="${room.id}";
const ROOM_PASS=${room.password ? `"${esc(room.password)}"` : "null"};
const SVG_MIC='<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="22"/></svg>';
const SVG_MIC_OFF='<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="2" y1="2" x2="22" y2="22"/><path d="M18.89 13.23A7.12 7.12 0 0 0 19 12v-2"/><path d="M5 10v2a7 7 0 0 0 12 5"/><path d="M15 9.34V5a3 3 0 0 0-5.68-1.33"/><path d="M9 9v3a3 3 0 0 0 5.12 2.12"/><line x1="12" y1="19" x2="12" y2="22"/></svg>';

let ws,myName,myDeviceId,localStream,isMuted=false,intentionalClose=false;
let peers={};
let participants=[];
let callStart=0;
let timerInterval;
let voiceCanvases={};  // deviceId -> {canvas, ctx, animId}
let speakingLevels={};  // deviceId -> smoothed level 0-1

const STUN={iceServers:[{urls:"stun:stun.l.google.com:19302"},{urls:"stun:stun1.l.google.com:19302"}]};

function $$(id){return document.getElementById(id)}

function getDeviceId(){
  let id=localStorage.getItem("hotmic_device_id");
  if(!id){id=crypto.randomUUID();localStorage.setItem("hotmic_device_id",id)}
  return id;
}
function getSession(){try{return JSON.parse(localStorage.getItem("hotmic_session_"+ROOM_ID)||"null")}catch{return null}}
function saveSession(n,d){localStorage.setItem("hotmic_session_"+ROOM_ID,JSON.stringify({name:n,deviceId:d}))}
function clearSession(){localStorage.removeItem("hotmic_session_"+ROOM_ID)}

function esc(s){const d=document.createElement("div");d.textContent=s;return d.innerHTML}
function hashColor(name){
  let h=0;for(let i=0;i<name.length;i++)h=(h*31+name.charCodeAt(i))|0;
  const c=["#25d366","#53bdeb","#f472b6","#a78bfa","#34d399","#fbbf24","#fb923c","#f87171","#38bdf8","#818cf8"];
  return c[Math.abs(h)%c.length];
}

async function doJoin(){
  const name=$$("nameInput").value.trim();
  if(!name){$$("joinError").textContent="Enter your name";return}
  if(ROOM_PASS){const pass=$$("passInput")?.value;if(pass!==ROOM_PASS){$$("joinError").textContent="Wrong password";return}}

  $$("joinBtn").textContent="Connecting...";$$("joinBtn").disabled=true;

  try{
    localStream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true,autoGainControl:true}});
  }catch(e){
    $$("joinError").textContent="Microphone access denied. Check your browser settings.";
    $$("joinBtn").innerHTML=SVG_MIC+' Join with mic';$$("joinBtn").disabled=false;return;
  }

  myName=name;myDeviceId=getDeviceId();saveSession(myName,myDeviceId);
  $$("joinScreen").style.display="none";$$("callScreen").style.display="flex";
  callStart=Date.now();timerInterval=setInterval(updateTimer,1000);updateTimer();
  connectWS();
}

function connectWS(){
  const proto=location.protocol==="https:"?"wss:":"ws:";
  ws=new WebSocket(proto+"//"+location.host+"/room/"+ROOM_ID+"/ws");
  ws.onopen=()=>{$$("banner").style.display="none";ws.send(JSON.stringify({type:"join",name:myName,deviceId:myDeviceId}))};
  ws.onmessage=(e)=>{try{handleMsg(JSON.parse(e.data))}catch{}};
  ws.onclose=()=>{if(!intentionalClose){$$("banner").style.display="block";setTimeout(connectWS,1500)}};
  ws.onerror=()=>{};
}

function handleMsg(msg){
  switch(msg.type){
    case "joined":
      participants=msg.participants;renderPeers();
      for(const p of msg.participants){if(p.deviceId!==myDeviceId&&p.online)createPeerConnection(p.deviceId,true)}
      break;
    case "peer_joined":case "peer_reconnected":
      participants=msg.participants;renderPeers();break;
    case "peer_left":case "peer_offline":
      participants=msg.participants;
      if(peers[msg.deviceId]){peers[msg.deviceId].pc.close();delete peers[msg.deviceId]}
      delete speakingLevels[msg.deviceId];renderPeers();break;
    case "peer_muted":participants=msg.participants;renderPeers();break;
    case "peer_speaking":
      const pr=participants.find(p=>p.deviceId===msg.deviceId);
      if(pr)pr.speaking=msg.speaking;renderPeers();break;
    case "offer":handleOffer(msg);break;
    case "answer":handleAnswer(msg);break;
    case "ice-candidate":handleIceCandidate(msg);break;
    case "room_closed":intentionalClose=true;clearSession();alert("Room closed");location.reload();break;
  }
}

function createPeerConnection(targetDeviceId,initiator){
  if(peers[targetDeviceId])peers[targetDeviceId].pc.close();
  const pc=new RTCPeerConnection(STUN);
  const pd={pc,stream:null,analyser:null,audioCtx:null};
  peers[targetDeviceId]=pd;
  if(localStream)for(const t of localStream.getTracks())pc.addTrack(t,localStream);

  pc.ontrack=(e)=>{
    const stream=e.streams[0];pd.stream=stream;
    const audio=document.createElement("audio");audio.srcObject=stream;audio.autoplay=true;audio.playsInline=true;audio.play().catch(()=>{});
    try{const ctx=new AudioContext();const src=ctx.createMediaStreamSource(stream);const an=ctx.createAnalyser();an.fftSize=256;an.smoothingTimeConstant=0.7;src.connect(an);pd.analyser=an;pd.audioCtx=ctx}catch{}
  };

  pc.onicecandidate=(e)=>{if(e.candidate)ws.send(JSON.stringify({type:"ice-candidate",target:targetDeviceId,candidate:e.candidate}))};
  pc.oniceconnectionstatechange=()=>{if(pc.iceConnectionState==="failed"||pc.iceConnectionState==="disconnected")renderPeers()};

  if(initiator){pc.createOffer().then(o=>{pc.setLocalDescription(o);ws.send(JSON.stringify({type:"offer",target:targetDeviceId,sdp:o}))})}
  return pc;
}

async function handleOffer(msg){const pc=createPeerConnection(msg.from,false);await pc.setRemoteDescription(new RTCSessionDescription(msg.sdp));const a=await pc.createAnswer();await pc.setLocalDescription(a);ws.send(JSON.stringify({type:"answer",target:msg.from,sdp:a}))}
async function handleAnswer(msg){const p=peers[msg.from];if(p)await p.pc.setRemoteDescription(new RTCSessionDescription(msg.sdp))}
function handleIceCandidate(msg){const p=peers[msg.from];if(p&&msg.candidate)p.pc.addIceCandidate(new RTCIceCandidate(msg.candidate)).catch(()=>{})}

// Voice visualizer — draws audio bars in a ring around the avatar
function drawVoiceRing(deviceId){
  const vc=voiceCanvases[deviceId];
  if(!vc)return;
  const {canvas,ctx}=vc;
  const size=canvas.width;
  const cx=size/2,cy=size/2,r=size/2-8;

  ctx.clearRect(0,0,size,size);

  // Get audio level
  let level=0;
  if(deviceId===myDeviceId&&localAnalyser&&!isMuted){
    const data=new Uint8Array(localAnalyser.frequencyBinCount);
    localAnalyser.getByteFrequencyData(data);
    level=data.reduce((a,b)=>a+b,0)/(data.length*255);
  }else if(peers[deviceId]?.analyser){
    const data=new Uint8Array(peers[deviceId].analyser.frequencyBinCount);
    peers[deviceId].analyser.getByteFrequencyData(data);
    level=data.reduce((a,b)=>a+b,0)/(data.length*255);
  }

  // Smooth
  speakingLevels[deviceId]=(speakingLevels[deviceId]||0)*0.7+level*0.3;
  const sl=speakingLevels[deviceId];

  if(sl<0.02){vc.animId=requestAnimationFrame(()=>drawVoiceRing(deviceId));return}

  const p=participants.find(p=>p.deviceId===deviceId);
  const color=p?hashColor(p.name):'#00a884';

  // Draw frequency bars around the circle
  const bars=24;
  const barWidth=Math.PI*2/bars*0.6;

  // Get frequency data for bar heights
  let freqData=null;
  if(deviceId===myDeviceId&&localAnalyser&&!isMuted){
    freqData=new Uint8Array(localAnalyser.frequencyBinCount);localAnalyser.getByteFrequencyData(freqData);
  }else if(peers[deviceId]?.analyser){
    freqData=new Uint8Array(peers[deviceId].analyser.frequencyBinCount);peers[deviceId].analyser.getByteFrequencyData(freqData);
  }

  for(let i=0;i<bars;i++){
    const angle=(i/bars)*Math.PI*2-Math.PI/2;
    // Map bar to frequency bin
    const binIdx=Math.floor((i/bars)*((freqData?.length||64)/2));
    const val=freqData?freqData[binIdx]/255:sl;
    const barH=4+val*18;

    const x1=cx+Math.cos(angle)*(r-2);
    const y1=cy+Math.sin(angle)*(r-2);
    const x2=cx+Math.cos(angle)*(r-2+barH);
    const y2=cy+Math.sin(angle)*(r-2+barH);

    ctx.beginPath();
    ctx.moveTo(x1,y1);
    ctx.lineTo(x2,y2);
    ctx.strokeStyle=color;
    ctx.globalAlpha=0.4+val*0.6;
    ctx.lineWidth=3;
    ctx.lineCap='round';
    ctx.stroke();
    ctx.globalAlpha=1;
  }

  // Glow ring
  ctx.beginPath();
  ctx.arc(cx,cy,r-1,0,Math.PI*2);
  ctx.strokeStyle=color;
  ctx.globalAlpha=sl*0.5;
  ctx.lineWidth=2;
  ctx.stroke();
  ctx.globalAlpha=1;

  vc.animId=requestAnimationFrame(()=>drawVoiceRing(deviceId));
}

// Local speaking detection
let localAnalyser,localSpeaking=false;
function setupLocalSpeaking(){
  if(!localStream)return;
  try{const ctx=new AudioContext();const src=ctx.createMediaStreamSource(localStream);localAnalyser=ctx.createAnalyser();localAnalyser.fftSize=256;localAnalyser.smoothingTimeConstant=0.7;src.connect(localAnalyser)}catch{}
}

function checkSpeaking(){
  if(localAnalyser&&!isMuted){
    const data=new Uint8Array(localAnalyser.frequencyBinCount);
    localAnalyser.getByteFrequencyData(data);
    const avg=data.reduce((a,b)=>a+b,0)/data.length;
    const speaking=avg>15;
    if(speaking!==localSpeaking){
      localSpeaking=speaking;ws?.send(JSON.stringify({type:"speaking",speaking}));
      const me=participants.find(p=>p.deviceId===myDeviceId);
      if(me){me.speaking=speaking;renderPeers()}
    }
  }
  requestAnimationFrame(checkSpeaking);
}

function toggleMute(){
  isMuted=!isMuted;
  if(localStream)for(const t of localStream.getAudioTracks())t.enabled=!isMuted;
  $$("muteBtn").innerHTML=isMuted?SVG_MIC_OFF:SVG_MIC;
  $$("muteBtn").classList.toggle("muted",isMuted);
  ws?.send(JSON.stringify({type:"mute",muted:isMuted}));
  if(isMuted){localSpeaking=false;ws?.send(JSON.stringify({type:"speaking",speaking:false}));const me=participants.find(p=>p.deviceId===myDeviceId);if(me){me.speaking=false;renderPeers()}}
}

function doLeave(){
  if(!confirm("Leave this voice room?"))return;
  intentionalClose=true;ws?.send(JSON.stringify({type:"leave"}));ws?.close();
  if(localStream)localStream.getTracks().forEach(t=>t.stop());
  for(const p of Object.values(peers))p.pc.close();
  clearSession();clearInterval(timerInterval);location.reload();
}

function updateTimer(){
  const s=Math.floor((Date.now()-callStart)/1000);
  const m=Math.floor(s/60),sec=s%60;
  $$("callTimer").textContent=(m<10?"0":"")+m+":"+(sec<10?"0":"")+sec;
}

function renderPeers(){
  const el=$$("peers");
  const online=participants.filter(p=>p.online).length;
  $$("headerMeta").textContent=participants.length+" participant"+(participants.length!==1?"s":"")+" · "+online+" online";

  // Cancel old animations
  for(const [did,vc] of Object.entries(voiceCanvases)){
    if(vc.animId)cancelAnimationFrame(vc.animId);
  }
  voiceCanvases={};

  el.innerHTML=participants.map(p=>{
    const color=hashColor(p.name);
    const isMe=p.deviceId===myDeviceId;
    const cls=["avatar"];
    if(p.muted)cls.push("muted");
    if(!p.online)cls.push("offline");

    let statusHtml="";
    if(!p.online)statusHtml='<span class="peer-status"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg> offline</span>';
    else if(p.muted)statusHtml='<span class="peer-status muted"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="2" y1="2" x2="22" y2="22"/><path d="M18.89 13.23A7.12 7.12 0 0 0 19 12v-2"/><path d="M5 10v2a7 7 0 0 0 12 5"/><path d="M15 9.34V5a3 3 0 0 0-5.68-1.33"/></svg> muted</span>';

    return '<div class="peer'+(p.speaking&&!p.muted?' speaking':'')+'"><div class="avatar-wrap"><canvas class="voice-ring" id="vc-'+p.deviceId+'" width="184" height="184" style="width:92px;height:92px;position:absolute;inset:0"></canvas><div class="'+cls.join(" ")+'" style="background:'+color+'">'+esc(p.name[0].toUpperCase())+'</div></div><div class="peer-name">'+esc(p.name)+(isMe?' <span class="you-badge">(you)</span>':'')+'</div>'+statusHtml+'</div>';
  }).join("");

  // Start visualizers
  for(const p of participants){
    if(!p.online||p.muted)continue;
    const canvas=document.getElementById("vc-"+p.deviceId);
    if(!canvas)continue;
    const ctx=canvas.getContext("2d");
    voiceCanvases[p.deviceId]={canvas,ctx,animId:null};
    drawVoiceRing(p.deviceId);
  }
}

setTimeout(()=>{setupLocalSpeaking();checkSpeaking()},1000);

const existingSession=getSession();
if(existingSession){myName=existingSession.name;myDeviceId=existingSession.deviceId;$$("nameInput").value=myName;doJoin()}
</script>
</body>
</html>`;
}

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
