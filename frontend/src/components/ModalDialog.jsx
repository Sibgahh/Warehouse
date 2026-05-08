export default function ModalDialog({
  open,
  title,
  message,
  confirmText = 'OK',
  cancelText = 'Batal',
  showCancel = false,
  onConfirm,
  onCancel,
  loading = false,
}) {
  if (!open) return null;

  return (
    <div className="modal-overlay" onClick={loading ? undefined : onCancel}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <h2>{title}</h2>
        <p style={{ marginTop: 8, color: 'var(--text-muted)' }}>{message}</p>
        <div className="form-actions" style={{ marginTop: 20 }}>
          {showCancel && (
            <button type="button" className="btn-secondary" onClick={onCancel} disabled={loading}>
              {cancelText}
            </button>
          )}
          <button type="button" className="btn-primary" onClick={onConfirm} disabled={loading}>
            {loading ? 'Memproses...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
