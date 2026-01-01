import { unifiedDiff } from "../diff/diff";

type FileState = Map<string, string>;

const stateByAgent = new Map<string, FileState>();

function getAgentState(agentId: string): FileState {
  let files = stateByAgent.get(agentId);
  if (!files) {
    files = new Map();
    stateByAgent.set(agentId, files);
  }
  return files;
}

export function computeDiff(agentId: string, filePath: string, newContent: string) {
  const files = getAgentState(agentId);
  const oldContent = files.get(filePath) ?? "";
  const diff = unifiedDiff(filePath, oldContent, newContent);
  files.set(filePath, newContent);
  return diff;
}

export function resetDiffs() {
  stateByAgent.clear();
}