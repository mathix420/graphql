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

import type { GraphQLWhereArg, Context, PredicateReturn, OuterRelationshipData } from "../../types";
import type { GraphElement } from "../../classes";
import Cypher from "@neo4j/cypher-builder";
// Recursive function
import { createPropertyWhere } from "./property-operations/create-property-where";
import { getCypherLogicalOperator, isLogicalOperator, LogicalOperator } from "../utils/logical-operators";
import { asArray } from "../../utils/utils";

/** Translate a target node and GraphQL input into a Cypher operation o valid where expression */
export function createWherePredicate({
    targetElement,
    whereInput,
    context,
    element,
    outerRelationshipData,
}: {
    targetElement: Cypher.Variable;
    whereInput: GraphQLWhereArg;
    context: Context;
    element: GraphElement;
    outerRelationshipData: OuterRelationshipData;
}): PredicateReturn {
    const whereFields = Object.entries(whereInput);
    const predicates: Cypher.Predicate[] = [];
    let subqueries: Cypher.CompositeClause | undefined;
    whereFields.forEach(([key, value]) => {
        if (isLogicalOperator(key)) {
            const { predicate, preComputedSubqueries } = createNestedPredicate({
                key: key as LogicalOperator,
                element,
                targetElement,
                context,
                value: asArray(value),
                outerRelationshipData,
            });
            if (predicate) {
                predicates.push(predicate);
                if (preComputedSubqueries && !preComputedSubqueries.empty)
                    subqueries = Cypher.concat(subqueries, preComputedSubqueries);
            }
            return;
        }
        const { predicate, preComputedSubqueries } = createPropertyWhere({
            key,
            value,
            element,
            targetElement,
            context,
            outerRelationshipData,
        });
        if (predicate) {
            predicates.push(predicate);
            if (preComputedSubqueries && !preComputedSubqueries.empty)
                subqueries = Cypher.concat(subqueries, preComputedSubqueries);
            return;
        }
    });
    // Implicit AND
    return {
        predicate: Cypher.and(...predicates),
        preComputedSubqueries: subqueries,
    };
}

function createNestedPredicate({
    key,
    element,
    targetElement,
    context,
    value,
    outerRelationshipData,
}: {
    key: LogicalOperator;
    element: GraphElement;
    targetElement: Cypher.Variable;
    context: Context;
    value: Array<GraphQLWhereArg>;
    outerRelationshipData: OuterRelationshipData;
}): PredicateReturn {
    const nested: Cypher.Predicate[] = [];
    let subqueries: Cypher.CompositeClause | undefined;

    value.forEach((v) => {
        const { predicate, preComputedSubqueries } = createWherePredicate({
            whereInput: v,
            element,
            targetElement,
            context,
            outerRelationshipData,
        });
        if (predicate) {
            nested.push(predicate);
        }
        if (preComputedSubqueries && !preComputedSubqueries.empty)
            subqueries = Cypher.concat(subqueries, preComputedSubqueries);
    });
    const logicalOperator = getCypherLogicalOperator(key);
    return { predicate: logicalOperator(...nested), preComputedSubqueries: subqueries };
}
