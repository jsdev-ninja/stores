import { useTranslation } from "react-i18next";
import { Button } from "@heroui/react";
import { useChatbot } from "./context";
import { ChatbotPanel } from "./ChatbotPanel";

export function ChatbotToggle() {
	const ctx = useChatbot();
	const { t } = useTranslation(["common"]);

	if (!ctx?.isFeatureOn) return null;

	const { isOpen, setIsOpen } = ctx;

	return (
		<div className="fixed bottom-6 end-6 z-50 flex flex-col items-end gap-3">
			{isOpen && (
				<div className="animate-in fade-in slide-in-from-bottom-4 duration-200">
					<ChatbotPanel />
				</div>
			)}
			<Button
				isIconOnly
				color="primary"
				size="lg"
				className="shadow-[0_4px_14px_rgba(0,0,0,0.12),0_-1px_0_rgba(255,255,255,0.08)] rounded-full"
				aria-label={isOpen ? t("chatbotClose") : t("chatbot")}
				onPress={() => setIsOpen(!isOpen)}
			>
				{isOpen ? (
					<CloseIcon />
				) : (
					<svg
						className="w-6 h-6"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
						/>
					</svg>
				)}
			</Button>
		</div>
	);
}

function CloseIcon() {
	return (
		<svg
			className="w-6 h-6"
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
	);
}
