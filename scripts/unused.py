import os
import subprocess
import json

# load all keys in the source language
# check entire codebase for usages
# print unused keys to a text file
# TODO: dynamic string usages cause false positives

cwd = os.getcwd()
langdir = cwd + '/../src/strings'
langlst = []
langlst.append('en-us.json')

# unused keys
dep = []

def grep(key):
    pattern = r'(\"|\'|\{)' + key + r'(\"|\'|\})'
    command = ['grep', '-r', '-E', pattern,
               '--include=*.js', '--include=*.html',
               '--exclude-dir=../src/strings', '../src']
    p = subprocess.Popen(command, shell=False, stdout=subprocess.PIPE, stderr=subprocess.STDOUT)
    output = p.stdout.readlines()
    if output:
        print('DONE: ' + key)
        return True
    print('UNUSED: ' + key)
    dep.append(key)
    return False

for lang in langlst:
    with open(langdir + '/' + lang) as f:
        langjson = json.load(f)
        for key in langjson:
            grep(key)

print(dep)
print('LENGTH: ' + str(len(dep)))
with open('unused.txt', 'w') as out:
    for item in dep:
        out.write(item + '\n')
    out.close()
