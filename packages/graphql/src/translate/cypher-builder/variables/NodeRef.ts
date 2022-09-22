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

import { MatchPatternOptions, Pattern } from "../Pattern";
import { RelationshipRef } from "./RelationshipRef";
import { Variable } from "./Variable";

type NodeRefOptions = {
    labels?: string[];
};

/** Represents a Node reference */
export class NodeRef extends Variable {
    public labels: string[];

    constructor(options: NodeRefOptions) {
        super("this");
        this.labels = options.labels || [];
    }

    public relatedTo(node: NodeRef): RelationshipRef {
        return new RelationshipRef({
            source: this,
            target: node,
        });
    }

    /** Creates a new Pattern from this node */
    public pattern(options: Pick<MatchPatternOptions, "source"> = {}): Pattern<NodeRef> {
        return new Pattern(this, options);
    }
}

export class NamedNode extends NodeRef {
    constructor(id: string, options?: NodeRefOptions) {
        super(options || {});
        this.id = id;
    }
}
