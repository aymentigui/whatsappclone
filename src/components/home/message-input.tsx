import { Laugh,  Send } from "lucide-react";
import { Input } from "../ui/input";
import { useState } from "react";
import { Button } from "../ui/button";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useConversationStore } from "@/store/chat-store";
import toast from "react-hot-toast";
import useComponentVisible from "@/hooks/UseComponentVisible";
import EmojiPicker, { Theme } from "emoji-picker-react"
import MediaDropdown from "./media-dropdown";
import MicDialog from "./MicDialog";

const MessageInput = () => {
	const [msgText, setMsgText] = useState("");
	const sendTxtMessage = useMutation(api.messages.sendTextMessage)
	const me = useQuery(api.users.getMe)
	const { selectedConversation } = useConversationStore()

	const { ref, isComponentVisible, setIsComponentVisible } = useComponentVisible(false)

	const handleSendTextMessage = async (e: React.FormEvent) => {
		e.preventDefault()
		try {
			await sendTxtMessage({ content: msgText, conversation: selectedConversation!._id, sender: me!._id })
			setMsgText("")
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
		} catch (err: any) {
			toast(err)
		}
	}

	return (
		<div className='bg-gray-primary p-2 flex gap-4 items-center'>
			<div className='relative flex gap-2 ml-2'>
				<div ref={ref} onClick={() => setIsComponentVisible(true)}>
					{isComponentVisible && (
						<EmojiPicker
							theme={Theme.DARK}
							style={{ position: "absolute", bottom: "1.5rem", left: "1 rem", zIndex: "50" }}
							onEmojiClick={(emoji) => {
								setMsgText((prev) => prev + emoji.emoji)
							}}
						></EmojiPicker>
					)}
					<Laugh className='text-gray-600 dark:text-gray-400' />
				</div>
				<MediaDropdown></MediaDropdown>
			</div>
			<form onSubmit={handleSendTextMessage} className='w-full flex gap-3'>
				<div className='flex-1'>
					<Input
						type='text'
						placeholder='Type a message'
						className='py-2 text-sm w-full rounded-lg shadow-sm bg-gray-tertiary focus-visible:ring-transparent'
						value={msgText}
						onChange={(e) => setMsgText(e.target.value)}
					/>
				</div>
				<div className='mr-4 flex items-center gap-3'>
					{msgText.length > 0 ? (
						<Button
							type='submit'
							size={"sm"}
							className='bg-transparent text-foreground hover:bg-transparent'
						>
							<Send />
						</Button>
					) : <MicDialog/>}
				</div>
			</form>
		</div>
	);
};
export default MessageInput;