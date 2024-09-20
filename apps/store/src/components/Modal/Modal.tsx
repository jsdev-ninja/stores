/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { ReactNode } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Icon } from "..";
import { motion } from "framer-motion";

export const DialogContent = React.forwardRef<any, any>(({ children, ...props }, forwardedRef) => (
	<DialogPrimitive.Portal>
		<DialogPrimitive.Overlay asChild>
			<motion.div
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				exit={{ opacity: 0 }}
				className="bg-slate-900/20 backdrop-blur p-8 fixed z-[100] inset-0  grid place-items-center overflow-y-scroll cursor-pointer"
			/>
		</DialogPrimitive.Overlay>
		<DialogPrimitive.Content asChild {...props} ref={forwardedRef}>
			<motion.div
				initial={{ scale: 0, rotate: "12.5deg", translateX: "-50%", translateY: "-50%" }}
				animate={{ scale: 1, rotate: "0deg" }}
				exit={{ scale: 0, rotate: "0deg" }}
				className="z-[200] fixed top-[50%] left-[50%] w-full max-h-[85vh] mx-auto flex justify-center"
			>
				{children}
			</motion.div>
		</DialogPrimitive.Content>
	</DialogPrimitive.Portal>
));

const Dialog = DialogPrimitive.Root;

export function Modal({ children }: { children: ReactNode }) {
	return (
		<Dialog open>
			<DialogContent>{children}</DialogContent>
		</Dialog>
	);
}

Modal.CloseButton = ({ onClick }: { onClick?: () => void }) => {
	return (
		<div className="flex justify-end">
			<DialogPrimitive.Close
				className="bg-green4 text-black hover:bg-green5 focus:shadow-green7 inline-flex h-[35px] items-center justify-center rounded-[4px] px-[15px] font-medium leading-none focus:shadow-[0_0_0_2px] focus:outline-none"
				aria-label="Close"
				onClick={onClick}
			>
				<Icon name="close" />
			</DialogPrimitive.Close>
		</div>
	);
};

Modal.Title = function ModalTitle({ children }: { children: ReactNode }) {
	return <div className="font-semibold text-2xl">{children}</div>;
};
