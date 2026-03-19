import React, { useEffect, useRef } from 'react';

const CodeRunner = ({ code, language, onClose }) => {
    const iframeRef = useRef(null);

    const runCode = async () => {
        if (iframeRef.current) {
            const iframeDoc = iframeRef.current.contentDocument || iframeRef.current.contentWindow.document;
            iframeDoc.open();

            // For web languages, just render directly
            if (language === 'htmlmixed' || language === 'html' || language === 'css' || language === 'xml') {
                iframeDoc.write(code);
                iframeDoc.close();
            } else {
                // For other languages, call the backend execution API
                iframeDoc.write('<html><body style="font-family: monospace; padding: 10px; background: #fff; color: #000;">Running code...</body></html>');
                iframeDoc.close();

                try {
                    let exeLang = language;
                    if (language === 'clike') exeLang = 'cpp'; // Default clike to C++

                    const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';
                    const response = await fetch(`${backendUrl}/api/execute`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ code, language: exeLang })
                    });

                    const data = await response.json();

                    iframeDoc.open();
                    const outputHtml = data.output
                        ? data.output.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>')
                        : 'No output or execution failed.';
                    iframeDoc.write('<html><body style="font-family: monospace; padding: 10px; background: #fff; color: #000;">' + outputHtml + '</body></html>');
                    iframeDoc.close();
                } catch (err) {
                    iframeDoc.open();
                    iframeDoc.write('<html><body style="font-family: monospace; padding: 10px; color: red;">Error executing code: ' + err.message + '</body></html>');
                    iframeDoc.close();
                }
            }
        }
    };

    useEffect(() => {
        runCode();
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    return (
        <div className="codeRunnerPopup" style={{
            position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
            background: 'linear-gradient(135deg, #1e1e2f 0%, #2a2a40 100%)',
            padding: '24px', borderRadius: '16px', zIndex: 1000,
            width: '90%', maxWidth: '1200px', height: '85%',
            display: 'flex', flexDirection: 'column',
            boxShadow: '0 20px 40px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.05) inset',
            backdropFilter: 'blur(10px)',
            animation: 'fadeIn 0.3s ease-out'
        }}>
            <style>{`
            @keyframes fadeIn {
                from { opacity: 0; transform: translate(-50%, -48%); }
                to { opacity: 1; transform: translate(-50%, -50%); }
            }
            @keyframes pulse {
                0% { transform: scale(1); }
                50% { transform: scale(1.05); }
                100% { transform: scale(1); }
            }
            .btn {
                transition: all 0.2s ease;
                font-weight: 600;
                letter-spacing: 0.5px;
                text-transform: uppercase;
                font-size: 0.85rem;
            }
            .btn:hover {
                transform: translateY(-2px);
                box-shadow: 0 5px 15px rgba(0,0,0,0.3);
            }
            .btn:active {
                transform: translateY(0);
            }
            .btnRetry {
                background: linear-gradient(135deg, #50fa7b, #36d65c);
                color: #1e1e2f;
            }
            .btnClose {
                background: linear-gradient(135deg, #ff5555, #ff3838);
                color: #fff;
            }
            .btnClose:hover {
                background: linear-gradient(135deg, #ff3838, #ff1f1f);
            }
        `}</style>

            <div className="codeRunnerContainer" style={{
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
                gap: '16px'
            }}>
                <div className="codeRunnerHeader" style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '0 8px'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                            width: '12px',
                            height: '12px',
                            borderRadius: '50%',
                            background: '#50fa7b',
                            boxShadow: '0 0 10px #50fa7b',
                            animation: 'pulse 2s infinite'
                        }} />
                        <h3 style={{
                            color: '#fff',
                            margin: 0,
                            fontSize: '1.6rem',
                            fontWeight: '600',
                            background: 'linear-gradient(135deg, #fff, #a8a8b8)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            letterSpacing: '-0.5px'
                        }}>
                            Live Output
                        </h3>
                    </div>

                    <div style={{ display: 'flex', gap: '12px' }}>
                        <button
                            onClick={runCode}
                            className="btn btnRetry"
                            style={{
                                padding: '10px 24px',
                                border: 'none',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontWeight: '600',
                                fontSize: '0.9rem',
                                background: 'linear-gradient(135deg, #50fa7b, #36d65c)',
                                color: '#1e1e2f',
                                boxShadow: '0 4px 15px rgba(80, 250, 123, 0.3)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                            }}
                        >
                            <span style={{ fontSize: '1.2rem' }}>⟳</span>
                            Run Again
                        </button>
                        <button
                            onClick={onClose}
                            className="btn btnClose"
                            style={{
                                padding: '10px 24px',
                                border: 'none',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontWeight: '600',
                                fontSize: '0.9rem',
                                background: 'linear-gradient(135deg, #ff5555, #ff3838)',
                                color: '#fff',
                                boxShadow: '0 4px 15px rgba(255, 85, 85, 0.3)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                            }}
                        >
                            <span style={{ fontSize: '1.2rem' }}>✕</span>
                            Close
                        </button>
                    </div>
                </div>

                <div className="codeRunnerBody" style={{
                    flex: 1,
                    background: '#1a1a2e',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    display: 'flex',
                    border: '1px solid rgba(255,255,255,0.1)',
                    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.4), 0 8px 20px rgba(0,0,0,0.3)'
                }}>
                    <div style={{
                        width: '40px',
                        background: '#0f0f1a',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        padding: '12px 0',
                        gap: '8px',
                        borderRight: '1px solid rgba(255,255,255,0.05)'
                    }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ff5f56' }} />
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ffbd2e' }} />
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#27c93f' }} />
                    </div>
                    <iframe
                        ref={iframeRef}
                        title="Live Output"
                        style={{
                            width: 'calc(100% - 40px)',
                            height: '100%',
                            border: 'none',
                            background: '#ffffff'
                        }}
                    />
                </div>

                <div style={{
                    display: 'flex',
                    justifyContent: 'flex-end',
                    padding: '8px 12px',
                    background: 'rgba(0,0,0,0.2)',
                    borderRadius: '8px',
                    color: 'rgba(255,255,255,0.5)',
                    fontSize: '0.8rem',
                    fontFamily: 'monospace'
                }}>
                    <span>⚡ Ready to run • Click "Run Again" to execute</span>
                </div>
            </div>
        </div>
    );
};

export default CodeRunner;



