import { ChatbotProvider } from "./context";
import { ChatbotToggle } from "./ChatbotToggle";

export { ChatbotProvider, useChatbot } from "./context";
export { ChatbotToggle } from "./ChatbotToggle";
export { ChatbotPanel } from "./ChatbotPanel";
export { ChatMessages } from "./ChatMessages";
export { ChatInput } from "./ChatInput";

export function ChatbotFeature() {
	return (
		<ChatbotProvider isFeatureOn={false}>
			<ChatbotToggle />
		</ChatbotProvider>
	);
}
