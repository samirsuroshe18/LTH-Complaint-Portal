import { Outlet } from "react-router";
import { DashboardLayout } from "@toolpad/core/DashboardLayout";
import { PageContainer } from "@toolpad/core/PageContainer";

export default function Layout() {

  return (
    <div>
      <DashboardLayout>
        <Outlet />
      </DashboardLayout>

      {/* if you want breadscrub and heade in your outlet page then fallowing are the code :
      <DashboardLayout>
        <PageContainer disableHeader disableBreadcrumbs>
          <Outlet />
        </PageContainer>
      </DashboardLayout> */}
    </div>
  );
}