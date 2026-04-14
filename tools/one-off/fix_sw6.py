with open('sw.js', 'r', encoding='utf-8') as f:
    text = f.read()

text = text.replace("v5", "v6")

with open('sw.js', 'w', encoding='utf-8') as f:
    f.write(text)

print('sw.js updated to v6')
