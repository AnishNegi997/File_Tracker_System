import React from "react";

const FormInput = ({ label, type = "text", value, onChange, error, placeholder, ...rest }) => (
  <div className="mb-3">
    {label && <label className="form-label">{label}</label>}
    <input
      type={type}
      className={["form-control", error ? "is-invalid" : ""].filter(Boolean).join(" ")}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      {...rest}
    />
    {error && <div className="invalid-feedback">{error}</div>}
  </div>
);

export default FormInput; 