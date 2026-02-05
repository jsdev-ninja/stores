import {
	createContext,
	useContext,
	useState,
	useCallback,
	type ReactNode,
} from "react";

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

	const sendMessage = useCallback((text: string) => {
		const trimmed = text.trim();
		if (!trimmed) return;
		const userMsg: ChatMessage = {
			id: `user-${Date.now()}`,
			text: trimmed,
			role: "user",
			timestamp: Date.now(),
		};
		setMessages((prev) => [...prev, userMsg]);
		// Placeholder bot reply - can be replaced with API call
		setTimeout(() => {
			const botMsg: ChatMessage = {
				id: `bot-${Date.now()}`,
				text: "תודה על ההודעה. נחזור אליך בהקדם.",
				role: "bot",
				timestamp: Date.now(),
			};
			setMessages((prev) => [...prev, botMsg]);
		}, 500);
	}, []);

	const value: ChatbotContextValue = {
		isFeatureOn,
		isOpen,
		setIsOpen,
		messages,
		sendMessage,
	};

	return (
		<ChatbotContext.Provider value={value}>{children}</ChatbotContext.Provider>
	);
}
