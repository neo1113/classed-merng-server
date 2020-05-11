// error handling via apollo
const { UserInputError } = require('apollo-server');
const {
  validateRegisterInput,
  validateLoginInput,
} = require('../../util/validators');

// npm install bcryptjs jsonwebtoken
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const { SECRET_KEY } = require('../../config');
const User = require('../../models/User');

function generateToken(user) {
  return jwt.sign(
    {
      id: user.id,
      username: user.username,
      email: user.email,
    },
    SECRET_KEY,
    {
      expiresIn: '1h',
    }
  );
}

module.exports = {
  Mutation: {
    async login(_, { loginInput: { email, password } }) {
      // validate user data
      const { errors, valid } = validateLoginInput(email, password);
      if (!valid) {
        throw new UserInputError('Errors: ', { errors });
      }

      const user = await User.findOne({ email });
      if (!user) {
        errors.general = 'User not found';
        throw new UserInputError(errors.general, { errors });
      }

      const match = await bcrypt.compare(password, user.password);
      if (!match) {
        errors.general = 'Wrong credentials';
        throw new UserInputError(errors.general, { errors });
      }

      const token = generateToken(user);

      // patterns on the typeDef [User]
      return {
        id: user._id,
        ...user._doc, // username, createdAt, email
        token,
      };
    },

    //register(parent, args, context, info)
    async register(
      _,
      { registerInput: { username, email, password, confirmPassword } } // context, // info
    ) {
      // validate user data
      const { errors, valid } = validateRegisterInput(
        username,
        email,
        password,
        confirmPassword
      );
      if (!valid) {
        throw new UserInputError('Errors: ', { errors });
      }

      // make sure user doesnt already exist
      const user = await User.findOne({ username });
      if (user) {
        throw new UserInputError('Username is taken', {
          errors: {
            username: 'This username is taken',
          },
        });
      }

      // hash password and create auth token
      password = await bcrypt.hash(password, 12);
      // patterns the User model schema - user input - reflects the database schema
      const newUser = new User({
        username,
        email,
        password,
        createdAt: new Date().toISOString(),
      });
      const res = await newUser.save();

      const token = generateToken(res);

      // patterns on the typeDef [User]
      return {
        id: res._id,
        ...res._doc, // username, createdAt, email
        token,
      };
    },
  },
};
