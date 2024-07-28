import * as vscode from 'vscode';

// Función de activación que se llama cuando se activa la extensión
export function activate(context: vscode.ExtensionContext) {
    let disposable = vscode.commands.registerCommand('playjs.runPlayJS', () => {
        const panel = vscode.window.createWebviewPanel(
            'playJS',
            'playJS',
            vscode.ViewColumn.One,
            {
                enableScripts: true,
                retainContextWhenHidden: true
            }
        );

        panel.webview.html = getWebviewContent();

        panel.webview.onDidReceiveMessage(
            message => {
                switch (message.command) {
                    case 'run':
                        runCode(message.code, panel.webview);
                        break;
                }
            },
            undefined,
            context.subscriptions
        );
    });

    context.subscriptions.push(disposable);
}

/* function getWebviewContent() {
    return `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>playJS</title>
    </head>
    <body>
        <h1>playJS Active!</h1>
        <textarea id="code" style="width:300px;height:100px;"></textarea>
        <button onclick="runCode()">Run</button>
        <div id="result">Results will appear here...</div>
        <script>
            const vscode = acquireVsCodeApi();
            function runCode() {
                const code = document.getElementById('code').value;
                vscode.postMessage({
                    command: 'run',
                    code: code
                });
            }

            window.addEventListener('message', event => {
                const message = event.data;
                switch (message.command) {
                    case 'showResult':
                        document.getElementById('result').textContent = message.result;
                        break;
                }
            });
        </script>
    </body>
    </html>`;
} */

	function getWebviewContent() {
		return `<!DOCTYPE html>
		<html lang="en">
		<head>
			<meta charset="UTF-8">
			<meta name="viewport" content="width=device-width, initial-scale=1.0">
			<title>playJS</title>
			<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.20.0/min/vs/editor/editor.main.css">
			<style>
				body, html {
					height: 100%;
					margin: 0;
					font-family: Arial, sans-serif;
					background-color: #1e1e1e;
					color: #d4d4d4;
				}
				#container {
					display: flex;
					height: 100%;
				}
				#editor, #resultPanel {
					flex: 1;
					padding: 10px;
				}
				#resultPanel {
					background-color: #252526;
					border-left: 1px solid #333;
				}
				#result {
					height: 80%;
					background-color: #252526;
					color: #d4d4d4;
					border: none;
					padding: 10px;
					box-sizing: border-box;
					overflow-y: auto;
				}
				button {
					width: 100%;
					padding: 10px;
					margin-top: 10px;
					background-color: #007acc;
					color: white;
					font-size: 16px;
					border: none;
					cursor: pointer;
				}
				button:hover {
					background-color: #005a9e;
				}
			</style>
		</head>
		<body>
			<div id="container">
				<div id="editor" style="height:80%"></div>
				<div id="resultPanel">
					<button onclick="runCode()">Run</button>
					<div id="result">Results will appear here...</div>
				</div>
			</div>
	
			<script src="https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.20.0/min/vs/loader.js"></script>
			<script>
				var editor;
				require.config({ paths: { 'vs': 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.20.0/min/vs' }});
				require(['vs/editor/editor.main'], function() {
					editor = monaco.editor.create(document.getElementById('editor'), {
						value: [
                        'function helloWord() {',
                        '\tconsole.log("Hello world!");',
                        '}',
                        '',
                        'helloWord();' 
                    	].join('\\n'),
						language: 'javascript',
						theme: 'vs-dark'
					});
				});
	
				const vscode = acquireVsCodeApi();
				function runCode() {
					const code = editor.getValue();
					vscode.postMessage({
						command: 'run',
						code: code
					});
				}
	
				window.addEventListener('message', event => {
					const message = event.data;
					switch (message.command) {
						case 'showResult':
							document.getElementById('result').textContent = message.result;
							break;
					}
				});
			</script>
		</body>
		</html>`;
	}
	
	

function runCode(code: string, webview: vscode.Webview) { 
    let logs: string[] = [];
    let localConsole = {
        log: (...args: any[]) => {
            logs.push(args.map(arg => JSON.stringify(arg)).join(' '));
        }
    };

    try {
        let result = eval(`
            (function() {
                const console = localConsole;
                return eval(code);
            })()
        `);

        let output = logs.join('\n');
        if (result !== undefined) {
            output += `${result}`;
        }

        webview.postMessage({ command: 'showResult', result: output || 'Script executed without visible output.' });
    } catch (error) {
        if (error instanceof Error) {
            webview.postMessage({ command: 'showResult', result: `Error: ${error.message}` });
        } else {
            webview.postMessage({ command: 'showResult', result: 'An unknown error occurred.' });
        }
    }
}

export function deactivate() {}
