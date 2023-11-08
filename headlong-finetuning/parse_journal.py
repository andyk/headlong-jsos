from collections import defaultdict
import json
import openai
import os

# Define the input and output file paths
input_file_path = 'simple_journal.txt'
output_file_path = 'parsed_file.json'

def parse(lines):
    # Initialize variables to store parsed data
    parsed_data = []
    current_messages = []

    # Loop through each line in the file
    for line in lines:
        # Strip leading and trailing whitespace
        line = line.strip()
        
        # Check if the line is not empty
        if line:
            # Add the line as an assistant message to the current message list
            current_messages.append({"role": "assistant", "content": line})
        else:
            # If the line is empty, it means the end of the current set of messages
            if current_messages:
                # Add a system message at the beginning of each message set
                system_message = {"role": "system", "content": "a person with a stream of thoughts"}
                current_messages.insert(0, system_message)
                
                # Add the current set of messages to the parsed data
                parsed_data.append({"messages": current_messages})
                print(f"{len(parsed_data)} - parsed {len(current_messages)} more thoughts")
                
                # Reset the current message list for the next set
                current_messages = []

    # Check if there are any remaining messages after the last empty line
    if current_messages:
        system_message = {"role": "system", "content": "a person with a stream of your thoughts"}
        current_messages.insert(0, system_message)
        parsed_data.append({"messages": current_messages})
        print(f"{len(parsed_data)} - parsed {len(current_messages)} more thoughts")

    return parsed_data


# from https://cookbook.openai.com/examples/chat_finetuning_data_prep
def check_for_errors(dataset):
    # Format error checks
    format_errors = defaultdict(int)

    for ex in dataset:
        if not isinstance(ex, dict):
            format_errors["data_type"] += 1
            continue
            
        messages = ex.get("messages", None)
        if not messages:
            format_errors["missing_messages_list"] += 1
            continue
            
        for message in messages:
            if "role" not in message or "content" not in message:
                format_errors["message_missing_key"] += 1
            
            if any(k not in ("role", "content", "name", "function_call") for k in message):
                format_errors["message_unrecognized_key"] += 1
            
            if message.get("role", None) not in ("system", "user", "assistant", "function"):
                format_errors["unrecognized_role"] += 1
                
            content = message.get("content", None)
            function_call = message.get("function_call", None)
            
            if (not content and not function_call) or not isinstance(content, str):
                format_errors["missing_content"] += 1
        
        if not any(message.get("role", None) == "assistant" for message in messages):
            format_errors["example_missing_assistant_message"] += 1

    if format_errors:
        print("Found errors:")
        for k, v in format_errors.items():
            print(f"{k}: {v}")
    else:
        print("No errors found")

def parse_journal():
    # Open the input file and process its content
    with open(input_file_path, 'r') as f:
        lines = f.readlines()

    parsed_data = parse(lines)
    check_for_errors(parsed_data)

    # Write the parsed data to the output file
    with open(output_file_path, 'w') as f:
        for entry in parsed_data:
            f.write(json.dumps(entry) + '\n')

    print(f"Parsing complete! Output written to {output_file_path}")
    return True

if __name__ == "__main__":
    parse_journal()
