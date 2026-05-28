import './Alert.css';

export const Alert = ({
  type = 'error',
  message,
  onClose,
}: {
  type?: 'error' | 'success';
  message: string;
  onClose?: () => void;
}) => (
  <div className={`alert alert-${type}`} role="alert">
    <span>{message}</span>
    {onClose && (
      <button type="button" onClick={onClose} aria-label="Dismiss">
        ×
      </button>
    )}
  </div>
);
