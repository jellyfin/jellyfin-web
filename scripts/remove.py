import sys
import os
import json

# load text file containing unused keys
# remove the keys from all string files

cwd = os.getcwd()
langdir = cwd + '/../src/strings'
langlst = os.listdir(langdir)

keys = []

with open('unused.txt', 'r') as f:
    for line in f:
        keys.append(line.strip('\n'))

for lang in langlst:
    with open(langdir + '/' + lang, 'r') as f:
        inde = 2
        if '\n    \"' in f.read():
            inde = 4
        f.close()
    with open(langdir + '/' + lang, 'r+') as f:
        langjson = json.load(f)
        for key in keys:
            langjson.pop(key, None)
        f.seek(0)
        f.write(json.dumps(langjson, indent=inde, sort_keys=False, ensure_ascii=False))
        f.write('\n')
        f.truncate()
        f.close()

print('DONE')
