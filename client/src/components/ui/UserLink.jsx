import { Link, useNavigate } from 'react-router-dom';

// Link to a rider's profile. Inside an already-clickable card (a link can't contain a link),
// pass inCard and it navigates on click instead of rendering a nested <a>.
export default function UserLink({ username, inCard = false, className = '', children }) {
  const navigate = useNavigate();
  if (!inCard) return <Link to={`/u/${username}`} className={`hover:underline ${className}`}>{children}</Link>;
  return (
    <span
      role="link"
      tabIndex={0}
      className={`cursor-pointer hover:underline ${className}`}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        navigate(`/u/${username}`);
      }}
      onKeyDown={(e) => e.key === 'Enter' && navigate(`/u/${username}`)}
    >
      {children}
    </span>
  );
}
