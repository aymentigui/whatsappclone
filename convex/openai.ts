import OpenAI from "openai";
import { action } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

const apiKey = process.env.OPENAI_API_KEY;
const openai = new OpenAI({ apiKey });

export const chat = action({
	args: {
		messageBody: v.string(),
		conversation: v.id("conversations"),
	},
	handler: async (ctx, args) => {
		try {
			const res = await openai.chat.completions.create({
				model: "gpt-3.5-turbo", // ou "gpt-4" selon besoin
				messages: [
					{
						role: "system",
						content: "You are a terse bot in a group chat responding to questions with max 3-sentence answers",
					},
					{
						role: "user",
						content: args.messageBody,
					},
				],
			});

			const messageContent = res.choices[0]?.message?.content ?? "I'm sorry, I don't have a response for that";

			await ctx.runMutation(api.messages.sendChatGPTMessage, {
				content: messageContent,
				conversation: args.conversation,
				messageType: "text",
			});
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		} catch (error: any) {
			let errorMessage = "An error occurred while processing your request. May be the quota for ChatGPT has been reached";
			
			// Vérification si l'erreur est liée au quota (statut 429)
			if (error.response?.status === 429) {
				errorMessage = "Sorry, the quota for ChatGPT has been reached. Please try again later.";
			}

			// Envoyer le message d'erreur
			await ctx.runMutation(api.messages.sendChatGPTMessage, {
				content: errorMessage,
				conversation: args.conversation,
				messageType: "text",
			});
		}
	},
});

export const dall_e = action({
	args: {
		conversation: v.id("conversations"),
		messageBody: v.string(),
	},
	handler: async (ctx, args) => {
		try {
			const res = await openai.images.generate({
				model: "dall-e-3",
				prompt: args.messageBody,
				n: 1,
				size: "1024x1024",
			});

			// Vérification que l'URL de l'image existe bien
			const imageUrl = res.data[0]?.url ?? "/poopenai.png";

			// Envoi du message contenant l'image
			await ctx.runMutation(api.messages.sendChatGPTMessage, {
				content: imageUrl,
				conversation: args.conversation,
				messageType: "image",
			});
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		} catch (error: any) {
			let errorMessage = "An error occurred while generating the image. May be the quota for ChatGPT has been reached";

			// Vérifier si l'erreur est liée à un dépassement de quota (statut 429)
			if (error.response?.status === 429) {
				errorMessage = "Sorry, the quota for DALL·E has been reached. Please try again later.";
			} else if (error.response?.status) {
				// Capture d'autres erreurs HTTP
				errorMessage = `DALL·E API returned an error: ${error.response.status}`;
			}

			// Envoi du message d'erreur
			await ctx.runMutation(api.messages.sendChatGPTMessage, {
				content: errorMessage,
				conversation: args.conversation,
				messageType: "text",
			});
		}
	},
});


// 1 token ~= 4 chars in English
// 1 token ~= ¾ words
// 100 tokens ~= 75 words
// Or
// 1-2 sentence ~= 30 tokens
// 1 paragraph ~= 100 tokens
// 1,500 words ~= 2048 tokens

// 1 image will cost $0,04(4 cents) => dall-e-3
// 1 image will cost $0,02(2 cents) => dall-e-2