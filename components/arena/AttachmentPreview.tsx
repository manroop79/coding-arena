type AttachmentPreviewProps = {
  name: string;
  type?: string;
  size?: number;
};

export function AttachmentPreview({ name, type, size }: AttachmentPreviewProps) {
  return (
    <div
      className="row"
      style={{
        border: "1px dashed var(--border)",
        borderRadius: 10,
        padding: 8,
        justifyContent: "space-between"
      }}
    >
      <div className="stack" style={{ gap: 2 }}>
        <strong>{name}</strong>
        <span className="muted" style={{ fontSize: 12 }}>
          {type ?? "attachment"} {size ? `• ${(size / 1024).toFixed(1)} KB` : ""}
        </span>
      </div>
      <span className="badge">Attached</span>
    </div>
  );
}

