// const { buildClientSchema, printSchema } = require("graphql");
const fs = require("fs");

const {jsonToSchema}  = require("@walmartlabs/json-to-simple-graphql-schema/lib");

const typeRegexp = new RegExp("type [^ ]*", "g");
const typeEntityRegexp = new RegExp("type [^}]*}", "gm");
// const entityRegexp = new RegExp("{[^}]*}", "gm");
const nameRegexp = new RegExp(" [\\w]* ", "g")
const wRegexp = new RegExp("[^\\s:{}\\[\\]]*", "gm")
const enumRegexp = new RegExp("enum [^}]*}", "gm")

let counter = 0;

export default function generateSchemaFromJson(json){
    // const file = fs.readFileSync("example.json");
    const schema = jsonToSchema({ jsonInput: json });
    const newSchemaString = format(schema.value);
    const oldSchema = fs.readFileSync("../schema.graphql").toString();
    fs.writeFileSync(`../new-${counter}.schema.graphql`, mergeSchema(oldSchema, newSchemaString))
    counter++;
}

function format(schema) {
    return createID(typeToEntity(schema))
}

function typeToEntity(schema) {
    let typeMatches = [...schema.matchAll(typeRegexp)];
    for (let i=0; i<typeMatches.length; i++) {
        const match = typeMatches[i][0];
        schema = schema.replace(match, `${match} @entity`);
    }
    return schema;
}

function createID(schema) {
    let newSchema = "";
    for (let i=0; i<schema.length; i++) {
        const ch = schema[i];
        newSchema += ch;
        if (ch === "{") {
            newSchema += "\n  id: ID!"
        }
    }
    return newSchema;
}

function mergeSchema(oldSchema, newSchema){
    let schema = new Map();
    schema["enum"] = new Map();
    schema["entity"] = new Map();

    mapSchemaKeys(schema, createSchemaMap(oldSchema, typeEntityRegexp))
    mapSchemaKeys(schema, createSchemaMap(newSchema, typeEntityRegexp))

    return buildSchemaFromMap(schema);
}

function mapSchemaKeys(schema, map) {
    let keys = Object.keys(map)
    for (let key of keys) {
        let value = map[key];
        if (typeof value === "string") {
            let enumMap = schema["enum"];
            if (enumMap[key]) {
                console.log("should check and overwrite here")
            } else {
                enumMap[key] = value
            }
            schema["enum"]=enumMap;
        } else {
            let entityMap = schema["entity"]
            let oldEntity = entityMap[key];
            if (oldEntity) {
                if (oldEntity === value) {
                    continue
                }
                entityMap[key] = checkEntityForChanges(oldEntity, value)
            } else {
                entityMap[key] = value;
            }
            schema["entity"] = entityMap;
        }
    }
    
}

function buildSchemaFromMap(schema) {
    let output = "";

    let enums = Object.keys(schema["enum"])
    for (let e of enums) {
        let value = schema["enum"][e];
        output += `enum ${e} ${value}\n\n`
    }

    let entities = Object.keys(schema["entity"])
    for (let e of entities) {
        let value = schema["entity"][e];
        let valueStr = "";
        for (let f of Object.keys(value)) {
            valueStr += `  ${f}: ${value[f]}\n`
        }
        output += `type ${e} @entity {\n${valueStr}}\n\n`
    }

    return output
}

function checkEntityForChanges(oldEntity, newEntity){
    let oldKeys = Object.keys(oldEntity)
    let newKeys = Object.keys(newEntity)
    for (let key of oldKeys) {
        if (newKeys.includes(key)){
            let oldValue = oldEntity[key];
            let newValue = newEntity[key];
            if (oldValue !== newValue && oldValue === "String") {
                oldKeys[key] = newValue;
            }
            delete newEntity.key
            newKeys = Object.keys(newEntity)
        }
    }
    if (newKeys) {
        for (let key of newKeys) {
            let value = newEntity[key];
            oldKeys[key] = value;
        }
    }
    return oldKeys
}

function createSchemaMap(schema, regexp){
    let map = new Map();
    mapSchema(schema, map, [...schema.matchAll(typeEntityRegexp)])
    mapSchema(schema, map, [...schema.matchAll(enumRegexp)])
    return map;
}

function mapSchema(schema, map, matches) {
    for (let i=0; i<matches.length; i++) {
        const match = matches[i][0];
        let typeNameMatch = match.match(nameRegexp);
        let typeName = typeNameMatch[0];
        typeName = typeName.slice(1, typeName.length - 1);
        map[typeName] = createEntityMap(match)
    }
}

function createEntityMap(entity) {
    let map = new Map()
    let count = 0;
    let matches = [...entity.matchAll(wRegexp)];
    let key = "";
    for (let i=0; i<matches.length; i++) {
        const match = matches[i][0];
        if (match) {
            if (count>2){
                if(count%2===0){
                    map[key] = match;
                } else {
                    key = match;
                }
            }
            count++
        }
    }
    return map;
}
