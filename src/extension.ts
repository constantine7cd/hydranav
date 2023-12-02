import * as path from 'path';
import * as vscode from 'vscode';
import * as fs from 'fs';

function isFileExists(uri: vscode.Uri): boolean {
	try {
		return fs.existsSync(uri.fsPath);
	} catch (error) {
		console.error('Error checking file existence.');
		return false;
	}
}

function parsePythonClassMethodPath(methodPath: string) {
	const pathSegments = methodPath.split(".");
	if (pathSegments.length <= 2) {
		return undefined;
	}
	const methodName = pathSegments.pop();
	const className = pathSegments.pop();
	const filePath = path.join(...pathSegments);

	return [filePath, className, methodName];
}

function parsePythonSymbolPath(symbolPath: string) {
	const pathSegments = symbolPath.split(".");
	if (pathSegments.length <= 1) {
		return undefined;
	}
	const symbolName = pathSegments.pop();
	const filePath = path.join(...pathSegments);

	return [filePath, symbolName];
}

function parseYamlPath(yamlPath: string): string | undefined {
	const pathParts = yamlPath.split(':');
	if (pathParts.length === 2) {
		const rootDir = pathParts[0];
		const path_ = pathParts[1];

		if (vscode.window.activeTextEditor) {
			const editorFilePath = vscode.window.activeTextEditor.document.uri.path;
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

function findSymbolPosition(document: vscode.TextDocument, symbolName: string, keywords?: string, startLine?: number, endLine?: number): vscode.Range | undefined {
	if (!keywords) {
		keywords = 'class|def|async def';
	}
	if (!startLine) {
		startLine = 0;
	}
	if (!endLine) {
		endLine = document.lineCount;
	}
	const classRegex = new RegExp(`^(?:\\s*${symbolName}|\\s*(${keywords})\\s*${symbolName})(?=[^a-zA-Z\\d]|$)`);
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

function findMethodPosition(document: vscode.TextDocument, className: string, methodName: string): vscode.Range | undefined {
	const classPosition = findSymbolPosition(document, className, "class");
	if (classPosition) {
		const startLine = classPosition.start.line + 1;
		return findSymbolPosition(document, methodName, "def|async def", startLine);
	}
	return undefined;
}

function goToPythonSymbol(selectedWord: string) {
	const parseResult = parsePythonSymbolPath(selectedWord);
	if (parseResult) {
		const [filePath, symbolName] = parseResult;

		if (symbolName) {
			const pythonUri = vscode.Uri.file(path.join(vscode.workspace.rootPath || '', filePath + '.py'));

			if (isFileExists(pythonUri)) {
				return vscode.workspace.openTextDocument(pythonUri).then(
					(pythonDoc) => {
						const methodPosition = findSymbolPosition(pythonDoc, symbolName);
						if (methodPosition) {
							vscode.window.showTextDocument(pythonUri, { selection: methodPosition });
							return true;
						}
						return false;
					}
				);
			}
		}
	}
	return undefined;
}

function goToPythonMethod(selectedWord: string) {
	const parseResult = parsePythonClassMethodPath(selectedWord);
	if (parseResult) {
		const [filePath, className, methodName] = parseResult;

		if (className && methodName) {
			const pythonUri = vscode.Uri.file(path.join(vscode.workspace.rootPath || '', filePath + '.py'));

			if (isFileExists(pythonUri)) {
				return vscode.workspace.openTextDocument(pythonUri).then(
					(pythonDoc) => {
						const methodPosition = findMethodPosition(pythonDoc, className, methodName);
						if (methodPosition) {
							vscode.window.showTextDocument(pythonUri, { selection: methodPosition });
							return true;
						}
						return false;
					}
				);
			}
		}
	}
}

function goToPythonScript(selectedWord: string) {
	const pathParts = selectedWord.split(".");

	if (pathParts.length > 1) {
		const end_indices: number[] = [-1, -2];
		for (const end_index of end_indices) {
			const pathSlice = path.join(vscode.workspace.rootPath || '', ...pathParts.slice(0, end_index));
			const pythonUri = vscode.Uri.file(pathSlice + '.py');

			if (isFileExists(pythonUri)) {
				return vscode.window.showTextDocument(pythonUri).then(() => true);
			} else {
				const initPyUri = vscode.Uri.file(path.join(pathSlice, '__init__.py'));
				if (isFileExists(initPyUri)) {
					return vscode.window.showTextDocument(initPyUri).then(() => true);
				}
			}
		}
	}
	return undefined;
}

type FunctionArray = Array<(arg0: string) => PromiseLike<boolean> | undefined>;

function handlerChain(selectedWord: string, handlers: FunctionArray, handler_index: number = 0) {
	if (handler_index >= handlers.length) {
		return;
	}
	const handler = handlers[handler_index];
	const promiseLike = handler(selectedWord);
	if (promiseLike) {
		promiseLike.then(
			(result) => {
				if (!result) {
					handlerChain(selectedWord, handlers, handler_index + 1);
				}
			}
		);
		return;
	}
	handlerChain(selectedWord, handlers, handler_index + 1);
}

export function activate(context: vscode.ExtensionContext) {
	console.log('Congratulations, your extension "hydranav" is now active!');

	let disposable = vscode.commands.registerCommand('hydranav.Activate', () => {
		vscode.window.showInformationMessage('hydra_navi is activated!');
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
					handlerChain(selectedWord, [goToPythonSymbol, goToPythonMethod, goToPythonScript]);
				}
			}
		})
	);
}

export function deactivate() { }
