import { Link } from 'react-router-dom';

// '#id'  -> plain same-page anchor (works on every page, e.g. #contact = the global footer)
// '/...' -> client-side route (including '/#section', which the ScrollManager scrolls to)
export default function SmartLink({ to, ...props }) {
  return to.startsWith('#') ? <a href={to} {...props} /> : <Link to={to} {...props} />;
}
