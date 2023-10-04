import { getPineconeIndex } from '../src/lib/getPineconeIndex';

import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function pinecone_upsert(
    request: VercelRequest,
    response: VercelResponse
) {
    getPineconeIndex(request)
        .then((index) => {
            return index.upsert({
                upsertRequest: {
                    vectors: [
                        {
                            id: request.body.thought_uuid,
                            values: request.body.embedding,
                        },
                    ],
                    namespace: request.body.agent_uuid,
                },
            });
        })
        .then((res) => {
            response.status(200).json(res);
        })
        .catch((err) => {
            response.status(401).json({ error: err.message });
        });
}
