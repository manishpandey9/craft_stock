import re

with open('src/app/settings/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Add autoComplete='off' to TextFields
content = re.sub(r'(<TextField[^>]*?)(/?>)', lambda m: m.group(1) + ' autoComplete="off" ' + m.group(2) if 'autoComplete=' not in m.group(1) else m.group(0), content)

# Add as='p' to Text if it doesnt have an as prop
content = re.sub(r'(<Text )(?!as=)([^>]*?variant="heading(?:Md|Sm|Lg)")', r'\1as="h2" \2', content)
content = re.sub(r'(<Text )(?!as=)([^>]*?variant="body(?:Md|Sm|Lg)")', r'\1as="p" \2', content)

with open('src/app/settings/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print('Fixed settings/page.tsx')
