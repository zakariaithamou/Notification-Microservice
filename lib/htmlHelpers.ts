export function formatHtml(html: string): string {
  // Collapse all whitespace between tags first, so we start from a clean slate
  const formatted = html.replace(/>\s*</g, "><").trim();

  const voidElements = new Set([
    "br",
    "img",
    "hr",
    "input",
    "meta",
    "link",
    "area",
    "base",
    "col",
    "embed",
    "source",
    "track",
    "wbr",
  ]);

  let indentLevel = 0;
  const indentSize = 2;
  const lines: string[] = [];

  // Split into individual tags and text chunks
  const tokens = formatted.split(/(<[^>]+>)/g).filter((t) => t.trim() !== "");

  for (const token of tokens) {
    const isClosingTag = /^<\/\w/.test(token);
    const isOpeningTag = /^<\w/.test(token) && !isClosingTag;
    const tagNameMatch = token.match(/^<\/?([a-zA-Z0-9]+)/);
    const tagName = tagNameMatch ? tagNameMatch[1].toLowerCase() : "";
    const isSelfClosing = /\/>\s*$/.test(token) || voidElements.has(tagName);

    if (isClosingTag) {
      indentLevel = Math.max(0, indentLevel - 1);
      lines.push(" ".repeat(indentLevel * indentSize) + token);
    } else if (isOpeningTag) {
      lines.push(" ".repeat(indentLevel * indentSize) + token);
      if (!isSelfClosing) indentLevel++;
    } else {
      // Plain text content between tags
      lines.push(" ".repeat(indentLevel * indentSize) + token.trim());
    }
  }

  return lines.join("\n");
}

export function htmlToPlainText(html: string): string {
  const withMarkers = html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/g, "")
    .replace(/<script[^>]*>[\s\S]*?<\/script>/g, "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<li[^>]*>/gi, "\n• ")
    .replace(/<\/li>/gi, "")
    // Mark block-level closings with a unique marker (paragraph break)
    .replace(/<\/(p|div|h[1-6]|tr|table)>/gi, "\u0001")
    // Strip all remaining tags
    .replace(/<[^>]+>/g, "")
    // Decode common HTML entities
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&#39;/gi, "'")
    .replace(/&quot;/gi, '"');

  return withMarkers
    .split("\u0001") // split into paragraph blocks
    .map(
      (block) =>
        block
          .split(/\r?\n/) // split each block into lines
          .map((line) => line.trim()) // trim each line individually
          .filter(Boolean) // drop empty lines
          .join("\n"), // rejoin lines within the same block
    )
    .filter(Boolean) // drop empty blocks entirely
    .join("\n\n") // separate blocks with one blank line
    .trim();
}
