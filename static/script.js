let data = {};
let currentFolder = null;
let currentNote = null;

const foldersDiv = document.getElementById("folders");
const noteList = document.getElementById("noteList");
const titleInput = document.getElementById("title");
const contentInput = document.getElementById("content");

let saveTimer = null;

// ------------------------------------
// Click Sounds (reusable)
// ------------------------------------

const typewriterSound = new Audio("/static/Select/re_typewriter.mp3");
typewriterSound.volume = 0.6;

function playTypewriter() {

    typewriterSound.currentTime = 0;

    typewriterSound.play().catch(() => {});

}

// Select sound uses the Web Audio API instead of
// HTMLAudioElement. Resetting currentTime + play()
// on a shared <audio> forces a re-seek/re-buffer on
// every click, which adds latency. Decoding the file
// once into an AudioBuffer and firing a fresh
// BufferSource per click removes that delay and lets
// rapid clicks overlap cleanly.

const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
let selectBuffer = null;

fetch("/static/Select/re_2_cursor_select.mp3")
    .then(res => res.arrayBuffer())
    .then(bytes => audioCtx.decodeAudioData(bytes))
    .then(buffer => { selectBuffer = buffer; })
    .catch(err => console.error("Failed to load select sound:", err));

function playSelect() {

    if (!selectBuffer)
        return;

    if (audioCtx.state === "suspended")
        audioCtx.resume();

    const source = audioCtx.createBufferSource();
    source.buffer = selectBuffer;

    const gain = audioCtx.createGain();
    gain.gain.value = 0.1; // 40% volume

    source.connect(gain);
    gain.connect(audioCtx.destination);

    source.start(0);

}

// ------------------------------------
// Load Notes
// ------------------------------------

async function loadNotes() {

    const res = await fetch("/notes");

    data = await res.json();

    if (data.folders.length > 0) {

        currentFolder = data.folders[0];

    }

    renderFolders();
    renderNotes();

}

// ------------------------------------
// Folder Rendering
// ------------------------------------

function renderFolders() {

    foldersDiv.innerHTML = "";

    data.folders.forEach(folder => {

        const div = document.createElement("div");

        div.className = "folder";

div.innerHTML = `
    <span>${folder.name}</span>
    <span class="delete-btn">🗑️</span>
`;

        if (folder === currentFolder)
            div.style.background = "#262c38";

        div.onclick = (e) => {

            e.stopPropagation();

            playSelect();

            currentFolder = folder;

            currentNote = null;

            titleInput.value = "";
            contentInput.value = "";

            renderFolders();
            renderNotes();

        };

        div.ondblclick = (e) => {

            e.stopPropagation();

            const newName = prompt(
                "Rename Folder",
                folder.name
            );

            if (!newName)
                return;

            folder.name = newName.trim();

            renderFolders();

            saveCurrent();

        };

        div.oncontextmenu = (e) => {

            e.preventDefault();

            e.stopPropagation();

            if (!confirm(
                `Delete folder "${folder.name}" ?`
            ))
                return;

            data.folders =
                data.folders.filter(
                    f => f.id !== folder.id
                );

            if (currentFolder === folder) {

                currentFolder =
                    data.folders[0] || null;

                currentNote = null;

                titleInput.value = "";
                contentInput.value = "";

            }

            renderFolders();
            renderNotes();

            saveCurrent();

        };

        foldersDiv.appendChild(div);

    });

}

// ------------------------------------
// Note Rendering
// ------------------------------------

function renderNotes() {

    noteList.innerHTML = "";

    if (!currentFolder)
        return;

    currentFolder.notes.forEach(note => {

        const div = document.createElement("div");

        div.className = "note";

        div.innerHTML =
            `<b>${note.title}</b>`;

        if (note === currentNote)
            div.style.border =
                "1px solid #4d6bff";

        div.onclick = (e) => {

            e.stopPropagation();

            playSelect();

            currentNote = note;

            titleInput.value = note.title;

            contentInput.value =
                note.content;

            renderNotes();

        };

        div.ondblclick = (e) => {

            e.stopPropagation();

            const newTitle =
                prompt(
                    "Rename Note",
                    note.title
                );

            if (!newTitle)
                return;

            note.title =
                newTitle.trim();

            if (currentNote === note)
                titleInput.value =
                    note.title;

            renderNotes();

            saveCurrent();

        };

        div.oncontextmenu = (e) => {

            e.preventDefault();

            e.stopPropagation();

            if (!confirm(
                `Delete "${note.title}" ?`
            ))
                return;

            currentFolder.notes =
                currentFolder.notes.filter(
                    n => n.id !== note.id
                );

            if (currentNote === note) {

                currentNote = null;

                titleInput.value = "";
                contentInput.value = "";

            }

            renderNotes();

            saveCurrent();

        };

        noteList.appendChild(div);

    });

}

// ------------------------------------
// New Folder
// ------------------------------------

document.getElementById("newFolder").onclick = () => {

    const name = prompt("Folder Name");

    if (!name || name.trim() === "")
        return;

    const folder = {

        id: Date.now(),

        name: name.trim(),

        notes: []

    };

    data.folders.push(folder);

    currentFolder = folder;

    currentNote = null;

    titleInput.value = "";
    contentInput.value = "";

    renderFolders();

    renderNotes();

    saveCurrent();

};

// ------------------------------------
// New Note
// ------------------------------------

document.getElementById("newNote").onclick = () => {

    if (!currentFolder) {

        alert("Please select a folder.");

        return;

    }

    const note = {

        id: Date.now(),

        title: "Untitled",

        content: ""

    };

    currentFolder.notes.push(note);

    currentNote = note;

    titleInput.value = note.title;

    contentInput.value = note.content;

    renderNotes();

    autoSave();

};

// ------------------------------------
// Auto Save
// ------------------------------------

function autoSave() {

    clearTimeout(saveTimer);

    saveTimer = setTimeout(saveCurrent, 500);

}

// ------------------------------------
// Save
// ------------------------------------

async function saveCurrent() {

    if (currentNote) {

        currentNote.title = titleInput.value;

        currentNote.content = contentInput.value;

    }

    try {

        await fetch("/save", {

            method: "POST",

            headers: {

                "Content-Type": "application/json"

            },

            body: JSON.stringify(data)

        });

    }

    catch (err) {

        console.error(err);

    }

}

// ------------------------------------
// Editor Events
// ------------------------------------

titleInput.addEventListener("input", () => {

    if (!currentNote)
        return;

    currentNote.title = titleInput.value;

    renderNotes();

    autoSave();

});

contentInput.addEventListener("input", () => {

    if (!currentNote)
        return;

    currentNote.content = contentInput.value;

    autoSave();

});

// ------------------------------------
// Manual Save (typewriter button)
// ------------------------------------

const saveBtn = document.getElementById("save");

saveBtn.addEventListener("click", (e) => {

    e.stopPropagation();

    if (!currentNote)
        return;

    playTypewriter();

    saveCurrent();

});

// ------------------------------------
// Inventory Slot Clicks
// ------------------------------------

document.querySelectorAll(".item-slot").forEach(slot => {

    slot.addEventListener("click", (e) => {

        e.stopPropagation();

        playSelect();

    });

});

// ------------------------------------
// Initial Load
// ------------------------------------

loadNotes();

const bgMusic = document.getElementById("bgMusic");
bgMusic.volume = 0.36;

const startOverlay = document.getElementById("startOverlay");

if (startOverlay) {

    startOverlay.addEventListener("click", () => {

        bgMusic.play().catch(() => {});

        startOverlay.remove();

    }, { once: true });

}