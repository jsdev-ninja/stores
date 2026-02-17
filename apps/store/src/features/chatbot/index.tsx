import { ChatbotProvider } from "./context";
import { ChatbotToggle } from "./ChatbotToggle";
import { useUser } from "src/domains/user";

export { ChatbotProvider, useChatbot } from "./context";
export { ChatbotToggle } from "./ChatbotToggle";
export { ChatbotPanel } from "./ChatbotPanel";
export { ChatMessages } from "./ChatMessages";
export { ChatInput } from "./ChatInput";

export function ChatbotFeature() {
	const user = useUser();
	return (
		<ChatbotProvider isFeatureOn={user?.email === "balasistore6@gmail.com"}>
			<ChatbotToggle />
		</ChatbotProvider>
	);
}
