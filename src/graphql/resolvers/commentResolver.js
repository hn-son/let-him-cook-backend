const Comment = require('../../models/comment');
const Recipe = require('../../models/recipe');
const User = require('../../models/user');
const { AuthenticationError, UserInputError } = require('apollo-server-express');

module.exports = {
    Query: {
        recipeComments: async (_, { recipeId }) => {
            return await Comment.find({ recipe: recipeId }).sort({ createdAt: -1 });
        },
    },

    Mutation: {
        addComment: async (_, { recipeId, content }, { user }) => {
            if (!user) {
                throw new AuthenticationError('You must be logged in to add a comment');
            }

            const recipe = await Recipe.findById(recipeId);
            if (!recipe) {
                throw new Error('Recipe not found');
            }

            if (!recipe.isApproved) {
                throw new Error('Recipe is not approved');
            }

            const newComment = new Comment({
                content,
                recipe: recipeId,
                author: user.id,
            });

            return await newComment.save();
        },

        deleteComment: async (_, { id }, { user }) => {
            if (!user) {
                throw new AuthenticationError('You must be logged in to delete a comment');
            }

            const comment = await Comment.findById(id);
            if (!comment) {
                throw new Error('Comment not found');
            }

            if (comment.author.toString() !== user.id && user.role !== 'admin') {
                throw new AuthenticationError('You are not authorized to delete this comment');
            }

            await Comment.findByIdAndDelete(id);

            return true;
        },
    },

    Comment: {
        recipe: async parent => {
            return await Recipe.findById(parent.recipe);
        },

        author: async parent => {
            return await User.findById(parent.author);
        },
    },
};
