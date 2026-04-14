with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

html = html.replace('periodHeaders.length !== 8', 'periodHeaders.length !== 9')
html = html.replace('const busy = Array(8).fill', 'const busy = Array(9).fill')
html = html.replace('Math.min(8, periods.length)', 'Math.min(9, periods.length)')

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(html)
print("Updated 8 to 9 where applicable")
