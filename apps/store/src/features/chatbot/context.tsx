import {
	createContext,
	useContext,
	useState,
	useCallback,
	type ReactNode,
} from "react";
import { useAppApi } from "src/appApi";
import { useTranslation } from "react-i18next";

export type ChatMessage = {
	id: string;
	text: string;
	role: "user" | "bot";
	timestamp: number;
};

export type ChatbotContextValue = {
	isFeatureOn: boolean;
	isOpen: boolean;
	setIsOpen: (open: boolean) => void;
	messages: ChatMessage[];
	sendMessage: (text: string) => void;
	isLoading: boolean;
};

const ChatbotContext = createContext<ChatbotContextValue | null>(null);

export function useChatbot(): ChatbotContextValue | null {
	return useContext(ChatbotContext);
}

type ChatbotProviderProps = {
	children: ReactNode;
	isFeatureOn?: boolean;
};

export function ChatbotProvider({
	children,
	isFeatureOn = true,
}: ChatbotProviderProps) {
	const [isOpen, setIsOpen] = useState(false);
	const [messages, setMessages] = useState<ChatMessage[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const appApi = useAppApi();
	const { t } = useTranslation(["common"]);

	const sendMessage = useCallback(
		async (text: string) => {
			const trimmed = text.trim();
			if (!trimmed) return;
			const userMsg: ChatMessage = {
				id: `user-${Date.now()}`,
				text: trimmed,
				role: "user",
				timestamp: Date.now(),
			};
			setMessages((prev) => [...prev, userMsg]);
			setIsLoading(true);
			try {
				console.log("sending message", trimmed);
				const result = await appApi.chatbot.sendMessage(trimmed);
				console.log("result", result);
				const botText = result.success && result.data?.content
					? result.data.content
					: result.error ?? t("chatbotError");
				const botMsg: ChatMessage = {
					id: `bot-${Date.now()}`,
					text: botText,
					role: "bot",
					timestamp: Date.now(),
				};
				setMessages((prev) => [...prev, botMsg]);
			} catch(error: any) {
				console.error("sendMessage", error);
				const botMsg: ChatMessage = {
					id: `bot-${Date.now()}`,
					text: t("chatbotError"),
					role: "bot",
					timestamp: Date.now(),
				};
				setMessages((prev) => [...prev, botMsg]);
			} finally {
				setIsLoading(false);
			}
		},
		[t]
	);

	const value: ChatbotContextValue = {
		isFeatureOn,
		isOpen,
		setIsOpen,
		messages,
		sendMessage,
		isLoading,
	};

	return (
		<ChatbotContext.Provider value={value}>{children}</ChatbotContext.Provider>
	);
}
