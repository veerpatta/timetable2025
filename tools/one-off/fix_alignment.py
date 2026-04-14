import re

with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# 1. Fix commas within parentheses in rawData
# We find all ( ... , ... ) and replace commas with spaces
# rawData starts around line 1681 `const rawData = `Monday`
# We can just apply the regex over the whole file, but safer to apply on rawData section only:
start_idx = html.find('const rawData = `Monday')
end_idx = html.find('`;', start_idx)

if start_idx != -1 and end_idx != -1:
    raw_data_sec = html[start_idx:end_idx]
    
    # Regex to remove commas inside parentheses
    def replacer(match):
        return match.group(0).replace(',', '')

    fixed_raw_data = re.sub(r'\([^)]+\)', replacer, raw_data_sec)
    html = html[:start_idx] + fixed_raw_data + html[end_idx:]


# 2. Fix applyWinterPeriodTimings to include 9 periods (Assembly + Period 1-8)
# From index.html line 2034:
old_winter_headers = """			const winterHeaders = [
				{ name: 'Period 1', time: '9:00 AM - 9:40 AM' },
				{ name: 'Period 2', time: '9:40 AM - 10:20 AM' },
				{ name: 'Period 3', time: '10:20 AM - 11:00 AM' },
				{ name: 'Period 4', time: '11:00 AM - 11:40 AM' },
				{ name: 'Period 5', time: '12:00 PM - 12:40 PM' }, // Recess 11:40-12:00
				{ name: 'Period 6', time: '12:40 PM - 1:20 PM' },
				{ name: 'Period 7', time: '1:20 PM - 1:55 PM' },
				{ name: 'Period 8', time: '1:55 PM - 2:35 PM' }
			];"""

new_winter_headers = """			const winterHeaders = [
				{ name: 'Assembly', time: '8:00 AM - 8:30 AM' },
				{ name: 'Period 1', time: '8:30 AM - 9:10 AM' },
				{ name: 'Period 2', time: '9:10 AM - 9:50 AM' },
				{ name: 'Period 3', time: '9:50 AM - 10:30 AM' },
				{ name: 'Period 4', time: '10:30 AM - 11:10 AM' },
				{ name: 'Period 5', time: '11:30 AM - 12:10 PM' }, // Recess 11:10-11:30
				{ name: 'Period 6', time: '12:10 PM - 12:50 PM' },
				{ name: 'Period 7', time: '12:50 PM - 01:30 PM' },
				{ name: 'Period 8', time: '01:30 PM - 02:10 PM' }
			];"""

html = html.replace(old_winter_headers, new_winter_headers)


with open('index.html', 'w', encoding='utf-8') as f:
    f.write(html)

print("Alignment fixed!")
