import os  
import re  
for root, dirs, files in os.walk('app'):  
  for f in files:  
    if f.endswith('.tsx'):  
      with open(os.path.join(root, f), 'r', encoding='utf-8') as file:  
        content = file.read()  
        if 'text-slate-800' in content and 'dark:text' not in content:  
          print('Missing dark:text in:', os.path.join(root, f))  
