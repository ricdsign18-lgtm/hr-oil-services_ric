import Modal from "./Modal";
import "./FormModal.css";

function FormModal({
  title,
  children,
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
  submitLabel = "Guardar",
  cancelLabel = "Cancelar",
  disabled = false,
  size = "md",
  fields = [],
}) {
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!isLoading && !disabled && onSubmit) {
      onSubmit(e);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={!isLoading ? onClose : undefined}
      title={title}
      size={size}
    >
      <form onSubmit={handleSubmit} className="form-modal-container">
        <div className="form-modal-body">
          {/* Render dynamic fields if provided */}
          {fields.map((field, index) => (
            <div key={field.name || index} className="form-modal-group">
              {field.label && (
                <label htmlFor={field.name} className="form-modal-label">
                  {field.label}
                  {field.required && <span className="required-mark">*</span>}
                </label>
              )}

              {field.type === "select" ? (
                <select
                  id={field.name}
                  name={field.name}
                  className="form-modal-control"
                  required={field.required}
                  defaultValue={field.defaultValue || ""}
                  disabled={field.disabled}
                >
                  <option value="" disabled>
                    Seleccione...
                  </option>
                  {field.options?.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  id={field.name}
                  name={field.name}
                  type={field.type || "text"}
                  className="form-modal-control"
                  placeholder={field.placeholder}
                  required={field.required}
                  defaultValue={field.defaultValue}
                  disabled={field.disabled}
                  step={field.step}
                  min={field.min}
                  max={field.max}
                />
              )}
            </div>
          ))}

          {children}
        </div>

        <div className="form-modal-footer">
          <button
            type="button"
            className="form-modal-btn cancel"
            onClick={onClose}
            disabled={isLoading}
          >
            {cancelLabel}
          </button>

          <button
            type="submit"
            className="form-modal-btn submit"
            disabled={isLoading || disabled}
          >
            {isLoading && <span className="form-modal-spinner"></span>}
            {isLoading ? "Guardando..." : submitLabel}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export default FormModal;
