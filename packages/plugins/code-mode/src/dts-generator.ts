export interface JsonSchemaProperty {
	type?: string | string[];
	description?: string;
	enum?: (string | number)[];
	items?: JsonSchemaProperty;
	properties?: Record<string, JsonSchemaProperty>;
	required?: string[];
	default?: unknown;
}

export interface JsonSchema {
	type?: string;
	properties?: Record<string, JsonSchemaProperty>;
	required?: string[];
	description?: string;
}

/**
 * Convert a JSON Schema property type to a TypeScript type string
 */
export function jsonSchemaTypeToTs(prop: JsonSchemaProperty, indentLevel: number = 1): string {
	if (prop.enum && prop.enum.length > 0) {
		return prop.enum.map((v) => JSON.stringify(v)).join(" | ");
	}

	if (Array.isArray(prop.type)) {
		return prop.type.map((t) => jsonSchemaTypeToTs({ ...prop, type: t }, indentLevel)).join(" | ");
	}

	switch (prop.type) {
		case "string":
			return "string";
		case "number":
		case "integer":
			return "number";
		case "boolean":
			return "boolean";
		case "null":
			return "null";
		case "array":
			if (prop.items) {
				const itemType = jsonSchemaTypeToTs(prop.items, indentLevel);
				return itemType.includes("|") ? `(${itemType})[]` : `${itemType}[]`;
			}
			return "unknown[]";
		case "object":
			if (prop.properties && Object.keys(prop.properties).length > 0) {
				const indent = "  ".repeat(indentLevel);
				const fieldIndent = "  ".repeat(indentLevel + 1);
				const requiredSet = new Set(prop.required ?? []);
				const fields = Object.entries(prop.properties).map(([key, childProp]) => {
					const isReq = requiredSet.has(key);
					const doc = childProp.description ? `${fieldIndent}/** ${childProp.description} */\n` : "";
					const fieldType = jsonSchemaTypeToTs(childProp, indentLevel + 1);
					return `${doc}${fieldIndent}${key}${isReq ? "" : "?"}: ${fieldType};`;
				});
				return `{\n${fields.join("\n")}\n${indent}}`;
			}
			return "Record<string, unknown>";
		default:
			return "unknown";
	}
}

/**
 * Convert a tool's JSON Schema parameters to a TypeScript interface string
 */
export function jsonSchemaToInterface(interfaceName: string, schema?: JsonSchema): string {
	if (!schema || !schema.properties || Object.keys(schema.properties).length === 0) {
		return `export interface ${interfaceName} {}`;
	}

	const requiredSet = new Set(schema.required ?? []);
	const fields = Object.entries(schema.properties).map(([key, prop]) => {
		const isReq = requiredSet.has(key);
		const doc = prop.description ? `  /** ${prop.description} */\n` : "";
		const fieldType = jsonSchemaTypeToTs(prop, 1);
		return `${doc}  ${key}${isReq ? "" : "?"}: ${fieldType};`;
	});

	return `export interface ${interfaceName} {\n${fields.join("\n")}\n}`;
}

/**
 * Generate full TypeScript SDK declaration (.d.ts) for all registered tools
 */
export function generateSdkDts(tools: Array<{ name: string; description?: string; parameters?: any }>): string {
	const interfaceDefs: string[] = [];
	const toolMethodDefs: string[] = [];
	const fsMethods: string[] = [];
	const bashMethods: string[] = [];

	for (const tool of tools) {
		const pascalName = tool.name
			.split(/[-_]/)
			.map((part) => part.charAt(0).toUpperCase() + part.slice(1))
			.join("");

		const paramInterfaceName = `${pascalName}Params`;
		interfaceDefs.push(jsonSchemaToInterface(paramInterfaceName, tool.parameters));

		const doc = tool.description ? `  /** ${tool.description} */\n` : "";
		toolMethodDefs.push(`${doc}  ${tool.name}(params: ${paramInterfaceName}): Promise<any>;`);

		// Group into semantic namespaces
		if (["read", "write", "edit", "patch", "apply_patch"].includes(tool.name)) {
			fsMethods.push(`${doc}    ${tool.name}(params: ${paramInterfaceName}): Promise<any>;`);
		}
		if (["ls", "find", "grep"].includes(tool.name)) {
			fsMethods.push(`${doc}    ${tool.name}(params: ${paramInterfaceName}): Promise<any>;`);
		}
		if (tool.name === "bash") {
			bashMethods.push(`${doc}    exec(params: ${paramInterfaceName}): Promise<any>;`);
			bashMethods.push(`${doc}    run(command: string): Promise<any>;`);
		}
	}

	const fsNamespace =
		fsMethods.length > 0
			? `  /** File system and search utilities */\n  fs: {\n${fsMethods.join("\n")}\n  };`
			: "";

	const bashNamespace =
		bashMethods.length > 0
			? `  /** Shell execution utilities */\n  bash: {\n${bashMethods.join("\n")}\n  };`
			: "";

	return `/**
 * @pi/agent-sdk — Strong-Typed TypeScript SDK for Programmatic Tool Calling
 */
declare namespace pi {
${interfaceDefs.map((def) => `  ${def.replace(/\n/g, "\n  ")}`).join("\n\n")}

  export interface PiSDK {
${[...toolMethodDefs, fsNamespace, bashNamespace].filter(Boolean).join("\n\n")}
  }
}

/** Global SDK instance available in the Code Mode execution context. */
declare const pi: pi.PiSDK;
`;
}
