import User from "../models/User.js";

export const getUsers = async (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const users = await User.find({}, { name: 1, email: 1 }).sort({ name: 1 });

    res.status(200).json({ users });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
