import React from "react";

const Modal = ({ open, onClose, title, children, actions }) => {
  if (!open) return null;
  return (
    <div className="modal-backdrop" tabIndex="-1" style={{ background: "rgba(0,0,0,0.3)", position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", zIndex: 1050 }}>
      <div className="modal-dialog" style={{ maxWidth: 500, margin: "10vh auto", background: "#fff", borderRadius: 8, boxShadow: "0 2px 16px rgba(0,0,0,0.15)", position: "relative" }}>
        <div className="modal-header" style={{ padding: 16, borderBottom: "1px solid #eee" }}>
          <h5 className="modal-title">{title}</h5>
          <button type="button" className="btn-close" aria-label="Close" onClick={onClose} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer" }}>&times;</button>
        </div>
        <div className="modal-body" style={{ padding: 16 }}>{children}</div>
        {actions && <div className="modal-footer" style={{ padding: 16, borderTop: "1px solid #eee", textAlign: "right" }}>{actions}</div>}
      </div>
    </div>
  );
};

export default Modal; 