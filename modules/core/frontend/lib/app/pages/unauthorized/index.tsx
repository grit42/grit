import { ErrorPage } from "@grit42/client-library/components";

const UnauthorizedPage = () => {
  return (
    <ErrorPage error="You are not authorized to use grit">
      <p>Contact your system administrator to request access.</p>
    </ErrorPage>
  );
};

export default UnauthorizedPage;
