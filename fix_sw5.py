with open('sw.js', 'r', encoding='utf-8') as f:
    text = f.read()

text = text.replace("const CACHE_NAME = 'vpps-timetable-v4';", "const CACHE_NAME = 'vpps-timetable-v5';")
text = text.replace("const STATIC_CACHE_NAME = 'vpps-static-v4';", "const STATIC_CACHE_NAME = 'vpps-static-v5';")

with open('sw.js', 'w', encoding='utf-8') as f:
    f.write(text)

print('sw.js updated to v5')
