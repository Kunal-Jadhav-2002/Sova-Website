// Import required modules
require('dotenv').config();
const express = require('express');
const firebaseAdmin = require('firebase-admin');
const bodyParser = require('body-parser');
const path = require('path');
const crypto = require('crypto');
const { createCanvas, loadImage } = require('canvas');
const cors = require('cors');
const axios = require('axios');

const validRewards = [
    { title: "Selfless Supporter", amount: 119 },
    { title: "Helping Hands", amount: 299 },
    { title: "Dual Impact", amount: 549 },
    { title: "Caring Companion", amount: 899 },
    { title: "Promising Protector", amount: 1399 },
    { title: "Community Hero", amount: 1899 },
    { title: "Sova Champion", amount: 2399 },
    { title: "Architect of Impact", amount: 4999 }
];

// Initialize express app
const app = express();
app.use(cors());
const port = process.env.PORT || 3000;

// Initialize Firebase Admin SDK
const serviceAccount = {
    projectId: process.env.FIREBASE_PROJECT_ID,
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL
};

firebaseAdmin.initializeApp({
    credential: firebaseAdmin.credential.cert(serviceAccount),
    databaseURL: "https://sova-gloves-default-rtdb.firebaseio.com/"
});

// Middleware for parsing JSON and url-encoded data
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files (HTML, CSS, JS)
app.use(express.static(path.join(__dirname, 'public')));

const validateReward = (title, amount) => {
    const reward = validRewards.find(r => r.title === title);
    if (!reward) {
        return { valid: false, message: "Invalid reward title." };
    }

    const ans = amount % reward.amount;
    if (amount <= 0 || ans !== 0) {
        return { valid: false, message: "Invalid reward amount or amount is not a multiple of the reward value." };
    }

    return { valid: true, message: "Valid reward." };
};

// API endpoint to validate rewards
app.post('/validate-reward', (req, res) => {
    const { title, amount } = req.body;
    const result = validateReward(title, amount);

    if (result.valid) {
        res.status(200).json(result);
    } else {
        res.status(400).json(result);
    }
});

app.post('/create-order', async (req, res) => {
    const { title, amount } = req.body;
    console.log(amount);

    const validation = validateReward(title, amount / 100);
    if (validation.valid) {
        try {
            const orderPayload = {
                order_id: `order_${Date.now()}`,
                order_amount: amount / 100, // Amount in INR
                order_currency: "INR",
                customer_details: {
                    customer_id: `cust_${Date.now()}`,
                    customer_email: req.body.email,
                    customer_phone: req.body.phone
                },
                order_note: title
            };

            const orderResponse = await axios.post('https://sandbox.cashfree.com/pg/orders', orderPayload, {
                headers: {
                    'Content-Type': 'application/json',
                    'x-client-id': process.env.CASHFREE_APP_ID,
                    'x-client-secret': process.env.CASHFREE_SECRET_KEY
                }
            });

            const { order_token } = orderResponse.data;
            res.status(200).json({ orderId: orderPayload.order_id, orderToken: order_token });
        } catch (error) {
            console.error('Error creating order:', error.response?.data || error.message);
            res.status(500).json({ message: 'Internal Server Error' });
        }
    } else {
        return res.status(400).json({ message: validation.message });
    }
});

const generateRandomId = () => {
    return Math.floor(1000000 + Math.random() * 9000000).toString();
};

const checkIdExists = async (id) => {
    const db = firebaseAdmin.database();
    const idRef = db.ref('users').orderByChild('id').equalTo(id);
    const snapshot = await idRef.once('value');
    return snapshot.exists();
};

app.post('/verify-payment', async (req, res) => {
    const { orderId, paymentId, name, phone, address, email, donorTitle, totalContribution } = req.body;

    if (!orderId || !paymentId || !name || !phone || !address || !email || !donorTitle || !totalContribution) {
        return res.status(400).json({ message: "Invalid input." });
    }

    try {
        // Verify signature
        const signature = req.headers['x-cf-signature'];
        const data = `${orderId}${paymentId}`;
        const generatedSignature = crypto
            .createHmac('sha256', process.env.CASHFREE_SECRET_KEY)
            .update(data)
            .digest('base64');

        if (generatedSignature !== signature) {
            return res.status(400).json({ message: 'Invalid signature' });
        }

        let uniqueId = generateRandomId();

        let idExists = await checkIdExists(uniqueId);
        while (idExists) {
            uniqueId = generateRandomId();
            idExists = await checkIdExists(uniqueId);
        }

        const db = firebaseAdmin.database();
        const donationRef = db.ref('users').push();
        await donationRef.set({
            id: uniqueId,
            name,
            phone,
            address,
            email,
            donorTitle,
            totalContribution,
            timestamp: firebaseAdmin.database.ServerValue.TIMESTAMP
        });

        sendThankYouEmailWithCard(name, uniqueId, email, donorTitle);

        res.status(200).json({ message: 'Payment verified and donation recorded!' });
    } catch (error) {
        console.error('Error verifying payment:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

// Home route (serve HTML page)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start the server
app.listen(port,"0.0.0.0", () => {
    console.log(`Server running on port ${port}`);
});


app.use(express.static('public/')); // To serve static files like images and videos

// Sample data for the hero section
app.get('/api/hero-content', (req, res) => {
    const heroContent = {
        heading: "The hands are the instruments of the soul",
        author: "-Aristotle.",
        appeal: "Let's leave a mark in someone's heart by erasing the scars on their hands",
        heroHeading: "Every hand you support, lifts us all",
        heroInfo: "Your contribution doesn’t end today. Every time someone wears the gloves, they’ll remember the difference you made in their lives and their safety. Together, we can make a difference.",
        images: [
            "assets/images/farmer1.jpg",
            "assets/images/farmer2.jpg",
            "assets/images/FARMER1.jpeg",
            "assets/images/FARMER2.jpeg"
        ],
        video: "assets/videos/let-us-rise.mp4"
    };

    // Send the hero content as JSON
    
    res.json(heroContent);
});


  // Sample data (in a real scenario, this would come from a database)
 

  


app.get('/api/reward-content',(req,res)=>{
    const rewardContent = [
        {
            mainrewardImage: "assets/images/selfless supporter.png",
            heading:"Selfless Supporter",
            price: 119,
            contribution:"Partly Contribution for pair of Sova Easyflex gloves or one pair of Sova Simplex gloves to unsung heros in need.",
            mainrewardinfo :"A heartfelt thank you digital certificate and a social media post",
            reward2img:"",
            reward2info:"",
            reward3img:"",
            reward3info:"",
            reward4img:"",
            reward4info:"" 
        },
        {
            mainrewardImage: "assets/images/badge.jpg",
            heading:"Helping Hands",
            price:299,
            contribution:"One pair of Sova Easyflex gloves or 2 pairs of Sova Simplex gloves to unsung heros in need.",
            mainrewardinfo :"A heartfelt thank you certificate and digital supporter badge and a social media post",
            reward2img:"assets/images/helping-hands.png",
            reward2info:"A heartfelt certificate.",
            reward3img:"",
            reward3info:"",
            reward4img:"",
            reward4info:"" 
        },
        {
            mainrewardImage: "assets/images/eco-friendly.jpeg",
            heading:"Dual Impact",
            price:549,
            contribution:"1 pair of Sova Easyflex gloves or 2 pairs of Sova Simplex gloves to unsung heros in need.",
            mainrewardinfo :"Sova EasyFlex gloves + eco-friendly pen/keychain + heartfelt certificate + supporter badge and a social media post",
            reward2img:"assets/images/easy-flex.png",
            reward2info:"Sova EasyFlex Gloves",
            reward3img:"assets/images/Dual-impact.png",
            reward3info:"Certificate",
            reward4img:"assets/images/badge.jpg",
            reward4info:"Badge" 
        },
        {
            mainrewardImage: "assets/images/penstand.jpeg",
            heading:"Caring Companion",
            price: 899,
            contribution:"2 pairs of Sova Easyflex gloves or 4 pairs of Sova Simplex gloves to unsung heros in need",
            mainrewardinfo :"Sova DailyShield gloves + pen stand + heartfelt certificate + supporter badge and a social media post",
            reward2img:"assets/images/daily shield.png",
            reward2info:"Sova DailyShield Gloves",
            reward3img:"assets/images/Caring-companion.png",
            reward3info:"Certificate",
            reward4img:"assets/images/badge.jpg",
            reward4info:"Badge" 
        },
        {
            mainrewardImage: "assets/images/promising-protector-gift.png",
            heading:"Promising Protector",
            price: 1399,
            contribution:"3 pairs of Sova Easyflex gloves or 6 pairs of Sova Simplex gloves to unsung heros in need",
            mainrewardinfo :"Sova SoftGuard gloves + insulated coffee mug + heartfelt certificate + supporter badge and a social media post",
            reward2img:"assets/images/softgaurd1.png",
            reward2info:"Sova SoftGaurd Gloves",
            reward3img:"assets/images/Promising-protector.png",
            reward3info:"Certificate",
            reward4img:"assets/images/badge.jpg",
            reward4info:"Badge" 
        },
        {
            mainrewardImage: "assets/images/community-hero-gift.png",
            heading:"Community Hero",
            price: 1899,
            contribution:"5 pairs of Sova Easyflex gloves or 10 pairs of Sova Simplex gloves to unsung heros in need and your name on each pair.",
            mainrewardinfo :"Sova FlexiPro gloves + temperature water bottle + heartfelt certificate + supporter badge and a social media post",
            reward2img:"assets/images/flexi-pro1.png",
            reward2info:"Sova Flexi Pro Gloves",
            reward3img:"assets/images/community-hero.png",
            reward3info:"Certificate",
            reward4img:"assets/images/badge.jpg",
            reward4info:"Badge" 
        },
        {
            mainrewardImage: "assets/images/sova-champion-gift.png",
            heading:"Sova Champion",
            price: 2399,
            contribution:"7 pairs of Sova Easyflex gloves or 14 pairs of Sova Simplex gloves to unsung heros in need and your name on each pair.",
            mainrewardinfo :"Sova EverTough gloves + Vacuum flask set + heartfelt certificate + supporter badge and a social media post",
            reward2img:"assets/images/ever-tough1.png",
            reward2info:"Sova Ever Tough Gloves",
            reward3img:"assets/images/sova-champion.png",
            reward3info:"Certificate",
            reward4img:"assets/images/badge.jpg",
            reward4info:"Badge" 
        },
       
        {
            mainrewardImage: "assets/images/architect-of-impact-gift.png",
            heading:"Architect of Impact",
            price: 4999,
            contribution:"15 pairs of Sova Easyflex gloves or 25 pairs of Sova Simplex gloves to unsung heros in need and your name on each pair.",
            mainrewardinfo :"1 pair of Sova HyperFlex gloves + Sova special gift set + framed certificate + supporter badge and a social media post",
            reward2img:"assets/images/hyperflex1.png",
            reward2info:"Sova Hyper Flex Gloves",
            reward3img:"assets/images/Architect of Impact.png",
            reward3info:"Certificate",
            reward4img:"assets/images/badge.jpg",
            reward4info:"Badge" 
        },
       


    ]
    
   
    res.json(rewardContent);

})

app.post('/submit-donation', async (req, res) => {
    try {
      const { name, phone, address, email, donorTitle, totalContribution } = req.body;
  
      if (!name || !phone || !address || !email || !donorTitle || !totalContribution) {
        return res.status(400).json({ message: 'All fields are required!' });
      }
  
      // Save data to Firebase
      const db = firebaseAdmin.database();
      const donationRef = db.ref('users').push();
      await donationRef.set({
        name,
        phone,
        address,
        email,
        donorTitle,
        totalContribution,
        timestamp: admin.database.ServerValue.TIMESTAMP,
      });
  
      res.status(200).json({ message: 'Donation successfully recorded!' });
    } catch (error) {
      console.error('Error saving donation:', error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  });


  const nodemailer = require('nodemailer');


const sendThankYouEmailWithCard = async (name, id, email, title) => {
  try {
      // Define the social posts
      const Posts = [
          {
              Reward: "Selfless Supporter",
              Images: ["assets/images/Selfless-Supporter-post.png"],
              color: "#4cfa11"
          },
          {
              Reward: "Helping Hands",
              Images: ["assets/images/Helping-hands-post.png"],
              color: "#030303"
          },
          {
              Reward: "Dual Impact",
              Images: ["assets/images/Dual-impact-post.png"],
              color: "#030303"
          },
          {
              Reward: "Caring Companion",
              Images: ["assets/images/Caring-companion-post.png"],
              color: "#030303"
          },
          {
              Reward: "Promising Protector",
              Images: ["assets/images/Promising-protector-post.png"],
              color: "#030303"
          },
          {
              Reward: "Community Hero",
              Images: ["assets/images/Community-hero-post.png"],
              color: "#FFD700"
          },
          {
              Reward: "Sova Champion",
              Images: ["assets/images/Sova-Champion-post.png"],
              color: "#FFD700"
          },
          {
              Reward: "Architect of Impact",
              Images: ["assets/images/Architect-of-impact-post.png"],
              color: "#FFD700"
          }
      ];

      // Find the corresponding post by title
      const post = Posts.find(p => p.Reward.toLowerCase() === title.toLowerCase());
      if (!post) {
          throw new Error('Invalid title. No matching post found.');
      }

      // Select the background image and color
      const backgroundImage = post.Images[0];
      const colour = post.color;

      // Load the background image
      const imagePath = path.join(__dirname, 'public', backgroundImage);
      const bgImage = await loadImage(imagePath);

      // Create an A4 canvas
      const canvas = createCanvas(2480, 3508); // A4 size in pixels at 300 DPI
      const ctx = canvas.getContext('2d');

      // Draw the background image
      ctx.drawImage(bgImage, 0, 0, canvas.width, canvas.height);

      // Set font and position for ID
      ctx.font = "bold 25px 'Times New Roman'";
      ctx.fillStyle = "#4cfa11";
      ctx.textAlign = "right";
      ctx.fillText(`ID: ${id}`, canvas.width - 50, 50);

      // Set font and position for the name
      ctx.font = "bold 180px 'Times New Roman'";
      ctx.fillStyle = colour;
      ctx.textAlign = "center";
      ctx.fillText(name, canvas.width / 2, 750);

      // Convert the canvas to a buffer
      const cardImage = canvas.toBuffer('image/png');

      // Configure Nodemailer
      const transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
              user: 'sovaeffortlesscleaning@gmail.com',
              pass: process.env.EMAIL_PASS
          }
      });

      // Prepare email content
      const mailOptions = {
          from: 'SOVA GLOVES',
          to: email,
          subject: 'Thank You for Your Support! Together, We’re Empowering Lives with Sova',
          text: `Hello,

Thank you for showing interest in Sova's mission! Together, we aim to empower individuals and communities with self-care solutions that truly make a difference.

Thank you for your contribution to our mission by contributing to Sova and becoming a vital part of this transformative journey. Your support will directly help us make gloves more accessible to farmers, laborers, and anyone in need of protection.

Title: ${title}

Every small contribution matters, and with your help, we will take this mission to greater heights. Thank you for being an essential part of this vision!

We will be delivering your rewards soon. Digital Certificate will be sent on your mobile till the end of the day.
Rewards will be delivered to your doorstep.

Warm regards,
The Sova Team`,
          html: `<p>Hello,</p>
                  <p>Thank you for showing interest in Sova's mission! Together, we aim to empower individuals and communities with self-care solutions that truly make a difference.</p>
                  <p>Thank you for your contribution to our mission by contributing to Sova and becoming a vital part of this transformative journey. Your support will directly help us make gloves more accessible to farmers, laborers, and anyone in need of protection.</p>
                  <p><strong>Title: ${title}</strong></p>
                  <p>Every small contribution matters, and with your help, we will take this mission to greater heights. Thank you for being an essential part of this vision!</p>
                  <p>We will be delivering your rewards soon. Digital Certificate will be sent on your mobile till the end of the day.<br>
                  Rewards will be delivered to your doorstep.</p>
                  <p>Warm regards,<br>The Sova Team</p>`,
          attachments: [
              {
                  filename: 'post.png',
                  content: cardImage
              }
          ]
      };

      // Send the email
      const info = await transporter.sendMail(mailOptions);
      console.log('Email sent: ', info.response);
  } catch (error) {
      console.error('Error sending email:', error);
  }
};



  

// product features

const productFeatures = [
    {
        id: 'feature1',
        image: 'assets/images/fresh.jpg',
        video: null,
        title: 'Fresh and Odourless Hands',
        description: 'Leave your hands smelling fresh after every use.'
    },
    {
        id: 'feature2',
        image: null,
        video: 'assets/images/waterproof.mp4',
        title: 'Waterproof',
        description: 'Protects against water and keeps your hands dry.'
    },
    {
        id: 'feature3',
        image: null,
        video: 'assets/images/cloth.mp4',
        title: 'Comfortable Lining',
        description: 'Soft cloth lining for all-day comfort.'
    },
    {
        id: 'feature4',
        image: null,
        video: 'assets/images/abrasive.mp4',
        title: 'Abrasive Exterior',
        description: 'Perfect for scrubbing and heavy-duty cleaning.'
    },
    {
        id: 'feature5',
        image: null,
        video: 'assets/images/cut-proof.mp4',
        title: 'Partially Cut-Proof',
        description: 'Reliable protection against sharp objects.'
    },
    {
        id: 'feature6',
        image: null,
        video: 'assets/images/fitting.mp4',
        title: 'Perfect Fit',
        description: 'Snug design ensures ease and comfort.'
    }
];

// Define the route to get product feature data
app.get('/api/product-features', (req, res) => {
    res.json(productFeatures);
});


const products = [
    {
        name: 'Sova Simplex',
        image: 'assets/images/simplex.jpg',
        length: '22cm-26cm',
        features: 'Versatile gloves for, labor, farming, and cleaning!',
        description: 'Durable, flexible gloves with cloth lining, fragrance, and odor-free!',
        price: '75/-',
      },

    {
      name: 'Easy-Flex',
      image: 'assets/images/easy-flex.png',
      length: '32cm-36cm',
      features: 'Versatile gloves for households, labor, farming, and cleaning!',
      description: 'Durable, flexible gloves with cloth lining, fragrance, and odor-free!',
      price: '199/-',
    },
    {
      name: 'Daily Shield',
      image: 'assets/images/daily shield.png',
      length: '42cm-45cm',
      features: 'Essential gloves for home, work, gardening, and more!',
      description: 'Flexible, durable gloves with cloth lining, sweat, and odor control!',
      price: '249/-',
    },
    {
      name: 'Soft Guard',
      image: 'assets/images/Soft-gaurd.png',
      length: '42cm-45cm',
      features: 'Reliable gloves for households, labor, and outdoor tasks.',
      description: 'Durable, flexible gloves with cloth and microfiber lining, odor-free!',
      price: '349/-',
    },
    {
      name: 'Flexi Pro',
      image: 'assets/images/flexi-pro.png',
      length: '42cm-45cm',
      features: 'Perfect for housework, heavy labor, and farming needs!',
      description: 'Durable, flexible, odor-removing, printed designs, abrasive, with cloth and microfiber linings inside.',
      price: '499/-',
    },
    {
      name: 'Ever Tough',
      image: 'assets/images/ever-tough.png',
      length: '42cm-45cm',
      features: 'All-purpose gloves for every job, big or small!',
      description: 'Durable, flexible gloves with cloth and fleece lining, odor-free and abrasive.',
      price: '599/-',
    },
    {
      name: 'Hyper Flex',
      image: 'assets/images/hyper-flex.png',
      length: '42cm-45cm',
      features: 'Designed for cleaning, farming, and daily chores!',
      description: 'Durable, flexible gloves with faux fur and cloth lining, fragrant, odor-removing, and abrasive.',
      price: '749/-',
    },
  ];
  
  // Route to serve the products page
  app.get('/api/products', (req, res) => {
    res.json(products);
  });


//   donors

const donorReviewsDB = firebaseAdmin.database().ref('users');

app.get('/api/donors', async (req, res) => {
    try {
      const snapshot = await donorReviewsDB.once('value');
      const donors = [];
  
      snapshot.forEach((childSnapshot) => {
        donors.push(childSnapshot.val());
      });
  
      donors.reverse(); // Ensure the most recent donors are first
      res.json(donors); // Send the donor data as a JSON response
    } catch (error) {
      console.error('Error fetching donor data:', error);
      res.status(500).send('Error fetching donor data');
    }
  });


//   send self email

app.post('/api/send-email', (req, res) => {
    const { name, email, message } = req.body; // Get the form data

    // Create a Nodemailer transporter using your email provider
    const transporter = nodemailer.createTransport({
        service: 'gmail', // You can use other services like SMTP or SendGrid
        auth: {
            user: 'sovaeffortlesscleaning@gmail.com', // Replace with your email
            pass: process.env.EMAIL_PASS,   // Replace with your email password or app-specific password
        }
    });

    // Email options
    const mailOptions = {
        from: email,          // Sender email (user's email)
        to: 'sovaeffortlesscleaning@gmail.com', // Your email address (where the email will be sent)
        subject: 'New Message from Contact Form',
        text: `You have a new message from ${name} (${email}):\n\n${message}`
    };

    // Send email using Nodemailer
    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.log(error);
            return res.status(500).send('Failed to send email');
        }
        console.log('Email sent: ' + info.response);
        res.status(200).send('Message sent successfully!');
    });
});


app.get('/api/target-date', (req, res) => {
    const targetDate = process.env.TARGET_DATE;
    if (!targetDate) {
        return res.status(500).json({ error: 'Target date not set' });
    }
    res.json({ targetDate });
});



app.get('/api/get-stats', async (req, res) => {
    const usersRef = firebaseAdmin.database().ref('users');
    const snapshot = await usersRef.once('value');
    const users = snapshot.val();
  
    let totalDonation = 100000;
    let totalFarmersReached = 0;
    let totalContributions = 0;
  
    for (let userId in users) {
      totalDonation += users[userId].totalContribution;
    }
  
    // Calculate the number of farmers reached and contributions
    totalFarmersReached = Math.floor(totalDonation / 200);
    totalContributions = Object.keys(users).length + 300;  // Add 300 to total entries
  
    res.json({
      totalDonation,
      totalFarmersReached,
      totalContributions,
    });
  });


  const videoList = [
    'assets/videos/using-gloves1.mp4',
    'assets/videos/glove-using2.mp4',
    'assets/videos/glove-using3.mp4',
    
  ];
  
  // Serve video files securely
  app.get('/api/getVideos', (req, res) => {
    res.json({ videos: videoList });
  });
