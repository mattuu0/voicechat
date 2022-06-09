if (navigator.userAgent.indexOf('iPhone') > 0 || navigator.userAgent.indexOf('Android') > 0 && navigator.userAgent.indexOf('Mobile') > 0 || navigator.userAgent.indexOf('iPad') > 0 || navigator.userAgent.indexOf('Android') > 0) {
    window.location.href = "mshow.html"

}

var sessionuuid = uuidv4()
var connect_btn = document.getElementById("connect_button")
var username_input = document.getElementById("username_input")
var connectid_input = document.getElementById("connectid_input")
var first_form = document.getElementById("first_form")
var full_overlay = document.getElementById("first_overlay")
var showid = document.getElementById("show_roomid")
var muteinput = document.getElementById("toggle")
var Observer_users_show = document.getElementById('observer_area_id');
var teamA_users_show = document.getElementById('team_A_area');
var teamB_users_show = document.getElementById('team_B_area');
var idinput = document.getElementById("connectid_input")
var show_team = document.getElementById("show_team")
var username;
var usericon;


var peer = new Peer(sessionuuid,options);
var connectdict = {}
client_init(sessionuuid)
var streamdict = {}
var usermediaid = uuidv4()
var mediastream;
var myicon;


var options = {
    host: location.hostname,
    port: location.port,
    path: '/api', // app.use('/api', peerServer);と同じ位置になるように
};

//関数
function audio_set_mute(ismute){
    for (var audiotrack of mediastream.getAudioTracks()){
        audiotrack.enabled = !ismute
    }
}
function client_init(userid){
    connectdict[userid] = {
        "streams":{},
        "conn":null,
        "tags":["observer"],
        "username":"",
        "calls":[]
    }
}

muteinput.addEventListener("change",function(){
    audio_set_mute(!muteinput.checked)
})

//callに対する応答
peer.on("call",function(call){
    if (!(call.peer in connectdict)){
        client_init(call.peer)
    }

    if (call.metadata !== undefined){
        var streamid = call.metadata["streamid"]
        //console.log(streamdict[streamid])
        if (streamdict[streamid] !== undefined){
            call.answer(streamdict[streamid])
        }else {
            call.answer()
        }
    }else{
        call.answer()
    }
    connectdict[call.peer]["calls"].push(call)

    var show_object;

    call.on("stream",function(remoteStream){
        //console.log(remoteStream)
        if (!(call.metadata["is_empty"])){
            var streamtype = call.metadata["stream_type"]
                
            show_object = show_stream(remoteStream,streamtype,call.peer)
                
        } else {
            show_object = show_stream(remoteStream,"empty",call.peer)
        }
    })

    call.on("close",function(){
        try{
            show_object.remove()
        }catch(err){
            //console.log(err)
        }
    })
})

peer.on("connection",function(conn){
    conn.on('data', function(data){
        recv_data(conn,data)
    });
    conn.on('open', function(){
        if (!(conn.peer in connectdict)){
            client_init(conn.peer)
        }
        connectdict[conn.peer]["conn"] = conn
    });
    conn.on("close",function(){
        send_Close_Event(conn.peer)
    })
})


function senadll(data){
    for (var sendid of Object.keys(connectdict)){
        if (!(sendid == sessionuuid)){
            try{
                connectdict[sendid]["conn"].send(data)
            }catch(err){

            }
        }
    }
}

function close_call(userid){
    for (var call of connectdict[userid]["calls"]){
        try{
            call.peerConnection.close();
        }catch(err){

        }
        try{
            call.close()
        }catch(err){

        }
    }
    connectdict[userid]["calls"] = []
}

function change_call(parsedata,move_tag){
    if (move_tag == "team_A"){
        if (connectdict[sessionuuid]["tags"].includes("team_A")){
            call_Connect(parsedata["userid"],"audio",mediastream,{"streamid":parsedata["args"]["streamid"]})
        } else if (connectdict[sessionuuid]["tags"].includes("team_B")){
            call_Connect(parsedata["userid"],"audio",null,{"streamid":""})
        } else if (connectdict[sessionuuid]["tags"].includes("observer")){
            call_Connect(parsedata["userid"],"audio",null,{"streamid":parsedata["args"]["streamid"]})
        }
    } else if (move_tag == "team_B"){
        if (connectdict[sessionuuid]["tags"].includes("team_B")){
            call_Connect(parsedata["userid"],"audio",mediastream,{"streamid":parsedata["args"]["streamid"]})
        } else if (connectdict[sessionuuid]["tags"].includes("team_A")){
            call_Connect(parsedata["userid"],"audio",null,{"streamid":""})
        } else if (connectdict[sessionuuid]["tags"].includes("observer")){
            call_Connect(parsedata["userid"],"audio",null,{"streamid":parsedata["args"]["streamid"]})
        }
    } else if (move_tag == "observer"){
        if (connectdict[sessionuuid]["tags"].includes("observer")){
            call_Connect(parsedata["userid"],"audio",mediastream,{"streamid":parsedata["args"]["streamid"]})
        } else if (connectdict[sessionuuid]["tags"].includes("team_A")){
            call_Connect(parsedata["userid"],"audio",mediastream,{"streamid":""})
        } else if (connectdict[sessionuuid]["tags"].includes("team_B")){
            call_Connect(parsedata["userid"],"audio",mediastream,{"streamid":""})
        }
    }
}

function recv_data(conn,data){
    var parsedata = parsecommand(data)

    if (parsedata["command"] == "Send_My_Data"){
        var senddata = gencommand("All_Connect")
        for (var conntag of parsedata["args"]["now_list"]){ 
            if (!(conntag in connectdict)){
                connect_conn(conntag,senddata)
            }
        }
        
        
        if (parsedata["args"]["tags"].includes("observer")){
            call_Connect(parsedata["userid"],"audio",mediastream,{"streamid":parsedata["args"]["audio_Stramid"]})
        } else {
            call_Connect(parsedata["userid"],"audio",null,{"streamid":parsedata["args"]["audio_Stramid"]})
        }

        connectdict[parsedata["userid"]]["username"] = parsedata["args"]["username"]
        connectdict[parsedata["userid"]]["usericon"] = parsedata["args"]["usericon"]
        connectdict[parsedata["userid"]]["tags"] = parsedata["args"]["tags"]
    } else if (parsedata["command"] == "Send_New_Data") {
        if (parsedata["args"]["tags"].includes("observer")){
            call_Connect(conn.peer,"audio",mediastream,{"streamid":parsedata["args"]["audio_Stramid"]})
        }else{
            call_Connect(conn.peer,"audio",null,{"streamid":parsedata["args"]["audio_Stramid"]})
        }

        connectdict[conn.peer]["username"] = parsedata["args"]["username"]
        connectdict[conn.peer]["usericon"] = parsedata["args"]["usericon"]
        connectdict[conn.peer]["tags"] = parsedata["args"]["tags"]
    } else if (parsedata["command"] == "All_Connect"){
        if (!(parsedata["userid"] in connectdict)){
            client_init(parsedata["userid"])
        }
        connectdict[parsedata["userid"]]["username"] = parsedata["args"]["username"]
        connectdict[parsedata["userid"]]["usericon"] = parsedata["args"]["usericon"]

        var new_connect = gencommand("Send_New_Data",{"tags":connectdict[sessionuuid]["tags"],"audio_Stramid":usermediaid})
        conn.send(new_connect)

    } else if (parsedata["command"] == "New_Connect"){
        connectdict[parsedata["userid"]]["username"] = parsedata["args"]["username"]
        connectdict[parsedata["userid"]]["usericon"] = parsedata["args"]["usericon"]

        var new_connect = gencommand("Send_My_Data",{"tags":connectdict[sessionuuid]["tags"],"now_list":Object.keys(connectdict),"audio_Stramid":usermediaid})
        conn.send(new_connect)
    } else if (parsedata["command"] == "Move_Event_Command"){
        

        if (parsedata["args"]["move_tag"] == "observer"){
            if (connectdict[parsedata["userid"]]["tags"].includes("observer")){
                return
            }
            close_call(parsedata["userid"])
            connectdict[parsedata["userid"]]["tags"] = []
            connectdict[parsedata["userid"]]["tags"].push("observer")

            change_call(parsedata,"observer")
        } else if (parsedata["args"]["move_tag"] == "team_A"){
            if (connectdict[parsedata["userid"]]["tags"].includes("team_A")){
                return
            }
            close_call(parsedata["userid"])
            connectdict[parsedata["userid"]]["tags"] = []
            connectdict[parsedata["userid"]]["tags"].push("team_A")
            
            change_call(parsedata,"team_A")
        } else if (parsedata["args"]["move_tag"] == "team_B"){
            if (connectdict[parsedata["userid"]]["tags"].includes("team_B")){
                return
            }
            close_call(parsedata["userid"])
            connectdict[parsedata["userid"]]["tags"] = []
            connectdict[parsedata["userid"]]["tags"].push("team_B")
            
            change_call(parsedata,"team_B")
        }
    }
}

function send_Close_Event(userid){
    //console.log(connectdict[userid])
    for (var removeid of Object.keys(connectdict[userid]["streams"])){
        try{
            connectdict[userid][removeid].remove()
        }catch(err){
            //console.log(err)
        }
    }
    try{
        delete connectdict[userid]
    }catch(err){
        
    }
}

function connect_conn(userid,senddata){
    if (!(userid in connectdict)){
        client_init(userid)
    }

    if (userid == sessionuuid){
        return
    }

    var conn = peer.connect(userid)

    connectdict[userid]["conn"] = conn
    conn.on('open', function(){
        conn.send(senddata);
    });
    conn.on('data', function(data){
        recv_data(conn,data)
    });
    conn.on("close",function(){
        send_Close_Event(userid)
    })
}

function createEmptyAudioTrack(){
    const ctx = new AudioContext();
    const oscillator = ctx.createOscillator();
    const dst = oscillator.connect(ctx.createMediaStreamDestination());
    oscillator.start();
    const track = dst.stream.getAudioTracks()[0];
    return Object.assign(track, { enabled: false });
};
//関数
function call_Connect(clientid,connecttype,streamobj,metadata){
    if (clientid == sessionuuid){
        return
    }

    if (!(clientid in connectdict)){
        client_init(clientid)
    }
    
    metadata["stream_type"] = connecttype
    if (streamobj == null){
        const audioTrack = createEmptyAudioTrack();
        const mediaStream = new MediaStream([audioTrack]);
        metadata["is_empty"] = true
        var call = peer.call(clientid,mediaStream,{metadata:metadata})
    } else {
        metadata["is_empty"] = false
        var call = peer.call(clientid,streamobj,{metadata:metadata})
    }
    var show_object;
    if (metadata["streamid"] == ""){
        show_object = show_stream(null,"empty",clientid)
    }
    connectdict[clientid]["calls"].push(call)
    call.on('stream', function (remoteStream) {
        //console.log(remoteStream)
        if (remoteStream !== undefined){
            var userid = clientid
            ////console.log(remoteStream)
            
            show_object = show_stream(remoteStream,connecttype,userid)
        }
    });
    call.on("close",function(){
        try{
            show_object.remove()
        }catch(err){
            //console.log(err)
        }
    })
}



function show_stream(streamobj,streamtype,userid){
    var dictkey = uuidv4()
    
    var User_show;
    if (connectdict[userid]["tags"].includes("observer")){
        User_show = Observer_users_show
    } else if (connectdict[userid]["tags"].includes("team_A")){
        User_show = teamA_users_show
    } else if (connectdict[userid]["tags"].includes("team_B")){
        User_show = teamB_users_show
    }
    
    if (streamtype == "audio"){
        var show_area = document.createElement("div")

        var audio = new Audio;
        audio.srcObject = streamobj
        audio.controls = true;
        audio.play()
        connectdict[userid][dictkey] = show_area
        connectdict[userid]["streams"][dictkey] = "audio"

        var user_icon_show = document.createElement("img")
        user_icon_show.src = connectdict[userid]["usericon"]

        show_area.appendChild(user_icon_show)
        show_area.appendChild(audio)

        User_show.appendChild(show_area)
        return show_area
    } else if (streamtype == "video"){
        var video = document.createElement("video");
        video.srcObject = streamobj
        video.controls = true;
        video.width = 700
        video.play()
        User_show.appendChild(video)
        connectdict[userid][dictkey] = video
        connectdict[userid]["streams"][dictkey] = "video"
        return video
    } else if (streamtype == "empty"){
        var show_area = document.createElement("div")

        connectdict[userid][dictkey] = show_area
        connectdict[userid]["streams"][dictkey] = "empty"

        var user_icon_show = document.createElement("img")
        user_icon_show.src = connectdict[userid]["usericon"]

        show_area.appendChild(user_icon_show)

        User_show.appendChild(show_area)
        return show_area
    }
}

function gencommand(commandtype,args){
    if (args == undefined){
        args = {}
    }
    args["username"] = username
    args["usericon"] = usericon
    var stringdict = {"command":commandtype,"userid":sessionuuid,"args":args}
    return JSON.stringify(stringdict)
}


function parsecommand(parsestring){
    return JSON.parse(parsestring)
}


connect_btn.addEventListener("click",function(){
    if (String(username_input.value).length < 1){
        alert("ユーザー名を入力してください")
        return
    }
    if (String(connectid_input.value).length < 1){
        if (!(window.confirm("接続先IDが入力されていません、新たにルームを作成しますか?"))){
            return
        }
    }
    first_form.classList.toggle('after_login');
    full_overlay.classList.toggle("after-Overlay")
    document.body.style.backgroundColor = "white"

    start_peer()
})


function toBase64Url(url, callback){
    var xhr = new XMLHttpRequest();
    xhr.onload = function() {
        var reader = new FileReader();
        reader.onloadend = function() {
        callback(reader.result);
        }
        reader.readAsDataURL(xhr.response);
    };
    xhr.open('GET', url);
    xhr.responseType = 'blob';
    xhr.send();
}

function start_peer(){
    try{
        navigator.mediaDevices.getUserMedia({audio:true,video:false}).then(function(stream){
            mediastream = stream
            streamdict[usermediaid] = mediastream
            connectdict[sessionuuid]["audioid"] = usermediaid
            audio_set_mute(true)

            toBase64Url("https://ui-avatars.com/api/name=" + String(username_input.value) + "?background=random",function(imgdata){
                usericon = imgdata
                showid.href = "https://Voicechat.mattuu.repl.co" + "/?connectid=" + sessionuuid
                username = username_input.value
                if (!(String(connectid_input.value).length < 1)){
                    var new_connect = gencommand("New_Connect",{"audio_id":usermediaid,"tags":connectdict[sessionuuid]["tags"],"username":username_input.value})
                    connect_conn(idinput.value,new_connect)
                }

                connectdict[sessionuuid]["usericon"] = usericon
                connectdict[sessionuuid]["tags"] = ["observer"]

                myicon = show_stream(null,"empty",sessionuuid)
                //move_event("observer")
            });
        }).catch(
            function(err) {
                //console.log(err)
                alert("使用するにはマイクへのアクセスを許可してください")
                window.location.reload()
        })
    }catch(err){
        alert("使用するにはマイクへのアクセスを許可してください")
        mediastream = null
        window.location.reload()
    }
    
    
}

function move_event(move_tag){
    
    if (connectdict[sessionuuid]["tags"].includes(move_tag)){
        return
    }

    for (var clientkey of Object.keys(connectdict)){
        try{
            for (var call of connectdict[clientkey]["calls"]){
                try{
                    call.peerConnection.close();
                }catch(err){

                }
                try{
                    call.close()
                }catch(err){

                }
            }
            connectdict[clientkey]["calls"] = []
        }catch(err){

        }
    }

    connectdict[sessionuuid]["tags"] = [move_tag]

    if (move_tag == "team_A"){
        show_team.textContent = "Aチーム"
    } else if (move_tag == "team_B"){
        show_team.textContent = "Bチーム"
    } else if (move_tag == "observer"){
        show_team.textContent = "観察者"
    }
    try{
        myicon.remove()
    }catch(err){

    }

    myicon = show_stream(null,"empty",sessionuuid)
}

Observer_users_show.addEventListener("dblclick",function(){
    move_event("observer")

    var movecommand = gencommand("Move_Event_Command",{"move_tag":"observer","streamid":usermediaid})
    senadll(movecommand)
})

teamA_users_show.addEventListener("dblclick",function(){
    move_event("team_A")

    var movecommand = gencommand("Move_Event_Command",{"move_tag":"team_A","streamid":usermediaid})
    senadll(movecommand)
})

teamB_users_show.addEventListener("dblclick",function(){
    move_event("team_B")

    var movecommand = gencommand("Move_Event_Command",{"move_tag":"team_B","streamid":usermediaid})
    senadll(movecommand)
})

/*
navigator.permissions.query({name: 'microphone'}).then(function (result) {
    if (result.state == 'granted') {

    } else if (result.state == 'prompt') {

    } else if (result.state == 'denied') {
        
    }
    result.onchange = function () {};
});
*/
//TODO 実際に使う際はここを消す

const url = new URL(window.location.href);
const params = new URLSearchParams(url.search);

try{
    if (!(params.get("connectid") == null)){
        connectid_input.value = String(params.get("connectid"))
    }
}catch(err){

}