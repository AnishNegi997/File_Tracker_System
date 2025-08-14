import React from "react";

const Button = ({
  type = "button",
  variant = "primary",
  size = "md",
  className = "",
  children,
  ...props
}) => {
  const base = "btn";
  const variantClass = `btn-${variant}`;
  const sizeClass = size !== "md" ? `btn-${size}` : "";
  return (
    <button
      type={type}
      className={[base, variantClass, sizeClass, className].filter(Boolean).join(" ")}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button; 