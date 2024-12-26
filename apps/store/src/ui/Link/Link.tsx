import { Link as UiLink, LinkProps as UiLinkProps } from "@nextui-org/react";
import { TLinkTo, Router } from "src/navigation";
type LinkProps = UiLinkProps & {
	to: TLinkTo;
};

export function Link(props: LinkProps) {
	return <UiLink as={Router.Link} {...props} />;
}
