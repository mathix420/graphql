const { ApolloServer } = require("apollo-server");
const { Neo4jGraphQL } = require("@mathix420/graphql");

const driver = require("./driver");
const typeDefs = require("./type-definitions");

const neo4jGraphQL = new Neo4jGraphQL({ typeDefs, driver });

const server = new ApolloServer({ schema: neo4jGraphQL.schema });

server.listen().then(({ url }) => {
    console.log(`@mathix420/graphql API ready at ${url}`);
});
