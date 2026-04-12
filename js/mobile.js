let show = { name: 'Untitled Show', cues: [] };
let selected = -1;
let running = -1;
let startTime = 0;
let audio = null;

const el = {
    name: document.getElementById('showName'),
    list: document.getElementById('cueList'),
    empty: document.getElementById('empty'),
    status: document.getElementById('status'),
    dot: document.getElementById('dot'),
    time: document.getElementById('time'),
    modal: document.getElementById('editModal'),
    nameInput: document.getElementById('cueName'),
    typeInput: document.getElementById('cueType'),
    durInput: document.getElementById('cueDuration'),
    notesInput: document.getElementById('cueNotes'),
    volInput: document.getElementById('cueVolume'),
    volDisplay: document.getElementById('volDisplay')
};

load();

function load() {
    try { show = JSON.parse(localStorage.getItem('webcue-show') || '{"cues":[]}'); el.name.value = show.name; } catch(e) {}
    render();
}

function save() {
    show.name = el.name.value;
    localStorage.setItem('webcue-show', JSON.stringify(show));
}

function render() {
    el.list.querySelectorAll('.cue-item').forEach(e => e.remove());
    if (show.cues.length === 0) { el.empty.style.display = 'flex'; return; }
    el.empty.style.display = 'none';
    
    show.cues.forEach((cue, i) => {
        const item = document.createElement('div');
        item.className = 'cue-item' + (i === selected ? ' selected' : '') + (i === running ? ' running' : '');
        item.style.cssText = 'position: relative;';
        item.innerHTML = `
            <div class="progress"></div>
            <div class="num">${String(i+1).padStart(2,'0')}</div>
            <div class="info"><div class="name">${cue.name}</div><div class="type">${cue.type.toUpperCase()} ${cue.duration ? cue.duration+'s' : ''}</div></div>
            <div class="duration"></div>
        `;
        item.onclick = () => { selected = i; render(); openModal(); };
        el.list.appendChild(item);
    });
}

function addCue() {
    show.cues.push({ name: 'Cue ' + (show.cues.length+1), type: 'audio', duration: 0, volume: 100, notes: '' });
    selected = show.cues.length - 1;
    save(); render(); openModal();
}

function openModal() {
    if (selected < 0) return;
    const cue = show.cues[selected];
    el.nameInput.value = cue.name;
    el.typeInput.value = cue.type;
    el.durInput.value = cue.duration || '';
    el.notesInput.value = cue.notes || '';
    el.volInput.value = cue.volume || 100;
    el.volDisplay.textContent = (cue.volume || 100) + '%';
    el.modal.classList.add('active');
}

function closeModal() { el.modal.classList.remove('active'); }

function saveCue() {
    if (selected < 0) return;
    const cue = show.cues[selected];
    cue.name = el.nameInput.value;
    cue.type = el.typeInput.value;
    cue.duration = parseFloat(el.durInput.value) || 0;
    cue.notes = el.notesInput.value;
    cue.volume = parseInt(el.volInput.value) || 100;
    save(); render(); closeModal();
}

function deleteCue() {
    if (selected < 0) return;
    show.cues.splice(selected, 1);
    selected = Math.max(0, selected - 1);
    save(); render(); closeModal();
}

function go() {
    if (show.cues.length === 0) { addCue(); return; }
    let target = selected >= 0 ? selected : 0;
    fire(target);
    selected = Math.min(target + 1, show.cues.length - 1);
    render();
}

function fire(i) {
    stop();
    const cue = show.cues[i];
    if (!cue) return;
    running = i;
    startTime = Date.now();
    el.status.textContent = cue.name;
    el.dot.style.background = 'var(--green)';
    render();

    if (cue.type === 'audio' || cue.type === 'video') {
        if (cue.fileData) {
            audio = new Audio();
            audio.src = cue.fileData;
            audio.volume = (cue.volume || 100) / 100;
            audio.play().catch(() => {});
            audio.onended = () => { running = -1; el.status.textContent = 'READY'; el.dot.style.background = 'var(--text-dim)'; render(); };
        }
    } else if (cue.type === 'wait') {
        setTimeout(() => { running = -1; el.status.textContent = 'READY'; el.dot.style.background = 'var(--text-dim)'; render(); }, (cue.duration || 1) * 1000);
    }
}

function stop() {
    if (audio) { audio.pause(); audio = null; }
    running = -1;
    el.status.textContent = 'READY';
    el.dot.style.background = 'var(--text-dim)';
}

function panic() { stop(); render(); }

document.getElementById('cueFile').addEventListener('change', e => {
    const file = e.target.files[0];
    if (file && selected >= 0) {
        const reader = new FileReader();
        reader.onload = ev => { show.cues[selected].fileData = ev.target.result; save(); };
        reader.readAsDataURL(file);
    }
});

el.volInput.oninput = () => el.volDisplay.textContent = el.volInput.value + '%';

setInterval(() => {
    if (running >= 0 && show.cues[running].duration > 0) {
        const e = (Date.now() - startTime) / 1000;
        el.time.textContent = Math.floor(e/60) + ':' + String(Math.floor(e%60)).padStart(2,'0');
        const pc = (e / show.cues[running].duration) * 100;
        el.list.querySelector('.running .progress').style.width = pc + '%';
    } else {
        const e = (Date.now() - startTime) / 1000;
        el.time.textContent = Math.floor(e/60) + ':' + String(Math.floor(e%60)).padStart(2,'0');
    }
}, 100);