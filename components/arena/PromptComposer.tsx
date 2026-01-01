"use client";

import { useMemo, useState } from "react";
import { useArenaStore } from "../../lib/store/useArenaStore";
import { AttachmentPreview } from "./AttachmentPreview";

type PromptComposerProps = {
  onSubmit?: (prompt: string, agents: string[], attachments: File[]) => void;
  isRunning?: boolean;
  lastPrompt?: string;
  onRetry?: () => void;
  statusLabel?: string;
};

export function PromptComposer({ onSubmit, isRunning, lastPrompt, onRetry, statusLabel }: PromptComposerProps) {
  const [text, setText] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const { selectedAgents, setSelectedAgents } = useArenaStore((s) => ({
    selectedAgents: s.selectedAgents,
    setSelectedAgents: s.setSelectedAgents
  }));

  const allAgents = useMemo(
    () => [
      { id: "mock-agent", label: "Mock" },
      { id: "openai-agent", label: "OpenAI" },
      { id: "claude-agent", label: "Claude" }
    ],
    []
  );

  const handleSubmit = () => {
    if (!text.trim()) return;
    onSubmit?.(text.trim(), selectedAgents, files);
    setText("");
    setFiles([]);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const toggleAgent = (id: string) => {
    if (selectedAgents.includes(id)) {
      const next = selectedAgents.filter((a) => a !== id);
      setSelectedAgents(next.length ? next : ["mock-agent"]);
    } else {
      setSelectedAgents([...selectedAgents, id]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = e.target.files;
    if (!picked) return;
    setFiles([...files, ...Array.from(picked)]);
    e.target.value = "";
  };

  return (
    <div className="stack composer-mobile">
      <div className="row" style={{ justifyContent: "space-between", alignItems: "center", gap: 8 }}>
        <div className="row" style={{ gap: 8, alignItems: "center" }}>
          <h1 className="panel-title" style={{ marginBottom: 0 , marginRight: 12}}>
            Prompt Composer
          </h1>
          {statusLabel && (
            <span
              className={`pill ${
                statusLabel.toLowerCase().includes("ready")
                  ? "ready"
                  : statusLabel.toLowerCase().includes("stream")
                  ? "streaming"
                  : statusLabel.toLowerCase().includes("error")
                  ? "error"
                  : statusLabel.toLowerCase().includes("disconnect")
                  ? "disconnected"
                  : ""
              }`}
            >
              {statusLabel}
            </span>
          )}
        </div>
        <span className="muted" style={{ fontSize: 12 }}>
          Multi-agent | Attach files
        </span>
      </div>
      <textarea
        className="input"
        rows={3}
        placeholder="Describe the coding task. Agents will run in parallel..."
        style={{ width: "100%", resize: "vertical" }}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
      />
      <div className="row" style={{ flexWrap: "wrap", gap: 8 }}>
        {allAgents.map((agent) => {
          const active = selectedAgents.includes(agent.id);
          return (
            <button
              key={agent.id}
              className="chip"
              style={{
                background: active ? "rgba(107, 194, 255, 0.18)" : "var(--panel-alt)",
                borderColor: active ? "var(--accent)" : "var(--border)"
              }}
              onClick={() => toggleAgent(agent.id)}
              type="button"
              disabled={isRunning}
            >
              {agent.label}
            </button>
          );
        })}
      </div>
      <div className="row composer-actions" style={{ justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
          <label className="btn btn-ghost" style={{ cursor: "pointer" }}>
            Attach
            <input
              type="file"
              multiple
              style={{ display: "none" }}
              onChange={handleFileChange}
              disabled={isRunning}
            />
          </label>
        </div>
        <div className="row" style={{ gap: 8 }}>
          <button className="btn btn-primary" disabled={isRunning} onClick={handleSubmit} type="button">
            {isRunning ? "Running..." : "Run"}
          </button>
          <button
            className="btn btn-ghost"
            style={{ opacity: lastPrompt ? 1 : 0.5 }}
            disabled={isRunning || !lastPrompt}
            onClick={onRetry}
            type="button"
          >
            Retry
          </button>
        </div>
      </div>
      <div className="row" style={{ flexWrap: "wrap", gap: 6 }}>
        {selectedAgents.map((a) => (
          <span key={a} className="badge accent">
            {a}
          </span>
        ))}
        {files.length > 0 && <span className="badge warn">{files.length} attachment(s)</span>}
      </div>
      {files.length > 0 && (
        <div className="stack" style={{ marginTop: 6 }}>
          {files.map((file) => (
            <AttachmentPreview
              key={file.name + file.size}
              name={file.name}
              type={file.type}
              size={file.size}
            />
          ))}
        </div>
      )}
    </div>
  );
}

