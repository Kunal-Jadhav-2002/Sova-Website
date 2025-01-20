// header 
function toggleMenu() {
    const menu = document.getElementById('menu');
    menu.classList.toggle('open');
  }
  
  // Close the menu when clicking outside
  document.addEventListener('click', function (event) {
    const menu = document.getElementById('menu');
    const hamburger = document.querySelector('.hamburger-menu');
    
    // Check if the click is outside the menu or the hamburger icon
    if (!menu.contains(event.target) && !hamburger.contains(event.target)) {
      menu.classList.remove('open');
    }
  });
  
  // Close the menu on clicking a link
  function closeMenu() {
    const menu = document.getElementById('menu');
    menu.classList.remove('open');
  }


  document.querySelectorAll('.menu a').forEach(anchor => {
    anchor.addEventListener('click', function (event) {
      event.preventDefault(); // Prevent the default jump behavior
      const targetId = this.getAttribute('href').substring(1); // Get the section ID
      const targetSection = document.getElementById(targetId);
  
      // Scroll with a slight offset (if there's a fixed header)
      const headerOffset = 70; // Adjust this based on your header height
      const elementPosition = targetSection.offsetTop;
      const offsetPosition = elementPosition - headerOffset;
  
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth',
      });
  
      closeMenu(); // Close the menu after clicking
    });
  });

  // hero section content load

  document.addEventListener("DOMContentLoaded", async () => {
    try {
        const response = await fetch('/api/hero-content'); // Fetch hero content from server
        
        const data = await response.json(); // Get content from the server
        
        // Populate the hero message section
        document.querySelector('.hero-message .heading').textContent = data.heading || "Default heading";
        document.querySelector('.hero-message .author').textContent = data.author || "-Author Name";
        document.querySelector('.hero-message .appeal').textContent = data.appeal || "Default appeal message";
        
        // Populate the hero description section
        document.querySelector('.hero-description .hero-heading').textContent = data.heroHeading || "Default hero heading";
        document.querySelector('.hero-description .hero-info').textContent = data.heroInfo || "Default hero info message";
        
        // Populate the image carousel with images
        const imageCarousel = document.querySelector('.image-carousel');
        data.images.forEach(image => {
            const img = document.createElement('img');
            img.src = image;
            img.alt = "Hero image";
            imageCarousel.appendChild(img);
        });

        // Set the video source
        const videoElement = document.querySelector('.video-container video');
        if (data.video) {
            videoElement.querySelector('source').src = data.video;
            videoElement.load();
            
        }
        
        // Start the image carousel after content is loaded
        initializeImageCarousel();
        
    } catch (error) {
        console.error("Error fetching hero content:", error);
    }
});

function initializeImageCarousel() {
    let index = 0;
    const images = document.querySelectorAll('.image-carousel img');
    const totalImages = images.length;

    // Initially hide all images
    images.forEach(image => {
        image.style.display = 'none';
    });

    // Function to change images
    function changeImage() {
        // Reset all images' visibility
        images.forEach(image => {
            image.style.display = 'none';
        });

        // Show the current image
        images[index].style.display = 'block';

        // Move to the next image
        index = (index + 1) % totalImages;
    }

    // Initial image display
    changeImage();

    // Change image every 3 seconds
    setInterval(changeImage, 3000);
}
  

// reward content


document.addEventListener('DOMContentLoaded', () => {
  // Fetch reward data from the server
  fetch('/api/reward-content')
    .then(response => response.json())
    .then(data => {
      const rewardsContainer = document.querySelector('.rewards-container'); // Assuming all cards go inside a container
      
      data.forEach((reward, index) => {
        // Dynamically create a card for each reward
        const rewardCard = document.createElement('div');
        rewardCard.classList.add('reward-card');

        // Use dynamic class names r1, a1, etc., based on index
        const rewardHeadingClass = `r${index + 1}`;
        const rewardAmountClass = `a${index + 1}`;

        rewardCard.innerHTML = `
          <div class="reward-image">
            <img src="${reward.mainrewardImage}" alt="${reward.heading}" loading="lazy" />
          </div>
          <div class="reward-content">
            <h2 class="${rewardHeadingClass}" style="color: rgb(220, 86, 24);">${reward.heading}</h2>
            <h3 class="${rewardAmountClass} hidden">₹${reward.price}</h3>
            <p><strong>This Package Includes:</strong></p>
            <p> ${reward.mainrewardinfo} for you and ${reward.contribution}</p>
            <button data-heading="${rewardHeadingClass}" data-amount="${rewardAmountClass}" class="donate-button">Contribute Now</button>
            <button class="view-all-button">View All</button>

            <!-- Hidden extra images -->
            <div class="extra-images-card" style="display: none;">
              ${reward.reward2img ? `<div class="image-card"><img src="${reward.reward2img}" alt="Reward 2" / loading="lazy"><p>${reward.reward2info}</p></div>` : ''}
              ${reward.reward3img ? `<div class="image-card"><img src="${reward.reward3img}" alt="Reward 3" / loading="lazy"><p>${reward.reward3info}</p></div>` : ''}
              ${reward.reward4img ? `<div class="image-card"><img src="${reward.reward4img}" alt="Reward 4" / loading="lazy"><p>${reward.reward4info}</p></div>` : ''}
            </div>
          </div>
        `;

        // Append the card to the container
        rewardsContainer.appendChild(rewardCard);
      });
    })
    .catch(error => {
      console.error('Error fetching reward data:', error);
    });
});



//  form

const formContainer = document.getElementById('formContainer');
const donorTitleDiv = document.querySelector('.donortitle');
const amountDisplay = document.getElementById('amountDisplay');
const decreaseBtn = document.getElementById('decreaseBtn');
const increaseBtn = document.getElementById('increaseBtn');
const totalAmountDisplay = document.getElementById('totalAmount');


var totalContribution = 0;

var donorTitle = "";
const baseAmount = 0;
// Event listener for all contribute buttons
document.addEventListener('click', (event) => {
    if (event.target.classList.contains('donate-button')) {
        // Get data attributes for the clicked button
        const headingClass = event.target.dataset.heading;
        const amountClass = event.target.dataset.amount;

        // Get the heading and amount dynamically
        const heading = document.querySelector(`.${headingClass}`);
        const hiddenAmountElement = document.querySelector(`.${amountClass}`);

        // Set the title dynamically
        donorTitleDiv.textContent = heading.textContent;
        

        donorTitle = donorTitleDiv.textContent


        // Get and parse the original amount
        const originalAmountText = hiddenAmountElement.textContent;
        const originalAmount = parseInt(originalAmountText.replace('₹', ''), 10);
        

        // Initialize the current amount and set it dynamically
        let currentAmount = originalAmount;
        amountDisplay.textContent = `₹${currentAmount}`;
        totalContribution = currentAmount;

        totalAmountDisplay.textContent = currentAmount;

        // Update the amount display function
        function updateAmountDisplay() {
            amountDisplay.textContent = `₹${currentAmount}`;
            decreaseBtn.disabled = currentAmount <= originalAmount;
            totalContribution = currentAmount;
            totalAmountDisplay.textContent = totalContribution;
        }

        // Event listener for the minus button
        decreaseBtn.onclick = () => {
            if (currentAmount > originalAmount) {
                currentAmount -= originalAmount;
                updateAmountDisplay();
            }
        };

        // Event listener for the plus button
        increaseBtn.onclick = () => {
            currentAmount += originalAmount;
            updateAmountDisplay();
        };

        // Show the form
        formContainer.style.display = 'block';
      
    }
});


//  view all

document.querySelector('.rewards-container').addEventListener('click', function (event) {
  if (event.target.classList.contains('view-all-button')) {
    const extraImagesCard = event.target.nextElementSibling; // The next sibling is the .extra-images-card div
    if (extraImagesCard.style.display === 'none' || extraImagesCard.style.display === '') {
      extraImagesCard.style.display = 'flex';
      event.target.textContent = 'View Less'; // Change button text
    } else {
      extraImagesCard.style.display = 'none';
      event.target.textContent = 'View All'; // Reset button text
    }
  }
});


// Close form when clicking outside the form
document.addEventListener('click', (event) => {
    if (!formContainer.contains(event.target) && !event.target.classList.contains('donate-button')) {
        formContainer.style.display = 'none';
    }
});

const closeBtn = document.getElementById('closeBtn');

// Event listener for the close button
closeBtn.addEventListener('click', () => {
    formContainer.style.display = 'none';
});

// Prevent form from closing when clicked inside the form
formContainer.addEventListener('click', (event) => {
    event.stopPropagation();
});


// submit details

const form = document.getElementById('userForm');
const submitBtn = document.getElementById('submitBtn');

// Listen for form submission
form.addEventListener('submit', async (event) => {
  event.preventDefault(); // Prevent default form submission behavior

  const name = document.getElementById('name').value;
  const phone = document.getElementById('phone').value;
  const address = document.getElementById('address').value;
  const email = document.getElementById('email').value;
  const donorTitle = document.querySelector('.donortitle').textContent;
  const totalContribution = parseInt(document.getElementById('totalAmount').textContent, 10);

  const phoneRegex = /^\d{10}$/; // Regex to ensure 10 digits only
  if (!phoneRegex.test(phone)) {
    alert("Please enter a valid 10-digit mobile number.");
    return;
  }

  try {
    // Step 1: Validate reward details
    const validationResponse = await fetch('/validate-reward', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: donorTitle, amount: totalContribution })
    });

    const validationData = await validationResponse.json();

    if (!validationResponse.ok || !validationData.valid) {
      alert(validationData.message || 'Reward validation failed.');
      return;
    }

    // Step 2: Create an order on the server
    const orderResponse = await fetch('/create-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: donorTitle, amount: totalContribution * 100, email, phone }) // Amount in paise
    });

    const { orderId, orderToken } = await orderResponse.json();

    // Step 3: Redirect to Cashfree's hosted checkout page
    const cashfreeForm = document.createElement('form');
    cashfreeForm.method = 'POST';
    cashfreeForm.action = 'https://sandbox.cashfree.com/pg/orders'; // Use the production URL in production

    const inputFields = {
      orderId,
      orderToken,
      orderAmount: totalContribution,
      customerName: name,
      customerEmail: email,
      customerPhone: phone,
      customerAddress : address,
      returnUrl: window.location.href // Replace with a valid return URL
    };

    Object.entries(inputFields).forEach(([key, value]) => {
      const input = document.createElement('input');
      input.type = 'hidden';
      input.name = key;
      input.value = value;
      cashfreeForm.appendChild(input);
    });

    document.body.appendChild(cashfreeForm);
    cashfreeForm.submit(); // Submit the form to redirect the user
  } catch (error) {
    console.error('Error processing payment:', error);
    alert('Something went wrong. Please try again.');
  }
});

// crowdfunding progress

fetch('/api/get-stats')
.then(response => response.json())
.then(data => {
    // Update the UI with the data received from the server
    document.getElementById('donations').innerText = `INR ${data.totalDonation}`;
    document.getElementById('farmers').innerText = data.totalFarmersReached;
    document.getElementById('supporters').innerText = data.totalContributions;
})
.catch(error => {
    console.error('Error fetching stats:', error);
});

// Call the function when the page loads
// window.onload = fetchCrowdfundingData;


// product features

function fetchProductFeatures() {
  fetch('/api/product-features')  // Replace with your actual API URL
      .then(response => response.json())
      .then(features => {
          const featuresLeft = document.getElementById('features-left');
          const featuresRight = document.getElementById('features-right');

          features.forEach((feature, index) => {
              const featureCard = document.createElement('section');
              featureCard.classList.add('feature');
              featureCard.id = feature.id;

              const cardContent = `
                  <div class="feature-card">
                      <div class="video-wrapper">
                          ${feature.video ? `<video autoplay loop muted >
                                              <source src="${feature.video}" type="video/mp4">
                                              Your browser does not support the video tag.
                                          </video>` 
                                          : `<img src="${feature.image}" type="image/jpeg">`}
                      </div>
                      <h3>${feature.title}</h3>
                      <p>${feature.description}</p>
                      

                  </div>
              `;

              featureCard.innerHTML = cardContent;

              if (index < 3) {
                  featuresLeft.appendChild(featureCard);
              } else {
                  featuresRight.appendChild(featureCard);
              }
          });
      })
      .catch(error => {
          console.error('Error fetching product features:', error);
      });
}

// Call the function when the page loads
// window.onload = fetchProductFeatures, loadProducts;


async function loadProducts() {
  try {
    const response = await fetch('/api/products'); // Fetch product data from the server
    const products = await response.json(); // Parse the JSON response

    const productWrapper = document.getElementById('product-wrapper');

    // Loop through products and create HTML elements for each
    products.forEach(product => {
      const productCard = document.createElement('div');
      productCard.classList.add('item-card');
      
      productCard.innerHTML = `
        <img src="${product.image}" alt="${product.name}" loading="lazy">
        <div class="card-info">
          <h3>${product.name}</h3>
          <div class="item-align">
            <p><span class="detail">Length:</span>&nbsp; ${product.length}</p>
            <p><span class="detail">Features:</span>&nbsp; ${product.features}</p>
            <p><span class="detail">Description:</span>&nbsp; ${product.description}</p>
            <p><span class="detail">Price:</span>&nbsp; ${product.price}</p>
          </div>
          <button class="gift-btn">Buy Now</button>
        </div>
      `;

      // Append each product card to the wrapper
      productWrapper.appendChild(productCard);
    });
  } catch (error) {
    console.error('Error loading products:', error);
  }
}

// Load products when the page loads

const loadVideos = () => {
  fetch('/api/getVideos')
    .then(response => response.json())
    .then(data => {
      const videos = data.videos;
      // Update video sources dynamically
      const videoElements = document.querySelectorAll('.mission-image');

      videoElements.forEach((videoElement, index) => {
        if (videos[index]) {
          // Dynamically set the video source URL
          videoElement.src = `${videos[index]}`;
        }
      });
    })
    .catch(err => console.error('Error fetching videos:', err));
};

// Load videos when the page is ready


window.addEventListener('load', fetchProductFeatures);
window.addEventListener('load', loadProducts);
window.addEventListener('load', loadVideos);




// donor reviews

let donors = []; // Array to store all donors
    let currentIdx = 0; // Track the starting index for showing donors

    // Function to load all donors and display the latest three
    async function loadDonorReviews() {
      try {
        const response = await fetch('/api/donors'); // Fetch data from the server
        donors = await response.json(); // Parse the JSON response

        displayDonors(); // Show the initial set of donors
      } catch (error) {
        console.error('Error loading donor reviews:', error);
      }
    }

    // Function to display three donors at a time
    function displayDonors() {
      const donorReviewsContainer = document.getElementById('donor-reviews-container');
      donorReviewsContainer.innerHTML = ''; // Clear existing reviews

      // Display three donors starting from the current index
      for (let i = currentIdx; i < currentIdx + 3 && i < donors.length; i++) {
        const donor = donors[i];
        const donorReview = `
          <div class="donor-review">
            <div class="donor-photo">
              <img src="assets/images/default-donor.jpg" alt="${donor.name}" loading="lazy">
              <span class="donation-pin gold-pin"></span>
            </div>
            <div class="donor-details">
              <h3 class="donor-name">${donor.name}</h3>
              <p class="donation-amount">Donated: ₹${donor.totalContribution}</p>
              <p class="donor-review-text">${donor.donorTitle || 'Contributor'}</p>
            </div>
          </div>
        `;
        donorReviewsContainer.innerHTML += donorReview;
      }

      // Enable/disable navigation buttons
      document.getElementById('prev-btn').disabled = currentIdx === 0;
      document.getElementById('next-btn').disabled = currentIdx + 3 >= donors.length;
    }

    // Show the previous three donors
    function showPrevious() {
      if (currentIdx > 0) {
        currentIdx -= 3;
        displayDonors();
      }
    }

    // Show the next three donors
    function showNext() {
      if (currentIdx + 3 < donors.length) {
        currentIdx += 3;
        displayDonors();
      }
    }

    // Function to search for a donor by name
    function searchDonor() {
      const query = document.getElementById('search-bar').value.toLowerCase();
      const donorReviewsContainer = document.getElementById('donor-reviews-container');
      donorReviewsContainer.innerHTML = ''; // Clear existing reviews

      const filteredDonors = donors.filter((donor) =>
        donor.name.toLowerCase().includes(query)
      );

      filteredDonors.forEach((donor) => {
        const donorReview = `
          <div class="donor-review">
            <div class="donor-photo">
              <img src="assets/images/default-donor.jpg" alt="${donor.name}" loading="lazy">
              <span class="donation-pin gold-pin"></span>
            </div>
            <div class="donor-details">
              <h3 class="donor-name">${donor.name}</h3>
              <p class="donation-amount">Donated: ₹${donor.amountPaid}</p>
              <p class="donor-review-text">${donor.title || 'Contributor'}</p>
            </div>
          </div>
        `;
        donorReviewsContainer.innerHTML += donorReview;
      });

      // Show a message if no results found
      if (filteredDonors.length === 0) {
        donorReviewsContainer.innerHTML = '<p>No donors found matching your search.</p>';
      }
    }

    // Load donors on page load
    document.addEventListener('DOMContentLoaded', loadDonorReviews);


    const faqItems = document.querySelectorAll('.faq-item');

    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        const icon = item.querySelector('.faq-icon');
        const answer = item.querySelector('.faq-answer');
        
        question.addEventListener('click', () => {
            const isOpen = answer.classList.contains('open');
            if (isOpen) {
                answer.classList.remove('open');
                icon.textContent = '+';
            } else {
                answer.classList.add('open');
                icon.textContent = '−';
            }
        });
    });


    function openPopup(policyId) {
      document.getElementById(policyId).style.display = 'flex';
  }

  // Function to close the policy popup
  function closePopup(policyId) {
      document.getElementById(policyId).style.display = 'none';
  }

  // Event listeners for opening the popups


  // send self email

  const contactForm = document.querySelector('.contact-form');

contactForm.addEventListener('submit', function (e) {
    e.preventDefault(); // Prevent the default form submission

    const name = contactForm.querySelector('input[placeholder="Your Name"]').value;
    const email = contactForm.querySelector('input[placeholder="Your Email"]').value;
    const message = contactForm.querySelector('textarea[placeholder="Your Message"]').value;

    // Create the form data object
    const formData = {
        name: name,
        email: email,
        message: message
    };

    // Send the form data to the server using Fetch
    fetch('/api/send-email', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData) // Send data as a JSON string
    })
    .then(response => response.text())
    .then(data => {
        alert('Message sent successfully!');
        console.log(data);
        contactForm.reset(); // Reset the form after submission
    })
    .catch(error => {
        alert('Failed to send the message. Please try again later.');
        console.error('Error:', error);
    });
});




async function fetchTargetDate() {
  try {
      const response = await fetch('/api/target-date');
      const data = await response.json();
      console.log('Fetched target date:', data.targetDate); // Debugging
      return new Date(data.targetDate);
  } catch (error) {
      console.error('Error fetching target date:', error);
      return null;
  }
}

function updateTimer(targetDate) {
  const now = new Date();
  const diff = targetDate - now;

  if (diff <= 0) {
      document.getElementById('timer').innerHTML = "<h2>Time's up!</h2>";
      return;
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  document.getElementById('days').textContent = String(days).padStart(2, '0');
  document.getElementById('hours').textContent = String(hours).padStart(2, '0');
  document.getElementById('minutes').textContent = String(minutes).padStart(2, '0');
  document.getElementById('seconds').textContent = String(seconds).padStart(2, '0');
}

async function startTimer() {
  const targetDate = await fetchTargetDate();
  if (!targetDate) return;

  updateTimer(targetDate);
  setInterval(() => updateTimer(targetDate), 1000);
}

// startTimer();

window.addEventListener('load',startTimer);

document.getElementById('terms').onclick = function() {
  document.getElementById('termsPopup').style.display = 'flex';
}
document.getElementById('privacy').onclick = function() {
  document.getElementById('privacyPopup').style.display = 'flex';
}
document.getElementById('refund').onclick = function() {
  document.getElementById('refundPopup').style.display = 'flex';
}

// Function to close the popups when clicking the close button
document.getElementById('closeTerms').onclick = function() {
  document.getElementById('termsPopup').style.display = 'none';
}
document.getElementById('closePrivacy').onclick = function() {
  document.getElementById('privacyPopup').style.display = 'none';
}
document.getElementById('closeRefund').onclick = function() {
  document.getElementById('refundPopup').style.display = 'none';
}

// Close the popup when clicking outside the content area
window.onclick = function(event) {
  if (event.target.className === 'popup') {
      event.target.style.display = 'none';
  }
}
