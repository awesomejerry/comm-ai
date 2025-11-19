import { useNavigate } from 'react-router-dom';

interface QAPhaseEntryProps {
  evaluationId: string;
  disabled?: boolean;
}

/**
 * QAPhaseEntry Component
 *
 * Entry button/link to navigate from evaluation results to Q&A phase
 */
export function QAPhaseEntry({ evaluationId, disabled = false }: QAPhaseEntryProps) {
  const navigate = useNavigate();

  const handleClick = () => {
    if (!disabled) {
      navigate(`/qa/${evaluationId}`);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      className={`
        px-6 py-3 rounded-lg font-medium transition-colors
        ${
          disabled
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : 'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800'
        }
      `}
      aria-label="Start Q&A Phase"
    >
      Start Q&A Phase
    </button>
  );
}
