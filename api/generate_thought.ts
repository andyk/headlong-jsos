import { getUser } from "../src/lib/getUser";

import type { VercelRequest, VercelResponse } from "@vercel/node";

export default function generate_thought(
    request: VercelRequest,
    response: VercelResponse
) {
    getUser(request)
        .then((user) => {
            return fetch("https://api.openai.com/v1/completions", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
                },
                body: JSON.stringify({
                    model: "text-davinci-003",
                    prompt: request.body.promptText,
                    max_tokens: 100,
                    temperature: 0.5,
                    top_p: 1,
                    n: 1,
                    stream: false,
                    logprobs: null,
                    stop: "\n\n\n",
                }),
            });
        })
        .then((response) => response.json())
        .then((data) => data.choices[0].text.trim())
        .then((res) => response.status(200).json({ completion: res }))
        .catch((err) => {
            console.log("error: ", err);
            response.status(401).json({ error: err.message });
        });
}
