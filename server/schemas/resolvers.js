const { User, Thought } = require('../models');

const resolvers = {
    Query: {
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
    }
};

module.exports = resolvers;