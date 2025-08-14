import React from "react";

const Loader = () => (
  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 80 }}>
    <div className="spinner-border text-primary" role="status">
      <span className="visually-hidden">Loading...</span>
    </div>
  </div>
);

export default Loader; 