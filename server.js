// Import express into our project
const express = require("express")
const nodemailer = require("nodemailer")

require("dotenv").config()

// Googleapis
const { google } = require("googleapis")

// Creating an instance of express function
const app = express();

// The port we want our project to run on
const PORT = process.env.PORT || 3000;

// Express should add our path
app.use(express.static("public"))

// Body parser
app.use(express.json())
app.use(express.urlencoded({ extended: false }))

// Render the index.html when the user visit our project port
app.get("/", (req, res) => {
    res.sendFile("/index.html")
});

// Pull out OAuth2 from googleapis
const OAuth2 = google.auth.OAuth2;

const createTransporter = async () => {
    // 1
      const oauth2Client = new OAuth2(
        process.env.OAUTH_CLIENT_ID,
        process.env.OAUTH_CLIENT_SECRET,
        "https://developers.google.com/oauthplayground"
      )

// 2
oauth2Client.setCredentials({
    refresh_token: process.env.OAUTH_REFRESH_TOKEN,
  });

  const accessToken = await new Promise((resolve, reject) => {
    oauth2Client.getAccessToken((err, token) => {
      if (err) {
        reject("Failed to create access token :( " + err);
      }
      resolve(token)
    })
  })

// 3
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      type: "OAuth2",
      user: process.env.USER_EMAIL,
      accessToken,
      clientId: process.env.OAUTH_CLIENT_ID,
      clientSecret: process.env.OAUTH_CLIENT_SECRET,
      refreshToken: process.env.OAUTH_REFRESH_TOKEN,
    },
  });

// 4
  return transporter;
}

// Post route to handle retrieving data from HTML form to server
app.post("/", async (req, res) => {
        const { fromEmail, subject, message } = req.body
        console.log("Email: ", fromEmail)
        console.log("Subject: ", subject)
        console.log("Message: ", message)

        // email options
        let mailOptions = { 
            // from: fromEmail,
            to: process.env.USER_EMAIL,
            subject: `${subject} from ${fromEmail}`,
            text: message,
        }

        try {
            // Get response from the createTransport
            let emailTransporter = await createTransporter();
    
            // Send email
            emailTransporter.sendMail(mailOptions, function (error, info) {
              if (error) {
                // failed block
                console.log(error);
              } else {
                // Success block
                console.log("Email sent: " + info.response);
                return res.redirect("/");
              }
            });
          } catch (error) {
            return console.log(error);
          }
})
  

// Express allows us to listen to the PORT and trigger a console.log() when you visit the port
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`)
})
