import { getUser } from "../src/lib/getUser";

import type { VercelRequest, VercelResponse } from "@vercel/node";

export default function get_embedding(
    request: VercelRequest,
    response: VercelResponse
) {
    getUser(request)
        .then(() => {
            return fetch("https://api.openai.com/v1/embeddings", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
                },
                body: JSON.stringify({
                    model: "text-embedding-ada-002",
                    input: request.body.text,
                }),
            });
        })
        .then((embed_response) => embed_response.json())
        .then((embedding) => embedding.data[0].embedding)
        .then((embedding) => {
            response.status(200).json({embedding});
        })
        .catch((err) => {
            response.status(401).json({ error: err.message });
        });
}
