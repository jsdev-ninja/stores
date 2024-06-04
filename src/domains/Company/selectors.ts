import { useAppSelector } from "src/infra";
import { CompanySlice } from ".";

export const useCompany = () => useAppSelector(CompanySlice.selectors.selectCompany);
