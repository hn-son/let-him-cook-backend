const { gql } = require('apollo-server-express');

const typeDefs = gql`
    type User {
        id: ID!
        username: String!
        email: String!
        role: String!
        favoriteRecipes: [Recipe!]!
        createdAt: String!
    }

    type Ingredient {
        name: String!
        quantity: String!
        unit: String!
    }

    type Recipe {
        id: ID!
        title: String!
        description: String!
        ingredients: [Ingredient!]!
        steps: [String!]!
        cookingTime: Int!
        difficulty: String!
        imageUrl: String!
        author: User!
        createdAt: String!
        comments: [Comment!]!
        isApproved: Boolean!
        updatedAt: String!
    }

    type Comment {
        id: ID!
        content: String!
        author: User!
        createdAt: String!
        recipe: Recipe!
    }

    type AuthPayload {
        token: String!
        user: User!
    }

    input RegisterInput {
        username: String!
        email: String!
        password: String!
    }

    input LoginInput {
        email: String!
        password: String!
    }

    input IngredientInput {
        name: String!
        quantity: String!
        unit: String!
    }

    input RecipeInput {
        title: String!
        description: String!
        ingredients: [IngredientInput!]!
        steps: [String]
        cookingTime: Int!
        difficulty: String!
        imageUrl: String
    }

    input RecipeUpdateInput {
        title: String
        description: String
        ingredients: [IngredientInput!]
        steps: [String]
        cookingTime: Int
        difficulty: String
        imageUrl: String
    }

    type AuthCheckResponse {
        isAuthenticated: Boolean!
        message: String!
        user: User
    }

    type Query {
        me: User
        user(id: ID!): User

        recipe(id: ID!): Recipe
        recipes(limit: Int, offset: Int): [Recipe!]!
        recipesByIngredients(ingredient: String!): [Recipe!]!
        favoriteRecipes: [Recipe!]!
        userRecipes: [Recipe!]!
        pendingRecipes: [Recipe!]!

        recipeComments(recipeId: ID!): [Comment!]!

        checkAuth: AuthCheckResponse!

        users(limit: Int, offset: Int): [User!]!
    }

    type Mutation {
        register(input: RegisterInput!): AuthPayload!
        login(input: LoginInput!): AuthPayload!

        createRecipe(input: RecipeInput!): Recipe!
        updateRecipe(id: ID!, input: RecipeUpdateInput!): Recipe!
        deleteRecipe(id: ID!): Boolean!
        approveRecipe(id: ID!): Recipe!

        addToFavorites(recipeId: ID!): Recipe!
        removeFromFavorites(recipeId: ID!): Recipe!

        addComment(recipeId: ID!, content: String!): Comment!
        updateComment(id: ID!, content: String!): Comment!
        deleteComment(id: ID!): Boolean!
    }
`;

module.exports = typeDefs;
