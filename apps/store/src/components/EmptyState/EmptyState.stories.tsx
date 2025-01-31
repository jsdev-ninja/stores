import type { Meta, StoryObj } from "@storybook/react";

import Img from "../../assets/default_logo.png";

import { EmptyState } from "./EmptyState";

const meta = {
	title: "ui/EmptyState",
	component: EmptyState,
	parameters: {
		layout: "centered",
	},
	tags: ["autodocs"],

	argTypes: {},
	args: {
		img: Img,
		title: "Cart is Empty",
		description: "Add products to cart",
		action: {
			title: "Add Product",
			onClick() {},
		},
	},
} satisfies Meta<typeof EmptyState>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
	args: {},
};
