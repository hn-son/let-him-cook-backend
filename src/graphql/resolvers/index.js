const userResolvers = require('./userResolver');
const recipeResolvers = require('./recipeResolver');
const commentResolvers = require('./commentResolver');

module.exports = {
    Query: {
        ...userResolvers.Query,
        ...recipeResolvers.Query,
        ...commentResolvers.Query,
    },

    Mutation: {
        ...userResolvers.Mutation,
        ...recipeResolvers.Mutation,
        ...commentResolvers.Mutation,
    },

    User: {
        ...userResolvers.User,
    },

    Recipe: {
        ...recipeResolvers.Recipe,
    },

    Comment: {
        ...commentResolvers.Comment,
    },
};
