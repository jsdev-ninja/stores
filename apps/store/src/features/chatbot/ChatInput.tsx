import { useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Button, Input } from "@heroui/react";
import { useChatbot } from "./context";

export function ChatInput() {
	const ctx = useChatbot();
	const [value, setValue] = useState("");
	const { t } = useTranslation(["common"]);

	if (!ctx?.isFeatureOn) return null;

	const { sendMessage } = ctx;

	const handleSend = useCallback(() => {
		sendMessage(value);
		setValue("");
	}, [value, sendMessage]);

	const handleKeyDown = useCallback(
		(e: React.KeyboardEvent) => {
			if (e.key === "Enter" && !e.shiftKey) {
				e.preventDefault();
				handleSend();
			}
		},
		[handleSend]
	);

	return (
		<div className="flex gap-2 p-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/80">
			<Input
				value={value}
				onValueChange={setValue}
				onKeyDown={handleKeyDown}
				placeholder={t("chatbotInputPlaceholder")}
				classNames={{
					input: "text-sm",
					inputWrapper: "bg-white dark:bg-gray-900",
				}}
				minLength={1}
				autoComplete="off"
			/>
			<Button
				color="primary"
				isIconOnly
				aria-label={t("chatbotSend")}
				onPress={handleSend}
				isDisabled={!value.trim()}
			>
				<svg
					className="w-5 h-5"
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
				>
					<path
						strokeLinecap="round"
						strokeLinejoin="round"
						strokeWidth={2}
						d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
					/>
				</svg>
			</Button>
		</div>
	);
}
