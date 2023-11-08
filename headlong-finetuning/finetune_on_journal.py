from collections import defaultdict
import json
import openai
import os

# Define the input and output file paths
parsed_file_path = 'parsed_file.json'
files_put_to_openia = 'files_put_to_openai.jsonl'
open_ai_model_to_finetune = "gpt-3.5-turbo"

#TODO: only create a new openAI file if parsed_file_path has not been uploaded & fine tuned on before
#      easiest way to do that is to write a hash of it to the FS and check for it before creating below.

openai.api_key = os.getenv("OPENAI_API_KEY")
put_file_meta = openai.File.create(
  file=open(parsed_file_path, "rb"),
  purpose='fine-tune'
)

print("file uploaded to openAI with id: ", put_file_meta["id"])
with open(files_put_to_openia, 'a') as f:
    f.write(json.dumps(put_file_meta) + '\n')

print(f"openai file details appended to {files_put_to_openia}")

training_job = openai.FineTuningJob.create(training_file=put_file_meta["id"], model=open_ai_model_to_finetune)

print(f"kicked off openai training job: {training_job}")
