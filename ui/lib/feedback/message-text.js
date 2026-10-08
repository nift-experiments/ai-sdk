/**
 * The Markdown a reader sees for a message: its non-blank text parts, in
 * order, separated by blank lines. Reasoning, tool, and source parts are
 * excluded. Text parts split by tool calls render as separate blocks, so
 * they are joined as separate paragraphs.
 */
export const getMessageMarkdown = (message) => message.parts
    .flatMap((part) => {
    if (part.type !== "text") {
        return [];
    }
    const text = part.text.trim();
    return text ? [text] : [];
})
    .join("\n\n");
