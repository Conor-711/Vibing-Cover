const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const port = process.env.PORT || 3001;

// Parse form data
app.use(express.urlencoded({ extended: true }));

// Serve static files from public directory
app.use(express.static('public'));

// Redirect root route to static homepage
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

// Handle email submission
app.post('/submit', (req, res) => {
  const email = req.body.email;
  console.log(`Received email: ${email}`);
  
  // Save email to file
  const emailsFilePath = path.join(__dirname, 'emails.txt');
  fs.appendFile(emailsFilePath, email + '\n', (err) => {
    if (err) {
      console.error('Error saving email:', err);
    } else {
      console.log('Email saved successfully');
    }
  });
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Slow Down, You're Doing Fine</title>
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <link href="https://fonts.googleapis.com/css2?family=Caveat:wght@500;600;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.0/font/bootstrap-icons.css">
  <link rel="stylesheet" href="/style.css">
</head>
<body class="d-flex justify-content-center align-items-center vh-100">
  <div class="container">
    <div class="row justify-content-center">
      <div class="col-md-8 col-lg-6 col-xl-5">
        <div class="card p-4 p-md-5">
          <div class="quote-container mb-4">
            <img src="/images/slow-down.svg" class="slow-down-image" alt="Slow Down, You're Doing Fine" width="280">
          </div>
          
          <div class="text-center mb-4">
            <p class="tagline">WELCOME TO THE COMMUNITY</p>
            <h1 class="card-title">YOU'RE IN!</h1>
          </div>
          
          <div class="alert bg-transparent border-2" style="border-color: #2E5A35; color: #2E5A35;">
            <div class="d-flex align-items-center p-2">
              <i class="bi bi-check-circle-fill me-3 fs-4"></i>
              <div>
                <p class="mb-0">We've added your email: <strong>${email}</strong></p>
              </div>
            </div>
          </div>
          
          <a href="/" class="btn btn-primary mt-3">
            <i class="bi bi-arrow-left me-2"></i> BACK HOME
          </a>
          
          <div class="mt-4 text-center handwritten">
            <p>Take it easy. Good things are coming your way.</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</body>
</html>`);
});

// Start the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
