import React, { useState, useRef, useEffect } from "react";
import toast from "react-hot-toast";
import Client from "../components/Client";
import Editor from "../components/Editor";
import FilePreview from "../components/FilePreview";
import { language, cmtheme } from "../../src/atoms";
import { useRecoilState } from "recoil";
import ACTIONS from "../actions/Actions";
import { initSocket } from "../socket";
import {
  useLocation,
  useNavigate,
  Navigate,
  useParams,
} from "react-router-dom";

const EditorPage = () => {
  const [lang, setLang] = useRecoilState(language);
  const [them, setThem] = useRecoilState(cmtheme);

  const [clients, setClients] = useState([]);

  const socketRef = useRef(null);
  const [socket, setSocket] = React.useState(null);
  const codeRef = useRef(null);
  const location = useLocation();
  const { roomId } = useParams();
  const reactNavigator = useNavigate();

  // Extract username to a stable variable for the dependency array
  const username = location.state?.username;

  const [filePreview, setFilePreview] = useState(false);
  const [showCodeRunner, setShowCodeRunner] = useState(false);
  const [fileContent, setFileContent] = useState("");
  const fileInputRef = useRef(null);
  const editorInstanceRef = useRef(null);

  useEffect(() => {
    const init = async () => {
      socketRef.current = await initSocket();
      setSocket(socketRef.current);
      socketRef.current.on("connect_error", (err) => handleErrors(err));
      socketRef.current.on("connect_failed", (err) => handleErrors(err));

      function handleErrors(e) {
        console.log("socket error", e);
        toast.error("Socket connection failed, try again later.");
        reactNavigator("/");
      }

      socketRef.current.emit(ACTIONS.JOIN, {
        roomId,
        username,
      });

      // Listening for joined event
      socketRef.current.on(
        ACTIONS.JOINED,
        ({ clients, username: joinedUsername, socketId }) => {
          if (joinedUsername !== username) {
            toast.success(`${joinedUsername} joined the room.`);
            console.log(`${joinedUsername} joined`);
          }
          setClients(clients);
          socketRef.current.emit(ACTIONS.SYNC_CODE, {
            code: codeRef.current,
            socketId,
          });
        }
      );

      // Listening for disconnected
      socketRef.current.on(ACTIONS.DISCONNECTED, ({ socketId, username: leftUsername }) => {
        toast.success(`${leftUsername} left the room.`);
        setClients((prev) => {
          return prev.filter((client) => client.socketId !== socketId);
        });
      });
    };

    init();

    // Cleanup function
    return () => {
      const currentSocket = socketRef.current;
      if (currentSocket) {
        currentSocket.off(ACTIONS.JOINED);
        currentSocket.off(ACTIONS.DISCONNECTED);
        currentSocket.disconnect();
      }
    };
  }, [roomId, username, reactNavigator]); // Added missing dependencies!

  async function copyRoomId() {
    try {
      await navigator.clipboard.writeText(roomId);
      toast.success("Room ID has been copied to clipboard");
    } catch (err) {
      toast.error("Could not copy the Room ID");
      console.error(err);
    }
  }

  function leaveRoom() {
    reactNavigator("/");
  }

  if (!location.state) {
    return <Navigate to="/" />;
  }

  function handleFileUpload(event) {
    console.log("hello");
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = function (e) {
        const fileContent = e.target.result;
        setFileContent(fileContent);
        setFilePreview(true);
      };
      reader.readAsText(file);
    }
  }

  const resetFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const updateEditorCode = (newCode) => {
    editorInstanceRef.current?.setCode(newCode);
    codeRef.current = newCode;
    socketRef.current.emit(ACTIONS.CODE_CHANGE, {
      roomId,
      code: newCode,
    });
  };

  const handleAppendCode = () => {
    const currentCode = codeRef.current || "";
    const appendedCode = currentCode
      ? `${currentCode}\n\n${fileContent}`
      : fileContent;

    updateEditorCode(appendedCode);
    setFilePreview(false);
    resetFileInput();
  };

  const handleReplaceCode = () => {
    updateEditorCode(fileContent);
    setFilePreview(false);
    resetFileInput();
  };

  return (
    <div className="mainWrap">
      <div className="aside">
        <div className="asideInner">
          <div className="logo">
            <img className="logoImage" src="/logo.png" alt="logo" />
          </div>
          <h3>Connected</h3>
          <div className="clientsList">
            {clients.map((client) => (
              <Client key={client.socketId} username={client.username} />
            ))}
          </div>
        </div>

        <div className="editorControls">
          <label>
            Language
            <select
              value={lang}
              onChange={(e) => {
                setLang(e.target.value);
              }}
              className="seLang"
            >
              <option value="clike">C / C++ / C# / Java</option>
              <option value="css">CSS</option>
              <option value="dart">Dart</option>
              <option value="django">Django</option>
              <option value="dockerfile">Dockerfile</option>
              <option value="go">Go</option>
              <option value="htmlmixed">HTML-mixed</option>
              <option value="javascript">JavaScript</option>
              <option value="jsx">JSX</option>
              <option value="markdown">Markdown</option>
              <option value="php">PHP</option>
              <option value="python">Python</option>
              <option value="r">R</option>
              <option value="rust">Rust</option>
              <option value="ruby">Ruby</option>
              <option value="sass">Sass</option>
              <option value="shell">Shell</option>
              <option value="sql">SQL</option>
              <option value="swift">Swift</option>
              <option value="xml">XML</option>
              <option value="yaml">yaml</option>
            </select>
          </label>

          <label>
            Theme
            <select
              value={them}
              onChange={(e) => {
                setThem(e.target.value);
              }}
              className="seLang"
            >
              <option value="default">default</option>
              <option value="3024-day">3024-day</option>
              <option value="3024-night">3024-night</option>
              <option value="abbott">abbott</option>
              <option value="abcdef">abcdef</option>
              <option value="ambiance">ambiance</option>
              <option value="ayu-dark">ayu-dark</option>
              <option value="ayu-mirage">ayu-mirage</option>
              <option value="base16-dark">base16-dark</option>
              <option value="base16-light">base16-light</option>
              <option value="bespin">bespin</option>
              <option value="blackboard">blackboard</option>
              <option value="cobalt">cobalt</option>
              <option value="colorforth">colorforth</option>
              <option value="darcula">darcula</option>
            </select>
          </label>
        </div>

        <div className="actionButtons">
          <button className="btn runBtn" onClick={() => setShowCodeRunner(true)} style={{ background: 'var(--accent-success)', color: '#022c22', marginBottom: '10px' }}>
            Run Code
          </button>
          <input type="file" accept=".js,.py,.java,.cpp,.c,.txt,.html,.css" style={{ display: "none" }} id="fileUpload" onChange={handleFileUpload} ref={fileInputRef} />
          <button className="btn uploadFileBtn" onClick={() => document.getElementById("fileUpload").click()}>
            Upload File
          </button>
          <button className="btn copyBtn" onClick={copyRoomId}>
            Copy ROOM ID
          </button>
          <button className="btn leaveBtn" onClick={leaveRoom}>
            Leave Room
          </button>
        </div>
      </div>

      <div className="editorWrap">
        <Editor
          ref={editorInstanceRef}
          socketRef={socketRef}
          socket={socket}
          roomId={roomId}
          onCodeChange={(code) => {
            console.log("on code change" + code);
            codeRef.current = code;
          }}
        />

        {
          filePreview && <FilePreview
            setFilePreview={setFilePreview}
            fileContent={fileContent}
            resetFileInput={resetFileInput}
            onAppend={handleAppendCode}
            onReplace={handleReplaceCode} />
        }

        {
          showCodeRunner && <CodeRunner
            code={codeRef.current}
            language={lang}
            onClose={() => setShowCodeRunner(false)}
          />
        }



      </div>
    </div>
  );
};

export default EditorPage;