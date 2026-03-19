import React, { useEffect, useRef, useImperativeHandle } from "react";
import { language, cmtheme } from "../../src/atoms";
import { useRecoilValue } from "recoil";
import ACTIONS from "../actions/Actions";

// CODE MIRROR
import Codemirror from "codemirror";
import "codemirror/lib/codemirror.css";

// theme
import "codemirror/theme/3024-day.css";
import "codemirror/theme/3024-night.css";
import "codemirror/theme/abbott.css";
import "codemirror/theme/abcdef.css";
import "codemirror/theme/ambiance.css";
import "codemirror/theme/ayu-dark.css";
import "codemirror/theme/ayu-mirage.css";
import "codemirror/theme/base16-dark.css";
import "codemirror/theme/base16-light.css";
import "codemirror/theme/bespin.css";
import "codemirror/theme/blackboard.css";
import "codemirror/theme/cobalt.css";
import "codemirror/theme/colorforth.css";
import "codemirror/theme/darcula.css";
import "codemirror/theme/dracula.css";
import "codemirror/theme/duotone-dark.css";
import "codemirror/theme/duotone-light.css";
import "codemirror/theme/eclipse.css";
import "codemirror/theme/elegant.css";
import "codemirror/theme/erlang-dark.css";
import "codemirror/theme/gruvbox-dark.css";
import "codemirror/theme/hopscotch.css";
import "codemirror/theme/icecoder.css";
import "codemirror/theme/idea.css";
import "codemirror/theme/isotope.css";
import "codemirror/theme/juejin.css";
import "codemirror/theme/lesser-dark.css";
import "codemirror/theme/liquibyte.css";
import "codemirror/theme/lucario.css";
import "codemirror/theme/material.css";
import "codemirror/theme/material-darker.css";
import "codemirror/theme/material-palenight.css";
import "codemirror/theme/material-ocean.css";
import "codemirror/theme/mbo.css";
import "codemirror/theme/mdn-like.css";
import "codemirror/theme/midnight.css";
import "codemirror/theme/monokai.css";
import "codemirror/theme/moxer.css";
import "codemirror/theme/neat.css";
import "codemirror/theme/neo.css";
import "codemirror/theme/night.css";
import "codemirror/theme/nord.css";
import "codemirror/theme/oceanic-next.css";
import "codemirror/theme/panda-syntax.css";
import "codemirror/theme/paraiso-dark.css";
import "codemirror/theme/paraiso-light.css";
import "codemirror/theme/pastel-on-dark.css";
import "codemirror/theme/railscasts.css";
import "codemirror/theme/rubyblue.css";
import "codemirror/theme/seti.css";
import "codemirror/theme/shadowfox.css";
import "codemirror/theme/solarized.css";
import "codemirror/theme/the-matrix.css";
import "codemirror/theme/tomorrow-night-bright.css";
import "codemirror/theme/tomorrow-night-eighties.css";
import "codemirror/theme/ttcn.css";
import "codemirror/theme/twilight.css";
import "codemirror/theme/vibrant-ink.css";
import "codemirror/theme/xq-dark.css";
import "codemirror/theme/xq-light.css";
import "codemirror/theme/yeti.css";
import "codemirror/theme/yonce.css";
import "codemirror/theme/zenburn.css";

// modes
import "codemirror/mode/clike/clike";
import "codemirror/mode/css/css";
import "codemirror/mode/htmlmixed/htmlmixed";
import "codemirror/mode/javascript/javascript";
import "codemirror/mode/markdown/markdown";
import "codemirror/mode/php/php";
import "codemirror/mode/python/python";
import "codemirror/mode/sql/sql";

// features
import "codemirror/addon/edit/closetag";
import "codemirror/addon/edit/closebrackets";
import "codemirror/addon/scroll/simplescrollbars.css";

//search
import "codemirror/addon/search/search.js";
import "codemirror/addon/search/searchcursor.js";
import "codemirror/addon/search/jump-to-line.js";
import "codemirror/addon/dialog/dialog.js";
import "codemirror/addon/dialog/dialog.css";
const Editor = React.forwardRef(({ socketRef, socket, roomId, onCodeChange }, ref) => {
  const editorRef = useRef(null);
  const lang = useRecoilValue(language);
  const editorTheme = useRecoilValue(cmtheme);

  // Keep track of the latest onCodeChange function to avoid closure stale state
  const onCodeChangeRef = useRef(onCodeChange);
  const cursorsRef = useRef({});
  useEffect(() => {
    onCodeChangeRef.current = onCodeChange;
  }, [onCodeChange]);

  useImperativeHandle(ref, () => ({
    setCode: (code) => {
      if (editorRef.current) {
        editorRef.current.setValue(code);
      }
    },
  }));

  // 1. Initialize Editor (Runs ONLY ONCE on mount)
  useEffect(() => {
    async function init() {
      editorRef.current = Codemirror.fromTextArea(
        document.getElementById("realtimeEditor"),
        {
          mode: { name: lang },
          theme: editorTheme,
          autoCloseTags: true,
          autoCloseBrackets: true,
          lineNumbers: true,
        }
      );

      editorRef.current.on("change", (instance, changes) => {
        const { origin } = changes;
        const code = instance.getValue();

        console.log("main:editor: ", code);

        // Use the ref to always trigger the latest callback
        onCodeChangeRef.current(code);

        if (origin !== "setValue" && socketRef.current) {
          socketRef.current.emit(ACTIONS.CODE_CHANGE, {
            roomId,
            code,
          });
        }
      });

      editorRef.current.on("cursorActivity", (instance) => {
        if (socketRef.current) {
          const cursor = instance.getCursor();
          socketRef.current.emit(ACTIONS.CURSOR_CHANGE, {
            roomId,
            cursor,
          });
        }
      });
    }
    init();
    // We explicitly disable the linter here because we ONLY want this to run once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 2. Handle Theme Changes Dynamically
  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.setOption("theme", editorTheme);
    }
  }, [editorTheme]);

  // 3. Handle Language Changes Dynamically (Fixes the duplication bug!)
  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.setOption("mode", { name: lang });
    }
  }, [lang]);

  // 4. Handle Socket Connections & Cleanup
  useEffect(() => {
    if (!socket) return;

    const handleRemoteCodeChange = ({ code }) => {
      if (code !== null && editorRef.current) {
        // Prevent recursive triggers
        const currentCode = editorRef.current.getValue();
        if (code !== currentCode) {
            editorRef.current.setValue(code);
        }
      }
    };

    const handleRemoteCursorChange = ({ socketId, cursor, username }) => {
      if (!editorRef.current) return;

      if (cursorsRef.current[socketId]) {
        cursorsRef.current[socketId].clear();
      }

      const cursorNode = document.createElement("span");
      cursorNode.className = "remote-cursor";

      const tooltip = document.createElement("span");
      tooltip.className = "remote-cursor-tooltip";
      tooltip.innerText = username || "Anonymous";
      cursorNode.appendChild(tooltip);

      const bookmark = editorRef.current.setBookmark(cursor, {
        widget: cursorNode,
        insertLeft: true,
      });

      cursorsRef.current[socketId] = bookmark;

      // Automatically hide tooltip after 2s
      setTimeout(() => {
        if (tooltip && tooltip.parentNode) {
            tooltip.style.opacity = "0";
        }
      }, 2000);
    };

    socket.on(ACTIONS.CODE_CHANGE, handleRemoteCodeChange);
    socket.on(ACTIONS.CURSOR_CHANGE, handleRemoteCursorChange);

    return () => {
      socket.off(ACTIONS.CODE_CHANGE, handleRemoteCodeChange);
      socket.off(ACTIONS.CURSOR_CHANGE, handleRemoteCursorChange);
      
      // Cleanup cursors
      // eslint-disable-next-line react-hooks/exhaustive-deps
      Object.values(cursorsRef.current).forEach(bookmark => bookmark.clear());
    };
  }, [socket]);

  return <textarea id="realtimeEditor"></textarea>;
});

export default Editor;