// controller
export const searchUsers = async (req, res) => {
  try {
    const query = req.query.q;

    const users = await User.find({
      name: { $regex: query, $options: "i" }
    });

    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};