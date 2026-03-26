import sendEmail from "../lib/utils/sendEmail.js";
export const registerUser = async (req, res) => {
  const { email, name } = req.body;

  try {
    // 👉 your existing user creation logic
    // Example:
    // const user = await User.create({ email, name });

    await sendEmail(
      email,
      "Welcome!",
      `Hello ${name}, welcome to our platform! 🎉`
    );

    res.status(200).json({ message: "User registered & email sent" });
  } catch (error) {
    res.status(500).json({ message: "Error registering user" });
  }
};