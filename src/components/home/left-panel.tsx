"use client";

import { ListFilter, Search } from "lucide-react";
import { Input } from "../ui/input";
import ThemeSwitch from "../theme-switch";
import Conversation from "./conversations";
import { UserButton } from "@clerk/nextjs";
import UserListDialog from "./user-list-dialog";
import { useConvexAuth, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useEffect, useRef, useState } from "react";
import { useConversationStore } from "@/store/chat-store";


const LeftPanel = () => {
	const { isAuthenticated, isLoading } = useConvexAuth();
	const conversation = useQuery(api.conversations.getMyConversations, isAuthenticated ? undefined : "skip");

	const { selectedConversation, setSelectedConversation } = useConversationStore();
	const chatListRef = useRef<HTMLDivElement>(null);
	const inputRef = useRef<HTMLInputElement>(null);
	const [filteredConversations, setFilteredConversations] = useState(conversation || []);

	// Fonction pour le défilement fluide
	const scrollToChatList = () => {
		chatListRef.current?.scrollIntoView({ behavior: 'smooth', block: "start" });
		setFilteredConversations(conversation||[])
		inputRef.current!.value=""
	};

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const handleInputChange = (event:any) => {
		chatListRef.current?.scrollIntoView({ behavior: 'smooth', block: "start" });
		const searchTerm = event.target.value.trim();

		// Filter conversations based on the search term
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const filteredConversations2 = conversation?.filter((con:any) => {
			return con.groupName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
			con.name?.toLowerCase().includes(searchTerm.toLowerCase()) 
		}
		);

		// Update the conversation state with the filtered results
		setFilteredConversations(filteredConversations2|| []);

	};

	useEffect(() => {
		const conversationIds = conversation?.map(con => con._id);
		if (selectedConversation && conversationIds && !conversationIds.includes(selectedConversation._id)) {
			setSelectedConversation(null);
		}
	}, [conversation, selectedConversation, setSelectedConversation]);

	if (isLoading) return null;

	return (
		<div ref={chatListRef} className='w-full md:w-1/3 lg:w-1/4 border-gray-600 border-r'>
			<div className='sticky top-0 bg-left-panel z-10'>
				{/* Header */}
				<div className='flex justify-between bg-gray-primary p-3 items-center'>
					<UserButton />
					<div className='flex items-center gap-3'>
						{isAuthenticated && <UserListDialog />}
						<ThemeSwitch />
					</div>
				</div>
				<div className='p-3 flex items-center'>
					{/* Search */}
					<div className='relative h-10 mx-3 flex-1'>
						<Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 z-10' size={18} />
						<Input
							type='text'
							ref={inputRef}
							onChange={handleInputChange}
							placeholder='Search or start a new chat'
							className='pl-10 py-2 text-sm w-full rounded shadow-sm bg-gray-primary focus-visible:ring-transparent'
						/>
					</div>
					<div onClick={scrollToChatList}>
						<ListFilter className='cursor-pointer' />
					</div>
				</div>
			</div>

			{/* Chat List */}
			<div className='my-3 flex flex-col gap-0 max-h-[80%] overflow-auto'>
				{/* Conversations will go here */}
				{conversation?.length === 0 ? (
					<>
						<p className='text-center text-gray-500 text-sm mt-3'>No conversations yet</p>
						<p className='text-center text-gray-500 text-sm mt-3'>
							We understand {"you're"} an introvert, but {"you've"} got to start somewhere 😊
						</p>
					</>
				) : (
					filteredConversations?.map(c => (
						<Conversation conversation={c} key={c._id} />
					))
				)}
			</div>
		</div>
	);
};

export default LeftPanel;
