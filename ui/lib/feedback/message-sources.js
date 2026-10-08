import { isToolUIPart } from "ai";
const isToolSource = (value) => typeof value === "object" &&
    value !== null &&
    "documentUri" in value &&
    typeof value.documentUri === "string" &&
    "documentTitle" in value &&
    typeof value.documentTitle === "string";
export const getMessageSources = (parts) => Array.from(new Map([
    ...parts.filter((part) => part.type === "source-url"),
    ...parts
        .filter((part) => isToolUIPart(part) && part.state === "output-available")
        .flatMap((part) => {
        if (!Array.isArray(part.output)) {
            return [];
        }
        return part.output.filter(isToolSource).map((source, index) => ({
            type: "source-url",
            sourceId: `tool-${part.toolCallId}-${source.chunkIndex ?? index}-${source.documentUri}`,
            url: source.documentUri,
            title: source.documentTitle,
        }));
    }),
].map((source) => [source.url, source])).values());
