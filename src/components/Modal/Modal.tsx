// your-dialog.jsx
import React, { ReactNode } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";

export const DialogContent = React.forwardRef(({ children, ...props }, forwardedRef) => (
	<DialogPrimitive.Portal>
		<DialogPrimitive.Overlay className="bg-blackA6 data-[state=open]:animate-overlayShow fixed inset-0" />
		<DialogPrimitive.Content
			className="data-[state=open]:animate-contentShow fixed top-[50%] left-[50%] max-h-[85vh] w-[90vw] max-w-[450px] translate-x-[-50%] translate-y-[-50%] rounded-[6px] bg-white p-[25px] shadow-[hsl(206_22%_7%_/_35%)_0px_10px_38px_-10px,_hsl(206_22%_7%_/_20%)_0px_10px_20px_-15px] focus:outline-none"
			{...props}
			ref={forwardedRef}
		>
			<div className="flex justify-end">
				<DialogPrimitive.Close
					className="bg-green4 text-green11 hover:bg-green5 focus:shadow-green7 inline-flex h-[35px] items-center justify-center rounded-[4px] px-[15px] font-medium leading-none focus:shadow-[0_0_0_2px] focus:outline-none"
					aria-label="Close"
				>
					X
				</DialogPrimitive.Close>
			</div>
			{children}
		</DialogPrimitive.Content>
	</DialogPrimitive.Portal>
));

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;

export function Modal({ children }: { children: ReactNode }) {
	return (
		<Dialog open>
			<DialogContent>{children}</DialogContent>
		</Dialog>
	);
}
