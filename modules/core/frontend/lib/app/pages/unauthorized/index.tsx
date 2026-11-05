import { Button, ErrorPage, Spinner } from "@grit42/client-library/components";
import { useSession } from "../../../features/auth";
import { useLogoutMutation } from "../../../features/auth/api/mutations";
import { Navigate, useNavigate } from "react-router-dom";

const UnauthorizedPage = () => {
  const { isLoading, data } = useSession();
  const navigate = useNavigate();
  const logoutMutation = useLogoutMutation();

  if (isLoading) return <Spinner />;

  if ((data?.permissions.length ?? 0) > 0) {
    return <Navigate to="/" />;
  }

  return (
    <ErrorPage error="You are not authorized to use grit">
      <p>Contact your system administrator to request access.</p>
      {/* This page has no header, so offer the way out of the account here. */}
      <Button
        loading={logoutMutation.isPending}
        onClick={async () => {
          await logoutMutation.mutateAsync();
          navigate("/core/authenticate");
        }}
      >
        Log out
      </Button>
    </ErrorPage>
  );
};

export default UnauthorizedPage;
