/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 *
 * This file is part of Neo4j.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { Neo4jGraphQLAuthJWTPlugin } from "@neo4j/graphql-plugin-auth";
import { gql } from "apollo-server";
import type { DocumentNode } from "graphql";
import { Neo4jGraphQL } from "../../../../../src";
import { createJwtRequest } from "../../../../utils/create-jwt-request";
import { formatCypher, translateQuery, formatParams } from "../../../utils/tck-test-utils";

describe("Cypher -> Connections -> Filtering -> Relationship -> Arrays", () => {
    const secret = "secret";
    let typeDefs: DocumentNode;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = gql`
            type Movie {
                title: String!
                actors: [Actor!]! @relationship(type: "ACTED_IN", properties: "ActedIn", direction: IN)
            }

            type Actor {
                name: String!
                movies: [Movie!]! @relationship(type: "ACTED_IN", properties: "ActedIn", direction: OUT)
            }

            interface ActedIn {
                screenTime: Int!
                quotes: [String!]
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
            config: { enableRegex: true },
            plugins: {
                auth: new Neo4jGraphQLAuthJWTPlugin({
                    secret,
                }),
            },
        });
    });

    test("IN", async () => {
        const query = gql`
            query {
                movies {
                    title
                    actorsConnection(where: { edge: { screenTime_IN: [60, 70] } }) {
                        edges {
                            screenTime
                            node {
                                name
                            }
                        }
                    }
                }
            }
        `;

        const req = createJwtRequest("secret", {});
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:\`Movie\`)
            CALL {
            WITH this
            MATCH (this)<-[this_acted_in_relationship:ACTED_IN]-(this_actor:Actor)
            WHERE this_acted_in_relationship.screenTime IN $this_actorsConnection_args_where_Actorparam0
            WITH collect({ screenTime: this_acted_in_relationship.screenTime, node: { name: this_actor.name } }) AS edges
            UNWIND edges as edge
            WITH collect(edge) AS edges, size(collect(edge)) AS totalCount
            RETURN { edges: edges, totalCount: totalCount } AS actorsConnection
            }
            RETURN this { .title, actorsConnection } as this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_actorsConnection_args_where_Actorparam0\\": [
                    {
                        \\"low\\": 60,
                        \\"high\\": 0
                    },
                    {
                        \\"low\\": 70,
                        \\"high\\": 0
                    }
                ],
                \\"this_actorsConnection\\": {
                    \\"args\\": {
                        \\"where\\": {
                            \\"edge\\": {
                                \\"screenTime_IN\\": [
                                    {
                                        \\"low\\": 60,
                                        \\"high\\": 0
                                    },
                                    {
                                        \\"low\\": 70,
                                        \\"high\\": 0
                                    }
                                ]
                            }
                        }
                    }
                }
            }"
        `);
    });

    test("NOT_IN", async () => {
        const query = gql`
            query {
                movies {
                    title
                    actorsConnection(where: { edge: { screenTime_NOT_IN: [60, 70] } }) {
                        edges {
                            screenTime
                            node {
                                name
                            }
                        }
                    }
                }
            }
        `;

        const req = createJwtRequest("secret", {});
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:\`Movie\`)
            CALL {
            WITH this
            MATCH (this)<-[this_acted_in_relationship:ACTED_IN]-(this_actor:Actor)
            WHERE NOT (this_acted_in_relationship.screenTime IN $this_actorsConnection_args_where_Actorparam0)
            WITH collect({ screenTime: this_acted_in_relationship.screenTime, node: { name: this_actor.name } }) AS edges
            UNWIND edges as edge
            WITH collect(edge) AS edges, size(collect(edge)) AS totalCount
            RETURN { edges: edges, totalCount: totalCount } AS actorsConnection
            }
            RETURN this { .title, actorsConnection } as this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_actorsConnection_args_where_Actorparam0\\": [
                    {
                        \\"low\\": 60,
                        \\"high\\": 0
                    },
                    {
                        \\"low\\": 70,
                        \\"high\\": 0
                    }
                ],
                \\"this_actorsConnection\\": {
                    \\"args\\": {
                        \\"where\\": {
                            \\"edge\\": {
                                \\"screenTime_NOT_IN\\": [
                                    {
                                        \\"low\\": 60,
                                        \\"high\\": 0
                                    },
                                    {
                                        \\"low\\": 70,
                                        \\"high\\": 0
                                    }
                                ]
                            }
                        }
                    }
                }
            }"
        `);
    });

    test("INCLUDES", async () => {
        const query = gql`
            query {
                movies {
                    title
                    actorsConnection(where: { edge: { quotes_INCLUDES: "Life is like a box of chocolates" } }) {
                        edges {
                            screenTime
                            node {
                                name
                            }
                        }
                    }
                }
            }
        `;

        const req = createJwtRequest("secret", {});
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:\`Movie\`)
            CALL {
            WITH this
            MATCH (this)<-[this_acted_in_relationship:ACTED_IN]-(this_actor:Actor)
            WHERE $this_actorsConnection_args_where_Actorparam0 IN this_acted_in_relationship.quotes
            WITH collect({ screenTime: this_acted_in_relationship.screenTime, node: { name: this_actor.name } }) AS edges
            UNWIND edges as edge
            WITH collect(edge) AS edges, size(collect(edge)) AS totalCount
            RETURN { edges: edges, totalCount: totalCount } AS actorsConnection
            }
            RETURN this { .title, actorsConnection } as this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_actorsConnection_args_where_Actorparam0\\": \\"Life is like a box of chocolates\\",
                \\"this_actorsConnection\\": {
                    \\"args\\": {
                        \\"where\\": {
                            \\"edge\\": {
                                \\"quotes_INCLUDES\\": \\"Life is like a box of chocolates\\"
                            }
                        }
                    }
                }
            }"
        `);
    });

    test("NOT_INCLUDES", async () => {
        const query = gql`
            query {
                movies {
                    title
                    actorsConnection(where: { edge: { quotes_NOT_INCLUDES: "Life is like a box of chocolates" } }) {
                        edges {
                            screenTime
                            node {
                                name
                            }
                        }
                    }
                }
            }
        `;

        const req = createJwtRequest("secret", {});
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:\`Movie\`)
            CALL {
            WITH this
            MATCH (this)<-[this_acted_in_relationship:ACTED_IN]-(this_actor:Actor)
            WHERE NOT ($this_actorsConnection_args_where_Actorparam0 IN this_acted_in_relationship.quotes)
            WITH collect({ screenTime: this_acted_in_relationship.screenTime, node: { name: this_actor.name } }) AS edges
            UNWIND edges as edge
            WITH collect(edge) AS edges, size(collect(edge)) AS totalCount
            RETURN { edges: edges, totalCount: totalCount } AS actorsConnection
            }
            RETURN this { .title, actorsConnection } as this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_actorsConnection_args_where_Actorparam0\\": \\"Life is like a box of chocolates\\",
                \\"this_actorsConnection\\": {
                    \\"args\\": {
                        \\"where\\": {
                            \\"edge\\": {
                                \\"quotes_NOT_INCLUDES\\": \\"Life is like a box of chocolates\\"
                            }
                        }
                    }
                }
            }"
        `);
    });
});