import { ErrorPage, Spinner } from "@grit42/client-library/components";
import { useSession } from "../../../features/auth";
import { Navigate } from "react-router-dom";

const UnauthorizedPage = () => {
  const { isLoading, data } = useSession();

  if (isLoading) return <Spinner />;

  if ((data?.permissions.length ?? 0) > 0) {
    return <Navigate to="/" />;
  }

  return (
    <ErrorPage error="You are not authorized to use grit">
      <p>Contact your system administrator to request access.</p>
    </ErrorPage>
  );
};

export default UnauthorizedPage;
