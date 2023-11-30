// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as path from 'path';
import * as vscode from 'vscode';

function parsePythonClassPath(classPath: string): [string, string | undefined] {
	const pathSegments = classPath.split('.');
	const className = pathSegments.pop();
	const filePath = pathSegments.join('/');
	return [filePath, className];
}

function parseYamlPath(yamlPath: string): string | undefined {
	const pathParts = yamlPath.split(':');
	if (pathParts.length === 2) {
		const rootDir = pathParts[0];
		const path_ = pathParts[1];

		if (vscode.window.activeTextEditor) {
			const editorFilePath = vscode.window.activeTextEditor.document.uri.fsPath;
			const pathParts = editorFilePath.split('/');

			const rootIndex = pathParts.indexOf(rootDir);
			if (rootIndex !== -1) {
				const basePath = pathParts.slice(0, rootIndex + 1).join('/');
				return path.join(basePath, path_);
			}
		}
	}
	return undefined;
}

function findClassPosition(document: vscode.TextDocument, className: string): vscode.Range | undefined {
	const classRegex = new RegExp(`\\bclass\\s+${className}\\b`);
	for (let line = 0; line < document.lineCount; line++) {
	  const text = document.lineAt(line).text;
	  const match = text.match(classRegex);
	  if (match && match.index !== undefined) {
		const startPosition = new vscode.Position(line, match.index || 0);
		const endPosition = new vscode.Position(line, match.index + match[0].length);
		return new vscode.Range(startPosition, endPosition);
	  }
	}
  
	return undefined;
}

export function activate(context: vscode.ExtensionContext) {
	console.log('Congratulations, your extension "hydranav" is now active!');

	let disposable = vscode.commands.registerCommand('hydranav.helloWorld', () => {
		vscode.window.showInformationMessage('hydra_navi activated!');
	});

	context.subscriptions.push(disposable);
	context.subscriptions.push(
		vscode.languages.registerDefinitionProvider('yaml', {
			provideDefinition(
				document: vscode.TextDocument,
				position: vscode.Position,
				token: vscode.CancellationToken
			): vscode.ProviderResult<vscode.Definition> {
				const wordRange = document.getWordRangeAtPosition(position);
				if (!wordRange) {
					return undefined;
				}

				const selectedWord = document.getText(wordRange);
				if (selectedWord.endsWith('.yaml')) {
					const filePath = parseYamlPath(selectedWord);
					if (filePath) {
						const yamlUri = vscode.Uri.file(filePath); 
						vscode.window.showTextDocument(yamlUri);
					}
				}
				else {
					const [filePath, className] = parsePythonClassPath(selectedWord);
					if (className) {
						const pythonUri = vscode.Uri.file(path.join(vscode.workspace.rootPath || '', filePath + '.py'));
	
						vscode.workspace.openTextDocument(pythonUri).then(
							(pythonDoc) => {
								const classPosition = findClassPosition(pythonDoc, className);
								if (classPosition) {
									vscode.window.showTextDocument(pythonUri, { selection: classPosition });
								}
							}
						);
					}
				}
			}
		})
	);
}

export function deactivate() {}
