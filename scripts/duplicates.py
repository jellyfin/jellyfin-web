import sys
import os
import json

# load every string in the source language
# print all duplicate values to a file

cwd = os.getcwd()
source = cwd + '/../src/strings/en-us.json'

reverse = {}
duplicates = {}

with open(source) as en:
    strings = json.load(en)
    for key, value in strings.items():
        if value not in reverse:
            reverse[value] = [key]
        else:
            reverse[value].append(key)

for key, value in reverse.items():
    if len(value) > 1:
        duplicates[key] = value

print('LENGTH: ' + str(len(duplicates)))
with open('duplicates.txt', 'w') as out:
    for item in duplicates:
      out.write(json.dumps(item) + ': ')
      out.write(json.dumps(duplicates[item]) + '\n')
    out.close()

print('DONE')
