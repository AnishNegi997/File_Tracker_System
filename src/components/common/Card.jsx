import React from "react";

const Card = ({ header, children, footer, className = "" }) => (
  <div className={["card shadow-sm p-4", className].filter(Boolean).join(" ")}>
    {header && <div className="card-header bg-primary text-white">{header}</div>}
    <div className="card-body">{children}</div>
    {footer && <div className="card-footer">{footer}</div>}
  </div>
);

export default Card; 