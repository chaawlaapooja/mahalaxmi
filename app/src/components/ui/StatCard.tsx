import './StatCard.css';

interface StatCardProps {
  label: string;
  value: string;
  sub?: string;
  accent?: 'green' | 'blue' | 'teal' | 'orange';
}

export const StatCard = ({ label, value, sub, accent = 'green' }: StatCardProps) => (
  <div className={`stat-card stat-card-${accent}`}>
    <span className="stat-label">{label}</span>
    <span className="stat-value">{value}</span>
    {sub && <span className="stat-sub">{sub}</span>}
  </div>
);
