const Recipe = require('../../models/recipe');
const User = require('../../models/user');
const Comment = require('../../models/comment');
const { AuthenticationError, UserInputError, ForbiddenError } = require('apollo-server-express');

module.exports = {
    Query: {
        recipe: async (_, { id }) => {
            return await Recipe.findById(id);
        },

        recipes: async (_, { limit = 10, offset = 0 }) => {
            return await Recipe.find({ isApproved: true })
                .sort({ createdAt: -1 })
                .skip(offset)
                .limit(limit);
        },

        recipesByIngredients: async (_, { ingredients }) => {
            return await Recipe.find({
                'ingredients.name': { $in: ingredients },
                isApproved: true,
            });
        },

        favoriteRecipes: async (_, __, { user }) => {
            if (!user) {
                throw new AuthenticationError(
                    'You must be logged in to view your favorite recipes.'
                );
            }

            const userDoc = await User.findById(user.id);
            return await Recipe.find({ _id: { $in: userDoc.favoriteRecipes } });
        },

        userRecipes: async (_, __, { user }) => {
            if (!user) {
                throw new AuthenticationError('You must be logged in to view your recipes.');
            }

            return await Recipe.find({ author: user.id });
        },

        pendingRecipes: async (_, __, { user }) => {
            if (!user || user.role !== 'admin') {
                throw new AuthenticationError('You must be an admin to view pending recipes.');
            }

            return await Recipe.find({ isApproved: false });
        },
    },

    Mutation: {
        createRecipe: async (_, { input }, { user }) => {
            console.log('User:', user);
            if (!user) {
                throw new AuthenticationError('You must be logged in to create a recipe.');
            }

            const newRecipe = new Recipe({
                ...input,
                author: user.id,
                isApproved: true,
            });

            return await newRecipe.save();
        },

        updateRecipe: async (_, { id, input }, { user }) => {
            if (!user) {
                throw new AuthenticationError('You must be logged in to update a recipe.');
            }

            const recipe = await Recipe.findById(id);

            if (!recipe) {
                throw new Error('Recipe not found');
            }

            if (recipe.author.toString() !== user.id && user.role !== 'admin') {
                throw new ForbiddenError('You are not authorized to update this recipe.');
            }

            const isApproved = user.role === 'admin' ? recipe.isApproved : false;

            return await Recipe.findByIdAndUpdate(
                id,
                { ...input, updatedAt: Date.now(), isApproved },
                { new: true }
            );
        },

        deleteRecipe: async (_, { id }, { user }) => {
            if (!user) {
                throw new AuthenticationError('You must be logged in to delete a recipe.');
            }

            const recipe = await Recipe.findById(id);

            if (!recipe) {
                throw new Error('Recipe not found');
            }

            if (recipe.author.toString() !== user.id && user.role !== 'admin') {
                throw new ForbiddenError('You are not authorized to delete this recipe.');
            }

            // delete all comments of this recipe
            await Comment.deleteMany({ recipe: id });

            // remove the recipe from all users' favoriteRecipes
            await User.updateMany({ favoriteRecipes: id }, { $pull: { favoriteRecipes: id } });

            await Recipe.findByIdAndDelete(id);
            return true;
        },

        approveRecipe: async (_, { id }, { user }) => {
            if (!user || user.role !== 'admin') {
                throw new AuthenticationError('You must be an admin to approve a recipe.');
            }

            return await Recipe.findByIdAndUpdate(id, { isApproved: true }, { new: true });
        },
    },

    Recipe: {
        author: async parent => {
            return await User.findById(parent.author);
        },

        comments: async parent => {
            return await Comment.find({ recipe: parent.id }).sort({ createdAt: -1 });
        },
    },
};
