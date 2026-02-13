import { useTranslation } from "react-i18next";
import { useChatbot } from "./context";

export function ChatMessages() {
	const ctx = useChatbot();
	const { t } = useTranslation(["common"]);

	if (!ctx?.isFeatureOn) return null;

	const { messages } = ctx;

	if (messages.length === 0) {
		return (
			<div className="flex-1 flex items-center justify-center p-4 text-gray-500 dark:text-gray-400 text-sm text-center">
				<p>{t("chatbotEmptyState")}</p>
			</div>
		);
	}

	return (
		<div className="flex-1 overflow-auto p-4 flex flex-col gap-3">
			{messages.map((msg) => (
				<div
					key={msg.id}
					className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
				>
					<div
						className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
							msg.role === "user"
								? "bg-primary text-primary-foreground rounded-br-md"
								: "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-bl-md"
						}`}
					>
						{msg.text}
					</div>
				</div>
			))}
		</div>
	);
}
