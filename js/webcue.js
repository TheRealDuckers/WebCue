let show = { name: 'Untitled Show', cues: [] };
let selectedCueIndex = -1;
let runningCueIndex = -1;
let nextCueIndex = 0;
let isLoaded = false;
let loadedCues = new Set();
let audioElements = {};
let videoElements = {};
let fileStore = {};
let startTime = 0;
let prefs = { spaceFiresNext: true, autoAdvance: false, autoSave: true, defaultCrossfade: false, qlcUrl: '', oscHost: '', oscPort: 0, mobileView: false, midiNote: 36, midiStop: 44, wsRemote: false, wsPort: 8080, compactMode: false, theme: 'green' };
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
const countdownDisplay = document.getElementById('countdownDisplay');
const toast = document.getElementById('toast');
const autoSaveDot = document.getElementById('autoSaveDot');
const autoSaveText = document.getElementById('autoSaveText');

const cueColors = { green: '#6ee6a0', red: '#e64c4c', yellow: '#e6d14c', blue: '#4c8ce6', purple: '#8c4ce6', teal: '#4ce68c', orange: '#e68c4c' };

let history = [];
let historyIndex = -1;
let pendingDeleteIndex = -1;
let searchQuery = '';
let wsServer = null;

function hideStartup() {
    document.getElementById('startupScreen').classList.add('hidden');
    document.getElementById('mainApp').style.display = 'flex';
}

function applyTheme() {
    document.body.className = document.body.className.replace(/theme-\w+/g, '').trim();
    if (prefs.theme && prefs.theme !== 'green') document.body.classList.add('theme-' + prefs.theme);
}

function applyCompactMode() {
    document.body.classList.toggle('compact', prefs.compactMode);
}

function init() {
    loadPrefs();
    applyTheme();
    applyCompactMode();
    loadFromLocalStorage();
    renderCueList();
    setupEventListeners();
    setupKeyboardShortcuts();
    setupPWA();
    checkMobileView();
    showStartupScreen();
    setupMIDI();
    setupWebSocket();
    setupResizeHandle();
}

function checkMobileView() {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    if (isMobile || prefs.mobileView) {
        document.getElementById('btnMobileView').textContent = 'OPEN MOBILE VIEW';
    }
}

function openMobileView() { window.location.href = 'mobile.html'; }

function showStartupScreen() { if (show.cues.length > 0) hideStartup(); }

function loadPrefs() {
    try { const saved = localStorage.getItem('webcue-prefs'); if (saved) prefs = { ...prefs, ...JSON.parse(saved) }; } catch (e) {}
    document.getElementById('settingNextCue').checked = prefs.spaceFiresNext;
    document.getElementById('settingAutoAdvance').checked = prefs.autoAdvance;
    document.getElementById('settingAutoSave').checked = prefs.autoSave;
    document.getElementById('settingDefaultCrossfade').checked = prefs.defaultCrossfade;
    document.getElementById('settingQlcUrl').value = prefs.qlcUrl || '';
    document.getElementById('settingOscHost').value = prefs.oscHost || 'localhost';
    document.getElementById('settingOscPort').value = prefs.oscPort || 8000;
    document.getElementById('settingMobileView').checked = prefs.mobileView || false;
    document.getElementById('settingCompactMode').checked = prefs.compactMode || false;
    document.getElementById('settingTheme').value = prefs.theme || 'green';
    document.getElementById('settingMidiNote').value = prefs.midiNote || 36;
    document.getElementById('settingMidiStop').value = prefs.midiStop || 44;
    document.getElementById('settingWsRemote').checked = prefs.wsRemote || false;
    document.getElementById('settingWsPort').value = prefs.wsPort || 8080;
}

function savePrefs() {
    prefs.spaceFiresNext = document.getElementById('settingNextCue').checked;
    prefs.autoAdvance = document.getElementById('settingAutoAdvance').checked;
    prefs.autoSave = document.getElementById('settingAutoSave').checked;
    prefs.defaultCrossfade = document.getElementById('settingDefaultCrossfade').checked;
    prefs.qlcUrl = document.getElementById('settingQlcUrl').value;
    prefs.oscHost = document.getElementById('settingOscHost').value;
    prefs.oscPort = parseInt(document.getElementById('settingOscPort').value) || 8000;
    prefs.mobileView = document.getElementById('settingMobileView').checked;
    prefs.compactMode = document.getElementById('settingCompactMode').checked;
    prefs.theme = document.getElementById('settingTheme').value;
    prefs.midiNote = parseInt(document.getElementById('settingMidiNote').value) || 36;
    prefs.midiStop = parseInt(document.getElementById('settingMidiStop').value) || 44;
    prefs.wsRemote = document.getElementById('settingWsRemote').checked;
    prefs.wsPort = parseInt(document.getElementById('settingWsPort').value) || 8080;
    localStorage.setItem('webcue-prefs', JSON.stringify(prefs));
    applyTheme();
    applyCompactMode();
    if (prefs.wsRemote) setupWebSocket(); else if (wsServer) { wsServer.close(); wsServer = null; }
    showToast('SETTINGS SAVED');
}

function pushHistory() {
    history = history.slice(0, historyIndex + 1);
    history.push(JSON.parse(JSON.stringify(show, (k, v) => k === 'fileData' ? undefined : v)));
    if (history.length > 50) history.shift();
    historyIndex = history.length - 1;
    updateUndoRedoButtons();
    if (prefs.autoSave) { showAutoSaved(); saveToLocalStorage(); }
}

function restoreShow(snap) {
    show = JSON.parse(JSON.stringify(snap));
    for (const cue of show.cues) {
        if (fileStore[cue.id]) cue.fileData = fileStore[cue.id];
    }
    showNameInput.value = show.name;
    isLoaded = false; loadedCues.clear(); loadDot.classList.remove('loaded'); loadText.textContent = 'NOT LOADED';
    renderCueList(); loadCueIntoEditor(); updateStatus(); updateNextCueInfo(); updateNotesDisplay();
    updateUndoRedoButtons();
}

function undo() {
    if (historyIndex <= 0) return;
    historyIndex--;
    restoreShow(history[historyIndex]);
    showToast('UNDO');
}

function redo() {
    if (historyIndex >= history.length - 1) return;
    historyIndex++;
    restoreShow(history[historyIndex]);
    showToast('REDO');
}

function updateUndoRedoButtons() {
    document.getElementById('btnUndo').disabled = historyIndex <= 0;
    document.getElementById('btnRedo').disabled = historyIndex >= history.length - 1;
}

function showAutoSaved() {
    autoSaveDot.classList.add('saving');
    autoSaveText.textContent = 'SAVING';
    clearTimeout(autoSaveDot._timeout);
    autoSaveDot._timeout = setTimeout(() => { autoSaveDot.classList.remove('saving'); autoSaveText.textContent = ''; }, 1000);
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

function setupMIDI() {
    if (!navigator.requestMIDIAccess) return;
    navigator.requestMIDIAccess().then(access => {
        const dot = document.getElementById('midiStatusDot');
        const txt = document.getElementById('midiStatusText');
        dot.classList.add('connected');
        txt.textContent = 'MIDI ready';
        for (const input of access.inputs.values()) {
            input.onmidimessage = msg => {
                if (msg.data.length < 3) return;
                const [status, note, velocity] = msg.data;
                if (status === 144 && velocity > 0) {
                    if (note === prefs.midiNote) goCue();
                    else if (note === prefs.midiStop) stopCue();
                }
            };
        }
    }).catch(() => {});
}

function setupWebSocket() {
    if (wsServer) { wsServer.close(); wsServer = null; }
    if (!prefs.wsRemote) return;
    try {
        wsServer = new WebSocket(`ws://localhost:${prefs.wsPort}`);
        wsServer.onopen = () => showToast('WEBSOCKET REMOTE CONNECTED');
        wsServer.onclose = () => {};
        wsServer.onerror = () => {};
        wsServer.onmessage = e => {
            try {
                const cmd = JSON.parse(e.data);
                if (cmd.action === 'go') goCue();
                else if (cmd.action === 'stop') stopCue();
                else if (cmd.action === 'panic') panic();
                else if (cmd.action === 'fade') fadeOutCue();
                else if (cmd.action === 'fire' && cmd.index !== undefined) fireCue(cmd.index);
            } catch (err) {}
        };
    } catch (e) {}
}

function setupResizeHandle() {
    const handle = document.getElementById('resizeHandle');
    const editor = document.querySelector('.editor-panel');
    let startX, startW;
    handle.addEventListener('mousedown', e => {
        e.preventDefault();
        handle.classList.add('active');
        startX = e.clientX;
        startW = editor.offsetWidth;
        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onUp);
    });
    function onMove(e) {
        const w = Math.max(200, Math.min(800, startW - (e.clientX - startX)));
        editor.style.width = w + 'px';
    }
    function onUp() {
        handle.classList.remove('active');
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
    }
}

function setupEventListeners() {
    document.getElementById('btnGo').addEventListener('click', goCue);
    document.getElementById('btnFade').addEventListener('click', fadeOutCue);
    document.getElementById('btnStop').addEventListener('click', stopCue);
    document.getElementById('btnPanic').addEventListener('click', panic);
    document.getElementById('btnPreview').addEventListener('click', previewCue);
    document.getElementById('btnLoad').addEventListener('click', loadShow);
    document.getElementById('btnAddCue').addEventListener('click', addCue);
    document.getElementById('btnDuplicate').addEventListener('click', duplicateCue);
    document.getElementById('btnDeleteCue').addEventListener('click', () => { if (selectedCueIndex >= 0) showDeleteConfirm(); });
    document.getElementById('btnUndo').addEventListener('click', undo);
    document.getElementById('btnRedo').addEventListener('click', redo);
    document.getElementById('btnMoveUp').addEventListener('click', moveCueUp);
    document.getElementById('btnMoveDown').addEventListener('click', moveCueDown);

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
    document.getElementById('confirmDeleteClose').addEventListener('click', () => document.getElementById('confirmDeleteModal').classList.remove('active'));
    document.getElementById('confirmDeleteCancel').addEventListener('click', () => document.getElementById('confirmDeleteModal').classList.remove('active'));
    document.getElementById('confirmDeleteConfirm').addEventListener('click', confirmDelete);

    showNameInput.addEventListener('input', e => { show.name = e.target.value; pushHistory(); });

    document.getElementById('searchInput').addEventListener('input', e => {
        searchQuery = e.target.value.toLowerCase();
        renderCueList();
    });

    document.getElementById('cueNumberInput').addEventListener('change', function () {
        const num = parseInt(this.value);
        if (num > 0 && num !== selectedCueIndex + 1) {
            moveCueToNumber(selectedCueIndex, num);
        }
    });

    ['cueName', 'cueType', 'cueDuration', 'cueFadeIn', 'cueFadeOut', 'cueVolume', 'cueCommand', 'cueNotes', 'qlcUniverse', 'qlcChannel', 'qlcValues', 'cueGoTo'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('input', () => { updateSelectedCue(); if (id === 'cueVolume') document.getElementById('volumeDisplay').textContent = el.value + '%'; if (id === 'cueNotes') updateNotesDisplay(); });
    });

    document.getElementById('cueLoop').addEventListener('change', updateSelectedCue);
    document.getElementById('cueCrossfade').addEventListener('change', updateSelectedCue);

    document.getElementById('cueType').addEventListener('change', e => {
        document.getElementById('fileGroup').style.display = 'none';
        document.getElementById('commandGroup').style.display = 'none';
        document.getElementById('qlcGroup').style.display = 'none';
        document.getElementById('groupChildrenGroup').style.display = 'none';
        if (e.target.value === 'audio' || e.target.value === 'video') document.getElementById('fileGroup').style.display = 'block';
        else if (e.target.value === 'command') document.getElementById('commandGroup').style.display = 'block';
        else if (e.target.value === 'qlc') document.getElementById('qlcGroup').style.display = 'block';
        else if (e.target.value === 'group') document.getElementById('groupChildrenGroup').style.display = 'block';
        updateSelectedCue();
    });

    document.getElementById('cueFile').addEventListener('change', e => {
        const file = e.target.files[0];
        if (file) {
            document.getElementById('fileDisplay').textContent = file.name.substring(0, 24);
            if (selectedCueIndex >= 0) {
                const reader = new FileReader();
                reader.onload = ev => {
                    const cue = show.cues[selectedCueIndex];
                    fileStore[cue.id] = ev.target.result;
                    cue.fileData = ev.target.result;
                    isLoaded = false; loadedCues.clear(); loadDot.classList.remove('loaded'); loadText.textContent = 'NOT LOADED';
                    pushHistory();
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

    document.getElementById('btnImportMedia').addEventListener('click', importMedia);
    document.getElementById('mediaImportInput').addEventListener('change', e => {
        if (e.target.files.length > 0) handleMediaFiles(e.target.files);
        e.target.value = '';
    });


    const cueListEl = document.getElementById('cueList');
    const dropOverlay = document.getElementById('cueDropOverlay');
    cueListEl.addEventListener('dragenter', e => {
        if (e.dataTransfer.types.includes('Files')) { e.preventDefault(); dropOverlay.classList.add('show'); }
    });
    cueListEl.addEventListener('dragover', e => {
        if (e.dataTransfer.types.includes('Files')) { e.preventDefault(); dropOverlay.classList.add('show'); }
    });
    cueListEl.addEventListener('dragleave', e => {
        if (!e.currentTarget.contains(e.relatedTarget)) dropOverlay.classList.remove('show');
    });
    cueListEl.addEventListener('drop', e => {
        e.preventDefault();
        dropOverlay.classList.remove('show');
        if (e.dataTransfer.files.length > 0) handleMediaFiles(e.dataTransfer.files);
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
                    history = [JSON.parse(JSON.stringify(show))]; historyIndex = 0;
                    loadDot.classList.remove('loaded'); loadText.textContent = 'NOT LOADED';
                    renderCueList(); saveToLocalStorage(); hideStartup(); showToast('SHOW LOADED');
                    updateUndoRedoButtons();
                } catch (err) { showToast('ERROR LOADING FILE'); }
            };
            reader.readAsText(file);
        }
    });
}

function setupKeyboardShortcuts() {
    document.addEventListener('keydown', e => {
        if (document.getElementById('mainApp').style.display === 'none') return;
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
            if (e.code === 'Escape') e.target.blur();
            return;
        }
        if (e.code === 'Space') { e.preventDefault(); goCue(); }
        else if (e.code === 'Escape') { e.preventDefault(); stopCue(); }
        else if (e.code === 'KeyF') { e.preventDefault(); fadeOutCue(); }
        else if (e.code === 'Escape' && e.shiftKey) { e.preventDefault(); panic(); }
        else if (e.code === 'ArrowDown') { e.preventDefault(); if (selectedCueIndex < show.cues.length - 1) { selectedCueIndex++; renderCueList(); loadCueIntoEditor(); scrollToSelected(); } }
        else if (e.code === 'ArrowUp') { e.preventDefault(); if (selectedCueIndex > 0) { selectedCueIndex--; renderCueList(); loadCueIntoEditor(); scrollToSelected(); } }
        else if (e.code === 'Enter' && selectedCueIndex >= 0) { e.preventDefault(); fireCue(selectedCueIndex); }
        else if (e.code === 'Delete' && selectedCueIndex >= 0) { e.preventDefault(); showDeleteConfirm(); }
        else if (e.ctrlKey && e.code === 'KeyZ') { e.preventDefault(); undo(); }
        else if (e.ctrlKey && e.code === 'KeyY') { e.preventDefault(); redo(); }
        else if (e.ctrlKey && e.code === 'Space') { e.preventDefault(); previewCue(); }
    });
}

function scrollToSelected() {
    const items = cueList.querySelectorAll('.cue-item');
    if (items[selectedCueIndex]) items[selectedCueIndex].scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function moveCueUp() {
    if (selectedCueIndex <= 0) return;
    const tmp = show.cues[selectedCueIndex];
    show.cues[selectedCueIndex] = show.cues[selectedCueIndex - 1];
    show.cues[selectedCueIndex - 1] = tmp;
    selectedCueIndex--;
    pushHistory(); renderCueList(); loadCueIntoEditor(); scrollToSelected();
}

function moveCueDown() {
    if (selectedCueIndex >= show.cues.length - 1) return;
    const tmp = show.cues[selectedCueIndex];
    show.cues[selectedCueIndex] = show.cues[selectedCueIndex + 1];
    show.cues[selectedCueIndex + 1] = tmp;
    selectedCueIndex++;
    pushHistory(); renderCueList(); loadCueIntoEditor(); scrollToSelected();
}

function importMedia() {
    document.getElementById('mediaImportInput').click();
}

function handleMediaFiles(files) {
    let total = 0;
    for (const file of files) {
        if (file.type.startsWith('audio/') || file.type.startsWith('video/')) total++;
    }
    if (total === 0) { showToast('NO MEDIA FILES'); return; }
    let done = 0;
    for (const file of files) {
        if (!file.type.startsWith('audio/') && !file.type.startsWith('video/')) continue;
        const type = file.type.startsWith('audio/') ? 'audio' : 'video';
        const name = file.name.replace(/\.[^/.]+$/, '').substring(0, 40);
        const reader = new FileReader();
        reader.onload = ev => {
            show.cues.push({
                id: Date.now() + done,
                name: name,
                type: type,
                duration: 0,
                fadeIn: 0,
                fadeOut: 0,
                volume: 100,
                notes: '',
                fileData: ev.target.result,
                qlcUniverse: 0,
                qlcChannel: 1,
                qlcValues: '',
                goTo: 0,
                color: 'green',
                loop: false,
                crossfade: prefs.defaultCrossfade,
                children: []
            });
            done++;
            if (done === total) {
                selectedCueIndex = show.cues.length - 1;
                isLoaded = false; loadedCues.clear(); loadDot.classList.remove('loaded'); loadText.textContent = 'NOT LOADED';
                pushHistory(); renderCueList(); loadCueIntoEditor(); scrollToSelected();
                showToast(`${total} CUES IMPORTED`);
            }
        };
        reader.readAsDataURL(file);
    }
}

function addCue() {
    const parentIndex = selectedCueIndex >= 0 && show.cues[selectedCueIndex].type === 'group' ? selectedCueIndex : -1;
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
        color: 'green',
        loop: false,
        crossfade: prefs.defaultCrossfade,
        children: []
    });
    selectedCueIndex = show.cues.length - 1;
    pushHistory(); renderCueList(); loadCueIntoEditor(); showToast('CUE ADDED');
    scrollToSelected();
}

function duplicateCue() {
    if (selectedCueIndex < 0) return;
    const cue = JSON.parse(JSON.stringify(show.cues[selectedCueIndex]));
    cue.id = Date.now();
    cue.name = cue.name + ' copy';
    show.cues.splice(selectedCueIndex + 1, 0, cue);
    selectedCueIndex++;
    pushHistory(); renderCueList(); loadCueIntoEditor();
}

function showDeleteConfirm() {
    if (selectedCueIndex < 0) return;
    pendingDeleteIndex = selectedCueIndex;
    document.getElementById('deleteCueName').textContent = show.cues[selectedCueIndex].name;
    document.getElementById('confirmDeleteModal').classList.add('active');
}

function confirmDelete() {
    document.getElementById('confirmDeleteModal').classList.remove('active');
    const index = pendingDeleteIndex;
    show.cues.splice(index, 1);
    if (audioElements[index]) delete audioElements[index];
    if (videoElements[index]) { videoElements[index].remove(); delete videoElements[index]; }
    loadedCues.delete(index);
    selectedCueIndex = Math.min(pendingDeleteIndex, show.cues.length - 1);
    pendingDeleteIndex = -1;
    pushHistory(); renderCueList(); loadCueIntoEditor(); showToast('CUE DELETED');
}

function moveCueToNumber(fromIndex, targetNum) {
    if (fromIndex < 0 || fromIndex >= show.cues.length) return;
    const toIndex = Math.max(0, Math.min(targetNum - 1, show.cues.length - 1));
    if (fromIndex === toIndex) return;
    const [moved] = show.cues.splice(fromIndex, 1);
    show.cues.splice(toIndex, 0, moved);
    selectedCueIndex = toIndex;
    pushHistory(); renderCueList(); loadCueIntoEditor(); scrollToSelected();
}

function updateSelectedCue() {
    if (selectedCueIndex < 0) return;
    const cue = show.cues[selectedCueIndex];
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
    cue.loop = document.getElementById('cueLoop').checked;
    cue.crossfade = document.getElementById('cueCrossfade').checked;
    const selectedColor = document.querySelector('.color-badge.selected');
    if (selectedColor) cue.color = selectedColor.dataset.color;
    renderCueList(); updateNotesDisplay(); updateSelectedCueInfo();
}

function updateNotesDisplay() {
    if (selectedCueIndex >= 0 && show.cues[selectedCueIndex].notes) {
        statusNotes.textContent = show.cues[selectedCueIndex].notes;
    } else { statusNotes.textContent = ''; }
}

function goCue() {
    let targetIndex = -1;
    if (selectedCueIndex >= 0) { targetIndex = selectedCueIndex; }
    else if (show.cues.length > 0) { targetIndex = 0; selectedCueIndex = 0; }
    if (targetIndex >= 0 && targetIndex < show.cues.length) {
        fireCue(targetIndex);
        nextCueIndex = targetIndex + 1;
        selectedCueIndex = nextCueIndex;
        if (selectedCueIndex >= show.cues.length) selectedCueIndex = show.cues.length - 1;
        renderCueList();
    }
}

function previewCue() {
    if (selectedCueIndex < 0) return;
    const cue = show.cues[selectedCueIndex];
    if ((cue.type === 'audio' || cue.type === 'video') && cue.fileData) {
        const el = cue.type === 'audio' ? new Audio() : document.createElement('video');
        el.src = cue.fileData;
        el.volume = (cue.volume || 100) / 100;
        if (cue.type === 'audio') el.play().catch(() => {});
        else { el.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;object-fit:contain;background:#000;z-index:999;'; el.play().catch(() => {}); document.body.appendChild(el); el.onended = () => el.remove(); }
        showToast('PREVIEW: ' + cue.name);
    } else { showToast('CANNOT PREVIEW - NO MEDIA'); }
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
                    else audio.volume = current;
                }, interval);
            }
        }
        runningCueIndex = -1;
        renderCueList(); updateStatus(); updateNotesDisplay();
    }
    showToast('FADE OUT');
}

function fireCue(index) {
    const cue = show.cues[index];
    if (!cue) return;

    if (cue.crossfade && runningCueIndex >= 0) {
        const currentCue = show.cues[runningCueIndex];
        if (currentCue && currentCue.type === 'audio' && audioElements[runningCueIndex]) {
            const audio = audioElements[runningCueIndex];
            const fadeOut = currentCue.fadeOut || 1;
            const steps = 10;
            const interval = (fadeOut * 1000) / steps;
            const decrement = (audio.volume || 1) / steps;
            let currentVol = audio.volume;
            const fi = setInterval(() => {
                currentVol -= decrement;
                if (currentVol <= 0) { audio.pause(); audio.currentTime = 0; audio.volume = 1; clearInterval(fi); }
                else audio.volume = currentVol;
            }, interval);
        }
        showToast('CROSSFADE');
    }
    // Note: previous audio continues playing layered underneath

    if (cue.type === 'group' && cue.children && cue.children.length > 0) {
        runningCueIndex = index;
        nextCueIndex = cue.goTo > 0 ? cue.goTo - 1 : index + 1;
        startTime = Date.now();
        renderCueList(); updateStatus(); updateNextCueInfo();
        for (const childIdx of cue.children) {
            if (childIdx >= 0 && childIdx < show.cues.length) fireSingle(childIdx);
        }
        if (cue.duration > 0) {
            setTimeout(() => {
                if (runningCueIndex === index) {
                    runningCueIndex = -1; renderCueList(); updateStatus(); updateNotesDisplay();
                    if (prefs.autoAdvance && nextCueIndex < show.cues.length && nextCueIndex >= 0) goCue();
                }
            }, cue.duration * 1000);
        } else if (prefs.autoAdvance && nextCueIndex < show.cues.length && nextCueIndex >= 0) {
            setTimeout(goCue, 50);
        }
        return;
    }

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

function fireSingle(index) {
    const cue = show.cues[index];
    if (!cue) return;
    if (cue.type === 'audio' || cue.type === 'video') {
        if (cue.fileData) cue.type === 'audio' ? playPreloadedAudio(index, cue) : playPreloadedVideo(index, cue);
    } else if (cue.type === 'command') {
        if (cue.command) fetch(cue.command, { mode: 'no-cors' }).catch(() => {});
    } else if (cue.type === 'qlc') {
        sendQlc(cue);
    }
}

function playPreloadedAudio(index, cue) {
    const audio = audioElements[index];
    if (!audio) { showToast('NOT LOADED'); runningCueIndex = -1; renderCueList(); updateStatus(); return; }
    audio.currentTime = 0; audio.volume = cue.volume / 100;
    if (cue.loop) audio.loop = true;
    audio.play().catch(() => showToast('PLAY ERROR'));
    audio.onended = () => {
        if (!cue.loop) {
            runningCueIndex = -1; renderCueList(); updateStatus(); updateNotesDisplay();
            if (prefs.autoAdvance && nextCueIndex < show.cues.length && nextCueIndex >= 0) setTimeout(goCue, 50);
        }
    };
}

function playPreloadedVideo(index, cue) {
    const video = videoElements[index];
    if (!video) { showToast('NOT LOADED'); runningCueIndex = -1; renderCueList(); updateStatus(); return; }
    video.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;object-fit:contain;background:#000;z-index:999;';
    video.currentTime = 0; video.volume = cue.volume / 100;
    video.play().catch(() => showToast('PLAY ERROR'));
    video.onended = () => {
        if (!cue.loop) {
            video.style.display = 'none'; video.style.position = 'static';
            runningCueIndex = -1; renderCueList(); updateStatus();
            if (prefs.autoAdvance && nextCueIndex < show.cues.length && nextCueIndex >= 0) setTimeout(goCue, 50);
        }
    };
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
    } else { loadHint.style.display = 'none'; }

    cueEmpty.style.display = 'none'; cueList.querySelectorAll('.cue-item').forEach(el => el.remove());
    const types = { audio: 'A', video: 'V', wait: 'W', command: 'C', qlc: 'D', group: 'G' };
    const hasFilter = searchQuery.length > 0;

    show.cues.forEach((cue, index) => {
        const matches = !hasFilter ||
            cue.name.toLowerCase().includes(searchQuery) ||
            cue.notes.toLowerCase().includes(searchQuery) ||
            (types[cue.type] || '').toLowerCase().includes(searchQuery) ||
            String(index + 1).includes(searchQuery);

        const item = document.createElement('div');
        item.className = 'cue-item';
        if (!matches) item.classList.add('hidden-by-search');
        if (index === selectedCueIndex) item.classList.add('selected');
        if (index === runningCueIndex) item.classList.add('running');
        if (index === nextCueIndex && runningCueIndex < 0) item.classList.add('next');
        if (isLoaded && loadedCues.has(index)) item.classList.add('loaded');
        if (cue.type === 'group') item.classList.add('group');
        if (cue.color && cue.color !== 'green') item.style.borderLeftColor = cueColors[cue.color];

        let durationStr = '';
        if (cue.duration > 0) durationStr = cue.duration + 's';
        const desc = cue.notes ? `— ${cue.notes.substring(0, 25)}${cue.notes.length > 25 ? '...' : ''}` : '';
        const loopBadge = cue.loop ? '<span class="cue-loop-badge"><i class="fas fa-sync-alt"></i></span>' : '';

        item.innerHTML = `<span class="cue-number">${String(index + 1).padStart(2, '0')}</span><span class="cue-type">${types[cue.type] || '?'}</span><span class="cue-name">${cue.name}${loopBadge}</span><span class="cue-desc">${desc}</span><span class="cue-duration">${durationStr}</span>`;

        item.setAttribute('draggable', 'true');
        item.dataset.index = index;

        item.addEventListener('dragstart', e => {
            e.dataTransfer.setData('text/plain', index);
            item.classList.add('dragging');
        });
        item.addEventListener('dragend', () => item.classList.remove('dragging'));
        item.addEventListener('dragover', e => { e.preventDefault(); item.classList.add('drag-over'); });
        item.addEventListener('dragleave', () => item.classList.remove('drag-over'));
        item.addEventListener('drop', e => {
            e.preventDefault(); item.classList.remove('drag-over');
            const from = parseInt(e.dataTransfer.getData('text/plain'));
            const to = index;
            if (from !== to && from >= 0 && to >= 0) {
                const [moved] = show.cues.splice(from, 1);
                show.cues.splice(to, 0, moved);
                selectedCueIndex = to;
                pushHistory(); renderCueList(); loadCueIntoEditor();
            }
        });

        item.addEventListener('click', () => { selectedCueIndex = index; renderCueList(); loadCueIntoEditor(); });
        item.addEventListener('dblclick', () => { selectedCueIndex = index; fireCue(index); });
        cueList.appendChild(item);
    });
}

function updateSelectedCueInfo() {
    const info = document.getElementById('headerCueInfo');
    if (selectedCueIndex < 0 || !show.cues[selectedCueIndex]) { info.style.display = 'none'; return; }
    const cue = show.cues[selectedCueIndex];
    document.getElementById('headerCueName').textContent = cue.name;
    document.getElementById('headerCueDesc').textContent = cue.notes || '';
    info.style.display = 'flex';
}

function loadCueIntoEditor() {
    if (selectedCueIndex < 0) { editorEmpty.style.display = 'flex'; editorForm.style.display = 'none'; editorFooter.style.display = 'none'; statusNotes.textContent = ''; updateSelectedCueInfo(); document.getElementById('cueNumberEdit').style.display = 'none'; return; }
    const cue = show.cues[selectedCueIndex];
    editorEmpty.style.display = 'none'; editorForm.style.display = 'block'; editorFooter.style.display = 'block';
    document.getElementById('cueNumberEdit').style.display = 'inline';
    document.getElementById('cueNumberInput').value = selectedCueIndex + 1;
    document.getElementById('cueNumberInput').min = 1;
    document.getElementById('cueNumberInput').max = show.cues.length;
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
    document.getElementById('cueLoop').checked = cue.loop || false;
    document.getElementById('cueCrossfade').checked = cue.crossfade || false;
    document.getElementById('fileDisplay').textContent = cue.fileData ? 'File loaded' : 'Select file...';
    document.getElementById('groupChildren').value = (cue.children || []).join(', ');

    document.getElementById('fileGroup').style.display = 'none';
    document.getElementById('commandGroup').style.display = 'none';
    document.getElementById('qlcGroup').style.display = 'none';
    document.getElementById('groupChildrenGroup').style.display = 'none';
    if (cue.type === 'audio' || cue.type === 'video') document.getElementById('fileGroup').style.display = 'block';
    else if (cue.type === 'command') document.getElementById('commandGroup').style.display = 'block';
    else if (cue.type === 'qlc') document.getElementById('qlcGroup').style.display = 'block';
    else if (cue.type === 'group') document.getElementById('groupChildrenGroup').style.display = 'block';

    document.getElementById('cueLoop').closest('.form-row-inline').parentElement.style.display = (cue.type === 'audio' || cue.type === 'video') ? 'flex' : 'none';
    document.getElementById('cueCrossfade').closest('.form-row-inline').parentElement.style.display = (cue.type === 'audio') ? 'flex' : 'none';

    document.querySelectorAll('.color-badge').forEach(b => { b.classList.toggle('selected', b.dataset.color === cue.color); });
    updateNotesDisplay();
    updateSelectedCueInfo();
}

function updateStatus() { runningCueIndex >= 0 ? (statusDot.classList.add('active'), statusText.textContent = show.cues[runningCueIndex].name) : (statusDot.classList.remove('active'), statusText.textContent = 'READY'); }
function updateNextCueInfo() { nextText.textContent = nextCueIndex < show.cues.length && nextCueIndex >= 0 ? `NEXT: ${show.cues[nextCueIndex].name}` : ''; }
function saveToLocalStorage() { try { localStorage.setItem('webcue-show', JSON.stringify(show, (k, v) => k === 'fileData' ? undefined : v)); } catch (e) {} }
function loadFromLocalStorage() {
    try {
        const saved = localStorage.getItem('webcue-show');
        if (saved) { show = JSON.parse(saved); showNameInput.value = show.name; history = [JSON.parse(JSON.stringify(show))]; historyIndex = 0; updateUndoRedoButtons(); }
    } catch (e) {}
}

function newShow() {
    show = { name: 'Untitled Show', cues: [] }; showNameInput.value = show.name;
    selectedCueIndex = -1; runningCueIndex = -1; nextCueIndex = 0; isLoaded = false; loadedCues.clear();
    audioElements = {}; videoElements = {}; loadDot.classList.remove('loaded'); loadText.textContent = 'NOT LOADED';
    history = [JSON.parse(JSON.stringify(show))]; historyIndex = 0; updateUndoRedoButtons();
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
            const remaining = Math.max(0, cue.duration - e);
            countdownDisplay.textContent = `-${Math.floor(remaining / 60).toString().padStart(2, '0')}:${Math.floor(remaining % 60).toString().padStart(2, '0')}`;
            const progress = Math.min((e / cue.duration) * 100, 100);
            const runningItems = cueList.querySelectorAll('.cue-item.running');
            runningItems.forEach(item => {
                const oldBar = item.querySelector('.progress-bar');
                if (oldBar) oldBar.remove();
                const bar = document.createElement('div');
                bar.className = 'progress-bar';
                bar.style.cssText = `position:absolute;left:0;top:0;bottom:0;background:var(--accent);opacity:0.25;z-index:0;width:${progress}%;transition:width 0.1s linear;`;
                item.appendChild(bar);
            });
        } else {
            countdownDisplay.textContent = '';
        }

        const showElapsed = Date.now() - startTime;
        if (show._showStart) showElapsed = Date.now() - show._showStart;
    } else {
        statusTime.textContent = '00:00.00';
        countdownDisplay.textContent = '';
    }
}, 50);

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('service-worker.js').then((reg) => {
    reg.addEventListener('updatefound', () => {
      const newWorker = reg.installing;
      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          newWorker.postMessage({ action: 'skipWaiting' });
        }
      });
    });
    let preventReload = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!preventReload) { preventReload = true; window.location.reload(); }
    });
  }).catch(() => {});
}

init();