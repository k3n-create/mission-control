import json

with open('tasks.json', 'r') as f:
    data = json.load(f)

# Add task 13 to INBOX
data['INBOX'].append({
    "id": "13",
    "task_name": "Add settings modal",
    "assigned_agent": "JARVIS",
    "status": "todo",
    "priority": "medium",
    "tags": ["feature", "ui"]
})

# Remove from DONE
data['DONE'] = [t for t in data['DONE'] if t['id'] != '13']

with open('tasks.json', 'w') as f:
    json.dump(data, f, indent=2)

print("Done")