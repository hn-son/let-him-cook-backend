const User = require('../../models/user');
const Recipe = require('../../models/recipe');
const jwt = require('jsonwebtoken');
const { AuthenticationError, UserInputError } = require('apollo-server-express');
const { env } = require('../../configs/environment');

const generateToken = user => {
    return jwt.sign(
        {
            id: user.id,
            email: user.email,
            username: user.username,
            role: user.role,
        },
        env.JWT_SECRET,
        {
            expiresIn: '1h',
        }
    );
};

module.exports = {
    Query: {
        me: async (_, __, { user }) => {
            if (!user) {
                throw new AuthenticationError('You must be logged in to view your profile.');
            }

            return await User.findById(user.id);
        },
        user: async (_, { id }) => {
            return await User.findById(id);
        },
        checkAuth: async (_, __, { user }) => {
            if (!user) {
                return {
                    isAuthenticated: false,
                    message: 'Not authenticated',
                    user: null,
                };
            }

            try {
                const userData = await User.findById(user.id);
                if (!userData) {
                    return {
                        isAuthenticated: false,
                        message: 'User not found',
                        user: null,
                    };
                }

                return {
                    isAuthenticated: true,
                    message: 'Authenticated',
                    user: userData,
                };
            } catch (error) {
                return {
                    isAuthenticated: false,
                    message: 'Authentication error',
                    user: null,
                };
            }
        },
        users: async (_, { limit = 20, offset = 0 }, { user }) => {
            if (!user) {
                throw new AuthenticationError('You must be logged in to view users.');
            }

            return await User.find({ _id: { $ne: user.id } })
                .sort({ username: 1 })
                .skip(offset)
                .limit(limit);
        },
    },

    Mutation: {
        register: async (_, { input: { username, email, password, role = 'user' } }) => {
            const existingUser = await User.findOne({ $or: [{ email }, { username }] });
            if (existingUser) {
                throw new UserInputError('Email or username already exists.');
            }

            const user = new User({ username, email, password, role });

            const savedUser = await user.save();

            const token = generateToken(savedUser);
            return { token, user: savedUser };
        },

        login: async (_, { input: { email, password } }) => {
            const user = await User.findOne({ email });
            if (!user) {
                throw new UserInputError('User not found');
            }

            const isMatch = await user.comparePassword(password);
            if (!isMatch) {
                throw new UserInputError('Password is incorrect');
            }

            const token = generateToken(user);
            return { token, user };
        },

        addToFavorites: async (_, { recipeId }, { user }) => {
            if (!user) {
                throw new AuthenticationError(
                    'You must be logged in to add a recipe to favorites.'
                );
            }

            const updateUser = await User.findByIdAndUpdate(
                user.id,
                { $addToSet: { favoriteRecipes: recipeId } },
                { new: true }
            ).populate('favoriteRecipes');

            return updateUser;
        },
    },

    User: {
        favoriteRecipes: async parent => {
            return await Recipe.find({ _id: { $in: parent.favoriteRecipes } });
        },
    },
};
