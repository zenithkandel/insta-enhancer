const fs = require('fs');
const html = fs.readFileSync('C:/xampp/htdocs/codes/insta-enhancer/insta-reference/wwwinstagramcom-direct-inbox.html', 'utf-8');
const match = html.match(/<div[^>]*id="mount[^>]*>(.*?)<\/div>/s);
if (match) {
  console.log('Mount found, inner text length:', match[1].length);
  console.log('Sample content inside mount:', match[1].substring(0, 1000));
} else {
  console.log('No mount found or empty');
}
