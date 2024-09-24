import { Dialog, DialogClose, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useState, useEffect, useRef } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import toast from "react-hot-toast";
import { useTimer } from "../../lib/useTimer";
import { useConversationStore } from "@/store/chat-store";
import { Mic } from "lucide-react";

const MicDialog = () => {
    const [isRecording, setIsRecording] = useState(false);
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
    const [mediaRecorderRef, setMediaRecorderRef] = useState<MediaRecorder | null>(null); // Reference to media recorder
    const sendVocale = useMutation(api.messages.sendVocale);
    const me = useQuery(api.users.getMe);
    const { selectedConversation } = useConversationStore();
    const dialogCloseRef = useRef<HTMLButtonElement>(null);
    const [isLoading, setIsLoading] = useState(false)

    const generateUploadUrl = useMutation(api.conversations.generateUploadUrl);

    const timer = useTimer(0); // Timer ticking every second

    useEffect(() => {
        if (isRecording) {
            timer.start();
        } else {
            timer.stop();
            timer.reset();
        }
    }, [isRecording]);

    // Function to handle start recording
    const startRecording = async () => {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            toast.error("Recording not supported");
            return;
        }
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        setMediaRecorderRef(mediaRecorder); // Set the media recorder reference
        const chunks: Blob[] = [];

        mediaRecorder.ondataavailable = (event) => {
            chunks.push(event.data);
        };

        mediaRecorder.onstop = async () => {
            try {
                const audioBlob = new Blob(chunks, { type: "audio/ogg; codecs=opus" });
                setAudioBlob(audioBlob);
                if (!audioBlob) throw new Error("No audio recorded");

                // Step 1: Get a short-lived upload URL
                const postUrl = await generateUploadUrl();

                // Step 2: POST the file to the URL
                const result = await fetch(postUrl, {
                    method: "POST",
                    headers: { "Content-Type": "audio/ogg" },
                    body: audioBlob,
                });

                const { storageId } = await result.json();

                // Step 3: Save the newly allocated storage id to the database
                await sendVocale({
                    conversation: selectedConversation!._id,
                    audioId: storageId,
                    sender: me!._id,
                });

                toast.success("Audio sent!");

                // eslint-disable-next-line @typescript-eslint/no-unused-vars
            } catch (err) {
                toast.error("Failed to send audio");
                console.log(err)
            } finally {
                setIsRecording(false);
                setAudioBlob(null);
                setIsLoading(false)
                dialogCloseRef.current?.click();
            }
        };

        mediaRecorder.start();
        setIsRecording(true);

        // Optional: Automatically stop recording after 60 seconds
        setTimeout(() => {
            if (mediaRecorder.state !== "inactive") {
                mediaRecorder.stop();
                setIsRecording(false);
            }
        }, 60000); // Limit to 1 minute
    };

    // Function to handle cancel
    const cancelRecording = () => {
        if (mediaRecorderRef && mediaRecorderRef.state !== "inactive") {
            mediaRecorderRef.onstop = null;
            mediaRecorderRef.stop();
        }
        setIsRecording(false);
        setAudioBlob(null);
        dialogCloseRef.current?.click();
    };

    // Function to handle send
    const handleSendAudio = async () => {
        setIsLoading(true)
        try {
            if (mediaRecorderRef && mediaRecorderRef.state !== "inactive") {
                // Stop recording when the user clicks "Send"
                mediaRecorderRef.stop();
            }
        } catch (err) {
            toast.error("Failed to send audio");
            console.log(err)
        } finally {
            setIsRecording(false);
            setAudioBlob(null);
            setIsLoading(false)
            dialogCloseRef.current?.click();
        }
    };

    return (
        <Dialog>
            <DialogTrigger>
                <Mic />
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Record Audio</DialogTitle>
                    <DialogClose ref={dialogCloseRef} />
                </DialogHeader>

                <div className="flex flex-col items-center justify-center space-y-4">
                    <div>
                        {isRecording ? (
                            <p className="text-lg font-semibold">{`Recording... ${timer.time}s`}</p>
                        ) : (
                            <p className="text-lg font-semibold">Not Recording</p>
                        )}
                    </div>

                    <Button onClick={startRecording} disabled={isRecording}>
                        Start Recording
                    </Button>
                    <div className="flex gap-4">
                        <Button onClick={handleSendAudio} disabled={(!audioBlob && !isRecording) || isLoading}>
                            {isLoading ? "Sending" : "Send Audio"}
                        </Button>
                        <Button variant="destructive" onClick={cancelRecording}>
                            Cancel
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default MicDialog;
