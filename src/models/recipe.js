const mongoose = require('mongoose');

const RecipeSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true,
    },
    description: {
        type: String,
        required: true,
    },
    ingredients: [
        {
            name: {
                type: String,
                required: true,
            },
            quantity: {
                type: String,
                required: true,
            },
            unit: {
                type: String,
                required: true,
            },
        },
    ],
    steps: [
        {
            type: String,
            // required: true,
        },
    ],
    cookingTime: {
        type: Number,
        // required: true,
    },
    difficulty: {
        type: String,
        enum: ['easy', 'medium', 'hard'],
        default: 'medium',
    },
    imageUrl: {
        type: String,
    },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    isApproved: {
        type: Boolean,
        default: false,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    },
});

RecipeSchema.index({ isApproved: 1, createdAt: -1 });
RecipeSchema.index({ isApproved: 1, title: 1 });

RecipeSchema.index({ 'ingredients.name': 'text', title: 'text' });

module.exports = mongoose.model('Recipe', RecipeSchema);
