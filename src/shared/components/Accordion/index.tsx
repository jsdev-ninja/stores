import React, { ReactNode } from "react";
import * as AccordionPrimitives from "@radix-ui/react-accordion";
import classNames from "classnames";
import { ChevronDownIcon } from "@radix-ui/react-icons";

import "./index.scss";

export const Accordion = ({ children }: { children: ReactNode }) => {
	return (
		<AccordionPrimitives.Root className="AccordionRoot" type="single" collapsible={false}>
			{children}
		</AccordionPrimitives.Root>
	);
};

const AccordionTrigger = React.forwardRef(({ children, className, ...props }, forwardedRef) => (
	<AccordionPrimitives.Header className="AccordionHeader">
		<AccordionPrimitives.Trigger
			className={classNames("AccordionTrigger", className)}
			{...props}
			ref={forwardedRef}
		>
			{children}
			<ChevronDownIcon className="AccordionChevron" aria-hidden />
		</AccordionPrimitives.Trigger>
	</AccordionPrimitives.Header>
));

const AccordionContent = React.forwardRef(({ children, className, ...props }, forwardedRef) => (
	<AccordionPrimitives.Content
		className={classNames("AccordionContent", className)}
		{...props}
		ref={forwardedRef}
	>
		<div className="AccordionContentText">{children}</div>
	</AccordionPrimitives.Content>
));

Accordion.Item = AccordionPrimitives.Item;
Accordion.Trigger = AccordionTrigger;
Accordion.Content = AccordionContent;
