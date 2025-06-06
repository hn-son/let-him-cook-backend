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

            const isOwner = comment.author.toString() === user.id;
            const isAdmin = user.role === 'admin';

            if (!isOwner && !isAdmin) {
                throw new Error('You are not authorized to delete this comment');
            }

            if (isAdmin && !isOwner) {
                console.log(
                    `Admin ${user.email} is deleting comment ${id} by user ${comment.author}`
                );
            }

            if (comment.author.toString() !== user.id && user.role !== 'admin') {
                throw new AuthenticationError('You are not authorized to delete this comment');
            }

            await Comment.findByIdAndDelete(id);

            return {
                success: true,
                message: isAdmin && !isOwner ? 'Comment deleted by admin' : 'Comment deleted',
                deleteBy: user.role,
            };
        },

        deleteMultipleComments: async (_, { commentIds }, { user }) => {
            if (!user) {
                throw new AuthenticationError('You must be logged in to delete comments');
            }

            if (user.role !== 'admin') {
                throw new AuthenticationError('You are not authorized to delete comments');
            }

            try {
                const comments = await Comment.find({ _id: { $in: commentIds } });
                if (comments.length === 0) {
                    throw new Error('No comments found');
                }
                const result = await Comment.deleteMany({ _id: { $in: commentIds } });
                console.log(`Admin ${user.username} deleted ${result.deletedCount} comments`);

                return {
                    success: true,
                    message: `Successfully deleted ${result.deletedCount} comments`,
                    deletedCount: result.deletedCount,
                };
            } catch (error) {
                console.error('Error deleting comments:', error);
                throw new Error('Error deleting comments');
            }
        },

        deleteUserComments: async (_, { userId }, { user }) => {
            if (!user) {
                throw new AuthenticationError('You must be logged in to delete comments');
            }

            if (user.role !== 'admin') {
                throw new Error('You are not authorized to delete comments');
            }

            try {
                const targetUser = await User.findById(userId);
                if (!targetUser) {
                    throw new Error('User not found');
                }

                const result = await Comment.deleteMany({ author: userId });
                console.log(`Admin ${user.username} deleted ${result.deletedCount} comments`);

                return {
                    success: true,
                    message: `Successfully deleted ${result.deletedCount} comments`,
                    deletedCount: result.deletedCount,
                    targetUser: targetUser.username,
                };
            } catch (error) {
                throw new Error(`Error deleting comments: ${error.message}`);
            }
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
