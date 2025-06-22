// Fetch and inject the footer
fetch('https://kay-who-codes.github.io/Kay-App-Assets/Footer.html') 
  .then(response => {
    if (!response.ok) {
      throw new Error('Failed to load footer');
    }
    return response.text();
  })
  .then(data => {
    document.getElementById('footer').innerHTML = data;
  })
  .catch(error => {
    console.error('Error loading footer:', error);
    document.getElementById('footer').innerHTML = '<p>Footer failed to load.</p>';
  });