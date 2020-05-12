// PubSub for subscription types
const { ApolloServer, PubSub } = require('apollo-server');
const mongoose = require('mongoose');

const typeDefs = require('./graphql/typeDefs');
const resolvers = require('./graphql/resolvers'); // /index');
const { MONGODB } = require('./config.js'); // database connection

const pubsub = new PubSub();

// port Number
const PORT = process.env.port || 5000;

// server instance
const server = new ApolloServer({
  typeDefs,
  resolvers,
  // this is how authentication runs on ApolloServer for each apollo requests ;
  // this is how to use the context in posts.js "context" parameter
  context: ({ req }) => ({ req, pubsub }),
});

// connect to DB
mongoose
  .connect(MONGODB, { useNewUrlParser: true })
  .then(() => {
    console.log('MongoDB Connected!');
    return server.listen({ port: PORT });
  })
  .then((res) => {
    console.log(`Server running at ${res.url}`);
  })
  .catch((err) => {
    console.error(err);
  });
