import sendEmail from "../utils/sendEmail.js";

export const registerUser = async (req, res) => {
  const { email, name } = req.body;

  try {
    // 👉 your existing user creation logic
    // Example:
    // const user = await User.create({ email, name });

    const welcomeHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to StackOverflow Clone</title>
      </head>
      <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px 30px; border-radius: 12px; text-align: center;">
          <h1 style="margin: 0; font-size: 32px;">🎉 Welcome to StackOverflow Clone!</h1>
          <p style="margin: 20px 0 0 0; font-size: 18px;">We're excited to have you join our community</p>
        </div>
        
        <div style="background: #f8f9fa; padding: 30px; border-radius: 8px; margin-top: 20px;">
          <p>Hello <strong>${name}</strong>,</p>
          <p>Welcome to our platform! Your account has been successfully created and you're ready to start asking questions and sharing knowledge.</p>
          
          <div style="background: white; border: 1px solid #dee2e6; border-radius: 6px; padding: 20px; margin: 20px 0;">
            <h3 style="color: #495057; margin-top: 0;">What's Next?</h3>
            <ul style="color: #495057;">
              <li>Complete your profile</li>
              <li>Ask your first question</li>
              <li>Help others by answering questions</li>
              <li>Earn reputation points</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="#" style="background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Get Started</a>
          </div>
          
          <p style="font-size: 14px; color: #6c757d; margin-top: 30px;">If you have any questions, feel free to reach out to our support team.</p>
        </div>
        
        <div style="text-align: center; margin-top: 30px; color: #6c757d; font-size: 14px;">
          <p>&copy; ${new Date().getFullYear()} StackOverflow Clone. All rights reserved.</p>
          <p>This is an automated message, please do not reply to this email.</p>
        </div>
      </body>
      </html>
    `;

    await sendEmail(
      email,
      "Welcome to StackOverflow Clone! 🎉",
      welcomeHtml
    );

    res.status(200).json({ message: "User registered & welcome email sent" });
  } catch (error) {
    console.error('[registerUser] Error:', error);
    res.status(500).json({ message: "Error registering user" });
  }
};