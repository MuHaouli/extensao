import { useState } from "react";
import "./ProfessionalAreaModal.css";

const PROFESSIONAL_AREAS = [
  "Tecnologia",
  "Vendas",
  "Recursos Humanos",
  "Financeiro",
  "Marketing",
  "Operações",
  "Suporte ao Cliente",
  "Gestão de Projetos",
  "Engenharia",
  "Outro",
];

export function ProfessionalAreaModal({
  isOpen,
  onGenerate,
  onCancel,
  isLoading,
}) {
  const [selectedArea, setSelectedArea] = useState("");

  const handleGenerate = () => {
    if (!selectedArea) {
      alert("Por favor, selecione uma área profissional.");
      return;
    }
    onGenerate(selectedArea);
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Gerar Relatório</h2>
        <p>Selecione a área profissional:</p>

        <select
          value={selectedArea}
          onChange={(e) => setSelectedArea(e.target.value)}
          className="professional-select"
          disabled={isLoading}
        >
          <option value="">-- Escolha uma área --</option>
          {PROFESSIONAL_AREAS.map((area) => (
            <option key={area} value={area}>
              {area}
            </option>
          ))}
        </select>

        <div className="modal-buttons">
          <button
            className="btn primary"
            onClick={handleGenerate}
            disabled={isLoading || !selectedArea}
          >
            {isLoading ? "Gerando..." : "Gerar Relatório"}
          </button>
          <button
            className="btn secondary"
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
