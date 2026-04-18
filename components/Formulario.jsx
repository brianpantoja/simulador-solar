"use client";

import { useState, useEffect } from "react";

const DEFAULTS = {
  // Panel Solar
  panel_kw: 0.55,
  cantidad_paneles: 10,
  precio_panel: 800000,
  horas_sol: 5,
  eficiencia: 80,
  temperatura: 32,
  anos: 10,

  // Baterias
  bateria_kwh: 2.5,
  cantidad_baterias: 4,
  precio_bateria: 1500000,
  ciclos_bateria: 3000,

  // MPPT
  cantidad_mppt: 1,
  precio_mppt: 1500000,

  // Aires
  cantidad_aires: 1,
  precio_aire: 4000000,
  btu_aire: 18000,

  // Consumo y tarifa
  area: 40,
  consumo_diario: 15,
  precio_kwh: 900,
  clima: "soleado",
  mantenimiento_mensual: 80000,
  voltaje_sistema: 48,
  voltaje_custom: null,
  distancia_paneles: 10,
  tipo_cable: "cobre",
  caida_voltaje: "2",
};

// Convertir string con puntos a número
const parseFormattedNumber = (value) => {
  if (!value) return 0;
  const clean = value.replace(/\./g, "").replace(/,/g, "");
  const num = parseFloat(clean);
  return isNaN(num) ? 0 : num;
};

// Formatear número con puntos de miles
const formatNumber = (num) => {
  if (num === undefined || num === null || isNaN(num)) return "";
  const parts = num.toString().split(".");
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return parts.join(".");
};

// Determinar si un campo debe tener formato de moneda
const isPriceField = (name) => {
  const priceFields = [
    "precio_panel",
    "precio_bateria",
    "precio_mppt",
    "precio_aire",
    "precio_kwh",
    "mantenimiento_mensual",
  ];
  return priceFields.includes(name);
};

// Determinar si es un campo numérico normal
const isNumericField = (name) => {
  const numericFields = [
    "panel_kw",
    "cantidad_paneles",
    "horas_sol",
    "eficiencia",
    "temperatura",
    "anos",
    "bateria_kwh",
    "cantidad_baterias",
    "ciclos_bateria",
    "cantidad_mppt",
    "cantidad_aires",
    "btu_aire",
    "area",
    "consumo_diario",
    "distancia_paneles",
  ];
  return numericFields.includes(name);
};

const DEFAULTS_STR = Object.fromEntries(
  Object.entries(DEFAULTS).map(([k, v]) => {
    if (k === "voltaje_custom") return [k, ""];
    if (isPriceField(k)) return [k, formatNumber(v)];
    return [k, String(v)];
  }),
);

// Campo de texto numerico con formateo
const InputField = ({ label, name, value, onChange, onBlur, unit, hint, wide }) => {
  const isPrice = isPriceField(name);
  const [displayValue, setDisplayValue] = useState(() => {
    if (isPrice && value) {
      const numValue = parseFormattedNumber(value);
      return formatNumber(numValue);
    }
    return value || "";
  });

  useEffect(() => {
    if (isPrice && value) {
      const numValue = parseFormattedNumber(value);
      setDisplayValue(formatNumber(numValue));
    } else {
      setDisplayValue(value || "");
    }
  }, [value, isPrice]);

  const handleChange = (e) => {
    let rawValue = e.target.value;

    if (isPrice) {
      let clean = rawValue.replace(/\./g, "");
      clean = clean.replace(/[^\d.]/g, "");
      const parts = clean.split(".");
      if (parts.length > 2) clean = parts[0] + "." + parts.slice(1).join("");
      
      setDisplayValue(rawValue);
      
      if (clean === "" || clean === ".") {
        onChange({ target: { name, value: "" } });
        return;
      }
      onChange({ target: { name, value: clean } });
    } else {
      let clean = rawValue.replace(/[^0-9.-]/g, "");
      setDisplayValue(rawValue);
      onChange({ target: { name, value: clean } });
    }
  };

  const handleBlurLocal = (e) => {
    if (isPrice) {
      let cleanValue = String(value).replace(/\./g, "");
      if (cleanValue === "" || cleanValue === ".") {
        const defaultValue = DEFAULTS[name];
        const formattedDefault = formatNumber(defaultValue);
        setDisplayValue(formattedDefault);
        onBlur({ target: { name, value: formattedDefault } });
        return;
      }
      const numValue = parseFloat(cleanValue);
      if (isNaN(numValue) || numValue === 0) {
        const defaultValue = DEFAULTS[name];
        const formattedDefault = formatNumber(defaultValue);
        setDisplayValue(formattedDefault);
        onBlur({ target: { name, value: formattedDefault } });
      } else {
        const formatted = formatNumber(numValue);
        setDisplayValue(formatted);
        onBlur({ target: { name, value: formatted } });
      }
    } else {
      onBlur(e);
    }
  };

  return (
    <div className={`input-group${wide ? " span-full" : ""}`}>
      <label htmlFor={name}>
        {label}
        {unit && <span className="unit-badge">{unit}</span>}
      </label>
      <input
        id={name}
        type="text"
        inputMode={isPrice ? "numeric" : "decimal"}
        name={name}
        value={displayValue}
        onChange={handleChange}
        onBlur={handleBlurLocal}
        autoComplete="off"
      />
      {hint && <span className="hint">{hint}</span>}
    </div>
  );
};

// Fila de cantidad + precio unitario + total calculado
const EquipoRow = ({ titulo, nombreCantidad, nombrePrecio, form, onChange, onBlur, unidadLabel, children }) => {
  const cantRaw = form[nombreCantidad];
  const precioRaw = form[nombrePrecio];

  const cant = parseFloat(cantRaw) || 0;
  const precio = parseFormattedNumber(precioRaw);
  const total = cant * precio;

  const handleCantidadChange = (e) => {
    const clean = e.target.value.replace(/[^0-9.-]/g, "");
    onChange({ target: { name: nombreCantidad, value: clean } });
  };

  const handlePrecioChange = (e) => {
    let clean = e.target.value.replace(/\./g, "");
    clean = clean.replace(/[^\d.]/g, "");
    const parts = clean.split(".");
    if (parts.length > 2) clean = parts[0] + "." + parts.slice(1).join("");
    onChange({ target: { name: nombrePrecio, value: clean } });
  };

  const handleCantidadBlur = (e) => {
    const parsed = parseFloat(cantRaw);
    if (isNaN(parsed) || cantRaw === "") {
      onBlur({ target: { name: nombreCantidad, value: String(DEFAULTS[nombreCantidad]) } });
    } else {
      onBlur({ target: { name: nombreCantidad, value: String(parsed) } });
    }
  };

  const handlePrecioBlur = (e) => {
    let cleanValue = String(precioRaw).replace(/\./g, "");
    if (cleanValue === "" || cleanValue === ".") {
      const defaultValue = DEFAULTS[nombrePrecio];
      onBlur({ target: { name: nombrePrecio, value: formatNumber(defaultValue) } });
      return;
    }
    const numValue = parseFloat(cleanValue);
    if (isNaN(numValue) || numValue === 0) {
      const defaultValue = DEFAULTS[nombrePrecio];
      onBlur({ target: { name: nombrePrecio, value: formatNumber(defaultValue) } });
    } else {
      onBlur({ target: { name: nombrePrecio, value: formatNumber(numValue) } });
    }
  };

  return (
    <div className="equipo-row">
      <div className="equipo-titulo">{titulo}</div>
      <div className="equipo-grid">
        <div className="input-group">
          <label htmlFor={nombreCantidad}>
            Cantidad
            <span className="unit-badge">{unidadLabel || "und"}</span>
          </label>
          <input
            id={nombreCantidad}
            type="text"
            inputMode="decimal"
            name={nombreCantidad}
            value={cantRaw}
            onChange={handleCantidadChange}
            onBlur={handleCantidadBlur}
            autoComplete="off"
          />
          <span className="hint">Unidades a instalar</span>
        </div>
        <div className="input-group">
          <label htmlFor={nombrePrecio}>
            Precio unitario
            <span className="unit-badge">COP</span>
          </label>
          <input
            id={nombrePrecio}
            type="text"
            inputMode="numeric"
            name={nombrePrecio}
            value={precioRaw}
            onChange={handlePrecioChange}
            onBlur={handlePrecioBlur}
            autoComplete="off"
          />
          <span className="hint">Valor por unidad</span>
        </div>
        <div className="input-group total-field">
          <label>Total</label>
          <div className="total-value">
            {new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(total)}
          </div>
          <span className="hint">
            {cant} × {new Intl.NumberFormat("es-CO").format(precio)}
          </span>
        </div>
        {children}
      </div>
    </div>
  );
};

export default function Formulario({ onSimular }) {
  const [form, setForm] = useState(DEFAULTS_STR);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "clima" || name === "tipo_cable" || name === "caida_voltaje") {
      setForm((prev) => ({ ...prev, [name]: value }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleBlur = (e) => {
    const { name } = e.target;
    if (name === "clima" || name === "tipo_cable" || name === "caida_voltaje")
      return;

    if (isPriceField(name)) {
      const numValue = parseFormattedNumber(form[name]);
      if (isNaN(numValue) || form[name] === "") {
        setForm((prev) => ({ ...prev, [name]: formatNumber(DEFAULTS[name]) }));
      } else {
        setForm((prev) => ({ ...prev, [name]: formatNumber(numValue) }));
      }
    } else if (isNumericField(name)) {
      const parsed = parseFloat(form[name]);
      if (isNaN(parsed) || form[name] === "") {
        setForm((prev) => ({ ...prev, [name]: String(DEFAULTS[name]) }));
      } else {
        setForm((prev) => ({ ...prev, [name]: String(parsed) }));
      }
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    let voltajeReal = parseFloat(form.voltaje_sistema);
    if (form.voltaje_sistema === "custom") {
      voltajeReal = parseFloat(form.voltaje_custom) || 48;
    }

    const numericForm = Object.fromEntries(
      Object.entries(form).map(([k, v]) => {
        if (k === "clima") return [k, v];
        if (k === "tipo_cable") return [k, v];
        if (k === "caida_voltaje") return [k, v];
        if (k === "voltaje_sistema") return [k, voltajeReal];
        if (k === "voltaje_custom") return [k, voltajeReal];
        if (isPriceField(k)) return [k, parseFormattedNumber(v)];
        return [k, parseFloat(v) || 0];
      }),
    );
    onSimular(numericForm);
  };

  // Totales en tiempo real
  const totalPaneles =
    (parseFloat(form.cantidad_paneles) || 0) *
    (parseFormattedNumber(form.precio_panel) || 0);
  const totalBaterias =
    (parseFloat(form.cantidad_baterias) || 0) *
    (parseFormattedNumber(form.precio_bateria) || 0);
  const totalMppt =
    (parseFloat(form.cantidad_mppt) || 0) *
    (parseFormattedNumber(form.precio_mppt) || 0);
  const totalAires =
    (parseFloat(form.cantidad_aires) || 0) *
    (parseFormattedNumber(form.precio_aire) || 0);
  const granTotal = totalPaneles + totalBaterias + totalMppt + totalAires;

  const cop = (n) =>
    new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      maximumFractionDigits: 0,
    }).format(n);

  const kwTotales =
    (parseFloat(form.cantidad_paneles) || 0) * (parseFloat(form.panel_kw) || 0);
  const kwhTotales =
    (parseFloat(form.cantidad_baterias) || 0) *
    (parseFloat(form.bateria_kwh) || 0);
  const btuTotales =
    (parseFloat(form.cantidad_aires) || 0) * (parseFloat(form.btu_aire) || 0);

  return (
    <form onSubmit={handleSubmit} className="formulario-solar">
      {/* ── PANEL SOLAR ── */}
      <section className="form-section">
        <h3 className="section-title">
          <span className="section-icon">☀️</span> Paneles Solares
        </h3>
        <EquipoRow
          titulo="Panel solar"
          nombreCantidad="cantidad_paneles"
          nombrePrecio="precio_panel"
          form={form}
          onChange={handleChange}
          onBlur={handleBlur}
          unidadLabel="paneles"
        >
          <InputField
            label="Potencia por panel"
            name="panel_kw"
            value={form.panel_kw}
            onChange={handleChange}
            onBlur={handleBlur}
            unit="kW"
            hint={`Total instalado: ${kwTotales.toFixed(2)} kW`}
          />
        </EquipoRow>
        <div className="inputs-grid" style={{ marginTop: "0.75rem" }}>
          <InputField
            label="Horas de sol pico"
            name="horas_sol"
            value={form.horas_sol}
            onChange={handleChange}
            onBlur={handleBlur}
            unit="HSP/día"
            hint="Neiva aprox. 4.5-5.5 HSP"
          />
          <InputField
            label="Eficiencia sistema"
            name="eficiencia"
            value={form.eficiencia}
            onChange={handleChange}
            onBlur={handleBlur}
            unit="%"
            hint="Perdidas cables e inversor"
          />
          <InputField
            label="Temperatura ambiente"
            name="temperatura"
            value={form.temperatura}
            onChange={handleChange}
            onBlur={handleBlur}
            unit="°C"
            hint="Afecta degradacion termica"
          />
          <InputField
            label="Anos de proyeccion"
            name="anos"
            value={form.anos}
            onChange={handleChange}
            onBlur={handleBlur}
            unit="años"
            hint="Degradacion acumulada"
          />
        </div>
      </section>

      {/* ── CLIMA ── */}
      <section className="form-section">
        <h3 className="section-title">
          <span className="section-icon">🌤️</span> Condicion Climatica
        </h3>
        <div className="inputs-grid">
          <div className="input-group span-full">
            <label htmlFor="clima">Clima predominante</label>
            <select
              id="clima"
              name="clima"
              value={form.clima}
              onChange={handleChange}
            >
              <option value="soleado">☀️ Soleado (factor 1.0)</option>
              <option value="nublado">⛅ Nublado (factor 0.5)</option>
              <option value="lluvia">🌧️ Lluvia (factor 0.2)</option>
            </select>
            <span className="hint">
              Ajusta la generacion segun condicion del dia
            </span>
          </div>
        </div>
      </section>

      {/* ── BATERIAS ── */}
      <section className="form-section">
        <h3 className="section-title">
          <span className="section-icon">🔋</span> Baterias
        </h3>
        <EquipoRow
          titulo="Bateria"
          nombreCantidad="cantidad_baterias"
          nombrePrecio="precio_bateria"
          form={form}
          onChange={handleChange}
          onBlur={handleBlur}
          unidadLabel="baterias"
        >
          <InputField
            label="Capacidad por bateria"
            name="bateria_kwh"
            value={form.bateria_kwh}
            onChange={handleChange}
            onBlur={handleBlur}
            unit="kWh"
            hint={`Total banco: ${kwhTotales.toFixed(1)} kWh`}
          />
        </EquipoRow>
        <div className="inputs-grid" style={{ marginTop: "0.75rem" }}>
          <InputField
            label="Ciclos de vida"
            name="ciclos_bateria"
            value={form.ciclos_bateria}
            onChange={handleChange}
            onBlur={handleBlur}
            unit="ciclos"
            hint="Litio aprox. 3000-6000 ciclos"
          />
        </div>
      </section>

      {/* ── MPPT ── */}
      <section className="form-section">
        <h3 className="section-title">
          <span className="section-icon">⚡</span> Controladores MPPT
        </h3>
        <EquipoRow
          titulo="Controlador MPPT / Inversor"
          nombreCantidad="cantidad_mppt"
          nombrePrecio="precio_mppt"
          form={form}
          onChange={handleChange}
          onBlur={handleBlur}
          unidadLabel="und"
        />
      </section>

      {/* ── AIRES ACONDICIONADOS ── */}
      <section className="form-section">
        <h3 className="section-title">
          <span className="section-icon">❄️</span> Aires Acondicionados DC 48V
        </h3>
        <EquipoRow
          titulo="Aire acondicionado DC"
          nombreCantidad="cantidad_aires"
          nombrePrecio="precio_aire"
          form={form}
          onChange={handleChange}
          onBlur={handleBlur}
          unidadLabel="aires"
        >
          <InputField
            label="BTU por unidad"
            name="btu_aire"
            value={form.btu_aire}
            onChange={handleChange}
            onBlur={handleBlur}
            unit="BTU"
            hint={`Total BTU instalados: ${new Intl.NumberFormat("es-CO").format(btuTotales)}`}
          />
        </EquipoRow>
      </section>

      {/* ── RESUMEN DE INVERSION ── */}
      <section className="form-section inversion-resumen">
        <h3 className="section-title">
          <span className="section-icon">💰</span> Resumen de Inversion
        </h3>
        <div className="resumen-grid">
          <div className="resumen-item">
            <span>☀️ Paneles ({form.cantidad_paneles} und)</span>
            <strong>{cop(totalPaneles)}</strong>
          </div>
          <div className="resumen-item">
            <span>🔋 Baterias ({form.cantidad_baterias} und)</span>
            <strong>{cop(totalBaterias)}</strong>
          </div>
          <div className="resumen-item">
            <span>⚡ MPPT ({form.cantidad_mppt} und)</span>
            <strong>{cop(totalMppt)}</strong>
          </div>
          <div className="resumen-item">
            <span>❄️ Aires ({form.cantidad_aires} und)</span>
            <strong>{cop(totalAires)}</strong>
          </div>
          <div className="resumen-total">
            <span>TOTAL INVERSION</span>
            <strong>{cop(granTotal)}</strong>
          </div>
        </div>
      </section>

      {/* ── CONSUMO Y TARIFA ── */}
      <section className="form-section">
        <h3 className="section-title">
          <span className="section-icon">🏠</span> Consumo y Tarifa
        </h3>
        <div className="inputs-grid">
          <InputField
            label="Area a climatizar"
            name="area"
            value={form.area}
            onChange={handleChange}
            onBlur={handleBlur}
            unit="m²"
            hint="Para calcular BTU necesarios"
          />
          <InputField
            label="Consumo diario"
            name="consumo_diario"
            value={form.consumo_diario}
            onChange={handleChange}
            onBlur={handleBlur}
            unit="kWh/día"
            hint="Ver recibo Electrohuila"
          />
          <InputField
            label="Precio del kWh"
            name="precio_kwh"
            value={form.precio_kwh}
            onChange={handleChange}
            onBlur={handleBlur}
            unit="COP/kWh"
            hint="Tarifa Electrohuila aprox. 900"
          />
          <InputField
            label="Mantenimiento mensual"
            name="mantenimiento_mensual"
            value={form.mantenimiento_mensual}
            onChange={handleChange}
            onBlur={handleBlur}
            unit="COP/mes"
            hint="Limpieza, revision, ajustes"
          />
        </div>
      </section>

      {/* ── VOLTAJE DEL SISTEMA ── */}
      <section className="form-section">
        <h3 className="section-title">
          <span className="section-icon">⚡</span> Voltaje del Sistema
        </h3>
        <div className="inputs-grid">
          <div className="input-group span-full">
            <label htmlFor="voltaje_sistema">Voltaje nominal</label>
            <div className="voltaje-selector">
              <select
                id="voltaje_sistema"
                name="voltaje_sistema"
                value={form.voltaje_sistema}
                onChange={(e) => {
                  const newValue = e.target.value;
                  setForm((prev) => ({
                    ...prev,
                    voltaje_sistema: newValue,
                    voltaje_custom:
                      newValue === "custom" ? prev.voltaje_custom : "",
                  }));
                }}
              >
                <option value="12">🔋 12V (sistemas pequeños)</option>
                <option value="24">🔋 24V (sistemas medianos)</option>
                <option value="48">
                  🔋 48V (sistemas grandes - recomendado)
                </option>
                <option value="custom">⚙️ Custom (ingresar voltaje)</option>
              </select>
              {form.voltaje_sistema === "custom" && (
                <input
                  type="text"
                  inputMode="decimal"
                  name="voltaje_custom"
                  value={form.voltaje_custom}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="Ej: 36"
                  className="custom-voltaje-input"
                />
              )}
            </div>
            <span className="hint">
              Define el voltaje nominal de tu banco de baterías. Afecta el
              cálculo de amperaje.
            </span>
          </div>
        </div>
      </section>

      {/* ── CABLEADO DC (OPCIONAL) ── */}
      <section className="form-section">
        <h3 className="section-title">
          <span className="section-icon">🔌</span> Cableado DC (Opcional)
        </h3>
        <div className="inputs-grid">
          <InputField
            label="Distancia paneles a baterías"
            name="distancia_paneles"
            value={form.distancia_paneles}
            onChange={handleChange}
            onBlur={handleBlur}
            unit="metros"
            hint="Distancia desde paneles hasta MPPT/baterías"
          />
          <div className="input-group cableado-select-group">
            <label htmlFor="tipo_cable">Tipo de cable</label>
            <select
              id="tipo_cable"
              name="tipo_cable"
              value={form.tipo_cable || "cobre"}
              onChange={handleChange}
            >
              <option value="cobre">🔴 Cobre (recomendado)</option>
              <option value="aluminio">⚪ Aluminio (económico)</option>
            </select>
            <span className="hint">
              Cobre mejor conductividad, aluminio más económico
            </span>
          </div>
          <div className="input-group">
            <label htmlFor="caida_voltaje">Caída de voltaje máxima</label>
            <select
              id="caida_voltaje"
              name="caida_voltaje"
              value={form.caida_voltaje || "2"}
              onChange={handleChange}
            >
              <option value="1">1% (óptimo, cable más grueso)</option>
              <option value="2">2% (estándar recomendado)</option>
              <option value="3">3% (económico, más pérdida)</option>
            </select>
            <span className="hint">
              Menor % = mejor eficiencia pero cable más caro
            </span>
          </div>
        </div>
      </section>

      <div className="form-footer">
        <button type="submit" className="btn-simular">
          <span>Simular Sistema Solar</span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
          </svg>
        </button>
        <button
          type="button"
          className="btn-reset"
          onClick={() => setForm(DEFAULTS_STR)}
        >
          Restablecer valores
        </button>
      </div>
    </form>
  );
}
