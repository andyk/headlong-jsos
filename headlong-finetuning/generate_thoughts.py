import json
import openai
from parse_journal import parse_journal

most_recent_model = "ft:gpt-3.5-turbo-0613:andy-konwinski::8DFkFoR2"
parsed_file_path = 'parsed_file.json'
files_put_to_openia = 'files_put_to_openai.jsonl'

parse_journal()

last_line = ""
with open(parsed_file_path, "r") as file:
    lines = file.readlines()
    last_line = lines[-1] if lines else None
    print(last_line)

if not last_line:
    exit(f"file did not have any lines: {parsed_file_path}")

last_line_parsed = list(json.loads(last_line)["messages"])
last_line_parsed.append({"role": "assistant", "content": "what is my next observation or thing i want to do, and if it is a thing i want to do, why?"})

print(f"found last line {last_line_parsed}")

completion = openai.ChatCompletion.create(model=most_recent_model, messages=last_line_parsed)

print(completion)

TODO check user feedback - if yes then append to jouranl file
 # Write the parsed data to the output file
    with open(output_file_path, 'w') as f:
        for entry in parsed_data:
            f.write(json.dumps(entry) + '\n')

