import { useState, useEffect } from "react";
import { ArrowIcon, BackIcon, XIcon, AddIcon, EditIcon } from "../../../../../../../../../../../../assets/icons/Icons";
import "./PersonalForm.css";

const PersonalForm = ({ employee, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    nombre: "",
    apellido: "",
    cedula: "",
    cargo: "",
    tipoNomina: "",
    tipoSalario: "",
    frecuenciaPago: "",
    montoSalario: "",
    montoLey: "",
    bonificacionEmpresa: "",
    fechaIngreso: "",
    porcentajeIslr: "",
    montoBaseIvss: "",
    montoBaseParoForzoso: "",
    montoBaseFaov: "",
    montoBaseIslr: "",
    estado: "Activo",
  });

  const [currentStep, setCurrentStep] = useState(1);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (employee) {
      setFormData({
        nombre: employee.nombre || "",
        apellido: employee.apellido || "",
        cedula: employee.cedula || "",
        cargo: employee.cargo || "",
        tipoNomina: employee.tipoNomina || "",
        tipoSalario: employee.tipoSalario || "",
        frecuenciaPago: employee.frecuenciaPago || "",
        montoSalario: employee.montoSalario?.toString() || "",
        montoLey: employee.montoLey?.toString() || "",
        bonificacionEmpresa: employee.bonificacionEmpresa?.toString() || "",
        fechaIngreso: employee.fechaIngreso || "",
        porcentajeIslr: employee.porcentajeIslr?.toString() || "",
        montoBaseIvss: employee.montoBaseIvss?.toString() || "",
        montoBaseParoForzoso: employee.montoBaseParoForzoso?.toString() || "",
        montoBaseFaov: employee.montoBaseFaov?.toString() || "",
        montoBaseIslr: employee.montoBaseIslr?.toString() || "",
        estado: employee.estado || "Activo",
      });
    } else {
      // Reset form when adding new employee
      setFormData({
        nombre: "",
        apellido: "",
        cedula: "",
        cargo: "",
        tipoNomina: "",
        tipoSalario: "",
        frecuenciaPago: "",
        montoSalario: "",
        montoLey: "",
        bonificacionEmpresa: "",
        fechaIngreso: "",
        porcentajeIslr: "",
        montoBaseIvss: "",
        montoBaseParoForzoso: "",
        montoBaseFaov: "",
        montoBaseIslr: "",
        estado: "Activo",
      });
      setCurrentStep(1); // Reset to step 1
    }
  }, [employee]);

  const tiposNomina = [
    "Tecnica Operativa",
    "Tecnica Operativa Administrativa – Trabajos Especiales",
    "Administrativa",
    "Ejecucion",
  ];

  const tiposSalario = ["Diario", "Semanal", "Mensual"];
  const frecuenciasPago = ["Semanal", "Quincenal"];

  const isNominaConLey =
    formData.tipoNomina === "Ejecucion" ||
    formData.tipoNomina === "Administrativa";
  const showMontoSalario = !isNominaConLey;
  const showMontoLeyBonificacion = isNominaConLey;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Limpiar errores cuando el usuario escribe
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const validateStep = (step) => {
    const newErrors = {};
    let isValid = true;

    if (step === 1) {
      if (!formData.nombre.trim()) newErrors.nombre = "El nombre es requerido";
      if (!formData.apellido.trim()) newErrors.apellido = "El apellido es requerido";
      if (!formData.cedula.trim()) newErrors.cedula = "La cédula es requerida";
      if (!formData.cargo.trim()) newErrors.cargo = "El cargo es requerido";
    }

    if (step === 2) {
      if (!formData.tipoNomina) newErrors.tipoNomina = "El tipo de nómina es requerido";
      if (!formData.tipoSalario) newErrors.tipoSalario = "El tipo de salario es requerido";
      if (!formData.frecuenciaPago) newErrors.frecuenciaPago = "La frecuencia de pago es requerida";
      if (!formData.fechaIngreso) newErrors.fechaIngreso = "La fecha de ingreso es requerida";
    }

    if (step === 3) {
      if (showMontoSalario && !formData.montoSalario) {
        newErrors.montoSalario = "El monto del salario es requerido";
      }
      if (showMontoLeyBonificacion) {
        if (!formData.montoLey) newErrors.montoLey = "El monto ley es requerido";
        if (!formData.bonificacionEmpresa) newErrors.bonificacionEmpresa = "La bonificación es requerida";
        if (!formData.porcentajeIslr) newErrors.porcentajeIslr = "El porcentaje ISLR es requerido";
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      isValid = false;
    }

    return isValid;
  };

  const [transitioning, setTransitioning] = useState(false);

  const nextStep = () => {
    if (validateStep(currentStep)) {
      if (currentStep === 2) {
        setTransitioning(true);
        setTimeout(() => setTransitioning(false), 500);
      }
      setCurrentStep((prev) => prev + 1);
    }
  };

  const prevStep = () => {
    setCurrentStep((prev) => prev - 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (transitioning) return;
    if (!validateStep(3)) return;

    setSubmitting(true);
    try {
      const submitData = { ...formData };
      
      if (isNominaConLey) {
        submitData.montoSalarioTotal = (
          parseFloat(formData.montoLey || 0) +
          parseFloat(formData.bonificacionEmpresa || 0)
        ).toString();
      }

      await onSubmit(submitData);
    } catch (error) {
      console.error("Error en el formulario:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const calcularMontoDiario = () => {
    if (!formData.montoSalario || !formData.tipoSalario) return "";

    const monto = parseFloat(formData.montoSalario);
    switch (formData.tipoSalario) {
      case "Diario":
        return monto;
      case "Semanal":
        return (monto / 5).toFixed(2); // 5 días laborales
      case "Mensual":
        return (monto / 30).toFixed(2); // 30 días promedio
      default:
        return "";
    }
  };

  const renderStepIndicator = () => (
    <div className="step-indicator">
      <div className={`step ${currentStep >= 1 ? "active" : ""}`}>
        <div className="step-number">1</div>
        <div className="step-label">Personal</div>
      </div>
      <div className="step-line"></div>
      <div className={`step ${currentStep >= 2 ? "active" : ""}`}>
        <div className="step-number">2</div>
        <div className="step-label">Laboral</div>
      </div>
      <div className="step-line"></div>
      <div className={`step ${currentStep >= 3 ? "active" : ""}`}>
        <div className="step-number">3</div>
        <div className="step-label">Salarial</div>
      </div>
    </div>
  );

  return (
    <div className="personal-form-container">
      <h3>{employee ? "Editar Empleado" : "Registrar Nuevo Empleado"}</h3>
      
      {renderStepIndicator()}

      <form className="personal-form" onSubmit={handleSubmit}>
        {currentStep === 1 && (
          <div className="form-section fade-in">
            <h4>Información Personal</h4>
            <div className="form-row">
              <div className="form-group">
                <label>Nombre *</label>
                <input
                  type="text"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleChange}
                  className={errors.nombre ? "error" : ""}
                  placeholder="Ingrese el nombre"
                  disabled={submitting}
                />
                {errors.nombre && (
                  <span className="error-message">{errors.nombre}</span>
                )}
              </div>

              <div className="form-group">
                <label>Apellido *</label>
                <input
                  type="text"
                  name="apellido"
                  value={formData.apellido}
                  onChange={handleChange}
                  className={errors.apellido ? "error" : ""}
                  placeholder="Ingrese el apellido"
                  disabled={submitting}
                />
                {errors.apellido && (
                  <span className="error-message">{errors.apellido}</span>
                )}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Cédula *</label>
                <input
                  type="text"
                  name="cedula"
                  value={formData.cedula}
                  onChange={handleChange}
                  className={errors.cedula ? "error" : ""}
                  placeholder="Número de cédula"
                  disabled={submitting}
                />
                {errors.cedula && (
                  <span className="error-message">{errors.cedula}</span>
                )}
              </div>

              <div className="form-group">
                <label>Cargo *</label>
                <input
                  type="text"
                  name="cargo"
                  value={formData.cargo}
                  onChange={handleChange}
                  className={errors.cargo ? "error" : ""}
                  placeholder="Cargo del empleado"
                  disabled={submitting}
                />
                {errors.cargo && (
                  <span className="error-message">{errors.cargo}</span>
                )}
              </div>
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div className="form-section fade-in">
            <h4>Información Laboral</h4>
            <div className="form-row">
              <div className="form-group">
                <label>Tipo de Nómina *</label>
                <select
                  name="tipoNomina"
                  value={formData.tipoNomina}
                  onChange={handleChange}
                  className={errors.tipoNomina ? "error" : ""}
                  disabled={submitting}
                >
                  <option value="">Seleccionar tipo</option>
                  {tiposNomina.map((tipo) => (
                    <option key={tipo} value={tipo}>
                      {tipo}
                    </option>
                  ))}
                </select>
                {errors.tipoNomina && (
                  <span className="error-message">{errors.tipoNomina}</span>
                )}
              </div>

              <div className="form-group">
                <label>Tipo de Salario *</label>
                <select
                  name="tipoSalario"
                  value={formData.tipoSalario}
                  onChange={handleChange}
                  className={errors.tipoSalario ? "error" : ""}
                  disabled={submitting}
                >
                  <option value="">Seleccionar tipo</option>
                  {tiposSalario.map((tipo) => (
                    <option key={tipo} value={tipo}>
                      {tipo}
                    </option>
                  ))}
                </select>
                {errors.tipoSalario && (
                  <span className="error-message">{errors.tipoSalario}</span>
                )}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Frecuencia de Pago *</label>
                <select
                  name="frecuenciaPago"
                  value={formData.frecuenciaPago}
                  onChange={handleChange}
                  className={errors.frecuenciaPago ? "error" : ""}
                  disabled={submitting}
                >
                  <option value="">Seleccionar frecuencia</option>
                  {frecuenciasPago.map((frecuencia) => (
                    <option key={frecuencia} value={frecuencia}>
                      {frecuencia}
                    </option>
                  ))}
                </select>
                {errors.frecuenciaPago && (
                  <span className="error-message">{errors.frecuenciaPago}</span>
                )}
              </div>

              <div className="form-group">
                <label>Fecha de Ingreso *</label>
                <input
                  type="date"
                  name="fechaIngreso"
                  value={formData.fechaIngreso}
                  onChange={handleChange}
                  className={errors.fechaIngreso ? "error" : ""}
                  disabled={submitting}
                />
                {errors.fechaIngreso && (
                  <span className="error-message">{errors.fechaIngreso}</span>
                )}
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Estado *</label>
                <select
                  name="estado"
                  value={formData.estado}
                  onChange={handleChange}
                  className={errors.estado ? "error" : ""}
                  disabled={submitting}
                >
                  <option value="Activo">Activo</option>
                  <option value="Inactivo">Inactivo</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {currentStep === 3 && (
          <div className="form-section fade-in">
            <h4>Información Salarial</h4>

            {showMontoSalario && (
              <div className="form-group full-width">
                <label>Monto del Salario (USD$) *</label>
                <input
                  type="number"
                  name="montoSalario"
                  value={formData.montoSalario}
                  onChange={handleChange}
                  className={errors.montoSalario ? "error" : ""}
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  disabled={submitting}
                />
                {errors.montoSalario && (
                  <span className="error-message">{errors.montoSalario}</span>
                )}
                {formData.montoSalario && formData.tipoSalario && (
                  <div className="calculation-info">
                    <small>
                      Monto diario aproximado: USD$ {calcularMontoDiario()}
                    </small>
                  </div>
                )}
              </div>
            )}

            {showMontoLeyBonificacion && (
              <>
                <div className="form-row">
                  <div className="form-group">
                    <label>Monto Ley (USD$) *</label>
                    <input
                      type="number"
                      name="montoLey"
                      value={formData.montoLey}
                      onChange={handleChange}
                      className={errors.montoLey ? "error" : ""}
                      placeholder="0.00"
                      step="0.01"
                      min="0"
                      disabled={submitting}
                    />
                    {errors.montoLey && (
                      <span className="error-message">{errors.montoLey}</span>
                    )}
                  </div>

                  <div className="form-group">
                    <label>Bonificación Empresa (USD$) *</label>
                    <input
                      type="number"
                      name="bonificacionEmpresa"
                      value={formData.bonificacionEmpresa}
                      onChange={handleChange}
                      className={errors.bonificacionEmpresa ? "error" : ""}
                      placeholder="0.00"
                      step="0.01"
                      min="0"
                      disabled={submitting}
                    />
                    {errors.bonificacionEmpresa && (
                      <span className="error-message">
                        {errors.bonificacionEmpresa}
                      </span>
                    )}
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Porcentaje ISLR Individual (%) *</label>
                    <input
                      type="number"
                      name="porcentajeIslr"
                      value={formData.porcentajeIslr}
                      onChange={handleChange}
                      className={errors.porcentajeIslr ? "error" : ""}
                      placeholder="0.00"
                      step="0.01"
                      min="0"
                      max="100"
                      disabled={submitting}
                    />
                    {errors.porcentajeIslr && (
                      <span className="error-message">
                        {errors.porcentajeIslr}
                      </span>
                    )}
                    <small>
                      Porcentaje de ISLR que se aplicará a este empleado
                    </small>
                  </div>
                </div>

                <div className="form-section-divider">
                  <h5>Deducciones de Ley (Configuración Individual)</h5>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Monto Base IVSS (Bs)</label>
                    <input
                      type="number"
                      name="montoBaseIvss"
                      value={formData.montoBaseIvss}
                      onChange={handleChange}
                      placeholder="150.00"
                      step="0.01"
                      disabled={submitting}
                    />
                  </div>
                  <div className="form-group">
                    <label>Monto Base Paro Forzoso (Bs)</label>
                    <input
                      type="number"
                      name="montoBaseParoForzoso"
                      value={formData.montoBaseParoForzoso}
                      onChange={handleChange}
                      placeholder="150.00"
                      step="0.01"
                      disabled={submitting}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Monto Base FAOV (Bs)</label>
                    <input
                      type="number"
                      name="montoBaseFaov"
                      value={formData.montoBaseFaov}
                      onChange={handleChange}
                      placeholder="1300.00"
                      step="0.01"
                      disabled={submitting}
                    />
                  </div>
                  <div className="form-group">
                    <label>Monto Base ISLR (USD)</label>
                    <input
                      type="number"
                      name="montoBaseIslr"
                      value={formData.montoBaseIslr}
                      onChange={handleChange}
                      placeholder="120.00"
                      step="0.01"
                      disabled={submitting}
                    />
                  </div>
                </div>

                <div className="calculation-info total">
                  <small>
                    <strong>Nota:</strong> La nómina {formData.tipoNomina} incluye
                    deducciones de ley (IVSS, Paro Forzoso, FAOV, ISLR)
                  </small>
                </div>
              </>
            )}

            {showMontoLeyBonificacion &&
              formData.montoLey &&
              formData.bonificacionEmpresa && (
                <div className="calculation-info total">
                  <strong>
                    Salario Mensual Total: USD${" "}
                    {(
                      parseFloat(formData.montoLey || 0) +
                      parseFloat(formData.bonificacionEmpresa || 0)
                    ).toFixed(2)}
                  </strong>
                </div>
              )}
          </div>
        )}

        <div className="form-actions">

          
          {currentStep < 3 ? (
            <button
              type="button"
              className="btn-primary"
              onClick={nextStep}
            >
              Continuar <ArrowIcon style={{ width: '16px', height: '16px', fill: 'currentColor', transform: 'rotate(-180deg)' }} />
            </button>
          ) : (
            <button 
              type="submit" 
              className="btn-primary" 
              disabled={submitting || transitioning}
              style={{ opacity: transitioning ? 0.7 : 1 }}
            >
              {submitting
                ? "Guardando..."
                : employee
                  ? <><EditIcon style={{ width: '16px', height: '16px', fill: 'currentcolor' }} /> Actualizar Empleado</>
                  : <><AddIcon style={{ width: '16px', height: '16px', fill: 'currentcolor' }} /> Registrar Empleado</>}
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default PersonalForm;
