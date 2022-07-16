import { Driver } from "neo4j-driver";
import { OGM } from "@mathix420/graphql-ogm";

export type Context = {
    ogm: OGM;
    adminOverride?: boolean;
    driver: Driver;
};
