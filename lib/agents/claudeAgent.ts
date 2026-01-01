import { AgentAdapter, AgentEvent, AgentRunInput } from "./types";
import { mockAgent } from "./mockAgent";

function hasClaude(env: NodeJS.ProcessEnv) {
  return Boolean(env.ANTHROPIC_API_KEY);
}

async function* fallbackMock(input: AgentRunInput): AsyncGenerator<AgentEvent> {
  yield* mockAgent.startRun(input);
}

export const claudeAgent: AgentAdapter = {
  id: "claude-agent",
  displayName: "Claude Coding Agent",
  canHandle: hasClaude,
  startRun: async function* (input: AgentRunInput) {
    if (!hasClaude(process.env)) {
      yield* fallbackMock(input);
      return;
    }
    // TODO: Implement real Claude structured output + diffing. For now, mock.
    yield* fallbackMock(input);
  }
};

