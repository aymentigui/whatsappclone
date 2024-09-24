"use client"

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { ImageIcon, MessageSquareDiff } from "lucide-react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import toast from "react-hot-toast";
import { useConversationStore } from "@/store/chat-store";


const UserListDialog = () => {
    const [selectedUsers, setSelectedUsers] = useState<Id<"users">[]>([]);
    const [groupName, setGroupName] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [selectedImage, setSelectedImage] = useState<File | null>(null);
    const [renderedImage, setRenderedImage] = useState("");
    const imgRef = useRef<HTMLInputElement>(null);
    const dialogCloseRef=useRef<HTMLButtonElement>(null);
    const {setSelectedConversation}=useConversationStore()

    const createConversation=useMutation(api.conversations.createConversation)
    const generateUploadUrl=useMutation(api.conversations.generateUploadUrl)
    const me=useQuery(api.users.getMe)
    const users=useQuery(api.users.getUsers)

    useEffect(() => {
        if (!selectedImage) return setRenderedImage("")
        const reader = new FileReader()
        reader.onload = (e) => setRenderedImage(e.target?.result as string)
        reader.readAsDataURL(selectedImage)
    }, [selectedImage])

    const handlerCreateConversation = async () => {
        if (selectedUsers.length === 0) return
        setIsLoading(true)
        try {
            let conversation_id;

            if(selectedUsers.length>1){
                const postUrl=await generateUploadUrl()
                const result = await fetch(postUrl,{
                    method:"POST",
                    headers:{"Content-type":selectedImage!.type!},
                    body:selectedImage,
                })

                const {storageId}=await result.json()
                conversation_id= await createConversation({
                    participants:[...selectedUsers,me!._id!],
                    isGroup:true,
                    groupImage:storageId,
                    admin:me?._id,
                    groupName:groupName
                }) 
            }else{
                conversation_id= await createConversation({
                    participants:[...selectedUsers,me!._id!],
                    isGroup:false,
                })
                console.log(conversation_id)
            }
            setSelectedUsers([])
            setGroupName("")
            dialogCloseRef.current?.click()
            setSelectedImage(null)
            setRenderedImage("")

            const conversationName=selectedUsers.length>1 ? groupName :users?.find((user)=>user._id==selectedUsers[0])?.name
            setSelectedConversation({
                _id:conversation_id,
                isGroup:selectedUsers.length>1 ,
                participants:selectedUsers,
                image:selectedUsers.length>1 ?renderedImage : users?.find((user)=>user._id==selectedUsers[0])?.image,
                name:conversationName,
                admin:me?._id,
            })

        } catch (error) {
            console.log(error)
            toast.error("Failde create conversation")
        }finally{
            setIsLoading(false)
        }
    }

    return (
        <Dialog>
            <DialogTrigger>
                <MessageSquareDiff size={20} />
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogClose ref={dialogCloseRef} /> 
                    <DialogTitle>USERS</DialogTitle>
                </DialogHeader>

                <DialogDescription>Start a new chat</DialogDescription>
                {renderedImage && (
                    <div className='w-16 h-16 relative mx-auto'>
                        <Image src={renderedImage} fill alt='user image' className='rounded-full object-cover' />
                    </div>
                )}
                <input type="file" accept="image/*" ref={imgRef} onChange={(e) => setSelectedImage(e.target.files![0])} hidden />
                {selectedUsers.length > 1 && (
                    <>
                        <Input
                            placeholder='Group Name'
                            value={groupName}
                            onChange={(e) => setGroupName(e.target.value)}
                        />
                        <Button className='flex gap-2' onClick={() => imgRef.current?.click()}>
                            <ImageIcon size={20} />
                            Group Image
                        </Button>
                    </>
                )}
                <div className='flex flex-col gap-3 overflow-auto max-h-60'>
                    {users?.map((user) => (
                        <div
                            key={user._id}
                            className={`flex gap-3 items-center p-2 rounded cursor-pointer active:scale-95 
								transition-all ease-in-out duration-300
							${selectedUsers.includes(user._id) ? "bg-green-primary" : ""}`}
                            onClick={() => {
                                if (selectedUsers.includes(user._id)) {
                                    setSelectedUsers(selectedUsers.filter((id) => id !== user._id));
                                } else {
                                    setSelectedUsers([...selectedUsers, user._id]);
                                }
                            }}
                        >
                            <Avatar className='overflow-visible'>
                                {user.isOnline && (
                                    <div className='absolute top-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-foreground' />
                                )}

                                <AvatarImage src={user.image} className='rounded-full object-cover' />
                                <AvatarFallback>
                                    <div className='animate-pulse bg-gray-tertiary w-full h-full rounded-full'></div>
                                </AvatarFallback>
                            </Avatar>

                            <div className='w-full '>
                                <div className='flex items-center justify-between'>
                                    <p className='text-md font-medium'>{user.name || user.email.split("@")[0]}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
                <div className='flex justify-between'>
                    <Button variant={"outline"}>Cancel</Button>
                    <Button
                        onClick={() => handlerCreateConversation()}
                        disabled={selectedUsers.length === 0 || (selectedUsers.length > 1 && !groupName) || isLoading}
                    >
                        {/* spinner */}
                        {isLoading ? (
                            <div className='w-5 h-5 border-t-2 border-b-2  rounded-full animate-spin' />
                        ) : (
                            "Create"
                        )}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};
export default UserListDialog;