const bcrypt = require('bcrypt');
const Users = require('../model/userSchema.js');
const generateToken = require('../middleware/authGenerateToken.js')


const signUp = async (req, res) => {
    try {

      const { username, password } = req.body;
      const existingUsername = await Users.findOne({ username });

      if (existingUsername) {
        return res.status(400).json({ message: 'Username already exists.' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const newUser = new Users({ username, password: hashedPassword });
      await newUser.save();

      res.status(201).json({ message: 'Signup successful.' });
    } catch (error) {
      console.error('error', error);
      res.status(500).json({ message: 'Internal server error.' });
    }
  };
  const signIn = async (req, res) => {
    try {
        console.log(req.body)
      const { username, password } = req.body;

      const user = await Users.findOne({ username });
      if (!user) {
        return res.status(401).json({ message: "User doesn't exist." });
      }
      const verifyPassword = await bcrypt.compare(password, user.password);
      if (!verifyPassword) {
        return res.status(401).json({ message: 'Invalid username or password.' });
      }
      const token = generateToken(user);

      res.status(200).json({ message: 'Access granted to the Finance Manager dashboard.',token, userId: user._id, username });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: ': Authentication failure, access denied' });
    }
  };

module.exports = {signUp, signIn};
