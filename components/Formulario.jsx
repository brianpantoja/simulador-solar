"use client";

import { useState } from "react";

const DEFAULTS = {
  panel_kw: 5,
  horas_sol: 5,
  eficiencia: 80,
  temperatura: 28,
  años: 10,
  bateria_kwh: 10,
  ciclos_bateria: 3000,
  costo_paneles: 8000000,
  costo_baterias: 6000000,
  costo_mppt: 1500000,
  costo_aires: 4000000,
  area: 40,
  consumo_diario: 15,
  precio_kwh: 900,
  clima: "soleado",
  mantenimiento_mensual: 80000,
};

// Estado inicial como strings para que el usuario pueda borrar libremente
const DEFAULTS_STR = Object.fromEntries(
  Object.entries(DEFAULTS).map(([k, v]) => [k, String(v)])
);

const InputField = ({ label, name, value, onChange, onBlur, unit, hint }) => (
  <div className="input-group">
    <label htmlFor={name}>
      {label}
      {unit && <span className="unit-badge">{unit}</span>}
    </label>
    <input
      id={name}
      type="text"
      inputMode="decimal"
      name={name}
      value={value}
      onChange={onChange}
      onBlur={onBlur}
      autoComplete="off"
    />
    {hint && <span className="hint">{hint}</span>}
  </div>
);

export default function Formulario({ onSimular }) {
  const [form, setForm] = useState(DEFAULTS_STR);

  // Mientras escribe: guarda el string tal cual (el usuario puede borrar libremente)
  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "clima") {
      setForm((prev) => ({ ...prev, [name]: value }));
    } else {
      // Solo permite digitos, punto decimal y signo negativo al inicio
      const clean = value.replace(/[^0-9.-]/g, "");
      setForm((prev) => ({ ...prev, [name]: clean }));
    }
  };

  // Al salir del campo: elimina ceros al inicio y restaura default si quedo vacio
  const handleBlur = (e) => {
    const { name } = e.target;
    if (name === "clima") return;
    const parsed = parseFloat(form[name]);
    if (isNaN(parsed) || form[name] === "") {
      setForm((prev) => ({ ...prev, [name]: String(DEFAULTS[name]) }));
    } else {
      // "032" → "32"
      setForm((prev) => ({ ...prev, [name]: String(parsed) }));
    }
  };

  // Al simular: convierte strings a numeros
  const handleSubmit = (e) => {
    e.preventDefault();
    const numericForm = Object.fromEntries(
      Object.entries(form).map(([k, v]) =>
        k === "clima" ? [k, v] : [k, parseFloat(v) || 0]
      )
    );
    onSimular(numericForm);
  };

  const ob = handleBlur;

  return (
    <form onSubmit={handleSubmit} className="formulario-solar">

      {/* PANEL SOLAR */}
      <section className="form-section">
        <h3 className="section-title"><span className="section-icon">☀️</span> Panel Solar</h3>
        <div className="inputs-grid">
          <InputField label="Potencia instalada"   name="panel_kw"    value={form.panel_kw}    onChange={handleChange} onBlur={ob} unit="kW"      hint="Total de paneles en kW" />
          <InputField label="Horas de sol pico"    name="horas_sol"   value={form.horas_sol}   onChange={handleChange} onBlur={ob} unit="HSP/día" hint="Neiva aprox. 4.5-5.5 HSP" />
          <InputField label="Eficiencia paneles"   name="eficiencia"  value={form.eficiencia}  onChange={handleChange} onBlur={ob} unit="%"        hint="Perdidas en cables e inversor" />
          <InputField label="Temperatura ambiente" name="temperatura" value={form.temperatura} onChange={handleChange} onBlur={ob} unit="°C"       hint="Afecta degradacion termica" />
          <InputField label="Años de proyeccion"   name="años"        value={form.años}        onChange={handleChange} onBlur={ob} unit="años"     hint="Para calcular degradacion acumulada" />
        </div>
      </section>

      {/* CLIMA */}
      <section className="form-section">
        <h3 className="section-title"><span className="section-icon">🌤️</span> Condicion Climatica</h3>
        <div className="inputs-grid">
          <div className="input-group span-full">
            <label htmlFor="clima">Clima predominante</label>
            <select id="clima" name="clima" value={form.clima} onChange={handleChange}>
              <option value="soleado">☀️ Soleado (factor 1.0)</option>
              <option value="nublado">⛅ Nublado (factor 0.5)</option>
              <option value="lluvia">🌧️ Lluvia (factor 0.2)</option>
            </select>
            <span className="hint">Ajusta la generacion segun condicion del dia</span>
          </div>
        </div>
      </section>

      {/* BATERIAS */}
      <section className="form-section">
        <h3 className="section-title"><span className="section-icon">🔋</span> Baterias</h3>
        <div className="inputs-grid">
          <InputField label="Capacidad bateria" name="bateria_kwh"    value={form.bateria_kwh}    onChange={handleChange} onBlur={ob} unit="kWh"    hint="Energia almacenada total" />
          <InputField label="Ciclos de vida"    name="ciclos_bateria" value={form.ciclos_bateria} onChange={handleChange} onBlur={ob} unit="ciclos" hint="Litio aprox. 3000-6000 ciclos" />
        </div>
      </section>

      {/* COSTOS */}
      <section className="form-section">
        <h3 className="section-title"><span className="section-icon">💰</span> Costos del Sistema</h3>
        <div className="inputs-grid">
          <InputField label="Paneles solares"  name="costo_paneles"  value={form.costo_paneles}  onChange={handleChange} onBlur={ob} unit="COP" hint="Incluye estructura y cableado" />
          <InputField label="Baterias"         name="costo_baterias" value={form.costo_baterias} onChange={handleChange} onBlur={ob} unit="COP" hint="BMS incluido" />
          <InputField label="Controlador MPPT" name="costo_mppt"     value={form.costo_mppt}     onChange={handleChange} onBlur={ob} unit="COP" hint="Inversor/cargador MPPT" />
          <InputField label="Aires DC a 48V"   name="costo_aires"    value={form.costo_aires}    onChange={handleChange} onBlur={ob} unit="COP" hint="Acondicionadores DC solar" />
        </div>
      </section>

      {/* CONSUMO Y TARIFA */}
      <section className="form-section">
        <h3 className="section-title"><span className="section-icon">⚡</span> Consumo y Tarifa</h3>
        <div className="inputs-grid">
          <InputField label="Area a climatizar"     name="area"                  value={form.area}                  onChange={handleChange} onBlur={ob} unit="m²"      hint="Para calcular BTU requeridos" />
          <InputField label="Consumo diario"        name="consumo_diario"        value={form.consumo_diario}        onChange={handleChange} onBlur={ob} unit="kWh/día" hint="Ver recibo de Electrohuila" />
          <InputField label="Precio del kWh"        name="precio_kwh"            value={form.precio_kwh}            onChange={handleChange} onBlur={ob} unit="COP/kWh" hint="Tarifa Electrohuila aprox. 900" />
          <InputField label="Mantenimiento mensual" name="mantenimiento_mensual" value={form.mantenimiento_mensual} onChange={handleChange} onBlur={ob} unit="COP/mes" hint="Limpieza, revision, ajustes" />
        </div>
      </section>

      <div className="form-footer">
        <button type="submit" className="btn-simular">
          <span>Simular Sistema Solar</span>
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
          </svg>
        </button>
        <button type="button" className="btn-reset" onClick={() => setForm(DEFAULTS_STR)}>
          Restablecer valores
        </button>
      </div>

    </form>
  );
}
