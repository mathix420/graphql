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

import { graphql, GraphQLSchema } from "graphql";
import { Driver, Session, Integer } from "neo4j-driver";
import { gql } from "apollo-server";
import neo4j from "../neo4j";
import { getQuerySource } from "../../utils/get-query-source";
import { Neo4jGraphQL } from "../../../src";

describe("https://github.com/neo4j/graphql/issues/923", () => {
    // TODO: convert to use generateUniqueType()
    const testBlogpost = {
        name: "BlogPost923",
    };
    const testCategory = {
        name: "Category923",
        operations: { create: "createCategory923s" },
    };

    let schema: GraphQLSchema;
    let driver: Driver;
    let session: Session;

    beforeAll(async () => {
        driver = await neo4j();

        const typeDefs = gql`
            type ${testBlogpost.name} @fulltext(indexes: [{ name: "BlogTitle", fields: ["title"] }]) {
                title: String!
                slug: String! @unique
            }
            type ${testCategory.name} {
                name: String! @unique
                blogs: [${testBlogpost.name}!]! @relationship(type: "IN_CATEGORY", direction: IN)
            }
            extend type ${testBlogpost.name}
                @auth(
                    rules: [
                        { operations: [UPDATE], allow: { author: { id: "$jwt.sub" } } }
                        { operations: [UPDATE], bind: { author: "$jwt.sub" } }
                        { operations: [CREATE, UPDATE, CONNECT, DISCONNECT, DELETE], isAuthenticated: true }
                    ]
                )
            extend type ${testCategory.name}
                @auth(rules: [{ operations: [CREATE, UPDATE, DELETE, DISCONNECT, CONNECT], isAuthenticated: true }])
        `;
        const neoGraphql = new Neo4jGraphQL({ typeDefs, driver });
        schema = neoGraphql.schema;
    });

    beforeEach(() => {
        session = driver.session();
    });

    afterEach(async () => {
        await session.run(`MATCH (b:${testBlogpost.name}) DETACH DELETE b`);
        await session.run(`MATCH (c:${testCategory.name}) DETACH DELETE c`);

        await session.close();
    });

    afterAll(async () => {
        await driver.close();
    });

    test("should query nested connection", async () => {
        const query = gql`
            mutation {
                ${testCategory.operations.create}(
                    input: [
                        {
                            blogs: {
                                connectOrCreate: [
                                    {
                                        where: { node: { slug: "dsa" } }
                                        onCreate: { node: { title: "mytitle", slug: "myslug" } }
                                    }
                                ]
                            }
                            name: "myname"
                        }
                    ]
                ) {
                    info {
                        nodesCreated
                    }
                }
            }
        `;

        const result = await graphql({
            schema,
            source: getQuerySource(query),
            contextValue: {
                driver,
                jwt: {
                    sub: "test",
                },
            },
        });
        expect(result.errors).toBeUndefined();

        const blogPostCount = await session.run(`
          MATCH (m:${testBlogpost.name} { slug: "myslug" })
          RETURN COUNT(m) as count
        `);
        expect((blogPostCount.records[0].toObject().count as Integer).toNumber()).toBe(1);
    });
});
