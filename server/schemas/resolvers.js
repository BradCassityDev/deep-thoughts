const { User, Thought } = require('../models');
const { AuthenticationError } = require('apollo-server-express');
const { signToken } = require('../utils/auth');

const resolvers = {
    Query: {
        // ME
        me: async (parent, args, context) => {
            if (context.user) {
              const userData = await User.findOne({ _id: context.user._id })
                .select('-__v -password')
                .populate('thoughts')
                .populate('friends');
          
              return userData;
            }
          
            throw new AuthenticationError('Not logged in');
        },
        // Get all users
        users: async () => {
            return User.find()
                .select('-__v -pasword')
                .populate('friends')
                .populate('thoughts');
        },
        // Get user by username
        user: async (parent, { username }) => {
            return User.findOne({ username })
                .select('-__v -password')
                .populate('friends')
                .populate('thoughts');
        },
        // Get all thoughts or thoughts by username
        thoughts: async (parent, { username }) => {
            const params = username ? { username } : {};
            return Thought.find(params).sort({ createdAt: -1 });
        },
        // Get thought by id
        thought: async (parent, { _id }) => {
            return Thought.findOne({ _id });
        }
    },

    Mutation: {
        // Add User
        addUser: async (parent, args) => {
            const user = await User.create(args);
            const token = signToken(user);
          
            return { token, user };
        },
        // Login
        login: async (parent, { email, password }) => {
            const user = await User.findOne({ email });
          
            if (!user) {
              throw new AuthenticationError('Incorrect credentials');
            }
          
            const correctPw = await user.isCorrectPassword(password);
          
            if (!correctPw) {
              throw new AuthenticationError('Incorrect credentials');
            }
          
            const token = signToken(user);
            return { token, user };
        },
        // Add Thought
        addThought: async (parent, args, context) => {
            if (context.user) {
                const thought = await Thought.create({ ...args, username: context.user.username });

                await User.findByIdAndUpdate(
                    { _id: context.user._id },
                    { $push: { thoughts: thought._id } },
                    { new: true }
                );

                return thought;
            }

            // Throw new error
            throw new AuthenticationError('You need to be logged in!');
        },
        // Add Reaction
        addReaction: async (parent, { thoughtId, reactionBody }, context) => {
            if (context.user) {
                const updatedThought = await Thought.findOneAndUpdate(
                    { _id: thoughtId },
                    { $push: { reactions: { reactionBody, username: context.user.username } } },
                    { new: true, runValidators: true }
                );

                return updatedThought;
            }

            throw new AuthenticationError('You need to be logged in!');
        },
        // Add Friend
        addFriend: async (parent, { friendId }, context) => {
            if (context.user) {
              const updatedUser = await User.findOneAndUpdate(
                { _id: context.user._id },
                { $addToSet: { friends: friendId } },
                { new: true }
              ).populate('friends');
          
              return updatedUser;
            }
          
            throw new AuthenticationError('You need to be logged in!');
        }
    }
};

module.exports = resolvers;