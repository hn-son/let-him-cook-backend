const User = require('../../models/user');
const Recipe = require('../../models/recipe');
const Comment = require('../../models/comment');
const jwt = require('jsonwebtoken');
const { AuthenticationError, UserInputError, ForbiddenError } = require('apollo-server-express');
const { env } = require('../../configs/environment');
const bcrypt = require('bcryptjs');

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

        updateUser: async (_, { id, input }, { user }) => {
            if (!user) {
                throw new AuthenticationError('You must be logged in to update your profile.');
            }

            if (user.id !== id && user.role !== 'admin') {
                console.log(user)
                throw new AuthenticationError('You are not authorized to update this user.');
            }

            const userToUpdate = await User.findById(id);
            if (!userToUpdate) {
                throw new UserInputError('User not found');
            }

            if (input.email && input.email !== userToUpdate.email) {
                const existingUser = await User.findOne({ email: input.email });
                if (existingUser) {
                    throw new UserInputError('Email already exists');
                }
            }

            if (input.username && input.username !== userToUpdate.username) {
                const existingUser = await User.findOne({ username: input.username });
                if (existingUser) {
                    throw new UserInputError('Username already exists');
                }
            }

            const updateData = {};

            if (input.username) updateData.username = input.username;
            if (input.email) updateData.email = input.email;
            if (input.role) updateData.role = input.role;

            if (input.password) {
                const salt = await bcrypt.genSalt(10);
                updateData.password = await bcrypt.hash(input.password, salt);
                // updateData.password = input.password;
            }

            const updatedUser = await User.findByIdAndUpdate(
                id,
                { $set: updateData },
                { new: true }
            );

            return updatedUser;
        },
        deleteUser: async (_, { id }, { user }) => {
            if (!user) {
                throw new AuthenticationError('You must be logged in to delete your account.');
            }

            if (user.id !== id && user.role !== 'admin') {
                throw new ForbiddenError('You are not authorized to delete this user.');
            }

            const userToDelete = await User.findById(id);
            if (!userToDelete) {
                throw new UserInputError('User not found');
            }

            try {
                await Recipe.deleteMany({ author: id });

                await Comment.deleteMany({ author: id });

                await User.findByIdAndDelete(id);

                return {
                    success: true,
                    message: 'User deleted successfully',
                };
            } catch (error) {
                console.error('Error deleting user:', error);
                return {
                    success: false,
                    message: 'Failed to delete user',
                    error: error.message,
                };
            }
        },
    },

    removeFromFavorites: async (_, { recipeId }, { user }) => {
        if (!user) {
            throw new AuthenticationError(
                'You must be logged in to remove a recipe from favorites.'
            );
        }

        const updateUser = await User.findByIdAndUpdate(
            user.id,
            { $pull: { favoriteRecipes: recipeId } },
            { new: true }
        ).populate('favoriteRecipes');

        return updateUser;
    },

    User: {
        favoriteRecipes: async parent => {
            return await Recipe.find({ _id: { $in: parent.favoriteRecipes } });
        },
    },
};
