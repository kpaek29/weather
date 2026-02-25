const express = require('express');
const session = require('express-session');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(session({
  secret: 'chicago-weather-secret-key',
  resave: false,
  saveUninitialized: false
}));

// Auth middleware
function requireLogin(req, res, next) {
  if (req.session.loggedIn) {
    next();
  } else {
    res.redirect('/');
  }
}

// Login page
app.get('/', (req, res) => {
  if (req.session.loggedIn) {
    return res.redirect('/dashboard');
  }
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Login - Chicago Dashboard</title>
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { 
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .login-box {
          background: white;
          padding: 40px;
          border-radius: 10px;
          box-shadow: 0 15px 35px rgba(0,0,0,0.3);
          width: 100%;
          max-width: 400px;
        }
        h1 { text-align: center; margin-bottom: 30px; color: #333; }
        input {
          width: 100%;
          padding: 15px;
          margin: 10px 0;
          border: 1px solid #ddd;
          border-radius: 5px;
          font-size: 16px;
        }
        button {
          width: 100%;
          padding: 15px;
          background: #2a5298;
          color: white;
          border: none;
          border-radius: 5px;
          font-size: 16px;
          cursor: pointer;
          margin-top: 20px;
        }
        button:hover { background: #1e3c72; }
        .error { color: red; text-align: center; margin-top: 15px; }
      </style>
    </head>
    <body>
      <div class="login-box">
        <h1>🌤️ Chicago Dashboard</h1>
        <form method="POST" action="/login">
          <input type="text" name="username" placeholder="Login" required>
          <input type="password" name="password" placeholder="Password" required>
          <button type="submit">Sign In</button>
        </form>
        ${req.query.error ? '<p class="error">Invalid credentials</p>' : ''}
      </div>
    </body>
    </html>
  `);
});

// Login handler
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (username === 'SO' && password === 'SO') {
    req.session.loggedIn = true;
    res.redirect('/dashboard');
  } else {
    res.redirect('/?error=1');
  }
});

// Logout
app.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/');
});

// Dashboard
app.get('/dashboard', requireLogin, async (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Chicago Dashboard</title>
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { 
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          background: #f5f5f5;
          min-height: 100vh;
        }
        .header {
          background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
          color: white;
          padding: 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .header h1 { font-size: 24px; }
        .logout { color: white; text-decoration: none; }
        .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
        @media (max-width: 768px) { .grid { grid-template-columns: 1fr; } }
        .card {
          background: white;
          border-radius: 10px;
          padding: 25px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .card h2 { margin-bottom: 20px; color: #333; border-bottom: 2px solid #2a5298; padding-bottom: 10px; }
        .weather-info { font-size: 18px; line-height: 1.8; }
        .weather-temp { font-size: 48px; font-weight: bold; color: #2a5298; }
        .news-item {
          padding: 15px 0;
          border-bottom: 1px solid #eee;
        }
        .news-item:last-child { border-bottom: none; }
        .news-item a { color: #333; text-decoration: none; font-weight: 500; }
        .news-item a:hover { color: #2a5298; }
        .news-source { color: #888; font-size: 12px; margin-top: 5px; }
        .loading { color: #888; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>🌤️ Chicago Dashboard</h1>
        <a href="/logout" class="logout">Logout</a>
      </div>
      <div class="container">
        <div class="grid">
          <div class="card">
            <h2>🌡️ Chicago Weather</h2>
            <div id="weather" class="loading">Loading weather...</div>
          </div>
          <div class="card">
            <h2>📰 Chicago News</h2>
            <div id="news" class="loading">Loading news...</div>
          </div>
        </div>
      </div>
      <script>
        // Fetch weather
        fetch('/api/weather')
          .then(r => r.json())
          .then(data => {
            document.getElementById('weather').innerHTML = data.html;
          })
          .catch(() => {
            document.getElementById('weather').innerHTML = 'Failed to load weather';
          });

        // Fetch news
        fetch('/api/news')
          .then(r => r.json())
          .then(data => {
            document.getElementById('news').innerHTML = data.html;
          })
          .catch(() => {
            document.getElementById('news').innerHTML = 'Failed to load news';
          });
      </script>
    </body>
    </html>
  `);
});

// Weather API
app.get('/api/weather', async (req, res) => {
  try {
    const response = await fetch('https://wttr.in/Chicago?format=j1');
    const data = await response.json();
    const current = data.current_condition[0];
    const html = \`
      <div class="weather-temp">\${current.temp_F}°F</div>
      <div class="weather-info">
        <p>🌡️ Feels like: \${current.FeelsLikeF}°F</p>
        <p>☁️ \${current.weatherDesc[0].value}</p>
        <p>💨 Wind: \${current.windspeedMiles} mph \${current.winddir16Point}</p>
        <p>💧 Humidity: \${current.humidity}%</p>
        <p>👁️ Visibility: \${current.visibility} miles</p>
      </div>
    \`;
    res.json({ html });
  } catch (e) {
    res.json({ html: 'Unable to fetch weather data' });
  }
});

// News API (using Google News RSS)
app.get('/api/news', async (req, res) => {
  try {
    const response = await fetch('https://news.google.com/rss/search?q=Chicago&hl=en-US&gl=US&ceid=US:en');
    const text = await response.text();
    
    // Simple XML parsing for RSS
    const items = [];
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    const titleRegex = /<title>([\s\S]*?)<\/title>/;
    const linkRegex = /<link>([\s\S]*?)<\/link>/;
    const sourceRegex = /<source[^>]*>([\s\S]*?)<\/source>/;
    
    let match;
    while ((match = itemRegex.exec(text)) !== null && items.length < 8) {
      const item = match[1];
      const title = item.match(titleRegex);
      const link = item.match(linkRegex);
      const source = item.match(sourceRegex);
      
      if (title && link) {
        items.push({
          title: title[1].replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1'),
          link: link[1],
          source: source ? source[1].replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1') : 'Google News'
        });
      }
    }
    
    const html = items.map(item => \`
      <div class="news-item">
        <a href="\${item.link}" target="_blank">\${item.title}</a>
        <div class="news-source">\${item.source}</div>
      </div>
    \`).join('');
    
    res.json({ html: html || 'No news found' });
  } catch (e) {
    res.json({ html: 'Unable to fetch news' });
  }
});

app.listen(PORT, () => {
  console.log(\`Server running on port \${PORT}\`);
});
