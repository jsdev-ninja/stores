import { Link as UiLink, LinkProps as UiLinkProps } from "@heroui/react";
import { forwardRef } from "react";
import { TLinkTo, Router } from "src/navigation";
type LinkProps = UiLinkProps & {
	to: TLinkTo;
};

export const Link = forwardRef<HTMLAnchorElement, LinkProps>(function Link(props, ref) {
	return <UiLink as={Router.Link} {...props} ref={ref} />;
});
