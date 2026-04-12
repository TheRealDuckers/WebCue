let show = { name: 'Untitled Show', cues: [] };
let selectedCueIndex = -1;
let runningCueIndex = -1;
let nextCueIndex = 0;
let isLoaded = false;
let loadedCues = new Set();
let audioElements = {};
let videoElements = {};
let startTime = 0;
let prefs = { spaceFiresNext: true, autoAdvance: false, qlcUrl: '', oscHost: '', oscPort: 0, mobileView: false };
let deferredPrompt = null;

const cueList = document.getElementById('cueList');
const cueEmpty = document.getElementById('cueEmpty');
const cueCount = document.getElementById('cueCount');
const loadHint = document.getElementById('loadHint');
const editorEmpty = document.getElementById('editorEmpty');
const editorForm = document.getElementById('editorForm');
const editorFooter = document.getElementById('editorFooter');
const showNameInput = document.getElementById('showName');
const statusDot = document.getElementById('statusDot');
const statusText = document.getElementById('statusText');
const nextText = document.getElementById('nextText');
const statusNotes = document.getElementById('statusNotes');
const loadDot = document.getElementById('loadDot');
const loadText = document.getElementById('loadText');
const statusTime = document.getElementById('statusTime');
const toast = document.getElementById('toast');

const cueColors = { green: '#6ee6a0', red: '#e64c4c', yellow: '#e6d14c', blue: '#4c8ce6', purple: '#8c4ce6', teal: '#4ce68c', orange: '#e68c4c' };

function hideStartup() {
    document.getElementById('startupScreen').classList.add('hidden');
    document.getElementById('mainApp').style.display = 'flex';
}

function init() {
    loadPrefs();
    loadFromLocalStorage();
    renderCueList();
    setupEventListeners();
    setupKeyboardShortcuts();
    setupPWA();
    checkMobileView();
    showStartupScreen();
}

function checkMobileView() {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    if (isMobile || prefs.mobileView) {
        document.getElementById('btnMobileView').textContent = 'OPEN MOBILE VIEW';
    }
}

function openMobileView() {
    window.location.href = 'mobile.html';
}

function showStartupScreen() {
    if (show.cues.length > 0) hideStartup();
}

function loadPrefs() {
    try { const saved = localStorage.getItem('webcue-prefs'); if (saved) prefs = { ...prefs, ...JSON.parse(saved) }; } catch (e) {}
    document.getElementById('settingNextCue').checked = prefs.spaceFiresNext;
    document.getElementById('settingAutoAdvance').checked = prefs.autoAdvance;
    document.getElementById('settingQlcUrl').value = prefs.qlcUrl || '';
    document.getElementById('settingOscHost').value = prefs.oscHost || 'localhost';
    document.getElementById('settingOscPort').value = prefs.oscPort || 8000;
    document.getElementById('settingMobileView').checked = prefs.mobileView || false;
}

function savePrefs() {
    prefs.spaceFiresNext = document.getElementById('settingNextCue').checked;
    prefs.autoAdvance = document.getElementById('settingAutoAdvance').checked;
    prefs.qlcUrl = document.getElementById('settingQlcUrl').value;
    prefs.oscHost = document.getElementById('settingOscHost').value;
    prefs.oscPort = parseInt(document.getElementById('settingOscPort').value) || 8000;
    prefs.mobileView = document.getElementById('settingMobileView').checked;
    localStorage.setItem('webcue-prefs', JSON.stringify(prefs));
    showToast('SETTINGS SAVED');
}

async function loadShow() {
    const mediaCues = show.cues.filter(c => (c.type === 'audio' || c.type === 'video') && c.fileData);
    if (mediaCues.length === 0) { showToast('NO MEDIA TO LOAD'); return; }
    loadedCues.clear(); isLoaded = false;
    let loaded = 0; const total = mediaCues.length;
    for (const cue of mediaCues) {
        const index = show.cues.indexOf(cue);
        try {
            const el = cue.type === 'audio' ? new Audio() : document.createElement('video');
            el.preload = 'auto'; el.src = cue.fileData;
            await new Promise(r => setTimeout(r, 50));
            if (cue.type === 'audio') audioElements[index] = el;
            else { el.style.display = 'none'; document.body.appendChild(el); videoElements[index] = el; }
            loadedCues.add(index);
        } catch (e) {}
        loaded++;
    }
    isLoaded = true;
    loadDot.classList.add('loaded');
    loadText.textContent = `LOADED (${loaded}/${total})`;
    renderCueList(); showToast('SHOW LOADED');
}

function setupPWA() {
    window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); deferredPrompt = e; document.getElementById('installPrompt').classList.add('show'); });
    document.getElementById('btnInstall').addEventListener('click', async () => { if (deferredPrompt) { deferredPrompt.prompt(); await deferredPrompt.userChoice; deferredPrompt = null; document.getElementById('installPrompt').classList.remove('show'); } });
}

function setupEventListeners() {
    document.getElementById('btnGo').addEventListener('click', goCue);
    document.getElementById('btnFade').addEventListener('click', fadeOutCue);
    document.getElementById('btnStop').addEventListener('click', stopCue);
    document.getElementById('btnPanic').addEventListener('click', panic);
    document.getElementById('btnLoad').addEventListener('click', loadShow);
    document.getElementById('btnAddCue').addEventListener('click', addCue);
    document.getElementById('btnDuplicate').addEventListener('click', duplicateCue);
    document.getElementById('btnDeleteCue').addEventListener('click', deleteCue);
    document.getElementById('btnNew').addEventListener('click', () => document.getElementById('newShowModal').classList.add('active'));
    document.getElementById('btnOpen').addEventListener('click', () => document.getElementById('fileInput').click());
    document.getElementById('btnSave').addEventListener('click', saveShow);
    document.getElementById('btnSettings').addEventListener('click', () => document.getElementById('settingsModal').classList.add('active'));
    document.getElementById('settingsClose').addEventListener('click', () => document.getElementById('settingsModal').classList.remove('active'));
    document.getElementById('settingsSave').addEventListener('click', () => { savePrefs(); document.getElementById('settingsModal').classList.remove('active'); });
    document.getElementById('qlcTestBtn').addEventListener('click', testQlcConnection);
    document.getElementById('qlcBlackoutBtn').addEventListener('click', qlcBlackout);
    document.getElementById('btnMobileView').addEventListener('click', openMobileView);
    document.getElementById('newShowClose').addEventListener('click', () => document.getElementById('newShowModal').classList.remove('active'));
    document.getElementById('newShowCancel').addEventListener('click', () => document.getElementById('newShowModal').classList.remove('active'));
    document.getElementById('newShowConfirm').addEventListener('click', newShow);
    showNameInput.addEventListener('input', e => { show.name = e.target.value; saveToLocalStorage(); });

    ['cueName', 'cueType', 'cueDuration', 'cueFadeIn', 'cueFadeOut', 'cueVolume', 'cueCommand', 'cueNotes', 'qlcUniverse', 'qlcChannel', 'qlcValues', 'cueGoTo'].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('input', () => {
                updateSelectedCue();
                if (id === 'cueVolume') document.getElementById('volumeDisplay').textContent = el.value + '%';
                if (id === 'cueNotes') updateNotesDisplay();
            });
        }
    });

    document.getElementById('cueType').addEventListener('change', e => {
        const fileGroup = document.getElementById('fileGroup');
        const commandGroup = document.getElementById('commandGroup');
        const qlcGroup = document.getElementById('qlcGroup');
        fileGroup.style.display = 'none'; commandGroup.style.display = 'none'; qlcGroup.style.display = 'none';
        if (e.target.value === 'audio' || e.target.value === 'video') fileGroup.style.display = 'block';
        else if (e.target.value === 'command') commandGroup.style.display = 'block';
        else if (e.target.value === 'qlc') qlcGroup.style.display = 'block';
        updateSelectedCue();
    });

    document.getElementById('cueFile').addEventListener('change', e => {
        const file = e.target.files[0];
        if (file) {
            document.getElementById('fileDisplay').textContent = file.name.substring(0, 24);
            if (selectedCueIndex >= 0) {
                const reader = new FileReader();
                reader.onload = ev => {
                    show.cues[selectedCueIndex].fileData = ev.target.result;
                    isLoaded = false; loadedCues.clear(); loadDot.classList.remove('loaded'); loadText.textContent = 'NOT LOADED'; saveToLocalStorage();
                };
                reader.readAsDataURL(file);
            }
        }
    });

    document.getElementById('colorPicker').addEventListener('click', e => {
        if (e.target.classList.contains('color-badge')) {
            document.querySelectorAll('.color-badge').forEach(b => b.classList.remove('selected'));
            e.target.classList.add('selected');
            updateSelectedCue();
        }
    });

    document.getElementById('fileInput').addEventListener('change', e => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = ev => {
                try {
                    show = JSON.parse(ev.target.result);
                    showNameInput.value = show.name;
                    selectedCueIndex = -1; runningCueIndex = -1; isLoaded = false;
                    audioElements = {}; videoElements = {}; loadedCues.clear();
                    loadDot.classList.remove('loaded'); loadText.textContent = 'NOT LOADED';
                    renderCueList(); saveToLocalStorage(); hideStartup(); showToast('SHOW LOADED');
                } catch (err) { showToast('ERROR LOADING FILE'); }
            };
            reader.readAsText(file);
        }
    });
}

function setupKeyboardShortcuts() {
    document.addEventListener('keydown', e => {
        if (document.getElementById('mainApp').style.display === 'none') return;
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

        if (e.code === 'Space') {
            e.preventDefault();
            goCue();
        }
        else if (e.code === 'Escape') {
            e.preventDefault();
            stopCue();
        }
        else if (e.code === 'KeyF') {
            e.preventDefault();
            fadeOutCue();
        }
        else if (e.code === 'Escape' && e.shiftKey) {
            e.preventDefault();
            panic();
        }
        else if (e.code === 'ArrowDown') {
            e.preventDefault();
            if (selectedCueIndex < show.cues.length - 1) {
                selectedCueIndex++;
                renderCueList();
                loadCueIntoEditor();
                scrollToSelected();
            }
        }
        else if (e.code === 'ArrowUp') {
            e.preventDefault();
            if (selectedCueIndex > 0) {
                selectedCueIndex--;
                renderCueList();
                loadCueIntoEditor();
                scrollToSelected();
            }
        }
        else if (e.code === 'Enter' && selectedCueIndex >= 0) {
            e.preventDefault();
            fireCue(selectedCueIndex);
        }
        else if (e.code === 'Delete' && selectedCueIndex >= 0) {
            e.preventDefault();
            deleteCue();
        }
    });
}

function scrollToSelected() {
    const items = cueList.querySelectorAll('.cue-item');
    if (items[selectedCueIndex]) {
        items[selectedCueIndex].scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
}

function addCue() {
    show.cues.push({
        id: Date.now(),
        name: `Cue ${show.cues.length + 1}`,
        type: 'audio',
        duration: 0,
        fadeIn: 0,
        fadeOut: 0,
        volume: 100,
        notes: '',
        fileData: null,
        qlcUniverse: 0,
        qlcChannel: 1,
        qlcValues: '',
        goTo: 0,
        color: 'green'
    });
    selectedCueIndex = show.cues.length - 1;
    renderCueList(); loadCueIntoEditor(); saveToLocalStorage(); showToast('CUE ADDED');
    scrollToSelected();
}

function duplicateCue() { if (selectedCueIndex < 0) return; const cue = JSON.parse(JSON.stringify(show.cues[selectedCueIndex])); cue.id = Date.now(); cue.name = cue.name + ' copy'; show.cues.splice(selectedCueIndex + 1, 0, cue); selectedCueIndex++; renderCueList(); loadCueIntoEditor(); saveToLocalStorage(); }

function deleteCue() {
    if (selectedCueIndex < 0) return;
    const index = selectedCueIndex;
    show.cues.splice(index, 1);
    if (audioElements[index]) delete audioElements[index];
    if (videoElements[index]) { videoElements[index].remove(); delete videoElements[index]; }
    loadedCues.delete(index);
    selectedCueIndex = Math.min(selectedCueIndex, show.cues.length - 1);
    renderCueList(); loadCueIntoEditor(); saveToLocalStorage(); showToast('CUE DELETED');
}

function updateSelectedCue() {
    if (selectedCueIndex < 0) return;
    const cue = show.cues[selectedCueIndex];
    cue.name = document.getElementById('cueName').value;
    cue.type = document.getElementById('cueType').value;
    cue.duration = parseFloat(document.getElementById('cueDuration').value) || 0;
    cue.fadeIn = parseFloat(document.getElementById('cueFadeIn').value) || 0;
    cue.fadeOut = parseFloat(document.getElementById('cueFadeOut').value) || 0;
    cue.volume = parseInt(document.getElementById('cueVolume').value) || 100;
    cue.command = document.getElementById('cueCommand').value;
    cue.notes = document.getElementById('cueNotes').value;
    cue.qlcUniverse = parseInt(document.getElementById('qlcUniverse').value) || 0;
    cue.qlcChannel = parseInt(document.getElementById('qlcChannel').value) || 1;
    cue.qlcValues = document.getElementById('qlcValues').value;
    cue.goTo = parseInt(document.getElementById('cueGoTo').value) || 0;
    const selectedColor = document.querySelector('.color-badge.selected');
    if (selectedColor) cue.color = selectedColor.dataset.color;
    renderCueList(); updateNotesDisplay(); saveToLocalStorage();
}

function updateNotesDisplay() {
    if (selectedCueIndex >= 0 && show.cues[selectedCueIndex].notes) {
        statusNotes.textContent = show.cues[selectedCueIndex].notes;
    } else {
        statusNotes.textContent = '';
    }
}

function goCue() {
    let targetIndex = -1;
    
    if (selectedCueIndex >= 0) {
        targetIndex = selectedCueIndex;
    }
    else if (show.cues.length > 0) {
        targetIndex = 0;
        selectedCueIndex = 0;
    }
    
    if (targetIndex >= 0 && targetIndex < show.cues.length) {
        fireCue(targetIndex);
        
        nextCueIndex = targetIndex + 1;
        selectedCueIndex = nextCueIndex;
        
        if (selectedCueIndex >= show.cues.length) {
            selectedCueIndex = show.cues.length - 1;
        }
        
        renderCueList();
    }
}

function fadeOutCue() {
    if (runningCueIndex >= 0) {
        const cue = show.cues[runningCueIndex];
        if (cue.type === 'audio' && audioElements[runningCueIndex]) {
            const audio = audioElements[runningCueIndex];
            const fadeDuration = cue.fadeOut || 2;
            if (fadeDuration > 0 && audio.volume > 0) {
                const startVol = audio.volume;
                const steps = 20;
                const interval = (fadeDuration * 1000) / steps;
                const decrement = startVol / steps;
                let current = startVol;
                const fadeInterval = setInterval(() => {
                    current -= decrement;
                    if (current <= 0) { audio.volume = 0; clearInterval(fadeInterval); showToast('FADE COMPLETE'); }
                    else { audio.volume = current; }
                }, interval);
            }
        }
        runningCueIndex = -1;
        renderCueList(); updateStatus(); updateNotesDisplay();
    }
    showToast('FADE OUT');
}

function fireCue(index) {
    stopCue();
    const cue = show.cues[index];
    if (!cue) return;
    runningCueIndex = index;
    nextCueIndex = cue.goTo > 0 ? cue.goTo - 1 : index + 1;
    startTime = Date.now();
    renderCueList(); updateStatus(); updateNextCueInfo(); updateNotesDisplay();
    if (cue.type === 'audio' || cue.type === 'video') {
        if (cue.fileData) cue.type === 'audio' ? playPreloadedAudio(index, cue) : playPreloadedVideo(index, cue);
        else { showToast('NO FILE'); runningCueIndex = -1; renderCueList(); updateStatus(); }
    } else if (cue.type === 'wait') {
        setTimeout(() => { runningCueIndex = -1; renderCueList(); updateStatus(); updateNotesDisplay(); if (prefs.autoAdvance && nextCueIndex < show.cues.length && nextCueIndex >= 0) setTimeout(goCue, 50); }, cue.duration * 1000);
    } else if (cue.type === 'command') {
        if (cue.command) fetch(cue.command, { mode: 'no-cors' }).catch(() => {}).finally(() => { runningCueIndex = -1; renderCueList(); updateStatus(); });
    } else if (cue.type === 'qlc') {
        sendQlc(cue); runningCueIndex = -1; renderCueList(); updateStatus();
        if (prefs.autoAdvance && nextCueIndex < show.cues.length && nextCueIndex >= 0) setTimeout(goCue, 50);
    }
    sendOsc(index, cue);
}

function playPreloadedAudio(index, cue) {
    const audio = audioElements[index];
    if (!audio) { showToast('NOT LOADED'); runningCueIndex = -1; renderCueList(); updateStatus(); return; }
    audio.currentTime = 0; audio.volume = cue.volume / 100;
    audio.play().catch(() => showToast('PLAY ERROR'));
    audio.onended = () => { runningCueIndex = -1; renderCueList(); updateStatus(); updateNotesDisplay(); if (prefs.autoAdvance && nextCueIndex < show.cues.length && nextCueIndex >= 0) setTimeout(goCue, 50); };
}

function playPreloadedVideo(index, cue) {
    const video = videoElements[index];
    if (!video) { showToast('NOT LOADED'); runningCueIndex = -1; renderCueList(); updateStatus(); return; }
    video.style.position = 'fixed'; video.style.top = '0'; video.style.left = '0'; video.style.width = '100%'; video.style.height = '100%'; video.style.objectFit = 'contain'; video.style.background = '#000'; video.style.zIndex = '999';
    video.currentTime = 0; video.volume = cue.volume / 100;
    video.play().catch(() => showToast('PLAY ERROR'));
    video.onended = () => { video.style.display = 'none'; video.style.position = 'static'; runningCueIndex = -1; renderCueList(); updateStatus(); if (prefs.autoAdvance && nextCueIndex < show.cues.length && nextCueIndex >= 0) setTimeout(goCue, 50); };
}

function sendQlc(cue) {
    if (!prefs.qlcUrl) return;
    const values = cue.qlcValues.split(',').map(v => parseInt(v.trim()) || 0);
    const startChannel = (cue.qlcUniverse * 512) + (cue.qlcChannel - 1);
    const dmxData = new Uint8Array(513);
    values.forEach((v, i) => { if (startChannel + i < 513) dmxData[startChannel + i] = v; });
    fetch(prefs.qlcUrl + '/dmx', { method: 'POST', headers: { 'Content-Type': 'application/octet-stream' }, body: dmxData }).catch(() => {});
}

function sendOsc(index, cue) {
    if (!prefs.oscHost || !prefs.oscPort) return;
    const data = { cue: index + 1, name: cue.name, type: cue.type };
    fetch(`http://${prefs.oscHost}:${prefs.oscPort}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }).catch(() => {});
}

function testQlcConnection() {
    if (!prefs.qlcUrl) { showToast('CONFIG URL FIRST'); return; }
    fetch(prefs.qlcUrl + '/version', { mode: 'no-cors' })
        .then(() => { document.getElementById('qlcStatusDot').classList.add('connected'); showToast('QLC+ OK'); })
        .catch(() => { document.getElementById('qlcStatusDot').classList.remove('connected'); showToast('QLC+ FAIL'); });
}

function qlcBlackout() {
    if (!prefs.qlcUrl) { showToast('CONFIG URL FIRST'); return; }
    fetch(prefs.qlcUrl + '/dmx', { method: 'POST', body: new Uint8Array(513) }).catch(() => {});
    showToast('BLACKOUT');
}

function stopCue() {
    Object.values(audioElements).forEach(a => { a.pause(); a.currentTime = 0; });
    Object.values(videoElements).forEach(v => { v.pause(); v.style.display = 'none'; v.style.position = 'static'; });
    runningCueIndex = -1; renderCueList(); updateStatus(); statusNotes.textContent = '';
}

function panic() {
    stopCue();
    if (prefs.qlcUrl) fetch(prefs.qlcUrl + '/dmx', { method: 'POST', body: new Uint8Array(513) }).catch(() => {});
    showToast('PANIC - ALL STOPPED');
}

function renderCueList() {
    cueCount.textContent = `(${show.cues.length})`;
    if (show.cues.length === 0) { cueEmpty.style.display = 'flex'; loadHint.style.display = 'none'; cueList.querySelectorAll('.cue-item').forEach(el => el.remove()); return; }
    
    if (!isLoaded && show.cues.some(c => c.type === 'audio' || c.type === 'video')) {
        loadHint.style.display = 'block';
    } else {
        loadHint.style.display = 'none';
    }
    
    cueEmpty.style.display = 'none'; cueList.querySelectorAll('.cue-item').forEach(el => el.remove());
    const types = { audio: 'A', video: 'V', wait: 'W', command: 'C', qlc: 'D', group: 'G' };
    show.cues.forEach((cue, index) => {
        const item = document.createElement('div');
        item.className = 'cue-item';
        if (index === selectedCueIndex) item.classList.add('selected');
        if (index === runningCueIndex) item.classList.add('running');
        if (index === nextCueIndex && runningCueIndex < 0) item.classList.add('next');
        if (isLoaded && loadedCues.has(index)) item.classList.add('loaded');
        if (cue.color && cue.color !== 'green') item.style.borderLeftColor = cueColors[cue.color];
        
        let durationStr = '';
        if (cue.duration > 0) {
            durationStr = cue.duration + 's';
        }
        
        const desc = cue.notes ? `— ${cue.notes.substring(0, 30)}${cue.notes.length > 30 ? '...' : ''}` : '';
        
        item.innerHTML = `<span class="cue-number">${String(index + 1).padStart(2, '0')}</span><span class="cue-type">${types[cue.type] || '?'}</span><span class="cue-name">${cue.name}</span><span class="cue-desc">${desc}</span><span class="cue-duration">${durationStr}</span>`;
        
        item.addEventListener('click', () => { selectedCueIndex = index; renderCueList(); loadCueIntoEditor(); });
        item.addEventListener('dblclick', () => { selectedCueIndex = index; fireCue(index); });
        cueList.appendChild(item);
    });
}

function loadCueIntoEditor() {
    if (selectedCueIndex < 0) { editorEmpty.style.display = 'flex'; editorForm.style.display = 'none'; editorFooter.style.display = 'none'; statusNotes.textContent = ''; return; }
    const cue = show.cues[selectedCueIndex];
    editorEmpty.style.display = 'none'; editorForm.style.display = 'block'; editorFooter.style.display = 'block';
    document.getElementById('cueName').value = cue.name;
    document.getElementById('cueType').value = cue.type;
    document.getElementById('cueDuration').value = cue.duration || '';
    document.getElementById('cueFadeIn').value = cue.fadeIn || '';
    document.getElementById('cueFadeOut').value = cue.fadeOut || '';
    document.getElementById('cueVolume').value = cue.volume || 100;
    document.getElementById('volumeDisplay').textContent = (cue.volume || 100) + '%';
    document.getElementById('cueCommand').value = cue.command || '';
    document.getElementById('cueNotes').value = cue.notes || '';
    document.getElementById('qlcUniverse').value = cue.qlcUniverse || 0;
    document.getElementById('qlcChannel').value = cue.qlcChannel || 1;
    document.getElementById('qlcValues').value = cue.qlcValues || '';
    document.getElementById('cueGoTo').value = cue.goTo || '';
    document.getElementById('fileDisplay').textContent = cue.fileData ? 'File loaded' : 'Select file...';
    const fileGroup = document.getElementById('fileGroup');
    const commandGroup = document.getElementById('commandGroup');
    const qlcGroup = document.getElementById('qlcGroup');
    fileGroup.style.display = 'none'; commandGroup.style.display = 'none'; qlcGroup.style.display = 'none';
    if (cue.type === 'audio' || cue.type === 'video') fileGroup.style.display = 'block';
    else if (cue.type === 'command') commandGroup.style.display = 'block';
    else if (cue.type === 'qlc') qlcGroup.style.display = 'block';
    document.querySelectorAll('.color-badge').forEach(b => { b.classList.toggle('selected', b.dataset.color === cue.color); });
    updateNotesDisplay();
}

function updateStatus() { runningCueIndex >= 0 ? (statusDot.classList.add('active'), statusText.textContent = show.cues[runningCueIndex].name) : (statusDot.classList.remove('active'), statusText.textContent = 'READY'); }
function updateNextCueInfo() { nextText.textContent = nextCueIndex < show.cues.length && nextCueIndex >= 0 ? `NEXT: ${show.cues[nextCueIndex].name}` : ''; }
function saveToLocalStorage() { try { localStorage.setItem('webcue-show', JSON.stringify(show)); } catch (e) {} }
function loadFromLocalStorage() { try { const saved = localStorage.getItem('webcue-show'); if (saved) { show = JSON.parse(saved); showNameInput.value = show.name; } } catch (e) {} }

function newShow() {
    show = { name: 'Untitled Show', cues: [] }; showNameInput.value = show.name;
    selectedCueIndex = -1; runningCueIndex = -1; nextCueIndex = 0; isLoaded = false; loadedCues.clear();
    audioElements = {}; videoElements = {}; loadDot.classList.remove('loaded'); loadText.textContent = 'NOT LOADED';
    renderCueList(); loadCueIntoEditor(); saveToLocalStorage(); document.getElementById('newShowModal').classList.remove('active'); 
    showToast('NEW SHOW'); hideStartup();
}

function openShow() { document.getElementById('fileInput').click(); }

function saveShow() { const blob = new Blob([JSON.stringify(show)], { type: 'application/json' }); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = (show.name || 'show') + '.json'; a.click(); showToast('SHOW SAVED'); }
function showToast(msg) { toast.textContent = msg; toast.classList.add('show'); setTimeout(() => toast.classList.remove('show'), 1800); }

setInterval(() => { 
    if (runningCueIndex >= 0) { 
        const cue = show.cues[runningCueIndex];
        const e = (Date.now() - startTime) / 1000; 
        statusTime.textContent = `${Math.floor(e / 60).toString().padStart(2, '0')}:${Math.floor(e % 60).toString().padStart(2, '0')}.${Math.floor((e % 1) * 100).toString().padStart(2, '0')}`;
        
        if (cue && cue.duration > 0) {
            const progress = Math.min((e / cue.duration) * 100, 100);
            const runningItems = cueList.querySelectorAll('.cue-item.running');
            runningItems.forEach(item => {
                const oldBar = item.querySelector('.progress-bar');
                if (oldBar) oldBar.remove();
                const bar = document.createElement('div');
                bar.className = 'progress-bar';
                bar.style.cssText = 'position: absolute; left: 0; top: 0; bottom: 0; background: var(--qlab-green); opacity: 0.25; z-index: 0; width: ' + progress + '%; transition: width 0.1s linear;';
                item.appendChild(bar);
            });
        }
    } else { 
        statusTime.textContent = '00:00.00'; 
    } 
}, 50);

if ('serviceWorker' in navigator) navigator.serviceWorker.register('service-worker.js').catch(() => {});

init();