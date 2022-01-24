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

import { Context, RelationField } from "../../types";
import { Node } from "../../classes";
import { CypherStatement } from "../types";
import { buildNodeStatement } from "./build-node-statement";
import { serializeParameters, padLeft } from "./utils";
import { joinStatements } from "./join-statements";

type NodeOptions =
    | {
          varName: string;
          node?: Node;
          parameters?: Record<string, any>;
      }
    | {
          varName?: string;
          node: Node;
          parameters?: Record<string, any>;
      };

type TargetRelation = {
    varName?: string;
    relationField: RelationField;
    parameters?: Record<string, any>;
};

export function buildRelationshipStatement({
    sourceNode,
    targetNode,
    context,
    relationship,
    directed = true,
}: {
    sourceNode: NodeOptions;
    targetNode: NodeOptions;
    relationship: TargetRelation;
    context: Context;
    directed?: boolean;
}): CypherStatement {
    const relationshipStatement = getRelationshipSubStatement(relationship, directed);

    const sourceNodeStatement = buildNodeStatement({
        context,
        ...sourceNode,
    });

    const targetNodeStatement = buildNodeStatement({
        context,
        ...targetNode,
    });

    return joinStatements([sourceNodeStatement, relationshipStatement, targetNodeStatement], "");
}

function getRelationshipSubStatement(
    { relationField, varName = "", parameters }: TargetRelation,
    directed: boolean
): CypherStatement {
    let leftConnection = relationField.direction === "IN" ? "<-" : "-";
    let rightConnection = relationField.direction === "OUT" ? "->" : "-";
    if (directed === false) {
        leftConnection = "-";
        rightConnection = "-";
    }

    const relationshipLabel = relationField.type ? `:${relationField.type}` : "";

    const [relParamsQuery, relParams] = serializeRelationParameters(varName, parameters);

    const relTypeStr = `[${varName || ""}${relationshipLabel}${padLeft(relParamsQuery)}]`;

    return [`${leftConnection}${relTypeStr}${rightConnection}`, relParams];
}

function serializeRelationParameters(varName: string, parameters: Record<string, any> | undefined): CypherStatement {
    return serializeParameters(`${varName}_relationship`, parameters);
}