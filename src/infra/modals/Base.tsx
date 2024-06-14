import { AnimatePresence } from "framer-motion";
import { ReactNode } from "react";

export const ModalsContainer = ({ children }: { children: ReactNode }) => {
	return <AnimatePresence>{children}</AnimatePresence>;
};
