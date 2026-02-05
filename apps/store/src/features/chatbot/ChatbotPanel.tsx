import { useTranslation } from "react-i18next";
import { Button } from "@heroui/react";
import { useChatbot } from "./context";
import { ChatMessages } from "./ChatMessages";
import { ChatInput } from "./ChatInput";

export function ChatbotPanel() {
	const ctx = useChatbot();
	const { t } = useTranslation(["common"]);

	if (!ctx?.isFeatureOn) return null;

	const { setIsOpen } = ctx;

	return (
		<div
			className="flex flex-col rounded-2xl bg-white dark:bg-gray-900 shadow-[0_2px_8px_rgba(0,0,0,0.08),0_-1px_0_rgba(255,255,255,0.06)] border border-gray-200/80 dark:border-gray-700/80 overflow-hidden"
			style={{ width: 360, height: 480 }}
		>
			<div className="flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-800/80 border-b border-gray-200 dark:border-gray-700 shrink-0">
				<span className="font-medium text-gray-900 dark:text-gray-100">
					{t("chatbot")}
				</span>
				<Button
					isIconOnly
					size="sm"
					variant="light"
					aria-label={t("chatbotClose")}
					onPress={() => setIsOpen(false)}
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
							d="M6 18L18 6M6 6l12 12"
						/>
					</svg>
				</Button>
			</div>
			<ChatMessages />
			<ChatInput />
		</div>
	);
}
