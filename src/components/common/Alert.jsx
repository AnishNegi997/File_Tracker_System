import React from "react";

const typeToClass = {
  success: "alert-success",
  danger: "alert-danger",
  warning: "alert-warning",
  info: "alert-info",
};

const Alert = ({ type = "info", message, dismissible = false, onClose }) => (
  <div className={["alert", typeToClass[type]].filter(Boolean).join(" ") + (dismissible ? " alert-dismissible" : "") } role="alert">
    {message}
    {dismissible && (
      <button type="button" className="btn-close" aria-label="Close" onClick={onClose} style={{ float: "right", background: "none", border: "none", fontSize: 20, cursor: "pointer" }}>&times;</button>
    )}
  </div>
);

export default Alert; 