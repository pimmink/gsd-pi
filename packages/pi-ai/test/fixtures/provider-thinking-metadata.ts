import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import * as ts from "typescript";
import type { Api, Model } from "../../src/types.ts";

// Extract the real metadata function and its local declaration dependencies.
// Never import the generator: its entry point fetches catalogs and writes files.
export function loadGeneratorThinkingMetadata(): (model: Model<Api>) => void {
	// allow-source-grep: AST-execute actual generator logic with offline provider fixtures.
	const source = readFileSync(new URL("../../scripts/generate-models.ts", import.meta.url), "utf8");
	const file = ts.createSourceFile("generate-models.ts", source, ts.ScriptTarget.Latest, true);
	const declarations = new Map<string, ts.Node>();
	for (const statement of file.statements) {
		if (ts.isFunctionDeclaration(statement) && statement.name) {
			declarations.set(statement.name.text, statement);
		} else if (ts.isVariableStatement(statement)) {
			for (const declaration of statement.declarationList.declarations) {
				if (ts.isIdentifier(declaration.name)) declarations.set(declaration.name.text, declaration);
			}
		}
	}
	const selected = new Set<ts.Node>();
	function include(name: string): void {
		const declaration = declarations.get(name);
		if (!declaration) throw new Error(`Missing generator declaration: ${name}`);
		if (selected.has(declaration)) return;
		selected.add(declaration);
		function visit(node: ts.Node): void {
			if (ts.isIdentifier(node) && declarations.has(node.text)) include(node.text);
			ts.forEachChild(node, visit);
		}
		visit(declaration);
	}
	include("applyThinkingLevelMetadata");
	const isolatedSource = [...selected]
		.sort((left, right) => left.pos - right.pos)
		.map((node) => ts.isVariableDeclaration(node) ? `const ${node.getText(file)};` : node.getText(file))
		.join("\n");
	const { outputText, diagnostics } = ts.transpileModule(isolatedSource, {
		compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.None },
		reportDiagnostics: true,
	});
	if (diagnostics?.some((diagnostic) => diagnostic.category === ts.DiagnosticCategory.Error)) {
		throw new Error("Unable to transpile isolated generator metadata declarations");
	}
	const apply = runInNewContext(`${outputText}\napplyThinkingLevelMetadata`, {}, { timeout: 1000 });
	return (model) => apply(model);
}

export function providerThinkingFixture(
	provider: string,
	id: string,
	api: Api = "openai-responses",
): Model<Api> {
	return {
		id,
		name: id,
		provider,
		api,
		baseUrl: "https://fixture.invalid",
		reasoning: true,
		input: ["text"],
		cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
		contextWindow: 1,
		maxTokens: 1,
	};
}
