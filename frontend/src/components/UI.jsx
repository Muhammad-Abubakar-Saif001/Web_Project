import React from 'react';
import { BookOpen } from 'lucide-react';

export function Metric({ icon: Icon, label, value, onClick }) {
  return (
    <div className={`metric ${onClick ? 'clickable' : ''}`} onClick={onClick} style={onClick ? { cursor: 'pointer' } : {}}>
      <Icon size={19} />
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

export function StatCard({ icon: Icon, label, value, trend }) {
  return (
    <article className="stat-card">
      <Icon size={22} />
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{trend}</small>
    </article>
  );
}

export function PanelHeader({ icon: Icon, title }) {
  return (
    <div className="panel-header">
      <div>
        <Icon size={19} />
        <h3>{title}</h3>
      </div>
    </div>
  );
}

export function Select({ label, value, onChange, options }) {
  return (
    <label className="select-control">
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => {
          const optionValue = Array.isArray(option) ? option[0] : option;
          const optionLabel = Array.isArray(option) ? option[1] : option;
          return <option key={optionValue} value={optionValue}>{optionLabel}</option>;
        })}
      </select>
    </label>
  );
}

export function Field({ label, value, onChange, type = 'text', required = false }) {
  return (
    <label className="field">
      <span>{label}</span>
      <input type={type} value={value} onChange={(event) => onChange(event.target.value)} required={required} />
    </label>
  );
}

export function Toast({ message, type }) {
  return (
    <div className={`toast ${type}`}>
      {message}
    </div>
  );
}
