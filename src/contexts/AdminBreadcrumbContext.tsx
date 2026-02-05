import { createContext, useContext } from 'react';

type BreadcrumbValue = {
  breadcrumb: string | null;
};

const AdminBreadcrumbContext = createContext<BreadcrumbValue>({ breadcrumb: null });

export const AdminBreadcrumbProvider = AdminBreadcrumbContext.Provider;

export const useAdminBreadcrumb = () => {
  return useContext(AdminBreadcrumbContext);
};
