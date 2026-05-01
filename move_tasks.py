import json

with open('tasks.json', 'r') as f:
    data = json.load(f)

# Find tasks 7 and 8 in IN PROGRESS and move to DONE
in_progress = data.get('IN PROGRESS', [])
done = data.get('DONE', [])

tasks_to_move = [t for t in in_progress if t['id'] in ['7', '8']]

# Remove from IN PROGRESS
data['IN PROGRESS'] = [t for t in in_progress if t['id'] not in ['7', '8']]

# Add to DONE
for t in tasks_to_move:
    t['status'] = 'done'
    done.append(t)

data['DONE'] = done

with open('tasks.json', 'w') as f:
    json.dump(data, f, indent=2)

print(f"Moved {len(tasks_to_move)} tasks to DONE")