"use client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Video, X } from "lucide-react";
import MessageInput from "./message-input";
import MessageContainer from "./message-container";
import ChatPlaceHolder from "@/components/home/chat-placeholder";
import GroupMembersDialog from "./groupe-membres-dialog";
import { useConversationStore } from "@/store/chat-store";
import { useConvexAuth } from "convex/react";

const RightPanel = () => {
    const { isLoading } = useConvexAuth();
    const { selectedConversation, setSelectedConversation } = useConversationStore();

    if (!selectedConversation) {
		return (
		  <>
			{/* Affiche uniquement sur les grands écrans */}
			<div className="hidden md:block w-full">
			  <ChatPlaceHolder />
			</div>
		  </>
		);
	  }

    const conversationName = selectedConversation.groupName || selectedConversation.name;
    const conversationImage = selectedConversation.groupImage || selectedConversation.image;

    if (isLoading) return null;

    return (
        <div className='w-full md:w-2/3 lg:w-3/4 flex flex-col'>
            <div className='w-full sticky top-0 z-50'>
                {/* Header */}
                <div className='flex justify-between bg-gray-primary p-3'>
                    <div className='flex gap-3 items-center'>
                        <Avatar>
                            <AvatarImage src={conversationImage} className='object-cover' />
                            <AvatarFallback>
                                <div className='animate-pulse bg-gray-tertiary w-full h-full rounded-full' />
                            </AvatarFallback>
                        </Avatar>
                        <div className='flex flex-col'>
                            <p>{conversationName}</p>
                            {selectedConversation.isGroup && <GroupMembersDialog selectedConversation={selectedConversation} />}
                        </div>
                    </div>

                    <div className='flex items-center gap-7 mr-5'>
                        <a href='/video-call' target='_blank'>
                            <Video size={23} />
                        </a>
                        <X size={16} className='cursor-pointer' onClick={() => setSelectedConversation(null)} />
                    </div>
                </div>
            </div>
            {/* CHAT MESSAGES */}
            <MessageContainer />

            {/* INPUT */}
            <MessageInput />
        </div>
    );
};

export default RightPanel;
