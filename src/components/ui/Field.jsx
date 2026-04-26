import React from 'react';

export default function Field({ label, children }) {
  return (
    <label className="form-label w-100">
      <span>{label}</span>
      {children}
    </label>
  );
}
