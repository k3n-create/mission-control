import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="panel text-center">
      <h1 className="text-lg font-semibold mb-2">Page not found</h1>
      <Link to="/" className="text-primary underline">Back to Dashboard</Link>
    </div>
  );
}
