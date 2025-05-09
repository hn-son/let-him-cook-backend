const express = require('express');
const { ApolloServer } = require('apollo-server-express');
const mongoose = require('mongoose');
const typeDefs = require('./graphql/typeDefs');
const resolvers = require('./graphql/resolvers');
const { connectDB } = require('./configs/mongodb');
const authMiddleware = require('./middleware/auth');
const { env } = require('./configs/environment');

async function startServer() {
    const app = express();

    await connectDB();

    const server = new ApolloServer({
        typeDefs,
        resolvers,
        context: ({ req }) => {
            const user = authMiddleware(req);
            return { user };
        },
        formatError: error => {
            console.error('GraphQL error: ', error);

            return {
                message: error.message,
                path: error.path,
                extensions: error.extensions,
            };
        },
    });

    await server.start();

    server.applyMiddleware({ app });

    const PORT = env.APP_PORT || 4000;
    app.listen(PORT, () => {
        console.log(`Server is running on port http://localhost:${PORT}${server.graphqlPath}`);
    });
}

startServer().catch(error => {
    console.error('Error starting server: ', error);
});
