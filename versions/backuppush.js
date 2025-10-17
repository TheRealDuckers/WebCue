let cues = [];
    let currentCueIndex = 0;
    let audioCtx = null;
    let preset = null;


function renderCues() {
      const tbody = document.querySelector('#cueTable tbody');
      tbody.innerHTML = '';
      cues.forEach((cue, i) => {
        const row = document.createElement('tr');
        if (i === currentCueIndex) row.classList.add('active');
        else if (i === currentCueIndex + 1) row.classList.add('next');

        row.innerHTML = `
          <td><input type="text" value="${cue.number}" onchange="updateCue(${i}, 'number', this.value)" /></td>
          <td><input type="text" value="${cue.name}" onchange="updateCue(${i}, 'name', this.value)" /></td>
          <td><input type="text" value="${cue.notes}" onchange="updateCue(${i}, 'notes', this.value)" /></td>
          <td><input type="number" value="${cue.lightingFunctionId || ''}" onchange="updateCue(${i}, 'lightingFunctionId', parseInt(this.value) || null)" /></td>
          <td id="timer-${cue.id}">0:00</td>
          <td>
            <select onchange="updateCue(${i}, 'autoAdvance', this.value)">
              <option ${cue.autoAdvance === "Manual" ? "selected" : ""}>Manual</option>
              <option ${cue.autoAdvance === "Auto" ? "selected" : ""}>Auto</option>
            </select>
            <div class="fadebar" id="fade-${cue.id}"></div>
          </td>
        `;
        tbody.appendChild(row);
      });
    }

    
  let cues = [];
  let currentCueIndex = 0;

  function saveShow() {
    const showName = prompt("Enter show name:");
    if (!showName) return;

    const showData = cues.map(cue => ({
      name: cue.name,
      fileName: cue.fileName,
      notes: cue.notes,
      lightingFunctionId: cue.lightingFunctionId,
      autoAdvance: cue.autoAdvance
    }));

    localStorage.setItem(`webcue-show-${showName}`, JSON.stringify(showData));
    alert(`✅ Saved show "${showName}"`);
  }

  async function loadShow() {
    const showName = prompt("Enter show name to load:");
    const showDataRaw = localStorage.getItem(`webcue-show-${showName}`);
    if (!showDataRaw) {
      alert(`❌ No saved show named "${showName}"`);
      return;
    }

    const showData = JSON.parse(showDataRaw);
    const dirHandle = await window.showDirectoryPicker();

    const audioFiles = [];
    for await (const [name, handle] of dirHandle.entries()) {
      if (handle.kind === 'file' && name.match(/\.(mp3|wav|ogg)$/i)) {
        const file = await handle.getFile();
        audioFiles.push({ name, file });
      }
    }

    cues = [];
    for (const cueData of showData) {
      const match = audioFiles.find(f => f.name === cueData.fileName);
      if (!match) {
        console.warn(`⚠️ File not found: ${cueData.fileName}`);
        continue;
      }

      const url = URL.createObjectURL(match.file);
      const audio = new Audio(url);
      audio.crossOrigin = 'anonymous';

      const id = 'cue-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5);
      cues.push({
        id,
        audio,
        file: match.file,
        number: cues.length + 1,
        name: cueData.name,
        notes: cueData.notes,
        lightingFunctionId: cueData.lightingFunctionId,
        elapsed: 0,
        autoAdvance: cueData.autoAdvance,
        fileName: cueData.fileName
      });

      audio.addEventListener('ended', () => {
        if (cues[currentCueIndex].autoAdvance === "Auto") {
          goCue();
        } else {
          renderCues();
        }
      });
    }

    renderCues();
    alert(`📂 Loaded ${cues.length} cue${cues.length !== 1 ? 's' : ''} from "${showName}"`);
  }

        
 function addCues(files) {

  if (cues.length > 0 && cues[0].audio.src === "") {
    matchAudioFiles(files); // <-- your matching function
    console.log("🔍 matchAudioFiles called with", files.length, "files");
    return;
  }

 
  Array.from(files).forEach((file, i) => {
    const id = 'cue-' + Date.now() + '-' + i;
    const url = URL.createObjectURL(file);
    const audio = new Audio(url);
    audio.crossOrigin = 'anonymous';

    cues.push({
      id,
      audio,
      file,
      number: cues.length + 1,
      name: file.name.replace(/\.[^/.]+$/, ""),
      notes: "",
      lightingFunctionId: null,
      elapsed: 0,
      autoAdvance: "Manual",
      fileName: file.name
    });

    audio.addEventListener('ended', () => {
      if (cues[currentCueIndex].autoAdvance === "Auto") {
        goCue();
      } else {
        renderCues();
      }
    });
  });

  renderCues();
}

function matchAudioFiles(files) {
  let matched = 0;

  Array.from(files).forEach(file => {
    const name = file.name.trim().toLowerCase();
    const cue = cues.find(c => c.fileName && c.fileName.trim().toLowerCase() === name);

    if (cue) {
      const url = URL.createObjectURL(file);
      const audio = new Audio(url);
      audio.crossOrigin = 'anonymous';
      cue.audio = audio;
      cue.file = file;
      matched++;
      console.log(`✅ Matched: ${name}`);
    } else {
      console.warn(`❌ No match for: ${name}`);
    }
  });

  renderCues();
  updateAudioSyncPanel?.();
  showStatusMessage(`🎧 Matched ${matched} file${matched !== 1 ? 's' : ''}`);
}

    function renderCues() {
      const tbody = document.querySelector('#cueTable tbody');
      tbody.innerHTML = '';
      cues.forEach((cue, i) => {
        const row = document.createElement('tr');
        if (i === currentCueIndex) row.classList.add('active');
        else if (i === currentCueIndex + 1) row.classList.add('next');

        row.innerHTML = `
          <td><input type="text" value="${cue.number}" onchange="updateCue(${i}, 'number', this.value)" /></td>
          <td><input type="text" value="${cue.name}" onchange="updateCue(${i}, 'name', this.value)" /></td>
          <td><input type="text" value="${cue.notes}" onchange="updateCue(${i}, 'notes', this.value)" /></td>
          <td><input type="number" value="${cue.lightingFunctionId || ''}" onchange="updateCue(${i}, 'lightingFunctionId', parseInt(this.value) || null)" /></td>
          <td id="timer-${cue.id}">0:00</td>
          <td>
            <select onchange="updateCue(${i}, 'autoAdvance', this.value)">
              <option ${cue.autoAdvance === "Manual" ? "selected" : ""}>Manual</option>
              <option ${cue.autoAdvance === "Auto" ? "selected" : ""}>Auto</option>
            </select>
            <div class="fadebar" id="fade-${cue.id}"></div>
          </td>
        `;
        tbody.appendChild(row);
      });
    }

    function updateCue(index, field, value) {
      cues[index][field] = value;
    }

    function goCue() {
      const cue = cues[currentCueIndex];
      if (!cue) return;
      if (!audioCtx) audioCtx = new AudioContext();
      cue.audio.currentTime = 0;
      currentCueIndex = Math.min(currentCueIndex + 1, cues.length - 1);
      cue.audio.play();
      updateStatusBar();
      renderCues();
      if (cue.lightingFunctionId != null) {
        fetch('http://localhost:9999/qlcplusWS', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'selectFunction', id: cue.lightingFunctionId })
        });
      }
      renderCues();
    }

function fadeCue() {
  const cue = cues[currentCueIndex];
  if (!cue) return;

  const fadeBar = document.getElementById(`fade-${cue.id}`);
  fadeBar.style.transition = 'width 2s linear';
  fadeBar.style.width = '100%';

  if (!audioCtx) audioCtx = new AudioContext();

  // Hook up gain if not already connected
  if (!cue.filters?.gainNode) {
    const source = audioCtx.createMediaElementSource(cue.audio);
    const gain = audioCtx.createGain();
    source.connect(gain);
    gain.connect(audioCtx.destination);
    cue.filters = { gainNode: gain };
  }

  // Perform audio fade over 2 seconds
  const now = audioCtx.currentTime;
  cue.filters.gainNode.gain.cancelScheduledValues(now);
  cue.filters.gainNode.gain.setValueAtTime(1, now);
  cue.filters.gainNode.gain.linearRampToValueAtTime(0, now + 2);

  setTimeout(() => {
    cue.audio.pause();
    cue.audio.currentTime = 0;
    fadeBar.style.transition = 'none';
    fadeBar.style.width = '0%';
    renderCues();
  }, 2000);
}

    function stopAll() {
      cues.forEach(cue => {
        cue.audio.pause();
        cue.audio.currentTime = 0;
        const fader = document.getElementById(`fade-${cue.id}`);
        if (fader) fader.style.width = '0%';
      });
      currentCueIndex = 0;
      renderCues();
    }

    function updateStatusBar() {
      const bar = document.getElementById('statusBar');
      const cue = cues[currentCueIndex];
      const next = cues[currentCueIndex + 1];
      const statusParts = [];
    

      if (cue) {
        const name = cue.name || 'Unnamed Cue';
        const time = cue.audio?.currentTime || 0;
        const mins = Math.floor(time / 60);
        const secs = Math.floor(time % 60).toString().padStart(2, '0');
        statusParts.push(`🟢 GO: ${name} (${mins}:${secs})`);
        if (cue.lightingFunctionId != null) {
          statusParts.push(`💡 Lighting Cue: Function ${cue.lightingFunctionId}`);
        }
      }

      if (next) {
        const nextName = next.name || 'Unnamed';
        statusParts.push(`Next: ${nextName}`);
      }

      bar.textContent = statusParts.join(' — ');
    }

        setInterval(() => {
      cues.forEach(cue => {
        if (!cue.audio.paused) {
          cue.elapsed = Math.floor(cue.audio.currentTime);
          const timer = document.getElementById(`timer-${cue.id}`);
          if (timer) {
            const mins = Math.floor(cue.elapsed / 60);
            const secs = cue.elapsed % 60;
            timer.textContent = `${mins}:${secs.toString().padStart(2, '0')}`;
          }
        }
      });
      updateStatusBar();
    }, 500);
    
document.addEventListener('keydown', e => {
  // Skip global shortcuts if focus is on input or textarea
  const active = document.activeElement;
  const isTyping = active && (active.tagName === "INPUT" || active.tagName === "TEXTAREA");
  if (isTyping) return;

  // Spacebar GO
  if (e.code === 'Space') {
    e.preventDefault();
    goCue();
    renderCues();
  }

  // Arrows for cue selection
  if (e.code === 'ArrowUp') {
    e.preventDefault();
    currentCueIndex = Math.max(currentCueIndex - 1, 0);
    renderCues();
  }

  if (e.code === 'ArrowDown') {
    e.preventDefault();
    currentCueIndex = Math.min(currentCueIndex + 1, cues.length - 1);
    renderCues();
  }
});



  </script>
<script>
function showStatusMessage(message, duration = 3000) {
  const bar = document.getElementById("statusBar");
  bar.textContent = `${message}`;
  setTimeout(() => {
    bar.textContent = "Status: Ready"; // or whatever your default is
  }, duration);
}

document.querySelectorAll('#cueTable th').forEach((th, i) => {
  th.style.position = 'relative';
  const grip = document.createElement('div');
  grip.style.width = '5px';
  grip.style.height = '100%';
  grip.style.position = 'absolute';
  grip.style.top = '0';
  grip.style.right = '0';
  grip.style.cursor = 'col-resize';
  grip.addEventListener('mousedown', initDrag);
  th.appendChild(grip);

  function initDrag(e) {
    e.preventDefault();
    document.onmousemove = (ev) => {
      const newWidth = ev.clientX - th.getBoundingClientRect().left;
      document.querySelector(`#cueTable col:nth-child(${i + 1})`).style.width = newWidth + 'px';
    };
    document.onmouseup = () => {
      document.onmousemove = null;
      document.onmouseup = null;
    };
  }
});

function openSavePopup() {
  document.getElementById('savePopup').style.display = 'block';
}

function closeSavePopup() {
  document.getElementById('savePopup').style.display = 'none';
}

function confirmSavePopup() {
  const name = document.getElementById('popupShowName').value.trim();
  if (!name) return alert("⚠️ Enter a show name!");
  const data = JSON.stringify(cues.map(cue => ({
    number: cue.number,
    name: cue.name,
    notes: cue.notes,
    lightingFunctionId: cue.lightingFunctionId,
    autoAdvance: cue.autoAdvance,
    fileName: cue.file?.name
  })));
  localStorage.setItem(`cueShow_v3_${name}`, data);
  closeSavePopup();
  refreshShowDropdown();
  alert(`✅ Show "${name}" saved!`);
}

</script>
<script>
function openLoadPopup() {
  const select = document.getElementById("loadShowSelect");
  select.innerHTML = "";
  Object.keys(localStorage)
    .filter(k => k.startsWith("cueShow_v3_"))
    .forEach(k => {
      const opt = document.createElement("option");
      opt.value = k.replace("cueShow_v3_", "");
      opt.textContent = opt.value;
      select.appendChild(opt);
    });
  document.getElementById("loadPopup").style.display = "block";
}

function closeLoadPopup() {
  document.getElementById("loadPopup").style.display = "none";
}

function confirmLoadPopup() {
  const name = document.getElementById("loadShowSelect").value;
  const raw = localStorage.getItem(`cueShow_v3_${name}`);
  if (!raw) return alert("❌ Show not found.");
  const data = JSON.parse(raw);

  cues = data.map((cue, i) => ({
    id: 'cue-' + Date.now() + '-' + i,
    audio: new Audio(), // user must reimport manually
    file: null,
    elapsed: 0,
    ...cue
  }));

  currentCueIndex = 0;
  renderCues();
  closeLoadPopup();
  alert(`✅ Show "${name}" loaded!`);
}

document.addEventListener("DOMContentLoaded", () => {
  const name = sessionStorage.getItem("loadShowName");
  if (name) {
    sessionStorage.removeItem("loadShowName");
    confirmLoadFromVault(name);
  }
});

function confirmLoadFromVault(name) {
  const raw = localStorage.getItem(`cueShow_v3_${name}`);
  if (!raw) return showStatusMessage("❌ Show not found.");
  const data = JSON.parse(raw);
  cues = data.map((cue, i) => ({
    id: 'cue-' + Date.now() + '-' + i,
    audio: new Audio(),
    file: null,
    elapsed: 0,
    ...cue
  }));
  currentCueIndex = 0;
  renderCues();
  showStatusMessage(`✅ Loaded show "${name}"`);
}

function toggleFullscreen() {
  const elem = document.documentElement; // or any container element

  if (!document.fullscreenElement) {
    if (elem.requestFullscreen) {
      elem.requestFullscreen();
    } else if (elem.webkitRequestFullscreen) { // Safari
      elem.webkitRequestFullscreen();
    } else if (elem.msRequestFullscreen) { // IE
      elem.msRequestFullscreen();
    }
    showStatusMessage("🔎 Entering fullscreen...");
  } else {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    } else if (document.webkitExitFullscreen) {
      document.webkitExitFullscreen();
    } else if (document.msExitFullscreen) {
      document.msExitFullscreen();
    }
    showStatusMessage("🔙 Exiting fullscreen.");
  }
}
function testMsg(){
 showStatusMessage("Status Bar Test Sucsess!")
}
function admin(){
 showStatusMessage("Hello, You found the secret function!")
}

let touchStartX = null;

document.addEventListener("touchstart", e => {
  const touch = e.changedTouches[0];
  touchStartX = touch.screenX;
});

document.addEventListener("touchend", e => {
  if (touchStartX === null) return;

  const touchEndX = e.changedTouches[0].screenX;
  const diff = touchEndX - touchStartX;

  if (Math.abs(diff) > 50) {
    if (diff > 0) {
      goCue();
      showStatusMessage("➡️ Swipe GO triggered");
    } else {
      fadeCue?.(); // or stopAll();
      showStatusMessage("⬅️ Swipe FADE triggered");
    }
  }

  touchStartX = null;
});

</script>
<script>
  let folderFiles = [];
let selectedOrder = [];

async function openFolderPicker() {
  const dirHandle = await window.showDirectoryPicker();
  folderFiles = [];
  selectedOrder = [];

  for await (const [name, handle] of dirHandle.entries()) {
    if (handle.kind === 'file' && name.match(/\.(mp3|wav|ogg)$/i)) {
      folderFiles.push({ name, handle });
    }
  }

  const list = document.getElementById('folderFileList');
  list.innerHTML = '';
  folderFiles.forEach(({ name }) => {
    const li = document.createElement('li');
    li.innerHTML = `
      <label>
        <input type="checkbox" value="${name}" onchange="trackFolderSelection(this)" />
        ${name}
      </label>
    `;
    list.appendChild(li);
  });

  document.getElementById('folderModal').style.display = 'block';
}

function trackFolderSelection(checkbox) {
  const filename = checkbox.value;
  if (checkbox.checked) {
    selectedOrder.push(filename);
  } else {
    selectedOrder = selectedOrder.filter(f => f !== filename);
  }
}

function closeFolderModal() {
  document.getElementById('folderModal').style.display = 'none';
}

async function confirmFolderSelection() {
  document.getElementById('folderModal').style.display = 'none';

  for (const filename of selectedOrder) {
    const fileHandle = folderFiles.find(f => f.name === filename).handle;
    const file = await fileHandle.getFile();
    const url = URL.createObjectURL(file);
    const audio = new Audio(url);
    audio.crossOrigin = 'anonymous';

    const id = 'cue-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5);
    cues.push({
      id,
      audio,
      file,
      number: cues.length + 1,
      name: file.name.replace(/\.[^/.]+$/, ""),
      notes: "",
      lightingFunctionId: null,
      elapsed: 0,
      autoAdvance: "Manual",
      fileName: file.name
    });

    audio.addEventListener('ended', () => {
      if (cues[currentCueIndex].autoAdvance === "Auto") {
        goCue();
      } else {
        renderCues();
      }
    });
  }

  renderCues();
  showStatusMessage(`✅ Loaded ${selectedOrder.length} cue${selectedOrder.length !== 1 ? 's' : ''} from folder`);
}

</script>
  <script>
      let cues = [];
  let currentCueIndex = 0;

  function saveShow() {
    const showName = prompt("Enter show name:");
    if (!showName) return;

    const showData = cues.map(cue => ({
      name: cue.name,
      fileName: cue.fileName,
      notes: cue.notes,
      lightingFunctionId: cue.lightingFunctionId,
      autoAdvance: cue.autoAdvance
    }));

    localStorage.setItem(`webcue-show-${showName}`, JSON.stringify(showData));
    alert(`✅ Saved show "${showName}"`);
  }

  async function loadShow() {
    const showName = prompt("Enter show name to load:");
    const showDataRaw = localStorage.getItem(`webcue-show-${showName}`);
    if (!showDataRaw) {
      alert(`❌ No saved show named "${showName}"`);
      return;
    }

    const showData = JSON.parse(showDataRaw);
    const dirHandle = await window.showDirectoryPicker();

    const audioFiles = [];
    for await (const [name, handle] of dirHandle.entries()) {
      if (handle.kind === 'file' && name.match(/\.(mp3|wav|ogg)$/i)) {
        const file = await handle.getFile();
        audioFiles.push({ name, file });
      }
    }

    cues = [];
    for (const cueData of showData) {
      const match = audioFiles.find(f => f.name === cueData.fileName);
      if (!match) {
        console.warn(`⚠️ File not found: ${cueData.fileName}`);
        continue;
      }

      const url = URL.createObjectURL(match.file);
      const audio = new Audio(url);
      audio.crossOrigin = 'anonymous';

      const id = 'cue-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5);
      cues.push({
        id,
        audio,
        file: match.file,
        number: cues.length + 1,
        name: cueData.name,
        notes: cueData.notes,
        lightingFunctionId: cueData.lightingFunctionId,
        elapsed: 0,
        autoAdvance: cueData.autoAdvance,
        fileName: cueData.fileName
      });

      audio.addEventListener('ended', () => {
        if (cues[currentCueIndex].autoAdvance === "Auto") {
          goCue();
        } else {
          renderCues();
        }
      });
    }

    renderCues();
    alert(`📂 Loaded ${cues.length} cue${cues.length !== 1 ? 's' : ''} from "${showName}"`);
  }

  function saveShow() {
    const showName = prompt("Enter show name:");
    if (!showName) return;

    const showData = cues.map(cue => ({
      name: cue.name,
      fileName: cue.fileName,
      notes: cue.notes,
      lightingFunctionId: cue.lightingFunctionId,
      autoAdvance: cue.autoAdvance
    }));

    localStorage.setItem(`webcue-show-${showName}`, JSON.stringify(showData));
    alert(`✅ Saved show "${showName}"`);
  }

  async function loadShow() {
    const showName = prompt("Enter show name to load:");
    const showDataRaw = localStorage.getItem(`webcue-show-${showName}`);
    if (!showDataRaw) {
      alert(`❌ No saved show named "${showName}"`);
      return;
    }

    const showData = JSON.parse(showDataRaw);
    const dirHandle = await window.showDirectoryPicker();

    const audioFiles = [];
    for await (const [name, handle] of dirHandle.entries()) {
      if (handle.kind === 'file' && name.match(/\.(mp3|wav|ogg)$/i)) {
        const file = await handle.getFile();
        audioFiles.push({ name, file });
      }
    }

    cues = [];
    for (const cueData of showData) {
      const match = audioFiles.find(f => f.name === cueData.fileName);
      if (!match) {
        console.warn(`⚠️ File not found: ${cueData.fileName}`);
        continue;
      }

      const url = URL.createObjectURL(match.file);
      const audio = new Audio(url);
      audio.crossOrigin = 'anonymous';

      const id = 'cue-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5);
      cues.push({
        id,
        audio,
        file: match.file,
        number: cues.length + 1,
        name: cueData.name,
        notes: cueData.notes,
        lightingFunctionId: cueData.lightingFunctionId,
        elapsed: 0,
        autoAdvance: cueData.autoAdvance,
        fileName: cueData.fileName
      });

      audio.addEventListener('ended', () => {
        if (cues[currentCueIndex].autoAdvance === "Auto") {
          goCue();
        } else {
          renderCues();
        }
      });
    }

    renderCues();
    alert(`📂 Loaded ${cues.length} cue${cues.length !== 1 ? 's' : ''} from "${showName}"`);
  }

