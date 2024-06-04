import { useAppSelector } from "src/infra";
import { StoreSlice } from ".";

export const useStore = () => useAppSelector(StoreSlice.selectors.selectStore);
