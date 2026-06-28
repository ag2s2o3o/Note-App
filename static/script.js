let data = {};
let currentFolder = null;
let currentNote = null;

const foldersDiv = document.getElementById("folders");
const noteList = document.getElementById("noteList");

const titleInput = document.getElementById("title");
const contentInput = document.getElementById("content");

async function loadNotes(){

    const res = await fetch("/notes");
    data = await res.json();

    renderFolders();
}

function renderFolders(){

    foldersDiv.innerHTML="";

    data.folders.forEach(folder=>{

        const div=document.createElement("div");

        div.className="folder";

        div.innerText=folder.name;

        div.onclick=()=>{

            currentFolder=folder;

            renderNotes();

        };

        foldersDiv.appendChild(div);

    });

}

function renderNotes(){

    noteList.innerHTML="";

    currentFolder.notes.forEach(note=>{

        const div=document.createElement("div");

        div.className="note";

        div.innerHTML="<b>"+note.title+"</b>";

        div.onclick=()=>{

            currentNote=note;

            titleInput.value=note.title;

            contentInput.value=note.content;

        };

        noteList.appendChild(div);

    });

}

document.getElementById("newFolder").onclick=()=>{

    const name=prompt("Folder name");

    if(!name)return;

    data.folders.push({

        id:Date.now(),

        name:name,

        notes:[]
    });

    renderFolders();

};

document.getElementById("newNote").onclick=()=>{

    if(!currentFolder){

        alert("Select a folder");

        return;

    }

    const note={

        id:Date.now(),

        title:"Untitled",

        content:""

    };

    currentFolder.notes.push(note);

    renderNotes();

};

document.getElementById("save").onclick=saveCurrent;
function saveCurrent(){

    if(currentNote){

        currentNote.title=titleInput.value;

        currentNote.content=contentInput.value;
    }

    fetch("/save",{

        method:"POST",

        headers:{
            "Content-Type":"application/json"
        },

        body:JSON.stringify(data)

    });

    renderNotes();

}

loadNotes();