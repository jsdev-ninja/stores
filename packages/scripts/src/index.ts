import { admin } from "./utils/app";
// Get the TenantAwareAuth instance for the specific tenant

const testerTenantId = "tester-tenant-2vcku";
const davidTenantId = "opal-market-tenant-ia9ux";

const tenantId = davidTenantId;
const tenantAuth = admin.auth().tenantManager().authForTenant(tenantId);
