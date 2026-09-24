const fs = require('fs');
let f = fs.readFileSync('app/live/page.tsx', 'utf8');

// The exact string to remove (with potential whitespace differences)
const hookStr = `  const [slideIndex, setSlideIndex] = useState(0);
  
  useEffect(() => {
    if (presentationState?.view_mode === 'slideshow') {
      const timer = setInterval(() => {
        setSlideIndex(prev => (prev + 1) % 3);
      }, 15000); // 15 seconds per slide
      return () => clearInterval(timer);
    }
  }, [presentationState]);`;

f = f.replace(hookStr, '');

// If the exact match fails, use regex
f = f.replace(/const \[slideIndex, setSlideIndex\] = useState\(0\);[\s\S]*?\}, \[presentationState\]\);/, '');

const newHookStr = `const [error, setError] = useState('');
  const [slideIndex, setSlideIndex] = useState(0);
  
  useEffect(() => {
    if (presentationState?.view_mode === 'slideshow') {
      const timer = setInterval(() => {
        setSlideIndex(prev => (prev + 1) % 3);
      }, 15000);
      return () => clearInterval(timer);
    }
  }, [presentationState]);`;

f = f.replace("const [error, setError] = useState('');", newHookStr);

fs.writeFileSync('app/live/page.tsx', f);
