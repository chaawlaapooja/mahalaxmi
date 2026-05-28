import './Spinner.css';

export const Spinner = ({ label = 'Loading...' }: { label?: string }) => (
  <div className="spinner-wrap" role="status">
    <div className="spinner" />
    <span>{label}</span>
  </div>
);
