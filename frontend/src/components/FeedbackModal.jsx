const TITLES = { success: 'Berhasil', error: 'Gagal' };
const COLORS = { success: 'var(--success)', error: 'var(--error)' };

export default function FeedbackModal({ open, type = 'success', title, message, onClose }) {
  if (!open || !message) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card modal-feedback" onClick={(e) => e.stopPropagation()}>
        <h2 style={{ color: COLORS[type], margin: 0 }}>{title || TITLES[type]}</h2>
        <p className="modal-message">{message}</p>
        <div className="form-actions modal-actions">
          <button type="button" className="btn-primary" onClick={onClose}>OK</button>
        </div>
      </div>
    </div>
  );
}
