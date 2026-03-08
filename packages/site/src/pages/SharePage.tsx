import { useParams, Navigate } from "react-router-dom";

function SharePage() {
  const { token } = useParams<{ token: string }>();
  return <Navigate to={`/s/${token}`} replace />;
}

export default SharePage;
