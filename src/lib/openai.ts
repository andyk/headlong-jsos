
import OpenAI from "openai";
const openAiApiKey = import.meta.env.OPENAI_API_KEY;
console.log("openAiApiKey: ", openAiApiKey);
const openai = new OpenAI({
    organization: "org-xkUPwPnGtvhd3NwlPfc9yllF",
    apiKey: openAiApiKey,
    dangerouslyAllowBrowser: true
});

export default openai