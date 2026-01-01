type DiffLine = { type: "context" | "add" | "del"; value: string };

function createHunks(oldLines: string[], newLines: string[]): DiffLine[] {
  const hunks: DiffLine[] = [];
  const maxLen = Math.max(oldLines.length, newLines.length);

  for (let i = 0; i < maxLen; i++) {
    const oldLine = oldLines[i];
    const newLine = newLines[i];
    if (oldLine === newLine) {
      if (oldLine !== undefined) {
        hunks.push({ type: "context", value: oldLine });
      }
    } else {
      if (oldLine !== undefined) hunks.push({ type: "del", value: oldLine });
      if (newLine !== undefined) hunks.push({ type: "add", value: newLine });
    }
  }

  return hunks;
}

export function unifiedDiff(filePath: string, oldContent: string, newContent: string): string {
  const oldLines = oldContent.split("\n");
  const newLines = newContent.split("\n");

  const hunks = createHunks(oldLines, newLines);
  const header = [`--- a/${filePath}`, `+++ b/${filePath}`];
  const body = hunks.map((line) => {
    const prefix = line.type === "add" ? "+" : line.type === "del" ? "-" : " ";
    return `${prefix}${line.value}`;
  });

  return [...header, ...body].join("\n");
}

