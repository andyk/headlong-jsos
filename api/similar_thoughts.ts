import { getPineconeIndex } from '../src/lib/getPineconeIndex';

import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function similar_thoughts(
    request: VercelRequest,
    response: VercelResponse
) {
    const pineconeIndex = await getPineconeIndex(request);
    const thoughts = await pineconeIndex.query({
        queryRequest: {
            vector: request.body.embedding,
            topK: request.body.topK || 5,
            namespace: request.body.agent_uuid,
        },
    });
    response.status(200).json(thoughts);
}
