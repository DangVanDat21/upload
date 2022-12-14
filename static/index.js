const chunkSize = 4*1024*1024;
const endpoint = "http://127.0.0.1:8888/";

function notice(msg,classname){
    const notice = document.getElementById("notice");
    const collection = document.getElementsByClassName(classname)
    if (collection.length==0){
        const para = document.createElement("p");
        para.classList.add(classname);
        notice.insertBefore(para,notice.firstChild); 
    }
    else{
        const para = collection[0]
        para.innerText = msg ; 
    };
    
}
async function post(filename){
    let postReponse = await fetch(endpoint, {
        method: 'post',
		headers: {'Content-Type': 'text/plain'},
        body: filename,
        });
    return(postReponse)
}
function* read_in_chunks(file){
    let numberofChunks = Math.ceil(file.size/chunkSize)
    let count = 0;
    while (count < numberofChunks) {
        let offset = count*chunkSize;
        let chunk = file.slice(offset,offset+chunkSize);
        count++;
        yield chunk;
    }
}
async function put(chunk,conectionID,block,fileSize){
    next = chunkSize*block-chunkSize;
    last = next+chunk.size
    let content_range = "bytes "+next.toString()+"-"+last.toString()+"/"+fileSize.toString();
    let putReponse = await fetch(endpoint+"/"+conectionID, {
        method: 'put',
		headers:{"Content-type":"application/octet-stream","Content-Range":content_range},
        body: chunk,
        });
    return(putReponse)
}
async function putInLoop(chunks,filename,fileSize,conectionID){
    let numberofChunks = Math.ceil(fileSize/chunkSize);
    let block = 1
    let timePerchunk = 2*60*1000 //ms
    let timeout =  numberofChunks*timePerchunk
    const limit = Date.now()+timeout
    for (const chunk of chunks){
        let checker = false
        while (checker == false){
            msg = "File \""+filename+"\" is uploading "+((block-1)/numberofChunks*100).toString()+" %"
            notice(msg,conectionID)
            let result = await  put(chunk,conectionID,block,fileSize);
            let status = result.status 
            if (status == 200){
                checker = true
                block += 1
            }
            if (Date.now() > limit) {
                return false
            }
        }
    }
    return true
}
async function upload(file){
    let filename = file.name;
    let postResponse = await post(filename);
    if (postResponse.status == 200){
        let conectionID = await postResponse.text()
        let chunks = read_in_chunks(file);
        let rerult = await putInLoop(chunks,filename,file.size,conectionID)
        if (rerult == true) {
            let msg = "File "+filename+" was uploaded successfully"
            notice(msg,conectionID);
            return
        }
        let msg = "Failed to upload file "+filename+", timeout"
        notice(msg,conectionID);
        return
    } else{
        let msg = "Failed to upload file "+filename
        notice(msg,"400");
    }
    return
}
function dropHandler(ev) {
    console.log('File(s) dropped');
    ev.preventDefault();
    let box = document.getElementById("drop_zone");
    box.classList.remove('dragging');
    if (ev.dataTransfer.items) {
      [...ev.dataTransfer.items].forEach((item, i) => {
        if (item.kind === 'file') {
          const file = item.getAsFile();
          console.log(`… file[${i}].name = ${file.name}`);
          upload(file)
        }
      });
    }
  }
function dragOverHandler(ev) {
    ev.preventDefault();
    let box = document.getElementById("drop_zone");
    box.classList.add('dragging');
  }
function dragLeaveHandler(ev) {
    ev.preventDefault();
    let box = document.getElementById("drop_zone");
    box.classList.remove('dragging');
}
window.onload=function(){
    const myForm = document.getElementById("myForm");
    const inpFile = document.getElementById("myFiles");
    if (myForm ){
    myForm.addEventListener("submit", async e => {
        e.preventDefault();
        for (let file of inpFile.files){
            upload(file)
        } 
	});
    }
}
