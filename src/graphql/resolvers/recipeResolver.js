const Recipe = require('../../models/recipe');
const User = require('../../models/user');
const Comment = require('../../models/comment');
const { AuthenticationError, UserInputError, ForbiddenError } = require('apollo-server-express');
const { transformId } = require('../../utils');

module.exports = {
    Query: {
        recipe: async (_, { id }) => {
            const recipe = await Recipe.findById(id).lean();
            return transformId(recipe);
        },

        recipes: async (_, { limit = 10, offset = 0, search }) => {
            let query = { isApproved: true };
            let sortOptions = { createdAt: -1 };
            let results;
            console.log('Search for: ', search);
            if (search) {
                try {
                    // Thử sử dụng text search trước
                    query.$text = { $search: search };
                    sortOptions = {
                        score: { $meta: 'textScore' },
                        createdAt: -1,
                    };

                    results = await Recipe.find(query, { score: { $meta: 'textScore' } })
                        .sort(sortOptions)
                        .skip(offset)
                        .limit(limit)
                        .lean();
                } catch (error) {
                    // Nếu không có text index, fallback về regex
                    console.log('Text index not found, using regex search');
                    query = {
                        isApproved: true,
                        title: {
                            $regex: search,
                            $options: 'i',
                        },
                    };

                    results = await Recipe.find(query)
                        .sort({ createdAt: -1 })
                        .skip(offset)
                        .limit(limit)
                        .lean();
                }
            } else {
                results = await Recipe.find(query)
                    .sort(sortOptions)
                    .skip(offset)
                    .limit(limit)
                    .lean();
            }

            return transformId(results);
        },

        recipesByIngredients: async (_, { ingredients }) => {
            const results = await Recipe.find({
                'ingredients.name': { $in: ingredients },
                isApproved: true,
            });

            return transformId(results);
        },

        favoriteRecipes: async (_, __, { user }) => {
            if (!user) {
                throw new AuthenticationError(
                    'You must be logged in to view your favorite recipes.'
                );
            }

            const userDoc = await User.findById(user.id);
            const results = await Recipe.find({ _id: { $in: userDoc.favoriteRecipes } });

            return transformId(results);
        },

        userRecipes: async (_, __, { user }) => {
            if (!user) {
                throw new AuthenticationError('You must be logged in to view your recipes.');
            }

            const results = await Recipe.find({ author: user.id });

            return transformId(results);
        },

        pendingRecipes: async (_, __, { user }) => {
            if (!user || user.role !== 'admin') {
                throw new AuthenticationError('You must be an admin to view pending recipes.');
            }

            const results = await Recipe.find({ isApproved: false });

            return transformId(results);
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

            await Promise.all([
                Comment.deleteMany({ recipe: id }),
                User.updateMany({ favoriteRecipes: id }, { $pull: { favoriteRecipes: id } }),
                Recipe.findByIdAndDelete(id),
            ]);

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
